import { AttendanceRecord } from './types';
import { INITIAL_STUDENTS } from './students-data';

const STORAGE_KEY_ATTENDANCE = 'halaqah_attendance_records_v1';
const STORAGE_KEY_SCRIPT_URL = 'halaqah_apps_script_url';
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

// Generate demo attendance records for the last 3 halaqah sessions
function generateInitialDemoRecords(): AttendanceRecord[] {
  const dates = ['2026-09-21', '2026-09-14', '2026-09-07'];
  const records: AttendanceRecord[] = [];
  
  // Pick first 5 groups for initial sample
  const sampleStudents = INITIAL_STUDENTS.slice(0, 100);

  dates.forEach((d) => {
    sampleStudents.forEach((st, idx) => {
      // 85% มา, 10% ขาด, 5% ลา
      let status: 'มา' | 'ขาด' | 'ลา' = 'มา';
      const hash = (idx * 31 + d.charCodeAt(d.length - 1)) % 100;
      if (hash > 90) status = 'ลา';
      else if (hash > 80) status = 'ขาด';

      records.push({
        id: `ATT_${d}_${st.studentId}`,
        date: d,
        studentId: st.studentId,
        studentName: st.fullName,
        teacherName: st.teacherName,
        groupName: st.groupName,
        yearLevel: st.yearLevel,
        gender: st.gender,
        status: status,
        timestamp: new Date(`${d}T09:00:00Z`).toISOString()
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
    if (data && data.success && Array.isArray(data.records)) {
      // Merge remote records with local records
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
  // 1. Update local storage first (instant responsiveness)
  const current = getLocalAttendanceRecords();
  const map = new Map<string, AttendanceRecord>();
  current.forEach((r) => map.set(`${r.date}_${r.studentId}`, r));
  newRecords.forEach((r) => map.set(`${r.date}_${r.studentId}`, r));

  const updated = Array.from(map.values());
  saveLocalAttendanceRecords(updated);

  // 2. Sync with Google Apps Script if URL provided
  const scriptUrl = getSavedScriptUrl();
  if (!scriptUrl) {
    return {
      success: true,
      syncedWithSheet: false,
      message: 'บันทึกในเครื่องเรียบร้อย (ยังไม่ได้ตั้งค่า Google Apps Script URL เพื่อซิงค์กับ Google Sheet)'
    };
  }

  try {
    const res = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // Google Apps Script handles text/plain with JSON body best
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
        message: 'บันทึกและซิงค์ข้อมูลไปยัง Google Sheet เรียบร้อยแล้ว'
      };
    } else {
      return {
        success: true,
        syncedWithSheet: false,
        message: `บันทึกในเครื่องแล้ว แต่การซิงค์ชีตแจ้งเตือน: ${result?.message || 'ไม่สามารถเขียนข้อมูลได้'}`
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
