'use client';

import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  X,
  User,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Student, AttendanceRecord } from '@/lib/types';
import { studentSelfCheckIn } from '@/lib/api-client';

interface StudentSelfRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledStudentId?: string;
  prefilledPin?: string;
  majors: string[];
  isNewStudentOnly?: boolean;
  student?: Student | null; // ถ้ามี แปลว่า นศ. มีในระบบแล้ว แค่กรอก PIN
  onSuccess: (student: Student, record: AttendanceRecord) => void;
}

export const StudentSelfRegisterModal: React.FC<StudentSelfRegisterModalProps> = ({
  isOpen,
  onClose,
  prefilledStudentId = '',
  prefilledPin = '',
  majors = [],
  isNewStudentOnly = false,
  student = null,
  onSuccess,
}) => {
  const [studentId, setStudentId] = useState(prefilledStudentId);
  const [fullName, setFullName] = useState(student?.fullName || '');
  const [gender, setGender] = useState<'ชาย' | 'หญิง'>(student?.gender || 'ชาย');
  const [major, setMajor] = useState(student?.major || majors[0] || 'อิสลามศึกษา');
  const [pin, setPin] = useState(prefilledPin);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (prefilledStudentId) setStudentId(prefilledStudentId);
  }, [prefilledStudentId]);

  useEffect(() => {
    if (prefilledPin) setPin(prefilledPin);
  }, [prefilledPin]);

  useEffect(() => {
    if (student) {
      setFullName(student.fullName);
      setGender(student.gender);
      if (student.major) setMajor(student.major);
    }
  }, [student]);

  if (!isOpen) return null;

  const isExisting = !!student;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanSid = studentId.trim().replace(/\D/g, '');
    const cleanPin = pin.trim();

    if (!cleanSid) {
      setErrorMsg('กรุณากรอกรหัสนักศึกษา');
      return;
    }
    if (cleanPin.length !== 4) {
      setErrorMsg('กรุณากรอกรหัส PIN 4 หลักที่มองเห็นบนจอ');
      return;
    }
    if (!isExisting && !fullName.trim()) {
      setErrorMsg('กรุณากรอกชื่อ-นามสกุล');
      return;
    }

    setBusy(true);
    try {
      const res = await studentSelfCheckIn({
        studentId: cleanSid,
        pin: cleanPin,
        fullName: isExisting ? student.fullName : fullName.trim(),
        gender: isExisting ? student.gender : gender,
        major: isExisting ? student.major : major,
        yearLevel: isExisting ? student.yearLevel : 'ปี 1',
        groupName: isExisting ? student.groupName : 'ส่วนกลาง (ปี 1)',
      });

      setBusy(false);
      if (res.success && res.student && res.record) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
        onSuccess(res.student, res.record);
        onClose();
      } else {
        setErrorMsg(res.message || 'บันทึกไม่สำเร็จ ตรวจสอบรหัส PIN อีกครั้ง');
      }
    } catch (err: any) {
      setBusy(false);
      setErrorMsg(err?.message || 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-purple-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-purple-100 overflow-hidden text-purple-950 animate-scaleUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-800 via-purple-900 to-indigo-950 px-6 py-5 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-purple-950 flex items-center justify-center font-black shadow-md">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base">
                {isExisting ? 'เช็คชื่อกิจกรรมวันนี้ด้วย PIN' : 'ลงทะเบียน นศ. ปี 1 พร้อมเช็คชื่อ'}
              </h3>
              <p className="text-[11px] text-purple-200">
                {isExisting
                  ? 'กรอกรหัส PIN 4 หลักจากจอโปรเจกเตอร์'
                  : 'กรอกข้อมูลครั้งแรกเพื่อสร้างโปรไฟล์และบันทึกสถิติ'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* รหัสนักศึกษา */}
          <div>
            <label className="text-xs font-bold text-purple-800 block mb-1">
              รหัสนักศึกษา (9 หลัก)
            </label>
            <input
              type="text"
              inputMode="numeric"
              disabled={isExisting}
              value={studentId}
              onChange={(e) => setStudentId(e.target.value.replace(/[^\d\s-]/g, ''))}
              placeholder="เช่น 691441001"
              className="w-full px-4 py-3 rounded-2xl border border-purple-200 font-mono font-black text-lg focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-purple-50"
            />
          </div>

          {/* ฟิลด์เพิ่มเติมเฉพาะตอนลงทะเบียนใหม่ */}
          {!isExisting && (
            <>
              <div>
                <label className="text-xs font-bold text-purple-800 block mb-1">
                  ชื่อ - นามสกุล (พร้อมคำนำหน้า)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="เช่น นายอับดุลลอฮ์ มาหะมะ"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-purple-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-purple-800 block mb-1">เพศ</label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-purple-50 border border-purple-100">
                    <button
                      type="button"
                      onClick={() => setGender('ชาย')}
                      className={`py-1.5 text-xs font-bold rounded-xl transition ${
                        gender === 'ชาย'
                          ? 'bg-purple-900 text-white shadow-sm'
                          : 'text-purple-700 hover:bg-purple-100'
                      }`}
                    >
                      ชาย
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('หญิง')}
                      className={`py-1.5 text-xs font-bold rounded-xl transition ${
                        gender === 'หญิง'
                          ? 'bg-purple-900 text-white shadow-sm'
                          : 'text-purple-700 hover:bg-purple-100'
                      }`}
                    >
                      หญิง
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-purple-800 block mb-1">ชั้นปี</label>
                  <input
                    type="text"
                    disabled
                    value="ปี 1 (ส่วนกลาง)"
                    className="w-full px-3 py-2 rounded-2xl border border-purple-100 bg-purple-50/70 text-xs font-bold text-purple-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-purple-800 block mb-1">สาขาวิชา</label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-purple-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                  >
                    {majors.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* รหัส PIN 4 หลัก */}
          <div className="pt-2">
            <label className="text-xs font-extrabold text-amber-700 flex items-center justify-between mb-1">
              <span>รหัส PIN 4 หลัก (จากจอโปรเจกเตอร์)</span>
              <span className="text-[10px] text-purple-500 font-normal">ตัวเลข 4 ตัว</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="• • • •"
              className="w-full text-center text-3xl font-black font-mono tracking-[0.3em] py-3.5 rounded-2xl bg-amber-50/80 border-2 border-amber-300 text-purple-950 focus:outline-none focus:ring-4 focus:ring-amber-200 placeholder:text-amber-200"
            />
          </div>

          <button
            type="submit"
            disabled={busy || pin.length !== 4}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-800 to-indigo-900 hover:from-purple-900 hover:to-indigo-950 disabled:opacity-40 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-950/20 active:scale-95 transition"
          >
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลังตรวจสอบและบันทึก...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                {isExisting ? 'ยืนยันการเช็คชื่อ' : 'ยืนยันลงทะเบียนและเช็คชื่อ'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
