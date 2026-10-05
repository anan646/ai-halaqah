export type AttendanceStatus = 'มา' | 'ขาด' | 'ลา';
export type GroupLevel = '01' | '02' | '03';

export interface Student {
  studentId: string;
  fullName: string;
  gender: 'ชาย' | 'หญิง';
  yearLevel: string; // e.g. 'ปี 2', 'ปี 3', 'ปี 4'
  groupName: string; // e.g. 'ชั้นปีที่ 2 กลุ่มที่ 1'
  teacherName: string; // e.g. 'อาจารย์มุสลิม หะยีสะมะแอ'
  groupId: string;
  major?: string; // สาขาวิชา เช่น 'อิสลามศึกษา', 'การสอนวิทยาศาสตร์'
  level?: GroupLevel; // ระดับกลุ่ม 01 (พื้นฐาน), 02 (ปานกลาง), 03 (ก้าวหน้า)
}

export interface Teacher {
  name: string;
  groupId: string;
  groupName: string;
  gender: 'ชาย' | 'หญิง';
  yearLevel: string;
  level?: GroupLevel; // ระดับกลุ่ม 01, 02, 03
}

export interface Group {
  id: string;
  name: string;
  teacher: string;
  gender: 'ชาย' | 'หญิง';
  yearLevel: string;
  studentCount: number;
  level?: GroupLevel; // ระดับกลุ่ม 01, 02, 03
}

export interface AttendanceRecord {
  id?: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  studentName: string;
  teacherName: string;
  groupName: string;
  yearLevel: string;
  gender: 'ชาย' | 'หญิง';
  status: AttendanceStatus;
  timestamp?: string; // ISO or formatted
  recordedTime?: string; // Real-time clock e.g. "16:04:15"
  major?: string; // สาขาวิชา
  level?: GroupLevel; // ระดับ 01, 02, 03
  leaveReason?: string; // เหตุผลการลา
  sessionTopic?: string; // หัวข้อการเรียนรู้ / ซูเราะฮ์ที่อ่าน
  notes?: string; // บันทึกเพิ่มเติม
  term?: string; // ภาคการศึกษาที่บันทึก เช่น '2568/1'
}

export interface DailySummary {
  date: string;
  total: number;
  present: number;
  absent: number;
  leave: number;
  rate: number;
  lastRecordedTime?: string;
}

export interface TeacherSummary {
  teacherName: string;
  groupName: string;
  yearLevel: string;
  gender: string;
  studentCount: number;
  checkedDatesCount: number;
  totalPresent: number;
  totalAbsent: number;
  totalLeave: number;
  overallRate: number;
  lastCheckedTime?: string;
  level?: GroupLevel;
}

export interface StudentSummary {
  studentId: string;
  fullName: string;
  groupName: string;
  teacherName: string;
  yearLevel: string;
  gender: string;
  major?: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  attendanceRate: number;
  lastStatus?: AttendanceStatus;
  lastRecordedTime?: string;
  level?: GroupLevel;
}

export interface SubAdmin {
  id: string;
  name: string;
  passcode: string;
  createdAt: string;
  role: 'admin' | 'subadmin';
}

export interface AppSettings {
  logoUrl?: string;
  appTitle?: string;
  scriptUrl?: string;
  lastSyncTime?: string;
  subAdmins?: SubAdmin[];
  targetSessions?: number;
  academicYear?: string;
  semesterName?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'normal' | 'urgent' | 'warning';
  targetType: 'all' | 'specific';
  targetStudentIds: string[];
  createdAt: string;
  authorName: string;
  expiresAt?: string; // ISO — หมดอายุแล้วจะไม่แสดงให้นักศึกษา
}

export interface SessionMetadata {
  date: string; // YYYY-MM-DD
  teacherName: string;
  topic?: string; // หัวข้อการเรียนรู้ / ซูเราะฮ์
  notes?: string; // บันทึกผลการสอน/พฤติกรรม
  pinCode?: string; // PIN 4 หลักสำหรับนักศึกษาสแกน/กรอกเช็คชื่อ
  pinCreatedAt?: string;
}

export interface SemesterSettings {
  targetSessions: number; // e.g. 12
  semesterName: string; // e.g. 'ภาคเรียนที่ 1'
  academicYear: string; // e.g. '2567'
  startDate?: string; // วันเริ่มต้นภาคเรียน (YYYY-MM-DD)
  endDate?: string; // วันสิ้นสุดภาคเรียน (YYYY-MM-DD)
  activityDay?: string; // วันจัดกิจกรรม เช่น 'ทุกวันพุธ'
}

export interface TermInfo {
  key: string; // '2568/1'
  academicYear: string;
  semesterName: string;
  startDate?: string;
  endDate?: string;
  activatedAt: string;
}


