'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  X,
  Printer,
  Download,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  CheckCircle2,
  Loader2,
  Palette,
  Type,
  PenLine,
  SlidersHorizontal,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { ModalPortal } from './ModalPortal';
import {
  CertificateConfig,
  CERTIFICATE_TEMPLATES,
  getCertificateConfig,
  saveCertificateConfig,
  DEFAULT_CERTIFICATE_CONFIG,
  SignatureSize,
} from '@/lib/certificate-config';
import { saveCertificatePdf, printCertificate } from '@/lib/certificate-export';
import { fileToResizedDataUrl } from '@/lib/image-utils';
import {
  CertificateCanvas,
  CertificatePreview,
  SAMPLE_CERT_STUDENT,
} from './CertificateCanvas';

interface CertificateStudioModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  systemLogo?: string;
  isEmbedded?: boolean;
}

type StudioTab = 'template' | 'content' | 'signature' | 'display';

const TABS: { id: StudioTab; label: string; icon: React.ReactNode }[] = [
  { id: 'template', label: 'เลือกแบบ', icon: <Palette className="w-4 h-4" /> },
  { id: 'content', label: 'ข้อความ', icon: <Type className="w-4 h-4" /> },
  { id: 'signature', label: 'ลายเซ็น', icon: <PenLine className="w-4 h-4" /> },
  { id: 'display', label: 'การแสดงผล', icon: <SlidersHorizontal className="w-4 h-4" /> },
];

const SIG_SIZES: { id: SignatureSize; label: string }[] = [
  { id: 'medium', label: 'กลาง' },
  { id: 'large', label: 'ใหญ่' },
  { id: 'xlarge', label: 'ใหญ่มาก' },
];

const inputCls =
  'w-full px-3 py-2 border border-purple-200 rounded-xl bg-white text-purple-950 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-400 outline-none';

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string }> = ({
  checked,
  onChange,
  label,
}) => (
  <label className="flex items-center justify-between gap-3 py-2 cursor-pointer select-none">
    <span className="text-sm text-purple-950">{label}</span>
    <span className="relative inline-flex shrink-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <span className="w-10 h-6 rounded-full bg-purple-200 peer-checked:bg-purple-700 transition" />
      <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
    </span>
  </label>
);

