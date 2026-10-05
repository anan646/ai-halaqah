'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Award,
  X,
  Check,
  Save,
  Printer,
  Download,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Settings,
  Eye,
  Type,
  Layout,
  FileText,
  RotateCcw,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { ModalPortal } from './ModalPortal';
import {
  CertificateConfig,
  CERTIFICATE_TEMPLATES,
  getCertificateConfig,
  saveCertificateConfig,
  DEFAULT_CERTIFICATE_CONFIG,
} from '@/lib/certificate-config';
import { exportCertificateToPdf, printCertificate } from '@/lib/certificate-export';

interface CertificateStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemLogo?: string;
}

export const CertificateStudioModal: React.FC<CertificateStudioModalProps> = ({
  isOpen,
  onClose,
  systemLogo,
}) => {
  const [config, setConfig] = useState<CertificateConfig>(DEFAULT_CERTIFICATE_CONFIG);
  const [activeTab, setActiveTab] = useState<'template' | 'content' | 'layout'>('template');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isExportingPdfSample, setIsExportingPdfSample] = useState(false);
  const [isPrintingSample, setIsPrintingSample] = useState(false);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setConfig(getCertificateConfig());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentTemplate =
    CERTIFICATE_TEMPLATES.find((t) => t.id === config.templateId) || CERTIFICATE_TEMPLATES[0];

  const handleSave = () => {
    saveCertificateConfig(config);
    setToastMsg('💾 บันทึกการตั้งค่าและเทมเพลตเกียรติบัตรเรียบร้อยแล้ว');
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleReset = () => {
    if (confirm('คุณต้องการรีเซ็ตการตั้งค่าเกียรติบัตรกลับเป็นค่าเริ่มต้นหรือไม่?')) {
      setConfig(DEFAULT_CERTIFICATE_CONFIG);
      saveCertificateConfig(DEFAULT_CERTIFICATE_CONFIG);
      setToastMsg('🔄 รีเซ็ตการตั้งค่ากลับเป็นค่าเริ่มต้นแล้ว');
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setConfig((prev) => ({
          ...prev,
          customBackgroundImage: dataUrl,
          useCustomBackground: true,
        }));
        setToastMsg('🖼️ อัปโหลดภาพพื้นหลังเทมเพลตเรียบร้อย');
        setTimeout(() => setToastMsg(null), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCustomLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setConfig((prev) => ({
          ...prev,
          customLogoUrl: dataUrl,
          showLogo: true,
        }));
        setToastMsg('🌟 อัปโหลดตราโลโก้ใหม่เรียบร้อย');
        setTimeout(() => setToastMsg(null), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePrintSample = async () => {
    setIsPrintingSample(true);
    try {
      await printCertificate('studio-cert-preview', 'เกียรติบัตร_ตัวอย่าง_Halaqah');
    } catch (err) {
      console.error('Print sample failed:', err);
      window.print();
    } finally {
      setIsPrintingSample(false);
    }
  };

  const handleSavePdfSample = async () => {
    setIsExportingPdfSample(true);
    try {
      await exportCertificateToPdf('studio-cert-preview', 'เกียรติบัตร_ตัวอย่าง_Halaqah.pdf', {
        scale: 3,
      });
      setToastMsg('📄 ดาวน์โหลดไฟล์เกียรติบัตรตัวอย่าง PDF (A4 แนวนอน) สำเร็จแล้ว!');
      setTimeout(() => setToastMsg(null), 3500);
    } catch (err) {
      console.error('Export sample PDF failed:', err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF ตัวอย่าง');
    } finally {
      setIsExportingPdfSample(false);
    }
  };

  // Sample student mock
  const sampleStudent = {
    fullName: 'มูฮัมหมัด อับดุลลอฮ์ (ตัวอย่าง)',
    studentId: '681441001',
    major: 'อิสลามศึกษา',
    yearLevel: 'ปี 2',
    rate: 95.8,
    present: 12,
    total: 12,
    level: 'ระดับ 01',
  };

  const activeLogo = config.customLogoUrl || systemLogo;
  const rawTitle = (config.awardTitle || 'เกียรติบัตร').trim();
  const cleanAwardTitle =
    rawTitle.includes('มอบให้ไว้') || rawTitle.includes('เพื่อแสดงว่า')
      ? 'เกียรติบัตร'
      : rawTitle;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
        {/* Print Styles for Certificate */}
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden !important;
            }
            #studio-cert-preview,
            #studio-cert-preview * {
              visibility: visible !important;
            }
            #studio-cert-preview {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 100vw !important;
              height: 100vh !important;
              margin: 0 !important;
              padding: 15mm !important;
              border-width: 8px !important;
              box-shadow: none !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}</style>

        <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[96vh] flex flex-col shadow-2xl border border-purple-200 overflow-hidden my-auto">
          {/* Top Bar */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 px-5 sm:px-7 py-3.5 text-white flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-400 text-purple-950 flex items-center justify-center font-black shadow">
                <Award className="w-6 h-6 text-purple-950" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-wide flex items-center gap-2">
                  <span>สตูดิโอออกแบบ & จัดการเกียรติบัตร (Certificate Studio)</span>
                  <span className="text-[10px] bg-amber-400 text-purple-950 font-black px-2 py-0.5 rounded-full uppercase">
                    10 เทมเพลต + คัสตอม
                  </span>
                </h2>
                <p className="text-[11px] text-purple-200">
                  ปรับแต่งเทมเพลต ข้อความ ตราสัญลักษณ์ และเลเอาต์เกียรติบัตรฉบับทางการของระบบ
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white text-xs font-bold transition flex items-center gap-1.5"
                title="รีเซ็ตค่าเริ่มต้น"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">รีเซ็ต</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-purple-950 text-xs font-black transition shadow flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกการตั้งค่า</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          {toastMsg && (
            <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 text-center flex items-center justify-center gap-2 animate-fadeIn shrink-0">
              <CheckCircle2 className="w-4 h-4" />
              <span>{toastMsg}</span>
            </div>
          )}

          {/* Main Studio Body: Controls on left, Real-time Preview on right */}
          <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0">
            {/* Left Column: Control Tabs (5 cols) */}
            <div className="lg:col-span-5 border-r border-purple-100 flex flex-col bg-purple-50/30 overflow-hidden">
              {/* Tab Selector Buttons */}
              <div className="p-3 bg-white border-b border-purple-100 flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('template')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'template'
                      ? 'bg-purple-900 text-white shadow-sm'
                      : 'text-purple-800 hover:bg-purple-50'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>1. เทมเพลต (10 แบบ)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('content')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'content'
                      ? 'bg-purple-900 text-white shadow-sm'
                      : 'text-purple-800 hover:bg-purple-50'
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>2. ข้อความในบัตร</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('layout')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'layout'
                      ? 'bg-purple-900 text-white shadow-sm'
                      : 'text-purple-800 hover:bg-purple-50'
                  }`}
                >
                  <Layout className="w-3.5 h-3.5" />
                  <span>3. จัดวางเลเอาต์</span>
                </button>
              </div>

              {/* Tab Contents Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* ================= TAB 1: TEMPLATES ================= */}
                {activeTab === 'template' && (
                  <div className="space-y-4 animate-fadeIn">
                    {/* Custom Background Upload Card */}
                    <div className="p-4 rounded-2xl bg-white border border-purple-200 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-xs text-purple-950 flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-purple-700" />
                          <span>นำเข้าภาพเทมเพลตของท่านเอง (Custom Background)</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.useCustomBackground}
                            onChange={(e) =>
                              setConfig({ ...config, useCustomBackground: e.target.checked })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-700"></div>
                        </label>
                      </div>

                      <p className="text-[11px] text-purple-700/80">
                        อัปโหลดไฟล์ภาพกระดาษเกียรติบัตรของคณะ (JPG/PNG แนวนอน) ข้อความและชื่อนักศึกษาจะวางทับบนภาพพื้นหลังนี้อย่างแม่นยำ
                      </p>

                      <div className="flex gap-2 items-center">
                        <button
                          type="button"
                          onClick={() => bgFileInputRef.current?.click()}
                          className="px-3.5 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold transition flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>เลือกไฟล์ภาพพื้นหลัง (.png / .jpg)</span>
                        </button>
                        <input
                          ref={bgFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleCustomBgUpload}
                          className="hidden"
                        />
                        {config.customBackgroundImage && (
                          <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>มีภาพคัสตอมแล้ว</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 10 Built-in Templates Grid */}
                    <div className="space-y-2">
                      <div className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>เทมเพลตมาตรฐานของระบบ (10 รูปแบบทางการ):</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {CERTIFICATE_TEMPLATES.map((tpl) => {
                          const isSelected =
                            !config.useCustomBackground && config.templateId === tpl.id;
                          return (
                            <button
                              key={tpl.id}
                              type="button"
                              onClick={() => {
                                const updated = {
                                  ...config,
                                  templateId: tpl.id,
                                  useCustomBackground: false,
                                };
                                setConfig(updated);
                                saveCertificateConfig(updated);
                                setToastMsg(`✨ เลือกและอัปเดต "${tpl.name}" เป็นเทมเพลตใช้งานแล้ว`);
                                setTimeout(() => setToastMsg(null), 2500);
                              }}
                              className={`p-3 rounded-2xl border text-left transition relative flex flex-col justify-between ${
                                isSelected
                                  ? 'bg-purple-900 text-white border-purple-950 shadow-md ring-2 ring-purple-600'
                                  : 'bg-white hover:bg-purple-50 border-purple-200 text-purple-950'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-extrabold text-xs">{tpl.name}</span>
                                  {isSelected && (
                                    <span className="w-4 h-4 rounded-full bg-amber-400 text-purple-950 flex items-center justify-center text-[10px] font-black">
                                      ✓
                                    </span>
                                  )}
                                </div>
                                <p
                                  className={`text-[10px] line-clamp-2 ${
                                    isSelected ? 'text-purple-200' : 'text-purple-700/70'
                                  }`}
                                >
                                  {tpl.description}
                                </p>
                              </div>

                              {/* Mini preview bar */}
                              <div
                                className="h-3 w-full rounded-md mt-2 border"
                                style={{
                                  borderColor: tpl.borderColor,
                                  background: tpl.bgGradient,
                                }}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* ================= TAB 2: CONTENT ================= */}
                {activeTab === 'content' && (
                  <div className="space-y-3.5 text-xs animate-fadeIn">
                    <div>
                      <label className="font-bold text-purple-950 block mb-1">ชื่อสถาบัน / คณะ (ไทย)</label>
                      <input
                        type="text"
                        value={config.institutionName}
                        onChange={(e) => setConfig({ ...config, institutionName: e.target.value })}
                        className="w-full px-3 py-2 border border-purple-200 rounded-xl bg-white font-bold text-purple-950 focus:ring-2 focus:ring-purple-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-purple-950 block mb-1">ชื่อสถาบัน / คณะ (อังกฤษ)</label>
                      <input
                        type="text"
                        value={config.institutionSubName}
                        onChange={(e) => setConfig({ ...config, institutionSubName: e.target.value })}
                        className="w-full px-3 py-2 border border-purple-200 rounded-xl bg-white font-medium text-purple-950 focus:ring-2 focus:ring-purple-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-purple-950 block mb-1">หัวข้อการมอบเกียรติบัตร</label>
                      <input
                        type="text"
                        value={config.awardTitle}
                        onChange={(e) => setConfig({ ...config, awardTitle: e.target.value })}
                        className="w-full px-3 py-2 border border-purple-200 rounded-xl bg-white font-bold text-purple-950 focus:ring-2 focus:ring-purple-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-purple-950 block mb-1">ชื่อโครงการ</label>
                      <input
                        type="text"
                        value={config.activityTitle}
                        onChange={(e) => setConfig({ ...config, activityTitle: e.target.value })}
                        className="w-full px-3 py-2 border border-purple-200 rounded-xl bg-white font-bold text-purple-950 focus:ring-2 focus:ring-purple-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-purple-950 block mb-1">ข้อความบรรยายเนื้อหา (Body Text)</label>
                      <textarea
                        rows={2}
                        value={config.bodyText}
                        onChange={(e) => setConfig({ ...config, bodyText: e.target.value })}
                        className="w-full px-3 py-2 border border-purple-200 rounded-xl bg-white font-medium text-purple-950 focus:ring-2 focus:ring-purple-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-purple-950 block mb-1">คำอวยพร / ดุอาอ์ท้ายเกียรติบัตร</label>
                      <input
                        type="text"
                        value={config.blessingText}
                        onChange={(e) => setConfig({ ...config, blessingText: e.target.value })}
                        className="w-full px-3 py-2 border border-purple-200 rounded-xl bg-white italic text-purple-950 focus:ring-2 focus:ring-purple-600 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-purple-100">
                      <div>
                        <label className="font-bold text-purple-950 block mb-1">ผู้ลงนามที่ 1 (ซ้าย)</label>
                        <input
                          type="text"
                          placeholder="ชื่อ-สกุล"
                          value={config.signatory1Name}
                          onChange={(e) => setConfig({ ...config, signatory1Name: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-purple-200 rounded-xl bg-white font-bold mb-1"
                        />
                        <input
                          type="text"
                          placeholder="ตำแหน่ง"
                          value={config.signatory1Role}
                          onChange={(e) => setConfig({ ...config, signatory1Role: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-purple-200 rounded-xl bg-white text-[11px]"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-purple-950 block mb-1">ผู้ลงนามที่ 2 (ขวา)</label>
                        <input
                          type="text"
                          placeholder="ชื่อ-สกุล"
                          value={config.signatory2Name}
                          onChange={(e) => setConfig({ ...config, signatory2Name: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-purple-200 rounded-xl bg-white font-bold mb-1"
                        />
                        <input
                          type="text"
                          placeholder="ตำแหน่ง"
                          value={config.signatory2Role}
                          onChange={(e) => setConfig({ ...config, signatory2Role: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-purple-200 rounded-xl bg-white text-[11px]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ================= TAB 3: LAYOUT & POSITIONING ================= */}
                {activeTab === 'layout' && (
                  <div className="space-y-4 text-xs animate-fadeIn">
                    {/* Logo Section */}
                    <div className="p-3.5 rounded-2xl bg-white border border-purple-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-purple-950">1. การจัดวางตราสัญลักษณ์ / โลโก้</span>
                        <input
                          type="checkbox"
                          checked={config.showLogo}
                          onChange={(e) => setConfig({ ...config, showLogo: e.target.checked })}
                          className="w-4 h-4 text-purple-600 rounded"
                        />
                      </div>

                      {config.showLogo && (
                        <div className="space-y-2 pt-1 border-t border-purple-100">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-purple-900">ตำแหน่งโลโก้:</span>
                            <select
                              value={config.logoPosition}
                              onChange={(e) =>
                                setConfig({
                                  ...config,
                                  logoPosition: e.target.value as any,
                                })
                              }
                              className="px-2.5 py-1 border border-purple-200 rounded-lg bg-purple-50/50 text-xs font-bold"
                            >
                              <option value="top-center">บนกึ่งกลาง (Top Center)</option>
                              <option value="top-left">มุมซ้ายบน (Top Left)</option>
                              <option value="top-right">มุมขวาบน (Top Right)</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => logoFileInputRef.current?.click()}
                              className="px-3 py-1.5 bg-purple-100 text-purple-900 rounded-xl font-bold text-[11px]"
                            >
                              อัปโหลดโลโก้ใหม่สำหรับเกียรติบัตร
                            </button>
                            <input
                              ref={logoFileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleCustomLogoUpload}
                              className="hidden"
                            />
                            {config.customLogoUrl && (
                              <button
                                type="button"
                                onClick={() => setConfig({ ...config, customLogoUrl: undefined })}
                                className="text-rose-600 text-[11px] underline"
                              >
                                ใช้โลโก้ระบบ
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Student Info Toggles */}
                    <div className="p-3.5 rounded-2xl bg-white border border-purple-200 space-y-2">
                      <span className="font-bold text-purple-950 block">2. การแสดงผลข้อมูลนักศึกษา</span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.showStudentId}
                            onChange={(e) => setConfig({ ...config, showStudentId: e.target.checked })}
                            className="w-4 h-4 text-purple-600 rounded"
                          />
                          <span>รหัสนักศึกษา</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.showMajor}
                            onChange={(e) => setConfig({ ...config, showMajor: e.target.checked })}
                            className="w-4 h-4 text-purple-600 rounded"
                          />
                          <span>สาขาวิชา</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.showYearLevel}
                            onChange={(e) => setConfig({ ...config, showYearLevel: e.target.checked })}
                            className="w-4 h-4 text-purple-600 rounded"
                          />
                          <span>ชั้นปี</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.showGroupName}
                            onChange={(e) => setConfig({ ...config, showGroupName: e.target.checked })}
                            className="w-4 h-4 text-purple-600 rounded"
                          />
                          <span>ชื่อกลุ่มศึกษา</span>
                        </label>
                      </div>
                    </div>

                    {/* Stats & Honor Seal A+ Toggles */}
                    <div className="p-3.5 rounded-2xl bg-white border border-purple-200 space-y-2">
                      <span className="font-bold text-purple-950 block">3. สถิติการเข้าร่วม และตราประทับเกียรตินิยม A+</span>
                      <div className="space-y-2">
                        <label className="flex items-center justify-between cursor-pointer">
                          <span>แสดงสถิติการเข้าร่วม (% และจำนวนครั้ง มา/จัด)</span>
                          <input
                            type="checkbox"
                            checked={config.showAttendanceStats}
                            onChange={(e) => setConfig({ ...config, showAttendanceStats: e.target.checked })}
                            className="w-4 h-4 text-purple-600 rounded"
                          />
                        </label>

                        <label className="flex items-center justify-between cursor-pointer">
                          <span>แสดงระดับทักษะ (ระดับ 01, 02, 03)</span>
                          <input
                            type="checkbox"
                            checked={config.showLevelLabel}
                            onChange={(e) => setConfig({ ...config, showLevelLabel: e.target.checked })}
                            className="w-4 h-4 text-purple-600 rounded"
                          />
                        </label>

                        <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl bg-amber-50/80 border border-amber-200">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-600" />
                            <span className="font-bold text-amber-950">ตราประทับเกียรตินิยม A+ (ไม่จมขอบล่าง)</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={config.showHonorBadgeA}
                            onChange={(e) => setConfig({ ...config, showHonorBadgeA: e.target.checked })}
                            className="w-4 h-4 text-amber-600 rounded"
                          />
                        </label>

                        <label className="flex items-center justify-between cursor-pointer">
                          <span>แสดงวันที่ออกเกียรติบัตรและเลขที่อ้างอิง</span>
                          <input
                            type="checkbox"
                            checked={config.showDate}
                            onChange={(e) => setConfig({ ...config, showDate: e.target.checked })}
                            className="w-4 h-4 text-purple-600 rounded"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Live Interactive Preview (7 cols) */}
            <div className="lg:col-span-7 p-4 sm:p-6 bg-slate-100 flex flex-col justify-between overflow-y-auto">
              <div className="flex items-center justify-between mb-3 shrink-0">
                <div className="flex items-center gap-2 text-xs font-black text-purple-950">
                  <Eye className="w-4 h-4 text-purple-700" />
                  <span>ตัวอย่างเกียรติบัตรสด (Real-time Preview A4 แนวนอน)</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrintSample}
                    disabled={isPrintingSample || isExportingPdfSample}
                    className="px-3 py-1.5 rounded-xl bg-purple-800 hover:bg-purple-900 active:scale-95 disabled:opacity-60 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    {isPrintingSample ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Printer className="w-3.5 h-3.5" />
                    )}
                    <span>{isPrintingSample ? 'กำลังเตรียมพิมพ์...' : 'พิมพ์'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSavePdfSample}
                    disabled={isExportingPdfSample || isPrintingSample}
                    className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 disabled:opacity-60 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    {isExportingPdfSample ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>{isExportingPdfSample ? 'กำลังสร้าง PDF...' : 'บันทึก PDF'}</span>
                  </button>
                </div>
              </div>

              {/* The Actual Certificate Frame */}
              <div className="flex-1 flex items-center justify-center p-2">
                <div
                  id="studio-cert-preview"
                  className="w-full aspect-[1.414/1] rounded-xl shadow-2xl relative flex flex-col justify-between select-none overflow-hidden transition-all text-slate-800 p-6 sm:p-8"
                  style={{
                    backgroundColor: '#ffffff',
                    backgroundImage: config.useCustomBackground && config.customBackgroundImage
                      ? `url(${config.customBackgroundImage})`
                      : currentTemplate.bgGradient,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: config.useCustomBackground
                      ? 'none'
                      : `4px solid ${currentTemplate.borderColor}`,
                  }}
                >
                  {/* Harmonious Dual Frame & Corner Filigrees (if not custom bg) */}
                  {!config.useCustomBackground && (
                    <>
                      {/* Inner delicate border */}
                      <div
                        className="absolute inset-3 sm:inset-3.5 border pointer-events-none rounded-sm"
                        style={{ borderColor: currentTemplate.innerBorderColor }}
                      />

                      {/* 4 Corner Classical Accents (Pure CSS for 100% canvas alignment & symmetry) */}
                      {/* Top-Left */}
                      <div
                        className="absolute top-2.5 left-2.5 w-6 h-6 pointer-events-none border-t-2 border-l-2"
                        style={{ borderColor: currentTemplate.borderColor }}
                      >
                        <div
                          className="w-3.5 h-3.5 border-t border-l m-0.5"
                          style={{ borderColor: currentTemplate.innerBorderColor }}
                        />
                        <div
                          className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: currentTemplate.borderColor }}
                        />
                      </div>

                      {/* Top-Right */}
                      <div
                        className="absolute top-2.5 right-2.5 w-6 h-6 pointer-events-none border-t-2 border-r-2"
                        style={{ borderColor: currentTemplate.borderColor }}
                      >
                        <div
                          className="w-3.5 h-3.5 border-t border-r m-0.5 float-right"
                          style={{ borderColor: currentTemplate.innerBorderColor }}
                        />
                        <div
                          className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: currentTemplate.borderColor }}
                        />
                      </div>

                      {/* Bottom-Left */}
                      <div
                        className="absolute bottom-2.5 left-2.5 w-6 h-6 pointer-events-none border-b-2 border-l-2"
                        style={{ borderColor: currentTemplate.borderColor }}
                      >
                        <div
                          className="w-3.5 h-3.5 border-b border-l m-0.5"
                          style={{ borderColor: currentTemplate.innerBorderColor }}
                        />
                        <div
                          className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: currentTemplate.borderColor }}
                        />
                      </div>

                      {/* Bottom-Right */}
                      <div
                        className="absolute bottom-2.5 right-2.5 w-6 h-6 pointer-events-none border-b-2 border-r-2"
                        style={{ borderColor: currentTemplate.borderColor }}
                      >
                        <div
                          className="w-3.5 h-3.5 border-b border-r m-0.5 float-right"
                          style={{ borderColor: currentTemplate.innerBorderColor }}
                        />
                        <div
                          className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: currentTemplate.borderColor }}
                        />
                      </div>
                    </>
                  )}

                  {/* Header: Logo & Institution */}
                  <div
                    className={`relative z-10 flex flex-col items-center text-center space-y-0.5 pt-0.5 ${
                      config.logoPosition === 'top-left'
                        ? 'items-start text-left pl-3'
                        : config.logoPosition === 'top-right'
                        ? 'items-end text-right pr-3'
                        : 'items-center text-center'
                    }`}
                  >
                    {config.showLogo && (
                      <div className="mb-1 flex items-center justify-center">
                        {activeLogo ? (
                          <img
                            src={activeLogo}
                            alt="Logo"
                            className="h-11 sm:h-13 md:h-14 w-auto max-w-[200px] object-contain drop-shadow-xs"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shadow">
                            <Award className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                    )}
                    <h3
                      className="text-xs sm:text-sm font-extrabold tracking-widest uppercase"
                      style={{ color: currentTemplate.titleColor }}
                    >
                      {config.institutionName}
                    </h3>
                    <p className="text-[9px] sm:text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
                      {config.institutionSubName}
                    </p>

                    {/* Prestigious Certificate Title with Wing Lines */}
                    <div className="flex items-center justify-center gap-2.5 pt-1">
                      <div
                        className="h-px w-8 sm:w-14"
                        style={{
                          background: `linear-gradient(to right, transparent, ${currentTemplate.borderColor})`,
                        }}
                      />
                      <span
                        className="text-xs sm:text-sm font-black tracking-widest uppercase px-3 py-0.5 rounded-full border shadow-2xs"
                        style={{
                          backgroundColor: currentTemplate.accentBadgeBg,
                          color: currentTemplate.accentTextColor,
                          borderColor: currentTemplate.innerBorderColor,
                        }}
                      >
                        {cleanAwardTitle}
                      </span>
                      <div
                        className="h-px w-8 sm:w-14"
                        style={{
                          background: `linear-gradient(to left, transparent, ${currentTemplate.borderColor})`,
                        }}
                      />
                    </div>
                    <p className="text-[9px] sm:text-[10px] text-slate-600 font-medium tracking-wide pt-0.5">
                      ขอมอบเกียรติบัตรฉบับนี้ให้ไว้เพื่อแสดงว่า
                    </p>
                  </div>

                  {/* Middle: Recipient & Statement */}
                  <div className="relative z-10 text-center my-auto py-1 space-y-1">
                    <h1
                      className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight"
                      style={{ color: currentTemplate.titleColor }}
                    >
                      {sampleStudent.fullName}
                    </h1>

                    <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] sm:text-xs font-semibold text-slate-600">
                      {config.showStudentId && (
                        <span>รหัสนักศึกษา: <strong className="font-mono text-slate-900">{sampleStudent.studentId}</strong></span>
                      )}
                      {config.showMajor && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>สาขาวิชา: <strong className="text-slate-900">{sampleStudent.major}</strong></span>
                        </>
                      )}
                      {config.showYearLevel && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>ชั้นปี: <strong className="text-slate-900">{sampleStudent.yearLevel}</strong></span>
                        </>
                      )}
                    </div>

                    <p className="text-[10px] sm:text-xs text-slate-700 max-w-md mx-auto leading-relaxed font-medium">
                      {config.bodyText}{' '}
                      <strong className="font-bold" style={{ color: currentTemplate.titleColor }}>
                        {config.activityTitle}
                      </strong>
                    </p>

                    {/* Stats & Honor Seal A+ (Harmoniously Proportioned) */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      {config.showAttendanceStats && (
                        <div
                          className="px-3 py-1 rounded-xl text-[10px] sm:text-xs font-bold border flex items-center gap-1.5 shadow-2xs"
                          style={{
                            backgroundColor: currentTemplate.accentBadgeBg,
                            borderColor: currentTemplate.innerBorderColor,
                            color: currentTemplate.accentTextColor,
                          }}
                        >
                          <span>สถิติการเข้าร่วม:</span>
                          <strong className="text-emerald-700 font-black">{sampleStudent.rate.toFixed(1)}%</strong>
                          <span>({sampleStudent.present}/{sampleStudent.total} ครั้ง)</span>
                          {config.showLevelLabel && (
                            <>
                              <span className="opacity-40">|</span>
                              <span>{sampleStudent.level}</span>
                            </>
                          )}
                        </div>
                      )}

                      {/* GRADE A+ HONOR BADGE */}
                      {config.showHonorBadgeA && (
                        <div className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[10px] sm:text-xs font-black shadow-sm flex items-center gap-1.5 border border-yellow-300">
                          <Award className="w-3.5 h-3.5 text-yellow-100" />
                          <span>เกียรตินิยม A+ (ผลการประเมินดีเยี่ยม)</span>
                        </div>
                      )}
                    </div>

                    <p className="text-[9px] sm:text-[10px] text-slate-500 italic pt-0.5">
                      “{config.blessingText}”
                    </p>
                  </div>

                  {/* Footer: Signatures & Verification (No line cutting through middle seal) */}
                  <div className="relative z-10 pt-2 flex items-end justify-between text-center text-[10px] sm:text-xs pb-0.5">
                    {/* Signatory 1 */}
                    <div className="space-y-0.5 w-36 sm:w-44">
                      <div className="border-b border-slate-400 w-28 mx-auto mb-1 h-6 flex items-end justify-center">
                        <span className="font-serif italic text-slate-400 text-[11px]">
                          {config.signatory1Title}
                        </span>
                      </div>
                      <p className="font-bold text-slate-800 text-[10px] sm:text-[11px] leading-tight">
                        {config.signatory1Name}
                      </p>
                      <p className="text-[9px] text-slate-500 leading-tight">{config.signatory1Role}</p>
                    </div>

                    {/* Middle Seal & Date */}
                    <div className="text-center px-1">
                      <div
                        className="w-9 h-9 rounded-full border-2 border-double mx-auto flex items-center justify-center mb-0.5 shadow-2xs"
                        style={{
                          borderColor: currentTemplate.borderColor,
                          backgroundColor: currentTemplate.accentBadgeBg,
                        }}
                      >
                        <Sparkles className="w-4 h-4" style={{ color: currentTemplate.borderColor }} />
                      </div>
                      {config.showDocRef && (
                        <span className="text-[8px] sm:text-[9px] text-slate-400 block font-mono font-semibold">
                          EDU-HALAQAH-{sampleStudent.studentId}
                        </span>
                      )}
                      {config.showDate && (
                        <span className="text-[8px] sm:text-[9px] text-slate-500 block font-medium">
                          ออก ณ วันที่ {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      )}
                    </div>

                    {/* Signatory 2 */}
                    <div className="space-y-0.5 w-36 sm:w-44">
                      <div className="border-b border-slate-400 w-28 mx-auto mb-1 h-6 flex items-end justify-center">
                        <span className="font-serif italic text-slate-400 text-[11px]">
                          {config.signatory2Title}
                        </span>
                      </div>
                      <p className="font-bold text-slate-800 text-[10px] sm:text-[11px] leading-tight">
                        {config.signatory2Name}
                      </p>
                      <p className="text-[9px] text-slate-500 leading-tight">{config.signatory2Role}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center text-[11px] text-slate-500 mt-2">
                💡 เมื่อกด &quot;บันทึกการตั้งค่า&quot; ระบบจะนำเทมเพลตและเลเอาต์นี้ไปใช้ออกเกียรติบัตรให้นักศึกษาทุกคนโดยอัตโนมัติ
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
