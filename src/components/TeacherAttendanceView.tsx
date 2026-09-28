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
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Teacher, Student, AttendanceRecord, AttendanceStatus } from '@/lib/types';
import { INITIAL_TEACHERS, INITIAL_STUDENTS } from '@/lib/students-data';
import { saveAttendanceBatch } from '@/lib/api-client';

interface TeacherAttendanceViewProps {
  records: AttendanceRecord[];
  onAttendanceSaved: () => void;
}

export const TeacherAttendanceView: React.FC<TeacherAttendanceViewProps> = ({
  records,
  onAttendanceSaved,
}) => {
  // 1. Teacher selection (remember last selected)
  const [selectedTeacherName, setSelectedTeacherName] = useState<string>('');
  const [teacherSearch, setTeacherSearch] = useState<string>('');
  const [genderFilter, setGenderFilter] = useState<'ทั้งหมด' | 'ชาย' | 'หญิง'>('ทั้งหมด');

  // 2. Date selection (default today: YYYY-MM-DD)
  const getTodayString = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());

  // 3. Current active student statuses for selected date: studentId -> status
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Initialize selected teacher from local storage or default
  useEffect(() => {
    const saved = localStorage.getItem('last_selected_teacher');
    if (saved && INITIAL_TEACHERS.some((t) => t.name === saved)) {
      setSelectedTeacherName(saved);
    } else if (INITIAL_TEACHERS.length > 0) {
      setSelectedTeacherName(INITIAL_TEACHERS[0].name);
    }
  }, []);

  const currentTeacher = useMemo(() => {
    return INITIAL_TEACHERS.find((t) => t.name === selectedTeacherName) || INITIAL_TEACHERS[0];
  }, [selectedTeacherName]);

  // Handle teacher change
  const handleTeacherChange = (teacherName: string) => {
    setSelectedTeacherName(teacherName);
    localStorage.setItem('last_selected_teacher', teacherName);
  };

  // Filter teachers for dropdown
  const filteredTeachers = useMemo(() => {
    return INITIAL_TEACHERS.filter((t) => {
      const matchGender = genderFilter === 'ทั้งหมด' || t.gender === genderFilter;
      const matchSearch =
        t.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
        t.groupName.toLowerCase().includes(teacherSearch.toLowerCase());
      return matchGender && matchSearch;
    });
  }, [genderFilter, teacherSearch]);

  // Students in this teacher's group
  const groupStudents = useMemo(() => {
    if (!currentTeacher) return [];
    return INITIAL_STUDENTS.filter((st) => st.teacherName === currentTeacher.name);
  }, [currentTeacher]);

  // When teacher or date changes, populate attendanceMap from existing records or default to 'มา'
  useEffect(() => {
    if (!currentTeacher || groupStudents.length === 0) return;

    const newMap: Record<string, AttendanceStatus> = {};
    let foundExisting = false;

    groupStudents.forEach((st) => {
      const existing = records.find(
        (r) => r.date === selectedDate && r.studentId === st.studentId
      );
      if (existing) {
        newMap[st.studentId] = existing.status;
        foundExisting = true;
      } else {
        newMap[st.studentId] = 'มา'; // Default to 'มา' for easy one-click saving
      }
    });

    setAttendanceMap(newMap);
    setSaveMessage(null);
  }, [currentTeacher, selectedDate, records, groupStudents]);

  // Check if current date already recorded
  const isDateAlreadySaved = useMemo(() => {
    if (!currentTeacher || groupStudents.length === 0) return false;
    return groupStudents.some((st) =>
      records.some((r) => r.date === selectedDate && r.studentId === st.studentId)
    );
  }, [currentTeacher, groupStudents, records, selectedDate]);

  // Quick action: set all to 'มา'
  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceStatus> = {};
    groupStudents.forEach((st) => {
      updated[st.studentId] = status;
    });
    setAttendanceMap(updated);
  };

  // Toggle single student
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  // Calculate live counts for the current group & date
  const counts = useMemo(() => {
    let present = 0;
    let absent = 0;
    let leave = 0;
    groupStudents.forEach((st) => {
      const status = attendanceMap[st.studentId] || 'มา';
      if (status === 'มา') present++;
      else if (status === 'ขาด') absent++;
      else if (status === 'ลา') leave++;
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

  // Overall attendance rate for this group across all recorded dates
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

  // Handle Save
  const handleSaveAttendance = async () => {
    if (!currentTeacher || groupStudents.length === 0) return;
    setIsSaving(true);
    setSaveMessage(null);

    const nowISO = new Date().toISOString();
    const batchRecords: AttendanceRecord[] = groupStudents.map((st) => ({
      id: `ATT_${selectedDate}_${st.studentId}`,
      date: selectedDate,
      studentId: st.studentId,
      studentName: st.fullName,
      teacherName: currentTeacher.name,
      groupName: currentTeacher.groupName,
      yearLevel: currentTeacher.yearLevel,
      gender: currentTeacher.gender,
      status: attendanceMap[st.studentId] || 'มา',
      timestamp: nowISO,
    }));

    try {
      const res = await saveAttendanceBatch(batchRecords);
      setIsSaving(false);
      if (res.success) {
        setSaveMessage({
          type: res.syncedWithSheet ? 'success' : 'info',
          text: res.message,
        });

        // Trigger confetti celebration
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#10b981', '#059669', '#34d399', '#f59e0b'],
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

  // Format Thai date
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
      {/* Top Banner: Teacher & Group Selector */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white rounded-2xl p-6 shadow-lg shadow-emerald-900/10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-medium backdrop-blur-sm">
                สำหรับอาจารย์ประจำกลุ่ม
              </span>
              <span className="bg-emerald-400/20 text-emerald-100 text-xs px-2.5 py-1 rounded-full font-medium">
                {currentTeacher?.gender === 'ชาย' ? 'กลุ่มนักศึกษาชาย' : 'กลุ่มนักศึกษาหญิง'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {currentTeacher?.name || 'เลือกอาจารย์ประจำกลุ่ม'}
            </h1>
            <p className="text-emerald-100 text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{currentTeacher?.groupName} ({currentTeacher?.yearLevel})</span>
              <span className="text-white/60">•</span>
              <span>สมาชิกในกลุ่ม {groupStudents.length} คน</span>
            </p>
          </div>

          {/* Teacher Selection Dropdown with Search */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 min-w-[300px]">
            <label className="block text-xs font-medium text-emerald-100 mb-1.5">
              เลือกอาจารย์ประจำกลุ่ม / กลุ่มที่รับผิดชอบ
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
                        ? 'bg-white text-emerald-900 font-semibold shadow-sm'
                        : 'bg-white/10 text-emerald-100 hover:bg-white/20'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <select
                value={selectedTeacherName}
                onChange={(e) => handleTeacherChange(e.target.value)}
                className="w-full bg-white text-gray-900 text-sm rounded-lg px-3 py-2 border border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400 font-medium shadow-sm"
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

      {/* Date Selector & Summary Stats Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Minimal Date Selector Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 text-gray-900 font-semibold">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <span>เลือกวันเดือนปีที่เช็คชื่อ (Minimal Style)</span>
              </div>
              {isDateAlreadySaved ? (
                <span className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  บันทึกข้อมูลแล้ว
                </span>
              ) : (
                <span className="inline-flex items-center text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                  <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
                  รอการบันทึก
                </span>
              )}
            </div>

            {/* Quick date preset buttons */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => setSelectedDate(getTodayString())}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                  selectedDate === getTodayString()
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-semibold'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
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
                className="text-xs px-3 py-1.5 rounded-lg border bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 transition-colors"
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
                className="text-xs px-3 py-1.5 rounded-lg border bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 transition-colors"
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
                className="px-4 py-2.5 border border-gray-300 rounded-xl text-gray-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50 hover:bg-white transition-all shadow-inner"
              />
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                {formatThaiDate(selectedDate)}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>คำแนะนำ: เลือกวันที่ต้องการ และสามารถเช็คชื่อย้อนหลังได้ตลอดเวลา</span>
            <button
              onClick={() => handleMarkAll('มา')}
              className="text-emerald-700 font-semibold hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>ทำเครื่องหมายมาทุกคน</span>
            </button>
          </div>
        </div>

        {/* Live Attendance Counters for Selected Date */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              สถิติประจำวันที่เลือก ({selectedDate})
            </span>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-gray-900">{counts.rate.toFixed(0)}%</span>
              <span className="text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                มา {counts.present} จาก {counts.total} คน
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 h-2.5 rounded-full mt-3 overflow-hidden flex">
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

          {/* Quick Badges */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-100 text-center">
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100">
              <div className="text-lg font-bold text-emerald-700">{counts.present}</div>
              <div className="text-[11px] text-emerald-800 font-medium">มา</div>
            </div>
            <div className="p-2 rounded-xl bg-rose-50 border border-rose-100">
              <div className="text-lg font-bold text-rose-700">{counts.absent}</div>
              <div className="text-[11px] text-rose-800 font-medium">ขาด</div>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-100">
              <div className="text-lg font-bold text-amber-700">{counts.leave}</div>
              <div className="text-[11px] text-amber-800 font-medium">ลา</div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Notification Alert */}
      {saveMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
            saveMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : saveMessage.type === 'info'
              ? 'bg-blue-50 border-blue-200 text-blue-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            {saveMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
            {saveMessage.type === 'info' && <AlertCircle className="w-5 h-5 text-blue-600 shrink-0" />}
            {saveMessage.type === 'error' && <XCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            <span className="font-medium">{saveMessage.text}</span>
          </div>
          <button
            onClick={() => setSaveMessage(null)}
            className="text-xs text-gray-500 hover:text-gray-800 ml-4 underline"
          >
            ปิด
          </button>
        </div>
      )}

      {/* Students Attendance Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              รายชื่อนักศึกษาในกลุ่ม ({groupStudents.length} คน)
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              คลิกเลือกสถานะ [มา] [ขาด] [ลา] หรือกดปุ่มด้านล่างเพื่อบันทึกข้อมูล
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleMarkAll('มา')}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors"
            >
              มาทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll('ขาด')}
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              ขาดทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll('ลา')}
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              ลาทั้งหมด
            </button>
          </div>
        </div>

        {/* Table Rows */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4">รหัสนักศึกษา</th>
                <th className="py-3.5 px-4">ชื่อ - นามสกุล</th>
                <th className="py-3.5 px-4 w-48 text-center">สถานะการเข้าร่วม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {groupStudents.map((st, idx) => {
                const currentStatus = attendanceMap[st.studentId] || 'มา';
                return (
                  <tr
                    key={st.studentId}
                    className={`transition-colors hover:bg-gray-50/80 ${
                      currentStatus === 'ขาด'
                        ? 'bg-rose-50/30'
                        : currentStatus === 'ลา'
                        ? 'bg-amber-50/30'
                        : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center font-medium text-gray-400 text-xs">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-gray-700">
                      {st.studentId}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-900">
                      <div className="flex items-center space-x-2">
                        <span>{st.fullName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {/* Segmented Status Buttons */}
                      <div className="flex items-center justify-center p-1 bg-gray-100 rounded-xl space-x-1 max-w-[200px] mx-auto">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.studentId, 'มา')}
                          className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                            currentStatus === 'มา'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-gray-600 hover:text-emerald-700'
                          }`}
                        >
                          มา
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.studentId, 'ขาด')}
                          className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                            currentStatus === 'ขาด'
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'text-gray-600 hover:text-rose-700'
                          }`}
                        >
                          ขาด
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.studentId, 'ลา')}
                          className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                            currentStatus === 'ลา'
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'text-gray-600 hover:text-amber-700'
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
        <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-gray-600 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              พร้อมบันทึก: มา {counts.present} คน, ขาด {counts.absent} คน, ลา {counts.leave} คน
            </span>
          </div>

          <button
            type="button"
            onClick={handleSaveAttendance}
            disabled={isSaving}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold px-6 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
          >
            <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
            <span>{isSaving ? 'กำลังบันทึกข้อมูล...' : 'บันทึกผลการเช็คชื่อ'}</span>
          </button>
        </div>
      </div>

      {/* Historical Check-ins for this Group */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-gray-900">ประวัติการเช็คชื่อย้อนหลังของกลุ่มนี้</h3>
          </div>
          <span className="text-xs text-gray-500">
            เช็คแล้วทั้งหมด {groupOverallStats.totalCheckins} วัน | อัตราการเข้าร่วมเฉลี่ย {groupOverallStats.overallRate.toFixed(1)}%
          </span>
        </div>

        {groupHistory.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">ยังไม่มีประวัติการเช็คชื่อสำหรับกลุ่มนี้</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {groupHistory.map((item) => (
              <button
                key={item.date}
                type="button"
                onClick={() => setSelectedDate(item.date)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedDate === item.date
                    ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold text-gray-800 mb-1">
                  <span>{item.date}</span>
                  <span className="text-emerald-700">{item.rate.toFixed(0)}%</span>
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
