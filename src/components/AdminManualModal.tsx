'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  X,
  Users,
  UserPlus,
  Upload,
  Sparkles,
  Award,
  Calendar,
  Database,
  ArrowRightLeft,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  FileText,
  ChevronRight,
  TrendingUp,
  Settings,
  Layers,
  HelpCircle,
  Eye,
} from 'lucide-react';
import { ModalPortal } from './ModalPortal';

interface AdminManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ManualTab = 'quickstart' | 'students_excel' | 'transfer' | 'levels' | 'reports_export';

export const AdminManualModal: React.FC<AdminManualModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<ManualTab>('quickstart');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDismiss();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('halaqah_admin_manual_seen_v1', 'true');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleDismiss();
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-purple-100 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] animate-fadeIn my-auto"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-purple-100 bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md text-amber-300 flex items-center justify-center shadow-inner shrink-0 border border-white/20">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-xl font-black tracking-tight text-white">
                    คู่มือการใช้งานระบบแอดมิน (ฉบับเข้าใจง่าย)
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-amber-400 text-purple-950">
                    V2.0
                  </span>
                </div>
                <p className="text-xs text-purple-200/90 mt-0.5">
                  ระบบติดตามและประเมินผลการเช็คชื่อกลุ่มศึกษาอัลกุรอาน (หะละเกาะห์)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  if (!printWindow) return;
                  const bodyHtml = document.getElementById('admin-manual-body')?.innerHTML || '';
                  printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <title>คู่มือการใช้งานระบบแอดมิน - ระบบกลุ่มศึกษาอัลกุรอาน.pdf</title>
                      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
                      <style>
                        @page { size: A4 portrait; margin: 15mm; }
                        body { font-family: 'Sarabun', sans-serif; color: #1e1b4b; padding: 20px; font-size: 13px; line-height: 1.6; }
                        h2, h3 { color: #581c87; }
                        .header { text-align: center; border-bottom: 2px solid #6b21a8; padding-bottom: 12px; margin-bottom: 20px; }
                      </style>
                    </head>
                    <body>
                      <div class="header">
                        <h2>คู่มือการใช้งานระบบแอดมิน (ฉบับเข้าใจง่าย)</h2>
                        <div>ระบบติดตามและประเมินผลการเช็คชื่อกลุ่มศึกษาอัลกุรอาน (หะละเกาะห์) • คณะศึกษาศาสตร์ มหาวิทยาลัยฟาฏอนี</div>
                      </div>
                      ${bodyHtml}
                      <script>
                        window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };
                      </script>
                    </body>
                    </html>
                  `);
                  printWindow.document.close();
                }}
                className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/20 active:scale-95"
                title="ดาวน์โหลดหรือพิมพ์คู่มือเป็น PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">โหลด PDF</span>
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-90 shrink-0"
                title="ปิดหน้าต่าง (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="px-4 sm:px-6 py-3 bg-purple-50/60 border-b border-purple-100 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('quickstart')}
              className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === 'quickstart'
                  ? 'bg-purple-900 text-white shadow-sm ring-2 ring-purple-900/30'
                  : 'text-purple-900/80 hover:text-purple-950 hover:bg-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>🚀 สรุปขั้นตอนเริ่มต้น</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('students_excel')}
              className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === 'students_excel'
                  ? 'bg-purple-900 text-white shadow-sm ring-2 ring-purple-900/30'
                  : 'text-purple-900/80 hover:text-purple-950 hover:bg-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>👥 ข้อมูล นศ. & ไฟล์ Excel</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('transfer')}
              className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === 'transfer'
                  ? 'bg-purple-900 text-white shadow-sm ring-2 ring-purple-900/30'
                  : 'text-purple-900/80 hover:text-purple-950 hover:bg-white'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4 text-sky-400" />
              <span>🔁 โยกย้ายกลุ่ม 2 ฝั่ง</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('levels')}
              className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === 'levels'
                  ? 'bg-purple-900 text-white shadow-sm ring-2 ring-purple-900/30'
                  : 'text-purple-900/80 hover:text-purple-950 hover:bg-white'
              }`}
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>🏷️ ระดับกลุ่ม (01 / 02 / 03)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reports_export')}
              className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === 'reports_export'
                  ? 'bg-purple-900 text-white shadow-sm ring-2 ring-purple-900/30'
                  : 'text-purple-900/80 hover:text-purple-950 hover:bg-white'
              }`}
            >
              <Download className="w-4 h-4 text-rose-400" />
              <span>📊 สรุปผล วุฒิบัตร & สำรองข้อมูล</span>
            </button>
          </div>

          {/* Modal Body Content */}
          <div id="admin-manual-body" className="p-6 sm:p-7 overflow-y-auto space-y-5 flex-1 text-xs text-purple-950 leading-relaxed">
            {/* 1. QUICKSTART TAB */}
            {activeTab === 'quickstart' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 sm:p-5 rounded-2xl border border-purple-200/80">
                  <h3 className="font-black text-sm text-purple-950 mb-1 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-700" />
                    <span>สรุปการทำงานของระบบ 3 ขั้นตอนหลัก</span>
                  </h3>
                  <p className="text-purple-800 text-xs">
                    ระบบหะละเกาะห์ถูกออกแบบมาเพื่อให้การติดตามผลการเช็คชื่อเป็นเรื่องง่าย โปร่งใส และรวดเร็วที่สุด:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div className="p-4 rounded-2xl bg-white border border-purple-200/90 shadow-xs space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center font-black text-sm">
                      1
                    </div>
                    <h4 className="font-extrabold text-xs sm:text-sm text-purple-950">เตรียมข้อมูลในระบบ</h4>
                    <p className="text-purple-800/80 text-[11px] leading-normal">
                      แอดมินกำหนดรายชื่ออาจารย์ นักศึกษา กลุ่มหะละเกาะห์ และสาขาวิชา โดยสามารถดาวน์โหลดไฟล์ <b>Excel Template</b> กรอกข้อมูลแล้วอัปโหลดกลับเข้ามาได้ทันที
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-purple-200/90 shadow-xs space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-900 flex items-center justify-center font-black text-sm">
                      2
                    </div>
                    <h4 className="font-extrabold text-xs sm:text-sm text-purple-950">อาจารย์บันทึกผล</h4>
                    <p className="text-purple-800/80 text-[11px] leading-normal">
                      อาจารย์เลือกกลุ่มตนเอง เช็คชื่อนักศึกษา มา / ขาด / ลา และเลือกบันทึกหัวข้อซูเราะฮ์ประจำสัปดาห์ ข้อมูลจะซิงค์สดเข้าสู่ระบบทันที
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-purple-200/90 shadow-xs space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-black text-sm">
                      3
                    </div>
                    <h4 className="font-extrabold text-xs sm:text-sm text-purple-950">ประเมินผล & ออกเอกสาร</h4>
                    <p className="text-purple-800/80 text-[11px] leading-normal">
                      แอดมินดูแดชบอร์ดสรุปแบบภาพรวม ตรวจสอบกลุ่มที่ยังไม่บันทึก ออกเล่มสรุป 40 กลุ่ม และพิมพ์วุฒิบัตรให้นักศึกษาที่เข้ากิจกรรมผ่านเกณฑ์ 80%
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3">
                  <Award className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs">เกณฑ์การประเมินผลผ่านกิจกรรม</h4>
                    <p className="text-[11px] text-amber-900/90 mt-0.5">
                      นักศึกษาต้องมีอัตราการเข้าร่วมกิจกรรมไม่น้อยกว่า <strong>80%</strong> ของจำนวนครั้งทั้งหมดในภาคเรียน เพื่อได้รับสิทธิ์พิมพ์วุฒิบัตร (E-Certificate) และผ่านการประเมินผล
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. STUDENTS & EXCEL TAB */}
            {activeTab === 'students_excel' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                  <h3 className="font-black text-sm text-emerald-950 flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                    <span>ระบบนำเข้าข้อมูลด้วยไฟล์ Excel (.xlsx) สะดวก รวดเร็ว</span>
                  </h3>
                  <p className="text-emerald-900 text-xs">
                    เพื่อรองรับการเพิ่มนักศึกษาใหม่ในแต่ละปีการศึกษา แอดมินสามารถทำได้ง่ายๆ เพียง 3 ขั้นตอน:
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-white border border-purple-100 shadow-xs flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center shrink-0 font-black">
                      1
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-purple-950">ดาวน์โหลดไฟล์เทมเพลต (Download Template)</h4>
                      <p className="text-[11px] text-purple-800/80 mt-0.5">
                        ในแท็บ <b>"จัดการข้อมูล"</b> ให้กดปุ่ม <b>"ดาวน์โหลดเทมเพลต Excel"</b> ระบบจะสร้างไฟล์ <code>student_import_template.xlsx</code> ที่มีหัวตารางพร้อมตัวอย่างข้อมูลให้ทันที
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-purple-100 shadow-xs flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-900 flex items-center justify-center shrink-0 font-black">
                      2
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-purple-950">กรอกข้อมูลนักศึกษาในไฟล์ Excel</h4>
                      <p className="text-[11px] text-purple-800/80 mt-0.5">
                        เปิดไฟล์ในโปรแกรม Microsoft Excel แล้วกรอกคอลัมน์: <b>รหัสนักศึกษา, ชื่อ-นามสกุล, เพศ, ชั้นปี, สาขาวิชา, อาจารย์ผู้ดูแล</b> สามารถวางข้อมูลนักศึกษาได้พร้อมกันเป็นร้อยๆ คน
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-purple-100 shadow-xs flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0 font-black">
                      3
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-purple-950">อัปโหลดไฟล์กลับเข้าสู่ระบบ (Upload & Save)</h4>
                      <p className="text-[11px] text-purple-800/80 mt-0.5">
                        กดปุ่ม <b>"นำเข้าไฟล์ Excel (.xlsx)"</b> แล้วเลือกไฟล์ที่กรอกเสร็จ ระบบจะตรวจสอบข้อมูล แสดงตารางพรีวิว และบันทึกเข้าสู่ฐานข้อมูลและกูเกิลชีตทันที
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-[11px] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-700 shrink-0" />
                  <span>ระบบตรวจจับสาขาวิชาจากรหัสนักศึกษา 9 หลักให้อัตโนมัติ (เช่น 441 = อิสลามศึกษา, 442 = ภาษาอาหรับ ฯลฯ)</span>
                </div>
              </div>
            )}

            {/* 3. GROUP TRANSFER TAB */}
            {activeTab === 'transfer' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-2">
                  <h3 className="font-black text-sm text-sky-950 flex items-center gap-2">
                    <ArrowRightLeft className="w-5 h-5 text-sky-700" />
                    <span>ระบบโยกย้ายกลุ่มแบบ 2 ฝั่ง ซ้าย-ขวา (Dual Column Transfer)</span>
                  </h3>
                  <p className="text-sky-900 text-xs">
                    ช่วยให้แอดมินเห็นรายชื่อนักศึกษาของทั้ง 2 กลุ่มพร้อมกัน และสลับย้ายไปมาได้อย่างสะดวกโดยไม่สับสน
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-2xl bg-white border border-purple-100 shadow-xs space-y-2">
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold text-[10px]">ฝั่งซ้าย (กลุ่ม A)</span>
                    <h4 className="font-extrabold text-xs text-purple-950">เลือกกลุ่มต้นทาง</h4>
                    <p className="text-[11px] text-purple-800/80">
                      ดรอปดาวน์เลือกอาจารย์กลุ่ม A จะปรากฏรายชื่อนักศึกษาทั้งหมดในกลุ่ม กดปุ่ม <b>"ย้ายไปกลุ่มขวา ➔"</b> บนการ์ดนักศึกษา หรือติ๊กเลือกหลายคนแล้วย้ายพร้อมกัน
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-purple-100 shadow-xs space-y-2">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 font-bold text-[10px]">ฝั่งขวา (กลุ่ม B)</span>
                    <h4 className="font-extrabold text-xs text-purple-950">เลือกกลุ่มปลายทาง</h4>
                    <p className="text-[11px] text-purple-800/80">
                      ดรอปดาวน์เลือกอาจารย์กลุ่ม B จะปรากฏรายชื่อนักศึกษาในกลุ่ม B เช่นกัน สามารถกดย้ายย้อนกลับ <b>"⬅️ ย้ายมากลุ่มซ้าย"</b> เพื่อคืนตัวนักศึกษากลับได้ทันที
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-purple-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-purple-950">รองรับการลากแล้ววาง (Drag & Drop)</h4>
                      <p className="text-[11px] text-purple-800/80">
                        สามารถคลิกค้างที่การ์ดนักศึกษาจากฝั่งใดก็ได้ แล้วลากข้ามไปปล่อยในอีกฝั่งหนึ่งได้โดยตรง
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. LEVELS TAB */}
            {activeTab === 'levels' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2">
                  <h3 className="font-black text-sm text-purple-950 flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-700" />
                    <span>ระบบจัดระดับกลุ่ม (ระดับ 01, ระดับ 02, ระดับ 03)</span>
                  </h3>
                  <p className="text-purple-800 text-xs">
                    ระบบจำแนกกลุ่มและนักศึกษาออกเป็น 3 ระดับมาตรฐาน เพื่อให้การเรียนการสอนอัลกุรอานเหมาะสมตามทักษะ:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="p-4 rounded-2xl bg-white border border-blue-200/90 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 font-black text-[11px]">
                        ระดับ 01
                      </span>
                      <span className="text-xl">🌱</span>
                    </div>
                    <h4 className="font-extrabold text-xs text-blue-950">ระดับ 01</h4>
                    <p className="text-[11px] text-blue-900/80">
                      ระดับเริ่มต้นสำหรับกลุ่มและนักศึกษาที่เริ่มต้นฝึกฝนทักษะการอ่านอัลกุรอาน
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-purple-200/90 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 font-black text-[11px]">
                        ระดับ 02
                      </span>
                      <span className="text-xl">📖</span>
                    </div>
                    <h4 className="font-extrabold text-xs text-purple-950">ระดับ 02</h4>
                    <p className="text-[11px] text-purple-900/80">
                      ระดับกลางสำหรับกลุ่มและนักศึกษาที่มีทักษะการอ่านคล่องแคล่วและถูกต้อง
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-emerald-200/90 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-black text-[11px]">
                        ระดับ 03
                      </span>
                      <span className="text-xl">🌟</span>
                    </div>
                    <h4 className="font-extrabold text-xs text-emerald-950">ระดับ 03</h4>
                    <p className="text-[11px] text-emerald-900/80">
                      ระดับก้าวหน้าสำหรับกลุ่มและนักศึกษาที่มีความเชี่ยวชาญ ท่องจำ หรือศึกษาเชิงลึก
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-purple-100 space-y-2">
                  <h4 className="font-bold text-xs text-purple-950 flex items-center gap-1.5">
                    <Settings className="w-4 h-4 text-purple-700" />
                    <span>การปรับเลื่อน / ลดระดับ</span>
                  </h4>
                  <p className="text-[11px] text-purple-800/80">
                    อาจารย์ผู้ดูแลและแอดมินสามารถกดปุ่มเลื่อนระดับ (01 ➔ 02 ➔ 03) หรือลดระดับของกลุ่มได้ตลอดเวลาในแท็บ <b>"ระดับกลุ่ม"</b> หรือหน้าเช็คชื่อของอาจารย์ ข้อมูลจะอัปเดตให้อัตโนมัติ
                  </p>
                </div>
              </div>
            )}

            {/* 5. REPORTS & EXPORT TAB */}
            {activeTab === 'reports_export' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2">
                  <h3 className="font-black text-sm text-rose-950 flex items-center gap-2">
                    <Download className="w-5 h-5 text-rose-700" />
                    <span>ศูนย์ส่งออกรายงาน วุฒิบัตร & สำรองฐานข้อมูล</span>
                  </h3>
                  <p className="text-rose-900 text-xs">
                    รองรับการส่งออกข้อมูลทั้งในรูปแบบสรุปรายกลุ่ม รายบุคคล และเล่มภาพรวมทั้งคณะ:
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-white border border-purple-100 shadow-xs flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center shrink-0 font-black">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-purple-950">ส่งออก Excel & พิมพ์เล่ม 40 กลุ่ม</h4>
                      <p className="text-[11px] text-purple-800/80 mt-0.5">
                        ในแท็บ <b>"ศูนย์ส่งออกไฟล์"</b> สามารถเลือกส่งออกเป็นไฟล์ Excel หรือสั่งพิมพ์รายงานรวม 40 กลุ่มที่มีรายละเอียดนักศึกษา สถิติการเข้าเรียน และผลการประเมิน
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-purple-100 shadow-xs flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 font-black">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-purple-950">การออกวุฒิบัตร (E-Certificate)</h4>
                      <p className="text-[11px] text-purple-800/80 mt-0.5">
                        เมื่อนักศึกษาเข้ากิจกรรมผ่านเกณฑ์ 80% จะมีปุ่ม <b>"พิมพ์วุฒิบัตร"</b> สำหรับนักศึกษาแต่ละคน หรือแอดมินสามารถสั่งพิมพ์ชุดวุฒิบัตรทั้งกลุ่มได้ในคลิกเดียว
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-purple-100 shadow-xs flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-900 flex items-center justify-center shrink-0 font-black">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-purple-950">สำรอง & กู้คืนข้อมูล 1-Click Snapshot (.json)</h4>
                      <p className="text-[11px] text-purple-800/80 mt-0.5">
                        ในแท็บ <b>"ตั้งค่าระบบ"</b> แอดมินสามารถดาวน์โหลดไฟล์สำรองข้อมูลทั้งหมดเก็บไว้ในคอมพิวเตอร์ และสามารถกู้คืนกลับมาได้ทันทีอย่างปลอดภัย
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer with Acknowledge Button */}
          <div className="px-6 py-4 border-t border-purple-100 bg-gray-50/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-[11px] text-purple-800/70">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>คู่มือนี้จะแสดงอัตโนมัติเฉพาะครั้งแรกของอุปกรณ์ และเปิดอ่านซ้ำได้เสมอจากปุ่ม "คู่มือ" ด้านบน</span>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-purple-800 to-purple-950 hover:from-purple-900 hover:to-black text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span>เข้าใจแล้ว เริ่มต้นใช้งาน</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
