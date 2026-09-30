export type AttendanceStatus = 'มา' | 'ขาด' | 'ลา';

export interface Student {
  studentId: string;
  fullName: string;
  gender: 'ชาย' | 'หญิง';
  yearLevel: string; // e.g. 'ปี 2', 'ปี 3', 'ปี 4'
  groupName: string; // e.g. 'ชั้นปีที่ 2 กลุ่มที่ 1'
  teacherName: string; // e.g. 'อาจารย์มุสลิม หะยีสะมะแอ'
  groupId: string;
}

export interface Teacher {
  name: string;
  groupId: string;
  groupName: string;
  gender: 'ชาย' | 'หญิง';
  yearLevel: string;
}

export interface Group {
  id: string;
  name: string;
  teacher: string;
  gender: 'ชาย' | 'หญิง';
  yearLevel: string;
  studentCount: number;
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
}

export interface StudentSummary {
  studentId: string;
  fullName: string;
  groupName: string;
  teacherName: string;
  yearLevel: string;
  gender: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  attendanceRate: number;
  lastStatus?: AttendanceStatus;
  lastRecordedTime?: string;
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
}

