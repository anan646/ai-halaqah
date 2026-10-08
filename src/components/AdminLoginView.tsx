'use client';

import React, { useState } from 'react';
import { Lock, KeyRound, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import { verifyAdminPasscode, setAdminSession } from '@/lib/admin-auth';
import { getFacultyPassword } from '@/lib/data-store';
import { fetchPublicData } from '@/lib/api-client';

interface AdminLoginViewProps {
  onLoginSuccess: (user: { id: string; name: string; role: 'admin' | 'subadmin' }) => void;
  onCancel: () => void;
  customLogo?: string;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  onLoginSuccess,
  onCancel,
  customLogo,
}) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = passcode.trim();
    if (!input) {
      setError('กรุณาระบุรหัสผ่าน');
      return;
    }
    setError('');

    setBusy(true);
    const res = await verifyAdminPasscode(input);
    setBusy(false);
    if (res.valid && res.user) {
      setAdminSession(res.user);
      onLoginSuccess(res.user);
    } else {
      // ตรวจสอบว่าผู้ใช้เผลอนำรหัสของอาจารย์มากรอกหรือไม่
      const localFacultyPass = String(getFacultyPassword() || '').trim();
      let remoteFacultyPass = '';
      try {
        const pub = await fetchPublicData();
        remoteFacultyPass = pub.facultyPassword ? String(pub.facultyPassword).trim() : '';
      } catch {}

      if (input === localFacultyPass || (remoteFacultyPass && input === remoteFacultyPass)) {
        setError('รหัสที่คุณกรอกคือ "รหัสผ่านสำหรับอาจารย์/บุคลากร" หากต้องการใช้งาน ให้กดกลับหน้าหลักแล้วเข้าสู่ระบบที่ปุ่ม "สำหรับอาจารย์ผู้รับผิดชอบ" (รหัสแอดมินตั้งต้นคือ 71300807)');
      } else {
        setError(res.message || 'รหัสผ่านแอดมินไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง');
      }
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-3xl border border-purple-100 shadow-xl shadow-purple-900/10 p-6 sm:p-8 space-y-6">
        {/* Top Icon */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-purple-950">
              เข้าสู่ระบบผู้ดูแลระบบ (Admin)
            </h2>
            <p className="text-xs sm:text-sm text-purple-800/60 mt-1">
              กรุณาระบุรหัสผ่านเพื่อเข้าใช้งาน Dashboard
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-purple-950 mb-1.5">
              รหัสผ่านแอดมิน
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-purple-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                autoFocus
                placeholder="ระบุรหัสผ่าน..."
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setError('');
                }}
                className="w-full pl-10 pr-4 py-3 text-center text-lg tracking-widest font-mono border border-purple-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-600 bg-purple-50/40 text-purple-950 font-bold placeholder-purple-300"
              />
            </div>
            {error && (
              <p className="text-xs font-bold text-rose-600 mt-2 flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </p>
            )}
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white font-bold text-sm rounded-2xl shadow-lg shadow-purple-900/20 transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>ยืนยันเข้าสู่ระบบ</span>
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2.5 text-xs font-semibold text-purple-800/70 hover:text-purple-950 hover:bg-purple-50 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>กลับหน้าหลัก</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
