import { Student, Teacher, Announcement, GroupLevel, SessionMetadata, SemesterSettings, TermInfo, AttendanceRecord } from './types';
import { INITIAL_STUDENTS, INITIAL_TEACHERS } from './students-data';
import { getCertificateConfig, saveCertificateConfig } from './certificate-config';

const STORAGE_KEY_STUDENTS = 'halaqah_active_students_v5';
const STORAGE_KEY_TEACHERS = 'halaqah_active_teachers_v4';
const STORAGE_KEY_FACULTY_PASS = 'halaqah_faculty_password_v1';
const STORAGE_KEY_ANNOUNCEMENTS = 'halaqah_announcements_v1';
const STORAGE_KEY_MAJORS = 'halaqah_active_majors_v2';
const STORAGE_KEY_SESSIONS = 'halaqah_sessions_metadata_v1';
const STORAGE_KEY_SEMESTER = 'halaqah_semester_settings_v1';
const STORAGE_KEY_ATTENDANCE = 'halaqah_attendance_records_v1';

function getLocalAttendance(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ATTENDANCE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalAttendance(records: any[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(records));
  } catch {}
}


// รหัสสาขาวิชาจากรหัสนักศึกษาคณะศึกษาศาสตร์ มหาวิทยาลัยฟาฏอนี (หลักที่ 4-6 เช่น 681441001 -> 441)
// สำหรับชั้นปีทั่วไป (ปี 1, 2, 3)
export const DEFAULT_MAJOR_MAP_STANDARD: Record<string, string> = {
  '441': 'อิสลามศึกษา',
  '442': 'ภาษาอาหรับ',
  '443': 'วิทยาศาสตร์ทั่วไป',
  '444': 'เคมี',
  '445': 'ภาษาอังกฤษ',
  '446': 'ภาษามลายูและเทคโนโลยีการศึกษา',
  '447': 'การศึกษาปฐมวัย',
};

// สำหรับชั้นปีที่ 4 (หลักสูตรการสอน)
export const DEFAULT_MAJOR_MAP_YEAR4: Record<string, string> = {
  '441': 'การสอนอิสลามศึกษา',
  '442': 'การสอนภาษาอาหรับ',
  '443': 'การสอนวิทยาศาสตร์ทั่วไป',
  '444': 'การสอนเคมี',
  '445': 'การสอนภาษาอังกฤษ',
  '446': 'การสอนภาษามลายูและเทคโนโลยีการศึกษา',
  '447': 'การศึกษาปฐมวัย',
};

export const DEFAULT_MAJOR_MAP: Record<string, string> = DEFAULT_MAJOR_MAP_STANDARD;

export const DEFAULT_MAJORS: string[] = [
  'อิสลามศึกษา',
  'การสอนอิสลามศึกษา',
  'ภาษาอาหรับ',
  'การสอนภาษาอาหรับ',
  'วิทยาศาสตร์ทั่วไป',
  'การสอนวิทยาศาสตร์ทั่วไป',
  'เคมี',
  'การสอนเคมี',
  'ภาษาอังกฤษ',
  'การสอนภาษาอังกฤษ',
  'ภาษามลายูและเทคโนโลยีการศึกษา',
  'การสอนภาษามลายูและเทคโนโลยีการศึกษา',
  'การศึกษาปฐมวัย',
];

/**
 * ดึงสาขาวิชาจากรหัสนักศึกษา 9 หลักและชั้นปีโดยอัตโนมัติ
 * - 441: อิสลามศึกษา (ปี 4: การสอนอิสลามศึกษา)
 * - 442: ภาษาอาหรับ (ปี 4: การสอนภาษาอาหรับ)
 * - 443: วิทยาศาสตร์ทั่วไป (ปี 4: การสอนวิทยาศาสตร์ทั่วไป)
 * - 444: เคมี (ปี 4: การสอนเคมี)
 * - 445: ภาษาอังกฤษ (ปี 4: การสอนภาษาอังกฤษ)
 * - 446: ภาษามลายูและเทคโนโลยีการศึกษา (ปี 4: การสอนภาษามลายูและเทคโนโลยีการศึกษา)
 * - 447: การศึกษาปฐมวัย
 */
export function inferMajorFromStudentId(studentId: string, yearLevel?: string): string {
  if (!studentId) return 'ไม่ระบุสาขา';
  const clean = studentId.replace(/\D/g, '');
  if (clean.length >= 6) {
    const code = clean.slice(3, 6);
    const isYear4 = (yearLevel && (yearLevel.includes('4') || yearLevel.includes('ปี 4'))) || clean.startsWith('66');
    if (isYear4 && DEFAULT_MAJOR_MAP_YEAR4[code]) {
      return DEFAULT_MAJOR_MAP_YEAR4[code];
    }
    if (DEFAULT_MAJOR_MAP_STANDARD[code]) {
      return DEFAULT_MAJOR_MAP_STANDARD[code];
    }
  }
  return 'ไม่ระบุสาขา';
}

/**
 * ดึงสาขาวิชาของนักศึกษา โดยตรวจสอบความสอดคล้องกับรหัสและชั้นปี
 */
export function getStudentMajor(student?: Partial<Student> | null): string {
  return applyMajorRename(resolveStudentMajor(student));
}

