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
  Award
} from 'lucide-react';

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
    title: 'ค้นหาด้วยรหัสนักศึกษา',
    subtitle: 'ระบุรหัสนักศึกษาเพื่อดูผลการเข้าหะละเกาะห์',
    badge: '1/3 • สำหรับนักศึกษา',
    icon: GraduationCap,
    iconBg: 'bg-purple-100 text-purple-700',
    description:
      'ตรวจสอบประวัติและสถิติการเข้าร่วมกลุ่มศึกษาอัลกุรอานของตนเองได้สะดวกรวดเร็ว',
    highlights: [
      {
        title: 'กรอกรหัสนักศึกษาของตนเอง',
        desc: 'พิมพ์รหัสให้ครบถ้วน (เช่น 681441001 หรือ 67...) ในช่องค้นหา',
        icon: Lock,
      },
      {
        title: 'กดปุ่ม "ค้นหา" หรือ Enter',
        desc: 'ระบบจะตรวจสอบและแสดงผลข้อมูลสถิติของรหัสท่านทันที',
        icon: ChevronRight,
      },
      {
        title: 'หากไม่พบข้อมูล',
        desc: 'ตรวจสอบตัวเลขอีกครั้ง หรือติดต่ออาจารย์ผู้ดูแลกลุ่มของท่าน',
        icon: Sparkles,
      },
    ],
    tip: 'เข้าดูข้อมูลได้ทุกที่ทุกเวลา ทั้งบนมือถือ แท็บเล็ต และคอมพิวเตอร์',
  },
  {
    title: 'ความปลอดภัยและความเป็นส่วนตัว',
    subtitle: 'แสดงเฉพาะข้อมูลของเจ้าของรหัสเท่านั้น 100%',
    badge: '2/3 • ความเป็นส่วนตัว',
    icon: ShieldCheck,
    iconBg: 'bg-purple-100 text-purple-700',
    description:
      'ระบบให้ความสำคัญสูงสุดกับความเป็นส่วนตัวของข้อมูลนักศึกษาทุกคน',
    highlights: [
      {
        title: 'ไม่แสดงรายชื่อเพื่อนนักศึกษา',
        desc: 'ไม่มีรายชื่อหรือการเดาคำ เพื่อป้องกันผู้อื่นเข้าถึงข้อมูล',
        icon: ShieldCheck,
      },
      {
        title: 'ดูได้เฉพาะรหัสที่ถูกต้อง',
        desc: 'จะแสดงข้อมูลเมื่อระบุรหัสนักศึกษาถูกต้องครบถ้วนเท่านั้น',
        icon: Lock,
      },
      {
        title: 'ปุ่ม "ออกจากข้อมูล"',
        desc: 'กดเพื่อล้างหน้าจอและปิดข้อมูลเมื่อใช้งานเสร็จสิ้น',
        icon: X,
      },
    ],
    tip: 'เมื่อใช้งานบนเครื่องสาธารณะ อย่าลืมกดปุ่ม "ออกจากข้อมูล" เสมอ',
  },
  {
    title: 'ผลการเข้ากลุ่ม สถิติ และประกาศ',
    subtitle: 'ตรวจสอบอัตราการเข้าร่วมและประวัติการเช็คชื่อ',
    badge: '3/3 • สถิติและประกาศ',
    icon: CheckCircle2,
    iconBg: 'bg-emerald-100 text-emerald-800',
    description:
      'หน้าแดชบอร์ดส่วนบุคคลสรุปผลการเข้าร่วมกิจกรรมหะละเกาะห์ครบถ้วน',
    highlights: [
      {
        title: 'อัตราการเข้าร่วม (เกณฑ์ผ่าน 80%)',
        desc: 'สรุปเปอร์เซ็นต์และจำนวนครั้งที่ มา / ขาด / ลา ทั้งหมด',
        icon: Award,
      },
      {
        title: 'ประวัติเช็คชื่อรายวัน',
        desc: 'ดูวันที่ เวลาที่บันทึก และชื่ออาจารย์ผู้ดูแลกลุ่ม',
        icon: Clock,
      },
      {
        title: 'ประกาศสำคัญจากอาจารย์',
        desc: 'ข้อความด่วนหรือประกาศเฉพาะบุคคลจะแสดงด้านบนสุด',
        icon: Sparkles,
      },
    ],
    tip: 'หากมีข้อสงสัยเรื่องจำนวนครั้ง สามารถติดต่ออาจารย์ผู้ดูแลกลุ่มได้ทันที',
  },
];

