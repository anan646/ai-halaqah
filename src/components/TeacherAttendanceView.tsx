'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Users,
  History,
  Sparkles,
  ChevronRight,
  Timer,
  ArrowLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AttendanceRecord, AttendanceStatus } from '@/lib/types';
import { INITIAL_TEACHERS, INITIAL_STUDENTS } from '@/lib/students-data';
import { saveAttendanceBatch } from '@/lib/api-client';

interface TeacherAttendanceViewProps {
  records: AttendanceRecord[];
  onAttendanceSaved: () => void;
  activeTeacherName?: string;
  onTeacherChanged?: (name: string) => void;
  onBackToLanding?: () => void;
}

export const TeacherAttendanceView: React.FC<TeacherAttendanceViewProps> = ({
  records,
  onAttendanceSaved,
  activeTeacherName,
  onTeacherChanged,
  onBackToLanding,
}) => {
  // 1. Teacher selection
  const [selectedTeacherName, setSelectedTeacherName] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('th-TH', { hour12: false }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Date selection
  const getTodayString = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());

  // 3. Student statuses & timestamps for selected date
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: AttendanceStatus; time: string }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Initialize selected teacher
  useEffect(() => {
    if (activeTeacherName && INITIAL_TEACHERS.some((t) => t.name === activeTeacherName)) {
      setSelectedTeacherName(activeTeacherName);
    } else {
      const saved = localStorage.getItem('last_selected_teacher');
      if (saved && INITIAL_TEACHERS.some((t) => t.name === saved)) {
        setSelectedTeacherName(saved);
      } else if (INITIAL_TEACHERS.length > 0) {
        setSelectedTeacherName(INITIAL_TEACHERS[0].name);
      }
    }
  }, [activeTeacherName]);

  const currentTeacher = useMemo(() => {
    return INITIAL_TEACHERS.find((t) => t.name === selectedTeacherName) || INITIAL_TEACHERS[0];
  }, [selectedTeacherName]);

  const handleTeacherChange = (teacherName: string) => {
    setSelectedTeacherName(teacherName);
    localStorage.setItem('last_selected_teacher', teacherName);
    if (onTeacherChanged) onTeacherChanged(teacherName);
  };

  const groupStudents = useMemo(() => {
    if (!currentTeacher) return [];
    return INITIAL_STUDENTS.filter((st) => st.teacherName === currentTeacher.name);
  }, [currentTeacher]);

  // Load existing records or default
  useEffect(() => {
    if (!currentTeacher || groupStudents.length === 0) return;

    const newMap: Record<string, { status: AttendanceStatus; time: string }> = {};
    const nowTimeStr = new Date().toLocaleTimeString('th-TH', { hour12: false });

    groupStudents.forEach((st) => {
      const existing = records.find(
        (r) => r.date === selectedDate && r.studentId === st.studentId
      );
      if (existing) {
        newMap[st.studentId] = {
          status: existing.status,
          time: existing.recordedTime || nowTimeStr,
        };
      } else {
        newMap[st.studentId] = {
          status: 'มา',
          time: nowTimeStr,
        };
      }
    });

    setAttendanceMap(newMap);
    setSaveMessage(null);
  }, [currentTeacher, selectedDate, records, groupStudents]);

  const isDateAlreadySaved = useMemo(() => {
    if (!currentTeacher || groupStudents.length === 0) return false;
    return groupStudents.some((st) =>
      records.some((r) => r.date === selectedDate && r.studentId === st.studentId)
    );
  }, [currentTeacher, groupStudents, records, selectedDate]);

  // Change single status with realtime timestamp
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    const nowTimeStr = new Date().toLocaleTimeString('th-TH', { hour12: false });
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        status,
        time: nowTimeStr,
      },
    }));
  };

  // Mark all
  const handleMarkAll = (status: AttendanceStatus) => {
    const nowTimeStr = new Date().toLocaleTimeString('th-TH', { hour12: false });
    const updated: Record<string, { status: AttendanceStatus; time: string }> = {};
    groupStudents.forEach((st) => {
      updated[st.studentId] = {
        status,
        time: nowTimeStr,
      };
    });
    setAttendanceMap(updated);
  };

  // Live count
  const counts = useMemo(() => {
    let present = 0;
    let absent = 0;
    let leave = 0;
    groupStudents.forEach((st) => {
      const item = attendanceMap[st.studentId] || { status: 'มา', time: '' };
      if (item.status === 'มา') present++;
      else if (item.status === 'ขาด') absent++;
      else if (item.status === 'ลา') leave++;
    });
    const total = groupStudents.length;
    const rate = total > 0 ? (present / total) * 100 : 0;
    return { present, absent, leave, total, rate };
  }, [groupStudents, attendanceMap]);

  // Group historical records
  const groupHistory = useMemo(() => {
    if (!currentTeacher) return [];
    const dateMap = new Map<string, { present: number; absent: number; leave: number; total: number }>();
    
    records
      .filter((r) => r.teacherName === currentTeacher.name)
      .forEach((r) => {
        if (!dateMap.has(r.date)) {
          dateMap.set(r.date, { present: 0, absent: 0, leave: 0, total: 0 });
        }
        const item = dateMap.get(r.date)!;
        item.total++;
        if (r.status === 'มา') item.present++;
        else if (r.status === 'ขาด') item.absent++;
        else if (r.status === 'ลา') item.leave++;
      });

    return Array.from(dateMap.entries())
      .map(([date, stats]) => ({
        date,
        ...stats,
        rate: stats.total > 0 ? (stats.present / stats.total) * 100 : 0,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [records, currentTeacher]);

  // Save
  const handleSaveAttendance = async () => {
    if (!currentTeacher || groupStudents.length === 0) return;
    setIsSaving(true);
    setSaveMessage(null);

    const nowISO = new Date().toISOString();
    const batchRecords: AttendanceRecord[] = groupStudents.map((st) => {
      const entry = attendanceMap[st.studentId] || { status: 'มา', time: currentTime };
      return {
        id: `ATT_${selectedDate}_${st.studentId}`,
        date: selectedDate,
        recordedTime: entry.time || currentTime,
        studentId: st.studentId,
        studentName: st.fullName,
        teacherName: currentTeacher.name,
        groupName: currentTeacher.groupName,
        yearLevel: currentTeacher.yearLevel,
        gender: currentTeacher.gender,
        status: entry.status,
        timestamp: nowISO,
      };
    });

    try {
      const res = await saveAttendanceBatch(batchRecords);
      setIsSaving(false);
      if (res.success) {
        setSaveMessage({
          type: res.syncedWithSheet ? 'success' : 'info',
          text: res.message,
        });

        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#7e22ce', '#9333ea', '#a855f7', '#10b981'],
        });

        onAttendanceSaved();
      } else {
        setSaveMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setIsSaving(false);
      setSaveMessage({ type: 'error', text: err.message || 'เกิดข้อผิดพลาดในการบันทึก' });
    }
  };

  const formatThaiDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('th-TH', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      }
    } catch {}
    return dateStr;
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-3 sm:py-6 space-y-4 pb-28">
      {/* Top Bar: Back & Teacher Switcher */}
      <div className="flex items-center justify-between gap-2">
        {onBackToLanding && (
          <button
            type="button"
            onClick={onBackToLanding}
            className="inline-flex items-center space-x-1 text-xs font-bold text-purple-700 hover:text-purple-950 bg-white border border-purple-200 px-3 py-2 rounded-xl shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>เปลี่ยนอาจารย์</span>
          </button>
        )}

        {/* Real-time Clock */}
        <div className="inline-flex items-center space-x-1.5 bg-purple-100/80 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-purple-900 ml-auto border border-purple-200">
          <Timer className="w-3.5 h-3.5 text-purple-600" />
          <span>{currentTime} น.</span>
        </div>
      </div>

      {/* Teacher Card Banner (Mobile Optimized) */}
      <div className="bg-gradient-to-r from-purple-800 via-purple-700 to-indigo-900 text-white rounded-3xl p-5 sm:p-6 shadow-md shadow-purple-900/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-white/20 text-purple-100 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                {currentTeacher?.gender === 'ชาย' ? 'กลุ่มชาย' : 'กลุ่มหญิง'}
              </span>
              <span className="bg-purple-300/30 text-purple-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                {currentTeacher?.yearLevel}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              {currentTeacher?.name}
            </h1>
            <p className="text-xs text-purple-200 mt-0.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-300" />
              <span>{currentTeacher?.groupName} ({groupStudents.length} คน)</span>
            </p>
          </div>

          {/* Quick Dropdown to switch within group */}
          <div className="w-full sm:w-auto">
            <select
              value={selectedTeacherName}
              onChange={(e) => handleTeacherChange(e.target.value)}
              className="w-full sm:w-64 bg-white/15 text-white text-xs rounded-xl px-3 py-2 border border-white/25 focus:outline-none focus:bg-purple-900 font-semibold"
            >
              {INITIAL_TEACHERS.map((t) => (
                <option key={t.groupId} value={t.name} className="text-gray-900">
                  {t.name} ({t.groupName})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Date Selector & Status Cards (Mobile-first Layout) */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-purple-100 shadow-sm space-y-4">
        {/* Date Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-purple-700" />
            <span className="text-xs sm:text-sm font-bold text-purple-950">
              วันที่เช็คชื่อ: {formatThaiDate(selectedDate)}
            </span>
            {isDateAlreadySaved ? (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                บันทึกแล้ว
              </span>
            ) : (
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                ยังไม่บันทึก
              </span>
            )}
          </div>

          {/* Quick Buttons for mobile */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedDate(getTodayString())}
              className={`flex-1 sm:flex-none text-xs px-3 py-1.5 rounded-xl border font-bold transition-all ${
                selectedDate === getTodayString()
                  ? 'bg-purple-700 text-white border-purple-700'
                  : 'bg-purple-50 text-purple-800 border-purple-200'
              }`}
            >
              วันนี้
            </button>
            <button
              type="button"
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() - 1);
                setSelectedDate(d.toISOString().slice(0, 10));
              }}
              className="flex-1 sm:flex-none text-xs px-3 py-1.5 rounded-xl border bg-purple-50 text-purple-800 border-purple-200 font-bold"
            >
              เมื่อวาน
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 sm:flex-none px-2 py-1 border border-purple-200 rounded-xl text-xs font-bold text-purple-900 bg-purple-50"
            />
          </div>
        </div>

        {/* Live Counts Bar (Mobile-Optimized) */}
        <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-purple-50">
          <div className="p-2 rounded-2xl bg-emerald-50 border border-emerald-200">
            <div className="text-base sm:text-lg font-extrabold text-emerald-800">{counts.present}</div>
            <div className="text-[11px] font-bold text-emerald-700">มา</div>
          </div>
          <div className="p-2 rounded-2xl bg-rose-50 border border-rose-200">
            <div className="text-base sm:text-lg font-extrabold text-rose-800">{counts.absent}</div>
            <div className="text-[11px] font-bold text-rose-700">ขาด</div>
          </div>
          <div className="p-2 rounded-2xl bg-amber-50 border border-amber-200">
            <div className="text-base sm:text-lg font-extrabold text-amber-800">{counts.leave}</div>
            <div className="text-[11px] font-bold text-amber-700">ลา</div>
          </div>
        </div>
      </div>

      {/* Save Alert */}
      {saveMessage && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
            saveMessage.type === 'success'
              ? 'bg-purple-50 border-purple-200 text-purple-950'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            {saveMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{saveMessage.text}</span>
          </div>
          <button onClick={() => setSaveMessage(null)} className="underline ml-2">
            ปิด
          </button>
        </div>
      )}

      {/* Quick Mark All Buttons */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-purple-950">
          รายชื่อนักศึกษา ({groupStudents.length} คน)
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleMarkAll('มา')}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-100 text-purple-900 hover:bg-purple-200 transition-colors"
          >
            มาทุกคน
          </button>
          <button
            type="button"
            onClick={() => handleMarkAll('ขาด')}
            className="text-xs font-bold px-2.5 py-1.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            ขาดหมด
          </button>
        </div>
      </div>

      {/* STUDENTS LIST - MOBILE FIRST CARD TILES (No cramped columns, comfortable touch targets!) */}
      <div className="space-y-2">
        {groupStudents.map((st, idx) => {
          const entry = attendanceMap[st.studentId] || { status: 'มา', time: currentTime };
          return (
            <div
              key={st.studentId}
              className={`p-3 sm:p-4 rounded-2xl bg-white border transition-all ${
                entry.status === 'ขาด'
                  ? 'border-rose-200 bg-rose-50/30'
                  : entry.status === 'ลา'
                  ? 'border-amber-200 bg-amber-50/30'
                  : 'border-purple-100 hover:border-purple-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                {/* Student Info */}
                <div className="flex items-start space-x-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-purple-950 truncate">
                      {st.fullName}
                    </div>
                    <div className="text-[11px] font-mono text-purple-800/60 flex items-center gap-2">
                      <span>รหัส {st.studentId}</span>
                      <span>•</span>
                      <span className="text-purple-600 flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{entry.time || '-'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Big Segmented Status Buttons (Min 44px height for easy tapping!) */}
                <div className="flex items-center space-x-1.5 w-full sm:w-auto pt-1 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(st.studentId, 'มา')}
                    className={`flex-1 sm:w-16 h-10 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center ${
                      entry.status === 'มา'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-purple-50 text-purple-800 hover:bg-emerald-50 hover:text-emerald-700'
                    }`}
                  >
                    มา
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(st.studentId, 'ขาด')}
                    className={`flex-1 sm:w-16 h-10 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center ${
                      entry.status === 'ขาด'
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                        : 'bg-purple-50 text-purple-800 hover:bg-rose-50 hover:text-rose-700'
                    }`}
                  >
                    ขาด
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(st.studentId, 'ลา')}
                    className={`flex-1 sm:w-16 h-10 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center ${
                      entry.status === 'ลา'
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                        : 'bg-purple-50 text-purple-800 hover:bg-amber-50 hover:text-amber-700'
                    }`}
                  >
                    ลา
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Past Dates Grid */}
      {groupHistory.length > 0 && (
        <div className="bg-white rounded-3xl border border-purple-100 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-purple-950">
            <span className="flex items-center gap-1.5">
              <History className="w-4 h-4 text-purple-700" />
              <span>ประวัติการเช็คชื่อของกลุ่มนี้ ({groupHistory.length} วัน)</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {groupHistory.map((item) => (
              <button
                key={item.date}
                type="button"
                onClick={() => setSelectedDate(item.date)}
                className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                  selectedDate === item.date
                    ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-600/20 font-bold'
                    : 'border-purple-100 hover:bg-purple-50/50'
                }`}
              >
                <div className="font-bold text-purple-950">{item.date}</div>
                <div className="text-[10px] text-purple-700 mt-0.5">
                  มา {item.present} / ขาด {item.absent}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STICKY BOTTOM SAVE ACTION BAR FOR MOBILE (Thumb friendly!) */}
      <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-white/95 backdrop-blur-md border-t border-purple-200 shadow-2xl z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="text-xs text-purple-900 font-bold hidden sm:block">
            สรุป: มา {counts.present} | ขาด {counts.absent} | ลา {counts.leave}
          </div>

          <button
            type="button"
            onClick={handleSaveAttendance}
            disabled={isSaving}
            className="w-full sm:w-auto h-12 px-8 bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg shadow-purple-900/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 ml-auto"
          >
            <Save className={`w-5 h-5 ${isSaving ? 'animate-spin' : ''}`} />
            <span>{isSaving ? 'กำลังบันทึกข้อมูล...' : 'บันทึกผลการเช็คชื่อ'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
