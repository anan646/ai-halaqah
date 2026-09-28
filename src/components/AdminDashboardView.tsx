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
  TrendingUp,
  Clock,
  Layers,
  Sparkles,
  PieChart,
  User,
  ShieldAlert,
  LogOut,
  UserPlus,
  Trash2,
  KeyRound
} from 'lucide-react';
import { AttendanceRecord, TeacherSummary, StudentSummary, DailySummary, SubAdmin } from '@/lib/types';
import { INITIAL_TEACHERS, INITIAL_STUDENTS } from '@/lib/students-data';
import { exportToExcel, exportToWord, downloadPdfReport, printReport } from '@/lib/export-utils';
import { getSubAdmins, addSubAdmin, deleteSubAdmin, setAdminSession } from '@/lib/admin-auth';

interface AdminDashboardViewProps {
  records: AttendanceRecord[];
  adminUser?: { id: string; name: string; role: 'admin' | 'subadmin' };
  onLogout: () => void;
}

type TabType = 'overview' | 'drilldown' | 'subadmins' | 'daily' | 'monthly' | 'teacher' | 'student' | 'raw';

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  records,
  adminUser,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'ทั้งหมด' | 'ชาย' | 'หญิง'>('ทั้งหมด');
  const [yearFilter, setYearFilter] = useState<string>('ทั้งหมด');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>('ทั้งหมด');

  // Drill-down inspector state
  const [inspectorTeacher, setInspectorTeacher] = useState<string>(INITIAL_TEACHERS[0]?.name || '');
  const [inspectorStudentId, setInspectorStudentId] = useState<string>('');

  // Sub-Admins state
  const [subAdminsList, setSubAdminsList] = useState<SubAdmin[]>([]);
  const [newSubName, setNewSubName] = useState('');
  const [newSubPasscode, setNewSubPasscode] = useState('');
  const [subAdminMsg, setSubAdminMsg] = useState<{ text: string; success: boolean } | null>(null);

  useEffect(() => {
    setSubAdminsList(getSubAdmins());
  }, []);

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
      totalRegisteredStudents: INITIAL_STUDENTS.length,
      totalRegisteredTeachers: INITIAL_TEACHERS.length,
    };
  }, [filteredRecords]);

  // 3. Summary by Teacher
  const teacherSummaries = useMemo<TeacherSummary[]>(() => {
    return INITIAL_TEACHERS.map((t) => {
      const teacherRecs = filteredRecords.filter((r) => r.teacherName === t.name);
      const studentCount = INITIAL_STUDENTS.filter((st) => st.teacherName === t.name).length;
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
  }, [filteredRecords]);

  // 4. Summary by Student
  const studentSummaries = useMemo<StudentSummary[]>(() => {
    const studentRecMap = new Map<string, AttendanceRecord[]>();
    filteredRecords.forEach((r) => {
      if (!studentRecMap.has(r.studentId)) {
        studentRecMap.set(r.studentId, []);
      }
      studentRecMap.get(r.studentId)!.push(r);
    });

    const sourceStudents = INITIAL_STUDENTS.filter((st) => {
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
  }, [filteredRecords, genderFilter, yearFilter, selectedTeacherFilter, searchQuery]);

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

  // 6. Monthly Summaries
  const monthlySummaries = useMemo(() => {
    const map = new Map<string, { present: number; absent: number; leave: number; total: number; dates: Set<string> }>();
    filteredRecords.forEach((r) => {
      const monthKey = r.date.slice(0, 7);
      if (!map.has(monthKey)) {
        map.set(monthKey, { present: 0, absent: 0, leave: 0, total: 0, dates: new Set() });
      }
      const item = map.get(monthKey)!;
      item.total++;
      item.dates.add(r.date);
      if (r.status === 'มา') item.present++;
      else if (r.status === 'ขาด') item.absent++;
      else if (r.status === 'ลา') item.leave++;
    });

    return Array.from(map.entries())
      .map(([month, st]) => ({
        month,
        sessionsCount: st.dates.size,
        present: st.present,
        absent: st.absent,
        leave: st.leave,
        total: st.total,
        rate: st.total > 0 ? (st.present / st.total) * 100 : 0,
      }))
      .sort((a, b) => b.month.localeCompare(a.month));
  }, [filteredRecords]);

  // Drilldown
  const inspectorStudents = useMemo(() => {
    return INITIAL_STUDENTS.filter((s) => s.teacherName === inspectorTeacher);
  }, [inspectorTeacher]);

  const inspectorStudentRecords = useMemo(() => {
    if (!inspectorStudentId) return [];
    return records
      .filter((r) => r.studentId === inspectorStudentId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [inspectorStudentId, records]);

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-3 sm:py-6 space-y-4 sm:space-y-6 pb-16">
      {/* Top Header & Admin Profile */}
      <div className="bg-white rounded-3xl border border-purple-100 p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-purple-100 text-purple-900 text-xs px-3 py-1 rounded-full font-bold border border-purple-200">
              ผู้ดูแลระบบ
            </span>
            <span className="text-xs text-purple-800/80 font-semibold">
              {adminUser?.name || 'แอดมิน'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-purple-950 mt-1">
            แดชบอร์ดสรุปผลและรายงาน
          </h1>
        </div>

        {/* 4 Separate Export Buttons (Mobile-first Wrap) */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 print:hidden">
          <button
            onClick={() => exportToExcel(filteredRecords, teacherSummaries, studentSummaries, 'แดชบอร์ดสรุปผล')}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>

          <button
            onClick={() => exportToWord(filteredRecords, teacherSummaries, 'แดชบอร์ดสรุปผล')}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm transition-all"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Word</span>
          </button>

          <button
            onClick={() => downloadPdfReport(filteredRecords, teacherSummaries, 'แดชบอร์ดสรุปผล')}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-1 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>

          <button
            onClick={() => printReport()}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-1 bg-gray-800 hover:bg-black text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พิมพ์</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center justify-center space-x-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold px-3 py-2 rounded-xl transition-all"
            title="ออกจากระบบแอดมิน"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ออก</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (2 Columns on Mobile, 4 on Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-purple-100 shadow-sm">
          <div className="text-[11px] font-bold text-purple-700">อัตราเข้าภาพรวม</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-950 mt-1">{kpi.rate.toFixed(1)}%</div>
          <div className="text-[10px] text-purple-800/60 mt-1">มา {kpi.present} / ขาด {kpi.absent}</div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-purple-100 shadow-sm">
          <div className="text-[11px] font-bold text-purple-700">จำนวนบันทึก</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-950 mt-1">{kpi.totalRecords}</div>
          <div className="text-[10px] text-purple-800/60 mt-1">จาก {kpi.distinctDates} วันที่เช็ค</div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-purple-100 shadow-sm">
          <div className="text-[11px] font-bold text-purple-700">นักศึกษาทั้งหมด</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-950 mt-1">{kpi.totalRegisteredStudents}</div>
          <div className="text-[10px] text-purple-800/60 mt-1">ชาย 109 / หญิง 405</div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-purple-100 shadow-sm">
          <div className="text-[11px] font-bold text-purple-700">อาจารย์ผู้ดูแล</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-950 mt-1">{kpi.totalRegisteredTeachers}</div>
          <div className="text-[10px] text-purple-800/60 mt-1">40 กลุ่มหะละเกาะห์</div>
        </div>
      </div>

      {/* Filter Toolbar (Mobile Friendly) */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-purple-100 shadow-sm space-y-2.5 print:hidden">
        <div className="flex items-center space-x-2 text-xs font-bold text-purple-950">
          <Filter className="w-3.5 h-3.5 text-purple-600" />
          <span>ตัวกรองค้นหา</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-purple-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหารหัส, ชื่อ นศ., อาจารย์..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-purple-200 rounded-xl bg-purple-50/40 text-purple-950 placeholder-purple-300"
            />
          </div>

          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value as any)}
            className="w-full px-3 py-2 text-xs border border-purple-200 rounded-xl bg-purple-50/40 text-purple-900 font-semibold"
          >
            <option value="ทั้งหมด">เพศ: ทั้งหมด</option>
            <option value="ชาย">เพศ: ชาย (109 คน)</option>
            <option value="หญิง">เพศ: หญิง (405 คน)</option>
          </select>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-purple-200 rounded-xl bg-purple-50/40 text-purple-900 font-semibold"
          >
            <option value="ทั้งหมด">ชั้นปี: ทั้งหมด</option>
            <option value="ปี 2">ชั้นปีที่ 2</option>
            <option value="ปี 3">ชั้นปีที่ 3</option>
            <option value="ปี 4">ชั้นปีที่ 4</option>
          </select>

          <select
            value={selectedTeacherFilter}
            onChange={(e) => setSelectedTeacherFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-purple-200 rounded-xl bg-purple-50/40 text-purple-900 font-semibold"
          >
            <option value="ทั้งหมด">อาจารย์: ทั้งหมด ({INITIAL_TEACHERS.length} ท่าน)</option>
            {INITIAL_TEACHERS.map((t) => (
              <option key={t.groupId} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs Switcher (Scrollable horizontally on mobile) */}
      <div className="flex border-b border-purple-100 space-x-1 sm:space-x-3 overflow-x-auto pb-1 print:hidden scrollbar-none">
        {[
          { id: 'overview', label: '📊 กราฟและภาพรวม' },
          { id: 'drilldown', label: '🔍 เจาะลึกอาจารย์-นศ.' },
          { id: 'subadmins', label: '👥 จัดการแอดมินรอง' },
          { id: 'daily', label: '📅 สรุปรายวัน' },
          { id: 'monthly', label: '📆 สรุปรายเดือน' },
          { id: 'teacher', label: '🎓 สรุปรายอาจารย์' },
          { id: 'student', label: '👤 สรุปรายนักศึกษา' },
          { id: 'raw', label: '📋 เวลาเช็คชื่อทั้งหมด' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`py-2.5 px-3 border-b-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'border-purple-700 text-purple-700'
                : 'border-transparent text-purple-800/60 hover:text-purple-950'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ==================== TAB 1: OVERVIEW & GRAPHS ==================== */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-purple-100 shadow-sm space-y-3">
            <h3 className="font-bold text-purple-950 text-sm flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-purple-600" />
              <span>สัดส่วนการเข้าร่วม (มา / ขาด / ลา)</span>
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-emerald-700">มา ({kpi.present} ครั้ง)</span>
                  <span className="text-emerald-700">{kpi.rate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-purple-50 h-3 rounded-full overflow-hidden">
                  <div style={{ width: `${kpi.rate}%` }} className="bg-emerald-500 h-full rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-rose-700">ขาด ({kpi.absent} ครั้ง)</span>
                  <span className="text-rose-700">
                    {kpi.totalRecords > 0 ? ((kpi.absent / kpi.totalRecords) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="w-full bg-purple-50 h-3 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${kpi.totalRecords > 0 ? (kpi.absent / kpi.totalRecords) * 100 : 0}%` }}
                    className="bg-rose-500 h-full rounded-full"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-amber-700">ลา ({kpi.leave} ครั้ง)</span>
                  <span className="text-amber-700">
                    {kpi.totalRecords > 0 ? ((kpi.leave / kpi.totalRecords) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="w-full bg-purple-50 h-3 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${kpi.totalRecords > 0 ? (kpi.leave / kpi.totalRecords) * 100 : 0}%` }}
                    className="bg-amber-400 h-full rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-purple-100 shadow-sm space-y-3">
            <h3 className="font-bold text-purple-950 text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>5 อันดับกลุ่มที่มีอัตราการเข้าสูงสุด</span>
            </h3>
            <div className="space-y-2">
              {teacherSummaries.slice(0, 5).map((t, idx) => (
                <div key={t.teacherName} className="p-2.5 bg-purple-50/60 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-purple-950">{idx + 1}. {t.groupName}</span>
                    <p className="text-[11px] text-purple-800/70">{t.teacherName}</p>
                  </div>
                  <span className="font-extrabold text-purple-800 text-sm">{t.overallRate.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: DRILLDOWN INSPECTOR ==================== */}
      {activeTab === 'drilldown' && (
        <div className="bg-white rounded-3xl border border-purple-100 p-4 sm:p-6 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-purple-950 text-base">เครื่องมือเจาะลึกรายอาจารย์และนักศึกษา</h3>
            <p className="text-xs text-purple-800/60">เลือกอาจารย์ &gt; ดูนักศึกษาในกลุ่ม &gt; ดูเวลาที่เช็คชื่อจริง</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-purple-50/50 rounded-2xl border border-purple-100">
              <label className="block text-xs font-bold text-purple-950 mb-1">1. เลือกอาจารย์</label>
              <select
                value={inspectorTeacher}
                onChange={(e) => {
                  setInspectorTeacher(e.target.value);
                  setInspectorStudentId('');
                }}
                className="w-full p-2 text-xs font-semibold bg-white border border-purple-200 rounded-xl text-purple-950"
              >
                {INITIAL_TEACHERS.map((t) => (
                  <option key={t.groupId} value={t.name}>
                    {t.name} ({t.groupName})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-purple-50/50 rounded-2xl border border-purple-100">
              <label className="block text-xs font-bold text-purple-950 mb-1">2. เลือกนักศึกษา ({inspectorStudents.length} คน)</label>
              <select
                value={inspectorStudentId}
                onChange={(e) => setInspectorStudentId(e.target.value)}
                className="w-full p-2 text-xs font-semibold bg-white border border-purple-200 rounded-xl text-purple-950"
              >
                <option value="">-- กรุณาเลือกนักศึกษา --</option>
                {inspectorStudents.map((s) => (
                  <option key={s.studentId} value={s.studentId}>
                    {s.studentId} - {s.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {inspectorStudentId && (
            <div className="pt-3 border-t border-purple-100">
              <h4 className="text-xs font-bold text-purple-950 mb-2">ประวัติการเช็คชื่อรายบุคคลพร้อมเวลาจริง:</h4>
              <div className="space-y-1.5">
                {inspectorStudentRecords.map((r, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-purple-50/40 border border-purple-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-purple-950">{r.date}</span>
                      <span className="text-[11px] text-purple-700 ml-2 font-mono">
                        เวลา: {r.recordedTime || '-'}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                      r.status === 'มา' ? 'bg-emerald-100 text-emerald-800' : r.status === 'ขาด' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 3: SUB-ADMINS MANAGEMENT ==================== */}
      {activeTab === 'subadmins' && (
        <div className="bg-white rounded-3xl border border-purple-100 p-4 sm:p-6 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-purple-950 text-base">จัดการผู้ดูแลระบบ (แอดมิน)</h3>
            <p className="text-xs text-purple-800/60 mt-0.5">
              แอดมินหลักสามารถเพิ่มแอดมินรอง พร้อมกำหนดรหัสผ่านสำหรับเข้าใช้งาน Dashboard ได้
            </p>
          </div>

          {/* Form to add sub-admin */}
          <form onSubmit={handleAddSubAdmin} className="p-4 bg-purple-50/50 rounded-2xl border border-purple-200 space-y-3">
            <div className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-purple-700" />
              <span>เพิ่มแอดมินรองคนใหม่</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-purple-900 mb-1">ชื่อแอดมินรอง</label>
                <input
                  type="text"
                  placeholder="เช่น อ.อาหมัด หรือ เจ้าหน้าที่..."
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-purple-200 rounded-xl text-purple-950 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-purple-900 mb-1">รหัสผ่านสำหรับล็อกอิน</label>
                <input
                  type="text"
                  placeholder="เช่น 123456 หรือตัวเลขที่ต้องการ..."
                  value={newSubPasscode}
                  onChange={(e) => setNewSubPasscode(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-purple-200 rounded-xl text-purple-950 font-mono font-bold"
                />
              </div>
            </div>

            {subAdminMsg && (
              <p className={`text-xs font-bold ${subAdminMsg.success ? 'text-emerald-700' : 'text-rose-600'}`}>
                {subAdminMsg.text}
              </p>
            )}

            <button
              type="submit"
              className="px-5 py-2 bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              + บันทึกแอดมินรอง
            </button>
          </form>

          {/* List of sub-admins */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-purple-950">รายชื่อแอดมินรองทั้งหมด ({subAdminsList.length} ท่าน)</h4>
            
            {subAdminsList.length === 0 ? (
              <p className="text-xs text-purple-400 py-3 text-center bg-purple-50/30 rounded-xl">
                ยังไม่มีการเพิ่มแอดมินรอง (แอดมินหลักใช้รหัส 71300807)
              </p>
            ) : (
              <div className="space-y-2">
                {subAdminsList.map((admin) => (
                  <div key={admin.id} className="p-3 bg-white border border-purple-100 rounded-2xl flex items-center justify-between shadow-sm text-xs">
                    <div>
                      <div className="font-bold text-purple-950">{admin.name}</div>
                      <div className="text-[11px] font-mono text-purple-700/70 mt-0.5">
                        รหัสผ่าน: <span className="font-bold text-purple-900">{admin.passcode}</span> • สร้างเมื่อ: {admin.createdAt}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubAdmin(admin.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="ลบแอดมินรองท่านนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 4: DAILY ==================== */}
      {activeTab === 'daily' && (
        <div className="bg-white rounded-3xl border border-purple-100 overflow-hidden shadow-sm">
          <div className="p-3.5 border-b border-purple-100 bg-purple-50/50 font-bold text-xs text-purple-950">
            สรุปรายวัน ({dailySummaries.length} วัน)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-purple-100/50 text-purple-950 font-bold border-b border-purple-200">
                  <th className="py-2.5 px-3">วันที่</th>
                  <th className="py-2.5 px-3 text-center">เวลาล่าสุด</th>
                  <th className="py-2.5 px-3 text-center">มา</th>
                  <th className="py-2.5 px-3 text-center">ขาด</th>
                  <th className="py-2.5 px-3 text-center">ลา</th>
                  <th className="py-2.5 px-3 text-right">อัตรามา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {dailySummaries.map((d) => (
                  <tr key={d.date} className="hover:bg-purple-50/40">
                    <td className="py-2.5 px-3 font-bold text-purple-950">{d.date}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-[11px] text-purple-700">{d.lastRecordedTime}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-600">{d.present}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-rose-600">{d.absent}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-amber-600">{d.leave}</td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-purple-800">{d.rate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 5: MONTHLY ==================== */}
      {activeTab === 'monthly' && (
        <div className="bg-white rounded-3xl border border-purple-100 overflow-hidden shadow-sm">
          <div className="p-3.5 border-b border-purple-100 bg-purple-50/50 font-bold text-xs text-purple-950">
            สรุปรายเดือน ({monthlySummaries.length} เดือน)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-purple-100/50 text-purple-950 font-bold border-b border-purple-200">
                  <th className="py-2.5 px-3">เดือน</th>
                  <th className="py-2.5 px-3 text-center">วันที่จัด</th>
                  <th className="py-2.5 px-3 text-center">มา</th>
                  <th className="py-2.5 px-3 text-center">ขาด</th>
                  <th className="py-2.5 px-3 text-right">อัตรามา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {monthlySummaries.map((m) => (
                  <tr key={m.month} className="hover:bg-purple-50/40">
                    <td className="py-2.5 px-3 font-bold text-purple-950">{m.month}</td>
                    <td className="py-2.5 px-3 text-center">{m.sessionsCount} วัน</td>
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-600">{m.present}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-rose-600">{m.absent}</td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-purple-800">{m.rate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 6: TEACHER ==================== */}
      {activeTab === 'teacher' && (
        <div className="bg-white rounded-3xl border border-purple-100 overflow-hidden shadow-sm">
          <div className="p-3.5 border-b border-purple-100 bg-purple-50/50 font-bold text-xs text-purple-950">
            สรุปรายอาจารย์ ({teacherSummaries.length} ท่าน)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-purple-100/50 text-purple-950 font-bold border-b border-purple-200">
                  <th className="py-2.5 px-3">อาจารย์</th>
                  <th className="py-2.5 px-3">กลุ่ม</th>
                  <th className="py-2.5 px-3 text-center">นศ.</th>
                  <th className="py-2.5 px-3 text-center">มา</th>
                  <th className="py-2.5 px-3 text-center">ขาด</th>
                  <th className="py-2.5 px-3 text-right">อัตราเข้า</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {teacherSummaries.map((t) => (
                  <tr key={t.teacherName} className="hover:bg-purple-50/40">
                    <td className="py-2.5 px-3 font-bold text-purple-950">{t.teacherName}</td>
                    <td className="py-2.5 px-3 text-purple-800/80">{t.groupName}</td>
                    <td className="py-2.5 px-3 text-center font-semibold">{t.studentCount}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-600">{t.totalPresent}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-rose-600">{t.totalAbsent}</td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-purple-800">{t.overallRate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 7: STUDENT ==================== */}
      {activeTab === 'student' && (
        <div className="bg-white rounded-3xl border border-purple-100 overflow-hidden shadow-sm">
          <div className="p-3.5 border-b border-purple-100 bg-purple-50/50 font-bold text-xs text-purple-950">
            สรุปรายนักศึกษา ({studentSummaries.length} คน)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-purple-100/50 text-purple-950 font-bold border-b border-purple-200">
                  <th className="py-2.5 px-3">รหัส</th>
                  <th className="py-2.5 px-3">ชื่อ - นามสกุล</th>
                  <th className="py-2.5 px-3">กลุ่ม</th>
                  <th className="py-2.5 px-3 text-center">มา</th>
                  <th className="py-2.5 px-3 text-center">ขาด</th>
                  <th className="py-2.5 px-3 text-right">อัตรามา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {studentSummaries.slice(0, 100).map((st) => (
                  <tr key={st.studentId} className="hover:bg-purple-50/40">
                    <td className="py-2.5 px-3 font-mono font-medium text-purple-950">{st.studentId}</td>
                    <td className="py-2.5 px-3 font-bold text-purple-950">{st.fullName}</td>
                    <td className="py-2.5 px-3 text-purple-800/80">{st.groupName}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-600">{st.presentDays}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-rose-600">{st.absentDays}</td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-purple-800">{st.attendanceRate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 8: RAW LOG WITH REAL-TIME CLOCK ==================== */}
      {activeTab === 'raw' && (
        <div className="bg-white rounded-3xl border border-purple-100 overflow-hidden shadow-sm">
          <div className="p-3.5 border-b border-purple-100 bg-purple-50/50 font-bold text-xs text-purple-950">
            บันทึกการเช็คชื่อพร้อมเวลา Real-time ({filteredRecords.length} รายการ)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-purple-100/50 text-purple-950 font-bold border-b border-purple-200">
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
                    <td className="py-2 px-3 text-center font-mono text-[11px] text-purple-700 font-bold">{r.recordedTime || '-'}</td>
                    <td className="py-2 px-3 font-mono">{r.studentId}</td>
                    <td className="py-2 px-3 font-bold text-purple-950">{r.studentName}</td>
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
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
