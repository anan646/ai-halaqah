'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Users,
  History,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Timer,
  ArrowLeft,
  Check,
  UserX,
  FileText,
  HelpCircle,
  Award,
  BookOpen,
  MessageSquare,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AttendanceRecord, AttendanceStatus, GroupLevel, Teacher, Student, SemesterSettings } from '@/lib/types';
import {
  getActiveTeachers,
  getActiveStudents,
  getStudentMajor,
  getStudentLevel,
  promoteStudentLevel,
  demoteStudentLevel,
  getGroupLevel,
  promoteGroupLevel,
  demoteGroupLevel,
  getSessionMetadata,
  saveSessionMetadata,
  getTermKey,
  isRecordInTerm,
  getSemesterSettings,
  formatTermLabel,
  STUDENTS_UPDATED_EVENT,
  TEACHERS_UPDATED_EVENT,
} from '@/lib/data-store';
import { saveAttendanceBatch } from '@/lib/api-client';
import { FeedbackModal } from './FeedbackModal';


interface TeacherAttendanceViewProps {
  records: AttendanceRecord[];
  onAttendanceSaved: () => void;
  activeTeacherName?: string;
  onTeacherChanged?: (name: string) => void;
  onBackToLanding?: () => void;
  onOpenTutorial?: () => void;
}

