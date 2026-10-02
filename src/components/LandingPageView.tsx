'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Users,
  ShieldCheck,
  ChevronRight,
  GraduationCap,
  Calendar,
  Clock,
  Check,
  UserX,
  FileText,
  ArrowLeft,
  BarChart3,
  Award,
  BookOpen,
  Sparkles,
  Lock,
  Megaphone,
  Bell,
  X
} from 'lucide-react';
import {
  getActiveTeachers,
  getActiveStudents,
  getFacultyPassword,
  getAnnouncements,
} from '@/lib/data-store';
import { AttendanceRecord, Student, Announcement } from '@/lib/types';

interface LandingPageViewProps {
  records?: AttendanceRecord[];
  landingResetSignal?: number;
  onSelectTeacher: (teacherName: string) => void;
  onGoToAdmin: () => void;
  onOpenSettings: () => void;
  customLogo: string;
  onLogoUpdated: (newLogo: string) => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  records = [],
  landingResetSignal,
  onSelectTeacher,
  onGoToAdmin,
  customLogo,
}) => {
  // 1. Three distinct views:
  // 'select' = Landing Screen with ONLY 2 Big Minimalist Buttons
  // 'student' = Dedicated Student Window
  // 'faculty' = Dedicated Faculty/Teacher Window
  const [portalView, setPortalView] = useState<'select' | 'student' | 'faculty'>('select');

  // Reset to 'select' screen when user clicks Home button
  useEffect(() => {
    if (landingResetSignal !== undefined && landingResetSignal > 0) {
      setPortalView('select');
      setSelectedStudent(null);
      setIsFacultyAuthModalOpen(false);
    }
  }, [landingResetSignal]);

  // Faculty authentication state
  const [isFacultyAuthModalOpen, setIsFacultyAuthModalOpen] = useState(false);
  const [facultyPassInput, setFacultyPassInput] = useState('');
  const [facultyAuthError, setFacultyAuthError] = useState('');
  const [isFacultySessionActive, setIsFacultySessionActive] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('halaqah_faculty_session') === 'true';
  });

  // Faculty portal state
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  const [selectedGender, setSelectedGender] = useState<'ชาย' | 'หญิง'>('ชาย');

  // Student portal state (STRICTLY studentId, no name search)
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Announcements state
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    setAnnouncements(getAnnouncements());
  }, [portalView, selectedStudent]);

  const allTeachers = useMemo(() => getActiveTeachers(), []);
  const allStudents = useMemo(() => getActiveStudents(), []);

  // Unified student database: merges data-store with any students recorded in records
  const unifiedStudents = useMemo<Student[]>(() => {
    const studentMap = new Map<string, Student>();

    // 1. From database
    allStudents.forEach((st) => {
      if (st.studentId) {
        studentMap.set(st.studentId.trim(), st);
      }
    });

    // 2. From sheet records (to guarantee any recorded student is found)
    records.forEach((r) => {
      const id = (r.studentId || '').trim();
      if (id && !studentMap.has(id)) {
        studentMap.set(id, {
          studentId: id,
          fullName: r.studentName || `นักศึกษา (${id})`,
          teacherName: r.teacherName || 'ไม่ระบุอาจารย์',
          groupName: r.groupName || 'ไม่ระบุกลุ่ม',
          yearLevel: r.yearLevel || 'ไม่ระบุชั้นปี',
          gender: r.gender || 'ชาย',
          groupId: '',
        });
      }
    });

    return Array.from(studentMap.values());
  }, [allStudents, records]);

  // Handle hardware / browser back button within landing page
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state?.landingView) {
        setPortalView(e.state.landingView);
      } else {
        setPortalView('select');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToView = (view: 'select' | 'student' | 'faculty') => {
    setPortalView(view);
    if (typeof window !== 'undefined') {
      window.history.pushState({ landingView: view }, '', window.location.href);
    }
  };

  const handleBackToSelect = () => {
    setPortalView('select');
    setSelectedStudent(null);
    setStudentSearchTerm('');
    setHasSearched(false);
    setIsFacultyAuthModalOpen(false);
    if (typeof window !== 'undefined') {
      window.history.pushState({ landingView: 'select' }, '', window.location.href);
    }
  };

  // Click on Faculty button: verify session or open password modal
  const handleOpenFacultyPortal = () => {
    if (isFacultySessionActive) {
      navigateToView('faculty');
    } else {
      setFacultyPassInput('');
      setFacultyAuthError('');
      setIsFacultyAuthModalOpen(true);
    }
  };

  // Submit faculty login password
  const handleFacultyLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPass = getFacultyPassword();
    if (facultyPassInput === correctPass) {
      setIsFacultySessionActive(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('halaqah_faculty_session', 'true');
      }
      setIsFacultyAuthModalOpen(false);
      navigateToView('faculty');
    } else {
      setFacultyAuthError('รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง');
    }
  };

  // Filtered teachers for faculty view
  const filteredTeachers = useMemo(() => {
    return allTeachers.filter((t) => {
      const matchGender = t.gender === selectedGender;
      const matchSearch =
        !teacherSearchTerm.trim() ||
        t.name.toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
        t.groupName.toLowerCase().includes(teacherSearchTerm.toLowerCase());
      return matchGender && matchSearch;
    });
  }, [allTeachers, teacherSearchTerm, selectedGender]);

  const maleCount = useMemo(() => allTeachers.filter((t) => t.gender === 'ชาย').length, [allTeachers]);
  const femaleCount = useMemo(() => allTeachers.filter((t) => t.gender === 'หญิง').length, [allTeachers]);

  const getStudentCount = (teacherName: string) => {
    return unifiedStudents.filter((s) => s.teacherName === teacherName).length;
  };

  // STUDENT SEARCH: STRICTLY BY EXACT STUDENT ID (NO AUTOCOMPLETE LEAKAGE)
  const executeStudentSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setHasSearched(true);

    const q = studentSearchTerm.trim().replace(/[\s-]/g, '').toLowerCase();
    if (!q) {
      setSelectedStudent(null);
      return;
    }

    // Exact ID match only
    const exact = unifiedStudents.find(
      (s) => (s.studentId || '').replace(/[\s-]/g, '').toLowerCase() === q
    );
    if (exact) {
      setSelectedStudent(exact);
    } else {
      setSelectedStudent(null);
    }
  };

  const handleClearStudent = () => {
    setSelectedStudent(null);
    setStudentSearchTerm('');
    setHasSearched(false);
  };

  // Announcements targeted to the currently viewed student
  const studentAnnouncements = useMemo(() => {
    if (!selectedStudent) return [];
    const sid = (selectedStudent.studentId || '').trim();
    return announcements.filter(
      (a) => a.targetType === 'all' || a.targetStudentIds.includes(sid)
    );
  }, [selectedStudent, announcements]);

  // Student Attendance Analytics
  const studentStats = useMemo(() => {
    if (!selectedStudent) return null;
    const studentRecs = records
      .filter((r) => (r.studentId || '').trim() === (selectedStudent.studentId || '').trim())
      .sort((a, b) => b.date.localeCompare(a.date));

    const total = studentRecs.length;
    const present = studentRecs.filter((r) => r.status === 'มา').length;
    const absent = studentRecs.filter((r) => r.status === 'ขาด').length;
    const leave = studentRecs.filter((r) => r.status === 'ลา').length;
    const rate = total > 0 ? (present / total) * 100 : 0;
    const isPassed = rate >= 80;

    return {
      records: studentRecs,
      total,
      present,
      absent,
      leave,
      rate,
      isPassed,
    };
  }, [selectedStudent, records]);

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

  const logoSrc = customLogo || '/logo.png';

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-6 sm:space-y-7 animate-fadeIn">
      {/* 1. TOP PROMINENT OFFICIAL LOGO (ORIGINAL LOGO WITH REALISTIC LIGHT SWEEP EFFECT) */}
      <div className="relative flex flex-col items-center justify-center text-center space-y-3 pt-2 sm:pt-4 pb-1">
        {/* Main Logo with Light Sweep across the logo body */}
        <div className="relative w-full max-w-[340px] sm:max-w-md md:max-w-lg lg:max-w-xl flex items-center justify-center py-2 group select-none">
          {/* Base Logo Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt="คณะศึกษาศาสตร์ มหาวิทยาลัยฟาฏอนี"
            className="w-full h-32 sm:h-44 md:h-52 lg:h-60 object-contain block transition-transform duration-300 group-hover:scale-[1.02] drop-shadow-[0_10px_20px_rgba(88,28,135,0.14)]"
          />

          {/* Light Sweep Mask Layer (Clipped precisely to the logo artwork) */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
            style={{
              WebkitMaskImage: `url(${logoSrc})`,
              maskImage: `url(${logoSrc})`,
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
            }}
            aria-hidden="true"
          >
            {/* The sweeping bright light beam */}
            <div
              className="absolute inset-y-0 w-[55%] animate-light-sweep"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 20%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0.1) 80%, transparent 100%)',
                filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.95))',
              }}
            />
          </div>

          {/* Sparkle Glint 1 (Left emblem highlight) */}
          <div
            className="absolute left-[12%] sm:left-[15%] top-[18%] sm:top-[22%] pointer-events-none animate-glint-1"
            aria-hidden="true"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.95)]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
          </div>

          {/* Sparkle Glint 2 (Center calligraphy accent highlight) */}
          <div
            className="absolute right-[28%] sm:right-[30%] top-[12%] sm:top-[16%] pointer-events-none animate-glint-2"
            aria-hidden="true"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.95)]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
          </div>
        </div>

        {/* Title & Subtitle Pill */}
        <div className="space-y-2 pt-1 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-purple-950 tracking-tight text-balance">
            กลุ่มศึกษาอัลกุรอาน (หะละเกาะห์)
          </h1>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-purple-200/80 shadow-[0_4px_16px_rgba(107,33,168,0.08)]">
            <span className="w-2 h-2 rounded-full bg-[#f1b000] shadow-[0_0_8px_rgba(241,176,0,0.9)] animate-pulse" />
            <span className="text-xs sm:text-sm text-purple-950 font-extrabold tracking-wide">
              ระบบบันทึกและติดตามการเข้าร่วม
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. INITIAL SELECTION SCREEN: 2 BIG MINIMALIST BUTTONS */}
      {/* ============================================================== */}
      {portalView === 'select' && (
        <div className="space-y-4 max-w-2xl mx-auto animate-fadeIn pt-1">
          <div className="text-center">
            <span className="text-xs sm:text-sm font-bold tracking-wider text-purple-900/90 bg-purple-100/80 px-4 py-1.5 rounded-full border border-purple-200/80 shadow-xs">
              กรุณาเลือกประเภทผู้ใช้งาน
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {/* BUTTON 1: สำหรับนักศึกษา (สีม่วงไล่เกรเดี้ยนหรูโทนสว่าง + ไอคอนลางๆ) */}
            <button
              type="button"
              onClick={() => navigateToView('student')}
              className="group relative overflow-hidden text-left p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-white/95 via-purple-100/90 to-purple-200/75 text-purple-950 border border-purple-200/90 hover:border-purple-400 shadow-[0_10px_30px_-6px_rgba(147,51,234,0.18)] hover:shadow-[0_16px_36px_-6px_rgba(147,51,234,0.3)] backdrop-blur-2xl transition-all duration-300 active:scale-[0.98] flex flex-col justify-between min-h-[190px] sm:min-h-[210px]"
            >
              {/* Faint Watermark Icon in background (ไอคอนลายน้ำจางๆ สไตล์หรูหรา) */}
              <GraduationCap
                className="absolute -bottom-5 -right-5 w-36 h-36 sm:w-44 sm:h-44 text-purple-700/[0.12] pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-700 ease-out"
                aria-hidden="true"
              />

              {/* Ambient purple liquid glow orb */}
              <div
                className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-purple-300/40 blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700 ease-out"
                aria-hidden="true"
              />

              {/* Specular Liquid Glass Top Sheen & Border Highlights */}
              <div
                className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/10 to-transparent pointer-events-none"
                style={{
                  boxShadow:
                    'inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.95), inset 0 -1px 1px 0 rgba(147, 51, 234, 0.1)',
                }}
                aria-hidden="true"
              />

              <div className="relative z-10">
                {/* Frosted Glass Icon Badge */}
                <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-purple-600/15 text-purple-800 backdrop-blur-md border border-purple-300/70 flex items-center justify-center font-bold mb-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_8px_rgba(147,51,234,0.15)] group-hover:scale-110 group-hover:bg-purple-600/25 transition-all duration-300">
                  <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7 text-purple-800 drop-shadow-xs" />
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-purple-950 tracking-tight group-hover:text-purple-800 transition-colors">
                  สำหรับนักศึกษา
                </h2>
                <p className="text-xs sm:text-sm text-purple-900/80 mt-1.5 leading-relaxed font-medium">
                  ตรวจสอบประวัติการเข้าร่วมกิจกรรมหะละเกาะห์ สถิติ และอาจารย์ผู้ดูแลกลุ่ม
                </p>
              </div>

              {/* Bottom Liquid Glass Action Strip */}
              <div className="relative z-10 mt-5 pt-3 border-t border-purple-300/60 flex items-center justify-between text-xs sm:text-sm font-black text-purple-900 group-hover:text-purple-950">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse" />
                  <span>เข้าสู่ระบบนักศึกษา</span>
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 group-hover:bg-purple-800 text-purple-800 group-hover:text-white border border-purple-200/90 flex items-center justify-center transition-all group-hover:translate-x-1 shadow-sm">
                  <ChevronRight className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>
              </div>
            </button>

            {/* BUTTON 2: สำหรับบุคคลากร (สีทองอำพัน #f1b000 ไล่เกรเดี้ยนหรูโทนสว่าง + ไอคอนลางๆ) */}
            <button
              type="button"
              onClick={handleOpenFacultyPortal}
              className="group relative overflow-hidden text-left p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-white/95 via-[#fff8e6] to-[#fdeec4] text-amber-950 border border-[#f1b000]/40 hover:border-[#f1b000] shadow-[0_10px_30px_-6px_rgba(241,176,0,0.22)] hover:shadow-[0_16px_36px_-6px_rgba(241,176,0,0.38)] backdrop-blur-2xl transition-all duration-300 active:scale-[0.98] flex flex-col justify-between min-h-[190px] sm:min-h-[210px]"
            >
              {/* Faint Watermark Icon in background (ไอคอนลายน้ำจางๆ สไตล์หรูหรา) */}
              <Users
                className="absolute -bottom-5 -right-5 w-36 h-36 sm:w-44 sm:h-44 text-[#f1b000]/[0.18] pointer-events-none group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-700 ease-out"
                aria-hidden="true"
              />

              {/* Ambient gold/amber liquid glow orb */}
              <div
                className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-[#f1b000]/30 blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700 ease-out"
                aria-hidden="true"
              />

              {/* Specular Liquid Glass Top Sheen & Border Highlights */}
              <div
                className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/10 to-transparent pointer-events-none"
                style={{
                  boxShadow:
                    'inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.95), inset 0 -1px 1px 0 rgba(241, 176, 0, 0.12)',
                }}
                aria-hidden="true"
              />

              <div className="relative z-10">
                {/* Header row with Frosted Icon & Lock Pill */}
                <div className="flex items-center justify-between mb-3.5">
                  <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-[#f1b000]/15 text-[#9a6d00] backdrop-blur-md border border-[#f1b000]/40 flex items-center justify-center font-bold shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_8px_rgba(241,176,0,0.18)] group-hover:scale-110 group-hover:bg-[#f1b000]/25 transition-all duration-300">
                    <Users className="w-6 h-6 sm:w-7 sm:h-7 text-[#9a6d00] drop-shadow-xs" />
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-[#f1b000]/40 text-xs font-bold text-[#8a6100] shadow-xs">
                    <Lock className="w-3 h-3 text-[#b37f00]" />
                    <span>มีรหัสผ่าน</span>
                  </div>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-amber-950 tracking-tight group-hover:text-[#9a6d00] transition-colors">
                  สำหรับบุคคลากร
                </h2>
                <p className="text-xs sm:text-sm text-amber-950/80 mt-1.5 leading-relaxed font-medium">
                  กลุ่มศึกษาอัลกุรอานสำหรับอาจารย์ บันทึกและติดตามผลการเช็คชื่อ มา / ขาด / ลา
                </p>
              </div>

              {/* Bottom Liquid Glass Action Strip */}
              <div className="relative z-10 mt-5 pt-3 border-t border-[#f1b000]/40 flex items-center justify-between text-xs sm:text-sm font-black text-amber-950 group-hover:text-[#8a6100]">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#f1b000] shadow-[0_0_8px_rgba(241,176,0,0.9)] animate-pulse" />
                  <span>เข้าสู่ระบบอาจารย์</span>
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 group-hover:bg-[#f1b000] text-[#9a6d00] group-hover:text-white border border-[#f1b000]/40 flex items-center justify-center transition-all group-hover:translate-x-1 shadow-sm">
                  <ChevronRight className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2B. FACULTY LOGIN MODAL (ป้องกันรหัสผ่าน ปลอดภัย ไม่แสดงรหัส) */}
      {/* ============================================================== */}
      {isFacultyAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 w-full max-w-sm border border-purple-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-purple-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="font-black text-base text-purple-950">
                  เข้าสู่ระบบสำหรับบุคคลากร
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFacultyAuthModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-purple-800/80 leading-relaxed">
              กรุณาระบุรหัสผ่านเข้าใช้งานกลุ่มศึกษาอัลกุรอานสำหรับอาจารย์ผู้ดูแล
            </p>

            {facultyAuthError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 animate-fadeIn">
                {facultyAuthError}
              </div>
            )}

            <form onSubmit={handleFacultyLoginSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-purple-900 block mb-1">
                  รหัสผ่านบุคคลากร
                </label>
                <input
                  type="password"
                  placeholder="กรอกรหัสผ่าน..."
                  value={facultyPassInput}
                  onChange={(e) => {
                    setFacultyPassInput(e.target.value);
                    setFacultyAuthError('');
                  }}
                  autoFocus
                  required
                  className="w-full px-3.5 py-2.5 text-sm border border-purple-200 rounded-xl bg-purple-50/40 text-purple-950 font-bold focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFacultyAuthModalOpen(false)}
                  className="px-4 py-2 border border-purple-200 rounded-xl text-purple-800 font-bold text-xs hover:bg-purple-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-purple-800 to-purple-900 hover:from-purple-900 hover:to-purple-950 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all active:scale-95"
                >
                  เข้าสู่ระบบ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. DEDICATED FACULTY WINDOW (แยกหน้าต่าง ไม่เห็นสำหรับนักศึกษา) */}
      {/* ============================================================== */}
      {portalView === 'faculty' && (
        <div className="space-y-6 max-w-2xl mx-auto animate-fadeIn">
          {/* Back Navigation Bar */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleBackToSelect}
              className="inline-flex items-center space-x-2 text-xs sm:text-sm font-extrabold text-purple-900 bg-white hover:bg-purple-50 border border-purple-200 px-3.5 py-2 rounded-full shadow-xs transition-all active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-purple-700" />
              <span>ย้อนกลับไปหน้าเลือกประเภท</span>
            </button>

            <span className="text-xs font-mono font-bold text-purple-800 bg-purple-100 px-3 py-1 rounded-full">
              สำหรับบุคคลากร
            </span>
          </div>

          {/* Gender Selector */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => setSelectedGender('ชาย')}
              className={`p-4 sm:p-5 rounded-3xl text-left border transition-all duration-300 relative overflow-hidden active:scale-[0.98] ${
                selectedGender === 'ชาย'
                  ? 'bg-gradient-to-br from-purple-800 via-purple-800 to-indigo-950 text-white border-purple-700 shadow-lg shadow-purple-900/15'
                  : 'bg-white text-purple-950 border-purple-200/80 hover:border-purple-300 hover:shadow-card'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-base sm:text-xl font-black tracking-tight">กลุ่มชาย</span>
                <span
                  className={`text-[11px] font-mono font-extrabold px-2.5 py-0.5 rounded-full ${
                    selectedGender === 'ชาย' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {maleCount} กลุ่ม
                </span>
              </div>
              <div className="mt-2 sm:mt-3 text-xs font-medium text-purple-200">
                นักศึกษาและอาจารย์ชาย
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedGender('หญิง')}
              className={`p-4 sm:p-5 rounded-3xl text-left border transition-all duration-300 relative overflow-hidden active:scale-[0.98] ${
                selectedGender === 'หญิง'
                  ? 'bg-gradient-to-br from-purple-800 via-purple-800 to-indigo-950 text-white border-purple-700 shadow-lg shadow-purple-900/15'
                  : 'bg-white text-purple-950 border-purple-200/80 hover:border-purple-300 hover:shadow-card'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-base sm:text-xl font-black tracking-tight">กลุ่มหญิง</span>
                <span
                  className={`text-[11px] font-mono font-extrabold px-2.5 py-0.5 rounded-full ${
                    selectedGender === 'หญิง' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {femaleCount} กลุ่ม
                </span>
              </div>
              <div className="mt-2 sm:mt-3 text-xs font-medium text-purple-200">
                นักศึกษาและอาจารย์หญิง
              </div>
            </button>
          </div>

          {/* Teacher Search */}
          <div className="relative">
            <div className="absolute left-3.5 top-3 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center pointer-events-none">
              <Search className="w-3.5 h-3.5 text-purple-700" />
            </div>
            <input
              type="text"
              placeholder={`ค้นหาชื่ออาจารย์กลุ่ม${selectedGender}...`}
              value={teacherSearchTerm}
              onChange={(e) => setTeacherSearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-3 text-xs sm:text-sm bg-white border border-purple-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-purple-950 placeholder-purple-300 shadow-sm transition-all"
            />
            {teacherSearchTerm && (
              <button
                type="button"
                onClick={() => setTeacherSearchTerm('')}
                className="absolute right-3.5 top-2.5 text-xs font-bold text-purple-500 hover:text-purple-800 bg-purple-50 px-2 py-1 rounded-lg"
              >
                ล้าง
              </button>
            )}
          </div>

          {/* Teacher List Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1 text-xs font-bold text-purple-900/70">
              <span>รายชื่ออาจารย์ผู้รับผิดชอบ ({filteredTeachers.length} กลุ่ม)</span>
              <span className="text-[11px] font-mono text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-full">
                กลุ่ม{selectedGender}
              </span>
            </div>

            <div className="space-y-2.5">
              {filteredTeachers.map((t) => {
                const count = getStudentCount(t.name);
                return (
                  <button
                    key={t.groupId}
                    type="button"
                    onClick={() => onSelectTeacher(t.name)}
                    className="w-full text-left p-3.5 sm:p-4 rounded-2xl bg-white border border-purple-100/90 hover:border-purple-300 shadow-card hover:shadow-card-hover transition-all duration-300 ease-spring active:scale-[0.99] flex items-center justify-between group"
                  >
                    <div className="pr-3 flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-[10px] font-mono font-extrabold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200/50">
                          {t.yearLevel}
                        </span>
                        <span className="text-xs text-purple-800/70 font-semibold truncate">
                          {t.groupName}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-purple-950 text-sm sm:text-base truncate group-hover:text-purple-700 transition-colors">
                        {t.name}
                      </h3>
                      <div className="text-[11px] text-purple-800/60 mt-1 font-medium flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-purple-500" />
                        <span>สมาชิกในกลุ่ม {count} คน</span>
                      </div>
                    </div>

                    <div className="w-9 h-9 rounded-full bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center shrink-0 group-hover:bg-purple-800 group-hover:text-white group-hover:translate-x-1 transition-all duration-300 shadow-sm">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                );
              })}
            </div>

            {filteredTeachers.length === 0 && (
              <div className="py-12 text-center bg-white rounded-3xl border border-purple-100 text-purple-400 text-xs">
                ไม่พบรายชื่ออาจารย์ที่ตรงกับ &ldquo;{teacherSearchTerm}&rdquo; ในกลุ่ม{selectedGender}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. DEDICATED STUDENT WINDOW (แยกหน้าต่าง ไม่เห็นสำหรับบุคคลากร) */}
      {/* ============================================================== */}
      {portalView === 'student' && (
        <div className="space-y-6 max-w-2xl mx-auto animate-fadeIn">
          {/* Back Navigation Bar */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleBackToSelect}
              className="inline-flex items-center space-x-2 text-xs sm:text-sm font-extrabold text-purple-900 bg-white hover:bg-purple-50 border border-purple-200 px-3.5 py-2 rounded-full shadow-xs transition-all active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-purple-700" />
              <span>ย้อนกลับไปหน้าเลือกประเภท</span>
            </button>

            <span className="text-xs font-mono font-bold text-purple-800 bg-purple-100 px-3 py-1 rounded-full">
              สำหรับนักศึกษา
            </span>
          </div>

          {/* Student Search Box (STRICTLY EXACT STUDENT ID ONLY) */}
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-purple-100 shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm sm:text-base font-black text-purple-950 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-700" />
                  <span>ตรวจสอบข้อมูลเฉพาะบุคคลตามรหัสนักศึกษา</span>
                </h2>
                <p className="text-[11px] text-purple-700/80 font-medium mt-0.5">
                  ระบุรหัสนักศึกษาของท่านให้ครบถ้วนเพื่อเข้าดูข้อมูลส่วนบุคคลเท่านั้น
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 border border-purple-200/80 rounded-full text-[10px] font-extrabold text-purple-800 self-start sm:self-auto">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>เห็นเฉพาะข้อมูลของตนเอง</span>
              </div>
            </div>

            <form onSubmit={executeStudentSearch} className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute left-3.5 top-3 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center pointer-events-none">
                  <Search className="w-3.5 h-3.5 text-purple-700" />
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="กรอกรหัสนักศึกษาของท่าน เช่น 681441001..."
                  value={studentSearchTerm}
                  onChange={(e) => {
                    setStudentSearchTerm(e.target.value);
                    setHasSearched(false);
                  }}
                  className="w-full pl-12 pr-10 py-3 text-xs sm:text-sm bg-purple-50/50 border border-purple-200/90 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-purple-950 font-mono font-bold placeholder-purple-400"
                />
                {studentSearchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setStudentSearchTerm('');
                      setHasSearched(false);
                    }}
                    className="absolute right-3 top-3 text-xs text-purple-400 hover:text-purple-700"
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-purple-800 to-purple-900 text-white text-xs sm:text-sm font-extrabold rounded-2xl shadow-sm hover:from-purple-900 hover:to-purple-950 transition-all active:scale-95 shrink-0"
              >
                ค้นหา
              </button>
            </form>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-50/60 border border-purple-100/80 text-[11px] text-purple-900/80 font-medium">
              <Lock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>ระบบรักษาความปลอดภัย: ไม่แสดงรายชื่อเพื่อนนักศึกษา จะแสดงข้อมูลเฉพาะเจ้าของรหัสที่ระบุถูกต้องเท่านั้น</span>
            </div>

            {/* Not Found State */}
            {hasSearched && !selectedStudent && studentSearchTerm.trim() && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center text-xs text-rose-800 font-semibold space-y-1 animate-fadeIn">
                <div className="font-bold">ไม่พบข้อมูลรหัสนักศึกษา &ldquo;{studentSearchTerm}&rdquo; ในระบบ</div>
                <div className="text-[11px] text-rose-600 font-normal">
                  กรุณาตรวจสอบรหัสนักศึกษาให้ถูกต้องครบถ้วน หรือติดต่ออาจารย์ผู้ดูแลกลุ่มหะละเกาะห์
                </div>
              </div>
            )}
          </div>

          {/* Selected Student Dashboard View */}
          {selectedStudent && studentStats && (
            <div className="space-y-5 animate-fadeIn">
              {/* ==================== 4A. PROMINENT ANNOUNCEMENTS BANNER (เด่นๆ) ==================== */}
              {studentAnnouncements.length > 0 && (
                <div className="space-y-3">
                  {studentAnnouncements.map((ann) => (
                    <div
                      key={ann.id}
                      className={`relative overflow-hidden rounded-3xl p-5 border-2 shadow-lg animate-fadeIn ${
                        ann.priority === 'urgent'
                          ? 'bg-gradient-to-br from-rose-900 via-rose-800 to-purple-950 border-rose-500 text-white shadow-rose-900/25'
                          : ann.priority === 'warning'
                          ? 'bg-gradient-to-br from-amber-900 via-amber-800 to-purple-950 border-amber-500 text-white shadow-amber-900/25'
                          : 'bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950 border-purple-500 text-white shadow-purple-900/25'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/25">
                          <Megaphone className="w-5 h-5 text-white animate-bounce" />
                        </div>

                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-white/25 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-white/30">
                              {ann.priority === 'urgent'
                                ? '🚨 ประกาศด่วนที่สุด'
                                : ann.priority === 'warning'
                                ? '⚠️ แจ้งเตือนสำคัญ'
                                : '📢 ประกาศสำหรับท่าน'}
                            </span>
                            <span className="text-[10px] text-white/70 font-mono">
                              {new Date(ann.createdAt).toLocaleDateString('th-TH')}
                            </span>
                          </div>

                          <h3 className="text-base sm:text-lg font-black tracking-tight text-white pt-0.5">
                            {ann.title}
                          </h3>

                          <p className="text-xs sm:text-sm text-white/90 leading-relaxed whitespace-pre-wrap font-medium pt-1">
                            {ann.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Profile Card with Supervisor Info */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-950 text-white p-5 sm:p-6 shadow-xl shadow-purple-900/15 border border-purple-700/60">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-white/20 text-white text-xs font-mono font-black px-3 py-1 rounded-full border border-white/20">
                        {selectedStudent.studentId}
                      </span>
                      <span className="bg-purple-300/25 text-purple-200 text-[10px] font-bold px-2.5 py-1 rounded-full border border-purple-300/30">
                        {selectedStudent.gender === 'ชาย' ? '👨 นศ.ชาย' : '👩 นศ.หญิง'}
                      </span>
                      <span className="bg-purple-300/25 text-purple-200 text-[10px] font-bold px-2.5 py-1 rounded-full border border-purple-300/30">
                        {selectedStudent.yearLevel}
                      </span>
                    </div>

                    <div className="text-[11px] text-purple-300 font-semibold uppercase tracking-wider">
                      ชื่อ - สกุล นักศึกษา:
                    </div>
                    <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white mt-0.5">
                      {selectedStudent.fullName}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={handleClearStudent}
                    className="self-start sm:self-auto text-xs font-extrabold px-3.5 py-2 rounded-full bg-white/15 hover:bg-white/25 text-purple-100 border border-white/20 transition-all active:scale-95"
                  >
                    ค้นหารหัสอื่น / ออกจากข้อมูล
                  </button>
                </div>

                {/* Supervisor / Group Leader Section */}
                <div className="mt-5 pt-4 border-t border-purple-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-purple-950/40 p-4 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-purple-700/60 border border-purple-500/40 flex items-center justify-center shrink-0 text-purple-200">
                      <Award className="w-6 h-6 text-amber-300" />
                    </div>
                    <div>
                      <div className="text-[11px] text-purple-300 font-semibold">
                        หัวหน้าหะละเกาะห์ / อาจารย์ผู้ดูแลกลุ่ม:
                      </div>
                      <div className="text-sm sm:text-base font-black text-white mt-0.5">
                        {selectedStudent.teacherName}
                      </div>
                    </div>
                  </div>
                  <span className="self-start sm:self-auto text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-white/15 text-purple-100 border border-white/20">
                    {selectedStudent.groupName}
                  </span>
                </div>
              </div>

              {/* Attendance KPI Cards (Tactile 4-Card Bento) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                {/* Rate Card */}
                <div className="p-3.5 rounded-2xl bg-white border border-purple-100 shadow-card space-y-1">
                  <div className="text-[11px] font-bold text-purple-800/80">อัตราการเข้าร่วม</div>
                  <div className="text-2xl font-black text-purple-950 font-mono">
                    {studentStats.rate.toFixed(1)}%
                  </div>
                  <div>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      studentStats.isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {studentStats.isPassed ? '✓ ผ่านเกณฑ์ (80%)' : '⚠ ต้องปรับปรุง'}
                    </span>
                  </div>
                </div>

                {/* Present Card */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 shadow-card space-y-1">
                  <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>มา (ครั้ง)</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-900 font-mono">
                    {studentStats.present}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-medium">
                    จากทั้งหมด {studentStats.total} ครั้ง
                  </div>
                </div>

                {/* Absent Card */}
                <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/80 shadow-card space-y-1">
                  <div className="text-[11px] font-bold text-rose-800 flex items-center gap-1">
                    <UserX className="w-3 h-3" />
                    <span>ขาด (ครั้ง)</span>
                  </div>
                  <div className="text-2xl font-black text-rose-900 font-mono">
                    {studentStats.absent}
                  </div>
                  <div className="text-[10px] text-rose-700 font-medium">
                    {studentStats.absent === 0 ? 'ดีเยี่ยม ไม่เคยขาด' : 'ขาดกิจกรรม'}
                  </div>
                </div>

                {/* Leave Card */}
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 shadow-card space-y-1">
                  <div className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    <span>ลา (ครั้ง)</span>
                  </div>
                  <div className="text-2xl font-black text-amber-900 font-mono">
                    {studentStats.leave}
                  </div>
                  <div className="text-[10px] text-amber-700 font-medium">
                    มีการแจ้งลาถูกต้อง
                  </div>
                </div>
              </div>

              {/* Attendance Progress Meter */}
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-purple-100 shadow-card space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-purple-950">
                  <span className="flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-purple-700" />
                    <span>แถบความก้าวหน้าการเข้าร่วมกิจกรรม (เกณฑ์ผ่าน 80%)</span>
                  </span>
                  <span className="font-mono text-purple-900 font-extrabold">{studentStats.rate.toFixed(1)}%</span>
                </div>
                <div className="relative h-4 w-full bg-purple-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(studentStats.rate, 100)}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      studentStats.isPassed ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-amber-500 to-rose-500'
                    }`}
                  />
                  {/* 80% line */}
                  <div className="absolute top-0 bottom-0 left-[80%] w-0.5 bg-purple-950/40 z-10" title="เกณฑ์ 80%" />
                </div>
                <div className="flex items-center justify-between text-[10px] text-purple-700/70 font-semibold">
                  <span>0%</span>
                  <span className="text-purple-900 font-bold">เป้าหมาย 80%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Attendance History Timeline (ทุกวันที่เช็คชื่อ) */}
              <div className="bg-white rounded-3xl p-4 sm:p-6 border border-purple-100 shadow-card space-y-3">
                <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-700" />
                    <h3 className="text-xs sm:text-sm font-extrabold text-purple-950">
                      ประวัติการเข้าร่วมกิจกรรมรายวัน ({studentStats.records.length} ครั้ง)
                    </h3>
                  </div>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {studentStats.records.map((r, idx) => (
                    <div
                      key={`${r.date}-${idx}`}
                      className="p-3 sm:p-3.5 rounded-2xl border border-purple-100/90 bg-purple-50/20 hover:bg-purple-50/50 flex items-center justify-between transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs sm:text-sm font-extrabold text-purple-950">
                          {formatThaiDate(r.date)}
                        </div>
                        <div className="text-[11px] text-purple-700/80 font-medium flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-purple-500" />
                          <span>เวลา {r.recordedTime || '-'} น.</span>
                          <span>•</span>
                          <span>ผู้บันทึก: {r.teacherName}</span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {r.status === 'มา' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Check className="w-3.5 h-3.5" />
                            <span>มา</span>
                          </span>
                        )}
                        {r.status === 'ขาด' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                            <UserX className="w-3.5 h-3.5" />
                            <span>ขาด</span>
                          </span>
                        )}
                        {r.status === 'ลา' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                            <FileText className="w-3.5 h-3.5" />
                            <span>ลา</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {studentStats.records.length === 0 && (
                    <div className="py-8 text-center text-purple-400 text-xs">
                      ยังไม่มีบันทึกข้อมูลการเช็คชื่อของนักศึกษาคนนี้ในระบบ
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Empty State when no student selected */}
          {!selectedStudent && !hasSearched && (
            <div className="py-12 px-4 text-center bg-white rounded-3xl border border-dashed border-purple-200 space-y-2">
              <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-extrabold text-purple-950">
                กรุณาระบุรหัสนักศึกษาของท่านเพื่อเข้าดูข้อมูล
              </h3>
              <p className="text-xs text-purple-700/70 max-w-sm mx-auto">
                ระบบรักษาความเป็นส่วนตัว จะแสดงประวัติการเช็คชื่อ สถิติ และประกาศเฉพาะบุคคลตามรหัสที่ระบุเท่านั้น
              </p>
            </div>
          )}
        </div>
      )}

      {/* 5. FOOTER QUICK ACTIONS (Admin link only) */}
      <div className="pt-4 border-t border-purple-100/80 flex items-center justify-center">
        <button
          type="button"
          onClick={onGoToAdmin}
          className="inline-flex items-center space-x-2 text-xs sm:text-sm font-extrabold text-purple-900 bg-white hover:bg-purple-50 border border-purple-200 px-5 py-2.5 rounded-full shadow-sm transition-all duration-200 active:scale-95"
        >
          <ShieldCheck className="w-4 h-4 text-purple-700" />
          <span>เข้าสู่ระบบผู้ดูแลระบบ (Admin)</span>
        </button>
      </div>
    </div>
  );
};
