'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
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
  HelpCircle,
  Database,
  Lock,
  ArrowRight
} from 'lucide-react';

interface OnboardingTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDismissForever: () => void;
}

interface TutorialStep {
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ElementType;
  iconBg: string;
  accentColor: string;
  description: string;
  highlights: { title: string; desc: string; icon: React.ElementType }[];
  tip?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'ยินดีต้อนรับสู่ระบบหะละเกาะห์',
    subtitle: 'ระบบบันทึกและติดตามการเข้าร่วมกลุ่มศึกษาอัลกุรอาน',
    badge: 'ขั้นตอนที่ 1 จาก 5 • ภาพรวมระบบ',
    icon: BookOpen,
    iconBg: 'bg-purple-100 text-purple-700',
    accentColor: 'from-purple-800 to-indigo-900',
    description:
      'ระบบเว็บแอปพลิเคชันสำหรับคณะศึกษาศาสตร์ มหาวิทยาลัยฟาฏอนี ออกแบบมาเพื่อให้อาจารย์และนักศึกษาจัดการข้อมูลการเข้าหะละเกาะห์ได้อย่างสะดวก รวดเร็ว และเป็นระเบียบ',
    highlights: [
      {
        title: 'แบ่งแยก 2 บทบาทชัดเจน',
        desc: 'แยกเมนูการเข้าใช้งานระหว่าง "สำหรับนักศึกษา" และ "สำหรับบุคลากร"',
        icon: Users,
      },
      {
        title: 'ใช้งานได้ทุกอุปกรณ์',
        desc: 'รองรับการใช้งานทั้งบนสมาร์ทโฟน แท็บเล็ต และคอมพิวเตอร์อย่างลื่นไหล',
        icon: Sparkles,
      },
      {
        title: 'เชื่อมต่อฐานข้อมูลอัตโนมัติ',
        desc: 'ข้อมูลซิงค์และสำรองไปยัง Google Sheets ทันที ปลอดภัย ไม่สูญหาย',
        icon: Database,
      },
    ],
    tip: 'ท่านสามารถกด "ถัดไป" เพื่อเรียนรู้ขั้นตอนการใช้งานแต่ละฟังก์ชัน หรือกด "ข้าม" หากไม่ต้องการดู',
  },
  {
    title: 'สำหรับนักศึกษา — ตรวจสอบข้อมูลตนเอง',
    subtitle: 'ระบบความปลอดภัยและความเป็นส่วนตัว 100%',
    badge: 'ขั้นตอนที่ 2 จาก 5 • เมนูนักศึกษา',
    icon: GraduationCap,
    iconBg: 'bg-purple-100 text-purple-700',
    accentColor: 'from-purple-800 via-purple-900 to-indigo-950',
    description:
      'นักศึกษาสามารถเข้าดูผลการเข้าหะละเกาะห์ สถิติเปอร์เซ็นต์ และประกาศสำคัญได้ด้วยตนเองอย่างปลอดภัย',
    highlights: [
      {
        title: 'กรอกรหัสนักศึกษาของตนเอง',
        desc: 'ระบุรหัสนักศึกษาให้ถูกต้องครบถ้วน (เช่น 681441001) แล้วกด "ค้นหา"',
        icon: Lock,
      },
      {
        title: 'เห็นเฉพาะข้อมูลของตนเองเท่านั้น',
        desc: 'ระบบจะไม่แสดงรายชื่อเพื่อนนักศึกษาอื่น เพื่อรักษาความเป็นส่วนตัวสูงสุด',
        icon: ShieldCheck,
      },
      {
        title: 'ประวัติการเช็คชื่อและสถิติ',
        desc: 'แสดงจำนวนครั้ง มา / ขาด / ลา วันที่เข้าร่วม และอาจารย์ผู้ดูแลกลุ่ม',
        icon: CheckCircle2,
      },
    ],
    tip: 'นักศึกษาสามารถกดปุ่ม "ค้นหารหัสอื่น / ออกจากข้อมูล" เพื่อปิดหน้าต่างข้อมูลของตนเองได้ตลอดเวลา',
  },
  {
    title: 'สำหรับบุคลากร — เช็คชื่อกลุ่มหะละเกาะห์',
    subtitle: 'บันทึกการเข้าร่วม มา / ขาด / ลา สะดวก รวดเร็ว',
    badge: 'ขั้นตอนที่ 3 จาก 5 • เมนูบุคลากร',
    icon: Users,
    iconBg: 'bg-amber-100 text-amber-800',
    accentColor: 'from-purple-900 via-purple-800 to-amber-950',
    description:
      'อาจารย์และบุคลากรผู้รับผิดชอบกลุ่ม สามารถล็อกอินและบันทึกเวลาการเข้ากลุ่มของนักศึกษาในกลุ่มตนเองได้',
    highlights: [
      {
        title: 'ล็อกอินด้วยรหัสผ่านบุคลากร',
        desc: 'กดปุ่ม "สำหรับบุคลากร" และกรอกรหัสผ่าน (รหัสตั้งต้น: edu.sdd)',
        icon: Lock,
      },
      {
        title: 'เลือกกลุ่มชาย หรือ กลุ่มหญิง',
        desc: 'ค้นหาหรือเลือกชื่ออาจารย์ผู้รับผิดชอบ เพื่อเข้าสู่หน้าเช็คชื่อของกลุ่มนั้น',
        icon: Users,
      },
      {
        title: 'กดเปลี่ยนสถานะได้ในคลิกเดียว',
        desc: 'เลือก มา / ขาด / ลา รายบุคคล หรือใช้ปุ่ม "มาทุกคน" เพื่อความรวดเร็ว',
        icon: CheckCircle2,
      },
    ],
    tip: 'ระบบจะลงเวลาแบบเรียลไทม์อัตโนมัติเมื่อกดบันทึกสถานะของนักศึกษาแต่ละคน',
  },
  {
    title: 'การเลือกวันเดือนปีย้อนหลัง',
    subtitle: 'ยืดหยุ่นในการบันทึกและแก้ไขข้อมูลย้อนหลัง',
    badge: 'ขั้นตอนที่ 4 จาก 5 • ระบบวันที่',
    icon: CalendarDays,
    iconBg: 'bg-indigo-100 text-indigo-700',
    accentColor: 'from-indigo-900 via-purple-900 to-purple-950',
    description:
      'อาจารย์สามารถดูประวัติการเช็คชื่อหรือบันทึกข้อมูลย้อนหลังของวันก่อนๆ ได้อย่างง่ายดาย',
    highlights: [
      {
        title: 'กดที่แถบวันที่เพื่อเปิดปฏิทิน',
        desc: 'คลิกที่แถบ < 📅 วัน เดือน ปี > หรือปุ่ม "เลือกวันย้อนหลัง" เพื่อเลือกวันที่จากปฏิทิน',
        icon: Calendar,
      },
      {
        title: 'เลือกจากประวัติที่เคยบันทึกไว้',
        desc: 'มีเมนูดรอปดาวน์รวบรวมวันที่มีการเช็คชื่อย้อนหลัง สามารถคลิกเพื่อสลับวันได้ทันที',
        icon: CalendarDays,
      },
      {
        title: 'ปุ่มลัด "กลับสู่วันนี้"',
        desc: 'เมื่อดูข้อมูลย้อนหลัง สามารถกดปุ่ม "กลับสู่วันนี้" เพื่อกลับมายังวันปัจจุบันได้ทันที',
        icon: Sparkles,
      },
    ],
    tip: 'สามารถแก้ไขข้อมูลย้อนหลังและกดบันทึกใหม่ได้ตลอดเวลา ข้อมูลจะอัปเดตอัตโนมัติ',
  },
  {
    title: 'การบันทึกข้อมูลและการดูแลระบบ',
    subtitle: 'ซิงค์ Google Sheets ทันทีและปลอดภัย',
    badge: 'ขั้นตอนที่ 5 จาก 5 • การบันทึกและแอดมิน',
    icon: Database,
    iconBg: 'bg-emerald-100 text-emerald-800',
    accentColor: 'from-purple-950 via-indigo-950 to-emerald-950',
    description:
      'เมื่อเช็คชื่อเสร็จเรียบร้อย ให้กดปุ่ม "บันทึกข้อมูล" ระบบจะเก็บข้อมูลและส่งขึ้น Google Sheets ทันที',
    highlights: [
      {
        title: 'ปุ่มบันทึกข้อมูลพร้อมแอนิเมชันยืนยัน',
        desc: 'กด "บันทึกข้อมูล" จะมีเอฟเฟกต์แจ้งเตือนยืนยันว่าบันทึกสำเร็จเรียบร้อย',
        icon: CheckCircle2,
      },
      {
        title: 'สำรองข้อมูลอัตโนมัติ',
        desc: 'ข้อมูลจะถูกเก็บไว้ในเครื่องและซิงค์กับ Google Sheet ของคณะศึกษาศาสตร์',
        icon: Database,
      },
      {
        title: 'ระบบแอดมิน (Admin Control)',
        desc: 'ผู้ดูแลระบบสามารถจัดการรายชื่ออาจารย์ นักศึกษา รหัสผ่าน และส่งออกรายงานได้',
        icon: ShieldCheck,
      },
    ],
    tip: 'หากต้องการกลับมาดูคู่มือนี้อีก สามารถกดปุ่ม "💡 คู่มือการใช้งาน" ที่มุมจอได้ทุกเมื่อ',
  },
];

