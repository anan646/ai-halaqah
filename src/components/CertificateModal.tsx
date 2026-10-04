'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Award, Printer, X, Sparkles, Download, CheckCircle2 } from 'lucide-react';
import { Student, GroupLevel } from '@/lib/types';
import { getStudentMajor, getStudentLevel, getSemesterSettings } from '@/lib/data-store';
import {
  CertificateConfig,
  CERTIFICATE_TEMPLATES,
  getCertificateConfig,
} from '@/lib/certificate-config';

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
  const [config, setConfig] = useState<CertificateConfig>(getCertificateConfig());

  useEffect(() => {
    setConfig(getCertificateConfig());
  }, []);

  const currentTemplate =
    CERTIFICATE_TEMPLATES.find((t) => t.id === config.templateId) || CERTIFICATE_TEMPLATES[0];

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

  // 1. Dedicated Print Handler
  const handlePrint = () => {
    window.print();
  };

  // 2. Dedicated Save PDF Handler (Separated as requested)
  const handleSavePdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('กรุณาอนุญาตป๊อปอัปเพื่อเปิดหน้าต่างบันทึก PDF');
      return;
    }
    const certEl = document.getElementById('printable-certificate');
    if (!certEl) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>เกียรติบัตร_${student.studentId}_${student.fullName}.pdf</title>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          @page { size: A4 landscape; margin: 0; }
          html, body {
            margin: 0;
            padding: 0;
            width: 297mm;
            height: 210mm;
            overflow: hidden;
            font-family: 'Sarabun', sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background: #fff;
          }
          .cert-wrap {
            width: 297mm;
            height: 210mm;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            margin: 0;
          }
          .cert-wrap > div {
            width: 100% !important;
            height: 100% !important;
            max-width: none !important;
            aspect-ratio: auto !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
            padding: 12mm 15mm !important;
          }
        </style>
      </head>
      <body>
        <div class="cert-wrap">
          ${certEl.outerHTML}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const activeLogo = config.customLogoUrl || customLogo;
  const isHighDistinction = attendanceRate >= 90;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      {/* Print styles for full A4 Landscape */}
      <style jsx global>{`
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 297mm !important;
            height: 210mm !important;
            overflow: hidden !important;
            background: #ffffff !important;
          }
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
            width: 297mm !important;
            height: 210mm !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 12mm !important;
            box-shadow: none !important;
            border-radius: 0 !important;
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

      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-amber-200 overflow-hidden flex flex-col my-auto max-h-[96vh]">
        {/* Top Control Bar (Hidden on print) */}
        <div className="no-print bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 px-5 sm:px-7 py-3 text-white flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-2.5">
            <Award className="w-6 h-6 text-yellow-200 animate-pulse" />
            <div>
              <h3 className="font-black text-sm sm:text-base tracking-wide flex items-center gap-2">
                <span>วุฒิบัตรอิเล็กทรอนิกส์ (E-Certificate)</span>
                {isHighDistinction && (
                  <span className="text-[10px] bg-yellow-300 text-amber-950 font-black px-2 py-0.5 rounded-full">
                    เกียรตินิยม A+
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-amber-100 font-medium">
                ผ่านเกณฑ์กิจกรรมฮะละเกาะฮ์อัลกุรอาน (สถิติ {attendanceRate.toFixed(1)}%)
              </p>
            </div>
          </div>

          {/* Action buttons: Print & Save PDF separated clearly */}
          <div className="flex items-center gap-2">
            {/* Button 1: PRINT */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-white text-amber-950 hover:bg-amber-50 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
              title="สั่งพิมพ์ออกทางเครื่องพิมพ์"
            >
              <Printer className="w-3.5 h-3.5 text-amber-700" />
              <span>พิมพ์เกียรติบัตร</span>
            </button>

            {/* Button 2: SAVE AS PDF */}
            <button
              type="button"
              onClick={handleSavePdf}
              className="px-3.5 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
              title="บันทึกไฟล์เป็น PDF ขนาด A4 แนวนอน"
            >
              <Download className="w-3.5 h-3.5" />
              <span>บันทึกเป็น PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              title="ปิด"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Viewable & Printable Container */}
        <div className="p-3 sm:p-6 overflow-y-auto flex items-center justify-center bg-stone-100/70">
          <div
            id="printable-certificate"
            ref={printRef}
            className="w-full max-w-3xl aspect-[1.414/1] bg-white rounded-2xl p-6 sm:p-8 shadow-xl relative flex flex-col justify-between text-stone-800 font-sans select-none overflow-hidden"
            style={{
              backgroundImage: config.useCustomBackground && config.customBackgroundImage
                ? `url(${config.customBackgroundImage})`
                : currentTemplate.bgGradient,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: config.useCustomBackground
                ? 'none'
                : `8px double ${currentTemplate.borderColor}`,
            }}
          >
            {/* Ornamental Corner Frames (if not custom bg) */}
            {!config.useCustomBackground && (
              <>
                <div
                  className="absolute inset-2.5 border rounded-xl pointer-events-none"
                  style={{ borderColor: currentTemplate.innerBorderColor }}
                />
                <div
                  className="absolute top-2.5 left-2.5 w-8 h-8 border-t-4 border-l-4 rounded-tl pointer-events-none"
                  style={{ borderColor: currentTemplate.borderColor }}
                />
                <div
                  className="absolute top-2.5 right-2.5 w-8 h-8 border-t-4 border-r-4 rounded-tr pointer-events-none"
                  style={{ borderColor: currentTemplate.borderColor }}
                />
                <div
                  className="absolute bottom-2.5 left-2.5 w-8 h-8 border-b-4 border-l-4 rounded-bl pointer-events-none"
                  style={{ borderColor: currentTemplate.borderColor }}
                />
                <div
                  className="absolute bottom-2.5 right-2.5 w-8 h-8 border-b-4 border-r-4 rounded-br pointer-events-none"
                  style={{ borderColor: currentTemplate.borderColor }}
                />
              </>
            )}

            {/* Header: University & Faculty */}
            <div
              className={`text-center space-y-0.5 relative z-10 pt-1 flex flex-col ${
                config.logoPosition === 'top-left'
                  ? 'items-start text-left pl-2'
                  : config.logoPosition === 'top-right'
                  ? 'items-end text-right pr-2'
                  : 'items-center text-center'
              }`}
            >
              {config.showLogo && (
                <div className="mb-1">
                  {activeLogo ? (
                    <img
                      src={activeLogo}
                      alt="Logo"
                      className="h-10 sm:h-12 w-auto object-contain drop-shadow"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-500 flex items-center justify-center text-white shadow-md">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
              )}
              <h4
                className="text-xs sm:text-sm font-extrabold tracking-widest uppercase"
                style={{ color: currentTemplate.titleColor }}
              >
                {config.institutionName}
              </h4>
              <p className="text-[9px] sm:text-[10px] text-stone-500 font-semibold tracking-wider">
                {config.institutionSubName}
              </p>
              <div className="pt-1">
                <span
                  className="inline-block px-3.5 py-0.5 rounded-full text-xs font-black tracking-wide border shadow-xs"
                  style={{
                    backgroundColor: currentTemplate.accentBadgeBg,
                    color: currentTemplate.accentTextColor,
                    borderColor: currentTemplate.innerBorderColor,
                  }}
                >
                  {config.awardTitle}
                </span>
              </div>
            </div>

            {/* Recipient Details & Statement */}
            <div className="text-center space-y-1.5 my-auto py-2 relative z-10">
              <h1
                className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight"
                style={{ color: currentTemplate.titleColor }}
              >
                {student.fullName}
              </h1>

              <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] sm:text-xs font-semibold text-stone-600">
                {config.showStudentId && (
                  <span>รหัสนักศึกษา: <strong className="text-stone-900 font-mono">{student.studentId}</strong></span>
                )}
                {config.showMajor && (
                  <>
                    <span>•</span>
                    <span>สาขาวิชา: <strong className="text-stone-900">{major}</strong></span>
                  </>
                )}
                {config.showYearLevel && (
                  <>
                    <span>•</span>
                    <span>ชั้นปี: <strong className="text-stone-900">{student.yearLevel}</strong></span>
                  </>
                )}
              </div>

              <p className="text-[10px] sm:text-xs text-stone-700 max-w-lg mx-auto pt-1 leading-relaxed font-medium">
                {config.bodyText}{' '}
                <strong className="font-bold" style={{ color: currentTemplate.titleColor }}>
                  {config.activityTitle}
                </strong>{' '}
                {semester.semesterName} ปีการศึกษา {semester.academicYear}
              </p>

              {/* Stats & Prominent Honor Seal A+ (Fixed, NOT Sunken at the Bottom) */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {config.showAttendanceStats && (
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-xl text-[10px] sm:text-xs font-bold border"
                    style={{
                      backgroundColor: currentTemplate.accentBadgeBg,
                      borderColor: currentTemplate.innerBorderColor,
                      color: currentTemplate.accentTextColor,
                    }}
                  >
                    <span>สถิติการเข้าร่วม: <strong className="text-emerald-700">{attendanceRate.toFixed(1)}%</strong> ({totalPresent}/{totalSessions} ครั้ง)</span>
                    {config.showLevelLabel && (
                      <>
                        <span>|</span>
                        <span>{getLevelLabel(level)}</span>
                      </>
                    )}
                  </div>
                )}

                {/* Grade A+ Seal: Visible right with stats, perfectly proportioned */}
                {config.showHonorBadgeA && isHighDistinction && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[10px] sm:text-xs font-black shadow-md border border-yellow-300">
                    <Award className="w-3.5 h-3.5 text-yellow-100" />
                    <span>เกียรตินิยม A+ (ผลการประเมินดีเยี่ยม)</span>
                  </div>
                )}
              </div>

              <p className="text-[9px] sm:text-[10px] text-stone-500 italic pt-1">
                {config.blessingText}
              </p>
            </div>

            {/* Signatures & Footer */}
            <div className="pt-2 border-t border-stone-200 flex items-end justify-between text-center text-[10px] sm:text-xs relative z-10 pb-0.5">
              {/* Signatory 1 */}
              <div className="space-y-0.5 w-36 sm:w-44">
                <div className="border-b border-stone-400 w-28 mx-auto mb-1 h-6 flex items-end justify-center">
                  <span className="font-serif italic text-stone-400 text-[11px]">
                    {config.signatory1Title}
                  </span>
                </div>
                <p className="font-bold text-stone-800 text-[10px] sm:text-[11px]">
                  {config.signatory1Name}
                </p>
                <p className="text-[9px] text-stone-500">{config.signatory1Role}</p>
              </div>

              {/* Middle Seal & Date */}
              <div className="text-center">
                <div
                  className="w-9 h-9 rounded-full border-2 mx-auto flex items-center justify-center mb-0.5"
                  style={{
                    borderColor: currentTemplate.borderColor,
                    backgroundColor: currentTemplate.accentBadgeBg,
                  }}
                >
                  <Sparkles className="w-5 h-5 text-amber-600" />
                </div>
                {config.showDocRef && (
                  <span className="text-[8px] sm:text-[9px] text-stone-400 block font-mono">
                    EDU-HALAQAH-{student.studentId}
                  </span>
                )}
                {config.showDate && (
                  <span className="text-[8px] sm:text-[9px] text-stone-400 block">
                    ออก ณ วันที่ {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                )}
              </div>

              {/* Signatory 2 */}
              <div className="space-y-0.5 w-36 sm:w-44">
                <div className="border-b border-stone-400 w-28 mx-auto mb-1 h-6 flex items-end justify-center">
                  <span className="font-serif italic text-stone-400 text-[11px]">
                    {config.signatory2Title}
                  </span>
                </div>
                <p className="font-bold text-stone-800 text-[10px] sm:text-[11px]">
                  {config.signatory2Name}
                </p>
                <p className="text-[9px] text-stone-500">{config.signatory2Role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info in dialog */}
        <div className="no-print bg-stone-50 px-5 sm:px-7 py-2.5 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <span>💡 สามารถเลือก <strong>พิมพ์เกียรติบัตร</strong> หรือ <strong>บันทึกเป็น PDF</strong> ในรูปแบบ A4 แนวนอน</span>
          <button
            type="button"
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
