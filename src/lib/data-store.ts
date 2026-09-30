import { Student, Teacher } from './types';
import { INITIAL_STUDENTS, INITIAL_TEACHERS } from './students-data';

const STORAGE_KEY_STUDENTS = 'halaqah_active_students_v3';
const STORAGE_KEY_TEACHERS = 'halaqah_active_teachers_v3';

export function getActiveStudents(): Student[] {
  if (typeof window === 'undefined') return INITIAL_STUDENTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STUDENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(INITIAL_STUDENTS));
      return INITIAL_STUDENTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length < INITIAL_STUDENTS.length) {
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(INITIAL_STUDENTS));
      return INITIAL_STUDENTS;
    }
    return parsed;
  } catch {
    return INITIAL_STUDENTS;
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
  localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(INITIAL_STUDENTS));
  localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(INITIAL_TEACHERS));
}
