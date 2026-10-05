'use client';

import React from 'react';
import { jsPDF } from 'jspdf';
import { CheckCircle2, ClipboardList, Users } from 'lucide-react';
import { PendingSnapshot, PendingRow, formatSnapshotTime } from '@/lib/pending-report';
import { renderElementToCanvas } from '@/lib/offscreen-render';

const PAGE_W = 794; // A4 @96dpi
const PAGE_H = 1123;
const ROWS_FIRST = 17;
const ROWS_NEXT = 22;

const PdfPage: React.FC<{
  snap: PendingSnapshot;
  rows: PendingRow[];
  startIndex: number;
  page: number;
  pages: number;
}> = ({ snap, rows, startIndex, page, pages }) => (
  <div
    style={{
      width: PAGE_W,
      height: PAGE_H,
      boxSizing: 'border-box',
      padding: '48px 44px',
      background: '#ffffff',
      color: '#2e1065',
      fontFamily: "'Sarabun','IBM Plex Sans Thai',sans-serif",
      position: 'relative',
    }}
  >
    <div style={{ height: 8, background: 'linear-gradient(90deg,#6b21a8,#a855f7)', position: 'absolute', left: 0, right: 0, top: 0 }} />
    {page === 0 && (
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 13, color: '#7e22ce', fontWeight: 600, letterSpacing: 1 }}>
          โครงการหะละเกาะห์ • คณะศึกษาศาสตร์ มหาวิทยาลัยฟาฏอนี
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.4, marginTop: 4 }}>
          กลุ่มที่ยังไม่มีการบันทึกการเช็คชื่อ
        </div>
        <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
          {snap.label ? `${snap.label} • ` : ''}ข้อมูล ณ {formatSnapshotTime(snap.t)}
        </div>
        <div
          style={{
            marginTop: 14,
            display: 'flex',
            gap: 12,
          }}
        >
          <div style={{ flex: 1, background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 14, padding: '10px 16px' }}>
            <div style={{ fontSize: 12, color: '#7e22ce', lineHeight: 1.5 }}>ยังไม่บันทึก</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#be123c', lineHeight: 1.3 }}>{snap.rows.length} กลุ่ม</div>
          </div>
          <div style={{ flex: 1, background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 14, padding: '10px 16px' }}>
            <div style={{ fontSize: 12, color: '#7e22ce', lineHeight: 1.5 }}>กลุ่มทั้งหมด</div>
            <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.3 }}>{snap.total} กลุ่ม</div>
          </div>
        </div>
      </div>
    )}
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
      <thead>
        <tr style={{ background: '#6b21a8', color: '#fff' }}>
          <th style={{ padding: '8px 6px', width: 40, lineHeight: 1.5 }}>ที่</th>
          <th style={{ padding: '8px 10px', textAlign: 'left', lineHeight: 1.5 }}>อาจารย์ผู้ดูแล</th>
          <th style={{ padding: '8px 10px', textAlign: 'left', lineHeight: 1.5 }}>กลุ่ม</th>
          <th style={{ padding: '8px 6px', width: 90, lineHeight: 1.5 }}>ชั้นปี/เพศ</th>
          <th style={{ padding: '8px 6px', width: 70, lineHeight: 1.5 }}>นศ. (คน)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={startIndex + i} style={{ background: i % 2 ? '#faf5ff' : '#ffffff' }}>
            <td style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '1px solid #f3e8ff', lineHeight: 1.5, color: '#7e22ce' }}>
              {startIndex + i + 1}
            </td>
            <td style={{ padding: '8px 10px', borderBottom: '1px solid #f3e8ff', fontWeight: 600, lineHeight: 1.5 }}>{r.teacher}</td>
            <td style={{ padding: '8px 10px', borderBottom: '1px solid #f3e8ff', lineHeight: 1.5 }}>{r.group}</td>
            <td style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '1px solid #f3e8ff', lineHeight: 1.5 }}>
              {r.year} • {r.gender}
            </td>
            <td style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '1px solid #f3e8ff', lineHeight: 1.5 }}>{r.students}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <div style={{ position: 'absolute', left: 44, right: 44, bottom: 28, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8' }}>
      <span>ระบบบันทึกการเช็คชื่อกลุ่มศึกษาอัลกุรอาน (หะละเกาะห์)</span>
      <span>
        หน้า {page + 1}/{pages}
      </span>
    </div>
  </div>
);

/** สร้างไฟล์ PDF (A4 แนวตั้ง) ของรายงาน และดาวน์โหลดทันที */
export async function savePendingReportPdf(snap: PendingSnapshot): Promise<void> {
  const chunks: { rows: PendingRow[]; start: number }[] = [];
  let i = 0;
  let size = ROWS_FIRST;
  while (i < snap.rows.length || chunks.length === 0) {
    chunks.push({ rows: snap.rows.slice(i, i + size), start: i });
    i += size;
    size = ROWS_NEXT;
  }

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  for (let p = 0; p < chunks.length; p++) {
    const canvas = await renderElementToCanvas(
      <PdfPage snap={snap} rows={chunks[p].rows} startIndex={chunks[p].start} page={p} pages={chunks.length} />,
      PAGE_W,
      { scale: 2, height: PAGE_H }
    );
    if (p > 0) pdf.addPage();
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.93), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
  }
  const d = new Date(snap.t);
  const stamp = isNaN(d.getTime()) ? '' : `_${d.toISOString().slice(0, 10)}`;
  pdf.save(`กลุ่มที่ยังไม่บันทึกเช็คชื่อ${stamp}.pdf`);
}