function resolveStudentMajor(student?: Partial<Student> | null): string {
  if (!student) return 'ไม่ระบุสาขา';
  if (student.studentId) {
    const inferred = inferMajorFromStudentId(student.studentId, student.yearLevel);
    if (student.major && student.major.trim()) {
      const explicit = student.major.trim();
      // หากไม่ใช่ค่าเก่าที่เคยเดาผิด ให้ใช้ค่าที่บันทึกไว้
      const isLegacyGuess = explicit === 'ภาษามลายู' || explicit === 'การสอนวิทยาศาสตร์';
      if (!isLegacyGuess) {
        return explicit;
      }
    }
    if (inferred !== 'ไม่ระบุสาขา') return inferred;
  }
  if (student.major && student.major.trim()) {
    return student.major.trim();
  }
  return 'ทั่วไป/ไม่ระบุสาขา';
}

/**
 * ดึงรายการสาขาวิชาทั้งหมดในระบบ (รวมค่าเริ่มต้นและสาขาใหม่ที่แอดมินเพิ่มในอนาคต)
 */
export function getActiveMajors(): string[] {
  if (typeof window === 'undefined') return DEFAULT_MAJORS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MAJORS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_MAJORS, JSON.stringify(DEFAULT_MAJORS));
      return DEFAULT_MAJORS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const merged = Array.from(new Set(parsed.map((s: string) => String(s).trim()))).filter(Boolean) as string[];
      return merged;
    }
    return DEFAULT_MAJORS;
  } catch {
    return DEFAULT_MAJORS;
  }
}

/**
 * บันทึกรายการสาขาวิชา
 */
export function saveActiveMajors(majors: string[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_MAJORS, JSON.stringify(majors));
}

/**
 * เพิ่มสาขาวิชาใหม่เข้าสู่ระบบ สำหรับขยายเพิ่มในอนาคต
 */
export function addNewMajor(majorName: string): { success: boolean; message: string; majors: string[] } {
  const clean = majorName.trim();
  if (!clean) {
    return { success: false, message: 'กรุณาระบุชื่อสาขาวิชา', majors: getActiveMajors() };
  }
  const current = getActiveMajors();
  if (current.some((m) => m.toLowerCase() === clean.toLowerCase())) {
    return { success: false, message: `สาขาวิชา "${clean}" มีอยู่ในระบบแล้ว`, majors: current };
  }
  const updated = [...current, clean];
  saveActiveMajors(updated);
  return { success: true, message: `เพิ่มสาขาวิชา "${clean}" เรียบร้อยแล้ว`, majors: updated };
}

/**
 * ลบสาขาวิชาที่สร้างขึ้นเอง (ไม่ลบค่าเริ่มต้นของระบบ)
 */
export function deleteCustomMajor(majorName: string): { success: boolean; message: string; majors: string[] } {
  const clean = majorName.trim();
  const inUse = getActiveStudents().filter((s) => getStudentMajor(s) === clean).length;
  if (inUse > 0) {
    return {
      success: false,
      message: `ยังมีนักศึกษา ${inUse} คนอยู่ในสาขา "${clean}" กรุณาเปลี่ยนชื่อสาขาหรือย้ายนักศึกษาก่อน`,
      majors: getActiveMajors(),
    };
  }
  const current = getActiveMajors();
  const updated = current.filter((m) => m !== clean);
  saveActiveMajors(updated);
  return { success: true, message: `ลบสาขาวิชา "${clean}" เรียบร้อยแล้ว`, majors: updated };
}

const hydrateStudentWithMajor = (s: Student): Student => ({
  ...s,
  major: getStudentMajor(s),
  level: (s.level as GroupLevel) || '01',
});

const hydrateTeacher = (t: Teacher): Teacher => ({
  ...t,
  level: (t.level as GroupLevel) || '01',
});

export function getActiveStudents(): Student[] {
  if (typeof window === 'undefined') return INITIAL_STUDENTS.map(hydrateStudentWithMajor);
  try {
    let raw = localStorage.getItem(STORAGE_KEY_STUDENTS);
    if (!raw) {
      // Migrate from previous key v4 or v3 if available
      const prevRaw = localStorage.getItem('halaqah_active_students_v4') || localStorage.getItem('halaqah_active_students_v3');
      if (prevRaw) {
        try {
          const prevList = JSON.parse(prevRaw);
          if (Array.isArray(prevList)) {
            const remapped = prevList.map(hydrateStudentWithMajor);
            localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(remapped));
            return remapped;
          }
        } catch {
          // fallback
        }
      }
      const initHydrated = INITIAL_STUDENTS.map(hydrateStudentWithMajor);
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(initHydrated));
      return initHydrated;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const initHydrated = INITIAL_STUDENTS.map(hydrateStudentWithMajor);
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(initHydrated));
      return initHydrated;
    }
    return parsed.map(hydrateStudentWithMajor);
  } catch {
    return INITIAL_STUDENTS.map(hydrateStudentWithMajor);
  }
}

export function saveActiveStudents(students: Student[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
}

export function getActiveTeachers(): Teacher[] {
  if (typeof window === 'undefined') return INITIAL_TEACHERS.map(hydrateTeacher);
  try {
    let raw = localStorage.getItem(STORAGE_KEY_TEACHERS);
    if (!raw) {
      const prevRaw = localStorage.getItem('halaqah_active_teachers_v3');
      if (prevRaw) {
        try {
          const prevList = JSON.parse(prevRaw);
          if (Array.isArray(prevList)) {
            const remapped = prevList.map(hydrateTeacher);
            localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(remapped));
            return remapped;
          }
        } catch {}
      }
      const initHydrated = INITIAL_TEACHERS.map(hydrateTeacher);
      localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(initHydrated));
      return initHydrated;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map(hydrateTeacher);
    }
    return INITIAL_TEACHERS.map(hydrateTeacher);
  } catch {
    return INITIAL_TEACHERS.map(hydrateTeacher);
  }
}

export function saveActiveTeachers(teachers: Teacher[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(teachers));
}