export const TeacherAttendanceView: React.FC<TeacherAttendanceViewProps> = ({
  records: allRecords,
  onAttendanceSaved,
  activeTeacherName,
  onTeacherChanged,
  onBackToLanding,
  onOpenTutorial,
}) => {
  const [teachers, setTeachers] = useState<Teacher[]>(() => getActiveTeachers());
  const [semester, setSemester] = useState<SemesterSettings>(() => getSemesterSettings());
  const [allStudents, setAllStudents] = useState<Student[]>(() => getActiveStudents());

  useEffect(() => {
    setTeachers(getActiveTeachers());
    setSemester(getSemesterSettings());
    setAllStudents(getActiveStudents());
  }, [allRecords]);

  // ซิงค์รายชื่ออาจารย์และนักศึกษาแบบเรียลไทม์ทันทีที่มีการเปลี่ยนแปลงจาก Google Sheet หรือการลบในระบบ
  useEffect(() => {
    const handleSync = () => {
      setTeachers(getActiveTeachers());
      setSemester(getSemesterSettings());
      setAllStudents(getActiveStudents());
    };
    window.addEventListener(STUDENTS_UPDATED_EVENT, handleSync);
    window.addEventListener(TEACHERS_UPDATED_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(STUDENTS_UPDATED_EVENT, handleSync);
      window.removeEventListener(TEACHERS_UPDATED_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // เฉพาะการเช็คชื่อของภาคการศึกษาปัจจุบัน (แอดมินตั้งไว้)
  const termLabel = formatTermLabel(semester);
  const termRecords = useMemo(() => allRecords.filter((r) => isRecordInTerm(r, semester)), [allRecords, semester]);

  // 1. Teacher selection
  const [selectedTeacherName, setSelectedTeacherName] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState<boolean>(false);

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
  const dateInputRef = useRef<HTMLInputElement>(null);

  const changeDay = (deltaDays: number) => {
    try {
      const parts = selectedDate.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      d.setDate(d.getDate() + deltaDays);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setSelectedDate(`${y}-${m}-${day}`);
    } catch {
      // fallback
    }
  };

  const handleOpenCalendar = () => {
    if (dateInputRef.current) {
      if ('showPicker' in HTMLInputElement.prototype) {
        try {
          dateInputRef.current.showPicker();
          return;
        } catch {
          // fallback
        }
      }
      dateInputRef.current.focus();
      dateInputRef.current.click();
    }
  };

  // 3. Student statuses & timestamps for selected date
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: AttendanceStatus; time: string }>>({});
  const [leaveReasonMap, setLeaveReasonMap] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // 3.1 Topic & Notes, Level refresh
  const [sessionTopic, setSessionTopic] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [levelRefresh, setLevelRefresh] = useState(0);

  // Initialize selected teacher
  useEffect(() => {
    if (activeTeacherName && teachers.some((t) => t.name === activeTeacherName)) {
      setSelectedTeacherName(activeTeacherName);
    } else {
      const saved = localStorage.getItem('last_selected_teacher');
      if (saved && teachers.some((t) => t.name === saved)) {
        setSelectedTeacherName(saved);
      } else if (teachers.length > 0) {
        setSelectedTeacherName(teachers[0].name);
      }
    }
  }, [activeTeacherName, teachers]);

  const currentTeacher = useMemo(() => {
    return teachers.find((t) => t.name === selectedTeacherName) || teachers[0];
  }, [selectedTeacherName, teachers]);

  // Load session metadata
  useEffect(() => {
    if (!currentTeacher || !selectedDate) return;
    const meta = getSessionMetadata(selectedDate, currentTeacher.name);
    if (meta) {
      setSessionTopic(meta.topic || '');
      setSessionNotes(meta.notes || '');
    } else {
      setSessionTopic('');
      setSessionNotes('');
    }
  }, [currentTeacher, selectedDate]);

  const currentGroupLevel = useMemo(() => {
    if (!currentTeacher) return '01';
    return getGroupLevel(currentTeacher.name);
  }, [currentTeacher, levelRefresh]);

  const handlePromoteGroup = () => {
    if (!currentTeacher) return;
    const res = promoteGroupLevel(currentTeacher.name, true);
    if (res.success) {
      setLevelRefresh((k) => k + 1);
      setSaveMessage({ type: 'success', text: res.message });
    } else {
      setSaveMessage({ type: 'info', text: res.message });
    }
  };

  const handleDemoteGroup = () => {
    if (!currentTeacher) return;
    const res = demoteGroupLevel(currentTeacher.name, true);
    if (res.success) {
      setLevelRefresh((k) => k + 1);
      setSaveMessage({ type: 'info', text: res.message });
    } else {
      setSaveMessage({ type: 'info', text: res.message });
    }
  };

  const handlePromoteStudent = (studentId: string) => {
    const res = promoteStudentLevel(studentId);
    if (res.success) {
      setLevelRefresh((k) => k + 1);
    }
  };

  const handleDemoteStudent = (studentId: string) => {
    const res = demoteStudentLevel(studentId);
    if (res.success) {
      setLevelRefresh((k) => k + 1);
    }
  };

  const handleTeacherChange = (teacherName: string) => {
    setSelectedTeacherName(teacherName);
    localStorage.setItem('last_selected_teacher', teacherName);
    if (onTeacherChanged) onTeacherChanged(teacherName);
  };

  const groupStudents = useMemo(() => {
    if (!currentTeacher) return [];
    return allStudents.filter((st) => st.teacherName === currentTeacher.name);
  }, [currentTeacher, allStudents, levelRefresh]);

  const isDirtyRef = useRef(false);
  const prevKeyRef = useRef('');

  // Load existing records or default
  useEffect(() => {
    if (!currentTeacher || groupStudents.length === 0) return;
    const currentKey = `${currentTeacher.name}_${selectedDate}`;
    const keyChanged = prevKeyRef.current !== currentKey;

    if (keyChanged) {
      prevKeyRef.current = currentKey;
      isDirtyRef.current = false;
    } else if (isDirtyRef.current) {
      // ผู้ใช้กำลังเช็คชื่ออยู่ ไม่ให้ background sync มาเขียนทับการติ๊กที่ยังไม่ได้กดบันทึก
      return;
    }

    const newMap: Record<string, { status: AttendanceStatus; time: string }> = {};
    const newReasons: Record<string, string> = {};
    const nowTimeStr = new Date().toLocaleTimeString('th-TH', { hour12: false });

    groupStudents.forEach((st) => {
      const existing = allRecords.find(
        (r) => r.date === selectedDate && r.studentId === st.studentId
      );
      if (existing) {
        newMap[st.studentId] = {
          status: existing.status,
          time: existing.recordedTime || nowTimeStr,
        };
        if (existing.leaveReason) {
          newReasons[st.studentId] = existing.leaveReason;
        }
      } else {
        newMap[st.studentId] = {
          status: 'มา',
          time: nowTimeStr,
        };
      }
    });

    setAttendanceMap(newMap);
    setLeaveReasonMap(newReasons);
    setSaveMessage(null);
  }, [currentTeacher, selectedDate, allRecords, groupStudents]);

  const isDateAlreadySaved = useMemo(() => {
    if (!currentTeacher || groupStudents.length === 0) return false;
    return groupStudents.some((st) =>
      allRecords.some((r) => r.date === selectedDate && r.studentId === st.studentId)
    );
  }, [currentTeacher, groupStudents, allRecords, selectedDate]);

  // List of all dates where this teacher has existing attendance records
  const pastRecordedDates = useMemo(() => {
    if (!currentTeacher) return [];
    const dates = Array.from(
      new Set(
        termRecords
          .filter((r) => r.teacherName === currentTeacher.name)
          .map((r) => r.date)
      )
    ).filter(Boolean);
    return dates.sort((a, b) => b.localeCompare(a));
  }, [termRecords, currentTeacher]);

  // Change single status with realtime timestamp
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    isDirtyRef.current = true;
    const nowTimeStr = new Date().toLocaleTimeString('th-TH', { hour12: false });
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        status,
        time: nowTimeStr,
      },
    }));

    if (status === 'ลา' && !leaveReasonMap[studentId]) {
      const promptReason = window.prompt('ระบุเหตุผลการลา (เช่น ป่วย, ติดสอบ, ลากิจ):', 'ลากิจจำเป็น');
      if (promptReason && promptReason.trim()) {
        setLeaveReasonMap((prev) => ({ ...prev, [studentId]: promptReason.trim() }));
      }
    }
  };

  // Mark all
  const handleMarkAll = (status: AttendanceStatus) => {
    isDirtyRef.current = true;
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
    
    termRecords
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
  }, [termRecords, currentTeacher]);

  // Save
  const handleSaveAttendance = async () => {
    if (!currentTeacher || groupStudents.length === 0) return;

    setIsSaving(true);
    setSaveMessage(null);

    const nowISO = new Date().toISOString();
    const payload: AttendanceRecord[] = groupStudents.map((st) => {
      const item = attendanceMap[st.studentId] || { status: 'มา', time: currentTime };
      return {
        date: selectedDate,
        studentId: st.studentId,
        studentName: st.fullName,
        teacherName: currentTeacher.name,
        groupName: currentTeacher.groupName,
        yearLevel: currentTeacher.yearLevel,
        gender: currentTeacher.gender,
        status: item.status,
        timestamp: nowISO,
        recordedTime: item.time || currentTime,
        major: getStudentMajor(st),
        level: getStudentLevel(st),
        leaveReason: item.status === 'ลา' ? (leaveReasonMap[st.studentId] || 'ลากิจ') : undefined,
        sessionTopic: sessionTopic.trim() || undefined,
        notes: sessionNotes.trim() || undefined,
        term: getTermKey(semester),
      };
    });

    // Save session metadata
    saveSessionMetadata({
      date: selectedDate,
      teacherName: currentTeacher.name,
      topic: sessionTopic.trim(),
      notes: sessionNotes.trim(),
    });


    try {
      const res = await saveAttendanceBatch(payload);
      if (res.success) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.85 },
          colors: ['#7e22ce', '#a855f7', '#10b981'],
        });
        setSaveMessage({
          type: 'success',
          text: `บันทึกข้อมูลเรียบร้อยแล้ว (${groupStudents.length} คน)`,
        });
        isDirtyRef.current = false;
        onAttendanceSaved();
      } else {
        setSaveMessage({
          type: 'error',
          text: res.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
        });
      }
    } catch {
      setSaveMessage({
        type: 'error',
        text: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatThaiDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-');
      const thaiYear = parseInt(y, 10) + 543;
      const months = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
      ];
      return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${thaiYear}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-3 sm:py-6 space-y-4 sm:space-y-6 pb-56 sm:pb-36 animate-fadeIn">
      {/* 1. TOP BAR: BACK, TUTORIAL & LIVE CLOCK */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {onBackToLanding && (
            <button
              type="button"
              onClick={onBackToLanding}
              className="inline-flex items-center space-x-2 text-xs sm:text-sm font-extrabold text-purple-900 hover:text-purple-950 bg-white/90 hover:bg-white border border-purple-200/80 px-3.5 py-2 rounded-full shadow-card hover:shadow-card-hover transition-all duration-300 ease-spring active:scale-95 group"
            >
              <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center group-hover:-translate-x-0.5 transition-transform duration-200">
                <ArrowLeft className="w-3.5 h-3.5" />
              </div>
              <span>เปลี่ยนอาจารย์ / หน้าแรก</span>
            </button>
          )}

          {onOpenTutorial && (
            <button
              type="button"
              onClick={onOpenTutorial}
              className="inline-flex items-center space-x-1.5 text-xs font-extrabold text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200/90 px-3.5 py-2 rounded-full shadow-2xs transition-all active:scale-95"
              title="เปิดดูคู่มือการใช้งานสำหรับบุคลากร"
            >
              <HelpCircle className="w-3.5 h-3.5 text-purple-700" />
              <span>คู่มือบุคลากร</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsFeedbackOpen(true)}
            className="inline-flex items-center space-x-1.5 text-xs font-extrabold text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200/90 px-3.5 py-2 rounded-full shadow-2xs transition-all active:scale-95"
            title="ส่งข้อเสนอแนะถึงผู้ดูแลระบบ (ไม่ระบุตัวตน)"
          >
            <MessageSquare className="w-3.5 h-3.5 text-purple-700" />
            <span>ข้อเสนอแนะ</span>
          </button>
        </div>

        {/* Real-time Clock with Pulsing Dot */}
        <div className="inline-flex items-center space-x-2 bg-white/90 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold text-purple-950 border border-purple-200/80 shadow-card ml-auto">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Timer className="w-3.5 h-3.5 text-purple-700" />
          <span className="tabular-nums">{currentTime} น.</span>
        </div>
      </div>

      {/* 2. หัวกลุ่ม + เลือกวันที่ (รวมไว้ในการ์ดเดียว) */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-purple-800 via-purple-900 to-indigo-950 text-white shadow-xl shadow-purple-900/20">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-fuchsia-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative p-5 sm:p-7 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                <span className="px-2.5 py-0.5 rounded-full bg-white/15">{currentTeacher?.gender === 'ชาย' ? 'กลุ่มชาย' : 'กลุ่มหญิง'}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/15">{currentTeacher?.yearLevel}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/15">{termLabel}</span>
              </div>
              <h1 className="text-xl sm:text-3xl font-black tracking-tight leading-snug">{currentTeacher?.name}</h1>
              <p className="text-sm text-purple-200 flex items-center gap-1.5">
                <Users className="w-4 h-4" /> {currentTeacher?.groupName} • {groupStudents.length} คน
              </p>
            </div>

            <div className="flex items-center gap-2 bg-white/10 rounded-2xl px-3 py-2 self-start">
              <Award className="w-4 h-4 text-amber-300" />
              <span className="text-xs text-purple-200">ระดับกลุ่ม</span>
              <span className="text-sm font-black text-amber-300">{currentGroupLevel}</span>
              <button type="button" onClick={handlePromoteGroup} title="เลื่อนระดับกลุ่ม" className="w-7 h-7 rounded-lg bg-white/15 hover:bg-emerald-500 flex items-center justify-center transition">
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={handleDemoteGroup} title="ลดระดับกลุ่ม" className="w-7 h-7 rounded-lg bg-white/15 hover:bg-rose-500 flex items-center justify-center transition">
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ตัวเลือกวัน */}
          <div className="rounded-2xl bg-white text-purple-950 p-3 sm:p-4 flex flex-col md:flex-row md:items-center gap-3 shadow-lg">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button type="button" onClick={() => changeDay(-1)} title="วันก่อนหน้า" className="w-10 h-10 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleOpenCalendar}
                className="flex-1 min-w-0 text-left px-3 py-1.5 rounded-xl hover:bg-purple-50 transition"
                title="เลือกวันจากปฏิทิน"
              >
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-purple-600 shrink-0" />
                  <span className="text-lg sm:text-xl font-black truncate">{formatThaiDate(selectedDate)}</span>
                  {selectedDate === getTodayString() ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700">วันนี้</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">ย้อนหลัง</span>
                  )}
                </div>
                <div className={`text-xs font-semibold mt-0.5 ${isDateAlreadySaved ? 'text-emerald-600' : 'text-purple-500'}`}>
                  {isDateAlreadySaved ? '● บันทึกแล้ว แก้ไขและบันทึกซ้ำได้' : '○ ยังไม่ได้บันทึกวันนี้'}
                </div>
              </button>
              <button type="button" onClick={() => changeDay(1)} title="วันถัดไป" className="w-10 h-10 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            {selectedDate !== getTodayString() && (
              <button
                type="button"
                onClick={() => setSelectedDate(getTodayString())}
                className="px-4 py-2.5 rounded-xl bg-purple-800 hover:bg-purple-900 text-white text-sm font-bold shrink-0"
              >
                กลับวันนี้
              </button>
            )}
            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />
          </div>

          {/* วันที่เคยบันทึกในภาคนี้ */}
          {groupHistory.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" /> บันทึกแล้วในภาคนี้ {groupHistory.length} ครั้ง
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {groupHistory.map((h) => (
                  <button
                    key={h.date}
                    type="button"
                    onClick={() => setSelectedDate(h.date)}
                    className={`shrink-0 px-3 py-2 rounded-xl text-left transition ${
                      selectedDate === h.date ? 'bg-amber-400 text-purple-950' : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    <div className="text-xs font-black whitespace-nowrap">{formatThaiDate(h.date)}</div>
                    <div className={`text-[10px] font-semibold ${selectedDate === h.date ? 'text-purple-900' : 'text-purple-200'}`}>
                      มา {h.present}/{h.total}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* สรุปสด */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: 'มา', v: counts.present, cls: 'bg-emerald-400/20 text-emerald-100' },
              { label: 'ขาด', v: counts.absent, cls: 'bg-rose-400/20 text-rose-100' },
              { label: 'ลา', v: counts.leave, cls: 'bg-amber-400/20 text-amber-100' },
            ].map((c) => (
              <div key={c.label} className={`rounded-2xl px-4 py-2.5 ${c.cls}`}>
                <div className="text-[11px] font-bold opacity-90">{c.label}</div>
                <div className="text-2xl font-black tabular-nums leading-tight">{c.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. หัวข้อคาบเรียน */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-purple-100 shadow-card grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-bold text-purple-800 flex items-center gap-1.5 mb-1.5">
            <BookOpen className="w-4 h-4 text-purple-500" /> หัวข้อ / ซูเราะฮ์ที่อ่าน
          </span>
          <input
            type="text"
            placeholder="เช่น ซูเราะฮ์อัลมุลก์ 1-15"
            value={sessionTopic}
            onChange={(e) => setSessionTopic(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-purple-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold text-purple-800 flex items-center gap-1.5 mb-1.5">
            <MessageSquare className="w-4 h-4 text-purple-500" /> บันทึกเพิ่มเติม (ไม่บังคับ)
          </span>
          <input
            type="text"
            placeholder="ผลการสอน / พฤติกรรม"
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-purple-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </label>
      </div>

      {/* Save Alert */}
      {saveMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-bold animate-fadeIn ${
            saveMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            {saveMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{saveMessage.text}</span>
          </div>
          <button onClick={() => setSaveMessage(null)} className="underline ml-2 text-xs">
            ปิด
          </button>
        </div>
      )}

      {/* 4. STUDENTS LIST HEADER & QUICK MARK ALL */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs sm:text-sm font-extrabold text-purple-950">
          รายชื่อนักศึกษาในกลุ่ม ({groupStudents.length} คน)
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleMarkAll('มา')}
            className="text-xs font-bold px-3 py-1.5 rounded-full bg-purple-100 hover:bg-purple-200 text-purple-900 transition-all active:scale-95 shadow-sm"
          >
            มาทุกคน
          </button>
          <button
            type="button"
            onClick={() => handleMarkAll('ขาด')}
            className="text-xs font-bold px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all active:scale-95 shadow-sm"
          >
            ขาดหมด
          </button>
        </div>
      </div>

      {/* 5. STUDENT CARDS (Finger-friendly Tactile Toggle) */}
      <div className="space-y-2.5">
        {groupStudents.map((st, idx) => {
          const entry = attendanceMap[st.studentId] || { status: 'มา', time: currentTime };
          return (
            <div
              key={st.studentId}
              className={`p-3.5 sm:p-4 rounded-2xl bg-white border transition-all duration-200 shadow-card hover:shadow-card-hover ${
                entry.status === 'ขาด'
                  ? 'border-rose-300 bg-rose-50/20'
                  : entry.status === 'ลา'
                  ? 'border-amber-300 bg-amber-50/20'
                  : 'border-purple-100/90'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Student Info */}
                <div className="flex items-start space-x-3 min-w-0">
                  <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-900 text-xs font-mono font-extrabold flex items-center justify-center shrink-0 mt-0.5 border border-purple-200/60">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-purple-950 truncate flex items-center gap-2 flex-wrap">
                      <span>{st.fullName}</span>
                      {/* Student Level Badge & Quick Steppers */}
                      <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200/90 px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-900 shadow-2xs">
                        <Award className="w-3 h-3 text-amber-600" />
                        <span>ระดับ {getStudentLevel(st)}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePromoteStudent(st.studentId);
                          }}
                          title="เลื่อนระดับนักศึกษา (01 -> 02 -> 03)"
                          className="hover:text-emerald-700 hover:bg-emerald-100 rounded px-0.5 transition cursor-pointer"
                        >
                          <ArrowUp className="w-2.5 h-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDemoteStudent(st.studentId);
                          }}
                          title="ลดระดับนักศึกษา (03 -> 02 -> 01)"
                          className="hover:text-rose-700 hover:bg-rose-100 rounded px-0.5 transition cursor-pointer"
                        >
                          <ArrowDown className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-purple-800/70 flex items-center gap-2 mt-0.5 flex-wrap">
                      <span>รหัส {st.studentId}</span>
                      <span>•</span>
                      <span className="text-purple-700 font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-purple-500" />
                        <span className="tabular-nums">{entry.time || '-'}</span>
                      </span>
                      <span>•</span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[10px] font-sans font-bold border border-purple-200">
                        🎓 {getStudentMajor(st)}
                      </span>
                      {entry.status === 'ลา' && (
                        <span
                          onClick={() => {
                            const newR = window.prompt('แก้ไขเหตุผลการลา:', leaveReasonMap[st.studentId] || 'ลากิจ');
                            if (newR) setLeaveReasonMap((prev) => ({ ...prev, [st.studentId]: newR.trim() }));
                          }}
                          className="px-2 py-0.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-sans font-bold border border-amber-300 cursor-pointer"
                          title="คลิกเพื่อแก้ไขเหตุผลการลา"
                        >
                          📝 เหตุผล: {leaveReasonMap[st.studentId] || 'ลากิจ'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>


                {/* Big Segmented Status Buttons (Min 44px touch target) */}
                <div className="flex items-center space-x-1.5 w-full sm:w-auto pt-1 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(st.studentId, 'มา')}
                    className={`flex-1 sm:w-16 h-11 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center active:scale-95 ${
                      entry.status === 'มา'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/25 ring-2 ring-emerald-500/20'
                        : 'bg-purple-50/80 text-purple-900 hover:bg-emerald-50 hover:text-emerald-700'
                    }`}
                  >
                    มา
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(st.studentId, 'ขาด')}
                    className={`flex-1 sm:w-16 h-11 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center active:scale-95 ${
                      entry.status === 'ขาด'
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-700/25 ring-2 ring-rose-500/20'
                        : 'bg-purple-50/80 text-purple-900 hover:bg-rose-50 hover:text-rose-700'
                    }`}
                  >
                    ขาด
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(st.studentId, 'ลา')}
                    className={`flex-1 sm:w-16 h-11 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center active:scale-95 ${
                      entry.status === 'ลา'
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-600/25 ring-2 ring-amber-500/20'
                        : 'bg-purple-50/80 text-purple-900 hover:bg-amber-50 hover:text-amber-700'
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


      {/* 7. FLOATING ISLAND SAVE ACTION BAR (Mobile-First Thumb-Friendly) */}
      <div className="fixed bottom-20 sm:bottom-4 left-0 right-0 px-3 sm:px-4 z-30 pointer-events-none">
        <div className="max-w-xl mx-auto bg-white/95 backdrop-blur-xl border border-purple-200/90 shadow-[0_12px_40px_rgba(126,34,206,0.18)] rounded-full p-2 sm:p-2.5 flex items-center justify-between gap-3 pointer-events-auto transition-all">
          <div className="pl-3 sm:pl-4 text-xs font-extrabold text-purple-950 hidden sm:block">
            มา <span className="text-emerald-700 font-black">{counts.present}</span> • ขาด <span className="text-rose-700 font-black">{counts.absent}</span> • ลา <span className="text-amber-700 font-black">{counts.leave}</span>
          </div>

          <button
            type="button"
            onClick={handleSaveAttendance}
            disabled={isSaving}
            className="w-full sm:w-auto h-12 px-7 bg-gradient-to-r from-purple-800 to-purple-700 hover:from-purple-900 hover:to-purple-800 text-white font-extrabold text-xs sm:text-sm rounded-full shadow-md shadow-purple-900/25 transition-all duration-200 flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50 ml-auto group"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <Save className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
            </div>
            <span>{isSaving ? 'กำลังบันทึกข้อมูล...' : 'บันทึกผลการเช็คชื่อ'}</span>
          </button>
        </div>
      </div>

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        presetRole="teacher"
      />
    </div>
  );
};

