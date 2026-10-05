import { NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * ค่า SHA-256 ของรหัสแอดมินหลักที่ใช้เมื่อไม่ได้ตั้ง ADMIN_PASSCODE
 * (ถ้าตั้ง ADMIN_PASSCODE ใน Vercel → Environment Variables จะใช้ค่านั้นแทน)
 */
const DEFAULT_PASSCODE_SHA256 = '7cedcfc143f7c3a15869169ed87af666741d557df898b0c0d7d956444e54d0ec';

const sha256 = (s: string) => createHash('sha256').update(s).digest();

/** ตรวจรหัสแอดมินหลักฝั่งเซิร์ฟเวอร์ — รหัสไม่ถูกส่งไปที่เบราว์เซอร์ */
export async function POST(req: Request) {
  let passcode = '';
  try {
    const body = await req.json();
    passcode = String(body?.passcode ?? '').trim();
  } catch {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const envPass = process.env.ADMIN_PASSCODE?.trim();
  const expected = envPass ? sha256(envPass) : Buffer.from(DEFAULT_PASSCODE_SHA256, 'hex');
  const valid = !!passcode && timingSafeEqual(sha256(passcode), expected);

  // หน่วงเล็กน้อยเพื่อลดการเดารหัสถี่ ๆ
  if (!valid) await new Promise((r) => setTimeout(r, 600));
  return NextResponse.json({ valid }, { status: valid ? 200 : 401 });
}
