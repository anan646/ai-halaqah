'use client';

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Users,
  Calendar,
  CalendarDays,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Database,
  Lock,
  Clock,
  Award,
  Download,
  Printer,
  FileText,
  BookOpen,
} from 'lucide-react';
import { ModalPortal } from './ModalPortal';

export type TutorialRole = 'student' | 'faculty';

interface OnboardingTutorialModalProps {
  isOpen: boolean;
  role: TutorialRole;
  onClose: () => void;
  onDismissForever?: () => void;
}

interface TutorialStep {
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ElementType;
  iconBg: string;
  description: string;
  highlights: { title: string; desc: string; icon: React.ElementType }[];
  tip?: string;
}

const STUDENT_TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: '1. ค้นหาด้วยรหัสนักศึกษา',
    subtitle: 'ระบุรหัสนักศึกษาเพื่อดูผลการเข้าหะละเกาะห์',
    badge: 'ขั้นตอนที่ 1 • ค้นหาข้อมูล',
    icon: GraduationCap,
    iconBg: 'bg-purple-100 text-purple-700',
    description:
      'ตรวจสอบประวัติและสถิติการเข้าร่วมกลุ่มศึกษาอัลกุรอานของตนเองได้สะดวกรวดเร็วและเป็นส่วนตัว',
    highlights: [
      {
        title: 'กรอกรหัสนักศึกษา 9 หลัก',
        desc: 'พิมพ์รหัสนักศึกษาของท่านให้ครบถ้วนในช่องค้นหา (เช่น 681441001 หรือ 67...)',
        icon: Lock,
      },
      {
        title: 'กดปุ่ม "ค้นหา" หรือ Enter',
        desc: 'ระบบจะดึงข้อมูลสถิติของรหัสท่านขึ้นมาแสดงผลบนแดชบอร์ดทันที',
        icon: ChevronRight,
      },
      {
        title: 'หากมีประกาศจากผู้ดูแลระบบ',
        desc: 'หากมีประกาศด่วนหรือข้อความสำคัญ ระบบจะแสดงป๊อปอัปแจ้งเตือนกลางหน้าจอทันที',
        icon: Sparkles,
      },
    ],
    tip: 'สามารถเข้าดูข้อมูลได้ทุกอุปกรณ์ ทั้งสมาร์ตโฟน แท็บเล็ต และคอมพิวเตอร์',
  },
  {
    title: '2. ผลการประเมิน เกียรติบัตร และสถิติ',
    subtitle: 'ตรวจสอบอัตราการเข้าร่วม และเกียรติบัตรออนไลน์ (E-Certificate)',
    badge: 'ขั้นตอนที่ 2 • สถิติ & เกียรติบัตร',
    icon: Award,
    iconBg: 'bg-amber-100 text-amber-800',
    description:
      'แดชบอร์ดส่วนบุคคลสรุปผลการเข้าร่วมกิจกรรมหะละเกาะห์และสถานะการประเมินอย่างละเอียด',
    highlights: [
      {
        title: 'อัตราการเข้าร่วม (เกณฑ์ผ่าน 80%)',
        desc: 'สรุปเปอร์เซ็นต์และสถิติจำนวนครั้งที่ มา / ขาด / ลา ทั้งหมดในภาคเรียน',
        icon: CheckCircle2,
      },
      {
        title: 'รับเกียรติบัตรออนไลน์ (E-Certificate)',
        desc: 'เมื่อผ่านเกณฑ์ 80% ป้ายรับเกียรติบัตรจะปรากฏเด่นด้านบน สามารถกดพิมพ์หรือบันทึก PDF ได้ทันที',
        icon: Award,
      },
      {
        title: 'เกียรตินิยม A+ (ผลประเมินดีเยี่ยม)',
        desc: 'นักศึกษาที่มีอัตราการเข้าร่วมตั้งแต่ 90% ขึ้นไป จะได้รับตราเกียรตินิยม A+ บนเกียรติบัตร',
        icon: Sparkles,
      },
    ],
    tip: 'หากมีข้อสงสัยเรื่องจำนวนครั้งที่บันทึก สามารถติดต่ออาจารย์ผู้ดูแลกลุ่มของท่านได้ทันที',
  },
  {
    title: '3. ความเป็นส่วนตัวและความปลอดภัย',
    subtitle: 'ระบบปกป้องข้อมูลส่วนบุคคล 100%',
    badge: 'ขั้นตอนที่ 3 • ความปลอดภัย',
    icon: ShieldCheck,
    iconBg: 'bg-emerald-100 text-emerald-800',
    description:
      'ระบบถูกออกแบบตามมาตรฐานความปลอดภัย ไม่เปิดเผยรายชื่อของนักศึกษาท่านอื่นต่อสาธารณะ',
    highlights: [
      {
        title: 'ค้นหาได้เฉพาะรหัสที่ถูกต้อง',
        desc: 'ระบบจะไม่แสดงรายการแนะนำหรือเดารหัส เพื่อป้องกันการเข้าถึงข้อมูลของผู้อื่น',
        icon: ShieldCheck,
      },
      {
        title: 'ปุ่ม "ออกจากข้อมูล"',
        desc: 'เมื่อตรวจสอบเสร็จสิ้น ให้กดปุ่ม "ออกจากข้อมูล" เพื่อล้างหน้าจอ โดยเฉพาะเมื่อใช้เครื่องสาธารณะ',
        icon: Lock,
      },
    ],
    tip: 'อย่าลืมกดปุ่ม "ออกจากข้อมูล" ทุกครั้งหลังใช้งานบนอุปกรณ์ส่วนกลางหรือห้องคอมพิวเตอร์',
  },
];

