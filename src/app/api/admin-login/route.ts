import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * ตรวจรหัสแอดมินหลักฝั่งเซิร์ฟเวอร์ — รหัสอยู่ใน Environment Variable ชื่อ ADMIN_PASSCODE
 * (Vercel → Settings → Environment Variables) ไม่อยู่ในโค้ดที่ส่งไปที่เบราว์เซอร์
 */
export async function POST(req: Request) {
  const expected = process.env.ADMIN_PASSCODE;
  if (!expected) {
    return NextResponse.json(
      { valid: false, configured: false, message: 'ยังไม่ได้ตั้งค่า ADMIN_PASSCODE บนเซิร์ฟเวอร์' },
      { status: 503 }
    );
  }

  let passcode = '';
  try {
    const body = await req.json();
    passcode = String(body?.passcode ?? '').trim();
  } catch {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const a = Buffer.from(passcode);
  const b = Buffer.from(expected.trim());
  const valid = a.length === b.length && timingSafeEqual(a, b);

  // หน่วงเล็กน้อยเพื่อลดการเดารหัสถี่ ๆ
  if (!valid) await new Promise((r) => setTimeout(r, 600));
  return NextResponse.json({ valid }, { status: valid ? 200 : 401 });
}
