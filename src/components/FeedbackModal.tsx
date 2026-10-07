'use client';

import React, { useState } from 'react';
import {
  X,
  Send,
  ShieldCheck,
  CheckCircle2,
  Users,
  Smartphone,
  Lightbulb,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { FeedbackCategory, FeedbackRole } from '@/lib/types';
import { addFeedback } from '@/lib/data-store';
import { sendFeedbackToGoogleSheet } from '@/lib/api-client';
import { ModalPortal } from './ModalPortal';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  presetRole?: FeedbackRole;
}

const CATEGORIES: {
  id: FeedbackCategory;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'grouping',
    label: 'การจัดกลุ่ม / โยกย้าย',
    desc: 'ข้อเสนอแนะเกี่ยวกับการแบ่งกลุ่ม อาจารย์ผู้ดูแล หรือการจัดระดับ',
    icon: Users,
  },
  {
    id: 'system',
    label: 'การใช้งานระบบ / การเช็คชื่อ',
    desc: 'ความสะดวกในการใช้งาน การดูผลเช็คชื่อ เกียรติบัตร หรือปัญหาทางเทคนิค',
    icon: Smartphone,
  },
  {
    id: 'general',
    label: 'ข้อเสนอแนะทั่วไป',
    desc: 'ข้อคิดเห็น คำแนะนำเพื่อการพัฒนา หรือสิ่งที่อยากให้มีเพิ่มเติม',
    icon: Lightbulb,
  },
];

