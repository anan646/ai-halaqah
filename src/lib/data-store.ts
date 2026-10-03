import { Student, Teacher, Announcement } from './types';
import { INITIAL_STUDENTS, INITIAL_TEACHERS } from './students-data';

const STORAGE_KEY_STUDENTS = 'halaqah_active_students_v4';
const STORAGE_KEY_TEACHERS = 'halaqah_active_teachers_v3';
const STORAGE_KEY_FACULTY_PASS = 'halaqah_faculty_password_v1';
const STORAGE_KEY_ANNOUNCEMENTS = 'halaqah_announcements_v1';
const STORAGE_KEY_MAJORS = 'halaqah_active_majors_v2';

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
      const merged = Array.from(new Set([...DEFAULT_MAJORS, ...parsed.map((s: string) => String(s).trim())])).filter(Boolean);
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
  if (DEFAULT_MAJORS.includes(clean)) {
    return { success: false, message: `ไม่สามารถลบสาขาวิชาหลักเริ่มต้นของระบบได้`, majors: getActiveMajors() };
  }
  const current = getActiveMajors();
  const updated = current.filter((m) => m !== clean);
  saveActiveMajors(updated);
  return { success: true, message: `ลบสาขาวิชา "${clean}" เรียบร้อยแล้ว`, majors: updated };
}

const hydrateStudentWithMajor = (s: Student): Student => ({
  ...s,
  major: getStudentMajor(s),
});

export function getActiveStudents(): Student[] {
  if (typeof window === 'undefined') return INITIAL_STUDENTS.map(hydrateStudentWithMajor);
  try {
    let raw = localStorage.getItem(STORAGE_KEY_STUDENTS);
    if (!raw) {
      // Migrate from previous key if available to preserve any newly added custom students
      const prevRaw = localStorage.getItem('halaqah_active_students_v3');
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
    if (!Array.isArray(parsed) || parsed.length < INITIAL_STUDENTS.length) {
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
  if (typeof window === 'undefined') return INITIAL_TEACHERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TEACHERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(INITIAL_TEACHERS));
      return INITIAL_TEACHERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_TEACHERS;
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

// 2. แก้ไขข้อมูลนักศึกษา (รหัส, ชื่อ, กลุ่ม, ชั้นปี, เพศ, อาจารย์)
export function updateStudentInfo(
  studentId: string,
  newData: Partial<Student>
): { success: boolean; message: string; updatedStudent?: Student } {
  const students = getActiveStudents();
  const sIdx = students.findIndex((s) => s.studentId === studentId);

  if (sIdx === -1) {
    return { success: false, message: 'ไม่พบรหัสนักศึกษาที่จะแก้ไข' };
  }

  const updated: Student = {
    ...students[sIdx],
    ...newData,
  };

  students[sIdx] = updated;
  saveActiveStudents(students);

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
  const tIdx = teachers.findIndex((t) => t.name === oldTeacherName);

  if (tIdx === -1) {
    return { success: false, message: 'ไม่พบอาจารย์ที่จะแก้ไข' };
  }

  const updatedTeacher: Teacher = {
    ...teachers[tIdx],
    name: newData.name.trim(),
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
    if (s.teacherName === oldTeacherName) {
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

