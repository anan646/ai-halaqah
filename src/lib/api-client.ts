import { AttendanceRecord, Student, Teacher, SemesterSettings } from './types';
import { INITIAL_STUDENTS, INITIAL_TEACHERS } from './students-data';
import {
  getActiveStudents,
  getActiveTeachers,
  getActiveMajors,
  getAnnouncements,
  getAllSessionMetadata,
  getSemesterSettings,
  getTermHistory,
  getStudentMajor,
  saveActiveStudents,
  saveActiveTeachers,
  saveActiveMajors,
  saveAnnouncements,
  saveAllSessionMetadata,
  saveTermHistory,
  saveSemesterSettings,
} from './data-store';
import { getCertificateConfig, saveCertificateConfig } from './certificate-config';

const STORAGE_KEY_ATTENDANCE = 'halaqah_attendance_records_v1';
const STORAGE_KEY_SCRIPT_URL = 'halaqah_apps_script_url';
const STORAGE_KEY_LOGO = 'halaqah_custom_logo_v4';
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
    try {
      localStorage.removeItem('halaqah_custom_logo');
      localStorage.removeItem('halaqah_custom_logo_v2');
      localStorage.removeItem('halaqah_custom_logo_v3');
    } catch {}
    const saved = localStorage.getItem(STORAGE_KEY_LOGO);
    if (saved && saved.trim()) return saved.trim();
  }
  return '/logo.png';
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

// สำรองข้อมูลทั้งหมดขึ้น Google Sheet (นักศึกษา อาจารย์ สาขา ภาคการศึกษา ประกาศ บันทึกคาบ เช็คชื่อ)
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
  const students = getActiveStudents();
  const teachers = getActiveTeachers();
  try {
    const res = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'backupAll',
        adminKey: getAdminKey(),
        students: students.map((s) => ({ ...s, major: getStudentMajor(s), level: s.level || '01' })),
        teachers,
        majors: getActiveMajors(),
        announcements: getAnnouncements(),
        sessions: getAllSessionMetadata(),
        semester: getSemesterSettings(),
        terms: getTermHistory(),
        attendance,
        logoUrl: getSavedLogo(),
        certificateConfig: getCertificateConfig(),
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
        message: `สำรองข้อมูลทั้งหมดสำเร็จ! (นักศึกษา ${students.length} คน, อาจารย์ ${teachers.length} ท่าน, ประวัติเช็คชื่อ ${attendance.length} รายการ)`
      };
    }
    return { success: false, message: `Google Sheet ตอบกลับ: ${result?.message || 'ไม่สามารถสำรองได้'}` };
  } catch (err: any) {
    return { success: false, message: `การสำรองข้อมูลขัดข้อง: ${err.message || err}` };
  }
}

/** ดึงข้อมูลทั้งหมดจาก Google Sheet มาแทนข้อมูลในเครื่อง (ใช้ตอนเปลี่ยนเครื่อง/เบราว์เซอร์) — แอดมินเท่านั้น */
export async function restoreFromGoogleSheet(): Promise<{ success: boolean; message: string }> {
  const scriptUrl = getSavedScriptUrl();
  if (!scriptUrl) return { success: false, message: 'ยังไม่ได้ตั้งค่า Web App URL' };
  try {
    const res = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'getFullData', adminKey: getAdminKey() }),
    });
    const d = await res.json();
    if (!d?.success) return { success: false, message: d?.message || 'ดึงข้อมูลไม่สำเร็จ' };
    if (Array.isArray(d.students) && d.students.length) saveActiveStudents(d.students);
    if (Array.isArray(d.teachers) && d.teachers.length) saveActiveTeachers(d.teachers);
    if (Array.isArray(d.majors) && d.majors.length) saveActiveMajors(d.majors);
    if (Array.isArray(d.announcements)) saveAnnouncements(d.announcements);
    if (Array.isArray(d.sessions)) saveAllSessionMetadata(d.sessions);
    if (Array.isArray(d.terms) && d.terms.length) saveTermHistory(d.terms);
    if (d.semester) saveSemesterSettings({ ...getSemesterSettings(), ...d.semester });
    if (d.certificateConfig) saveCertificateConfig({ ...getCertificateConfig(), ...d.certificateConfig });
    if (Array.isArray(d.attendance) && d.attendance.length) {
      const map = new Map<string, AttendanceRecord>();
      getLocalAttendanceRecords().forEach((r) => map.set(`${r.date}_${r.studentId}`, r));
      d.attendance.forEach((r: AttendanceRecord) => map.set(`${r.date}_${r.studentId}`, r));
      saveLocalAttendanceRecords(Array.from(map.values()));
    }
    return {
      success: true,
      message: `ดึงข้อมูลจาก Google Sheet แล้ว: นักศึกษา ${d.students?.length || 0} คน, อาจารย์ ${d.teachers?.length || 0} ท่าน`,
    };
  } catch (err: any) {
    return { success: false, message: `ดึงข้อมูลไม่สำเร็จ: ${err?.message || err}` };
  }
}

