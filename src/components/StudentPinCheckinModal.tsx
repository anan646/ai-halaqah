'use client';

import React, { useState } from 'react';
import { KeyRound, X, CheckCircle2, AlertCircle, Sparkles, User, Hash } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getActiveStudents, findSessionByPin, getStudentMajor, getStudentLevel, getTermKey } from '@/lib/data-store';
import { AttendanceRecord } from '@/lib/types';
import { saveAttendanceBatch } from '@/lib/api-client';

interface StudentPinCheckinModalProps {
  initialPin?: string;
  onCheckinSuccess: (studentName: string) => void;
  onClose: () => void;
}

export const StudentPinCheckinModal: React.FC<StudentPinCheckinModalProps> = ({
  initialPin = '',
  onCheckinSuccess,
  onClose,
}) => {
  const [studentIdInput, setStudentIdInput] = useState('');
  const [pinInput, setPinInput] = useState(initialPin);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const cleanId = studentIdInput.trim();
    const cleanPin = pinInput.trim();

    if (!cleanId) {
      setStatusMessage({ type: 'error', text: 'กรุณากรอกรหัสนักศึกษา 9 หลัก' });
      return;
    }
    if (!cleanPin || cleanPin.length !== 4) {
      setStatusMessage({ type: 'error', text: 'กรุณากรอกรหัส PIN 4 หลักที่แสดงบนหน้าจออาจารย์' });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Find session matching this PIN
      const session = findSessionByPin(cleanPin);
      if (!session) {
        setStatusMessage({
          type: 'error',
          text: 'ไม่พบรหัส PIN นี้ในระบบ หรือรหัสหมดอายุแล้ว กรุณาตรวจสอบกับอาจารย์ประจำกลุ่ม',
        });
        setIsSubmitting(false);
        return;
      }

      // 2. Find student
      const allStudents = getActiveStudents();
      const student = allStudents.find((s) => s.studentId === cleanId);
      if (!student) {
        setStatusMessage({
          type: 'error',
          text: `ไม่พบรหัสนักศึกษา "${cleanId}" ในฐานข้อมูลกิจกรรมฮะละเกาะฮ์`,
        });
        setIsSubmitting(false);
        return;
      }

      // 3. Create Attendance Record
      const now = new Date();
      const timeStr = now.toLocaleTimeString('th-TH', { hour12: false });
      const record: AttendanceRecord = {
        id: `PIN_${session.date}_${student.studentId}`,
        date: session.date,
        studentId: student.studentId,
        studentName: student.fullName,
        teacherName: session.teacherName || student.teacherName,
        groupName: student.groupName,
        yearLevel: student.yearLevel,
        gender: student.gender,
        status: 'มา',
        recordedTime: timeStr,
        timestamp: now.toISOString(),
        major: getStudentMajor(student),
        level: getStudentLevel(student),
        sessionTopic: session.topic,
        notes: 'เช็คชื่อด้วย PIN / QR Code',
        term: getTermKey(),
      };

      await saveAttendanceBatch([record]);

      // Trigger Confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#059669', '#10b981', '#34d399', '#f59e0b'],
        });
      } catch {}

      setStatusMessage({
        type: 'success',
        text: `เช็คชื่อสำเร็จแล้ว! ยินดีต้อนรับ ${student.fullName} (บันทึกเวลา ${timeStr} น.)`,
      });

      onCheckinSuccess(student.fullName);

      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `เกิดข้อผิดพลาดในการบันทึก: ${err.message || err}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-purple-200 overflow-hidden flex flex-col text-purple-950">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 px-6 py-4 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-white/20 text-white">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg">
                เช็คชื่อด่วนด้วย PIN ประจำคาบ
              </h3>
              <p className="text-xs text-emerald-100 font-medium">
                บันทึกการเข้าร่วมกิจกรรมฮะละเกาะฮ์
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-start gap-2.5 animate-fadeIn ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed">{statusMessage.text}</div>
            </div>
          )}

          {/* Student ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-600" />
              <span>รหัสนักศึกษา (Student ID)</span>
            </label>
            <input
              type="text"
              required
              maxLength={15}
              placeholder="เช่น 681441001"
              value={studentIdInput}
              onChange={(e) => setStudentIdInput(e.target.value.replace(/\s+/g, ''))}
              className="w-full px-4 py-3 rounded-2xl border-2 border-stone-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none font-mono text-base font-bold text-stone-900 transition"
            />
          </div>

          {/* PIN Code */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-emerald-600" />
              <span>รหัส PIN 4 หลัก (จากหน้าจออาจารย์)</span>
            </label>
            <input
              type="text"
              required
              maxLength={4}
              placeholder="PIN 4 หลัก"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 rounded-2xl border-2 border-stone-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none font-mono text-2xl tracking-widest text-center font-black text-emerald-950 transition"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-sm shadow-md hover:shadow-lg transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <span>กำลังบันทึกข้อมูล...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>ยืนยันการเช็คชื่อเข้ากลุ่ม</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-stone-400 text-center leading-relaxed">
            * รหัส PIN ได้รับจากอาจารย์ประจำกลุ่มฮะละเกาะฮ์ของท่านในชั่วโมงกิจกรรม
          </p>
        </form>
      </div>
    </div>
  );
};
