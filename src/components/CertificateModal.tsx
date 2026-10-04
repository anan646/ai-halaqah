'use client';

import React, { useRef } from 'react';
import { Award, Printer, X, CheckCircle2, Sparkles, Download } from 'lucide-react';
import { Student, GroupLevel } from '@/lib/types';
import { getStudentMajor, getStudentLevel, getSemesterSettings } from '@/lib/data-store';

interface CertificateModalProps {
  student: Student;
  attendanceRate: number;
  totalPresent: number;
  totalSessions: number;
  customLogo?: string;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  student,
  attendanceRate,
  totalPresent,
  totalSessions,
  customLogo,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const semester = getSemesterSettings();
  const major = getStudentMajor(student);
  const level = getStudentLevel(student);

  const getLevelLabel = (lvl: GroupLevel) => {
    switch (lvl) {
      case '01':
        return 'ระดับ 01';
      case '02':
        return 'ระดับ 02';
      case '03':
        return 'ระดับ 03';
      default:
        return 'ระดับ 01';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-certificate,
          #printable-certificate * {
            visibility: visible !important;
          }
          #printable-certificate {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 20mm !important;
            box-shadow: none !important;
            border-width: 8px !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
        }
        @page {
          size: A4 landscape;
          margin: 0;
        }
      `}</style>

      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-amber-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Top Control Bar (Hidden on print) */}
        <div className="no-print bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 px-6 py-3.5 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <Award className="w-6 h-6 text-yellow-200 animate-pulse" />
            <div>
              <h3 className="font-black text-sm sm:text-base tracking-wide">
                วุฒิบัตรอิเล็กทรอนิกส์ (E-Certificate)
              </h3>
              <p className="text-[11px] text-amber-100 font-medium">
                ผ่านเกณฑ์กิจกรรมฮะละเกาะฮ์อัลกุรอาน (สถิติ {attendanceRate.toFixed(1)}%)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-white text-amber-900 hover:bg-amber-50 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-700" />
              <span>พิมพ์ / บันทึก PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              title="ปิด"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Viewable & Printable Container */}
        <div className="p-4 sm:p-8 overflow-y-auto flex items-center justify-center bg-stone-100/60">
          <div
            id="printable-certificate"
            ref={printRef}
            className="w-full max-w-3xl aspect-[1.414/1] bg-white rounded-2xl p-6 sm:p-10 border-[10px] border-double border-amber-600 shadow-xl relative flex flex-col justify-between text-stone-800 font-sans select-none overflow-hidden"
            style={{
              backgroundImage: 'radial-gradient(circle at center, #ffffff 60%, #fffbeb 100%)',
            }}
          >
            {/* Ornamental Corner Frames */}
            <div className="absolute top-2 left-2 w-10 h-10 border-t-4 border-l-4 border-amber-500 rounded-tl-lg pointer-events-none" />
            <div className="absolute top-2 right-2 w-10 h-10 border-t-4 border-r-4 border-amber-500 rounded-tr-lg pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-10 h-10 border-b-4 border-l-4 border-amber-500 rounded-bl-lg pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-10 h-10 border-b-4 border-r-4 border-amber-500 rounded-br-lg pointer-events-none" />

            {/* Inner Golden Border */}
            <div className="absolute inset-3 border border-amber-300 rounded-xl pointer-events-none" />

            {/* Header: University & Faculty */}
            <div className="text-center space-y-1 relative z-10 pt-2">
              <div className="flex items-center justify-center gap-3 mb-2">
                {customLogo ? (
                  <img
                    src={customLogo}
                    alt="Logo"
                    className="h-14 sm:h-16 w-auto object-contain drop-shadow"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-500 flex items-center justify-center text-white shadow-md">
                    <Award className="w-7 h-7 text-white" />
                  </div>
                )}
              </div>
              <h4 className="text-xs sm:text-sm font-semibold tracking-widest text-amber-800 uppercase">
                คณะศึกษาศาสตร์ มหาวิทยาลัยฟาฏอนี
              </h4>
              <p className="text-[10px] sm:text-xs text-stone-500 font-medium">
                FACULTY OF EDUCATION, FATONI UNIVERSITY
              </p>
              <div className="pt-2">
                <span className="inline-block px-4 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 font-black text-sm sm:text-base tracking-wide">
                  เกียรติบัตรฉบับนี้มอบให้ไว้เพื่อแสดงว่า
                </span>
              </div>
            </div>

            {/* Recipient Details */}
            <div className="text-center space-y-2 my-auto py-2 relative z-10">
              <h1 className="text-xl sm:text-3xl font-black text-stone-900 tracking-tight">
                {student.fullName}
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-stone-600">
                <span>รหัสนักศึกษา: <strong className="text-stone-900 font-mono">{student.studentId}</strong></span>
                <span>•</span>
                <span>สาขาวิชา: <strong className="text-stone-900">{major}</strong></span>
                <span>•</span>
                <span>ชั้นปี: <strong className="text-stone-900">{student.yearLevel}</strong></span>
              </div>

              <p className="text-xs sm:text-sm text-stone-700 max-w-xl mx-auto pt-2 leading-relaxed font-medium">
                ได้เข้าร่วมและผ่านเกณฑ์การประเมินใน{' '}
                <strong className="font-bold text-amber-900">
                  โครงการฮะละเกาะฮ์อัลกุรอาน
                </strong>{' '}
                {semester.semesterName} ปีการศึกษา {semester.academicYear}
              </p>

              <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-950 font-bold">
                <span>สถิติการเข้าร่วม: <strong className="text-emerald-700">{attendanceRate.toFixed(1)}%</strong> ({totalPresent}/{totalSessions} ครั้ง)</span>
                <span>|</span>
                <span>{getLevelLabel(level)}</span>
              </div>

              <p className="text-[11px] sm:text-xs text-stone-500 italic pt-1">
                "ขอให้อัลลอฮ์ (ซ.บ.) ทรงประทานความรู้ ความบะรอกัต และความเจริญก้าวหน้าแก่ท่านสืบไป"
              </p>
            </div>

            {/* Signatures & Footer */}
            <div className="pt-4 border-t border-amber-100 flex items-end justify-between text-center text-xs relative z-10 pb-1">
              <div className="space-y-1 w-44 sm:w-52">
                <div className="border-b border-stone-400 w-36 mx-auto mb-1 h-8 flex items-end justify-center">
                  <span className="font-serif italic text-stone-400 text-sm">ผู้รับผิดชอบโครงการ</span>
                </div>
                <p className="font-bold text-stone-800 text-[11px] sm:text-xs">
                  (อาจารย์มุสลิม หะยีสะมะแอ)
                </p>
                <p className="text-[10px] text-stone-500">
                  ประธานโครงการฮะละเกาะฮ์อัลกุรอาน
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 rounded-full border-2 border-amber-400 bg-amber-50/50 mx-auto flex items-center justify-center text-amber-800 mb-1">
                  <Sparkles className="w-6 h-6 text-amber-600" />
                </div>
                <span className="text-[10px] text-stone-400 block font-mono">
                  EDU-HALAQAH-{student.studentId}
                </span>
                <span className="text-[9px] text-stone-400 block">
                  ออก ณ วันที่ {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>

              <div className="space-y-1 w-44 sm:w-52">
                <div className="border-b border-stone-400 w-36 mx-auto mb-1 h-8 flex items-end justify-center">
                  <span className="font-serif italic text-stone-400 text-sm">คณบดี</span>
                </div>
                <p className="font-bold text-stone-800 text-[11px] sm:text-xs">
                  (ผศ.ดร. อับดุลฮาลิม สือแม)
                </p>
                <p className="text-[10px] text-stone-500">
                  คณบดีคณะศึกษาศาสตร์ มหาวิทยาลัยฟาฏอนี
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info in dialog */}
        <div className="no-print bg-stone-50 px-6 py-3 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <span>💡 สามารถกด <strong>พิมพ์ / บันทึก PDF</strong> เพื่อเลือกบันทึกเป็นไฟล์ PDF ขนาด A4 แนวนอน</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-200 text-stone-700 font-semibold transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
