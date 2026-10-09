import { SubAdmin } from './types';

const ADMIN_KEY_STORAGE = 'halaqah_admin_key';
const STORAGE_KEY_SUB_ADMINS = 'halaqah_sub_admins_v1';
const STORAGE_KEY_ADMIN_SESSION = 'halaqah_active_admin_session';

const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwJ5HT2q7jOMRxA-iAihWvzdMJbu4vmJ32e7lZ7YIf42Z4MuKWJ9byqxSu9yEJ9HB86_A/exec';

// อ่าน URL ของ Apps Script ตรงนี้ (ไม่ import จาก api-client เพื่อเลี่ยงการ import วนกัน)
function scriptUrl(): string {
  if (typeof window === 'undefined') return '';
  return (localStorage.getItem('halaqah_apps_script_url') || process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || DEFAULT_APPS_SCRIPT_URL).trim();
}

async function postScript(payload: Record<string, unknown>): Promise<any> {
  const url = scriptUrl();
  if (!url) return { success: false, message: 'ยังไม่ได้ตั้งค่า Web App URL' };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

/** บันทึกแอดมินรองลง Google Sheet (ชีต SubAdmins เก็บรหัสแบบ SHA-256 ไม่เก็บรหัสจริง) */
export async function pushSubAdminAdd(admin: SubAdmin): Promise<{ success: boolean; message: string }> {
  try {
    const d = await postScript({ action: 'addSubAdmin', adminKey: getAdminKey(), subAdmin: admin });
    return d?.success
      ? { success: true, message: `บันทึกแอดมินรอง "${admin.name}" ลง Google Sheet แล้ว` }
      : { success: false, message: `บันทึกในเครื่องแล้ว แต่ส่งขึ้นชีตไม่สำเร็จ: ${d?.message || ''}` };
  } catch (err: any) {
    return { success: false, message: `บันทึกในเครื่องแล้ว แต่ส่งขึ้นชีตไม่สำเร็จ: ${err?.message || err}` };
  }
}

export async function pushSubAdminDelete(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const d = await postScript({ action: 'deleteSubAdmin', adminKey: getAdminKey(), id });
    return d?.success
      ? { success: true, message: 'ลบแอดมินรองออกจาก Google Sheet แล้ว' }
      : { success: false, message: d?.message || 'ลบจากชีตไม่สำเร็จ' };
  } catch (err: any) {
    return { success: false, message: `ลบจากชีตไม่สำเร็จ: ${err?.message || err}` };
  }
}

