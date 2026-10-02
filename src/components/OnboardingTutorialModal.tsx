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
  onDismissForever: () => void;
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
    title: 'การค้นหาข้อมูลด้วยรหัสนักศึกษา',
    subtitle: 'ระบุรหัสนักศึกษาของท่านเพื่อดูผลการเข้าหะละเกาะห์',
    badge: 'ขั้นตอนที่ 1 จาก 3 • สำหรับนักศึกษา',
    icon: GraduationCap,
    iconBg: 'bg-purple-100 text-purple-700',
    description:
      'ระบบถูกออกแบบมาให้นักศึกษาตรวจสอบประวัติและสถิติการเข้าร่วมกลุ่มศึกษาอัลกุรอานของตนเองได้อย่างสะดวกรวดเร็ว',
    highlights: [
      {
        title: 'กรอกรหัสนักศึกษาของตนเอง',
        desc: 'พิมพ์รหัสนักศึกษาให้ถูกต้องครบถ้วน (เช่น 681441001 หรือ 67...) ในช่องค้นหา',
        icon: Lock,
      },
      {
        title: 'กดปุ่ม "ค้นหา" หรือกด Enter',
        desc: 'ระบบจะตรวจสอบและดึงข้อมูลสถิติของรหัสที่ระบุมาแสดงผลทันที',
        icon: ChevronRight,
      },
      {
        title: 'หากไม่พบข้อมูล',
        desc: 'กรุณาตรวจสอบตัวเลขรหัสนักศึกษาอีกครั้ง หรือติดต่ออาจารย์ผู้ดูแลกลุ่มหะละเกาะห์',
        icon: Sparkles,
      },
    ],
    tip: 'ท่านสามารถเข้าดูข้อมูลได้ทุกที่ทุกเวลา ทั้งบนมือถือ แท็บเล็ต หรือคอมพิวเตอร์',
  },
  {
    title: 'ระบบความเป็นส่วนตัวและความปลอดภัย',
    subtitle: 'แสดงเฉพาะข้อมูลของเจ้าของรหัสเท่านั้น 100%',
    badge: 'ขั้นตอนที่ 2 จาก 3 • ความเป็นส่วนตัว',
    icon: ShieldCheck,
    iconBg: 'bg-purple-100 text-purple-700',
    description:
      'ระบบให้ความสำคัญสูงสุดกับความเป็นส่วนตัวของข้อมูลนักศึกษาทุกคน',
    highlights: [
      {
        title: 'ไม่แสดงรายชื่อเพื่อนนักศึกษาอื่น',
        desc: 'ระบบจะไม่แสดงรายชื่อ แนะนำ หรือดรอปดาวน์ของเพื่อน เพื่อป้องกันการเข้าถึงข้อมูลของผู้อื่น',
        icon: ShieldCheck,
      },
      {
        title: 'เข้าถึงได้เฉพาะเจ้าของรหัสที่ถูกต้อง',
        desc: 'จะแสดงผลเมื่อระบุรหัสนักศึกษาถูกต้องครบถ้วนเท่านั้น',
        icon: Lock,
      },
      {
        title: 'ปุ่ม "ค้นหารหัสอื่น / ออกจากข้อมูล"',
        desc: 'เมื่อดูข้อมูลเสร็จแล้ว สามารถกดปุ่มนี้เพื่อล้างหน้าจอและปิดข้อมูลได้อย่างปลอดภัย',
        icon: X,
      },
    ],
    tip: 'หากใช้งานในเครื่องสาธารณะ อย่าลืมกดปุ่ม "ค้นหารหัสอื่น / ออกจากข้อมูล" ทุกครั้งหลังใช้งาน',
  },
  {
    title: 'การดูผลการเข้ากลุ่ม สถิติ และประกาศ',
    subtitle: 'ตรวจสอบอัตราการเข้าร่วมและประวัติการเช็คชื่อ',
    badge: 'ขั้นตอนที่ 3 จาก 3 • สถิติและประวัติ',
    icon: CheckCircle2,
    iconBg: 'bg-emerald-100 text-emerald-800',
    description:
      'หน้าแดชบอร์ดส่วนบุคคลจะสรุปผลการเข้าร่วมกิจกรรมหะละเกาะห์ของท่านอย่างครบถ้วน',
    highlights: [
      {
        title: 'อัตราการเข้าร่วมกิจกรรม (เกณฑ์ผ่าน 80%)',
        desc: 'แถบวัดผลและสรุปจำนวนครั้งที่ มา / ขาด / ลา ทั้งหมดอย่างชัดเจน',
        icon: Award,
      },
      {
        title: 'ประวัติการเช็คชื่อรายวัน',
        desc: 'ดูวันที่ เวลาที่เช็คชื่อ และชื่ออาจารย์ผู้บันทึกในแต่ละครั้ง',
        icon: Clock,
      },
      {
        title: 'ประกาศเฉพาะบุคคลจากอาจารย์',
        desc: 'หากมีประกาศด่วนหรือข้อความสำคัญถึงท่าน จะแสดงขึ้นมาที่ด้านบนสุดทันที',
        icon: Sparkles,
      },
    ],
    tip: 'หากมีข้อสงสัยเกี่ยวกับจำนวนวัน มา/ขาด/ลา สามารถติดต่ออาจารย์ผู้ดูแลกลุ่มที่ระบุในหน้าจอได้ทันที',
  },
];