// 1. โยกย้ายนักศึกษาจากอาจารย์กลุ่มเดิม ไปกลุ่มอาจารย์คนใหม่
export function moveStudentToTeacher(
  studentId: string,
  newTeacherName: string
): { success: boolean; message: string; updatedStudent?: Student } {
  const students = getActiveStudents();
  const teachers = getActiveTeachers();

  const targetTeacher = teachers.find((t) => t.name === newTeacherName);
  if (!targetTeacher) {
    return { success: false, message: 'ไม่พบอาจารย์เป้าหมายที่เลือก' };
  }

  const sIdx = students.findIndex((s) => s.studentId === studentId);
  if (sIdx === -1) {
    return { success: false, message: 'ไม่พบรหัสนักศึกษานี้ในระบบ' };
  }

  const prev = students[sIdx];
  if (prev.teacherName === targetTeacher.name) {
    return {
      success: false,
      message: `${prev.fullName} อยู่ในกลุ่มอาจารย์ ${targetTeacher.name} อยู่แล้ว`,
    };
  }
  const updated: Student = {
    ...prev,
    teacherName: targetTeacher.name,
    groupName: targetTeacher.groupName,
    groupId: targetTeacher.groupId,
    yearLevel: targetTeacher.yearLevel,
    gender: targetTeacher.gender,
  };

  students[sIdx] = updated;
  saveActiveStudents(students);

  return {
    success: true,
    message: `โยกย้าย ${updated.fullName} ไปกลุ่ม "${targetTeacher.groupName}" (${targetTeacher.name}) สำเร็จแล้ว`,
    updatedStudent: updated,
  };
}

// 1.1 กำหนดหรือโยกย้ายนักศึกษาทีละหลายคน (Batch Assign)
export function batchAssignStudentsToTeacher(
  studentIds: string[],
  targetTeacherName: string
): { success: boolean; message: string; count: number } {
  if (!studentIds || studentIds.length === 0) {
    return { success: false, message: 'กรุณาเลือกนักศึกษาอย่างน้อย 1 คน', count: 0 };
  }

  const students = getActiveStudents();
  const teachers = getActiveTeachers();

  const targetTeacher = teachers.find((t) => t.name.trim() === targetTeacherName.trim());
  if (!targetTeacher) {
    return { success: false, message: 'ไม่พบอาจารย์เป้าหมายที่เลือก', count: 0 };
  }

  let count = 0;
  const targetIdSet = new Set(studentIds);
  for (let i = 0; i < students.length; i++) {
    if (targetIdSet.has(students[i].studentId)) {
      students[i] = {
        ...students[i],
        teacherName: targetTeacher.name,
        groupName: targetTeacher.groupName,
        groupId: targetTeacher.groupId,
        yearLevel: students[i].yearLevel || targetTeacher.yearLevel,
        gender: students[i].gender || targetTeacher.gender,
      };
      count++;
    }
  }

  saveActiveStudents(students);
  return {
    success: true,
    message: `กำหนดอาจารย์ "${targetTeacher.name}" (${targetTeacher.groupName}) ให้นักศึกษาจำนวน ${count} คน สำเร็จแล้ว`,
    count,
  };
}

// 2. แก้ไขข้อมูลนักศึกษา (รหัส, ชื่อ, กลุ่ม, ชั้นปี, เพศ, อาจารย์)
export function updateStudentInfo(
  studentIdOrOriginalId: string,
  newData: Partial<Student>
): { success: boolean; message: string; updatedStudent?: Student } {
  const students = getActiveStudents();
  // Find by original ID first, or fallback to newData.studentId
  let sIdx = students.findIndex((s) => s.studentId === studentIdOrOriginalId);
  if (sIdx === -1 && newData.studentId) {
    sIdx = students.findIndex((s) => s.studentId === newData.studentId);
  }

  if (sIdx === -1) {
    return { success: false, message: 'ไม่พบรหัสนักศึกษาที่จะแก้ไขในระบบ' };
  }

  const targetOldId = students[sIdx].studentId;
  const newId = newData.studentId?.trim() || targetOldId;

  // Check duplicate ID if ID changed
  if (newId !== targetOldId) {
    const isDup = students.some((s, idx) => idx !== sIdx && s.studentId === newId);
    if (isDup) {
      return { success: false, message: `รหัสนักศึกษา "${newId}" ซ้ำกับนักศึกษาท่านอื่นในระบบ` };
    }
  }

  const previousName = students[sIdx].fullName;
  const updated: Student = {
    ...students[sIdx],
    ...newData,
    studentId: newId,
  };

  students[sIdx] = updated;
  saveActiveStudents(students);

  // Cascade changed ID and name to local attendance records if needed
  if (newId !== targetOldId || updated.fullName !== previousName) {
    try {
      const records = getLocalAttendance();
      let hasUpdate = false;
      const updatedRecords = records.map((r) => {
        if (r.studentId === targetOldId) {
          hasUpdate = true;
          return {
            ...r,
            studentId: newId,
            studentName: updated.fullName,
            groupName: updated.groupName || r.groupName,
            teacherName: updated.teacherName || r.teacherName,
          };
        }
        return r;
      });
      if (hasUpdate) {
        saveLocalAttendance(updatedRecords);
      }
    } catch {}
  }

  return {
    success: true,
    message: `แก้ไขข้อมูลนักศึกษา "${updated.fullName}" สำเร็จแล้ว`,
    updatedStudent: updated,
  };
}