/** หน้าสาธารณะที่เปิดจากลิงก์แชร์ — ไม่ต้องล็อกอิน */
export const PublicPendingReportPage: React.FC<{
  snap: PendingSnapshot | null;
  onGoHome: () => void;
}> = ({ snap, onGoHome }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50/40">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-5">
        <div className="rounded-3xl bg-gradient-to-br from-purple-700 via-purple-800 to-indigo-900 text-white p-5 sm:p-7 shadow-xl">
          <div className="flex items-center gap-2 text-purple-200 text-xs font-bold tracking-wide">
            <ClipboardList className="w-4 h-4" />
            รายงานติดตามหะละเกาะห์
          </div>
          <h1 className="text-xl sm:text-3xl font-black mt-1.5 leading-snug">กลุ่มที่ยังไม่มีการบันทึกการเช็คชื่อ</h1>
          {snap && (
            <p className="text-xs sm:text-sm text-purple-200 mt-1.5">
              {snap.label ? `${snap.label} • ` : ''}ข้อมูล ณ {formatSnapshotTime(snap.t)}
            </p>
          )}
        </div>

        {!snap ? (
          <div className="rounded-3xl bg-white border border-rose-200 p-8 text-center space-y-3">
            <p className="font-bold text-rose-700">ลิงก์รายงานไม่ถูกต้องหรือไม่สมบูรณ์</p>
            <p className="text-sm text-slate-500">กรุณาขอลิงก์ใหม่จากผู้ดูแลระบบ (ลิงก์อาจถูกตัดสั้นตอนคัดลอก)</p>
            <button
              type="button"
              onClick={onGoHome}
              className="px-5 py-2.5 rounded-xl bg-purple-800 text-white text-sm font-bold"
            >
              ไปหน้าแรก
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white border border-purple-100 p-4 shadow-sm">
                <div className="text-xs font-bold text-purple-600">ยังไม่บันทึก</div>
                <div className="text-3xl font-black text-rose-600 mt-0.5">
                  {snap.rows.length}
                  <span className="text-sm font-bold text-slate-400 ml-1">กลุ่ม</span>
                </div>
              </div>
              <div className="rounded-2xl bg-white border border-purple-100 p-4 shadow-sm">
                <div className="text-xs font-bold text-purple-600">กลุ่มทั้งหมด</div>
                <div className="text-3xl font-black text-purple-950 mt-0.5">
                  {snap.total}
                  <span className="text-sm font-bold text-slate-400 ml-1">กลุ่ม</span>
                </div>
              </div>
            </div>

            {snap.rows.length === 0 ? (
              <div className="rounded-3xl bg-white border border-emerald-200 p-10 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="font-black text-emerald-800">ทุกกลุ่มบันทึกการเช็คชื่อครบแล้ว</p>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {snap.rows.map((r, idx) => (
                  <li
                    key={idx}
                    className="rounded-2xl bg-white border border-purple-100 shadow-sm p-3.5 flex items-center gap-3"
                  >
                    <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 text-xs font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-purple-950 text-sm truncate">{r.teacher}</div>
                      <div className="text-xs text-slate-500 truncate">
                        {r.group} • {r.year} • {r.gender}
                      </div>
                    </div>
                    <div className="text-xs font-bold text-purple-700 flex items-center gap-1 shrink-0">
                      <Users className="w-3.5 h-3.5" />
                      {r.students}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[11px] text-slate-400 text-center">
              รายงานนี้เป็นข้อมูล ณ เวลาที่แชร์ หากต้องการข้อมูลล่าสุดโปรดขอลิงก์ใหม่จากผู้ดูแลระบบ
            </p>
          </>
        )}
      </div>
    </div>
  );
};
