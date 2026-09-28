import { SubAdmin } from './types';

export const MASTER_ADMIN_PASSCODE = '71300807';
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
  if (trimmedPass === MASTER_ADMIN_PASSCODE) {
    return { success: false, message: 'ไม่สามารถใช้รหัสผ่านนี้ได้ (ตรงกับรหัสแอดมินหลัก)' };
  }

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

export function verifyAdminPasscode(passcode: string): {
  valid: boolean;
  user?: { id: string; name: string; role: 'admin' | 'subadmin' };
} {
  const trimmed = passcode.trim();
  if (trimmed === MASTER_ADMIN_PASSCODE) {
    return {
      valid: true,
      user: { id: 'master', name: 'แอดมินหลัก (ผู้ดูแลระบบสูงสุด)', role: 'admin' },
    };
  }

  const subAdmins = getSubAdmins();
  const matched = subAdmins.find((a) => a.passcode === trimmed);
  if (matched) {
    return {
      valid: true,
      user: { id: matched.id, name: `${matched.name} (แอดมินรอง)`, role: 'subadmin' },
    };
  }

  return { valid: false };
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
  } else {
    sessionStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(user));
  }
}