// 3. แก้ไขข้อมูลอาจารย์ (ชื่อ, กลุ่ม, ชั้นปี, เพศ)
export function updateTeacherInfo(
  oldTeacherName: string,
  newData: { name: string; groupName: string; yearLevel: string; gender: 'ชาย' | 'หญิง' }
): { success: boolean; message: string } {
  const teachers = getActiveTeachers();
  let tIdx = teachers.findIndex((t) => t.name === oldTeacherName);
  if (tIdx === -1 && newData.name) {
    tIdx = teachers.findIndex((t) => t.name === newData.name.trim());
  }

  if (tIdx === -1) {
    return { success: false, message: 'ไม่พบอาจารย์ที่จะแก้ไขในระบบ' };
  }

  const targetOldTeacherName = teachers[tIdx].name;
  const newTeacherName = newData.name.trim();

  // If name changed, check duplicate
  if (newTeacherName !== targetOldTeacherName) {
    const isDup = teachers.some((t, idx) => idx !== tIdx && t.name === newTeacherName);
    if (isDup) {
      return { success: false, message: `ชื่ออาจารย์ "${newTeacherName}" มีอยู่ในระบบแล้ว` };
    }
  }

  const updatedTeacher: Teacher = {
    ...teachers[tIdx],
    name: newTeacherName,
    groupName: newData.groupName.trim(),
    yearLevel: newData.yearLevel.trim(),
    gender: newData.gender,
  };

  teachers[tIdx] = updatedTeacher;
  saveActiveTeachers(teachers);

  // Cascade to all students assigned to this teacher
  const students = getActiveStudents();
  let affectedStudentsCount = 0;
  const updatedStudents = students.map((s) => {
    if (s.teacherName === targetOldTeacherName) {
      affectedStudentsCount++;
      return {
        ...s,
        teacherName: updatedTeacher.name,
        groupName: updatedTeacher.groupName,
        yearLevel: updatedTeacher.yearLevel,
        gender: updatedTeacher.gender,
      };
    }
    return s;
  });

  saveActiveStudents(updatedStudents);

  // Cascade to attendance records
  try {
    const records = getLocalAttendance();
    let hasUpdate = false;
    const updatedRecords = records.map((r) => {
      if (r.teacherName === targetOldTeacherName) {
        hasUpdate = true;
        return {
          ...r,
          teacherName: updatedTeacher.name,
          groupName: updatedTeacher.groupName,
        };
      }
      return r;
    });
    if (hasUpdate) {
      saveLocalAttendance(updatedRecords);
    }
  } catch {}

  return {
    success: true,
    message: `แก้ไขข้อมูลอาจารย์ "${updatedTeacher.name}" และอัปเดตนักศึกษาในกลุ่ม ${affectedStudentsCount} คน สำเร็จแล้ว`,
  };
}

// 4. รีเซ็ตกลับเป็นข้อมูลเริ่มต้น
export function resetToInitialData(): void {
  if (typeof window === 'undefined') return;
  const initHydrated = INITIAL_STUDENTS.map(hydrateStudentWithMajor);
  localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(initHydrated));
  localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(INITIAL_TEACHERS));
  localStorage.setItem(STORAGE_KEY_MAJORS, JSON.stringify(DEFAULT_MAJORS));
}

// 5. จัดการรหัสผ่านบุคลากร (ค่าเริ่มต้นคือ edu.sdd)
export function getFacultyPassword(): string {
  if (typeof window === 'undefined') return 'edu.sdd';
  try {
    return localStorage.getItem(STORAGE_KEY_FACULTY_PASS) || 'edu.sdd';
  } catch {
    return 'edu.sdd';
  }
}

export function saveFacultyPassword(newPass: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_FACULTY_PASS, newPass.trim() || 'edu.sdd');
}

