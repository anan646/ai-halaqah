/**
 * รายงาน "กลุ่มที่ยังไม่มีการบันทึกการเช็คชื่อ"
 *
 * ข้อมูลของระบบนี้เก็บในเบราว์เซอร์ของแอดมิน จึงไม่มีเซิร์ฟเวอร์กลางให้คนอื่นเปิดดูตรง ๆ
 * ลิงก์แชร์จึงฝัง "ภาพถ่าย (snapshot)" ของรายงาน ณ เวลาที่กดแชร์ไว้ในตัวลิงก์เอง
 * ผู้เปิดลิงก์ไม่ต้องล็อกอินและเห็นรายงานเหมือนกันทุกคน
 */
export interface PendingRow {
  teacher: string;
  group: string;
  year: string;
  gender: string;
  students: number;
}

export interface PendingSnapshot {
  v: 1;
  /** ISO time ที่สร้างรายงาน */
  t: string;
  /** เช่น "ภาคเรียนที่ 1 ปีการศึกษา 2568" */
  label: string;
  /** จำนวนกลุ่มทั้งหมดในระบบ */
  total: number;
  rows: PendingRow[];
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(b64: string): string {
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeSnapshot(s: PendingSnapshot): string {
  const compact = {
    v: s.v,
    t: s.t,
    l: s.label,
    n: s.total,
    r: s.rows.map((r) => [r.teacher, r.group, r.year, r.gender, r.students]),
  };
  return toBase64Url(JSON.stringify(compact));
}

export function decodeSnapshot(encoded: string): PendingSnapshot | null {
  try {
    const o = JSON.parse(fromBase64Url(encoded));
    if (!o || o.v !== 1 || !Array.isArray(o.r)) return null;
    return {
      v: 1,
      t: String(o.t || ''),
      label: String(o.l || ''),
      total: Number(o.n) || 0,
      rows: o.r.map((r: any[]) => ({
        teacher: String(r[0] ?? ''),
        group: String(r[1] ?? ''),
        year: String(r[2] ?? ''),
        gender: String(r[3] ?? ''),
        students: Number(r[4]) || 0,
      })),
    };
  } catch {
    return null;
  }
}

export function buildPendingShareUrl(s: PendingSnapshot): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}?view=pending-report&d=${encodeSnapshot(s)}`;
}

export function formatSnapshotTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  return (
    d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) +
    ' เวลา ' +
    d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) +
    ' น.'
  );
}