const FACULTY_TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'การเลือกกลุ่มและเช็คชื่อ',
    subtitle: 'บันทึกสถานะ มา / ขาด / ลา สะดวก รวดเร็ว',
    badge: '1/3 • สำหรับบุคลากร',
    icon: Users,
    iconBg: 'bg-amber-100 text-amber-800',
    description:
      'อาจารย์และบุคลากรเลือกกลุ่มและบันทึกเวลาของนักศึกษาได้อย่างง่ายดาย',
    highlights: [
      {
        title: 'เลือกกลุ่มชาย หรือ หญิง',
        desc: 'เลือกแท็บกลุ่ม จากนั้นคลิกที่ชื่ออาจารย์ผู้ดูแล',
        icon: Users,
      },
      {
        title: 'แตะเปลี่ยน มา / ขาด / ลา',
        desc: 'แตะที่ปุ่มสถานะของนักศึกษาแต่ละคนเพื่อเปลี่ยนได้ในคลิกเดียว',
        icon: CheckCircle2,
      },
      {
        title: 'ปุ่มลัด "มาทุกคน"',
        desc: 'ตั้งค่านักศึกษาในกลุ่มให้มาครบทุกคนได้ในคลิกเดียว',
        icon: Sparkles,
      },
    ],
    tip: 'ระบบจะลงเวลาแบบเรียลไทม์ให้อัตโนมัติเมื่อเลือกสถานะ',
  },
  {
    title: 'การเลือกวันย้อนหลัง',
    subtitle: 'ดูและบันทึกข้อมูลย้อนหลังได้ทุกวันอย่างยืดหยุ่น',
    badge: '2/3 • ระบบวันที่',
    icon: CalendarDays,
    iconBg: 'bg-indigo-100 text-indigo-700',
    description:
      'อาจารย์สามารถดูประวัติการเช็คชื่อหรือแก้ไขข้อมูลย้อนหลังได้ครบถ้วน',
    highlights: [
      {
        title: 'คลิกแถบวันที่เพื่อเปิดปฏิทิน',
        desc: 'คลิก < 📅 วันที่ > หรือ "เลือกวันย้อนหลัง" เพื่อเลือกวันจากปฏิทิน',
        icon: Calendar,
      },
      {
        title: 'เลือกจากประวัติที่เคยบันทึก',
        desc: 'มีเมนูดรอปดาวน์รวบรวมวันที่มีการเช็คชื่อ สลับดูได้ทันที',
        icon: CalendarDays,
      },
      {
        title: 'ปุ่ม "กลับสู่วันนี้"',
        desc: 'เมื่อดูวันย้อนหลังเสร็จ กดเพื่อกลับสู่วันปัจจุบันได้ทันที',
        icon: Clock,
      },
    ],
    tip: 'สามารถแก้ไขและกดบันทึกใหม่ได้ตลอดเวลา ข้อมูลจะอัปเดตอัตโนมัติ',
  },
  {
    title: 'บันทึกและซิงค์ข้อมูล',
    subtitle: 'ส่งข้อมูลขึ้น Google Sheets อัตโนมัติ ปลอดภัย ไม่สูญหาย',
    badge: '3/3 • บันทึกและสำรองข้อมูล',
    icon: Database,
    iconBg: 'bg-emerald-100 text-emerald-800',
    description:
      'เมื่อเช็คชื่อเสร็จ ให้กดปุ่มบันทึกข้อมูล ระบบจะซิงค์ขึ้นระบบทันที',
    highlights: [
      {
        title: 'กดปุ่ม "บันทึกข้อมูล"',
        desc: 'ระบบจะแสดงแอนิเมชันยืนยันเมื่อบันทึกข้อมูลสำเร็จ',
        icon: CheckCircle2,
      },
      {
        title: 'ซิงค์ Google Sheets ทันที',
        desc: 'ข้อมูลจะอัปเดตไปยังสเปรดชีตของคณะศึกษาศาสตร์อัตโนมัติ',
        icon: Database,
      },
      {
        title: 'สำรองข้อมูลปลอดภัย',
        desc: 'ข้อมูลถูกเก็บทั้งในเครื่องและคลาวด์ ปลอดภัย ไม่สูญหาย',
        icon: ShieldCheck,
      },
    ],
    tip: 'สามารถเปิดดูคู่มือซ้ำได้ตลอดเวลาโดยกดปุ่ม "คู่มือ" ที่มุมจอ',
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
  const totalSteps = steps.length;

  // Reset to first step whenever opened or role changes
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
    }
  }, [isOpen, role]);

  if (!isOpen) return null;

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const StepIcon = currentStep.icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-purple-950/65 backdrop-blur-md animate-fadeIn select-none overflow-hidden"
    >
      <div className="relative w-full max-w-[420px] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-purple-200/90 overflow-hidden flex flex-col max-h-[96svh] sm:max-h-[92svh]">
        {/* Top Progress Bar */}
        <div className="w-full bg-purple-100 h-1 overflow-hidden shrink-0">
          <div
            className={`h-full transition-all duration-300 ease-out ${
              role === 'student'
                ? 'bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800'
                : 'bg-gradient-to-r from-amber-500 via-purple-700 to-amber-600'
            }`}
            style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {/* Modal Header (Compact) */}
        <div className="px-3.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between border-b border-purple-100/80 bg-gradient-to-b from-purple-50/60 to-white shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl ${currentStep.iconBg} flex items-center justify-center shrink-0 shadow-2xs border border-purple-200/60`}>
              <StepIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold font-mono text-purple-700 bg-purple-100 px-2 py-0.2 rounded-full inline-block">
                {currentStep.badge}
              </span>
              <h2 className="text-xs sm:text-sm font-black text-purple-950 tracking-tight truncate">
                {currentStep.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-purple-100/70 hover:bg-purple-200 text-purple-800 flex items-center justify-center transition-all active:scale-95 shrink-0 ml-1"
            title="ปิดคู่มือ"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Modal Body (Guaranteed No Scrollbar anywhere) */}
        <div className="px-3.5 sm:px-4 py-2 sm:py-2.5 space-y-1.5 sm:space-y-2 overflow-hidden flex-1 flex flex-col justify-between">
          {/* Subtitle & Description */}
          <div className="space-y-0.5 shrink-0">
            <h3 className="text-[11px] sm:text-xs font-black text-purple-900 leading-tight">
              {currentStep.subtitle}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-purple-950/80 leading-snug font-medium">
              {currentStep.description}
            </p>
          </div>

          {/* Highlights Bento (Clean & Fitted) */}
          <div className="space-y-1 sm:space-y-1.5 flex-1 flex flex-col justify-around my-0.5">
            {currentStep.highlights.map((item, idx) => {
              const ItemIcon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-1.5 sm:p-2 rounded-xl bg-purple-50/60 hover:bg-purple-50 border border-purple-100/90 flex items-center gap-2"
                >
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-white text-purple-700 border border-purple-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                    <ItemIcon className="w-3 h-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[10px] sm:text-[11px] font-extrabold text-purple-950 leading-tight truncate">
                      {item.title}
                    </h4>
                    <p className="text-[9px] sm:text-[10px] text-purple-850/80 leading-tight font-medium line-clamp-1 sm:line-clamp-2">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Useful Tip Box */}
          {currentStep.tip && (
            <div className="p-1.5 sm:p-2 rounded-xl bg-amber-50/90 border border-amber-200/80 text-[9px] sm:text-[10px] text-amber-950 flex items-center gap-1.5 font-medium leading-tight shrink-0">
              <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
              <span className="truncate">{currentStep.tip}</span>
            </div>
          )}
        </div>

        {/* Modal Footer Controls (Compact, No Checkbox, Shrink-0) */}
        <div className="px-3.5 sm:px-4 py-2 sm:py-2.5 border-t border-purple-100 bg-purple-50/40 flex items-center justify-between gap-2 shrink-0">
          {/* Stepper Dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStepIndex
                    ? 'w-6 bg-purple-800'
                    : idx < currentStepIndex
                    ? 'w-1.5 bg-purple-400'
                    : 'w-1.5 bg-purple-200 hover:bg-purple-300'
                }`}
                title={`ไปขั้นตอนที่ ${idx + 1}`}
              />
            ))}
            <span className="text-[10px] font-mono font-bold text-purple-700 ml-1">
              {currentStepIndex + 1}/{totalSteps}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 text-xs font-bold text-purple-800 hover:text-purple-950 hover:bg-purple-100 rounded-lg transition-all"
            >
              ข้าม
            </button>

            {!isFirstStep && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-2.5 py-1 text-xs font-extrabold text-purple-900 bg-white hover:bg-purple-100 border border-purple-200 rounded-lg transition-all active:scale-95 flex items-center gap-0.5"
              >
                <ChevronLeft className="w-3 h-3" />
                <span>ย้อน</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-3 py-1 text-xs font-extrabold text-white bg-gradient-to-r from-purple-800 to-purple-900 hover:from-purple-900 hover:to-purple-950 rounded-lg shadow-sm transition-all active:scale-95 flex items-center gap-1"
            >
              <span>{isLastStep ? 'เสร็จสิ้น' : 'ถัดไป'}</span>
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
  );
};
