import { SubAdmin } from './types';

const ADMIN_KEY_STORAGE = 'halaqah_admin_key';
const STORAGE_KEY_SUB_ADMINS = 'halaqah_sub_admins_v1';
const STORAGE_KEY_ADMIN_SESSION = 'halaqah_active_admin_session';

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
    createdAt: new Date().toLocaleDateString('th-TH'),
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

  const matched = getSubAdmins().find((a) => a.passcode === trimmed);
  if (matched) {
    return { valid: true, user: { id: matched.id, name: matched.name + ' (แอดมินรอง)', role: 'subadmin' } };
  }

  try {
    const res = await fetch('/api/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: trimmed }),
    });
    if (res.status === 503) {
      return { valid: false, message: 'เซิร์ฟเวอร์ยังไม่ได้ตั้งค่ารหัสแอดมิน (ADMIN_PASSCODE) กรุณาติดต่อผู้ดูแลระบบ' };
    }
    const data = await res.json().catch(() => ({}));
    if (data?.valid) {
      try {
        sessionStorage.setItem(ADMIN_KEY_STORAGE, trimmed);
      } catch {}
      return { valid: true, user: { id: 'master', name: 'แอดมินหลัก (ผู้ดูแลระบบสูงสุด)', role: 'admin' } };
    }
  } catch {
    return { valid: false, message: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่' };
  }
  return { valid: false };
}

/** รหัสที่แอดมินกรอกตอนล็อกอิน ใช้ยืนยันตัวตนเวลาบันทึกประกาศไปยัง Google Sheet */
export function getAdminKey(): string {
  if (typeof window === 'undefined') return '';
  try {
    return sessionStorage.getItem(ADMIN_KEY_STORAGE) || '';
  } catch {
    return '';
  }
}
export function getAdminSession(): { id: string; name: string; role: 'admin' | 'subadmin' } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_ADMIN_SESSION);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAdminSession(user: { id: string; name: string; role: 'admin' | 'subadmin' } | null): void {
  if (typeof window === 'undefined') return;
  if (!user) {
    sessionStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
    sessionStorage.removeItem(ADMIN_KEY_STORAGE);
  } else {
    sessionStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(user));
  }
}