export function getSubAdmins(): SubAdmin[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUB_ADMINS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveSubAdmins(admins: SubAdmin[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_SUB_ADMINS, JSON.stringify(admins));
}

export function addSubAdmin(name: string, passcode: string): { success: boolean; message: string; admin?: SubAdmin } {
  const trimmedName = name.trim();
  const trimmedPass = passcode.trim();

  if (!trimmedName) return { success: false, message: 'กรุณากรอกชื่อแอดมิน' };
  if (!trimmedPass) return { success: false, message: 'กรุณากรอกรหัสผ่าน' };
const current = getSubAdmins();
  if (current.some((a) => a.passcode === trimmedPass)) {
    return { success: false, message: 'รหัสผ่านนี้ถูกใช้งานแล้ว กรุณากำหนดรหัสใหม่' };
  }

  const newAdmin: SubAdmin = {
    id: `sub_${Date.now()}`,
    name: trimmedName,
    passcode: trimmedPass,
    createdAt: new Date().toISOString(),
    role: 'subadmin',
  };

  const updated = [...current, newAdmin];
  saveSubAdmins(updated);
  return { success: true, message: `เพิ่มแอดมินรอง "${trimmedName}" เรียบร้อยแล้ว`, admin: newAdmin };
}

export function deleteSubAdmin(id: string): void {
  const current = getSubAdmins();
  const filtered = current.filter((a) => a.id !== id);
  saveSubAdmins(filtered);
}

export type AdminUser = { id: string; name: string; role: 'admin' | 'subadmin' };

/** ตรวจรหัส: แอดมินหลักตรวจที่เซิร์ฟเวอร์ ส่วนแอดมินรองตรวจจากรายการในเครื่อง */
export async function verifyAdminPasscode(passcode: string): Promise<{
  valid: boolean;
  user?: AdminUser;
  message?: string;
}> {
  const trimmed = passcode.trim();
  if (!trimmed) return { valid: false };

  // 1. ตรวจสอบกับรายการแอดมินรองในเครื่อง (ถ้ามี)
  const matched = getSubAdmins().find((a) => a.passcode === trimmed);
  if (matched) {
    try {
      sessionStorage.setItem(ADMIN_KEY_STORAGE, trimmed);
      localStorage.setItem(ADMIN_KEY_STORAGE, trimmed);
    } catch {}
    return { valid: true, user: { id: matched.id, name: matched.name + ' (แอดมินรอง)', role: 'subadmin' } };
  }

  // 2. ตรวจสอบกับ Next.js API Route (ENV หรือรหัสหลักตั้งต้น 71300807)
  try {
    const res = await fetch('/api/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: trimmed }),
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data?.valid) {
        try {
          sessionStorage.setItem(ADMIN_KEY_STORAGE, trimmed);
          localStorage.setItem(ADMIN_KEY_STORAGE, trimmed);
        } catch {}
        return { valid: true, user: { id: 'master', name: 'แอดมินหลัก (ผู้ดูแลระบบสูงสุด)', role: 'admin' } };
      }
    }
  } catch {
    // เซิร์ฟเวอร์ออฟไลน์หรือไม่สามารถติดต่อได้ ให้ข้ามไปตรวจกับ Google Apps Script ต่อไป
  }

  // 3. ตรวจสอบกับ Google Apps Script โดยตรง (รองรับทั้งแอดมินหลักที่เปลี่ยนรหัสในชีต และแอดมินรองจากอุปกรณ์อื่น/PWA)
  try {
    const d = await postScript({ action: 'verifyAdminPasscode', passcode: trimmed });
    if (d?.valid) {
      try {
        sessionStorage.setItem(ADMIN_KEY_STORAGE, trimmed);
        localStorage.setItem(ADMIN_KEY_STORAGE, trimmed);
      } catch {}
      return {
        valid: true,
        user: {
          id: String(d.id || 'master'),
          name: String(d.name || (d.role === 'subadmin' ? 'แอดมินรอง' : 'แอดมินหลัก (ผู้ดูแลระบบสูงสุด)')),
          role: (d.role as 'admin' | 'subadmin') || 'admin',
        },
      };
    }
  } catch {}

  // 4. Fallback ตรวจกับ verifySubAdmin เดิม
  try {
    const d = await postScript({ action: 'verifySubAdmin', passcode: trimmed });
    if (d?.valid) {
      try {
        sessionStorage.setItem(ADMIN_KEY_STORAGE, trimmed);
        localStorage.setItem(ADMIN_KEY_STORAGE, trimmed);
      } catch {}
      return { valid: true, user: { id: String(d.id), name: `${d.name} (แอดมินรอง)`, role: 'subadmin' } };
    }
  } catch {}

  return { valid: false };
}

/** รหัสที่แอดมินกรอกตอนล็อกอิน ใช้ยืนยันตัวตนเวลาบันทึกประกาศไปยัง Google Sheet */
export function getAdminKey(): string {
  if (typeof window === 'undefined') return '';
  try {
    return sessionStorage.getItem(ADMIN_KEY_STORAGE) || localStorage.getItem(ADMIN_KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

export function getAdminSession(): { id: string; name: string; role: 'admin' | 'subadmin' } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_ADMIN_SESSION) || localStorage.getItem(STORAGE_KEY_ADMIN_SESSION);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAdminSession(user: { id: string; name: string; role: 'admin' | 'subadmin' } | null): void {
  if (typeof window === 'undefined') return;
  if (!user) {
    try {
      sessionStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
      sessionStorage.removeItem(ADMIN_KEY_STORAGE);
      localStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
      localStorage.removeItem(ADMIN_KEY_STORAGE);
    } catch {}
  } else {
    try {
      sessionStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(user));
    } catch {}
  }
}