const FACULTY_TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: '1. การเข้าสู่ระบบและการเลือกกลุ่ม',
    subtitle: 'ยืนยันรหัสผ่านบุคลากร และเลือกกลุ่มที่รับผิดชอบ',
    badge: 'ขั้นตอนที่ 1 • เข้าสู่กลุ่ม',
    icon: Users,
    iconBg: 'bg-purple-100 text-purple-700',
    description:
      'อาจารย์และบุคลากรเข้าใช้งานผ่านรหัสผ่านที่ปลอดภัย และกรองกลุ่มตามเพศและชั้นปีได้อย่างรวดเร็ว',
    highlights: [
      {
        title: 'รหัสผ่านสำหรับบุคลากร',
        desc: 'กรอกรหัสผ่านเพื่อเข้าใช้งานในครั้งแรก ระบบจะจดจำเซสชันไว้เพื่อความสะดวก',
        icon: Lock,
      },
      {
        title: 'ตัวกรองกลุ่ม (เพศ และ ชั้นปี)',
        desc: 'สามารถเลือกแสดงเฉพาะกลุ่มชาย หรือกลุ่มหญิง ปี 2, 3 เพื่อค้นหากลุ่มของท่านได้ทันที',
        icon: Users,
      },
      {
        title: 'คลิกเข้าสู่กลุ่มของท่าน',
        desc: 'คลิกที่การ์ดกลุ่มเพื่อเปิดหน้าเช็คชื่อที่มีรายชื่อนักศึกษาในความดูแลของท่าน',
        icon: ChevronRight,
      },
    ],
    tip: 'รหัสผ่านสามารถขอรับได้จากผู้ดูแลระบบหลัก หรือแอดมินโครงการ',
  },
  {
    title: '2. การเช็คชื่อและการลงเวลาย้อนหลัง',
    subtitle: 'บันทึกสถานะ มา / ขาด / ลา สะดวก รวดเร็ว',
    badge: 'ขั้นตอนที่ 2 • เช็คชื่อ',
    icon: CheckCircle2,
    iconBg: 'bg-emerald-100 text-emerald-800',
    description:
      'แตะเปลี่ยนสถานะรายคน หรือใช้ปุ่มลัดเพื่อความรวดเร็ว พร้อมรองรับการบันทึกย้อนหลัง',
    highlights: [
      {
        title: 'ปุ่มลัด "มาทุกคน"',
        desc: 'สามารถกดปุ่มเดียวเพื่อตั้งค่าให้นักศึกษาทุกคนในกลุ่มมีสถานะ "มา" ได้ทันที',
        icon: Sparkles,
      },
      {
        title: 'แตะเปลี่ยนสถานะ มา / ขาด / ลา',
        desc: 'คลิกที่ปุ่มสถานะของนักศึกษาแต่ละคนเพื่อปรับเปลี่ยนได้อย่างแม่นยำ',
        icon: CheckCircle2,
      },
      {
        title: 'เลือกวันย้อนหลัง / สลับวัน',
        desc: 'สามารถคลิกแถบวันที่เพื่อเลือกวันย้อนหลังที่ต้องการดูหรือแก้ไขข้อมูลได้ตลอดเวลา',
        icon: CalendarDays,
      },
    ],
    tip: 'ระบบจะลงเวลาแบบเรียลไทม์ให้อัตโนมัติเมื่อมีการบันทึกสถานะ',
  },
  {
    title: '3. บันทึกและซิงค์ข้อมูลขึ้นระบบ',
    subtitle: 'ส่งข้อมูลขึ้นฐานข้อมูลและ Google Sheets อัตโนมัติ',
    badge: 'ขั้นตอนที่ 3 • บันทึกผล',
    icon: Database,
    iconBg: 'bg-blue-100 text-blue-800',
    description:
      'เมื่อตรวจเช็คเรียบร้อยแล้ว ให้กดปุ่มบันทึกข้อมูลเพื่อส่งผลเข้าสู่ระบบส่วนกลาง',
    highlights: [
      {
        title: 'กดปุ่ม "บันทึกข้อมูล"',
        desc: 'ระบบจะบันทึกผลและแสดงข้อความยืนยันความสำเร็จ ข้อมูลจะปลอดภัยไม่สูญหาย',
        icon: CheckCircle2,
      },
      {
        title: 'ซิงค์กับ Google Sheets อัตโนมัติ',
        desc: 'ข้อมูลจะถูกเชื่อมต่อไปยังระบบสเปรดชีตของคณะศึกษาศาสตร์โดยตรง',
        icon: Database,
      },
    ],
    tip: 'ตรวจสอบให้แน่ใจว่าได้กดปุ่ม "บันทึกข้อมูล" ทุกครั้งหลังการเช็คชื่อเสร็จสิ้น',
  },
];