export const OnboardingTutorialModal: React.FC<OnboardingTutorialModalProps> = ({
  isOpen,
  onClose,
  onDismissForever,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [neverShowAgain, setNeverShowAgain] = useState(false);

  // Reset to first step whenever opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStep = TUTORIAL_STEPS[currentStepIndex];
  const totalSteps = TUTORIAL_STEPS.length;
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
      <div className="relative w-full max-w-xl bg-white rounded-3xl sm:rounded-[32px] shadow-2xl border border-purple-200/90 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh]">
        {/* Top Liquid Glass Progress Bar */}
        <div className="w-full bg-purple-100 h-1.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-700 via-indigo-600 to-[#f1b000] transition-all duration-500 ease-out"
            style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {/* Modal Header */}
        <div className="p-4 sm:p-6 pb-3 sm:pb-4 flex items-center justify-between border-b border-purple-100/80 bg-gradient-to-b from-purple-50/50 to-white">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl ${currentStep.iconBg} flex items-center justify-center shadow-xs border border-purple-200/60`}>
              <StepIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold font-mono text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                {currentStep.badge}
              </span>
              <h2 className="text-base sm:text-lg font-black text-purple-950 tracking-tight mt-0.5">
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

        {/* Modal Body (Scrollable if needed on small screens) */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Subtitle & Main Description */}
          <div className="space-y-1.5">
            <h3 className="text-xs sm:text-sm font-extrabold text-purple-900">
              {currentStep.subtitle}
            </h3>
            <p className="text-xs sm:text-sm text-purple-950/80 leading-relaxed font-medium">
              {currentStep.description}
            </p>
          </div>

          {/* Highlights 3-Card Bento */}
          <div className="space-y-2.5 pt-1">
            {currentStep.highlights.map((item, idx) => {
              const ItemIcon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-3 sm:p-3.5 rounded-2xl bg-purple-50/50 hover:bg-purple-50 border border-purple-100/90 transition-all flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-xl bg-white text-purple-700 border border-purple-200/80 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    <ItemIcon className="w-4 h-4" />
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
            <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-[11px] sm:text-xs text-amber-950 flex items-center gap-2 font-medium">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{currentStep.tip}</span>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 pt-3 border-t border-purple-100 bg-purple-50/30 space-y-3">
          {/* Stepper Dots & "Do Not Show Again" checkbox */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {TUTORIAL_STEPS.map((_, idx) => (
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
              <span>ไม่ต้องแสดงอีกในครั้งถัดไป</span>
            </label>
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-1">
            {/* Skip Button */}
            <button
              type="button"
              onClick={handleSkip}
              className="px-3.5 sm:px-4 py-2.5 text-xs font-bold text-purple-800 hover:text-purple-950 hover:bg-purple-100 rounded-xl transition-all"
            >
              ข้ามคู่มือ
            </button>

            {/* Back & Next Controls */}
            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-3.5 sm:px-4 py-2.5 text-xs font-extrabold text-purple-900 bg-white hover:bg-purple-100 border border-purple-200 rounded-xl transition-all active:scale-95 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>ย้อนกลับ</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-purple-800 via-purple-900 to-indigo-950 hover:from-purple-900 hover:to-indigo-900 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
              >
                <span>{isLastStep ? 'เสร็จสิ้น • เริ่มใช้งาน' : 'ถัดไป'}</span>
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
