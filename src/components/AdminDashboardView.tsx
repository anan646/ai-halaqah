'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Users,
  UserCheck,
  FileSpreadsheet,
  FileText,
  Printer,
  Download,
  Search,
  Filter,
  ArrowLeft,
  ArrowRightLeft,
  Edit3,
  CheckCircle2,
  Clock,
  Sparkles,
  PieChart,
  User,
  ShieldCheck,
  LogOut,
  UserPlus,
  Trash2,
  KeyRound,
  RotateCcw,
  X,
  Save,
  Check
} from 'lucide-react';
import { AttendanceRecord, TeacherSummary, StudentSummary, DailySummary, SubAdmin, Teacher, Student } from '@/lib/types';
import {
  getActiveTeachers,
  getActiveStudents,
  moveStudentToTeacher,
  updateStudentInfo,
  updateTeacherInfo,
  resetToInitialData
} from '@/lib/data-store';
import { exportToExcel, exportToWord, downloadPdfReport, printReport } from '@/lib/export-utils';
import { getSubAdmins, addSubAdmin, deleteSubAdmin } from '@/lib/admin-auth';

interface AdminDashboardViewProps {
  records: AttendanceRecord[];
  adminUser?: { id: string; name: string; role: 'admin' | 'subadmin' };
  onLogout: () => void;
  onBackToLanding?: () => void;
}

