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
  CheckCircle2,
  XCircle,
  FileText,
  ArrowLeft,
  BarChart3,
  Award,
  Check,
  UserX,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { getActiveTeachers, getActiveStudents } from '@/lib/data-store';
import { AttendanceRecord, Student } from '@/lib/types';

interface LandingPageViewProps {
  records?: AttendanceRecord[];
  onSelectTeacher: (teacherName: string) => void;
  onGoToAdmin: () => void;
  onOpenSettings: () => void;
  customLogo: string;
  onLogoUpdated: (newLogo: string) => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  records = [],
  onSelectTeacher,
  onGoToAdmin,
  customLogo,
}) => {
  // 1. Dual Persona Mode: 'faculty' (สำหรับบุคคลากร) vs 'student' (สำหรับนักศึกษา)
  const [portalMode, setPortalMode] = useState<'faculty' | 'student'>('faculty');

  // Faculty state
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  const [selectedGender, setSelectedGender] = useState<'ชาย' | 'หญิง'>('ชาย');

  // Student state
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const allTeachers = useMemo(() => getActiveTeachers(), []);
  const allStudents = useMemo(() => getActiveStudents(), []);

  // Remember last searched student in localStorage
  useEffect(() => {
    try {
      const savedId = localStorage.getItem('last_searched_student_id');
      if (savedId) {
        const found = allStudents.find((s) => s.studentId === savedId);
        if (found) setSelectedStudent(found);
      }
    } catch {
      // ignore
    }
  }, [allStudents]);

  const handleSelectStudent = (st: Student) => {
    setSelectedStudent(st);
    try {
      localStorage.setItem('last_searched_student_id', st.studentId);
    } catch {
      // ignore
    }
  };

  // Filtered teachers for faculty mode
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

  const maleCount = useMemo(() => allTeachers.filter(t => t.gender === 'ชาย').length, [allTeachers]);
  const femaleCount = useMemo(() => allTeachers.filter(t => t.gender === 'หญิง').length, [allTeachers]);

  const getStudentCount = (teacherName: string) => {
    return allStudents.filter((s) => s.teacherName === teacherName).length;
  };

  // Matching students for student search
  const matchingStudents = useMemo(() => {
    if (!studentSearchTerm.trim()) return [];
    const q = studentSearchTerm.toLowerCase().trim();
    return allStudents.filter(
      (s) =>
        s.studentId.toLowerCase().includes(q) ||
        s.fullName.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [allStudents, studentSearchTerm]);

  // Student Attendance Analytics
  const studentStats = useMemo(() => {
    if (!selectedStudent) return null;
    const studentRecs = records
      .filter((r) => r.studentId === selectedStudent.studentId)
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

  const logoSrc = customLogo || '/logo.jpg';

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-6 sm:space-y-7 animate-fadeIn">
      {/* 1. TOP CENTER PROMINENT OFFICIAL LOGO */}
      <div className="flex flex-col items-center justify-center text-center space-y-3 sm:space-y-4">
        {/* Outer Double-Bezel Shell */}
        <div className="w-full max-w-sm sm:max-w-lg md:max-w-xl p-2.5 sm:p-3.5 rounded-3xl bg-purple-100/60 border border-purple-200/70 shadow-card transition-all duration-300 hover:shadow-card-hover">
          {/* Inner Core */}
          <div className="bg-white rounded-[1.25rem] px-4 py-3 sm:px-8 sm:py-5 shadow-sm flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt="คณะศึกษาศาสตร์ มหาวิทยาลัยฟาฏอนี"
              className="h-20 sm:h-28 md:h-36 lg:h-44 w-auto object-contain transition-transform duration-300 hover:scale-[1.01]"
            />
          </div>
        </div>

        {/* Title & Organization Name */}
        <div className="space-y-1 pt-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-purple-950 tracking-tight text-balance">
            กลุ่มศึกษาอัลกุรอาน (หะละเกาะห์)
          </h1>
          <p className="text-xs sm:text-sm text-purple-800/80 font-medium">
            คณะศึกษาศาสตร์ มหาวิทยาลัยฟาฏอนี
          </p>
        </div>
      </div>

      {/* 2. DUAL PERSONA TABS: สำหรับนักศึกษา VS สำหรับบุคคลากร */}
      <div className="max-w-2xl mx-auto grid grid-cols-2 gap-2 sm:gap-3 p-1.5 bg-purple-100/70 rounded-3xl border border-purple-200/80 shadow-sm">
        {/* สำหรับนักศึกษา */}
        <button
          type="button"
          onClick={() => setPortalMode('student')}
          className={`py-3 sm:py-3.5 px-3 sm:px-5 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 font-extrabold text-xs sm:text-sm active:scale-98 ${
            portalMode === 'student'
              ? 'bg-gradient-to-r from-purple-800 to-purple-900 text-white shadow-md shadow-purple-950/20 scale-[1.01]'
              : 'text-purple-900/80 hover:text-purple-950 hover:bg-white/60'
          }`}
        >
          <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          <span>สำหรับนักศึกษา</span>
        </button>

        {/* สำหรับบุคคลากร */}
        <button
          type="button"
          onClick={() => setPortalMode('faculty')}
          className={`py-3 sm:py-3.5 px-3 sm:px-5 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 font-extrabold text-xs sm:text-sm active:scale-98 ${
            portalMode === 'faculty'
              ? 'bg-gradient-to-r from-purple-800 to-purple-900 text-white shadow-md shadow-purple-950/20 scale-[1.01]'
              : 'text-purple-900/80 hover:text-purple-950 hover:bg-white/60'
          }`}
        >
          <Users className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          <span>สำหรับบุคคลากร</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 3A. FACULTY PORTAL (สำหรับบุคคลากร / อาจารย์ผู้ดูแล) */}
      {/* ============================================================== */}
      {portalMode === 'faculty' && (
        <div className="space-y-6 sm:space-y-8 animate-fadeIn">
          {/* Gender Selector */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-2xl mx-auto">
            {/* Male Group */}
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
                    selectedGender === 'ชาย'
                      ? 'bg-white/20 text-white'
                      : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {maleCount} กลุ่ม
                </span>
              </div>
              <div className="mt-2 sm:mt-3">
                <div
                  className={`text-xs font-medium ${
                    selectedGender === 'ชาย' ? 'text-purple-200' : 'text-purple-700/70'
                  }`}
                >
                  นักศึกษาและอาจารย์ชาย
                </div>
              </div>
            </button>

            {/* Female Group */}
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
                    selectedGender === 'หญิง'
                      ? 'bg-white/20 text-white'
                      : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {femaleCount} กลุ่ม
                </span>
              </div>
              <div className="mt-2 sm:mt-3">
                <div
                  className={`text-xs font-medium ${
                    selectedGender === 'หญิง' ? 'text-purple-200' : 'text-purple-700/70'
                  }`}
                >
                  นักศึกษาและอาจารย์หญิง
                </div>
              </div>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute left-3.5 top-3 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center pointer-events-none">
              <Search className="w-3.5 h-3.5 text-purple-700" />
            </div>
            <input
              type="text"
              placeholder={`ค้นหาชื่ออาจารย์กลุ่ม${selectedGender}...`}
              value={teacherSearchTerm}
              onChange={(e) => setTeacherSearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-3 text-xs sm:text-sm bg-white border border-purple-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-purple-950 placeholder-purple-300 shadow-sm transition-all"
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
          <div className="space-y-3 max-w-2xl mx-auto">
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

                    {/* Trailing Arrow */}
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
      {/* 3B. STUDENT PORTAL (สำหรับนักศึกษา - ตรวจสอบผลการเข้าร่วม) */}
      {/* ============================================================== */}
      {portalMode === 'student' && (
        <div className="space-y-6 max-w-2xl mx-auto animate-fadeIn">
          {/* Search Box for Student ID or Name */}
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-purple-100 shadow-card space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-purple-950">
                  ค้นหารหัสนักศึกษา หรือชื่อ-นามสกุล
                </h2>
                <p className="text-[11px] text-purple-700/70 font-medium">
                  เพื่อตรวจสอบสถานะการเข้าร่วมกิจกรรมหะละเกาะห์ และอาจารย์ผู้ดูแลกลุ่ม
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute left-3.5 top-3 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center pointer-events-none">
                <Search className="w-3.5 h-3.5 text-purple-700" />
              </div>
              <input
                type="text"
                placeholder="พิมพ์รหัสนักศึกษา (เช่น 406... หรือ 66...) หรือชื่อ-สกุล..."
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
                className="w-full pl-12 pr-12 py-3 text-xs sm:text-sm bg-purple-50/50 border border-purple-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-purple-950 placeholder-purple-400 font-medium transition-all"
              />
              {studentSearchTerm && (
                <button
                  type="button"
                  onClick={() => setStudentSearchTerm('')}
                  className="absolute right-3.5 top-2.5 text-xs font-bold text-purple-600 hover:text-purple-900 bg-white border border-purple-200 px-2 py-1 rounded-lg"
                >
                  ล้าง
                </button>
              )}
            </div>

            {/* Matching Students Autocomplete List */}
            {matchingStudents.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-purple-50">
                <div className="text-[11px] font-bold text-purple-900/60 px-1">
                  ผลการค้นหา ({matchingStudents.length} คน):
                </div>
                <div className="divide-y divide-purple-50 border border-purple-100 rounded-2xl overflow-hidden bg-purple-50/30">
                  {matchingStudents.map((st) => (
                    <button
                      key={st.studentId}
                      type="button"
                      onClick={() => {
                        handleSelectStudent(st);
                        setStudentSearchTerm('');
                      }}
                      className="w-full text-left p-3 hover:bg-white flex items-center justify-between transition-colors group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-extrabold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md">
                            {st.studentId}
                          </span>
                          <span className="font-extrabold text-xs text-purple-950 group-hover:text-purple-700">
                            {st.fullName}
                          </span>
                        </div>
                        <div className="text-[11px] text-purple-700/70 mt-0.5">
                          {st.yearLevel} • {st.groupName} • {st.teacherName}
                        </div>
                      </div>
                      <div className="text-xs font-bold text-purple-700 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        <span>ดูผลลัพธ์</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Selected Student Dashboard View */}
          {selectedStudent && studentStats && (
            <div className="space-y-5 animate-fadeIn">
              {/* Profile Card with Supervisor Info */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-950 text-white p-5 sm:p-6 shadow-xl shadow-purple-900/15 border border-purple-700/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="bg-white/20 text-white text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full border border-white/20">
                        {selectedStudent.studentId}
                      </span>
                      <span className="bg-purple-300/25 text-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-300/30">
                        {selectedStudent.gender === 'ชาย' ? '👨 นศ.ชาย' : '👩 นศ.หญิง'}
                      </span>
                      <span className="bg-purple-300/25 text-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-300/30">
                        {selectedStudent.yearLevel}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                      {selectedStudent.fullName}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedStudent(null)}
                    className="self-start sm:self-auto text-xs font-extrabold px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-purple-100 border border-white/20 transition-all active:scale-95"
                  >
                    ค้นหาคนอื่น
                  </button>
                </div>

                {/* Supervisor / Group Leader Section */}
                <div className="mt-4 pt-4 border-t border-purple-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-purple-950/40 p-3.5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-700/60 border border-purple-500/40 flex items-center justify-center shrink-0 text-purple-200">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[11px] text-purple-300 font-semibold flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-300" />
                        <span>หัวหน้าหะละเกาะห์ / อาจารย์ผู้ดูแลกลุ่ม:</span>
                      </div>
                      <div className="text-sm font-black text-white mt-0.5">
                        {selectedStudent.teacherName}
                      </div>
                    </div>
                  </div>
                  <span className="self-start sm:self-auto text-xs font-mono font-bold px-3 py-1 rounded-xl bg-white/15 text-purple-100 border border-white/20">
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

              {/* Attendance Progress Meter (Visual Bar) */}
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
                  {/* 80% Benchmark Line */}
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

          {/* Empty State when no student is selected yet */}
          {!selectedStudent && (
            <div className="py-12 px-4 text-center bg-white rounded-3xl border border-dashed border-purple-200 space-y-2">
              <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-extrabold text-purple-950">
                กรุณาพิมพ์รหัสนักศึกษาเพื่อดูข้อมูล
              </h3>
              <p className="text-xs text-purple-700/70 max-w-sm mx-auto">
                ระบบจะแสดงผลการเข้าร่วมกิจกรรมหะละเกาะห์ อัตราการเข้าเรียน หัวหน้าหะละเกาะห์ และประวัติการเช็คชื่อรายวัน
              </p>
            </div>
          )}
        </div>
      )}

      {/* 4. FOOTER QUICK ACTIONS (Admin link only) */}
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