// 6. จัดการระบบประกาศ (Announcements) สำหรับนักศึกษา
export function getAnnouncements(): Announcement[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ANNOUNCEMENTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveAnnouncements(list: Announcement[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_ANNOUNCEMENTS, JSON.stringify(list));
}

export function addAnnouncement(
  data: Omit<Announcement, 'id' | 'createdAt'>
): Announcement {
  const current = getAnnouncements();
  const newAnn: Announcement = {
    ...data,
    id: `ann_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  const updated = [newAnn, ...current];
  saveAnnouncements(updated);
  return newAnn;
}

export function deleteAnnouncement(id: string): void {
  const current = getAnnouncements();
  const updated = current.filter((a) => a.id !== id);
  saveAnnouncements(updated);
}

// 7. เพิ่มนักศึกษาเดี่ยว / หลายคน (Bulk Paste/Import)
export function addStudentsBatch(newStudents: Student[]): {
  success: boolean;
  message: string;
  addedCount: number;
  skippedCount: number;
} {
  if (!Array.isArray(newStudents) || newStudents.length === 0) {
    return { success: false, message: 'ไม่มีข้อมูลนักศึกษาที่จะเพิ่ม', addedCount: 0, skippedCount: 0 };
  }

  const current = getActiveStudents();
  const idSet = new Set(current.map((s) => (s.studentId || '').trim()));
  const toAdd: Student[] = [];
  let skipped = 0;

  for (const item of newStudents) {
    const cleanId = (item.studentId || '').trim();
    if (!cleanId) {
      skipped++;
      continue;
    }
    if (idSet.has(cleanId)) {
      // อัปเดตข้อมูลหรือข้าม
      skipped++;
      continue;
    }
    idSet.add(cleanId);
    toAdd.push({
      studentId: cleanId,
      fullName: (item.fullName || '').trim() || `นักศึกษา (${cleanId})`,
      gender: item.gender === 'หญิง' ? 'หญิง' : 'ชาย',
      yearLevel: (item.yearLevel || '').trim() || 'ปี 2',
      groupName: (item.groupName || '').trim() || 'กลุ่มศึกษา',
      teacherName: (item.teacherName || '').trim() || 'ไม่ระบุอาจารย์',
      groupId: item.groupId || '',
      major: (item.major || '').trim() || inferMajorFromStudentId(cleanId, item.yearLevel),
    });
  }

  if (toAdd.length > 0) {
    const updated = [...current, ...toAdd];
    saveActiveStudents(updated);
  }

  return {
    success: toAdd.length > 0,
    message: `เพิ่มนักศึกษาสำเร็จ ${toAdd.length} คน (ข้ามรหัสที่ซ้ำ/ไม่ถูกต้อง ${skipped} คน)`,
    addedCount: toAdd.length,
    skippedCount: skipped,
  };
}

// 8. เพิ่มอาจารย์เดี่ยว / หลายคน (Bulk Paste/Import)
export function addTeachersBatch(newTeachers: Teacher[]): {
  success: boolean;
  message: string;
  addedCount: number;
  skippedCount: number;
} {
  if (!Array.isArray(newTeachers) || newTeachers.length === 0) {
    return { success: false, message: 'ไม่มีข้อมูลอาจารย์ที่จะเพิ่ม', addedCount: 0, skippedCount: 0 };
  }

  const current = getActiveTeachers();
  const nameSet = new Set(current.map((t) => (t.name || '').trim()));
  const toAdd: Teacher[] = [];
  let skipped = 0;

  for (const item of newTeachers) {
    const cleanName = (item.name || '').trim();
    if (!cleanName) {
      skipped++;
      continue;
    }
    if (nameSet.has(cleanName)) {
      skipped++;
      continue;
    }
    nameSet.add(cleanName);
    toAdd.push({
      name: cleanName,
      groupId: item.groupId || `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      groupName: (item.groupName || '').trim() || `กลุ่ม ${cleanName}`,
      gender: item.gender === 'หญิง' ? 'หญิง' : 'ชาย',
      yearLevel: (item.yearLevel || '').trim() || 'ปี 2',
    });
  }

  if (toAdd.length > 0) {
    const updated = [...current, ...toAdd];
    saveActiveTeachers(updated);
  }

  return {
    success: toAdd.length > 0,
    message: `เพิ่มอาจารย์สำเร็จ ${toAdd.length} ท่าน (ข้ามชื่อที่ซ้ำ/ว่าง ${skipped} ท่าน)`,
    addedCount: toAdd.length,
    skippedCount: skipped,
  };
}

// 9. ลบนักศึกษา
export function deleteStudent(studentId: string): { success: boolean; message: string } {
  const current = getActiveStudents();
  const updated = current.filter((s) => s.studentId !== studentId);
  if (updated.length === current.length) {
    return { success: false, message: 'ไม่พบรหัสนักศึกษาที่จะลบ' };
  }
  saveActiveStudents(updated);
  return { success: true, message: `ลบรหัสนักศึกษา ${studentId} เรียบร้อยแล้ว` };
}

// 10. ลบอาจารย์
export function deleteTeacher(teacherName: string): { success: boolean; message: string } {
  const current = getActiveTeachers();
  const updated = current.filter((t) => t.name !== teacherName);
  if (updated.length === current.length) {
    return { success: false, message: 'ไม่พบอาจารย์ที่จะลบ' };
  }
  saveActiveTeachers(updated);
  return { success: true, message: `ลบอาจารย์ ${teacherName} เรียบร้อยแล้ว` };
}

// ----------------------------------------------------
// 11. ระบบการจัดการและเลื่อน/ลดระดับกลุ่ม (Levels 01, 02, 03)
// ----------------------------------------------------

export function getStudentLevel(s?: Partial<Student> | null): GroupLevel {
  if (!s || !s.level) return '01';
  if (s.level === '02' || s.level === '03') return s.level;
  return '01';
}

export function setStudentLevel(
  studentId: string,
  newLevel: GroupLevel
): { success: boolean; message: string; updatedStudent?: Student } {
  const students = getActiveStudents();
  const idx = students.findIndex((s) => s.studentId === studentId);
  if (idx === -1) {
    return { success: false, message: 'ไม่พบรหัสนักศึกษานี้ในระบบ' };
  }
  const updated: Student = { ...students[idx], level: newLevel };
  students[idx] = updated;
  saveActiveStudents(students);
  return {
    success: true,
    message: `ปรับระดับของ ${updated.fullName} เป็นระดับ ${newLevel} เรียบร้อยแล้ว`,
    updatedStudent: updated,
  };
}

export function promoteStudentLevel(
  studentId: string
): { success: boolean; newLevel: GroupLevel; message: string; updatedStudent?: Student } {
  const students = getActiveStudents();
  const idx = students.findIndex((s) => s.studentId === studentId);
  if (idx === -1) {
    return { success: false, newLevel: '01', message: 'ไม่พบรหัสนักศึกษา' };
  }
  const currentLevel = students[idx].level || '01';
  let nextLevel: GroupLevel = currentLevel;
  if (currentLevel === '01') nextLevel = '02';
  else if (currentLevel === '02') nextLevel = '03';
  else {
    return { success: false, newLevel: '03', message: 'นักศึกษาอยู่ในระดับสูงสุด (ระดับ 03) แล้ว' };
  }

  const updated: Student = { ...students[idx], level: nextLevel };
  students[idx] = updated;
  saveActiveStudents(students);
  return {
    success: true,
    newLevel: nextLevel,
    message: `เลื่อนระดับ ${updated.fullName} เป็นระดับ ${nextLevel} สำเร็จ! 🌟`,
    updatedStudent: updated,
  };
}

