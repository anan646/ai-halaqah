'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  X,
  Users,
  UserPlus,
  Upload,
  Sparkles,
  QrCode,
  KeyRound,
  GraduationCap,
  Award,
  Calendar,
  Database,
  ArrowRightLeft,
  CheckCircle2,
  FileSpreadsheet,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { ModalPortal } from './ModalPortal';

interface AdminManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ManualTab = 'overview' | 'users' | 'levels' | 'qr_pin' | 'rollover' | 'backup';

export const AdminManualModal: React.FC<AdminManualModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<ManualTab>('overview');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-purple-100 overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-fadeIn"
        >
          {/* Header */}
          <div className="px-5 sm:px-6 py-4 border-b border-purple-100 bg-gradient-to-r from-purple-50/70 via-indigo-50/40 to-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-700 text-white flex items-center justify-center shadow-md shadow-purple-900/10 shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-purple-950 tracking-tight">
                    คู่มือการใช้งานระบบสำหรับผู้ดูแลระบบ
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 text-purple-800 hidden sm:inline">
                    ADMIN GUIDE
                  </span>
                </div>
                <p className="text-xs text-purple-700/80">
                  คู่มือสรุปฟังก์ชันสำคัญ กระชับ เข้าใจง่าย ใช้งานได้ทันที
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-purple-100/70 hover:bg-purple-200 text-purple-800 flex items-center justify-center transition-all active:scale-90 shrink-0"
              title="ปิดหน้าต่าง (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Pills (Minimal Horizontal Scroll) */}
          <div className="px-4 sm:px-6 py-2.5 bg-purple-50/40 border-b border-purple-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'text-purple-900/70 hover:text-purple-950 hover:bg-white'
              }`}
            >
              <span>🧭 ภาพรวม & สถิติ</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'users'
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'text-purple-900/70 hover:text-purple-950 hover:bg-white'
              }`}
            >
              <span>👥 จัดการ นศ. & อาจารย์</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('levels')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'levels'
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'text-purple-900/70 hover:text-purple-950 hover:bg-white'
              }`}
            >
              <span>🏷️ ระดับ 01 / 02 / 03</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('qr_pin')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'qr_pin'
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'text-purple-900/70 hover:text-purple-950 hover:bg-white'
              }`}
            >
              <span>📱 QR Code & PIN</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('rollover')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'rollover'
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'text-purple-900/70 hover:text-purple-950 hover:bg-white'
              }`}
            >
              <span>🎓 วุฒิบัตร & เลื่อนชั้นปี</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('backup')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'backup'
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'text-purple-900/70 hover:text-purple-950 hover:bg-white'
              }`}
            >
              <span>⚙️ ตั้งค่า & สำรองข้อมูล</span>
            </button>
          </div>

          {/* Modal Body with Custom Minimal Content */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs text-purple-950 leading-relaxed">
            {/* 1. OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-200 text-purple-900 flex items-center justify-center shrink-0 font-bold">
                    1
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm text-purple-950">
                      แผงควบคุมสถิติรวมแบบเรียลไทม์ (KPI Metrics)
                    </h3>
                    <p className="text-purple-900/80">
                      ระบบคำนวณจำนวนกลุ่มที่บันทึกแล้ว ยอดนักศึกษา มา/ขาด/ลา และอัตราการเข้าร่วมกิจกรรมเฉลี่ยทั้งคณะแบบอัตโนมัติ โดยอิงเกณฑ์ผ่านการประเมินที่ <b>80%</b>
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-200 text-indigo-900 flex items-center justify-center shrink-0 font-bold">
                    2
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm text-purple-950">
                      แถบความคืบหน้ากิจกรรมประจำภาคเรียน (Progress Bar)
                    </h3>
                    <p className="text-purple-900/80">
                      เปรียบเทียบจำนวนสัปดาห์ที่มีการจัดกิจกรรมจริงกับเป้าหมายที่ตั้งไว้ (เช่น 12 ครั้ง) แสดงเปอร์เซ็นต์ความคืบหน้าและแจ้งเตือนจำนวนครั้งที่เหลืออยู่
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 font-bold">
                    3
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm text-purple-950">
                      ตารางเปรียบเทียบรายกลุ่ม (Matrix & Comparative View)
                    </h3>
                    <p className="text-purple-900/80">
                      สลับดูกลุ่มอาจารย์แต่ละท่าน พร้อมประวัติการเข้าเรียนรายวันของนักศึกษาในกลุ่มอย่างละเอียด เพื่อตรวจสอบกรณีขาดเรียนต่อเนื่อง
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. USERS TAB */}
            {activeTab === 'users' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-200 text-purple-900 flex items-center justify-center shrink-0 font-bold">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm text-purple-950">
                      การเพิ่มข้อมูลรายบุคคล (Single Add)
                    </h3>
                    <p className="text-purple-900/80">
                      กดปุ่ม <b>"เพิ่มนักศึกษา"</b> หรือ <b>"เพิ่มอาจารย์"</b> กรอกรหัสนักศึกษา ชื่อ-สกุล เพศ ชั้นปี และกลุ่ม ระบบจะตรวจจับสาขาวิชาจากรหัสนักศึกษาให้อัตโนมัติ
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-200 text-indigo-900 flex items-center justify-center shrink-0 font-bold">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm text-purple-950">
                      การคัดลอกและวางข้อมูลหลายคนพร้อมกัน (Bulk Import)
                    </h3>
                    <p className="text-purple-900/80">
                      กดปุ่ม <b>"คัดลอก/วาง ข้อมูล"</b> สามารถคัดลอกจาก Excel หรือ Google Sheets แล้ววางลงในกล่องข้อความได้ทันที รองรับทั้งรูปแบบ <i>รหัส ชื่อ เพศ ชั้นปี</i> หรือข้อความต่อบรรทัด
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 font-bold">
                    <ArrowRightLeft className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm text-purple-950">
                      การย้ายกลุ่มนักศึกษา (Student Transfer)
                    </h3>
                    <p className="text-purple-900/80">
                      ไปที่แท็บ <b>"ย้ายกลุ่ม"</b> สามารถลากการ์ดนักศึกษา (Drag & Drop) หรือเลือกกลุ่มปลายทางแล้วกดย้ายได้ทันที ประวัติการเช็คชื่อเดิมจะยังคงอยู่ปลอดภัย
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. LEVELS TAB */}
            {activeTab === 'levels' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-200 text-sky-900">
                      ระดับ 01
                    </span>
                    <h4 className="font-bold text-xs text-sky-950 mt-1.5">ขั้นพื้นฐาน (Beginner)</h4>
                    <p className="text-[11px] text-sky-800/80 mt-0.5">การอ่านและออกเสียงตามหลักตัจญ์วีดเบื้องต้น</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-200 text-indigo-900">
                      ระดับ 02
                    </span>
                    <h4 className="font-bold text-xs text-indigo-950 mt-1.5">ขั้นปานกลาง (Intermediate)</h4>
                    <p className="text-[11px] text-indigo-800/80 mt-0.5">อ่านได้อย่างคล่องแคล่วและถูกต้องตามหลักเกณฑ์</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-200 text-purple-900">
                      ระดับ 03
                    </span>
                    <h4 className="font-bold text-xs text-purple-950 mt-1.5">ขั้นก้าวหน้า (Advanced)</h4>
                    <p className="text-[11px] text-purple-800/80 mt-0.5">มีความชำนาญสูง ท่องจำอัลกุรอาน (ฮิฟซ์)</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-2">
                  <h3 className="font-extrabold text-sm text-purple-950 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-700" />
                    <span>วิธีเลื่อนและลดระดับ</span>
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-purple-900/80">
                    <li><b>ปรับรายกลุ่ม:</b> ไปที่แท็บ "ระดับกลุ่ม/ทักษะ" กดปุ่ม ⬆️ เลื่อน หรือ ⬇️ ลดระดับของกลุ่มอาจารย์</li>
                    <li><b>ปรับนักศึกษาตามกลุ่มอัตโนมัติ:</b> เปิดสวิตช์ "ปรับระดับนักศึกษาในกลุ่มตามทันที" เพื่อให้ นศ. ทุกคนในกลุ่มเลื่อนระดับพร้อมกัน</li>
                    <li><b>ปรับรายบุคคล:</b> คลิกที่ตัวย่อ 01, 02, 03 ท้ายชื่อนักศึกษาเพื่อเลื่อนหรือลดระดับเฉพาะบุคคลได้อย่างอิสระ</li>
                  </ul>
                </div>
              </div>
            )}

            {/* 4. QR CODE & PIN TAB */}
            {activeTab === 'qr_pin' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-200 text-purple-900 flex items-center justify-center shrink-0 font-bold">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm text-purple-950">
                      1. อาจารย์เปิดจอฉาย Dynamic QR Code & PIN
                    </h3>
                    <p className="text-purple-900/80">
                      ในหน้าเช็คชื่อของอาจารย์ กดปุ่ม <b>"📱 QR & PIN เช็คชื่อ"</b> ระบบจะสร้าง QR Code พร้อมรหัส PIN 4 หลักประจำคาบขนาดใหญ่ เหมาะสำหรับฉายขึ้นจอโปรเจกเตอร์ในห้องเรียน
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-200 text-emerald-900 flex items-center justify-center shrink-0 font-bold">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm text-purple-950">
                      2. นักศึกษาเช็คชื่อด้วยตนเอง
                    </h3>
                    <p className="text-purple-900/80">
                      นักศึกษาสแกน QR Code จากกล้องมือถือ หรือกดปุ่ม <b>"⚡ เช็คชื่อด่วนด้วย PIN"</b> ที่หน้าแรก กรอกรหัสนักศึกษาและ PIN 4 หลัก ระบบจะบันทึกสถานะ "มา" พร้อมเวลาแบบเรียลไทม์ทันที
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm text-purple-950">
                      3. การบันทึกหัวข้อบทเรียนและเหตุผลการลา
                    </h3>
                    <p className="text-purple-900/80">
                      อาจารย์สามารถบันทึกชื่อซูเราะฮ์หรือบทเรียนประจำคาบได้ในกล่องบันทึกด้านบน และหากนักศึกษาลา สามารถคลิกเพื่อระบุเหตุผลการลา (ลาป่วย / ลากิจ / สอบ) ได้
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 5. ROLLOVER & CERTIFICATES TAB */}
            {activeTab === 'rollover' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 font-bold">
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm text-purple-950">
                      วุฒิบัตรอิเล็กทรอนิกส์ (E-Certificate)
                    </h3>
                    <p className="text-purple-900/80">
                      นักศึกษาที่มีอัตราการเข้าเรียน <b>ตั้งแต่ 80% ขึ้นไป</b> จะมีปุ่มรับวุฒิบัตรขึ้นในหน้าโปรไฟล์ สามารถกดเปิดวุฒิบัตรลายกรอบอาหรับวิจิตร และสั่งพิมพ์หรือดาวน์โหลดเป็น PDF ขนาด A4 แนวนอนได้ทันที
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-200 text-indigo-900 flex items-center justify-center shrink-0 font-bold">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm text-purple-950">
                      การเลื่อนชั้นปีการศึกษา (Academic Year Rollover)
                    </h3>
                    <p className="text-purple-900/80">
                      เมื่อเริ่มปีการศึกษาใหม่ แอดมินสามารถกดปุ่ม <b>"ดำเนินการเลื่อนชั้นปีการศึกษา"</b> ในแท็บจัดการระบบ:
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 text-purple-900/80 mt-1">
                      <li>ชั้นปีที่ 2 ➔ เลื่อนเป็น <b>ชั้นปีที่ 3</b></li>
                      <li>ชั้นปีที่ 3 ➔ เลื่อนเป็น <b>ชั้นปีที่ 4</b> (ปรับชื่อหลักสูตรเป็น "การสอน...")</li>
                      <li>ชั้นปีที่ 4 ➔ ปรับสถานะเป็น <b>สำเร็จการศึกษา</b></li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* 6. SETTINGS & BACKUP TAB */}
            {activeTab === 'backup' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-200 text-purple-900 flex items-center justify-center shrink-0 font-bold">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm text-purple-950">
                      ตั้งค่าภาคการศึกษา & ช่วงวันเดือนปี
                    </h3>
                    <p className="text-purple-900/80">
                      กำหนดภาคเรียน (ภาคเรียนที่ 1, 2, ฤดูร้อน), ปีการศึกษา (เช่น 2567), วันเริ่มต้น-สิ้นสุดภาคเรียน, วันจัดกิจกรรมในสัปดาห์, และเป้าหมายจำนวนสัปดาห์/ครั้ง
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-200 text-emerald-900 flex items-center justify-center shrink-0 font-bold">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm text-purple-950">
                      การสำรองข้อมูลขึ้น Google Sheets
                    </h3>
                    <p className="text-purple-900/80">
                      แอดมินสามารถกดปุ่ม <b>"สำรองข้อมูลทั้งหมดขึ้น Google Sheet ทันที"</b> ในแท็บจัดการระบบ เพื่อซิงค์ข้อมูลนักศึกษา อาจารย์ ประวัติการเช็คชื่อ และระดับทักษะขึ้นสู่ Cloud
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-200 text-sky-900 flex items-center justify-center shrink-0 font-bold">
                    <Database className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm text-purple-950">
                      การสำรองและกู้คืนฉุกเฉินระดับไฟล์ JSON (1-Click Snapshot)
                    </h3>
                    <p className="text-purple-900/80">
                      สามารถกดดาวน์โหลดไฟล์สำรอง <code>halaqah_full_backup_*.json</code> เก็บไว้ในเครื่องคอมพิวเตอร์ และกู้คืนข้อมูลได้ทันทีตลอดเวลาโดยไม่ต้องผ่านเซิร์ฟเวอร์
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Minimal Footer */}
          <div className="px-5 sm:px-6 py-3 border-t border-purple-100 bg-purple-50/30 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-purple-700/70">
              💡 กดปุ่ม <b>Esc</b> หรือคลิกพื้นที่ภายนอกเพื่อปิดคู่มือได้ทุกเมื่อ
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-purple-800 hover:bg-purple-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
            >
              เข้าใจแล้ว ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
