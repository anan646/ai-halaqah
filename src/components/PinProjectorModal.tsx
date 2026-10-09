'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import QRCode from 'qrcode';
import {
  KeyRound,
  QrCode,
  X,
  Maximize2,
  Minimize2,
  RefreshCw,
  Power,
  Users,
  CheckCircle2,
  Sparkles,
  Calendar,
  BookOpen,
  Copy,
  Check,
  Radio,
} from 'lucide-react';
import { AttendanceRecord } from '@/lib/types';
import { ActivePinSession, saveActivePinSession, fetchActivePinSession } from '@/lib/api-client';

interface PinProjectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: AttendanceRecord[];
  todayDate: string;
  defaultTopic?: string;
}

export const PinProjectorModal: React.FC<PinProjectorModalProps> = ({
  isOpen,
  onClose,
  records,
  todayDate,
  defaultTopic = 'กิจกรรมหะละเกาะห์ อัลกุรอาน',
}) => {
  const [pin, setPin] = useState<string>('8254');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [topic, setTopic] = useState<string>(defaultTopic);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // สุ่ม PIN 4 หลัก
  const generateRandomPin = () => {
    const random = Math.floor(1000 + Math.random() * 9000).toString();
    setPin(random);
  };

  // ดึงข้อมูล PIN ล่าสุดจากชีตเมื่อเปิด
  useEffect(() => {
    if (isOpen) {
      fetchActivePinSession().then((session) => {
        if (session) {
          if (session.pin) setPin(session.pin);
          if (typeof session.active === 'boolean') setIsActive(session.active);
          if (session.topic) setTopic(session.topic);
        }
      });
    }
  }, [isOpen]);

  // สร้าง QR Code เมื่อ pin หรือ topic เปลี่ยน
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const origin = window.location.origin;
    const targetUrl = `${origin}?checkinPin=${encodeURIComponent(pin)}`;

    QRCode.toDataURL(targetUrl, {
      width: 500,
      margin: 2,
      color: {
        dark: '#3b0764', // deep purple
        light: '#ffffff',
      },
    })
      .then((url) => setQrUrl(url))
      .catch((err) => console.error('Error generating QR:', err));
  }, [pin]);

  // นักศึกษาที่เช็คชื่อในวันนี้
  const todayCheckedRecords = useMemo(() => {
    return records
      .filter((r) => r.date === todayDate && r.status === 'มา')
      .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
  }, [records, todayDate]);

  // บันทึกและซิงค์ห้องเช็คชื่อ
  const handleSaveAndBroadcast = async (activeState = isActive) => {
    setIsSaving(true);
    const session: ActivePinSession = {
      pin: pin.trim(),
      date: todayDate,
      active: activeState,
      topic: topic.trim(),
      groupName: 'ส่วนกลาง (ปี 1)',
      hasPin: true,
      createdAt: new Date().toISOString(),
    };
    const res = await saveActivePinSession(session);
    setIsSaving(false);
    if (res.success) {
      setToastMsg(activeState ? '🟢 เปิดห้องเช็คชื่อด้วย PIN สำเร็จแล้ว' : '🔴 ปิดรับการเช็คชื่อแล้ว');
    } else {
      setToastMsg(res.message);
    }
    setTimeout(() => setToastMsg(null), 3500);
  };

  const toggleActive = () => {
    const next = !isActive;
    setIsActive(next);
    handleSaveAndBroadcast(next);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => null);
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => null);
      setIsFullScreen(false);
    }
  };

  const copyCheckinUrl = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      const url = `${window.location.origin}?checkinPin=${encodeURIComponent(pin)}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div
        className={`relative w-full ${
          isFullScreen
            ? 'h-full max-w-none rounded-none'
            : 'max-w-6xl max-h-[96vh] rounded-3xl'
        } bg-gradient-to-br from-purple-950 via-slate-950 to-indigo-950 text-white border border-purple-500/30 shadow-2xl flex flex-col overflow-hidden transition-all`}
      >
        {/* Header Bar */}
        <div className="px-5 py-4 bg-purple-900/60 border-b border-purple-500/20 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-purple-950 flex items-center justify-center font-black shadow-lg shadow-amber-400/20">
              <KeyRound className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight truncate">
                  ห้องเช็คชื่อด้วย PIN / QR Code
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black shadow-sm ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                    }`}
                  />
                  {isActive ? 'กำลังเปิดรับเช็คชื่อ (LIVE)' : 'ปิดรับเช็คชื่อ'}
                </span>
              </div>
              <p className="text-xs text-purple-300 truncate">
                สำหรับฉายขึ้นจอโปรเจกเตอร์หรือเวที • นศ. ปี 1 และส่วนกลางเช็คชื่อพร้อมกันใน 1 นาที
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleActive}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition active:scale-95 ${
                isActive
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <Power className="w-4 h-4" />
              <span className="hidden sm:inline">
                {isActive ? 'ปิดรับชั่วคราว' : 'เปิดรับเช็คชื่อ'}
              </span>
            </button>

            <button
              type="button"
              onClick={toggleFullScreen}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
              title={isFullScreen ? 'ย่อหน้าต่าง' : 'ฉายเต็มจอโปรเจกเตอร์'}
            >
              {isFullScreen ? (
                <Minimize2 className="w-5 h-5 text-amber-300" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {toastMsg && (
          <div className="bg-amber-500 text-purple-950 text-xs font-black px-4 py-2 text-center animate-fadeIn">
            {toastMsg}
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* ฝั่งซ้าย: PIN ตัวใหญ่ + QR Code (เสาหลักของจอโปรเจกเตอร์) */}
          <div className="lg:col-span-8 flex flex-col items-center text-center space-y-6">
            {/* กล่องหัวข้อกิจกรรม */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 border border-white/15 text-sm font-bold text-purple-200">
              <Calendar className="w-4 h-4 text-amber-300" />
              <span>วันที่: {todayDate}</span>
              <span>•</span>
              <span className="text-white font-extrabold">{topic}</span>
            </div>

            {/* เลข PIN 4 หลัก ขนาดยักษ์ (อ่านได้ชัดเจนจากระยะไกล 20 เมตร) */}
            <div className="space-y-3">
              <div className="text-xs sm:text-sm font-extrabold tracking-widest text-amber-300 uppercase flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4" /> รหัส PIN 4 หลัก สำหรับกรอกเช็คชื่อ
              </div>

              <div className="flex items-center justify-center gap-3 sm:gap-5">
                {pin.split('').map((digit, idx) => (
                  <div
                    key={idx}
                    className="w-16 h-24 sm:w-24 sm:h-36 rounded-3xl bg-gradient-to-b from-purple-800 to-indigo-950 border-2 border-amber-400/60 shadow-2xl shadow-purple-950/80 flex items-center justify-center text-4xl sm:text-7xl font-black text-amber-300 font-mono select-all animate-scaleUp"
                  >
                    {digit}
                  </div>
                ))}
              </div>
            </div>

            {/* QR Code สำหรับคนที่อยากยกกล้องขึ้นมาสแกน */}
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 sm:p-5 rounded-3xl bg-white shadow-2xl border-4 border-amber-400/40 relative group">
                {qrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrUrl}
                    alt="QR Code สำหรับเช็คชื่อ"
                    className="w-44 h-44 sm:w-56 sm:h-56 object-contain"
                  />
                ) : (
                  <div className="w-44 h-44 sm:w-56 sm:h-56 flex items-center justify-center text-slate-400 text-xs">
                    กำลังสร้าง QR Code...
                  </div>
                )}
              </div>
              <div className="text-xs text-purple-300 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-amber-400" />
                <span>หรือใช้กล้องมือถือสแกน QR Code นี้เพื่อเปิดแอปอัตโนมัติ</span>
              </div>
            </div>

            {/* แถบควบคุมสำหรับแอดมิน */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={generateRandomPin}
                className="px-4 py-2 rounded-xl bg-purple-900/80 hover:bg-purple-800 border border-purple-400/30 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-300" />
                สุ่มรหัส PIN ใหม่
              </button>
              <button
                type="button"
                onClick={copyCheckinUrl}
                className="px-4 py-2 rounded-xl bg-purple-900/80 hover:bg-purple-800 border border-purple-400/30 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'คัดลอกลิงก์แล้ว' : 'คัดลอกลิงก์ส่งไลน์'}
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSaveAndBroadcast()}
                className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-purple-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-400/20 active:scale-95 transition"
              >
                <Radio className="w-3.5 h-3.5" />
                {isSaving ? 'กำลังบันทึก...' : 'ซิงค์รหัส PIN ไปยังระบบ'}
              </button>
            </div>
          </div>

          {/* ฝั่งขวา: Live Counter & ผู้ที่เพิ่งเช็คชื่อสดๆ */}
          <div className="lg:col-span-4 bg-purple-900/40 rounded-3xl border border-purple-500/20 p-5 flex flex-col h-full max-h-[540px]">
            {/* สถิติตัวนับสด */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-800 to-indigo-900 border border-purple-400/30 text-center space-y-1 mb-4 shadow-lg shadow-purple-950/40">
              <div className="text-xs font-extrabold text-purple-300 flex items-center justify-center gap-1.5">
                <Users className="w-4 h-4 text-amber-400" />
                เช็คชื่อสำเร็จแล้ววันนี้
              </div>
              <div className="text-4xl sm:text-5xl font-black text-amber-300 font-mono tracking-tight">
                {todayCheckedRecords.length}
                <span className="text-base text-purple-200 font-normal ml-2">คน</span>
              </div>
              <p className="text-[11px] text-purple-300">
                ข้อมูลอัปเดตแบบเรียลไทม์จากมือถือ นศ.
              </p>
            </div>

            {/* รายชื่อสด (Live Feed) */}
            <div className="flex items-center justify-between text-xs font-extrabold text-purple-200 mb-2 px-1">
              <span>รายชื่อที่เช็คชื่อล่าสุด</span>
              <span className="text-[10px] text-purple-400">
                (แสดง {Math.min(todayCheckedRecords.length, 30)} คนล่าสุด)
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {todayCheckedRecords.map((r, i) => (
                <div
                  key={`${r.studentId}-${i}`}
                  className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-between gap-3 text-xs animate-fadeIn"
                >
                  <div className="min-w-0 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-white truncate">
                        {r.studentName}
                      </div>
                      <div className="text-[11px] text-purple-300 font-mono">
                        {r.studentId} • {r.yearLevel || 'ปี 1'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-purple-400 shrink-0">
                    {r.recordedTime || '-'} น.
                  </span>
                </div>
              ))}

              {todayCheckedRecords.length === 0 && (
                <div className="h-48 flex flex-col items-center justify-center text-center text-purple-400 text-xs gap-2">
                  <Users className="w-8 h-8 opacity-40" />
                  <span>ยังไม่มี นศ. เช็คชื่อในวันนี้</span>
                  <span className="text-[11px] text-purple-500">
                    เมื่อ นศ. กรอก PIN หรือสแกน QR รายชื่อจะเด้งขึ้นที่นี่ทันที
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