export function demoteStudentLevel(
  studentId: string
): { success: boolean; newLevel: GroupLevel; message: string; updatedStudent?: Student } {
  const students = getActiveStudents();
  const idx = students.findIndex((s) => s.studentId === studentId);
  if (idx === -1) {
    return { success: false, newLevel: '01', message: 'ไม่พบรหัสนักศึกษา' };
  }
  const currentLevel = students[idx].level || '01';
  let prevLevel: GroupLevel = currentLevel;
  if (currentLevel === '03') prevLevel = '02';
  else if (currentLevel === '02') prevLevel = '01';
  else {
    return { success: false, newLevel: '01', message: 'นักศึกษาอยู่ในระดับเริ่มต้น (ระดับ 01) แล้ว' };
  }

  const updated: Student = { ...students[idx], level: prevLevel };
  students[idx] = updated;
  saveActiveStudents(students);
  return {
    success: true,
    newLevel: prevLevel,
    message: `ปรับลดระดับ ${updated.fullName} เป็นระดับ ${prevLevel} เรียบร้อยแล้ว`,
    updatedStudent: updated,
  };
}

export function getGroupLevel(teacherName: string): GroupLevel {
  const teachers = getActiveTeachers();
  const t = teachers.find((tch) => tch.name === teacherName);
  return (t?.level as GroupLevel) || '01';
}

export function setGroupLevel(
  teacherName: string,
  newLevel: GroupLevel,
  cascadeToStudents = true
): { success: boolean; message: string; newLevel: GroupLevel; affectedStudents: number } {
  const teachers = getActiveTeachers();
  const tIdx = teachers.findIndex((t) => t.name === teacherName);
  if (tIdx === -1) {
    return { success: false, message: 'ไม่พบอาจารย์ประจำกลุ่ม', newLevel: '01', affectedStudents: 0 };
  }

  teachers[tIdx].level = newLevel;
  saveActiveTeachers(teachers);

  let affectedStudents = 0;
  if (cascadeToStudents) {
    const students = getActiveStudents();
    const updated = students.map((s) => {
      if (s.teacherName === teacherName) {
        affectedStudents++;
        return { ...s, level: newLevel };
      }
      return s;
    });
    saveActiveStudents(updated);
  }

  return {
    success: true,
    message: `ปรับระดับกลุ่มอาจารย์ ${teacherName} เป็นระดับ ${newLevel}${cascadeToStudents ? ` (อัปเดตนักศึกษาในกลุ่ม ${affectedStudents} คน)` : ''} สำเร็จแล้ว`,
    newLevel: newLevel,
    affectedStudents,
  };
}

export function promoteGroupLevel(
  teacherName: string,
  cascadeToStudents = true
): { success: boolean; newLevel: GroupLevel; message: string; affectedStudents: number } {
  const currentLevel = getGroupLevel(teacherName);
  let nextLevel: GroupLevel = currentLevel;
  if (currentLevel === '01') nextLevel = '02';
  else if (currentLevel === '02') nextLevel = '03';
  else {
    return { success: false, newLevel: '03', message: 'กลุ่มนี้อยู่ในระดับสูงสุด (ระดับ 03) แล้ว', affectedStudents: 0 };
  }
  return setGroupLevel(teacherName, nextLevel, cascadeToStudents);
}

export function demoteGroupLevel(
  teacherName: string,
  cascadeToStudents = true
): { success: boolean; newLevel: GroupLevel; message: string; affectedStudents: number } {
  const currentLevel = getGroupLevel(teacherName);
  let prevLevel: GroupLevel = currentLevel;
  if (currentLevel === '03') prevLevel = '02';
  else if (currentLevel === '02') prevLevel = '01';
  else {
    return { success: false, newLevel: '01', message: 'กลุ่มนี้อยู่ในระดับเริ่มต้น (ระดับ 01) แล้ว', affectedStudents: 0 };
  }
  return setGroupLevel(teacherName, prevLevel, cascadeToStudents);
}

// ----------------------------------------------------
// 12. ระบบเลื่อนชั้นปีการศึกษา (Academic Year Roll-over)
// ----------------------------------------------------

export function promoteAcademicYear(): {
  success: boolean;
  message: string;
  promotedCount: number;
  graduatedCount: number;
} {
  const students = getActiveStudents();
  let promoted = 0;
  let graduated = 0;

  const updatedStudents = students.map((s) => {
    const y = (s.yearLevel || '').trim();
    if (y.includes('2') || y === 'ปี 2') {
      promoted++;
      return {
        ...s,
        yearLevel: 'ปี 3',
        groupName: s.groupName.replace('ชั้นปีที่ 2', 'ชั้นปีที่ 3').replace('ปี 2', 'ปี 3'),
      };
    } else if (y.includes('3') || y === 'ปี 3') {
      promoted++;
      return {
        ...s,
        yearLevel: 'ปี 4',
        groupName: s.groupName.replace('ชั้นปีที่ 3', 'ชั้นปีที่ 4').replace('ปี 3', 'ปี 4'),
        major: inferMajorFromStudentId(s.studentId, 'ปี 4'),
      };
    } else if (y.includes('4') || y === 'ปี 4') {
      graduated++;
      return {
        ...s,
        yearLevel: 'สำเร็จการศึกษา',
      };
    }
    return s;
  });

  saveActiveStudents(updatedStudents);

  return {
    success: true,
    message: `เลื่อนชั้นปีสำเร็จ: เลื่อนระดับชั้น ${promoted} คน, สำเร็จการศึกษา ${graduated} คน`,
    promotedCount: promoted,
    graduatedCount: graduated,
  };
}

// ----------------------------------------------------
// 13. ระบบบันทึกบทเรียน / ซูเราะฮ์ และ รหัส PIN ประจำคาบ (Session Metadata)
// ----------------------------------------------------

