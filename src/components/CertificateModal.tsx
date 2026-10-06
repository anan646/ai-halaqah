'use client';

import React, { useEffect, useState } from 'react';
import { Award, Printer, X, Download, CheckCircle2, Loader2, Lock } from 'lucide-react';
import { Student } from '@/lib/types';
import { getStudentMajor, getStudentLevel, getSemesterSettings, SEMESTER_SETTINGS_UPDATED_EVENT } from '@/lib/data-store';
import { CertificateConfig, getCertificateConfig, CERT_CONFIG_UPDATED_EVENT } from '@/lib/certificate-config';
import { saveCertificatePdf, printCertificate } from '@/lib/certificate-export';
import { CertificateCanvas, CertificatePreview, CertificateStudentData } from './CertificateCanvas';

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
  const [semester, setSemester] = useState(() => getSemesterSettings());
  const [config, setConfig] = useState<CertificateConfig>(() => getCertificateConfig());
  const [busy, setBusy] = useState<'print' | 'pdf' | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const handleUpdate = () => setConfig(getCertificateConfig());
    const handleSemester = () => setSemester(getSemesterSettings());
    handleUpdate();
    handleSemester();
    window.addEventListener(CERT_CONFIG_UPDATED_EVENT, handleUpdate);
    window.addEventListener(SEMESTER_SETTINGS_UPDATED_EVENT, handleSemester);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('storage', handleSemester);
    return () => {
      window.removeEventListener(CERT_CONFIG_UPDATED_EVENT, handleUpdate);
      window.removeEventListener(SEMESTER_SETTINGS_UPDATED_EVENT, handleSemester);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('storage', handleSemester);
    };
  }, []);

  // การป้องกันระดับความปลอดภัย: เฉพาะนักศึกษาที่ผ่านเกณฑ์ 80% ขึ้นไปเท่านั้นที่จะได้รับเกียรติบัตร
  if (attendanceRate < 80) {
    return (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-purple-950/70 backdrop-blur-sm animate-fadeIn"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-7 text-center space-y-4 animate-scaleUp">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-purple-950">เกียรติบัตรถูกล็อก</h3>
            <p className="text-xs text-purple-800/80 leading-relaxed">
              ขออภัย ระบบกำหนดให้นักศึกษาที่มีอัตราการเข้าร่วมกิจกรรม <strong className="text-purple-950">80.0% ขึ้นไป</strong> เท่านั้นจึงจะมีสิทธิ์ได้รับและพิมพ์เกียรติบัตร
            </p>
            <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-100 text-xs font-bold text-purple-900 space-y-1">
              <div>
                อัตราการเข้าร่วมปัจจุบันของคุณ: <span className="text-rose-600 font-black text-sm">{attendanceRate.toFixed(1)}%</span>
              </div>
              <div className="text-[11px] text-purple-600/90 font-medium">
                (เข้าร่วม {totalPresent} / {totalSessions} ครั้ง • ยังไม่ถึงเกณฑ์ 80%)
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-2xl bg-purple-900 hover:bg-purple-950 text-white font-extrabold text-sm transition active:scale-95 shadow-md shadow-purple-950/20"
          >
            รับทราบและปิด
          </button>
        </div>
      </div>
    );
  }

  const data: CertificateStudentData = {
    fullName: student.fullName,
    studentId: student.studentId,
    major: getStudentMajor(student),
    yearLevel: student.yearLevel,
    groupName: student.groupName,
    rate: attendanceRate,
    present: totalPresent,
    total: totalSessions,
    levelLabel: `ระดับ ${getStudentLevel(student)}`,
  };
  const semesterLabel = `${semester.semesterName} ปีการศึกษา ${semester.academicYear}`;
  const isHonor = attendanceRate >= 90;

  const canvasEl = (
    <CertificateCanvas
      config={config}
      student={data}
      logo={customLogo}
      semesterLabel={semesterLabel}
      isHonor={isHonor}
    />
  );

  const handlePrint = async () => {
    setBusy('print');
    try {
      await printCertificate(canvasEl, `เกียรติบัตร_${student.studentId}`);
    } catch (err) {
      console.error('Print failed:', err);
      alert('ไม่สามารถเตรียมพิมพ์ได้ กรุณาลองใหม่อีกครั้ง หรือใช้ปุ่ม "บันทึกเป็น PDF"');
    } finally {
      setBusy(null);
    }
  };

  const handleSavePdf = async () => {
    setBusy('pdf');
    try {
      const cleanName = (student.fullName || 'นักศึกษา').replace(/[/\\?%*:|"<>]/g, '_');
      await saveCertificatePdf(canvasEl, `เกียรติบัตร_${student.studentId}_${cleanName}.pdf`);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Save PDF failed:', err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF กรุณาลองใหม่อีกครั้ง');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-5 bg-purple-950/70 backdrop-blur-sm animate-fadeIn overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[96vh]">
        <div className="bg-gradient-to-r from-purple-800 via-purple-900 to-indigo-950 px-4 sm:px-6 py-3 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm sm:text-base truncate">เกียรติบัตรของท่าน</h3>
              <p className="text-[11px] text-purple-200 truncate">
                เข้าร่วม {attendanceRate.toFixed(1)}%{isHonor ? ' • เกียรตินิยม A+' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              disabled={!!busy}
              className="px-3 py-2 bg-white text-purple-900 hover:bg-purple-50 disabled:opacity-60 rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
            >
              {busy === 'print' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
              <span>{busy === 'print' ? 'กำลังเตรียม...' : 'พิมพ์'}</span>
            </button>
            <button
              type="button"
              onClick={handleSavePdf}
              disabled={!!busy}
              className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 disabled:opacity-60 ${
                saved ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-purple-950 hover:bg-amber-300'
              }`}
            >
              {busy === 'pdf' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : saved ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{busy === 'pdf' ? 'กำลังสร้าง...' : saved ? 'บันทึกแล้ว' : 'บันทึก PDF'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition"
              aria-label="ปิด"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-6 overflow-y-auto bg-purple-50/60">
          <div className="mx-auto max-w-[960px] rounded-lg shadow-xl overflow-hidden ring-1 ring-purple-200">
            <CertificatePreview
              config={config}
              student={data}
              logo={customLogo}
              semesterLabel={semesterLabel}
              isHonor={isHonor}
            />
          </div>
        </div>

        <div className="px-5 py-2.5 border-t border-purple-100 text-[11px] text-purple-700/80 text-center shrink-0">
          ไฟล์ที่พิมพ์และบันทึกเป็นกระดาษ A4 แนวนอน ตรงกับตัวอย่างที่เห็นด้านบน
        </div>
      </div>
    </div>
  );
};
