'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { QrCode, X, RefreshCw, KeyRound, CheckCircle, Users, Copy, Check } from 'lucide-react';

interface DynamicQrModalProps {
  teacherName: string;
  groupName: string;
  date: string;
  pinCode: string;
  sessionTopic?: string;
  checkedCount: number;
  totalStudents: number;
  onRefreshPin: () => void;
  onClose: () => void;
}

export const DynamicQrModal: React.FC<DynamicQrModalProps> = ({
  teacherName,
  groupName,
  date,
  pinCode,
  sessionTopic,
  checkedCount,
  totalStudents,
  onRefreshPin,
  onClose,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const checkinUrl = `${origin}?checkinPin=${encodeURIComponent(pinCode)}&group=${encodeURIComponent(groupName)}&date=${encodeURIComponent(date)}`;

    QRCode.toDataURL(checkinUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#1e1b4b', // deep purple
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generating QR code:', err));
  }, [pinCode, groupName, date]);

  const handleCopyPin = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(pinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-purple-200 overflow-hidden flex flex-col text-purple-950">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 px-6 py-4 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-white/10 text-purple-200">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg">
                QR Code & PIN เช็คชื่อด่วน
              </h3>
              <p className="text-xs text-purple-200 font-medium">
                {groupName} • {teacherName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 flex flex-col items-center text-center space-y-6 overflow-y-auto max-h-[80vh]">
          {/* Date & Topic Pill */}
          <div className="space-y-1">
            <span className="inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-900 text-xs font-black">
              📅 วันที่ {date}
            </span>
            {sessionTopic && (
              <p className="text-xs text-purple-800 font-semibold max-w-sm mx-auto">
                📖 {sessionTopic}
              </p>
            )}
          </div>

          {/* QR Code Display */}
          <div className="relative p-4 bg-white rounded-3xl border-4 border-dashed border-purple-300 shadow-inner flex items-center justify-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Check-in QR Code"
                className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-purple-400">
                กำลังสร้าง QR Code...
              </div>
            )}
          </div>

          {/* Big 4-Digit PIN Code */}
          <div className="w-full bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100 p-4 rounded-3xl border border-purple-200 space-y-2">
            <span className="text-xs text-purple-700 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
              <KeyRound className="w-4 h-4 text-purple-600" />
              หรือกรอกรหัส PIN ประจำคาบนี้
            </span>

            <div className="flex items-center justify-center gap-3 py-1">
              {pinCode.split('').map((digit, idx) => (
                <div
                  key={idx}
                  className="w-12 h-14 sm:w-14 sm:h-16 rounded-2xl bg-white border-2 border-purple-400 text-purple-950 font-black text-2xl sm:text-3xl flex items-center justify-center shadow-md select-all font-mono"
                >
                  {digit}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={handleCopyPin}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-purple-200/50 text-purple-900 text-xs font-bold flex items-center gap-1.5 border border-purple-200 transition shadow-sm cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'คัดลอก PIN แล้ว' : 'คัดลอกรหัส PIN'}</span>
              </button>
              <button
                onClick={onRefreshPin}
                className="px-3 py-1.5 rounded-xl bg-purple-200/50 hover:bg-purple-200 text-purple-900 text-xs font-bold flex items-center gap-1.5 border border-purple-200 transition shadow-sm cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-purple-700" />
                <span>สุ่ม PIN ใหม่</span>
              </button>
            </div>
          </div>

          {/* Real-time Checked In Counter */}
          <div className="w-full flex items-center justify-between px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950 text-xs font-bold">
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>เช็คชื่อแล้วในคาบนี้:</span>
            </span>
            <span className="text-sm font-black text-emerald-700">
              {checkedCount} / {totalStudents} คน
            </span>
          </div>

          <p className="text-[11px] text-purple-700/80 leading-relaxed font-medium">
            💡 นักศึกษาสามารถสแกนด้วยกล้องมือถือ หรือเข้าหน้าเว็บแล้วกดปุ่ม{' '}
            <strong>"เช็คชื่อด่วนด้วย PIN"</strong> เพื่อบันทึกการเข้าเรียนได้ทันที
          </p>
        </div>
      </div>
    </div>
  );
};