export function getAllSessionMetadata(): SessionMetadata[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveAllSessionMetadata(list: SessionMetadata[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(list));
}

export function getSessionMetadata(date: string, teacherName: string): SessionMetadata | null {
  const list = getAllSessionMetadata();
  return list.find((s) => s.date === date && s.teacherName === teacherName) || null;
}

export function saveSessionMetadata(meta: SessionMetadata): void {
  const list = getAllSessionMetadata();
  const idx = list.findIndex((s) => s.date === meta.date && s.teacherName === meta.teacherName);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...meta };
  } else {
    list.push(meta);
  }
  saveAllSessionMetadata(list);
}

export function getOrGenerateSessionPin(date: string, teacherName: string): string {
  const current = getSessionMetadata(date, teacherName);
  if (current && current.pinCode) {
    return current.pinCode;
  }
  // สุ่ม PIN 4 หลัก ไม่ซ้ำง่าย
  const pin = String(Math.floor(1000 + Math.random() * 9000));
  saveSessionMetadata({
    date,
    teacherName,
    pinCode: pin,
    pinCreatedAt: new Date().toISOString(),
  });
  return pin;
}

export function findSessionByPin(pin: string, date?: string): SessionMetadata | null {
  const cleanPin = pin.trim();
  if (!cleanPin) return null;
  const list = getAllSessionMetadata();
  if (date) {
    return list.find((s) => s.date === date && s.pinCode === cleanPin) || null;
  }
  return list.find((s) => s.pinCode === cleanPin) || null;
}

// ----------------------------------------------------
// 14. ระบบกำหนดเป้าหมายภาคเรียน (Semester Settings)
// ----------------------------------------------------

export const DEFAULT_SEMESTER_SETTINGS: SemesterSettings = {
  targetSessions: 12,
  semesterName: 'ภาคเรียนที่ 1',
  academicYear: '2567',
  activityDay: 'ทุกวันพุธ',
};

export function getSemesterSettings(): SemesterSettings {
  if (typeof window === 'undefined') return DEFAULT_SEMESTER_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SEMESTER);
    if (!raw) return DEFAULT_SEMESTER_SETTINGS;
    const s = { ...DEFAULT_SEMESTER_SETTINGS, ...JSON.parse(raw) };
    // ค่าวันที่ตั้งต้นของเวอร์ชันเก่า ไม่ได้ตั้งโดยแอดมินจริง จึงไม่ใช้กรองข้อมูล
    if (s.startDate === '2024-06-01' && s.endDate === '2024-10-31') {
      delete s.startDate;
      delete s.endDate;
    }
    return s;
  } catch {
    return DEFAULT_SEMESTER_SETTINGS;
  }
}

export function saveSemesterSettings(settings: SemesterSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_SEMESTER, JSON.stringify(settings));
}

// ----------------------------------------------------
// 15. ระบบสำรองและกู้คืนฐานข้อมูลฉุกเฉิน (JSON Backup & Restore)
// ----------------------------------------------------

export function exportFullDatabaseJson(): string {
  const data = {
    exportedAt: new Date().toISOString(),
    version: '2.0.0',
    students: getActiveStudents(),
    teachers: getActiveTeachers(),
    majors: getActiveMajors(),
    announcements: getAnnouncements(),
    sessions: getAllSessionMetadata(),
    semester: getSemesterSettings(),
    certificateConfig: getCertificateConfig(),
  };
  return JSON.stringify(data, null, 2);
}

export function importFullDatabaseJson(jsonStr: string): { success: boolean; message: string } {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || (!parsed.students && !parsed.teachers)) {
      return { success: false, message: 'รูปแบบไฟล์สำรองข้อมูลไม่ถูกต้อง' };
    }

    if (Array.isArray(parsed.students) && parsed.students.length > 0) {
      saveActiveStudents(parsed.students);
    }
    if (Array.isArray(parsed.teachers) && parsed.teachers.length > 0) {
      saveActiveTeachers(parsed.teachers);
    }
    if (Array.isArray(parsed.majors) && parsed.majors.length > 0) {
      saveActiveMajors(parsed.majors);
    }
    if (Array.isArray(parsed.announcements)) {
      saveAnnouncements(parsed.announcements);
    }
    if (Array.isArray(parsed.sessions)) {
      saveAllSessionMetadata(parsed.sessions);
    }
    if (parsed.semester) {
      saveSemesterSettings(parsed.semester);
    }
    if (parsed.certificateConfig) {
      saveCertificateConfig(parsed.certificateConfig);
    }

    return {
      success: true,
      message: `กู้คืนข้อมูลสำเร็จ! นำเข้านักศึกษา ${parsed.students?.length || 0} คน, อาจารย์ ${parsed.teachers?.length || 0} ท่าน เรียบร้อยแล้ว`,
    };
  } catch (err: any) {
    return { success: false, message: `เกิดข้อผิดพลาดในการนำเข้าข้อมูล: ${err.message || err}` };
  }
}



// ----------------------------------------------------
// 16. เปลี่ยนชื่อสาขาวิชา (มีผลกับนักศึกษาทุกคนในสาขานั้น)
// ----------------------------------------------------
const STORAGE_KEY_MAJOR_RENAMES = 'halaqah_major_renames_v1';

function getMajorRenames(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_MAJOR_RENAMES) || '{}');
  } catch {
    return {};
  }
}

function applyMajorRename(name: string): string {
  const map = getMajorRenames();
  let cur = name;
  for (let i = 0; i < 5 && map[cur]; i++) cur = map[cur];
  return cur;
}