type TabType = 'overview' | 'transfer' | 'editor' | 'drilldown' | 'subadmins' | 'raw';

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  records,
  adminUser,
  onLogout,
  onBackToLanding,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Active Teachers & Students state from data-store
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const reloadDataStore = () => {
    setTeachers(getActiveTeachers());
    setStudents(getActiveStudents());
  };

  useEffect(() => {
    reloadDataStore();
  }, []);

  // Global Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'ทั้งหมด' | 'ชาย' | 'หญิง'>('ทั้งหมด');
  const [yearFilter, setYearFilter] = useState<string>('ทั้งหมด');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>('ทั้งหมด');

  // Drill-down inspector state
  const [inspectorTeacher, setInspectorTeacher] = useState<string>('');
  const [inspectorStudentId, setInspectorStudentId] = useState<string>('');

  useEffect(() => {
    if (teachers.length > 0 && !inspectorTeacher) {
      setInspectorTeacher(teachers[0].name);
    }
  }, [teachers, inspectorTeacher]);

  // Sub-Admins state
  const [subAdminsList, setSubAdminsList] = useState<SubAdmin[]>([]);
  const [newSubName, setNewSubName] = useState('');
  const [newSubPasscode, setNewSubPasscode] = useState('');
  const [subAdminMsg, setSubAdminMsg] = useState<{ text: string; success: boolean } | null>(null);

  useEffect(() => {
    setSubAdminsList(getSubAdmins());
  }, []);

  // ==================== TRANSFER STUDENT STATE ====================
  const [transferSearch, setTransferSearch] = useState('');
  const [selectedStudentForTransfer, setSelectedStudentForTransfer] = useState<Student | null>(null);
  const [targetTeacherName, setTargetTeacherName] = useState<string>('');
  const [transferResultMsg, setTransferResultMsg] = useState<{ text: string; success: boolean } | null>(null);

  // ==================== EDIT MODAL STATE ====================
  const [editorSubTab, setEditorSubTab] = useState<'students' | 'teachers'>('students');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editorMsg, setEditorMsg] = useState<{ text: string; success: boolean } | null>(null);
  const [editorSearch, setEditorSearch] = useState('');

  // Handle Transfer
  const handleExecuteTransfer = () => {
    if (!selectedStudentForTransfer || !targetTeacherName) {
      setTransferResultMsg({ text: 'กรุณาเลือกนักศึกษาและอาจารย์ปลายทาง', success: false });
      return;
    }
    const res = moveStudentToTeacher(selectedStudentForTransfer.studentId, targetTeacherName);
    setTransferResultMsg({ text: res.message, success: res.success });
    if (res.success) {
      reloadDataStore();
      if (res.updatedStudent) {
        setSelectedStudentForTransfer(res.updatedStudent);
      }
    }
  };

  // Handle Save Student Edit
  const handleSaveStudentEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    const res = updateStudentInfo(editingStudent.studentId, editingStudent);
    setEditorMsg({ text: res.message, success: res.success });
    if (res.success) {
      reloadDataStore();
      setEditingStudent(null);
    }
  };

  // Handle Save Teacher Edit
  const handleSaveTeacherEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    const res = updateTeacherInfo(editingTeacher.name, {
      name: editingTeacher.name,
      groupName: editingTeacher.groupName,
      yearLevel: editingTeacher.yearLevel,
      gender: editingTeacher.gender,
    });
    setEditorMsg({ text: res.message, success: res.success });
    if (res.success) {
      reloadDataStore();
      setEditingTeacher(null);
    }
  };

  // Handle Reset Data
  const handleResetData = () => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตข้อมูลนักศึกษาและอาจารย์ทั้งหมดกลับเป็นค่าเริ่มต้น?')) {
      resetToInitialData();
      reloadDataStore();
      alert('รีเซ็ตข้อมูลนักศึกษาและอาจารย์กลับเป็นค่าเริ่มต้นเรียบร้อยแล้ว');
    }
  };

  // Sub-Admin Handlers
  const handleAddSubAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setSubAdminMsg(null);
    const res = addSubAdmin(newSubName, newSubPasscode);
    if (res.success) {
      setNewSubName('');
      setNewSubPasscode('');
      setSubAdminsList(getSubAdmins());
      setSubAdminMsg({ text: res.message, success: true });
    } else {
      setSubAdminMsg({ text: res.message, success: false });
    }
  };

  const handleDeleteSubAdmin = (id: string) => {
    if (confirm('คุณต้องการลบแอดมินรองท่านนี้ใช่หรือไม่?')) {
      deleteSubAdmin(id);
      setSubAdminsList(getSubAdmins());
    }
  };

  // 1. Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchGender = genderFilter === 'ทั้งหมด' || r.gender === genderFilter;
      const matchYear = yearFilter === 'ทั้งหมด' || r.yearLevel === yearFilter;
      const matchTeacher = selectedTeacherFilter === 'ทั้งหมด' || r.teacherName === selectedTeacherFilter;
      const matchSearch =
        !searchQuery.trim() ||
        r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.studentId.includes(searchQuery) ||
        r.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.groupName.toLowerCase().includes(searchQuery.toLowerCase());

      return matchGender && matchYear && matchTeacher && matchSearch;
    });
  }, [records, genderFilter, yearFilter, selectedTeacherFilter, searchQuery]);

  // 2. High-level KPI Metrics
  const kpi = useMemo(() => {
    const totalRecords = filteredRecords.length;
    const present = filteredRecords.filter((r) => r.status === 'มา').length;
    const absent = filteredRecords.filter((r) => r.status === 'ขาด').length;
    const leave = filteredRecords.filter((r) => r.status === 'ลา').length;
    const rate = totalRecords > 0 ? (present / totalRecords) * 100 : 0;
    const distinctDates = new Set(filteredRecords.map((r) => r.date)).size;

    return {
      totalRecords,
      present,
      absent,
      leave,
      rate,
      distinctDates,
      totalRegisteredStudents: students.length,
      totalRegisteredTeachers: teachers.length,
    };
  }, [filteredRecords, students, teachers]);

  // 3. Summary by Teacher
  const teacherSummaries = useMemo<TeacherSummary[]>(() => {
    return teachers.map((t) => {
      const teacherRecs = filteredRecords.filter((r) => r.teacherName === t.name);
      const studentCount = students.filter((st) => st.teacherName === t.name).length;
      const dates = new Set(teacherRecs.map((r) => r.date));
      const present = teacherRecs.filter((r) => r.status === 'มา').length;
      const absent = teacherRecs.filter((r) => r.status === 'ขาด').length;
      const leave = teacherRecs.filter((r) => r.status === 'ลา').length;
      const total = teacherRecs.length;
      const rate = total > 0 ? (present / total) * 100 : 0;

      const latestRec = [...teacherRecs].sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))[0];

      return {
        teacherName: t.name,
        groupName: t.groupName,
        yearLevel: t.yearLevel,
        gender: t.gender,
        studentCount,
        checkedDatesCount: dates.size,
        totalPresent: present,
        totalAbsent: absent,
        totalLeave: leave,
        overallRate: rate,
        lastCheckedTime: latestRec ? `${latestRec.date} ${latestRec.recordedTime || ''}` : '-',
      };
    }).sort((a, b) => b.overallRate - a.overallRate);
  }, [filteredRecords, teachers, students]);

  // 4. Summary by Student
  const studentSummaries = useMemo<StudentSummary[]>(() => {
    const studentRecMap = new Map<string, AttendanceRecord[]>();
    filteredRecords.forEach((r) => {
      if (!studentRecMap.has(r.studentId)) {
        studentRecMap.set(r.studentId, []);
      }
      studentRecMap.get(r.studentId)!.push(r);
    });

    const sourceStudents = students.filter((st) => {
      const matchGender = genderFilter === 'ทั้งหมด' || st.gender === genderFilter;
      const matchYear = yearFilter === 'ทั้งหมด' || st.yearLevel === yearFilter;
      const matchTeacher = selectedTeacherFilter === 'ทั้งหมด' || st.teacherName === selectedTeacherFilter;
      const matchSearch =
        !searchQuery.trim() ||
        st.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.studentId.includes(searchQuery);
      return matchGender && matchYear && matchTeacher && matchSearch;
    });

    return sourceStudents.map((st) => {
      const recs = studentRecMap.get(st.studentId) || [];
      const present = recs.filter((r) => r.status === 'มา').length;
      const absent = recs.filter((r) => r.status === 'ขาด').length;
      const leave = recs.filter((r) => r.status === 'ลา').length;
      const total = recs.length;
      const rate = total > 0 ? (present / total) * 100 : 0;
      const latest = recs[recs.length - 1];

      return {
        studentId: st.studentId,
        fullName: st.fullName,
        groupName: st.groupName,
        teacherName: st.teacherName,
        yearLevel: st.yearLevel,
        gender: st.gender,
        totalDays: total,
        presentDays: present,
        absentDays: absent,
        leaveDays: leave,
        attendanceRate: rate,
        lastStatus: latest?.status,
        lastRecordedTime: latest ? `${latest.date} ${latest.recordedTime || ''}` : '-',
      };
    }).sort((a, b) => b.attendanceRate - a.attendanceRate);
  }, [filteredRecords, students, genderFilter, yearFilter, selectedTeacherFilter, searchQuery]);

  // 5. Daily Summaries
  const dailySummaries = useMemo<DailySummary[]>(() => {
    const map = new Map<string, { present: number; absent: number; leave: number; total: number; latestTime: string }>();
    filteredRecords.forEach((r) => {
      if (!map.has(r.date)) {
        map.set(r.date, { present: 0, absent: 0, leave: 0, total: 0, latestTime: '' });
      }
      const item = map.get(r.date)!;
      item.total++;
      if (r.status === 'มา') item.present++;
      else if (r.status === 'ขาด') item.absent++;
      else if (r.status === 'ลา') item.leave++;
      if (r.recordedTime && r.recordedTime > item.latestTime) {
        item.latestTime = r.recordedTime;
      }
    });

    return Array.from(map.entries())
      .map(([date, st]) => ({
        date,
        present: st.present,
        absent: st.absent,
        leave: st.leave,
        total: st.total,
        rate: st.total > 0 ? (st.present / st.total) * 100 : 0,
        lastRecordedTime: st.latestTime || '-',
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredRecords]);

  // Drilldown
  const inspectorStudents = useMemo(() => {
    return students.filter((s) => s.teacherName === inspectorTeacher);
  }, [inspectorTeacher, students]);

  const inspectorStudentRecords = useMemo(() => {
    if (!inspectorStudentId) return [];
    return records
      .filter((r) => r.studentId === inspectorStudentId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [inspectorStudentId, records]);

  // Filtered Students for Transfer search
  const transferCandidateStudents = useMemo(() => {
    if (!transferSearch.trim()) return [];
    const q = transferSearch.toLowerCase();
    return students.filter((s) => s.fullName.toLowerCase().includes(q) || s.studentId.includes(q)).slice(0, 8);
  }, [students, transferSearch]);

  // Filtered Students for Editor
  const editorFilteredStudents = useMemo(() => {
    if (!editorSearch.trim()) return students;
    const q = editorSearch.toLowerCase();
    return students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.studentId.includes(q) ||
        s.teacherName.toLowerCase().includes(q) ||
        s.groupName.toLowerCase().includes(q)
    );
  }, [students, editorSearch]);

  // Filtered Teachers for Editor
  const editorFilteredTeachers = useMemo(() => {
    if (!editorSearch.trim()) return teachers;
    const q = editorSearch.toLowerCase();
    return teachers.filter((t) => t.name.toLowerCase().includes(q) || t.groupName.toLowerCase().includes(q));
  }, [teachers, editorSearch]);

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-3 sm:py-6 space-y-4 sm:space-y-6 pb-24 animate-fadeIn">
      {/* ==================== 1. TOP HEADER & PROMINENT BACK BUTTON ==================== */}
      <div className="bg-white rounded-3xl border border-purple-100/90 p-4 sm:p-6 shadow-card hover:shadow-card-hover transition-all duration-300 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Back button & Title with nested button-in-button */}
          <div className="flex items-center space-x-3">
            {onBackToLanding && (
              <button
                type="button"
                onClick={onBackToLanding}
                className="inline-flex items-center space-x-2 text-xs sm:text-sm font-extrabold text-purple-900 hover:text-purple-950 bg-white/90 hover:bg-white border border-purple-200/80 px-3.5 py-2 rounded-full shadow-card hover:shadow-card-hover transition-all duration-300 ease-spring active:scale-95 group shrink-0"
              >
                <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center group-hover:-translate-x-0.5 transition-transform duration-200">
                  <ArrowLeft className="w-3.5 h-3.5" />
                </div>
                <span>ย้อนกลับ</span>
              </button>
            )}

            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-purple-100/90 text-purple-900 text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full border border-purple-200/60">
                  {adminUser?.role === 'subadmin' ? 'แอดมินรอง' : 'ผู้ดูแลระบบหลัก'}
                </span>
                <span className="text-xs text-purple-800 font-semibold">{adminUser?.name || 'แอดมิน'}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-purple-950 mt-0.5 tracking-tight">
                ศูนย์จัดการระบบและแดชบอร์ด
              </h1>
            </div>
          </div>

          {/* Quick Export & Logout */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 print:hidden">
            <button
              onClick={() => exportToExcel(filteredRecords, teacherSummaries, studentSummaries, 'แดชบอร์ดสรุปผล')}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold px-3 py-2 rounded-full shadow-sm transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>

            <button
              onClick={() => exportToWord(filteredRecords, teacherSummaries, 'แดชบอร์ดสรุปผล')}
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold px-3 py-2 rounded-full shadow-sm transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Word</span>
            </button>

            <button
              onClick={() => downloadPdfReport(filteredRecords, teacherSummaries, 'แดชบอร์ดสรุปผล')}
              className="flex items-center space-x-1.5 bg-purple-700 hover:bg-purple-800 active:scale-95 text-white text-xs font-bold px-3 py-2 rounded-full shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>

            <button
              onClick={() => printReport()}
              className="flex items-center space-x-1.5 bg-gray-800 hover:bg-black active:scale-95 text-white text-xs font-bold px-3 py-2 rounded-full shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์</span>
            </button>

            <button
              onClick={onLogout}
              className="flex items-center space-x-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold px-3 py-2 rounded-full active:scale-95 transition-all"
              title="ออกจากระบบแอดมิน"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ออก</span>
            </button>
          </div>
        </div>

        {/* Minimal High-Contrast KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 pt-3 border-t border-purple-50">
          <div className="bg-purple-50/50 hover:bg-purple-50 p-3.5 rounded-2xl border border-purple-100/90 transition-all duration-200">
            <div className="text-[11px] font-bold text-purple-700">อัตราเข้าเรียนรวม</div>
            <div className="text-xl sm:text-2xl font-black text-purple-950 mt-1 tabular-nums">{kpi.rate.toFixed(1)}%</div>
            <div className="text-[10px] text-purple-800/70 mt-0.5 font-medium">มา {kpi.present} • ขาด {kpi.absent} • ลา {kpi.leave}</div>
          </div>

          <div className="bg-purple-50/50 hover:bg-purple-50 p-3.5 rounded-2xl border border-purple-100/90 transition-all duration-200">
            <div className="text-[11px] font-bold text-purple-700">บันทึกทั้งหมด</div>
            <div className="text-xl sm:text-2xl font-black text-purple-950 mt-1 tabular-nums">{kpi.totalRecords} ครั้ง</div>
            <div className="text-[10px] text-purple-800/70 mt-0.5 font-medium">จาก {kpi.distinctDates} วันที่เช็คชื่อ</div>
          </div>

          <div className="bg-purple-50/50 hover:bg-purple-50 p-3.5 rounded-2xl border border-purple-100/90 transition-all duration-200">
            <div className="text-[11px] font-bold text-purple-700">นักศึกษาในระบบ</div>
            <div className="text-xl sm:text-2xl font-black text-purple-950 mt-1 tabular-nums">{kpi.totalRegisteredStudents} คน</div>
            <div className="text-[10px] text-purple-800/70 mt-0.5 font-medium">
              ชาย {students.filter(s => s.gender === 'ชาย').length} / หญิง {students.filter(s => s.gender === 'หญิง').length}
            </div>
          </div>

          <div className="bg-purple-50/50 hover:bg-purple-50 p-3.5 rounded-2xl border border-purple-100/90 transition-all duration-200">
            <div className="text-[11px] font-bold text-purple-700">อาจารย์ผู้ดูแล</div>
            <div className="text-xl sm:text-2xl font-black text-purple-950 mt-1 tabular-nums">{kpi.totalRegisteredTeachers} ท่าน</div>
            <div className="text-[10px] text-purple-800/70 mt-0.5 font-medium">
              {teachers.filter(t => t.gender === 'ชาย').length} กลุ่มชาย / {teachers.filter(t => t.gender === 'หญิง').length} กลุ่มหญิง
            </div>
          </div>
        </div>
      </div>

      {/* ==================== 2. MAIN TABS SWITCHER (FLOATING PILL) ==================== */}
      <div className="flex bg-white/90 backdrop-blur-md p-1.5 rounded-full border border-purple-200/70 shadow-sm overflow-x-auto space-x-1.5 scrollbar-none print:hidden">
        {[
          { id: 'overview', label: '📊 ภาพรวม & รายงาน' },
          { id: 'transfer', label: '🔄 โยกย้ายนักศึกษา' },
          { id: 'editor', label: '✏️ แก้ไขข้อมูล (อาจารย์/นศ.)' },
          { id: 'drilldown', label: '🔍 เจาะลึกรายกลุ่ม/คน' },
          { id: 'subadmins', label: '👥 แอดมินรอง' },
          { id: 'raw', label: '📋 เวลาเช็คชื่อทั้งหมด' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all duration-300 active:scale-95 ${
              activeTab === tab.id
                ? 'bg-purple-800 text-white shadow-md shadow-purple-900/20'
                : 'text-purple-900/80 hover:text-purple-950 hover:bg-purple-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ==================== TAB 1: OVERVIEW & REPORTS ==================== */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-purple-100 shadow-sm space-y-2.5 print:hidden">
            <div className="flex items-center space-x-2 text-xs font-bold text-purple-950">
              <Filter className="w-3.5 h-3.5 text-purple-700" />
              <span>ตัวกรองรายงาน</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-purple-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="ค้นหารหัส, ชื่อ, อาจารย์..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-purple-200 rounded-xl bg-purple-50/30 text-purple-950 placeholder-purple-300"
                />
              </div>

              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-purple-200 rounded-xl bg-purple-50/30 text-purple-900 font-semibold"
              >
                <option value="ทั้งหมด">เพศ: ทั้งหมด</option>
                <option value="ชาย">เพศ: ชาย</option>
                <option value="หญิง">เพศ: หญิง</option>
              </select>

              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-purple-200 rounded-xl bg-purple-50/30 text-purple-900 font-semibold"
              >
                <option value="ทั้งหมด">ชั้นปี: ทั้งหมด</option>
                <option value="ปี 2">ชั้นปีที่ 2</option>
                <option value="ปี 3">ชั้นปีที่ 3</option>
                <option value="ปี 4">ชั้นปีที่ 4</option>
              </select>

              <select
                value={selectedTeacherFilter}
                onChange={(e) => setSelectedTeacherFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-purple-200 rounded-xl bg-purple-50/30 text-purple-900 font-semibold"
              >
                <option value="ทั้งหมด">อาจารย์: ทั้งหมด ({teachers.length} ท่าน)</option>
                {teachers.map((t) => (
                  <option key={t.groupId} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Teacher Summary Table */}
          <div className="bg-white rounded-3xl border border-purple-100 overflow-hidden shadow-sm">
            <div className="p-3.5 border-b border-purple-100 bg-purple-50/50 flex items-center justify-between">
              <span className="font-extrabold text-xs sm:text-sm text-purple-950">
                สรุปผลการเข้าเรียนรายอาจารย์ ({teacherSummaries.length} กลุ่ม)
              </span>
              <span className="text-[11px] text-purple-700 font-semibold">เรียงตามอัตราเข้าเรียน</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-purple-100/60 text-purple-950 font-bold border-b border-purple-200">
                    <th className="py-2.5 px-3">อาจารย์ผู้ดูแล</th>
                    <th className="py-2.5 px-3">กลุ่ม</th>
                    <th className="py-2.5 px-3 text-center">นศ.ในกลุ่ม</th>
                    <th className="py-2.5 px-3 text-center">มา</th>
                    <th className="py-2.5 px-3 text-center">ขาด</th>
                    <th className="py-2.5 px-3 text-right">อัตราเข้า</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50">
                  {teacherSummaries.map((t) => (
                    <tr key={t.teacherName} className="hover:bg-purple-50/40">
                      <td className="py-2.5 px-3 font-bold text-purple-950">{t.teacherName}</td>
                      <td className="py-2.5 px-3 text-purple-800/80 font-medium">{t.groupName}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-purple-900">{t.studentCount} คน</td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-600">{t.totalPresent}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-rose-600">{t.totalAbsent}</td>
                      <td className="py-2.5 px-3 text-right font-black text-purple-800 text-sm">
                        {t.overallRate.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: TRANSFER STUDENT (โยกย้ายนักศึกษา) ==================== */}
      {activeTab === 'transfer' && (
        <div className="bg-white rounded-3xl border border-purple-100 p-4 sm:p-6 shadow-sm space-y-6">
          <div className="border-b border-purple-100 pb-3">
            <h2 className="text-base sm:text-lg font-black text-purple-950 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-purple-700" />
              <span>โยกย้ายนักศึกษาข้ามกลุ่มอาจารย์</span>
            </h2>
            <p className="text-xs text-purple-800/70 mt-1">
              ค้นหานักศึกษา เลือกอาจารย์กลุ่มใหม่ที่ต้องการ และกดปุ่มโยกย้าย ข้อมูลจะอัปเดตทันที
            </p>
          </div>

          {/* Feedback Message */}
          {transferResultMsg && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold border flex items-center gap-2 ${
                transferResultMsg.success
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {transferResultMsg.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-rose-600" />}
              <span>{transferResultMsg.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step 1: Search & Pick Student */}
            <div className="space-y-3 bg-purple-50/40 p-4 rounded-2xl border border-purple-100">
              <label className="text-xs font-extrabold text-purple-950 flex items-center gap-1.5">
                <span>1. ค้นหาและเลือกนักศึกษาที่จะย้าย</span>
              </label>

              <div className="relative">
                <Search className="w-4 h-4 text-purple-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="พิมพ์ชื่อหรือรหัสนักศึกษา..."
                  value={transferSearch}
                  onChange={(e) => setTransferSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs border border-purple-200 rounded-xl bg-white text-purple-950 focus:ring-2 focus:ring-purple-600"
                />
              </div>

              {/* Autocomplete candidates */}
              {transferCandidateStudents.length > 0 && (
                <div className="bg-white border border-purple-200 rounded-xl shadow-md divide-y divide-purple-50 max-h-48 overflow-y-auto">
                  {transferCandidateStudents.map((st) => (
                    <button
                      key={st.studentId}
                      type="button"
                      onClick={() => {
                        setSelectedStudentForTransfer(st);
                        setTransferSearch('');
                      }}
                      className="w-full text-left p-2.5 hover:bg-purple-50 text-xs flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="font-bold text-purple-950">{st.fullName}</div>
                        <div className="text-[10px] text-purple-700">รหัส: {st.studentId} • {st.groupName}</div>
                      </div>
                      <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                        เลือก
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Student Card */}
              {selectedStudentForTransfer ? (
                <div className="bg-white p-3.5 rounded-xl border-2 border-purple-600 shadow-sm space-y-1.5">
                  <div className="text-[11px] font-bold text-purple-600">นักศึกษาที่เลือก:</div>
                  <div className="text-sm font-extrabold text-purple-950">{selectedStudentForTransfer.fullName}</div>
                  <div className="text-xs text-purple-800/80">
                    <span className="font-semibold">รหัส:</span> {selectedStudentForTransfer.studentId} | <span className="font-semibold">เพศ:</span> {selectedStudentForTransfer.gender}
                  </div>
                  <div className="text-xs text-purple-800/80">
                    <span className="font-semibold">กลุ่มปัจจุบัน:</span> {selectedStudentForTransfer.groupName}
                  </div>
                  <div className="text-xs text-purple-800/80">
                    <span className="font-semibold">อาจารย์ปัจจุบัน:</span> {selectedStudentForTransfer.teacherName}
                  </div>
                  <div className="text-xs text-purple-800/80">
                    <span className="font-semibold">ชั้นปี:</span> {selectedStudentForTransfer.yearLevel}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-purple-400 font-medium border border-dashed border-purple-200 rounded-xl">
                  ยังไม่ได้เลือกนักศึกษา (โปรดพิมพ์ค้นหาข้างบน)
                </div>
              )}
            </div>

            {/* Step 2: Choose Target Teacher & Confirm */}
            <div className="space-y-4 bg-purple-50/40 p-4 rounded-2xl border border-purple-100 flex flex-col justify-between">
              <div className="space-y-3">
                <label className="text-xs font-extrabold text-purple-950 flex items-center gap-1.5">
                  <span>2. เลือกอาจารย์กลุ่มเป้าหมายที่จะย้ายไป</span>
                </label>

                <select
                  value={targetTeacherName}
                  onChange={(e) => setTargetTeacherName(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs border border-purple-200 rounded-xl bg-white text-purple-950 font-bold focus:ring-2 focus:ring-purple-600"
                >
                  <option value="">-- โปรดเลือกอาจารย์กลุ่มใหม่ --</option>
                  {teachers.map((t) => (
                    <option key={t.groupId} value={t.name}>
                      {t.name} ({t.groupName} - {t.gender} - {t.yearLevel})
                    </option>
                  ))}
                </select>

                {targetTeacherName && (
                  <div className="bg-white p-3 rounded-xl border border-purple-200 text-xs text-purple-900 space-y-1">
                    <div className="text-[11px] font-bold text-emerald-700">กลุ่มใหม่ที่จะย้ายเข้า:</div>
                    <div className="font-bold">{targetTeacherName}</div>
                    <div className="text-purple-700">
                      {teachers.find((t) => t.name === targetTeacherName)?.groupName} (
                      {teachers.find((t) => t.name === targetTeacherName)?.gender} •{' '}
                      {teachers.find((t) => t.name === targetTeacherName)?.yearLevel})
                    </div>
                  </div>
                )}
              </div>

              {/* Big Action Button */}
              <button
                type="button"
                onClick={handleExecuteTransfer}
                disabled={!selectedStudentForTransfer || !targetTeacherName}
                className={`w-full py-3 px-4 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-center space-x-2 transition-all shadow-md ${
                  selectedStudentForTransfer && targetTeacherName
                    ? 'bg-purple-700 hover:bg-purple-800 text-white shadow-purple-900/20'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                }`}
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>ยืนยันการโยกย้ายกลุ่มทันที</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: DATA EDITOR (แก้ไขข้อมูล นศ./อาจารย์) ==================== */}
      {activeTab === 'editor' && (
        <div className="bg-white rounded-3xl border border-purple-100 p-4 sm:p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100 pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-black text-purple-950 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-purple-700" />
                <span>แก้ไขข้อมูลอาจารย์ นักศึกษา กลุ่ม และชั้นปี</span>
              </h2>
              <p className="text-xs text-purple-800/70 mt-0.5">
                เลือกแก้ไขข้อมูลที่ต้องการ ข้อมูลจะบันทึกและส่งต่อไปยังชีตอัตโนมัติ
              </p>
            </div>

            {/* Sub-tabs & Reset */}
            <div className="flex items-center space-x-2">
              <div className="bg-purple-50 p-1 rounded-xl border border-purple-200 flex">
                <button
                  type="button"
                  onClick={() => setEditorSubTab('students')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    editorSubTab === 'students' ? 'bg-purple-700 text-white shadow-sm' : 'text-purple-900'
                  }`}
                >
                  นักศึกษา ({students.length})
                </button>
                <button
                  type="button"
                  onClick={() => setEditorSubTab('teachers')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    editorSubTab === 'teachers' ? 'bg-purple-700 text-white shadow-sm' : 'text-purple-900'
                  }`}
                >
                  อาจารย์ ({teachers.length})
                </button>
              </div>

              <button
                type="button"
                onClick={handleResetData}
                title="รีเซ็ตกลับเป็นข้อมูลเริ่มต้น"
                className="p-2 text-purple-700 hover:text-purple-950 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 text-xs font-bold"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Feedback Message */}
          {editorMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-bold border flex items-center justify-between ${
                editorMsg.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              <span>{editorMsg.text}</span>
              <button onClick={() => setEditorMsg(null)}><X className="w-3.5 h-3.5" /></button>
            </div>
          )}

          {/* Search in Editor */}
          <div className="relative">
            <Search className="w-4 h-4 text-purple-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={editorSubTab === 'students' ? 'ค้นหารหัสนักศึกษา, ชื่อ, อาจารย์...' : 'ค้นหาชื่ออาจารย์, กลุ่ม...'}
              value={editorSearch}
              onChange={(e) => setEditorSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-purple-200 rounded-xl bg-purple-50/30 text-purple-950 placeholder-purple-300"
            />
          </div>

          {/* EDIT STUDENT MODAL / FORM */}
          {editingStudent && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3">
              <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md border border-purple-200 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-purple-950 flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-purple-700" />
                    <span>แก้ไขข้อมูลนักศึกษา</span>
                  </h3>
                  <button onClick={() => setEditingStudent(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveStudentEdit} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-purple-900">รหัสนักศึกษา</label>
                    <input
                      type="text"
                      value={editingStudent.studentId}
                      onChange={(e) => setEditingStudent({ ...editingStudent, studentId: e.target.value })}
                      className="w-full mt-1 p-2 border border-purple-200 rounded-xl font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-purple-900">ชื่อ - นามสกุล</label>
                    <input
                      type="text"
                      value={editingStudent.fullName}
                      onChange={(e) => setEditingStudent({ ...editingStudent, fullName: e.target.value })}
                      className="w-full mt-1 p-2 border border-purple-200 rounded-xl font-semibold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-purple-900">เพศ</label>
                      <select
                        value={editingStudent.gender}
                        onChange={(e) => setEditingStudent({ ...editingStudent, gender: e.target.value as any })}
                        className="w-full mt-1 p-2 border border-purple-200 rounded-xl font-semibold"
                      >
                        <option value="ชาย">ชาย</option>
                        <option value="หญิง">หญิง</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-purple-900">ชั้นปี</label>
                      <select
                        value={editingStudent.yearLevel}
                        onChange={(e) => setEditingStudent({ ...editingStudent, yearLevel: e.target.value })}
                        className="w-full mt-1 p-2 border border-purple-200 rounded-xl font-semibold"
                      >
                        <option value="ปี 2">ปี 2</option>
                        <option value="ปี 3">ปี 3</option>
                        <option value="ปี 4">ปี 4</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-purple-900">อาจารย์ผู้ดูแล</label>
                    <select
                      value={editingStudent.teacherName}
                      onChange={(e) => {
                        const t = teachers.find(item => item.name === e.target.value);
                        setEditingStudent({
                          ...editingStudent,
                          teacherName: e.target.value,
                          groupName: t ? t.groupName : editingStudent.groupName,
                        });
                      }}
                      className="w-full mt-1 p-2 border border-purple-200 rounded-xl font-semibold"
                    >
                      {teachers.map((t) => (
                        <option key={t.groupId} value={t.name}>
                          {t.name} ({t.groupName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-purple-900">ชื่อกลุ่ม</label>
                    <input
                      type="text"
                      value={editingStudent.groupName}
                      onChange={(e) => setEditingStudent({ ...editingStudent, groupName: e.target.value })}
                      className="w-full mt-1 p-2 border border-purple-200 rounded-xl"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingStudent(null)}
                      className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-sm"
                    >
                      บันทึกข้อมูล
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* EDIT TEACHER MODAL / FORM */}
          {editingTeacher && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3">
              <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md border border-purple-200 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-purple-950 flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-purple-700" />
                    <span>แก้ไขข้อมูลอาจารย์</span>
                  </h3>
                  <button onClick={() => setEditingTeacher(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveTeacherEdit} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-purple-900">ชื่อ - สกุล อาจารย์</label>
                    <input
                      type="text"
                      value={editingTeacher.name}
                      onChange={(e) => setEditingTeacher({ ...editingTeacher, name: e.target.value })}
                      className="w-full mt-1 p-2 border border-purple-200 rounded-xl font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-purple-900">ชื่อกลุ่มหะละเกาะห์</label>
                    <input
                      type="text"
                      value={editingTeacher.groupName}
                      onChange={(e) => setEditingTeacher({ ...editingTeacher, groupName: e.target.value })}
                      className="w-full mt-1 p-2 border border-purple-200 rounded-xl font-semibold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-purple-900">เพศกลุ่ม</label>
                      <select
                        value={editingTeacher.gender}
                        onChange={(e) => setEditingTeacher({ ...editingTeacher, gender: e.target.value as any })}
                        className="w-full mt-1 p-2 border border-purple-200 rounded-xl font-semibold"
                      >
                        <option value="ชาย">ชาย</option>
                        <option value="หญิง">หญิง</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-purple-900">ชั้นปีที่กำกับดูแล</label>
                      <select
                        value={editingTeacher.yearLevel}
                        onChange={(e) => setEditingTeacher({ ...editingTeacher, yearLevel: e.target.value })}
                        className="w-full mt-1 p-2 border border-purple-200 rounded-xl font-semibold"
                      >
                        <option value="ปี 2">ปี 2</option>
                        <option value="ปี 3">ปี 3</option>
                        <option value="ปี 4">ปี 4</option>
                      </select>
                    </div>
                  </div>

                  <p className="text-[11px] text-purple-600 bg-purple-50 p-2 rounded-xl">
                    * เมื่อกดบันทึก ข้อมูลกลุ่มของนักศึกษาทุกคนในกลุ่มนี้จะได้รับการอัปเดตโดยอัตโนมัติ
                  </p>

                  <div className="flex items-center justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingTeacher(null)}
                      className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-sm"
                    >
                      บันทึกข้อมูล
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Sub-tab 1: Student List */}
          {editorSubTab === 'students' && (
            <div className="overflow-x-auto border border-purple-100 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-purple-100/60 text-purple-950 font-bold border-b border-purple-200">
                    <th className="py-2.5 px-3">รหัส</th>
                    <th className="py-2.5 px-3">ชื่อ - นามสกุล</th>
                    <th className="py-2.5 px-3 text-center">เพศ</th>
                    <th className="py-2.5 px-3 text-center">ชั้นปี</th>
                    <th className="py-2.5 px-3">กลุ่ม</th>
                    <th className="py-2.5 px-3">อาจารย์ผู้ดูแล</th>
                    <th className="py-2.5 px-3 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50">
                  {editorFilteredStudents.slice(0, 100).map((st) => (
                    <tr key={st.studentId} className="hover:bg-purple-50/40">
                      <td className="py-2 px-3 font-mono font-bold text-purple-900">{st.studentId}</td>
                      <td className="py-2 px-3 font-bold text-purple-950">{st.fullName}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          st.gender === 'ชาย' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                        }`}>
                          {st.gender}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center font-medium">{st.yearLevel}</td>
                      <td className="py-2 px-3 text-purple-800/80">{st.groupName}</td>
                      <td className="py-2 px-3 text-purple-900 font-semibold">{st.teacherName}</td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setEditingStudent(st)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-lg font-bold text-[11px] transition-all"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>แก้ไข</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Sub-tab 2: Teacher List */}
          {editorSubTab === 'teachers' && (
            <div className="overflow-x-auto border border-purple-100 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-purple-100/60 text-purple-950 font-bold border-b border-purple-200">
                    <th className="py-2.5 px-3">ชื่อ - สกุล อาจารย์</th>
                    <th className="py-2.5 px-3">กลุ่มหะละเกาะห์</th>
                    <th className="py-2.5 px-3 text-center">เพศ</th>
                    <th className="py-2.5 px-3 text-center">ชั้นปี</th>
                    <th className="py-2.5 px-3 text-center">นศ.ในกลุ่ม</th>
                    <th className="py-2.5 px-3 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50">
                  {editorFilteredTeachers.map((t) => {
                    const count = students.filter(s => s.teacherName === t.name).length;
                    return (
                      <tr key={t.groupId} className="hover:bg-purple-50/40">
                        <td className="py-2.5 px-3 font-bold text-purple-950">{t.name}</td>
                        <td className="py-2.5 px-3 text-purple-800 font-medium">{t.groupName}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.gender === 'ชาย' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                          }`}>
                            {t.gender}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium">{t.yearLevel}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-purple-900">{count} คน</td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setEditingTeacher(t)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-lg font-bold text-[11px] transition-all"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>แก้ไข</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 4: DRILLDOWN (เจาะลึกอาจารย์-นศ.) ==================== */}
      {activeTab === 'drilldown' && (
        <div className="bg-white rounded-3xl border border-purple-100 p-4 sm:p-6 shadow-sm space-y-5">
          <div className="border-b border-purple-100 pb-3">
            <h2 className="text-base sm:text-lg font-black text-purple-950 flex items-center gap-2">
              <Search className="w-5 h-5 text-purple-700" />
              <span>เจาะลึกข้อมูลรายอาจารย์และนักศึกษา</span>
            </h2>
            <p className="text-xs text-purple-800/70 mt-0.5">
              เลือกอาจารย์เพื่อดูรายชื่อนักศึกษาในกลุ่ม และเลือกนักศึกษาเพื่อดูประวัติการเช็คชื่อย้อนหลัง
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-purple-900 mb-1 block">เลือกอาจารย์ผู้ดูแล</label>
              <select
                value={inspectorTeacher}
                onChange={(e) => {
                  setInspectorTeacher(e.target.value);
                  setInspectorStudentId('');
                }}
                className="w-full px-3 py-2.5 text-xs border border-purple-200 rounded-xl bg-purple-50/30 text-purple-950 font-bold"
              >
                {teachers.map((t) => (
                  <option key={t.groupId} value={t.name}>
                    {t.name} ({t.groupName} - {t.gender})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-purple-900 mb-1 block">
                เลือกนักศึกษาในกลุ่ม ({inspectorStudents.length} คน)
              </label>
              <select
                value={inspectorStudentId}
                onChange={(e) => setInspectorStudentId(e.target.value)}
                className="w-full px-3 py-2.5 text-xs border border-purple-200 rounded-xl bg-purple-50/30 text-purple-950 font-bold"
              >
                <option value="">-- เลือกเพื่อดูประวัติเช็คชื่อรายบุคคล --</option>
                {inspectorStudents.map((st) => (
                  <option key={st.studentId} value={st.studentId}>
                    {st.studentId} - {st.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Student History Log */}
          {inspectorStudentId && (
            <div className="border border-purple-100 rounded-2xl overflow-hidden mt-4">
              <div className="bg-purple-100/60 p-3 font-bold text-xs text-purple-950 flex items-center justify-between">
                <span>ประวัติการเช็คชื่อ ({inspectorStudentRecords.length} วัน)</span>
                <span className="font-mono text-purple-800">รหัส: {inspectorStudentId}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-purple-50 text-purple-950 font-bold border-b border-purple-100">
                      <th className="py-2 px-3">วันที่</th>
                      <th className="py-2 px-3 text-center">เวลาจริง</th>
                      <th className="py-2 px-3 text-center">สถานะ</th>
                      <th className="py-2 px-3">อาจารย์ที่เช็ค</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-50">
                    {inspectorStudentRecords.map((r, i) => (
                      <tr key={i} className="hover:bg-purple-50/40">
                        <td className="py-2 px-3 font-mono font-medium">{r.date}</td>
                        <td className="py-2 px-3 text-center font-mono text-purple-700 font-bold">{r.recordedTime || '-'}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            r.status === 'มา' ? 'bg-emerald-100 text-emerald-800' : r.status === 'ขาด' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-purple-800">{r.teacherName}</td>
                      </tr>
                    ))}
                    {inspectorStudentRecords.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-gray-400">ยังไม่มีประวัติการเช็คชื่อสำหรับนักศึกษาท่านนี้</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 5: SUB-ADMINS (จัดการแอดมินรอง) ==================== */}
      {activeTab === 'subadmins' && (
        <div className="bg-white rounded-3xl border border-purple-100 p-4 sm:p-6 shadow-sm space-y-6">
          <div className="border-b border-purple-100 pb-3">
            <h2 className="text-base sm:text-lg font-black text-purple-950 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-purple-700" />
              <span>จัดการสิทธิ์แอดมินรอง (Sub-Admins)</span>
            </h2>
            <p className="text-xs text-purple-800/70 mt-1">
              แอดมินหลักใช้รหัสผ่าน <span className="font-mono font-bold text-purple-950">71300807</span> และสามารถเพิ่มแอดมินรองพร้อมรหัสเฉพาะตัวได้
            </p>
          </div>

          {/* Form add sub-admin */}
          <form onSubmit={handleAddSubAdmin} className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 space-y-3">
            <div className="font-bold text-xs text-purple-950 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-purple-700" />
              <span>เพิ่มผู้ดูแลระบบรองคนใหม่</span>
            </div>

            {subAdminMsg && (
              <div className={`p-2.5 rounded-xl text-xs font-bold ${subAdminMsg.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {subAdminMsg.text}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-purple-900 block mb-1">ชื่อแอดมินรอง</label>
                <input
                  type="text"
                  placeholder="เช่น อ.ฟาฏิมะห์, ครูสุไลมาน"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-purple-200 rounded-xl bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-purple-900 block mb-1">รหัสผ่านสำหรับล็อกอิน</label>
                <input
                  type="password"
                  placeholder="ระบุรหัสผ่าน (อย่างน้อย 4 หลัก)"
                  value={newSubPasscode}
                  onChange={(e) => setNewSubPasscode(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-purple-200 rounded-xl bg-white"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              เพิ่มแอดมินรอง
            </button>
          </form>

          {/* Sub-admins list */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-xs text-purple-950">รายชื่อแอดมินรองในระบบ ({subAdminsList.length} ท่าน)</h3>
            <div className="divide-y divide-purple-100 border border-purple-100 rounded-2xl overflow-hidden">
              {subAdminsList.map((sub) => (
                <div key={sub.id} className="p-3 bg-white flex items-center justify-between text-xs hover:bg-purple-50/30">
                  <div>
                    <div className="font-bold text-purple-950">{sub.name}</div>
                    <div className="text-[11px] text-purple-700/70 font-mono">เพิ่มเมื่อ: {sub.createdAt}</div>
                  </div>
                  <button
                    onClick={() => handleDeleteSubAdmin(sub.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title="ลบแอดมินรอง"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {subAdminsList.length === 0 && (
                <div className="p-6 text-center text-xs text-gray-400">ยังไม่มีแอดมินรองในระบบ</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 6: RAW LOGS (บันทึกเวลาจริงทั้งหมด) ==================== */}
      {activeTab === 'raw' && (
        <div className="bg-white rounded-3xl border border-purple-100 overflow-hidden shadow-sm">
          <div className="p-3.5 border-b border-purple-100 bg-purple-50/50 flex items-center justify-between">
            <span className="font-extrabold text-xs sm:text-sm text-purple-950">
              บันทึกการเช็คชื่อพร้อมเวลา Real-time ({filteredRecords.length} รายการ)
            </span>
            <span className="text-[11px] text-purple-700 font-semibold">บันทึกเวลาจริง</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-purple-100/60 text-purple-950 font-bold border-b border-purple-200">
                  <th className="py-2.5 px-3">วันที่</th>
                  <th className="py-2.5 px-3 text-center">เวลาจริง</th>
                  <th className="py-2.5 px-3">รหัส</th>
                  <th className="py-2.5 px-3">ชื่อ</th>
                  <th className="py-2.5 px-3 text-center">สถานะ</th>
                  <th className="py-2.5 px-3">อาจารย์</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {filteredRecords.slice(0, 100).map((r, idx) => (
                  <tr key={idx} className="hover:bg-purple-50/40">
                    <td className="py-2 px-3 font-mono font-medium">{r.date}</td>
                    <td className="py-2 px-3 text-center font-mono text-[11px] text-purple-700 font-bold">
                      {r.recordedTime || '-'}
                    </td>
                    <td className="py-2 px-3 font-mono text-purple-900">{r.studentId}</td>
                    <td className="py-2 px-3 font-bold text-purple-950">{r.studentName}</td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          r.status === 'มา'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'ขาด'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-purple-800">{r.teacherName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
