'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Users,
  UserCheck,
  FileSpreadsheet,
  FileText,
  Printer,
  Search,
  Filter,
  ArrowUpDown,
  ChevronDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Layers
} from 'lucide-react';
import { AttendanceRecord, TeacherSummary, StudentSummary, DailySummary } from '@/lib/types';
import { INITIAL_TEACHERS, INITIAL_STUDENTS } from '@/lib/students-data';
import { exportToExcel, exportToWord, printPdfReport } from '@/lib/export-utils';

interface AdminDashboardViewProps {
  records: AttendanceRecord[];
}

type TabType = 'overview' | 'daily' | 'monthly' | 'teacher' | 'student' | 'raw';

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ records }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'ทั้งหมด' | 'ชาย' | 'หญิง'>('ทั้งหมด');
  const [yearFilter, setYearFilter] = useState<string>('ทั้งหมด');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>('ทั้งหมด');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // 1. Filtered raw records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchGender = genderFilter === 'ทั้งหมด' || r.gender === genderFilter;
      const matchYear = yearFilter === 'ทั้งหมด' || r.yearLevel === yearFilter;
      const matchTeacher = selectedTeacherFilter === 'ทั้งหมด' || r.teacherName === selectedTeacherFilter;
      const matchSearch =
        !searchQuery ||
        r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.studentId.includes(searchQuery) ||
        r.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.groupName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStart = !startDate || r.date >= startDate;
      const matchEnd = !endDate || r.date <= endDate;

      return matchGender && matchYear && matchTeacher && matchSearch && matchStart && matchEnd;
    });
  }, [records, genderFilter, yearFilter, selectedTeacherFilter, searchQuery, startDate, endDate]);

  // 2. High-level KPI Metrics
  const kpi = useMemo(() => {
    const totalRecords = filteredRecords.length;
    const present = filteredRecords.filter((r) => r.status === 'มา').length;
    const absent = filteredRecords.filter((r) => r.status === 'ขาด').length;
    const leave = filteredRecords.filter((r) => r.status === 'ลา').length;
    const rate = totalRecords > 0 ? (present / totalRecords) * 100 : 0;

    // Distinct dates
    const distinctDates = new Set(filteredRecords.map((r) => r.date)).size;
    // Distinct students present in records
    const distinctStudents = new Set(filteredRecords.map((r) => r.studentId)).size;

    return {
      totalRecords,
      present,
      absent,
      leave,
      rate,
      distinctDates,
      distinctStudents,
      totalRegisteredStudents: INITIAL_STUDENTS.length,
      totalRegisteredTeachers: INITIAL_TEACHERS.length,
    };
  }, [filteredRecords]);

  // 3. Daily Summary Table
  const dailySummaries = useMemo<DailySummary[]>(() => {
    const map = new Map<string, { present: number; absent: number; leave: number; total: number }>();
    filteredRecords.forEach((r) => {
      if (!map.has(r.date)) {
        map.set(r.date, { present: 0, absent: 0, leave: 0, total: 0 });
      }
      const item = map.get(r.date)!;
      item.total++;
      if (r.status === 'มา') item.present++;
      else if (r.status === 'ขาด') item.absent++;
      else if (r.status === 'ลา') item.leave++;
    });

    return Array.from(map.entries())
      .map(([date, st]) => ({
        date,
        ...st,
        rate: st.total > 0 ? (st.present / st.total) * 100 : 0,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredRecords]);

  // 4. Monthly Summary Table
  const monthlySummaries = useMemo(() => {
    const map = new Map<string, { present: number; absent: number; leave: number; total: number; dates: Set<string> }>();
    filteredRecords.forEach((r) => {
      const monthKey = r.date.slice(0, 7); // YYYY-MM
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

  // 5. Summary by Teacher
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
      };
    }).sort((a, b) => b.overallRate - a.overallRate);
  }, [filteredRecords]);

  // 6. Summary by Student
  const studentSummaries = useMemo<StudentSummary[]>(() => {
    const studentRecMap = new Map<string, AttendanceRecord[]>();
    filteredRecords.forEach((r) => {
      if (!studentRecMap.has(r.studentId)) {
        studentRecMap.set(r.studentId, []);
      }
      studentRecMap.get(r.studentId)!.push(r);
    });

    // Match with registered students
    const sourceStudents = INITIAL_STUDENTS.filter((st) => {
      const matchGender = genderFilter === 'ทั้งหมด' || st.gender === genderFilter;
      const matchYear = yearFilter === 'ทั้งหมด' || st.yearLevel === yearFilter;
      const matchTeacher = selectedTeacherFilter === 'ทั้งหมด' || st.teacherName === selectedTeacherFilter;
      const matchSearch =
        !searchQuery ||
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
      };
    }).sort((a, b) => b.attendanceRate - a.attendanceRate);
  }, [filteredRecords, genderFilter, yearFilter, selectedTeacherFilter, searchQuery]);

  // Export handlers
  const handleExportExcel = () => {
    exportToExcel(filteredRecords, teacherSummaries, studentSummaries, 'แดชบอร์ดสรุปผล');
  };

  const handleExportWord = () => {
    exportToWord(filteredRecords, teacherSummaries, 'แดชบอร์ดสรุปผล');
  };

  const handlePrintPdf = () => {
    printPdfReport();
  };

  // Helper formatting month
  const formatMonthTitle = (mKey: string) => {
    const [y, m] = mKey.split('-');
    const months = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const monthName = months[parseInt(m, 10) - 1] || m;
    const buddhistYear = parseInt(y, 10) + 543;
    return `${monthName} ${buddhistYear}`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Export Buttons */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold">
              ADMIN DASHBOARD
            </span>
            <span className="text-gray-400 text-xs">•</span>
            <span className="text-xs text-gray-500">
              นักศึกษาในระบบทั้งหมด {INITIAL_STUDENTS.length} คน (40 กลุ่ม)
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            แดชบอร์ดและรายงานสรุปผลการเข้าร่วมหะละเกาะห์
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            วิเคราะห์ข้อมูล สถิติการมาเรียน ส่งออกไฟล์รายงานเป็น Excel, Word และ PDF
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel (.xlsx)</span>
          </button>
          <button
            onClick={handleExportWord}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-sm transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>Word (.docx)</span>
          </button>
          <button
            onClick={handlePrintPdf}
            className="flex items-center space-x-1.5 bg-gray-800 hover:bg-gray-900 active:bg-black text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์ / PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Overall Rate */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
            <span>อัตราการเข้าร่วมภาพรวม</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-gray-900">{kpi.rate.toFixed(1)}%</span>
            <div className="mt-2 text-xs text-gray-500 flex items-center gap-1.5">
              <span className="font-semibold text-emerald-600">มา {kpi.present}</span>
              <span>/ ขาด {kpi.absent}</span>
              <span>/ ลา {kpi.leave}</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Total Records */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
            <span>จำนวนบันทึกเช็คชื่อ</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-gray-900">
              {kpi.totalRecords.toLocaleString()}
            </span>
            <p className="mt-2 text-xs text-gray-500">
              คน-ครั้ง (จาก {kpi.distinctDates} วันที่เช็คชื่อ)
            </p>
          </div>
        </div>

        {/* KPI 3: Total Students */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
            <span>นักศึกษาในระบบ</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-gray-900">
              {kpi.totalRegisteredStudents}
            </span>
            <p className="mt-2 text-xs text-gray-500">
              ชาย 109 คน / หญิง 405 คน
            </p>
          </div>
        </div>

        {/* KPI 4: Teachers & Groups */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
            <span>อาจารย์ผู้รับผิดชอบ</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-gray-900">
              {kpi.totalRegisteredTeachers}
            </span>
            <p className="mt-2 text-xs text-gray-500">
              40 กลุ่มหะละเกาะห์ย่อย
            </p>
          </div>
        </div>
      </div>

      {/* Multi-Dimensional Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3 print:hidden">
        <div className="flex items-center space-x-2 text-xs font-bold text-gray-700">
          <Filter className="w-3.5 h-3.5 text-emerald-600" />
          <span>ตัวกรองการวิเคราะห์ข้อมูล</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหารหัส, ชื่อ นศ., อาจารย์..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50"
            />
          </div>

          {/* Gender Filter */}
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value as any)}
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 text-gray-700"
          >
            <option value="ทั้งหมด">เพศ: ทั้งหมด</option>
            <option value="ชาย">เพศ: ชาย (109 คน)</option>
            <option value="หญิง">เพศ: หญิง (405 คน)</option>
          </select>

          {/* Year Level Filter */}
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 text-gray-700"
          >
            <option value="ทั้งหมด">ชั้นปี: ทั้งหมด</option>
            <option value="ปี 2">ชั้นปีที่ 2</option>
            <option value="ปี 3">ชั้นปีที่ 3</option>
            <option value="ปี 4">ชั้นปีที่ 4</option>
          </select>

          {/* Teacher Filter */}
          <select
            value={selectedTeacherFilter}
            onChange={(e) => setSelectedTeacherFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 text-gray-700"
          >
            <option value="ทั้งหมด">อาจารย์: ทั้งหมด ({INITIAL_TEACHERS.length} ท่าน)</option>
            {INITIAL_TEACHERS.map((t) => (
              <option key={t.groupId} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Reset button */}
          <button
            onClick={() => {
              setSearchQuery('');
              setGenderFilter('ทั้งหมด');
              setYearFilter('ทั้งหมด');
              setSelectedTeacherFilter('ทั้งหมด');
              setStartDate('');
              setEndDate('');
            }}
            className="w-full py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      </div>

      {/* Tabs Switcher for Reports */}
      <div className="flex border-b border-gray-200 space-x-1 sm:space-x-4 overflow-x-auto print:hidden">
        {[
          { id: 'overview', label: '📊 ภาพรวม' },
          { id: 'daily', label: '📅 สรุปรายวัน' },
          { id: 'monthly', label: '📆 สรุปรายเดือน' },
          { id: 'teacher', label: '🎓 สรุปรายอาจารย์' },
          { id: 'student', label: '👤 สรุปรายนักศึกษา' },
          { id: 'raw', label: '📋 ประวัติเช็คชื่อทั้งหมด' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`py-3 px-3 border-b-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ==================== TAB 1: OVERVIEW ==================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top 5 Teachers & Low Attendance Alert */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Top performing groups */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>กลุ่มที่มีอัตราการเข้าร่วมสูงสุด</span>
              </h3>
              <div className="space-y-2.5">
                {teacherSummaries.slice(0, 5).map((t, idx) => (
                  <div key={t.teacherName} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl text-xs">
                    <div>
                      <span className="font-bold text-gray-800">{idx + 1}. {t.groupName}</span>
                      <p className="text-gray-500">{t.teacherName} ({t.studentCount} คน)</p>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-emerald-600 text-sm">{t.overallRate.toFixed(1)}%</span>
                      <p className="text-[10px] text-gray-400">มา {t.totalPresent} ครั้ง</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Attendance Status Distribution */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span>สัดส่วนการเข้าร่วมกิจกรรม</span>
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-emerald-700">มา ({kpi.present} คน-ครั้ง)</span>
                    <span className="text-emerald-700">{kpi.rate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${kpi.rate}%` }}
                      className="bg-emerald-500 h-full rounded-full"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-rose-700">
                      ขาด ({kpi.absent} คน-ครั้ง)
                    </span>
                    <span className="text-rose-700">
                      {kpi.totalRecords > 0 ? ((kpi.absent / kpi.totalRecords) * 100).toFixed(1) : '0'}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${kpi.totalRecords > 0 ? (kpi.absent / kpi.totalRecords) * 100 : 0}%` }}
                      className="bg-rose-500 h-full rounded-full"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-amber-700">
                      ลา ({kpi.leave} คน-ครั้ง)
                    </span>
                    <span className="text-amber-700">
                      {kpi.totalRecords > 0 ? ((kpi.leave / kpi.totalRecords) * 100).toFixed(1) : '0'}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${kpi.totalRecords > 0 ? (kpi.leave / kpi.totalRecords) * 100 : 0}%` }}
                      className="bg-amber-400 h-full rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: DAILY SUMMARY ==================== */}
      {activeTab === 'daily' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm">สรุปสถิติการเช็คชื่อรายวัน ({dailySummaries.length} วัน)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100/70 text-gray-600 font-semibold border-b border-gray-200">
                  <th className="py-3 px-4">วันที่</th>
                  <th className="py-3 px-4 text-center">มา (คน)</th>
                  <th className="py-3 px-4 text-center">ขาด (คน)</th>
                  <th className="py-3 px-4 text-center">ลา (คน)</th>
                  <th className="py-3 px-4 text-center">รวมที่เช็ค (คน)</th>
                  <th className="py-3 px-4 text-right">อัตราการมา (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dailySummaries.map((d) => (
                  <tr key={d.date} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-semibold text-gray-800 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{d.date}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">{d.present}</td>
                    <td className="py-3 px-4 text-center font-bold text-rose-600">{d.absent}</td>
                    <td className="py-3 px-4 text-center font-bold text-amber-600">{d.leave}</td>
                    <td className="py-3 px-4 text-center font-medium text-gray-700">{d.total}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`px-2 py-0.5 rounded-full font-bold ${
                        d.rate >= 80 ? 'bg-emerald-100 text-emerald-800' : d.rate >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {d.rate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: MONTHLY SUMMARY ==================== */}
      {activeTab === 'monthly' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm">สรุปสถิติการเช็คชื่อรายเดือน ({monthlySummaries.length} เดือน)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100/70 text-gray-600 font-semibold border-b border-gray-200">
                  <th className="py-3 px-4">เดือน / ปี</th>
                  <th className="py-3 px-4 text-center">จำนวนวันที่จัดหะละเกาะห์</th>
                  <th className="py-3 px-4 text-center">มา (คน-ครั้ง)</th>
                  <th className="py-3 px-4 text-center">ขาด (คน-ครั้ง)</th>
                  <th className="py-3 px-4 text-center">ลา (คน-ครั้ง)</th>
                  <th className="py-3 px-4 text-center">รวม (คน-ครั้ง)</th>
                  <th className="py-3 px-4 text-right">อัตราการมา (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {monthlySummaries.map((m) => (
                  <tr key={m.month} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-bold text-gray-800">
                      {formatMonthTitle(m.month)}
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-gray-600">{m.sessionsCount} วัน</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">{m.present}</td>
                    <td className="py-3 px-4 text-center font-bold text-rose-600">{m.absent}</td>
                    <td className="py-3 px-4 text-center font-bold text-amber-600">{m.leave}</td>
                    <td className="py-3 px-4 text-center font-medium text-gray-700">{m.total}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`px-2 py-0.5 rounded-full font-bold ${
                        m.rate >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {m.rate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 4: SUMMARY BY TEACHER ==================== */}
      {activeTab === 'teacher' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm">สรุปสถิติรายอาจารย์และกลุ่ม ({teacherSummaries.length} ท่าน)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100/70 text-gray-600 font-semibold border-b border-gray-200">
                  <th className="py-3 px-4 w-10 text-center">#</th>
                  <th className="py-3 px-4">อาจารย์ผู้รับผิดชอบ</th>
                  <th className="py-3 px-4">กลุ่ม / ชั้นปี</th>
                  <th className="py-3 px-4 text-center">จำนวน นศ.</th>
                  <th className="py-3 px-4 text-center">วันที่เช็ค</th>
                  <th className="py-3 px-4 text-center">มา</th>
                  <th className="py-3 px-4 text-center">ขาด</th>
                  <th className="py-3 px-4 text-center">ลา</th>
                  <th className="py-3 px-4 text-right">อัตราการเข้า (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {teacherSummaries.map((t, idx) => (
                  <tr key={t.teacherName} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-center text-gray-400 font-medium">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-gray-900">{t.teacherName}</td>
                    <td className="py-3 px-4 text-gray-600">{t.groupName} ({t.gender})</td>
                    <td className="py-3 px-4 text-center font-medium">{t.studentCount} คน</td>
                    <td className="py-3 px-4 text-center">{t.checkedDatesCount} วัน</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">{t.totalPresent}</td>
                    <td className="py-3 px-4 text-center font-bold text-rose-600">{t.totalAbsent}</td>
                    <td className="py-3 px-4 text-center font-bold text-amber-600">{t.totalLeave}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`px-2 py-0.5 rounded-full font-bold ${
                        t.overallRate >= 80 ? 'bg-emerald-100 text-emerald-800' : t.overallRate >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {t.overallRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 5: SUMMARY BY STUDENT ==================== */}
      {activeTab === 'student' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm">สรุปสถิติรายนักศึกษา ({studentSummaries.length} คน)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100/70 text-gray-600 font-semibold border-b border-gray-200">
                  <th className="py-3 px-4 w-10 text-center">#</th>
                  <th className="py-3 px-4">รหัสนักศึกษา</th>
                  <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                  <th className="py-3 px-4">กลุ่ม / อาจารย์</th>
                  <th className="py-3 px-4 text-center">เช็คชื่อ</th>
                  <th className="py-3 px-4 text-center">มา</th>
                  <th className="py-3 px-4 text-center">ขาด</th>
                  <th className="py-3 px-4 text-center">ลา</th>
                  <th className="py-3 px-4 text-right">อัตราการมา (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {studentSummaries.slice(0, 100).map((st, idx) => (
                  <tr key={st.studentId} className="hover:bg-gray-50">
                    <td className="py-2.5 px-4 text-center text-gray-400">{idx + 1}</td>
                    <td className="py-2.5 px-4 font-mono font-medium text-gray-700">{st.studentId}</td>
                    <td className="py-2.5 px-4 font-bold text-gray-900">{st.fullName}</td>
                    <td className="py-2.5 px-4 text-gray-500">
                      <div>{st.groupName}</div>
                      <div className="text-[10px] text-gray-400">{st.teacherName}</div>
                    </td>
                    <td className="py-2.5 px-4 text-center font-medium text-gray-600">{st.totalDays} ครั้ง</td>
                    <td className="py-2.5 px-4 text-center font-bold text-emerald-600">{st.presentDays}</td>
                    <td className="py-2.5 px-4 text-center font-bold text-rose-600">{st.absentDays}</td>
                    <td className="py-2.5 px-4 text-center font-bold text-amber-600">{st.leaveDays}</td>
                    <td className="py-2.5 px-4 text-right">
                      <span className={`px-2 py-0.5 rounded-full font-bold ${
                        st.attendanceRate >= 80 ? 'bg-emerald-100 text-emerald-800' : st.attendanceRate >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {st.attendanceRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {studentSummaries.length > 100 && (
            <div className="p-3 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-500">
              แสดง 100 รายการแรกจาก {studentSummaries.length} คน (สามารถส่งออก Excel เพื่อดูทั้งหมดได้)
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 6: RAW LOG ==================== */}
      {activeTab === 'raw' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm">ประวัติการเช็คชื่อทั้งหมด ({filteredRecords.length} รายการ)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100/70 text-gray-600 font-semibold border-b border-gray-200">
                  <th className="py-3 px-4">วันที่</th>
                  <th className="py-3 px-4">รหัสนักศึกษา</th>
                  <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                  <th className="py-3 px-4 text-center">สถานะ</th>
                  <th className="py-3 px-4">อาจารย์ผู้รับผิดชอบ</th>
                  <th className="py-3 px-4">กลุ่ม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRecords.slice(0, 100).map((r, idx) => (
                  <tr key={`${r.date}_${r.studentId}_${idx}`} className="hover:bg-gray-50">
                    <td className="py-2.5 px-4 font-mono text-gray-700">{r.date}</td>
                    <td className="py-2.5 px-4 font-mono font-medium">{r.studentId}</td>
                    <td className="py-2.5 px-4 font-bold text-gray-900">{r.studentName}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-bold ${
                        r.status === 'มา' ? 'bg-emerald-100 text-emerald-800' : r.status === 'ขาด' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-gray-600">{r.teacherName}</td>
                    <td className="py-2.5 px-4 text-gray-500">{r.groupName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredRecords.length > 100 && (
            <div className="p-3 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-500">
              แสดง 100 รายการแรกจาก {filteredRecords.length} รายการ
            </div>
          )}
        </div>
      )}
    </div>
  );
};