export function renameMajor(oldName: string, newName: string): { success: boolean; message: string; majors: string[] } {
  const from = oldName.trim();
  const to = newName.trim();
  const current = getActiveMajors();
  if (!to) return { success: false, message: 'กรุณาระบุชื่อสาขาใหม่', majors: current };
  if (from === to) return { success: true, message: 'ไม่มีการเปลี่ยนแปลง', majors: current };
  if (current.some((m) => m === to)) {
    return { success: false, message: `มีสาขา "${to}" อยู่แล้ว`, majors: current };
  }
  const updated = current.map((m) => (m === from ? to : m));
  saveActiveMajors(updated);

  // ให้สาขาที่ระบบเดาจากรหัสนักศึกษาเปลี่ยนชื่อตามด้วย
  const map = getMajorRenames();
  Object.keys(map).forEach((k) => {
    if (map[k] === from) map[k] = to;
  });
  map[from] = to;
  delete map[to];
  localStorage.setItem(STORAGE_KEY_MAJOR_RENAMES, JSON.stringify(map));

  const students = getActiveStudents();
  let n = 0;
  const changed = students.map((s) => {
    if (s.major === from) {
      n++;
      return { ...s, major: to };
    }
    return s;
  });
  saveActiveStudents(changed);
  return { success: true, message: `เปลี่ยนชื่อสาขา "${from}" เป็น "${to}" แล้ว (นักศึกษา ${n} คน)`, majors: updated };
}

// ----------------------------------------------------
// 17. ปี/ภาคการศึกษาปัจจุบัน (Term)
// ----------------------------------------------------
const STORAGE_KEY_TERMS = 'halaqah_terms_history_v1';

export function semesterNo(semesterName: string): string {
  const m = (semesterName || '').match(/\d/);
  if (m) return m[0];
  return /ฤดูร้อน|summer/i.test(semesterName || '') ? '3' : '1';
}

export function getTermKey(s: SemesterSettings = getSemesterSettings()): string {
  return `${s.academicYear}/${semesterNo(s.semesterName)}`;
}

export function formatTermLabel(s: SemesterSettings = getSemesterSettings()): string {
  return `${s.semesterName} ปีการศึกษา ${s.academicYear}`;
}

export function getTermHistory(): TermInfo[] {
  if (typeof window === 'undefined') return [];
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY_TERMS) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveTermHistory(list: TermInfo[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_TERMS, JSON.stringify(list));
}

/** ตั้งภาคการศึกษาปัจจุบัน — ทุกหน้าในระบบจะใช้ช่วงเวลานี้ และจดจำไว้ในประวัติ */
export function setCurrentTerm(settings: SemesterSettings): TermInfo {
  saveSemesterSettings(settings);
  const info: TermInfo = {
    key: getTermKey(settings),
    academicYear: settings.academicYear,
    semesterName: settings.semesterName,
    startDate: settings.startDate,
    endDate: settings.endDate,
    activatedAt: new Date().toISOString(),
  };
  const list = getTermHistory().filter((t) => t.key !== info.key);
  saveTermHistory([info, ...list]);
  return info;
}

/** บันทึกนี้อยู่ในภาคการศึกษาที่กำหนดหรือไม่ (บันทึกเก่าที่ไม่มี term จะเทียบจากช่วงวันที่) */
export function isRecordInTerm(r: AttendanceRecord, s: SemesterSettings = getSemesterSettings()): boolean {
  if (r.term) return r.term === getTermKey(s);
  // ยังไม่เคยตั้งภาคการศึกษาด้วยระบบใหม่ = แสดงบันทึกเก่าทั้งหมดเหมือนเดิม
  if (getTermHistory().length === 0) return true;
  if (s.startDate && r.date < s.startDate) return false;
  if (s.endDate && r.date > s.endDate) return false;
  return true;
}

// ----------------------------------------------------
// 18. เลื่อนชั้นปีแบบเลือกได้ (นักศึกษาที่ไม่ผ่าน = ซ้ำชั้น)
// ----------------------------------------------------
export const YEAR_LEVELS = ['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4', 'สำเร็จการศึกษา'];

export function nextYearLevel(y: string): string {
  const m = (y || '').match(/\d/);
  if (!m) return y;
  const n = parseInt(m[0], 10);
  return n >= 4 ? 'สำเร็จการศึกษา' : `ปี ${n + 1}`;
}

export function promoteSelectedStudents(ids: string[]): { promoted: number; graduated: number; kept: number } {
  const set = new Set(ids);
  let promoted = 0;
  let graduated = 0;
  let kept = 0;
  const updated = getActiveStudents().map((s) => {
    if (s.yearLevel === 'สำเร็จการศึกษา') return s;
    if (!set.has(s.studentId)) {
      kept++;
      return s;
    }
    const next = nextYearLevel(s.yearLevel);
    if (next === 'สำเร็จการศึกษา') graduated++;
    else promoted++;
    const cur = (s.yearLevel.match(/\d/) || [''])[0];
    const nxt = (next.match(/\d/) || [''])[0];
    return {
      ...s,
      yearLevel: next,
      groupName: cur && nxt ? s.groupName.replace(`ปีที่ ${cur}`, `ปีที่ ${nxt}`).replace(`ปี ${cur}`, `ปี ${nxt}`) : s.groupName,
      major: next === 'ปี 4' && !s.major ? inferMajorFromStudentId(s.studentId, 'ปี 4') : s.major,
    };
  });
  saveActiveStudents(updated);
  return { promoted, graduated, kept };
}

export function setStudentYearLevel(studentId: string, yearLevel: string): void {
  saveActiveStudents(getActiveStudents().map((s) => (s.studentId === studentId ? { ...s, yearLevel } : s)));
}