const FACULTY_TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'การเลือกกลุ่มและเช็คชื่อนักศึกษา',
    subtitle: 'บันทึกการเข้าร่วม มา / ขาด / ลา สะดวก รวดเร็ว',
    badge: 'ขั้นตอนที่ 1 จาก 3 • สำหรับบุคลากร',
    icon: Users,
    iconBg: 'bg-amber-100 text-amber-800',
    description:
      'อาจารย์และบุคลากรผู้ดูแลกลุ่ม สามารถเลือกกลุ่มและบันทึกเวลาของนักศึกษาได้อย่างง่ายดาย',
    highlights: [
      {
        title: 'เลือกกลุ่มชาย หรือ กลุ่มหญิง',
        desc: 'เลือกแท็บกลุ่มนักศึกษาชายหรือหญิง จากนั้นค้นหาหรือคลิกที่ชื่ออาจารย์ผู้ดูแล',
        icon: Users,
      },
      {
        title: 'เปลี่ยนสถานะ มา / ขาด / ลา รายบุคคล',
        desc: 'แตะที่ปุ่มสถานะของนักศึกษาแต่ละคนเพื่อเปลี่ยนสถานะได้ในคลิกเดียว',
        icon: CheckCircle2,
      },
      {
        title: 'ปุ่มลัด "มาทุกคน"',
        desc: 'ใช้ปุ่ม "มาทุกคน" ด้านบนเพื่อตั้งค่าให้นักศึกษาในกลุ่มมาครบทุกคนได้ทันที',
        icon: Sparkles,
      },
    ],
    tip: 'ระบบจะลงเวลาแบบเรียลไทม์อัตโนมัติเมื่อกดบันทึกสถานะของนักศึกษาแต่ละคน',
  },
  {
    title: 'การเลือกวันเดือนปีย้อนหลัง',
    subtitle: 'ยืดหยุ่นในการดูและบันทึกข้อมูลย้อนหลังได้ทุกวัน',
    badge: 'ขั้นตอนที่ 2 จาก 3 • ระบบวันที่',
    icon: CalendarDays,
    iconBg: 'bg-indigo-100 text-indigo-700',
    description:
      'อาจารย์สามารถดูประวัติการเช็คชื่อหรือบันทึกข้อมูลย้อนหลังของวันก่อนๆ ได้อย่างครบถ้วน',
    highlights: [
      {
        title: 'คลิกแถบวันที่เพื่อเปิดปฏิทิน',
        desc: 'คลิกที่แถบ < 📅 วัน เดือน ปี > หรือปุ่ม "เลือกวันย้อนหลัง" เพื่อเลือกวันที่จากปฏิทินของเครื่อง',
        icon: Calendar,
      },
      {
        title: 'เลือกจากประวัติที่เคยบันทึกไว้',
        desc: 'มีเมนูดรอปดาวน์รวบรวมวันที่มีการเช็คชื่อย้อนหลัง สามารถคลิกสลับวันได้ทันที',
        icon: CalendarDays,
      },
      {
        title: 'ปุ่มลัด "กลับสู่วันนี้"',
        desc: 'เมื่อดูข้อมูลย้อนหลัง สามารถกดปุ่ม "กลับสู่วันนี้" เพื่อกลับมายังวันปัจจุบันได้อย่างรวดเร็ว',
        icon: Clock,
      },
    ],
    tip: 'สามารถแก้ไขข้อมูลย้อนหลังและกดบันทึกใหม่ได้ตลอดเวลา ข้อมูลจะอัปเดตอัตโนมัติ',
  },
  {
    title: 'การบันทึกข้อมูลและซิงค์ Google Sheets',
    subtitle: 'ส่งข้อมูลขึ้นคลาวด์อัตโนมัติ ปลอดภัย ไม่สูญหาย',
    badge: 'ขั้นตอนที่ 3 จาก 3 • บันทึกและสำรองข้อมูล',
    icon: Database,
    iconBg: 'bg-emerald-100 text-emerald-800',
    description:
      'เมื่อเช็คชื่อเรียบร้อย ให้กดปุ่ม "บันทึกข้อมูล" ระบบจะเก็บข้อมูลและซิงค์ทันที',
    highlights: [
      {
        title: 'กดปุ่ม "บันทึกข้อมูล" ด้านล่าง',
        desc: 'ระบบจะแสดงแอนิเมชันยืนยันว่าข้อมูลถูกบันทึกสำเร็จเรียบร้อย',
        icon: CheckCircle2,
      },
      {
        title: 'ซิงค์ Google Sheets ทันที',
        desc: 'ข้อมูลจะถูกอัปเดตไปยังสเปรดชีตของคณะศึกษาศาสตร์อย่างถูกต้อง',
        icon: Database,
      },
      {
        title: 'ปลอดภัยและสำรองข้อมูลเสมอ',
        desc: 'ข้อมูลเก็บทั้งในเครื่องและระบบออนไลน์ สามารถเรียกดูหรือพิมพ์รายงานได้ตลอดเวลา',
        icon: ShieldCheck,
      },
    ],
    tip: 'หากต้องการกลับมาดูคู่มือนี้อีก สามารถกดปุ่ม "💡 คู่มือ" ที่มุมจอได้ทุกเมื่อ',
  },
];