/** ส่งภาคการศึกษาปัจจุบันขึ้นชีต เพื่อให้ทุกเครื่องใช้ภาคเดียวกัน */
export async function pushSemester(): Promise<{ success: boolean; message: string }> {
  const scriptUrl = getSavedScriptUrl();
  if (!scriptUrl) return { success: false, message: 'บันทึกในเครื่องแล้ว (ยังไม่ได้ตั้งค่า Web App URL)' };
  try {
    const res = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'saveSemester', adminKey: getAdminKey(), semester: getSemesterSettings(), terms: getTermHistory() }),
    });
    const d = await res.json();
    return d?.success
      ? { success: true, message: 'ตั้งภาคการศึกษาแล้ว ทุกเครื่องจะใช้ภาคนี้' }
      : { success: false, message: d?.message || 'ส่งขึ้นชีตไม่สำเร็จ' };
  } catch (err: any) {
    return { success: false, message: `ส่งขึ้นชีตไม่สำเร็จ: ${err?.message || err}` };
  }
}

/**
 * เครื่องที่ไม่ได้ล็อกอินแอดมิน (อาจารย์/นักศึกษา) ใช้รายชื่อ อาจารย์ สาขา และภาคการศึกษาจากชีต
 * เพื่อให้ตรงกับที่แอดมินจัดการไว้ (แอดมินใช้ข้อมูลในเครื่อง + ปุ่มดึงจากชีตเอง)
 */
export async function applyPublicDataToLocal(): Promise<boolean> {
  const d = await fetchPublicData();
  if (!d.ok) return false;
  if (d.teachers.length) saveActiveTeachers(d.teachers);
  if (d.roster.length) {
    const local = new Map(getActiveStudents().map((s) => [s.studentId, s]));
    saveActiveStudents(
      d.roster.map((r) => ({
        ...(local.get(r.studentId) || {}),
        ...r,
        major: r.major || local.get(r.studentId)?.major,
        level: (r.level as Student['level']) || local.get(r.studentId)?.level || '01',
        groupId: local.get(r.studentId)?.groupId || '',
      }))
    );
  }
  if (d.majors.length) saveActiveMajors(d.majors);
  if (d.semester) saveSemesterSettings({ ...getSemesterSettings(), ...d.semester });
  saveAnnouncements(d.announcements);
  return true;
}
// ---------------------------------------------------------------------------
// ข้อมูลสาธารณะที่ต้องถึงอุปกรณ์อื่น (ประกาศ + รายชื่อนักศึกษาสำหรับค้นหารหัส)
// ---------------------------------------------------------------------------
import type { Announcement } from './types';
import { getAdminKey } from './admin-auth';

export interface PublicRosterStudent {
  studentId: string;
  fullName: string;
  groupName: string;
  yearLevel: string;
  gender: 'ชาย' | 'หญิง';
  teacherName: string;
  major?: string;
  level?: string;
}

export interface PublicData {
  ok: boolean;
  announcements: Announcement[];
  roster: PublicRosterStudent[];
  teachers: Teacher[];
  majors: string[];
  semester: Partial<SemesterSettings> | null;
}

const EMPTY_PUBLIC: PublicData = { ok: false, announcements: [], roster: [], teachers: [], majors: [], semester: null };

export async function fetchPublicData(): Promise<PublicData> {
  const scriptUrl = getSavedScriptUrl();
  if (!scriptUrl) return EMPTY_PUBLIC;
  try {
    const res = await fetch(`${scriptUrl}?action=getPublicData`);
    const data = await res.json();
    if (!data?.success) return EMPTY_PUBLIC;
    return {
      ok: true,
      announcements: Array.isArray(data.announcements) ? data.announcements : [],
      roster: Array.isArray(data.roster) ? data.roster : [],
      teachers: Array.isArray(data.teachers) ? data.teachers : [],
      majors: Array.isArray(data.majors) ? data.majors : [],
      semester: data.semester || null,
    };
  } catch {
    return EMPTY_PUBLIC;
  }
}

/** ส่งรายการประกาศทั้งหมดขึ้น Google Sheet (ต้องล็อกอินแอดมิน และตั้ง ADMIN_KEY ใน Apps Script) */
export async function pushAnnouncements(list: Announcement[]): Promise<{ success: boolean; message: string }> {
  const scriptUrl = getSavedScriptUrl();
  if (!scriptUrl) {
    return { success: false, message: 'บันทึกในเครื่องนี้แล้ว แต่ยังไม่ได้ตั้งค่า Web App URL จึงยังไม่ถึงนักศึกษาเครื่องอื่น' };
  }
  try {
    const res = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'saveAnnouncements', announcements: list, adminKey: getAdminKey() }),
    });
    const data = await res.json();
    return data?.success
      ? { success: true, message: 'ส่งประกาศถึงนักศึกษาทุกเครื่องแล้ว' }
      : { success: false, message: data?.message || 'ส่งประกาศขึ้น Google Sheet ไม่สำเร็จ' };
  } catch (err: any) {
    return { success: false, message: `ส่งขึ้น Google Sheet ไม่สำเร็จ: ${err?.message || err}` };
  }
}