const RATINGS = [
  { value: 5, emoji: '😍', label: 'ยอดเยี่ยม' },
  { value: 4, emoji: '😀', label: 'ดี' },
  { value: 3, emoji: '😐', label: 'ปานกลาง' },
  { value: 2, emoji: '🙁', label: 'ควรปรับปรุง' },
  { value: 1, emoji: '😡', label: 'มีปัญหา' },
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  presetRole = 'student',
}) => {
  const [role, setRole] = useState<FeedbackRole>(presetRole);
  const [category, setCategory] = useState<FeedbackCategory>('grouping');
  const [rating, setRating] = useState<number>(5);
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      const savedItem = addFeedback({
        role,
        category,
        rating,
        message: message.trim(),
      });
      // ซิงค์ส่งขึ้น Google Sheet เบื้องหลังทันที
      sendFeedbackToGoogleSheet(savedItem).catch((err) => {
        console.warn('Sync feedback to Google Sheet failed:', err);
      });
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setMessage('');
        onClose();
      }, 1800);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      alert('เกิดข้อผิดพลาดในการส่งข้อเสนอแนะ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-purple-950/70 backdrop-blur-sm animate-fadeIn overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isSubmitting) onClose();
        }}
      >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-purple-100 animate-scaleUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-800 via-purple-900 to-indigo-950 px-5 sm:px-6 py-4 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">ข้อเสนอแนะ & ความคิดเห็น</h3>
              <p className="text-xs text-purple-200">ส่งตรงถึงผู้ดูแลระบบ (Admin)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition disabled:opacity-50"
            aria-label="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isSubmitted ? (
          <div className="p-8 sm:p-10 text-center space-y-3 animate-fadeIn">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-black text-purple-950">ส่งข้อเสนอแนะเรียบร้อยแล้ว!</h4>
            <p className="text-xs sm:text-sm text-purple-800/80 leading-relaxed max-w-sm mx-auto">
              ขอขอบคุณสำหรับความคิดเห็นอันมีค่า ข้อมูลนี้จะถูกนำไปใช้เพื่อพัฒนาและปรับปรุงระบบหะละเกาะห์ให้ดียิ่งขึ้น
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[82vh]">
            {/* Privacy Shield Banner */}
            <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/80 border border-emerald-200/80 p-3.5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-xs text-emerald-950 leading-relaxed">
                <div className="font-black text-emerald-900 flex items-center gap-1.5">
                  <span>ปลอดภัย 100% • ไม่ระบุตัวตน</span>
                </div>
                <div className="text-[11px] text-emerald-800/90 mt-0.5">
                  ผู้ดูแลระบบจะทราบเพียงว่าเป็นความคิดเห็นจาก <strong className="text-emerald-950">{role === 'student' ? 'นักศึกษา' : 'อาจารย์'}</strong> เท่านั้น ไม่มีการระบุชื่อ รหัส หรือข้อมูลส่วนตัวใดๆ
                </div>
              </div>
            </div>

            {/* Role Indicator / Switcher */}
            <div>
              <label className="text-xs font-bold text-purple-900 block mb-1.5">
                บทบาทของผู้ส่ง
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                    role === 'student'
                      ? 'bg-purple-900 text-white border-purple-900 shadow-sm'
                      : 'bg-white hover:bg-purple-50 text-purple-800 border-purple-200'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>นักศึกษา</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                    role === 'teacher'
                      ? 'bg-purple-900 text-white border-purple-900 shadow-sm'
                      : 'bg-white hover:bg-purple-50 text-purple-800 border-purple-200'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>อาจารย์ / บุคลากร</span>
                </button>
              </div>
            </div>

            {/* Category Selector */}
            <div>
              <label className="text-xs font-bold text-purple-900 block mb-1.5">
                หัวข้อที่ต้องการแสดงความคิดเห็น
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {CATEGORIES.map((c) => {
                  const Icon = c.icon;
                  const active = category === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategory(c.id)}
                      className={`p-2.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                        active
                          ? 'bg-purple-100/90 border-purple-700 text-purple-950 ring-2 ring-purple-500 shadow-2xs'
                          : 'bg-white hover:bg-purple-50/70 border-purple-200 text-purple-900'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className={`w-4 h-4 ${active ? 'text-purple-700' : 'text-purple-500'}`} />
                        <span className="text-xs font-black truncate">{c.label}</span>
                      </div>
                      <span className="text-[10px] text-purple-600 line-clamp-2 leading-tight">
                        {c.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rating Selector */}
            <div>
              <label className="text-xs font-bold text-purple-900 block mb-1.5">
                ระดับความพึงพอใจโดยรวม
              </label>
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {RATINGS.map((r) => {
                  const active = rating === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRating(r.value)}
                      className={`py-2 px-1 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                        active
                          ? 'bg-amber-100/80 border-amber-500 text-amber-950 ring-2 ring-amber-400 scale-[1.03] shadow-2xs'
                          : 'bg-white hover:bg-purple-50/60 border-purple-200 text-purple-900'
                      }`}
                    >
                      <span className="text-2xl select-none leading-none">{r.emoji}</span>
                      <span className="text-[10px] font-bold truncate w-full">{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message Textarea */}
            <div>
              <label htmlFor="feedback-msg" className="text-xs font-bold text-purple-900 block mb-1.5">
                ข้อความความคิดเห็น / ข้อเสนอแนะ <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="feedback-msg"
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  category === 'grouping'
                    ? 'เช่น อยากให้พิจารณาการจัดกลุ่มตามสาขาวิชา, จำนวนสมาชิกในกลุ่มกำลังพอดี, หรือพบปัญหาความไม่สะดวกในการเข้ากลุ่ม...'
                    : category === 'system'
                    ? 'เช่น การเช็คชื่อสะดวกรวดเร็วดี, อยากให้ระบบแสดงสถิติเพิ่มเติม, หรือติดปัญหาการแสดงผลบนมือถือ...'
                    : 'พิมพ์ข้อเสนอแนะ ข้อคิดเห็น หรือสิ่งที่อยากบอกผู้ดูแลระบบได้เลยครับ...'
                }
                className="w-full px-3.5 py-3 text-xs sm:text-sm border border-purple-200 rounded-2xl bg-purple-50/30 text-purple-950 placeholder:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white resize-none"
              />
              <div className="flex items-center justify-between text-[11px] text-purple-500 mt-1">
                <span>กรุณาระบุความคิดเห็นอย่างสุภาพและสร้างสรรค์</span>
                <span>{message.length} ตัวอักษร</span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-purple-200 text-purple-800 font-bold text-xs hover:bg-purple-50 transition active:scale-95 disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-800 to-indigo-900 hover:from-purple-900 hover:to-indigo-950 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-purple-950/20 transition active:scale-95 disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'กำลังส่ง...' : 'ส่งข้อเสนอแนะ'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  </ModalPortal>
  );
};