export const OnboardingTutorialModal: React.FC<OnboardingTutorialModalProps> = ({
  isOpen,
  role,
  onClose,
  onDismissForever,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [neverShowAgain, setNeverShowAgain] = useState(false);

  const steps = role === 'student' ? STUDENT_TUTORIAL_STEPS : FACULTY_TUTORIAL_STEPS;
  const totalSteps = steps.length;

  // Reset to first step whenever opened or role changes
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      setNeverShowAgain(false);
    }
  }, [isOpen, role]);

  if (!isOpen) return null;

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    if (neverShowAgain) {
      onDismissForever();
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    if (neverShowAgain) {
      onDismissForever();
    } else {
      onClose();
    }
  };

  const StepIcon = currentStep.icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-purple-950/60 backdrop-blur-md animate-fadeIn select-none"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl sm:rounded-[32px] shadow-2xl border border-purple-200/90 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh]">
        {/* Top Progress Bar */}
        <div className="w-full bg-purple-100 h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ease-out ${
              role === 'student'
                ? 'bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800'
                : 'bg-gradient-to-r from-amber-500 via-purple-700 to-amber-600'
            }`}
            style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {/* Modal Header */}
        <div className="p-4 sm:p-5 pb-3 sm:pb-4 flex items-center justify-between border-b border-purple-100/80 bg-gradient-to-b from-purple-50/50 to-white">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl ${currentStep.iconBg} flex items-center justify-center shadow-xs border border-purple-200/60`}>
              <StepIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold font-mono text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                {currentStep.badge}
              </span>
              <h2 className="text-sm sm:text-base font-black text-purple-950 tracking-tight mt-0.5">
                {currentStep.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="w-8 h-8 rounded-full bg-purple-100/70 hover:bg-purple-200 text-purple-800 flex items-center justify-center transition-all active:scale-95"
            title="ปิดคู่มือ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
          {/* Subtitle & Description */}
          <div className="space-y-1">
            <h3 className="text-xs sm:text-sm font-extrabold text-purple-900">
              {currentStep.subtitle}
            </h3>
            <p className="text-xs sm:text-sm text-purple-950/80 leading-relaxed font-medium">
              {currentStep.description}
            </p>
          </div>

          {/* Highlights Bento */}
          <div className="space-y-2 pt-1">
            {currentStep.highlights.map((item, idx) => {
              const ItemIcon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-purple-50/50 hover:bg-purple-50 border border-purple-100/90 transition-all flex items-start gap-2.5"
                >
                  <div className="w-7 h-7 rounded-xl bg-white text-purple-700 border border-purple-200/80 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    <ItemIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-purple-950">
                      {item.title}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-purple-800/80 leading-relaxed font-medium">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Useful Tip Box */}
          {currentStep.tip && (
            <div className="p-2.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-950 flex items-center gap-2 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{currentStep.tip}</span>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 pt-3 border-t border-purple-100 bg-purple-50/30 space-y-2.5">
          {/* Stepper Dots & Checkbox */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentStepIndex
                      ? 'w-7 bg-purple-800'
                      : idx < currentStepIndex
                      ? 'w-2 bg-purple-400'
                      : 'w-2 bg-purple-200 hover:bg-purple-300'
                  }`}
                  title={`ไปขั้นตอนที่ ${idx + 1}`}
                />
              ))}
              <span className="text-[10px] font-mono font-bold text-purple-700 ml-1">
                {currentStepIndex + 1}/{totalSteps}
              </span>
            </div>

            {/* Do not show again checkbox */}
            <label className="inline-flex items-center gap-2 text-xs text-purple-900/80 font-bold cursor-pointer select-none">
              <input
                type="checkbox"
                checked={neverShowAgain}
                onChange={(e) => setNeverShowAgain(e.target.checked)}
                className="w-4 h-4 rounded text-purple-700 focus:ring-purple-600 border-purple-300 cursor-pointer"
              />
              <span>ไม่ต้องแสดงคู่มือนี้อีก</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={handleSkip}
              className="px-3.5 py-2 text-xs font-bold text-purple-800 hover:text-purple-950 hover:bg-purple-100 rounded-xl transition-all"
            >
              ข้ามคู่มือ
            </button>

            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-3.5 py-2 text-xs font-extrabold text-purple-900 bg-white hover:bg-purple-100 border border-purple-200 rounded-xl transition-all active:scale-95 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>ย้อนกลับ</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2 text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-purple-800 to-purple-900 hover:from-purple-900 hover:to-purple-950 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
              >
                <span>{isLastStep ? 'เสร็จสิ้น • เข้าสู่ระบบ' : 'ถัดไป'}</span>
                {isLastStep ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