export const CertificateStudioModal: React.FC<CertificateStudioModalProps> = ({
  isOpen = true,
  onClose,
  systemLogo,
  isEmbedded = false,
}) => {
  const [config, setConfig] = useState<CertificateConfig>(() => getCertificateConfig());
  const [tab, setTab] = useState<StudioTab>('template');
  const [sampleName, setSampleName] = useState(SAMPLE_CERT_STUDENT.fullName);
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle');
  const [busy, setBusy] = useState<'print' | 'pdf' | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const bgRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const sig1Ref = useRef<HTMLInputElement>(null);
  const sig2Ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen || isEmbedded) {
      setConfig(getCertificateConfig());
      loadedRef.current = false;
    }
  }, [isOpen, isEmbedded]);

  // บันทึกอัตโนมัติทุกครั้งที่แก้ไข (ไม่ต้องกดปุ่มบันทึก)
  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      return;
    }
    const timer = setTimeout(() => {
      const ok = saveCertificateConfig(config);
      setSaveState(ok ? 'saved' : 'error');
    }, 350);
    return () => clearTimeout(timer);
  }, [config]);

  const student = useMemo(() => ({ ...SAMPLE_CERT_STUDENT, fullName: sampleName || SAMPLE_CERT_STUDENT.fullName }), [sampleName]);

  if (!isEmbedded && !isOpen) return null;

  const patch = (p: Partial<CertificateConfig>) => setConfig((prev) => ({ ...prev, ...p }));
  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const upload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    apply: (url: string) => Partial<CertificateConfig>,
    max: [number, number],
    type: 'image/png' | 'image/jpeg',
    okMsg: string
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const url = await fileToResizedDataUrl(file, max[0], max[1], type);
      patch(apply(url));
      flash(okMsg);
    } catch (err: any) {
      flash(err?.message || 'อัปโหลดรูปไม่สำเร็จ');
    }
  };

  const canvasEl = (
    <CertificateCanvas
      config={config}
      student={student}
      logo={systemLogo}
      semesterLabel="ภาคเรียนที่ 1 ปีการศึกษา 2568"
      isHonor
    />
  );

  const handlePrint = async () => {
    setBusy('print');
    try {
      await printCertificate(canvasEl, 'เกียรติบัตร_ตัวอย่าง');
    } catch (err) {
      console.error(err);
      flash('เตรียมพิมพ์ไม่สำเร็จ ลองใช้ปุ่ม "บันทึก PDF" แทน');
    } finally {
      setBusy(null);
    }
  };

  const handlePdf = async () => {
    setBusy('pdf');
    try {
      await saveCertificatePdf(canvasEl, 'เกียรติบัตร_ตัวอย่าง.pdf');
      flash('บันทึกไฟล์ PDF แนวนอน A4 แล้ว');
    } catch (err) {
      console.error(err);
      flash('สร้างไฟล์ PDF ไม่สำเร็จ');
    } finally {
      setBusy(null);
    }
  };

  const handleReset = () => {
    if (!confirm('รีเซ็ตการตั้งค่าเกียรติบัตรทั้งหมดกลับเป็นค่าเริ่มต้น?')) return;
    setConfig(DEFAULT_CERTIFICATE_CONFIG);
  };

  const renderSigCard = (n: 1 | 2) => {
    const url = n === 1 ? config.signatory1SignatureUrl : config.signatory2SignatureUrl;
    const ref = n === 1 ? sig1Ref : sig2Ref;
    const key = n === 1 ? 'signatory1SignatureUrl' : 'signatory2SignatureUrl';
    return (
      <div className="rounded-2xl border border-purple-200 bg-white p-4 space-y-3">
        <div className="text-sm font-bold text-purple-950">ผู้ลงนามที่ {n} ({n === 1 ? 'ซ้าย' : 'ขวา'})</div>
        <input
          className={inputCls}
          placeholder="ชื่อ-สกุล"
          value={n === 1 ? config.signatory1Name : config.signatory2Name}
          onChange={(e) => patch(n === 1 ? { signatory1Name: e.target.value } : { signatory2Name: e.target.value })}
        />
        <input
          className={inputCls}
          placeholder="ตำแหน่ง"
          value={n === 1 ? config.signatory1Role : config.signatory2Role}
          onChange={(e) => patch(n === 1 ? { signatory1Role: e.target.value } : { signatory2Role: e.target.value })}
        />
        <input
          ref={ref}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) =>
            upload(e, (u) => ({ [key]: u }) as Partial<CertificateConfig>, [900, 360], 'image/png', `อัปโหลดลายเซ็นที่ ${n} แล้ว`)
          }
        />
        {url ? (
          <div className="rounded-xl border border-purple-200 bg-[repeating-conic-gradient(#f5f3ff_0%_25%,#ffffff_0%_50%)] [background-size:16px_16px] p-3 flex flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`ลายเซ็น ${n}`} className="h-28 max-w-full object-contain" />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => ref.current?.click()}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-purple-100 text-purple-900 hover:bg-purple-200"
              >
                เปลี่ยนรูป
              </button>
              <button
                type="button"
                onClick={() => patch({ [key]: '' } as Partial<CertificateConfig>)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                ลบ
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => ref.current?.click()}
            className="w-full h-32 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50/60 hover:bg-purple-100/70 text-purple-800 flex flex-col items-center justify-center gap-1.5 transition"
          >
            <Upload className="w-6 h-6" />
            <span className="text-sm font-bold">อัปโหลดรูปลายเซ็น</span>
            <span className="text-[11px] text-purple-600">แนะนำไฟล์ PNG พื้นโปร่งใส</span>
          </button>
        )}
      </div>
    );
  };

  const body = (
    <div
      className={`bg-white rounded-3xl w-full flex flex-col border border-purple-200 shadow-card overflow-hidden ${
        isEmbedded ? '' : 'max-w-7xl max-h-[96vh] my-auto'
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-800 via-purple-900 to-indigo-950 px-4 sm:px-6 py-3.5 text-white flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 text-amber-300" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-extrabold truncate">สตูดิโอเกียรติบัตร</h2>
            <p className="text-[11px] text-purple-200 flex items-center gap-1.5">
              {saveState === 'error' ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                  บันทึกไม่สำเร็จ (รูปใหญ่เกินพื้นที่เก็บข้อมูล) ลองลดขนาดรูป
                </>
              ) : saveState === 'saved' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  บันทึกอัตโนมัติแล้ว
                </>
              ) : (
                'ทุกการแก้ไขบันทึกให้อัตโนมัติ'
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">รีเซ็ต</span>
          </button>
          {!isEmbedded && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center"
              aria-label="ปิด"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {toast && (
        <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 text-center">{toast}</div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(340px,430px)_1fr] min-h-0 flex-1">
        {/* ซ้าย: ตัวควบคุม */}
        <div className="border-b xl:border-b-0 xl:border-r border-purple-100 bg-purple-50/40 flex flex-col min-h-0">
          <div className="p-2.5 bg-white border-b border-purple-100 grid grid-cols-4 gap-1">
            {TABS.map((tb) => (
              <button
                key={tb.id}
                type="button"
                onClick={() => setTab(tb.id)}
                className={`py-2 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition ${
                  tab === tb.id ? 'bg-purple-800 text-white shadow' : 'text-purple-800 hover:bg-purple-100'
                }`}
              >
                {tb.icon}
                <span>{tb.label}</span>
              </button>
            ))}
          </div>

          <div className="p-4 space-y-4 overflow-y-auto xl:max-h-[calc(100vh-14rem)]">
            {/* ===== เลือกแบบ ===== */}
            {tab === 'template' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {CERTIFICATE_TEMPLATES.map((tpl, idx) => {
                    const selected = !config.useCustomBackground && config.templateId === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => patch({ templateId: tpl.id, useCustomBackground: false })}
                        className={`text-left rounded-2xl p-1.5 border-2 transition bg-white ${
                          selected ? 'border-purple-700 ring-2 ring-purple-300 shadow-md' : 'border-transparent hover:border-purple-300 shadow-sm'
                        }`}
                        title={tpl.description}
                      >
                        <div className="rounded-lg overflow-hidden ring-1 ring-black/5 pointer-events-none">
                          <CertificatePreview
                            config={{ ...config, templateId: tpl.id, useCustomBackground: false }}
                            student={SAMPLE_CERT_STUDENT}
                            logo={systemLogo}
                            semesterLabel="ภาคเรียนที่ 1 ปีการศึกษา 2568"
                            isHonor
                          />
                        </div>
                        <div className="px-1.5 pt-1.5 pb-1">
                          <div className="text-xs font-extrabold text-purple-950 flex items-center gap-1.5">
                            <span className="text-purple-500">{idx + 1}.</span>
                            {tpl.name}
                            {selected && <CheckCircle2 className="w-3.5 h-3.5 text-purple-700 ml-auto" />}
                          </div>
                          <div className="text-[10px] text-purple-700/70 leading-snug line-clamp-2">{tpl.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-2xl border border-purple-200 bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-purple-950 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-purple-700" />
                      ใช้ภาพพื้นหลังของท่านเอง
                    </div>
                    <Toggle
                      checked={config.useCustomBackground}
                      onChange={(v) => patch({ useCustomBackground: v })}
                      label=""
                    />
                  </div>
                  <p className="text-[11px] text-purple-700/80">
                    อัปโหลดภาพกระดาษเกียรติบัตรแนวนอน (JPG/PNG อัตราส่วน A4) ข้อความจะวางทับบนภาพ
                  </p>
                  <input
                    ref={bgRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      upload(
                        e,
                        (u) => ({ customBackgroundImage: u, useCustomBackground: true }),
                        [1600, 1130],
                        'image/jpeg',
                        'ตั้งภาพพื้นหลังแล้ว'
                      )
                    }
                  />
                  <button
                    type="button"
                    onClick={() => bgRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {config.customBackgroundImage ? 'เปลี่ยนภาพพื้นหลัง' : 'เลือกภาพพื้นหลัง'}
                  </button>
                </div>
              </>
            )}

            {/* ===== ข้อความ ===== */}
            {tab === 'content' && (
              <div className="space-y-3">
                {(
                  [
                    ['institutionName', 'ชื่อสถาบัน/คณะ (ไทย)'],
                    ['institutionSubName', 'ชื่อสถาบัน/คณะ (อังกฤษ)'],
                    ['awardTitle', 'หัวข้อเกียรติบัตร'],
                    ['activityTitle', 'ชื่อโครงการ'],
                  ] as [keyof CertificateConfig, string][]
                ).map(([k, label]) => (
                  <div key={k}>
                    <label className="text-xs font-bold text-purple-900 block mb-1">{label}</label>
                    <input
                      className={inputCls}
                      value={(config[k] as string) || ''}
                      onChange={(e) => patch({ [k]: e.target.value } as Partial<CertificateConfig>)}
                    />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-bold text-purple-900 block mb-1">ข้อความบรรยาย</label>
                  <textarea
                    rows={3}
                    className={inputCls}
                    value={config.bodyText}
                    onChange={(e) => patch({ bodyText: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-purple-900 block mb-1">คำอวยพร / ดุอาอ์ท้ายเกียรติบัตร</label>
                  <textarea
                    rows={2}
                    className={`${inputCls} italic`}
                    value={config.blessingText}
                    onChange={(e) => patch({ blessingText: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-purple-900 block mb-1">
                    ทดลองพิมพ์ชื่อนักศึกษา (ดูตัวอย่างชื่อยาว)
                  </label>
                  <input className={inputCls} value={sampleName} onChange={(e) => setSampleName(e.target.value)} />
                </div>
              </div>
            )}

            {/* ===== ลายเซ็น ===== */}
            {tab === 'signature' && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-purple-200 bg-white p-4 space-y-2">
                  <div className="text-sm font-bold text-purple-950">ขนาดรูปลายเซ็นบนเกียรติบัตร</div>
                  <div className="grid grid-cols-3 gap-2">
                    {SIG_SIZES.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => patch({ signatureSize: s.id })}
                        className={`py-2 rounded-xl text-xs font-bold border transition ${
                          (config.signatureSize || 'large') === s.id
                            ? 'bg-purple-800 text-white border-purple-800'
                            : 'bg-white text-purple-900 border-purple-200 hover:bg-purple-50'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                {renderSigCard(1)}
                {renderSigCard(2)}
              </div>
            )}

            {/* ===== การแสดงผล ===== */}
            {tab === 'display' && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-purple-200 bg-white px-4 py-2 divide-y divide-purple-100">
                  <Toggle checked={config.showLogo} onChange={(v) => patch({ showLogo: v })} label="แสดงโลโก้" />
                  <Toggle checked={config.showStudentId} onChange={(v) => patch({ showStudentId: v })} label="รหัสนักศึกษา" />
                  <Toggle checked={config.showMajor} onChange={(v) => patch({ showMajor: v })} label="สาขาวิชา" />
                  <Toggle checked={config.showYearLevel} onChange={(v) => patch({ showYearLevel: v })} label="ชั้นปี" />
                  <Toggle checked={config.showGroupName} onChange={(v) => patch({ showGroupName: v })} label="ชื่อกลุ่ม" />
                  <Toggle checked={config.showAttendanceStats} onChange={(v) => patch({ showAttendanceStats: v })} label="สถิติการเข้าร่วม" />
                  <Toggle checked={config.showLevelLabel} onChange={(v) => patch({ showLevelLabel: v })} label="ระดับ (01/02/03)" />
                  <Toggle checked={config.showHonorBadgeA} onChange={(v) => patch({ showHonorBadgeA: v })} label="ตราเกียรตินิยม A+ (≥90%)" />
                  <Toggle checked={config.showDate} onChange={(v) => patch({ showDate: v })} label="วันที่ออกเกียรติบัตร" />
                  <Toggle checked={config.showDocRef} onChange={(v) => patch({ showDocRef: v })} label="เลขที่อ้างอิง" />
                </div>

                <div className="rounded-2xl border border-purple-200 bg-white p-4 space-y-2">
                  <div className="text-sm font-bold text-purple-950">ขนาดตัวอักษร</div>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        ['compact', 'เล็ก'],
                        ['normal', 'ปกติ'],
                        ['large', 'ใหญ่'],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => patch({ fontScale: id })}
                        className={`py-2 rounded-xl text-xs font-bold border transition ${
                          config.fontScale === id
                            ? 'bg-purple-800 text-white border-purple-800'
                            : 'bg-white text-purple-900 border-purple-200 hover:bg-purple-50'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-purple-200 bg-white p-4 space-y-2">
                  <div className="text-sm font-bold text-purple-950">โลโก้บนเกียรติบัตร</div>
                  <input
                    ref={logoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      upload(e, (u) => ({ customLogoUrl: u, showLogo: true }), [600, 300], 'image/png', 'ตั้งโลโก้ใหม่แล้ว')
                    }
                  />
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => logoRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      อัปโหลดโลโก้เฉพาะเกียรติบัตร
                    </button>
                    {config.customLogoUrl && (
                      <button
                        type="button"
                        onClick={() => patch({ customLogoUrl: undefined })}
                        className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold"
                      >
                        ใช้โลโก้ของระบบ
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ขวา: ตัวอย่างสด + ปุ่มพิมพ์/บันทึก (แยกกัน) */}
        <div className="p-4 sm:p-6 bg-gradient-to-br from-purple-100/60 to-indigo-100/50 flex flex-col gap-4 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-extrabold text-purple-950">ตัวอย่างสด • A4 แนวนอน</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePrint}
                disabled={!!busy}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-purple-50 text-purple-900 border border-purple-300 text-sm font-bold flex items-center gap-2 disabled:opacity-60 active:scale-95 transition"
              >
                {busy === 'print' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                สั่งพิมพ์
              </button>
              <button
                type="button"
                onClick={handlePdf}
                disabled={!!busy}
                className="px-4 py-2.5 rounded-xl bg-purple-800 hover:bg-purple-900 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-60 active:scale-95 transition shadow"
              >
                {busy === 'pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                บันทึกเป็น PDF
              </button>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden shadow-2xl ring-1 ring-purple-900/10 bg-white">
            <CertificatePreview
              config={config}
              student={student}
              logo={systemLogo}
              semesterLabel="ภาคเรียนที่ 1 ปีการศึกษา 2568"
              isHonor
            />
          </div>
          <p className="text-[11px] text-purple-800/70">
            ตัวอย่างนี้ใช้ข้อมูลสมมติ เมื่อนักศึกษากดรับเกียรติบัตรจะใช้ข้อมูลจริงของแต่ละคนด้วยแบบและข้อความเดียวกันนี้
          </p>
        </div>
      </div>
    </div>
  );

  if (isEmbedded) return body;
  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
        {body}
      </div>
    </ModalPortal>
  );
};
