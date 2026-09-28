import { AttendanceRecord, Student, Teacher } from './types';
import { INITIAL_STUDENTS, INITIAL_TEACHERS } from './students-data';

const STORAGE_KEY_ATTENDANCE = 'halaqah_attendance_records_v1';
const STORAGE_KEY_SCRIPT_URL = 'halaqah_apps_script_url';
const STORAGE_KEY_LOGO = 'halaqah_custom_logo';
const STORAGE_KEY_LAST_BACKUP = 'halaqah_last_backup_time';
const DEFAULT_SHEET_ID = '1S8XLzMp1w9CdeW5rydKmTYvvL_ie-ecFIfQbqi_P_D0';

export function getGoogleSheetUrl(): string {
  const sheetId = process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID || DEFAULT_SHEET_ID;
  return `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
}

export function getSavedScriptUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_SCRIPT_URL);
    if (saved && saved.trim()) return saved.trim();
  }
  return process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || '';
}

export function setSavedScriptUrl(url: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_SCRIPT_URL, url.trim());
  }
}

export function getSavedLogo(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(STORAGE_KEY_LOGO) || '';
  }
  return '';
}

export function setSavedLogo(base64: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_LOGO, base64);
  }
}

export function getLastBackupTime(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(STORAGE_KEY_LAST_BACKUP) || '';
  }
  return '';
}

// Generate demo attendance records for initial test
function generateInitialDemoRecords(): AttendanceRecord[] {
  const dates = ['2026-09-21', '2026-09-14', '2026-09-07'];
  const times = ['08:35:12', '08:42:05', '09:05:18'];
  const records: AttendanceRecord[] = [];
  const sampleStudents = INITIAL_STUDENTS.slice(0, 120);

  dates.forEach((d, dIdx) => {
    sampleStudents.forEach((st, idx) => {
      let status: 'มา' | 'ขาด' | 'ลา' = 'มา';
      const hash = (idx * 31 + d.charCodeAt(d.length - 1)) % 100;
      if (hash > 90) status = 'ลา';
      else if (hash > 80) status = 'ขาด';

      records.push({
        id: `ATT_${d}_${st.studentId}`,
        date: d,
        recordedTime: times[dIdx % times.length],
        studentId: st.studentId,
        studentName: st.fullName,
        teacherName: st.teacherName,
        groupName: st.groupName,
        yearLevel: st.yearLevel,
        gender: st.gender,
        status: status,
        timestamp: new Date(`${d}T${times[dIdx % times.length]}Z`).toISOString()
      });
    });
  });

  return records;
}

export function getLocalAttendanceRecords(): AttendanceRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ATTENDANCE);
    if (!raw) {
      const demo = generateInitialDemoRecords();
      localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(demo));
      return demo;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local attendance:', e);
    return [];
  }
}

export function saveLocalAttendanceRecords(records: AttendanceRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving local attendance:', e);
  }
}

export async function fetchAllAttendance(): Promise<{ records: AttendanceRecord[]; fromRemote: boolean }> {
  const scriptUrl = getSavedScriptUrl();
  const localRecords = getLocalAttendanceRecords();

  if (!scriptUrl) {
    return { records: localRecords, fromRemote: false };
  }

  try {
    const res = await fetch(`${scriptUrl}?action=getAttendance`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data && data.success && Array.isArray(data.records) && data.records.length > 0) {
      const recordMap = new Map<string, AttendanceRecord>();
      localRecords.forEach((r) => recordMap.set(`${r.date}_${r.studentId}`, r));
      data.records.forEach((r: AttendanceRecord) => recordMap.set(`${r.date}_${r.studentId}`, r));
      
      const merged = Array.from(recordMap.values());
      saveLocalAttendanceRecords(merged);
      return { records: merged, fromRemote: true };
    }
  } catch (err) {
    console.warn('Could not sync with Google Sheets, using local cache:', err);
  }

  return { records: localRecords, fromRemote: false };
}

export async function saveAttendanceBatch(
  newRecords: AttendanceRecord[]
): Promise<{ success: boolean; syncedWithSheet: boolean; message: string }> {
  // Update local storage first
  const current = getLocalAttendanceRecords();
  const map = new Map<string, AttendanceRecord>();
  current.forEach((r) => map.set(`${r.date}_${r.studentId}`, r));
  newRecords.forEach((r) => map.set(`${r.date}_${r.studentId}`, r));

  const updated = Array.from(map.values());
  saveLocalAttendanceRecords(updated);

  const scriptUrl = getSavedScriptUrl();
  if (!scriptUrl) {
    return {
      success: true,
      syncedWithSheet: false,
      message: 'บันทึกในระบบเรียบร้อย (ยังไม่ได้ใส่ Web App URL เพื่ออัปเดตลง Google Sheet)'
    };
  }

  try {
    const res = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'saveAttendance',
        records: newRecords
      })
    });

    const result = await res.json();
    if (result && result.success) {
      return {
        success: true,
        syncedWithSheet: true,
        message: 'บันทึกและอัปเดตลงใน Google Sheet เรียบร้อยแล้ว!'
      };
    } else {
      return {
        success: true,
        syncedWithSheet: false,
        message: `บันทึกในเครื่องแล้ว: ${result?.message || 'ไม่สามารถเขียนชีตได้'}`
      };
    }
  } catch (err: any) {
    console.error('Error syncing to Google Sheet:', err);
    return {
      success: true,
      syncedWithSheet: false,
      message: `บันทึกในเครื่องแล้ว (การเชื่อมต่อไปยัง Google Sheet ขัดข้อง: ${err.message || err})`
    };
  }
}

// สำรองข้อมูลทั้งหมดขึ้น Google Sheet (Students + Teachers + Attendance + Logo)
export async function backupAllToGoogleSheet(): Promise<{
  success: boolean;
  message: string;
}> {
  const scriptUrl = getSavedScriptUrl();
  if (!scriptUrl) {
    return {
      success: false,
      message: 'กรุณาตั้งค่า Google Apps Script Web App URL ในเมนูตั้งค่าก่อนสำรองข้อมูล'
    };
  }

  const attendance = getLocalAttendanceRecords();
  const logoUrl = getSavedLogo();

  try {
    const res = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'backupAll',
        students: INITIAL_STUDENTS,
        teachers: INITIAL_TEACHERS,
        attendance: attendance,
        logoUrl: logoUrl
      })
    });

    const result = await res.json();
    if (result && result.success) {
      const nowStr = new Date().toLocaleString('th-TH');
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_LAST_BACKUP, nowStr);
      }
      return {
        success: true,
        message: `สำรองข้อมูลทั้งหมดสำเร็จ! (นักศึกษา ${INITIAL_STUDENTS.length} คน, อาจารย์ ${INITIAL_TEACHERS.length} ท่าน, ประวัติเช็คชื่อ ${attendance.length} รายการ)`
      };
    } else {
      return {
        success: false,
        message: `Google Sheet ตอบกลับ: ${result?.message || 'ไม่สามารถสำรองได้'}`
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `การสำรองข้อมูลขัดข้อง: ${err.message || err}`
    };
  }
}