export const OnboardingTutorialModal: React.FC<OnboardingTutorialModalProps> = ({
  isOpen,
  role,
  onClose,
  onDismissForever,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps = role === 'student' ? STUDENT_TUTORIAL_STEPS : FACULTY_TUTORIAL_STEPS;
  const currentStep = steps[currentStepIndex] || steps[0];
  const StepIcon = currentStep.icon;

  const totalSteps = steps.length;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const isFirstStep = currentStepIndex === 0;

  // Remember this device immediately upon opening or closing
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const key =
        role === 'student'
          ? 'halaqah_tutorial_student_dismissed_v1'
          : 'halaqah_tutorial_faculty_dismissed_v1';
      localStorage.setItem(key, 'true');
    }
  }, [isOpen, role]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (isLastStep) {
      handleCloseWithDismiss();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleCloseWithDismiss = () => {
    if (typeof window !== 'undefined') {
      const key =
        role === 'student'
          ? 'halaqah_tutorial_student_dismissed_v1'
          : 'halaqah_tutorial_faculty_dismissed_v1';
      localStorage.setItem(key, 'true');
    }
    onDismissForever?.();
    onClose();
  };

  // Dedicated Print & PDF Export Handler for the Manual
  const handlePrintOrDownloadPdf = () => {
    const roleTitle = role === 'student' ? 'คู่มือสำหรับนักศึกษา' : 'คู่มือสำหรับอาจารย์และบุคลากร';
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('กรุณาอนุญาตป๊อปอัปเพื่อดาวน์โหลดเอกสารคู่มือ');
      return;
    }

    const stepsHtml = steps
      .map(
        (s, idx) => `
        <div style="margin-bottom: 24px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; background: #faf5ff;">
          <h3 style="margin: 0 0 6px 0; color: #581c87; font-size: 16px;">${s.title}</h3>
          <p style="margin: 0 0 12px 0; color: #4b5563; font-size: 13px;">${s.description}</p>
          <ul style="margin: 0; padding-left: 20px; color: #1e1b4b; font-size: 13px; line-height: 1.6;">
            ${s.highlights.map((h) => `<li><b>${h.title}:</b> ${h.desc}</li>`).join('')}
          </ul>
          ${s.tip ? `<div style="margin-top: 10px; padding: 8px 12px; background: #fef3c7; border-radius: 8px; font-size: 12px; color: #92400e;">💡 <b>คำแนะนำ:</b> ${s.tip}</div>` : ''}
        </div>
      `
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${roleTitle} - ระบบกลุ่มศึกษาอัลกุรอาน.pdf</title>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Sarabun', sans-serif; color: #1e1b4b; padding: 20px; font-size: 13px; }
          .header { text-align: center; border-bottom: 2px solid #6b21a8; padding-bottom: 12px; margin-bottom: 20px; }
          h1 { color: #581c87; margin: 0; font-size: 22px; }
          .sub { color: #6b7280; font-size: 13px; margin-top: 4px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${roleTitle}</h1>
          <div class="sub">ระบบบันทึกการเช็คชื่อกลุ่มศึกษาอัลกุรอาน (หะละเกาะห์) • คณะศึกษาศาสตร์ มหาวิทยาลัยฟาฏอนี</div>
        </div>
        ${stepsHtml}
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <ModalPortal>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleCloseWithDismiss();
        }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-fadeIn select-none overflow-y-auto"
      >
        <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-purple-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
          {/* Top Header */}
          <div className="bg-gradient-to-r from-purple-900 to-indigo-900 px-5 sm:px-6 py-3.5 text-white flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-white/15 text-white flex items-center justify-center shrink-0 border border-white/20">
                <BookOpen className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black tracking-wide">
                  {role === 'student' ? 'คู่มือการใช้งานสำหรับนักศึกษา' : 'คู่มือการใช้งานสำหรับอาจารย์และบุคลากร'}
                </h2>
                <p className="text-[11px] text-purple-200 font-medium">
                  ระบบติดตามและประเมินผลกลุ่มศึกษาอัลกุรอาน (หะละเกาะห์)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrintOrDownloadPdf}
                className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/20 active:scale-95"
                title="ดาวน์โหลดหรือพิมพ์คู่มือฉบับเต็มเป็น PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">โหลด PDF</span>
              </button>

              <button
                type="button"
                onClick={handleCloseWithDismiss}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                title="ปิด"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stepper Tabs Bar */}
          <div className="bg-purple-50/80 px-4 py-2 border-b border-purple-100 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {steps.map((st, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`px-3 py-1 rounded-xl text-xs font-black transition flex items-center gap-1.5 shrink-0 ${
                    currentStepIndex === idx
                      ? 'bg-purple-900 text-white shadow-xs'
                      : 'bg-white hover:bg-purple-100/70 text-purple-900/80 border border-purple-200/80'
                  }`}
                >
                  <span>{idx + 1}.</span>
                  <span>{st.title.split('. ')[1] || st.title}</span>
                </button>
              ))}
            </div>

            <span className="text-[11px] font-mono font-bold text-purple-700 shrink-0">
              {currentStepIndex + 1} / {totalSteps}
            </span>
          </div>

          {/* Modal Content Body */}
          <div className="p-5 sm:p-7 overflow-y-auto space-y-4 flex-1">
            {/* Step Header */}
            <div className="flex items-start gap-3 pb-3 border-b border-purple-100">
              <div className={`w-11 h-11 rounded-2xl ${currentStep.iconBg} flex items-center justify-center shrink-0 shadow-sm border border-purple-200/60`}>
                <StepIcon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold font-mono text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full inline-block mb-1">
                  {currentStep.badge}
                </span>
                <h3 className="text-base sm:text-lg font-black text-purple-950">
                  {currentStep.title}
                </h3>
                <p className="text-xs text-purple-800/80 mt-0.5 font-medium leading-relaxed">
                  {currentStep.description}
                </p>
              </div>
            </div>

            {/* Highlights List */}
            <div className="space-y-2.5">
              {currentStep.highlights.map((item, idx) => {
                const ItemIcon = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-purple-50/50 hover:bg-purple-50 border border-purple-100/80 flex items-start gap-3 transition"
                  >
                    <div className="w-8 h-8 rounded-xl bg-white text-purple-700 border border-purple-200 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                      <ItemIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-purple-950">
                        {item.title}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-purple-850/80 mt-0.5 leading-relaxed font-medium">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tip Box */}
            {currentStep.tip && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-950 flex items-center gap-2 font-medium">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span><b>คำแนะนำ:</b> {currentStep.tip}</span>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="px-5 sm:px-7 py-3 border-t border-purple-100 bg-purple-50/40 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={handleCloseWithDismiss}
              className="text-xs font-bold text-purple-700 hover:text-purple-950 px-2 py-1"
            >
              เข้าใจแล้ว ปิดหน้าต่าง
            </button>

            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-4 py-2 rounded-xl bg-white border border-purple-200 text-purple-900 font-bold text-xs hover:bg-purple-100 transition active:scale-95 flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>ย้อนกลับ</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2 rounded-xl bg-purple-900 hover:bg-purple-950 active:scale-95 text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5"
              >
                <span>{isLastStep ? 'เสร็จสิ้น เข้าใช้งาน' : 'ถัดไป'}</span>
                {isLastStep ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
