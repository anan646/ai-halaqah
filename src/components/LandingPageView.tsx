'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Users,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
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
  X,
  HelpCircle,
  KeyRound,
  Loader2,
} from 'lucide-react';
import {
  getActiveTeachers,
  getActiveStudents,
  getFacultyPassword,
  saveFacultyPassword,
  getAnnouncements,
  getStudentMajor,
  formatTermLabel,
  getDeletedStudentIds,
  STUDENTS_UPDATED_EVENT,
  TEACHERS_UPDATED_EVENT,
} from '@/lib/data-store';
import { fetchPublicData } from '@/lib/api-client';
import { AttendanceRecord, Student, Teacher, Announcement } from '@/lib/types';
import { OnboardingTutorialModal, TutorialRole } from '@/components/OnboardingTutorialModal';
import { StudentPortalView } from '@/components/StudentPortalView';
import { ModalPortal } from '@/components/ModalPortal';
import { verifyAdminPasscode } from '@/lib/admin-auth';


const STUDENT_TUTORIAL_KEY = 'halaqah_tutorial_student_dismissed_v1';
const FACULTY_TUTORIAL_KEY = 'halaqah_tutorial_faculty_dismissed_v1';

interface LandingPageViewProps {
  records?: AttendanceRecord[];
  landingResetSignal?: number;
  onSelectTeacher: (teacherName: string) => void;
  onGoToAdmin: () => void;
  onOpenSettings: () => void;
  customLogo: string;
  onLogoUpdated: (newLogo: string) => void;
  onOpenTutorial?: () => void;
  onPortalViewChange?: (view: 'select' | 'student' | 'faculty') => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  records = [],
  landingResetSignal,
  onSelectTeacher,
  onGoToAdmin,
  customLogo,
  onOpenTutorial,
  onPortalViewChange,
}) => {
  // Role-based tutorial state
  const [activeTutorialRole, setActiveTutorialRole] = useState<TutorialRole | null>(null);

  // 1. Three distinct views:
  // 'select' = Landing Screen with ONLY 2 Big Minimalist Buttons
  // 'student' = Dedicated Student Window
  // 'faculty' = Dedicated Faculty/Teacher Window
  const [portalView, setPortalView] = useState<'select' | 'student' | 'faculty'>(() => {
    if (typeof window === 'undefined') return 'select';
    const saved = sessionStorage.getItem('halaqah_landing_portal_view') || localStorage.getItem('halaqah_landing_portal_view');
    if (saved === 'student' || saved === 'faculty') return saved;
    return 'select';
  });

  // Notify parent component of current portal view and persist
  useEffect(() => {
    onPortalViewChange?.(portalView);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('halaqah_landing_portal_view', portalView);
      localStorage.setItem('halaqah_landing_portal_view', portalView);
    }
  }, [portalView, onPortalViewChange]);

  // Reset to 'select' screen when user clicks Home button
  useEffect(() => {
    if (landingResetSignal !== undefined && landingResetSignal > 0) {
      setPortalView('select');
      setIsFacultyAuthModalOpen(false);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('halaqah_landing_portal_view', 'select');
        localStorage.setItem('halaqah_landing_portal_view', 'select');
      }
    }
  }, [landingResetSignal]);

  // Faculty authentication state
  const [isFacultyAuthModalOpen, setIsFacultyAuthModalOpen] = useState(false);
  const [facultyPassInput, setFacultyPassInput] = useState('');
  const [facultyAuthError, setFacultyAuthError] = useState('');
  const [isFacultySessionActive, setIsFacultySessionActive] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      sessionStorage.getItem('halaqah_faculty_session') === 'true' ||
      localStorage.getItem('halaqah_faculty_session') === 'true'
    );
  });

  // Faculty portal state
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  const [selectedGender, setSelectedGender] = useState<'ชาย' | 'หญิง'>(() => {
    if (typeof window === 'undefined') return 'ชาย';
    return (localStorage.getItem('halaqah_faculty_selected_gender') as 'ชาย' | 'หญิง') || 'ชาย';
  });
  const [selectedYearLevel, setSelectedYearLevel] = useState<string>(() => {
    if (typeof window === 'undefined') return 'ทั้งหมด';
    return localStorage.getItem('halaqah_faculty_year_level') || 'ทั้งหมด';
  });

  const handleGenderChange = (gender: 'ชาย' | 'หญิง') => {
    setSelectedGender(gender);
    if (typeof window !== 'undefined') {
      localStorage.setItem('halaqah_faculty_selected_gender', gender);
    }
  };

  const handleYearLevelChange = (year: string) => {
    setSelectedYearLevel(year);
    if (typeof window !== 'undefined') {
      localStorage.setItem('halaqah_faculty_year_level', year);
    }
  };

  const [allTeachers, setAllTeachers] = useState<Teacher[]>(() => getActiveTeachers());
  const [allStudents, setAllStudents] = useState<Student[]>(() => getActiveStudents());

  useEffect(() => {
    setAllTeachers(getActiveTeachers());
    setAllStudents(getActiveStudents());
  }, [records]);

  // ซิงค์รายชื่ออาจารย์และนักศึกษาแบบเรียลไทม์ทันทีที่มีการอัปเดตจาก Google Sheet หรือการลบในระบบ
  useEffect(() => {
    const handleSync = () => {
      setAllTeachers(getActiveTeachers());
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

  // ฐานข้อมูลนักศึกษาที่แท้จริง: อ้างอิงจากฐานข้อมูลรายชื่อปัจจุบัน (ไม่ฟื้นคืนชีพรายชื่อที่ถูกลบออกไปแล้ว)
  const unifiedStudents = useMemo<Student[]>(() => {
    const studentMap = new Map<string, Student>();
    const deletedIds = getDeletedStudentIds();

    allStudents.forEach((st) => {
      const id = (st.studentId || '').trim();
      if (id && !deletedIds.has(id)) {
        studentMap.set(id, st);
      }
    });

    return Array.from(studentMap.values());
  }, [allStudents]);

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

  const checkAndOpenTutorial = (role: TutorialRole) => {
    if (typeof window === 'undefined') return;
    const key = role === 'student' ? STUDENT_TUTORIAL_KEY : FACULTY_TUTORIAL_KEY;
    // แสดงคู่มือเฉพาะครั้งแรกของแต่ละบทบาท จากนั้นจดจำไว้ ไม่เด้งซ้ำ (ยังกดปุ่ม "คู่มือ" เปิดดูเองได้)
    if (localStorage.getItem(key) !== 'true') {
      localStorage.setItem(key, 'true');
      setActiveTutorialRole(role);
    }
  };

  const handleDismissRoleTutorialForever = () => {
    if (typeof window !== 'undefined' && activeTutorialRole) {
      const key = activeTutorialRole === 'student' ? STUDENT_TUTORIAL_KEY : FACULTY_TUTORIAL_KEY;
      localStorage.setItem(key, 'true');
    }
    setActiveTutorialRole(null);
  };

  const navigateToView = (view: 'select' | 'student' | 'faculty') => {
    setPortalView(view);
    if (typeof window !== 'undefined') {
      window.history.pushState({ landingView: view }, '', window.location.href);
    }

    if (view === 'student') {
      checkAndOpenTutorial('student');
    } else if (view === 'faculty') {
      checkAndOpenTutorial('faculty');
    }
  };

  const handleBackToSelect = () => {
    setPortalView('select');
    setIsFacultyAuthModalOpen(false);
    setActiveTutorialRole(null);
    if (typeof window !== 'undefined') {
      window.history.pushState({ landingView: 'select' }, '', window.location.href);
    }
  };

  // Click on Faculty button: verify session or open password modal
  const handleOpenFacultyPortal = () => {
    // ดึงรหัสผ่านและข้อมูลล่าสุดจาก Google Sheet ล่วงหน้าในพื้นหลังทันที
    fetchPublicData()
      .then((pub) => {
        if (pub.ok && pub.facultyPassword) {
          saveFacultyPassword(pub.facultyPassword);
        }
      })
      .catch(() => null);

    if (isFacultySessionActive) {
      navigateToView('faculty');
    } else {
      setFacultyPassInput('');
      setFacultyAuthError('');
      setIsFacultyAuthModalOpen(true);
    }
  };

  const [isVerifyingRemoteFaculty, setIsVerifyingRemoteFaculty] = useState(false);

  // Submit faculty login password
  const handleFacultyLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = facultyPassInput.trim();
    if (!input) {
      setFacultyAuthError('กรุณากรอกรหัสผ่าน');
      return;
    }

    const localPass = String(getFacultyPassword() || '').trim();
    if (input === localPass) {
      setIsFacultySessionActive(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('halaqah_faculty_session', 'true');
        localStorage.setItem('halaqah_faculty_session', 'true');
      }
      setIsFacultyAuthModalOpen(false);
      setFacultyPassInput('');
      setFacultyAuthError('');
      navigateToView('faculty');
      return;
    }

    // หากรหัสในเครื่องไม่ตรง ให้ตรวจสอบกับ Google Sheet แบบเรียลไทม์ทันที
    setIsVerifyingRemoteFaculty(true);
    setFacultyAuthError('');
    try {
      const pub = await fetchPublicData();
      const remotePass = pub.facultyPassword ? String(pub.facultyPassword).trim() : '';
      if (pub.ok && remotePass && input === remotePass) {
        saveFacultyPassword(remotePass);
        setIsFacultySessionActive(true);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('halaqah_faculty_session', 'true');
          localStorage.setItem('halaqah_faculty_session', 'true');
        }
        setIsFacultyAuthModalOpen(false);
        setFacultyPassInput('');
        setFacultyAuthError('');
        navigateToView('faculty');
        return;
      }

      // หากกรอกรหัสแอดมิน ให้สามารถเข้าใช้งานหน้าอาจารย์ได้ด้วยเช่นกัน
      const adminCheck = await verifyAdminPasscode(input);
      if (adminCheck.valid) {
        setIsFacultySessionActive(true);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('halaqah_faculty_session', 'true');
          localStorage.setItem('halaqah_faculty_session', 'true');
        }
        setIsFacultyAuthModalOpen(false);
        setFacultyPassInput('');
        setFacultyAuthError('');
        navigateToView('faculty');
        return;
      }
    } catch (err) {
      console.warn('Realtime faculty password check error:', err);
    } finally {
      setIsVerifyingRemoteFaculty(false);
    }

    setFacultyAuthError('รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง');
  };

  // Year level group counts for the selected gender
  const yearCounts = useMemo(() => {
    const genderTeachers = allTeachers.filter((t) => t.gender === selectedGender);
    return {
      total: genderTeachers.length,
      y2: genderTeachers.filter((t) => t.yearLevel.includes('2')).length,
      y3: genderTeachers.filter((t) => t.yearLevel.includes('3')).length,
      y4: genderTeachers.filter((t) => t.yearLevel.includes('4')).length,
    };
  }, [allTeachers, selectedGender]);

  // Filtered teachers for faculty view
  const filteredTeachers = useMemo(() => {
    return allTeachers.filter((t) => {
      const matchGender = t.gender === selectedGender;
      const matchYear =
        selectedYearLevel === 'ทั้งหมด' || t.yearLevel === selectedYearLevel;
      const matchSearch =
        !teacherSearchTerm.trim() ||
        t.name.toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
        t.groupName.toLowerCase().includes(teacherSearchTerm.toLowerCase());
      return matchGender && matchYear && matchSearch;
    });
  }, [allTeachers, teacherSearchTerm, selectedGender, selectedYearLevel]);

  const maleCount = useMemo(() => allTeachers.filter((t) => t.gender === 'ชาย').length, [allTeachers]);
  const femaleCount = useMemo(() => allTeachers.filter((t) => t.gender === 'หญิง').length, [allTeachers]);

  const getStudentCount = (teacherName: string) => {
    return unifiedStudents.filter((s) => s.teacherName === teacherName).length;
  };

  const logoSrc = customLogo || '/logo.png';

  return (
    <div
      className={`w-full max-w-3xl mx-auto px-3 sm:px-4 ${
        portalView === 'select' ? 'py-4 sm:py-8 space-y-6 sm:space-y-7' : 'py-2 sm:py-3 space-y-4'
      } animate-fadeIn`}
    >
      {/* 1. TOP PROMINENT OFFICIAL LOGO (ORIGINAL LOGO WITH REALISTIC LIGHT SWEEP EFFECT) - SHOWN ON PORTAL SELECTION */}
      {portalView === 'select' && (
        <div className="relative flex flex-col items-center justify-center text-center space-y-1 pt-2 sm:pt-4 pb-1">
          {/* Main Logo with Light Sweep across the logo body */}
          <div className="relative w-full max-w-[360px] sm:max-w-lg md:max-w-xl lg:max-w-2xl flex items-center justify-center py-2 sm:py-3 group select-none">
            {/* Base Logo Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt="คณะศึกษาศาสตร์ มหาวิทยาลัยฟาฏอนี"
              className="w-full h-36 sm:h-48 md:h-56 lg:h-64 object-contain block transition-transform duration-300 group-hover:scale-[1.02] drop-shadow-[0_12px_24px_rgba(88,28,135,0.15)]"
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
                className="absolute inset-y-0 w-[45%] animate-light-sweep"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 20%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0.1) 80%, transparent 100%)',
                  filter: 'drop-shadow(0 0 14px rgba(255,255,255,0.95))',
                }}
              />
            </div>

            {/* Sparkle Glint 1 (Highlight on FTU curves) */}
            <div
              className="absolute left-[10%] sm:left-[12%] top-[20%] sm:top-[22%] pointer-events-none animate-glint-1"
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

            {/* Sparkle Glint 2 (Highlight on EDU open book symbol) */}
            <div
              className="absolute right-[16%] sm:right-[18%] top-[8%] sm:top-[12%] pointer-events-none animate-glint-2"
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

          {/* ชื่อระบบ */}
          <div className="text-center flex flex-col items-center -mt-1">
            <div className="text-[11px] sm:text-xs font-bold tracking-[0.25em] text-purple-500 uppercase">
              Halaqah Al-Quran
            </div>
            {/* ฟอนต์ Prompt วางสระไทยได้ดี; ช่องว่างบน-ล่างอยู่ใน span (ให้สระไม่ถูกตัดตอนไล่สี) แล้วดึงระยะกลับด้วย margin ติดลบ */}
            <h1 className="text-[2rem] sm:text-5xl md:text-6xl font-extrabold -my-1.5 sm:-my-2" style={{ fontFamily: "'Prompt', 'IBM Plex Sans Thai', sans-serif" }}>
              <span
                className="inline-block px-1 py-2 leading-[1.45] bg-gradient-to-r from-[#5b21b6] via-[#c026d3] to-[#f59e0b] bg-clip-text text-transparent drop-shadow-[0_6px_18px_rgba(147,51,234,0.25)] animate-gradient-x"
                style={{ backgroundSize: '200% auto' }}
              >
                กลุ่มศึกษาอัลกุรอาน
              </span>
            </h1>
            <p className="text-sm sm:text-base text-purple-800/70 font-medium">ระบบบันทึกและติดตามการเข้าร่วม</p>
          </div>
        </div>
      )}

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

            {/* BUTTON 2: สำหรับบุคลากร (สีทองอำพัน #f1b000 ไล่เกรเดี้ยนหรูโทนสว่าง + ไอคอนลางๆ) */}
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
                  สำหรับบุคลากร
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
                  เข้าสู่ระบบสำหรับบุคลากร
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
                  รหัสผ่านบุคลากร
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
                  disabled={isVerifyingRemoteFaculty}
                  className="px-5 py-2 bg-gradient-to-r from-purple-800 to-purple-900 hover:from-purple-900 hover:to-purple-950 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-60"
                >
                  {isVerifyingRemoteFaculty ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>กำลังตรวจสอบ...</span>
                    </>
                  ) : (
                    <span>เข้าสู่ระบบ</span>
                  )}
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
        <div className="space-y-3 sm:space-y-4 max-w-2xl mx-auto animate-fadeIn">
          {/* Back Navigation Bar & Quick Tutorial */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 bg-white/95 backdrop-blur-md p-2 sm:p-2.5 rounded-2xl border border-purple-100 shadow-2xs">
            <button
              type="button"
              onClick={handleBackToSelect}
              className="inline-flex items-center space-x-1 sm:space-x-1.5 text-xs font-extrabold text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200/90 px-2.5 sm:px-3 py-1.5 rounded-full shadow-2xs transition-all active:scale-95 shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-purple-700" />
              <span>ย้อนกลับ</span>
            </button>

            {/* Compact Branding */}
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoSrc} alt="Logo" className="w-6 h-6 sm:w-7 sm:h-7 object-contain shrink-0" />
              <span className="hidden sm:inline text-xs sm:text-sm font-black text-purple-950 truncate">
                กลุ่มศึกษาอัลกุรอาน
              </span>
              <span className="text-[10px] sm:text-xs font-mono font-bold text-purple-800 bg-purple-100 px-2 sm:px-2.5 py-0.5 rounded-full whitespace-nowrap">
                สำหรับบุคลากร
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTutorialRole('faculty')}
                className="inline-flex items-center space-x-1 text-xs font-extrabold text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200/90 px-2.5 py-1.5 rounded-full shadow-2xs transition-all active:scale-95"
                title="เปิดดูคู่มือการใช้งานสำหรับบุคลากร"
              >
                <HelpCircle className="w-3.5 h-3.5 text-purple-700" />
                <span>คู่มือ</span>
              </button>
            </div>
          </div>

          {/* Gender Selector */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
            <button
              type="button"
              onClick={() => handleGenderChange('ชาย')}
              className={`p-3 sm:p-4 rounded-2xl text-left border transition-all duration-300 relative overflow-hidden active:scale-[0.98] ${
                selectedGender === 'ชาย'
                  ? 'bg-gradient-to-br from-purple-800 via-purple-800 to-indigo-950 text-white border-purple-700 shadow-md shadow-purple-900/15 ring-2 ring-purple-600/50'
                  : 'bg-white text-purple-950 border-purple-200/80 hover:border-purple-300 hover:shadow-card'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-base sm:text-lg font-black tracking-tight">กลุ่มชาย</span>
                <span
                  className={`text-[10px] sm:text-[11px] font-mono font-extrabold px-2 py-0.5 rounded-full ${
                    selectedGender === 'ชาย' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {maleCount} กลุ่ม
                </span>
              </div>
              <div
                className={`mt-1 sm:mt-1.5 text-[11px] sm:text-xs font-medium ${
                  selectedGender === 'ชาย' ? 'text-purple-200' : 'text-purple-600/80'
                }`}
              >
                นักศึกษาและอาจารย์ชาย
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleGenderChange('หญิง')}
              className={`p-3 sm:p-4 rounded-2xl text-left border transition-all duration-300 relative overflow-hidden active:scale-[0.98] ${
                selectedGender === 'หญิง'
                  ? 'bg-gradient-to-br from-purple-800 via-purple-800 to-indigo-950 text-white border-purple-700 shadow-md shadow-purple-900/15 ring-2 ring-purple-600/50'
                  : 'bg-white text-purple-950 border-purple-200/80 hover:border-purple-300 hover:shadow-card'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-base sm:text-lg font-black tracking-tight">กลุ่มหญิง</span>
                <span
                  className={`text-[10px] sm:text-[11px] font-mono font-extrabold px-2 py-0.5 rounded-full ${
                    selectedGender === 'หญิง' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {femaleCount} กลุ่ม
                </span>
              </div>
              <div
                className={`mt-1 sm:mt-1.5 text-[11px] sm:text-xs font-medium ${
                  selectedGender === 'หญิง' ? 'text-purple-200' : 'text-purple-600/80'
                }`}
              >
                นักศึกษาและอาจารย์หญิง
              </div>
            </button>
          </div>

          {/* Year Level Selector (ชั้นปี 2, 3, 4) */}
          <div className="bg-white/90 backdrop-blur-xs p-2 sm:p-2.5 rounded-2xl border border-purple-100 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] sm:text-xs font-extrabold text-purple-950 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-purple-700" />
                <span>เลือกระดับชั้นปี</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                {selectedYearLevel === 'ทั้งหมด'
                  ? `ทั้งหมด ${yearCounts.total} กลุ่ม`
                  : `${selectedYearLevel} (${filteredTeachers.length} กลุ่ม)`}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => handleYearLevelChange('ทั้งหมด')}
                className={`py-2 px-1.5 sm:px-2 rounded-xl text-center text-xs font-extrabold transition-all duration-200 active:scale-95 flex flex-col items-center justify-center gap-0.5 ${
                  selectedYearLevel === 'ทั้งหมด'
                    ? 'bg-purple-800 text-white shadow-xs shadow-purple-900/20'
                    : 'bg-purple-50/70 hover:bg-purple-100/70 text-purple-900 border border-purple-100/80'
                }`}
              >
                <span className="text-[11px] sm:text-xs font-black">ทั้งหมด</span>
                <span
                  className={`text-[9px] sm:text-[10px] font-mono font-bold ${
                    selectedYearLevel === 'ทั้งหมด' ? 'text-purple-200' : 'text-purple-600'
                  }`}
                >
                  {yearCounts.total} กลุ่ม
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleYearLevelChange('ปี 2')}
                className={`py-2 px-1.5 sm:px-2 rounded-xl text-center text-xs font-extrabold transition-all duration-200 active:scale-95 flex flex-col items-center justify-center gap-0.5 ${
                  selectedYearLevel === 'ปี 2'
                    ? 'bg-purple-800 text-white shadow-xs shadow-purple-900/20'
                    : 'bg-purple-50/70 hover:bg-purple-100/70 text-purple-900 border border-purple-100/80'
                }`}
              >
                <span className="text-[11px] sm:text-xs font-black">ชั้นปี 2</span>
                <span
                  className={`text-[9px] sm:text-[10px] font-mono font-bold ${
                    selectedYearLevel === 'ปี 2' ? 'text-purple-200' : 'text-purple-600'
                  }`}
                >
                  {yearCounts.y2} กลุ่ม
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleYearLevelChange('ปี 3')}
                className={`py-2 px-1.5 sm:px-2 rounded-xl text-center text-xs font-extrabold transition-all duration-200 active:scale-95 flex flex-col items-center justify-center gap-0.5 ${
                  selectedYearLevel === 'ปี 3'
                    ? 'bg-purple-800 text-white shadow-xs shadow-purple-900/20'
                    : 'bg-purple-50/70 hover:bg-purple-100/70 text-purple-900 border border-purple-100/80'
                }`}
              >
                <span className="text-[11px] sm:text-xs font-black">ชั้นปี 3</span>
                <span
                  className={`text-[9px] sm:text-[10px] font-mono font-bold ${
                    selectedYearLevel === 'ปี 3' ? 'text-purple-200' : 'text-purple-600'
                  }`}
                >
                  {yearCounts.y3} กลุ่ม
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleYearLevelChange('ปี 4')}
                className={`py-2 px-1.5 sm:px-2 rounded-xl text-center text-xs font-extrabold transition-all duration-200 active:scale-95 flex flex-col items-center justify-center gap-0.5 ${
                  selectedYearLevel === 'ปี 4'
                    ? 'bg-purple-800 text-white shadow-xs shadow-purple-900/20'
                    : 'bg-purple-50/70 hover:bg-purple-100/70 text-purple-900 border border-purple-100/80'
                }`}
              >
                <span className="text-[11px] sm:text-xs font-black">ชั้นปี 4</span>
                <span
                  className={`text-[9px] sm:text-[10px] font-mono font-bold ${
                    selectedYearLevel === 'ปี 4' ? 'text-purple-200' : 'text-purple-600'
                  }`}
                >
                  {yearCounts.y4} กลุ่ม
                </span>
              </button>
            </div>
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
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-purple-700 bg-purple-100/80 px-2.5 py-0.5 rounded-full">
                  กลุ่ม{selectedGender}
                </span>
                {selectedYearLevel !== 'ทั้งหมด' && (
                  <span className="text-[11px] font-mono font-bold text-white bg-purple-800 px-2.5 py-0.5 rounded-full shadow-2xs">
                    {selectedYearLevel}
                  </span>
                )}
              </div>
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
                ไม่พบรายชื่ออาจารย์ที่ตรงกับ {teacherSearchTerm ? `“${teacherSearchTerm}” ` : ''}ในกลุ่ม{selectedGender} {selectedYearLevel !== 'ทั้งหมด' ? `(${selectedYearLevel})` : ''}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. DEDICATED STUDENT WINDOW (แยกหน้าต่าง ไม่เห็นสำหรับบุคลากร) */}
      {/* ============================================================== */}
      {portalView === 'student' && (
        <StudentPortalView
          records={records}
          students={unifiedStudents}
          customLogo={customLogo}
          resetSignal={landingResetSignal}
          onBack={handleBackToSelect}
          onOpenTutorial={() => setActiveTutorialRole('student')}
        />
      )}

      {/* 5. FOOTER QUICK ACTIONS (Admin link only) */}
      {portalView === 'select' && (
        <div className="pt-4 border-t border-purple-100/80 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onGoToAdmin}
            className="inline-flex items-center space-x-2 text-xs sm:text-sm font-extrabold text-purple-900 bg-white hover:bg-purple-50 border border-purple-200 px-5 py-2.5 rounded-full shadow-xs transition-all duration-200 active:scale-95"
          >
            <ShieldCheck className="w-4 h-4 text-purple-700" />
            <span>เข้าสู่ระบบผู้ดูแลระบบ (Admin)</span>
          </button>
        </div>
      )}

      {/* Role-Specific Onboarding Tutorial Modal */}
      {activeTutorialRole && (
        <OnboardingTutorialModal
          isOpen={!!activeTutorialRole}
          role={activeTutorialRole}
          onClose={() => setActiveTutorialRole(null)}
          onDismissForever={handleDismissRoleTutorialForever}
        />
      )}


    </div>
  );
};

