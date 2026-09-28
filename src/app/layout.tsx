import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ระบบเช็คชื่อกลุ่มศึกษาอัลกุรอาน (หะละเกาะห์)',
  description: 'ระบบบันทึกและติดตามการเข้าร่วมกลุ่มศึกษาอัลกุรอาน พร้อมแดชบอร์ดสรุปผลและส่งออกรายงาน',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">
        {children}
      </body>
    </html>
  );
}
