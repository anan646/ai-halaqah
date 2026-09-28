'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Users,
  Award,
  History,
  Sparkles,
  ChevronRight,
  Search,
  Filter,
  AlertCircle,
  Timer
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Teacher, Student, AttendanceRecord, AttendanceStatus } from '@/lib/types';
import { INITIAL_TEACHERS, INITIAL_STUDENTS } from '@/lib/students-data';
import { saveAttendanceBatch } from '@/lib/api-client';

interface TeacherAttendanceViewProps {
  records: AttendanceRecord[];
  onAttendanceSaved: () => void;
  activeTeacherName?: string;
  onTeacherChanged?: (name: string) => void;
}

export const TeacherAttendanceView: React.FC<TeacherAttendanceViewProps> = ({
  records,
  onAttendanceSaved,
  activeTeacherName,
  onTeacherChanged,
}) => {
  // 1. Teacher selection
  const [selectedTeacherName, setSelectedTeacherName] = useState<string>('');
  const [genderFilter, setGenderFilter] = useState<'ทั้งหมด' | 'ชาย' | 'หญิง'>('ทั้งหมด');

  // Real-time current clock
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

  // Initialize selected teacher from props or localStorage
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

  const filteredTeachers = useMemo(() => {
    return INITIAL_TEACHERS.filter((t) => {
      return genderFilter === 'ทั้งหมด' || t.gender === genderFilter;
    });
  }, [genderFilter]);

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

  // Real-time click status change
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

  const groupOverallStats = useMemo(() => {
    let totalPresent = 0;
    let totalAll = 0;
    groupHistory.forEach((h) => {
      totalPresent += h.present;
      totalAll += h.total;
    });
    const overallRate = totalAll > 0 ? (totalPresent / totalAll) * 100 : 0;
    return {
      totalCheckins: groupHistory.length,
      overallRate,
    };
  }, [groupHistory]);

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
          particleCount: 65,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#7e22ce', '#9333ea', '#a855f7', '#c084fc', '#10b981'],
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
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
    } catch {}
    return dateStr;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Soothing Purple Gradient */}
      <div className="bg-gradient-to-r from-purple-800 via-purple-700 to-indigo-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-purple-900/10 border border-purple-600/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="bg-white/20 text-purple-100 text-xs px-3 py-1 rounded-full font-semibold backdrop-blur-sm">
                สำหรับอาจารย์ประจำกลุ่ม
              </span>
              <span className="bg-purple-400/25 text-purple-200 text-xs px-2.5 py-1 rounded-full font-medium">
                {currentTeacher?.gender === 'ชาย' ? 'กลุ่มนักศึกษาชาย' : 'กลุ่มนักศึกษาหญิง'}
              </span>
              {/* Real-time Clock Badge */}
              <div className="flex items-center space-x-1 bg-white/10 px-2.5 py-1 rounded-full text-xs font-mono text-purple-200">
                <Timer className="w-3.5 h-3.5 text-purple-300" />
                <span>เวลาปัจจุบัน: {currentTime} น.</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {currentTeacher?.name || 'เลือกอาจารย์ประจำกลุ่ม'}
            </h1>
            <p className="text-purple-200 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-300" />
              <span>{currentTeacher?.groupName} ({currentTeacher?.yearLevel})</span>
              <span className="text-white/40">•</span>
              <span>สมาชิกในกลุ่ม {groupStudents.length} คน</span>
            </p>
          </div>

          {/* Teacher Selection Dropdown with Soothing Theme */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 min-w-[320px]">
            <label className="block text-xs font-medium text-purple-200 mb-1.5">
              เปลี่ยนอาจารย์ประจำกลุ่ม
            </label>
            <div className="space-y-2">
              <div className="flex gap-1.5 mb-2">
                {(['ทั้งหมด', 'ชาย', 'หญิง'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGenderFilter(g)}
                    className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                      genderFilter === g
                        ? 'bg-white text-purple-900 font-bold shadow-sm'
                        : 'bg-white/10 text-purple-200 hover:bg-white/20'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <select
                value={selectedTeacherName}
                onChange={(e) => handleTeacherChange(e.target.value)}
                className="w-full bg-white text-purple-950 text-sm rounded-xl px-3 py-2 border border-transparent focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium shadow-sm"
              >
                {filteredTeachers.map((t) => (
                  <option key={t.groupId} value={t.name}>
                    {t.name} ({t.groupName})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Date Selector & Live Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Minimal Date Selector */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-purple-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 text-purple-950 font-bold">
                <Calendar className="w-5 h-5 text-purple-700" />
                <span>เลือกวันเดือนปีที่เช็คชื่อ (Minimal Style)</span>
              </div>
              {isDateAlreadySaved ? (
                <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  บันทึกข้อมูลแล้ว
                </span>
              ) : (
                <span className="inline-flex items-center text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full">
                  <Clock className="w-3.5 h-3.5 mr-1 text-purple-600" />
                  รอการบันทึก
                </span>
              )}
            </div>

            {/* Quick date preset buttons */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => setSelectedDate(getTodayString())}
                className={`text-xs px-3.5 py-1.5 rounded-xl border transition-all ${
                  selectedDate === getTodayString()
                    ? 'bg-purple-700 text-white border-purple-700 shadow-sm font-semibold'
                    : 'bg-purple-50 text-purple-800 border-purple-200/60 hover:bg-purple-100'
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
                className="text-xs px-3.5 py-1.5 rounded-xl border bg-purple-50 text-purple-800 border-purple-200/60 hover:bg-purple-100 transition-colors"
              >
                เมื่อวาน
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 7);
                  setSelectedDate(d.toISOString().slice(0, 10));
                }}
                className="text-xs px-3.5 py-1.5 rounded-xl border bg-purple-50 text-purple-800 border-purple-200/60 hover:bg-purple-100 transition-colors"
              >
                7 วันที่แล้ว
              </button>
            </div>

            {/* Native Clean Date Input */}
            <div className="flex items-center space-x-3">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2.5 border border-purple-200 rounded-2xl text-purple-950 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 bg-purple-50/50 hover:bg-white transition-all shadow-inner"
              />
              <span className="text-sm font-semibold text-purple-900 hidden sm:inline">
                {formatThaiDate(selectedDate)}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-purple-50 flex items-center justify-between text-xs text-purple-800/60">
            <span>บันทึกแบบ Real-time: ทุกครั้งที่เปลี่ยนสถานะจะบันทึกเวลาจริงกำกับไว้</span>
            <button
              onClick={() => handleMarkAll('มา')}
              className="text-purple-700 font-bold hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>ทำเครื่องหมายมาทุกคน</span>
            </button>
          </div>
        </div>

        {/* Live Attendance Counter */}
        <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-purple-900/50 uppercase tracking-wider">
              สถิติประจำวันที่เลือก ({selectedDate})
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-purple-950">{counts.rate.toFixed(0)}%</span>
              <span className="text-xs text-purple-800 font-semibold bg-purple-100/70 px-2.5 py-1 rounded-full border border-purple-200">
                มา {counts.present} จาก {counts.total} คน
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-purple-50 h-2.5 rounded-full mt-3 overflow-hidden flex border border-purple-100">
              <div
                style={{ width: `${(counts.present / Math.max(counts.total, 1)) * 100}%` }}
                className="bg-emerald-500 h-full"
                title={`มา: ${counts.present} คน`}
              />
              <div
                style={{ width: `${(counts.leave / Math.max(counts.total, 1)) * 100}%` }}
                className="bg-amber-400 h-full"
                title={`ลา: ${counts.leave} คน`}
              />
              <div
                style={{ width: `${(counts.absent / Math.max(counts.total, 1)) * 100}%` }}
                className="bg-rose-500 h-full"
                title={`ขาด: ${counts.absent} คน`}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-purple-50 text-center">
            <div className="p-2.5 rounded-2xl bg-emerald-50/80 border border-emerald-200">
              <div className="text-lg font-bold text-emerald-800">{counts.present}</div>
              <div className="text-[11px] text-emerald-700 font-medium">มา</div>
            </div>
            <div className="p-2.5 rounded-2xl bg-rose-50/80 border border-rose-200">
              <div className="text-lg font-bold text-rose-800">{counts.absent}</div>
              <div className="text-[11px] text-rose-700 font-medium">ขาด</div>
            </div>
            <div className="p-2.5 rounded-2xl bg-amber-50/80 border border-amber-200">
              <div className="text-lg font-bold text-amber-800">{counts.leave}</div>
              <div className="text-[11px] text-amber-700 font-medium">ลา</div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Notice */}
      {saveMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-sm ${
            saveMessage.type === 'success'
              ? 'bg-purple-50 border-purple-200 text-purple-900'
              : saveMessage.type === 'info'
              ? 'bg-blue-50 border-blue-200 text-blue-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            {saveMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />}
            {saveMessage.type === 'info' && <AlertCircle className="w-5 h-5 text-blue-600 shrink-0" />}
            {saveMessage.type === 'error' && <XCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            <span className="font-medium">{saveMessage.text}</span>
          </div>
          <button
            onClick={() => setSaveMessage(null)}
            className="text-xs text-purple-800/70 hover:text-purple-950 underline ml-4"
          >
            ปิด
          </button>
        </div>
      )}

      {/* Students Attendance Table */}
      <div className="bg-white rounded-3xl border border-purple-100 shadow-sm overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-4 sm:p-5 border-b border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-purple-50/40">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-purple-950">
              รายชื่อนักศึกษาในกลุ่ม ({groupStudents.length} คน)
            </h2>
            <p className="text-xs text-purple-800/60 mt-0.5">
              คลิกเลือกสถานะ [มา] [ขาด] [ลา] ระบบจะบันทึกเวลากำกับแบบ Real-time ทันที
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleMarkAll('มา')}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-purple-100 text-purple-900 hover:bg-purple-200 transition-colors"
            >
              มาทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll('ขาด')}
              className="text-xs font-medium px-2.5 py-1.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              ขาดทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll('ลา')}
              className="text-xs font-medium px-2.5 py-1.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              ลาทั้งหมด
            </button>
          </div>
        </div>

        {/* Table Rows */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-purple-50/70 text-purple-900/70 text-xs font-bold uppercase tracking-wider border-b border-purple-100">
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4">รหัสนักศึกษา</th>
                <th className="py-3.5 px-4">ชื่อ - นามสกุล</th>
                <th className="py-3.5 px-4 text-center">เวลาบันทึก (Real-time)</th>
                <th className="py-3.5 px-4 w-48 text-center">สถานะการเข้าร่วม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-50 text-sm">
              {groupStudents.map((st, idx) => {
                const entry = attendanceMap[st.studentId] || { status: 'มา', time: currentTime };
                return (
                  <tr
                    key={st.studentId}
                    className={`transition-colors hover:bg-purple-50/30 ${
                      entry.status === 'ขาด'
                        ? 'bg-rose-50/40'
                        : entry.status === 'ลา'
                        ? 'bg-amber-50/40'
                        : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center font-medium text-purple-400 text-xs">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-purple-950">
                      {st.studentId}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-purple-950">
                      {st.fullName}
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs font-mono text-purple-700/80">
                      <span className="inline-flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100">
                        <Clock className="w-3 h-3 text-purple-500" />
                        <span>{entry.time || '-'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {/* Segmented Status Buttons */}
                      <div className="flex items-center justify-center p-1 bg-purple-50/80 rounded-xl space-x-1 max-w-[200px] mx-auto border border-purple-100">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.studentId, 'มา')}
                          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all ${
                            entry.status === 'มา'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-purple-800 hover:text-emerald-700'
                          }`}
                        >
                          มา
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.studentId, 'ขาด')}
                          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all ${
                            entry.status === 'ขาด'
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'text-purple-800 hover:text-rose-700'
                          }`}
                        >
                          ขาด
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.studentId, 'ลา')}
                          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all ${
                            entry.status === 'ลา'
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'text-purple-800 hover:text-amber-700'
                          }`}
                        >
                          ลา
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Save Bar at Bottom */}
        <div className="p-4 sm:p-5 bg-purple-50/50 border-t border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-purple-900 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-purple-600" />
            <span>
              สรุป: มา {counts.present} คน | ขาด {counts.absent} คน | ลา {counts.leave} คน (บันทึกเวลาจริงตามการเลือก)
            </span>
          </div>

          <button
            type="button"
            onClick={handleSaveAttendance}
            disabled={isSaving}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white font-bold px-6 py-2.5 rounded-2xl shadow-lg shadow-purple-900/15 transition-all disabled:opacity-50"
          >
            <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
            <span>{isSaving ? 'กำลังบันทึกข้อมูล...' : 'บันทึกผลการเช็คชื่อ'}</span>
          </button>
        </div>
      </div>

      {/* Historical Check-ins */}
      <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-purple-700" />
            <h3 className="font-bold text-purple-950">ประวัติการเช็คชื่อย้อนหลังของกลุ่มนี้</h3>
          </div>
          <span className="text-xs text-purple-800/70">
            เช็คแล้วทั้งหมด {groupOverallStats.totalCheckins} ครั้ง | อัตราการเข้าร่วมเฉลี่ย {groupOverallStats.overallRate.toFixed(1)}%
          </span>
        </div>

        {groupHistory.length === 0 ? (
          <p className="text-sm text-purple-400 py-6 text-center">ยังไม่มีประวัติการเช็คชื่อสำหรับกลุ่มนี้</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {groupHistory.map((item) => (
              <button
                key={item.date}
                type="button"
                onClick={() => setSelectedDate(item.date)}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  selectedDate === item.date
                    ? 'border-purple-500 bg-purple-50/70 ring-2 ring-purple-500/20'
                    : 'border-purple-100 hover:border-purple-300 hover:bg-purple-50/30'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-purple-950 mb-1">
                  <span>{item.date}</span>
                  <span className="text-purple-700">{item.rate.toFixed(0)}%</span>
                </div>
                <div className="text-[11px] text-gray-500 flex items-center justify-between">
                  <span>มา {item.present}</span>
                  <span>ขาด {item.absent}</span>
                  <span>ลา {item.leave}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
