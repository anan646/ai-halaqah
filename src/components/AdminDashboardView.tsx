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
  Download,
  Search,
  Filter,
  ArrowUpDown,
  TrendingUp,
  Clock,
  Layers,
  Sparkles,
  ChevronRight,
  PieChart,
  User
} from 'lucide-react';
import { AttendanceRecord, TeacherSummary, StudentSummary, DailySummary } from '@/lib/types';
import { INITIAL_TEACHERS, INITIAL_STUDENTS } from '@/lib/students-data';
import { exportToExcel, exportToWord, downloadPdfReport, printReport } from '@/lib/export-utils';

interface AdminDashboardViewProps {
  records: AttendanceRecord[];
}

type TabType = 'overview' | 'drilldown' | 'daily' | 'monthly' | 'teacher' | 'student' | 'raw';

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ records }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'ทั้งหมด' | 'ชาย' | 'หญิง'>('ทั้งหมด');
  const [yearFilter, setYearFilter] = useState<string>('ทั้งหมด');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>('ทั้งหมด');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Drill-down inspector state
  const [inspectorTeacher, setInspectorTeacher] = useState<string>(INITIAL_TEACHERS[0]?.name || '');
  const [inspectorStudentId, setInspectorStudentId] = useState<string>('');

  // 1. Filtered records
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

      // Find latest time
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

  // Year level stats for graphics
  const yearLevelStats = useMemo(() => {
    const levels = ['ปี 2', 'ปี 3', 'ปี 4'];
    return levels.map((lvl) => {
      const recs = filteredRecords.filter((r) => r.yearLevel === lvl);
      const total = recs.length;
      const present = recs.filter((r) => r.status === 'มา').length;
      const rate = total > 0 ? (present / total) * 100 : 0;
      return { level: lvl, total, present, rate };
    });
  }, [filteredRecords]);

  // Drill-down data
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
    <div className="space-y-6 pb-12">
      {/* Top Header & Separated Export Action Toolbar */}
      <div className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-7 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full font-bold border border-purple-200">
              ADMIN DASHBOARD
            </span>
            <span className="text-purple-300 text-xs">•</span>
            <span className="text-xs text-purple-700/70">
              นักศึกษาในระบบ {INITIAL_STUDENTS.length} คน (40 กลุ่ม)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-purple-950 mt-1 tracking-tight">
            แดชบอร์ดสรุปผลและรายงานเชิงสถิติ
          </h1>
          <p className="text-xs text-purple-800/60 mt-0.5">
            ติดตามการเข้าเรียน วิเคราะห์ข้อมูลเชิงสถิติ และส่งออกรายงานแยกเป็น Excel, Word, PDF หรือสั่งพิมพ์
          </p>
        </div>

        {/* 4 Separated Export Buttons */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {/* 1. Excel */}
          <button
            onClick={() => exportToExcel(filteredRecords, teacherSummaries, studentSummaries, 'แดชบอร์ดสรุปผล')}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-2xl shadow-sm transition-all"
            title="ดาวน์โหลดสมุดงาน Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel (.xlsx)</span>
          </button>

          {/* 2. Word */}
          <button
            onClick={() => exportToWord(filteredRecords, teacherSummaries, 'แดชบอร์ดสรุปผล')}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-2xl shadow-sm transition-all"
            title="ดาวน์โหลดเอกสาร Word (.docx)"
          >
            <FileText className="w-4 h-4" />
            <span>Word (.docx)</span>
          </button>

          {/* 3. Download PDF (Separated) */}
          <button
            onClick={() => downloadPdfReport(filteredRecords, teacherSummaries, 'แดชบอร์ดสรุปผล')}
            className="flex items-center space-x-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-2xl shadow-sm transition-all"
            title="ดาวน์โหลดไฟล์รายงาน PDF"
          >
            <Download className="w-4 h-4" />
            <span>ดาวน์โหลด PDF</span>
          </button>

          {/* 4. Browser Print (Separated) */}
          <button
            onClick={() => printReport()}
            className="flex items-center space-x-1.5 bg-gray-800 hover:bg-black text-white text-xs font-bold px-3.5 py-2.5 rounded-2xl shadow-sm transition-all"
            title="เปิดหน้าต่างพิมพ์รายงาน"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์รายงาน</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Soothing Purple & Clean Accents) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-700 text-xs font-bold">
            <span>อัตราการเข้าร่วมภาพรวม</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-purple-950">{kpi.rate.toFixed(1)}%</span>
            <div className="mt-2 text-xs text-purple-800/70 flex items-center gap-1.5">
              <span className="font-bold text-emerald-600">มา {kpi.present}</span>
              <span>/ ขาด {kpi.absent}</span>
              <span>/ ลา {kpi.leave}</span>
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-700 text-xs font-bold">
            <span>จำนวนบันทึกเช็คชื่อ</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-purple-950">{kpi.totalRecords.toLocaleString()}</span>
            <p className="mt-2 text-xs text-purple-800/60">
              คน-ครั้ง (จาก {kpi.distinctDates} วันที่เช็คชื่อ)
            </p>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-700 text-xs font-bold">
            <span>นักศึกษาในระบบ</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-purple-950">{kpi.totalRegisteredStudents}</span>
            <p className="mt-2 text-xs text-purple-800/60">
              ชาย 109 คน / หญิง 405 คน
            </p>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-700 text-xs font-bold">
            <span>อาจารย์และกลุ่มดูแล</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-purple-950">{kpi.totalRegisteredTeachers}</span>
            <p className="mt-2 text-xs text-purple-800/60">
              40 กลุ่มศึกษาอัลกุรอานย่อย
            </p>
          </div>
        </div>
      </div>

      {/* Multi-Dimensional Filter Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-purple-100 shadow-sm space-y-3 print:hidden">
        <div className="flex items-center space-x-2 text-xs font-bold text-purple-950">
          <Filter className="w-3.5 h-3.5 text-purple-600" />
          <span>ตัวกรองการวิเคราะห์ข้อมูลสรุปผล</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-purple-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหารหัส, ชื่อ นศ., อาจารย์..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-purple-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-purple-50/40 text-purple-950 placeholder-purple-300"
            />
          </div>

          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value as any)}
            className="w-full px-3 py-2 text-xs border border-purple-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-purple-50/40 text-purple-900"
          >
            <option value="ทั้งหมด">เพศ: ทั้งหมด</option>
            <option value="ชาย">เพศ: ชาย (109 คน)</option>
            <option value="หญิง">เพศ: หญิง (405 คน)</option>
          </select>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-purple-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-purple-50/40 text-purple-900"
          >
            <option value="ทั้งหมด">ชั้นปี: ทั้งหมด</option>
            <option value="ปี 2">ชั้นปีที่ 2</option>
            <option value="ปี 3">ชั้นปีที่ 3</option>
            <option value="ปี 4">ชั้นปีที่ 4</option>
          </select>

          <select
            value={selectedTeacherFilter}
            onChange={(e) => setSelectedTeacherFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-purple-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-purple-50/40 text-purple-900"
          >
            <option value="ทั้งหมด">อาจารย์: ทั้งหมด ({INITIAL_TEACHERS.length} ท่าน)</option>
            {INITIAL_TEACHERS.map((t) => (
              <option key={t.groupId} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setSearchQuery('');
              setGenderFilter('ทั้งหมด');
              setYearFilter('ทั้งหมด');
              setSelectedTeacherFilter('ทั้งหมด');
              setStartDate('');
              setEndDate('');
            }}
            className="w-full py-2 text-xs font-bold text-purple-800 hover:text-purple-950 bg-purple-100 hover:bg-purple-200 rounded-2xl transition-colors"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-purple-100 space-x-1 sm:space-x-3 overflow-x-auto print:hidden">
        {[
          { id: 'overview', label: '📊 กราฟและภาพรวม' },
          { id: 'drilldown', label: '🔍 เจาะลึกอาจารย์-นศ.' },
          { id: 'daily', label: '📅 สรุปรายวัน' },
          { id: 'monthly', label: '📆 สรุปรายเดือน' },
          { id: 'teacher', label: '🎓 สรุปรายอาจารย์' },
          { id: 'student', label: '👤 สรุปรายนักศึกษา' },
          { id: 'raw', label: '📋 บันทึกเวลาเช็คชื่อทั้งหมด' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`py-3 px-3.5 border-b-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
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
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Visual Chart 1: Status Distribution */}
            <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-purple-950 text-sm mb-1 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-purple-600" />
                  <span>สัดส่วนสถานะการเข้าร่วม</span>
                </h3>
                <p className="text-xs text-purple-800/60 mb-4">แสดงเปอร์เซ็นต์ มา ขาด ลา ทั้งหมด</p>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-emerald-700">มา ({kpi.present} ครั้ง)</span>
                      <span className="text-emerald-700">{kpi.rate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-purple-50 h-3 rounded-full overflow-hidden border border-purple-100">
                      <div style={{ width: `${kpi.rate}%` }} className="bg-emerald-500 h-full rounded-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-rose-700">ขาด ({kpi.absent} ครั้ง)</span>
                      <span className="text-rose-700">
                        {kpi.totalRecords > 0 ? ((kpi.absent / kpi.totalRecords) * 100).toFixed(1) : '0'}%
                      </span>
                    </div>
                    <div className="w-full bg-purple-50 h-3 rounded-full overflow-hidden border border-purple-100">
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
                        {kpi.totalRecords > 0 ? ((kpi.leave / kpi.totalRecords) * 100).toFixed(1) : '0'}%
                      </span>
                    </div>
                    <div className="w-full bg-purple-50 h-3 rounded-full overflow-hidden border border-purple-100">
                      <div
                        style={{ width: `${kpi.totalRecords > 0 ? (kpi.leave / kpi.totalRecords) * 100 : 0}%` }}
                        className="bg-amber-400 h-full rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-purple-50 text-xs text-purple-700/70">
                รวมทั้งหมด {kpi.totalRecords.toLocaleString()} คน-ครั้ง
              </div>
            </div>

            {/* Visual Chart 2: Year Level Comparison */}
            <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-purple-950 text-sm mb-1 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  <span>เปรียบเทียบอัตราการเข้าตามชั้นปี</span>
                </h3>
                <p className="text-xs text-purple-800/60 mb-4">ชั้นปีที่ 2, 3 และ 4</p>

                <div className="space-y-4">
                  {yearLevelStats.map((item) => (
                    <div key={item.level}>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-purple-950">ชั้น{item.level}</span>
                        <span className="text-purple-700">{item.rate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-purple-50 h-3 rounded-full overflow-hidden border border-purple-100">
                        <div
                          style={{ width: `${item.rate}%` }}
                          className="bg-gradient-to-r from-purple-600 to-indigo-500 h-full rounded-full"
                        />
                      </div>
                      <span className="text-[10px] text-purple-800/50 mt-0.5 block">
                        มา {item.present} จาก {item.total} ครั้ง
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-purple-50 text-xs text-purple-700/70">
                วิเคราะห์แยกตามชั้นปีการศึกษา
              </div>
            </div>

            {/* Chart 3: Top Performing Groups */}
            <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-purple-950 text-sm mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>5 อันดับกลุ่มที่มีอัตราการเข้าสูงสุด</span>
                </h3>
                <p className="text-xs text-purple-800/60 mb-3">กลุ่มที่มีความสม่ำเสมอในการเข้าร่วม</p>

                <div className="space-y-2.5">
                  {teacherSummaries.slice(0, 5).map((t, idx) => (
                    <div key={t.teacherName} className="p-2.5 bg-purple-50/50 rounded-2xl border border-purple-100/60 flex items-center justify-between text-xs">
                      <div className="pr-2">
                        <span className="font-bold text-purple-950">{idx + 1}. {t.groupName}</span>
                        <p className="text-purple-800/60 text-[11px] truncate max-w-[150px]">{t.teacherName}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-purple-800 text-sm">{t.overallRate.toFixed(1)}%</span>
                        <p className="text-[10px] text-emerald-600 font-semibold">มา {t.totalPresent} ครั้ง</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-purple-50 text-xs text-purple-700/70">
                สามารถดูรายชื่อทั้งหมดได้ที่แท็บ &ldquo;สรุปรายอาจารย์&rdquo;
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: DRILL-DOWN INSPECTOR ==================== */}
      {activeTab === 'drilldown' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm">
            <h3 className="font-bold text-purple-950 text-base mb-1 flex items-center gap-2">
              <Search className="w-5 h-5 text-purple-700" />
              <span>เครื่องมือสำรวจเจาะลึก: เลือกอาจารย์ &gt; ดูนักศึกษาในกลุ่ม &gt; ดูประวัติและเวลาจริง</span>
            </h3>
            <p className="text-xs text-purple-800/60 mb-5">
              ช่วยให้แอดมินค้นหาและตรวจสอบนักศึกษาแต่ละคนภายใต้อาจารย์ผู้รับผิดชอบได้อย่างสะดวกรวดเร็ว
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Step 1: Select Teacher */}
              <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200">
                <label className="block text-xs font-bold text-purple-950 mb-2 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-purple-700" />
                  <span>1. เลือกอาจารย์ผู้รับผิดชอบ</span>
                </label>
                <select
                  value={inspectorTeacher}
                  onChange={(e) => {
                    setInspectorTeacher(e.target.value);
                    setInspectorStudentId('');
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold bg-white border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-purple-950"
                >
                  {INITIAL_TEACHERS.map((t) => (
                    <option key={t.groupId} value={t.name}>
                      {t.name} ({t.groupName})
                    </option>
                  ))}
                </select>

                <div className="mt-3 text-xs text-purple-800/80">
                  <span>กลุ่ม: <strong>{INITIAL_TEACHERS.find(t => t.name === inspectorTeacher)?.groupName}</strong></span>
                  <span className="mx-2">•</span>
                  <span>นักศึกษาในกลุ่ม: <strong>{inspectorStudents.length} คน</strong></span>
                </div>
              </div>

              {/* Step 2: Select Student in this group */}
              <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200">
                <label className="block text-xs font-bold text-purple-950 mb-2 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-purple-700" />
                  <span>2. เลือกนักศึกษาในกลุ่มนี้ ({inspectorStudents.length} คน)</span>
                </label>
                <select
                  value={inspectorStudentId}
                  onChange={(e) => setInspectorStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-white border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-purple-950"
                >
                  <option value="">-- กรุณาเลือกนักศึกษา --</option>
                  {inspectorStudents.map((s) => (
                    <option key={s.studentId} value={s.studentId}>
                      {s.studentId} - {s.fullName}
                    </option>
                  ))}
                </select>

                <div className="mt-3 text-xs text-purple-800/80">
                  {inspectorStudentId ? (
                    <span>รหัสนักศึกษา: <strong>{inspectorStudentId}</strong></span>
                  ) : (
                    <span>กรุณาเลือกนักศึกษาเพื่อดูประวัติและเวลาการเช็คชื่อ</span>
                  )}
                </div>
              </div>
            </div>

            {/* Results for Inspector */}
            {inspectorStudentId && (
              <div className="mt-6 pt-5 border-t border-purple-100">
                <h4 className="font-bold text-purple-950 text-sm mb-3">
                  ประวัติการเช็คชื่อของนักศึกษา: {inspectorStudents.find(s => s.studentId === inspectorStudentId)?.fullName} ({inspectorStudentId})
                </h4>

                {inspectorStudentRecords.length === 0 ? (
                  <p className="text-xs text-purple-400 py-4 text-center">ยังไม่มีประวัติการเช็คชื่อสำหรับนักศึกษาคนนี้</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-purple-100/60 text-purple-900 font-bold border-b border-purple-200">
                          <th className="py-2.5 px-4">วันที่ (Date)</th>
                          <th className="py-2.5 px-4 text-center">เวลาบันทึก (Real-time Clock)</th>
                          <th className="py-2.5 px-4 text-center">สถานะ</th>
                          <th className="py-2.5 px-4">อาจารย์ผู้เช็ค</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-50">
                        {inspectorStudentRecords.map((r, i) => (
                          <tr key={i} className="hover:bg-purple-50/40">
                            <td className="py-2.5 px-4 font-mono font-medium text-purple-950">{r.date}</td>
                            <td className="py-2.5 px-4 text-center font-mono text-purple-800">
                              <span className="inline-flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100">
                                <Clock className="w-3 h-3 text-purple-600" />
                                <span>{r.recordedTime || '-'}</span>
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <span className={`px-2.5 py-1 rounded-full font-bold ${
                                r.status === 'มา' ? 'bg-emerald-100 text-emerald-800' : r.status === 'ขาด' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {r.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-purple-900">{r.teacherName}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 3: DAILY SUMMARY ==================== */}
      {activeTab === 'daily' && (
        <div className="bg-white rounded-3xl border border-purple-100 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-purple-100 bg-purple-50/50 flex items-center justify-between">
            <h3 className="font-bold text-purple-950 text-sm">สรุปสถิติรายวัน ({dailySummaries.length} วัน)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-purple-100/50 text-purple-900 font-bold border-b border-purple-200">
                  <th className="py-3 px-4">วันที่</th>
                  <th className="py-3 px-4 text-center">เวลาบันทึกล่าสุด</th>
                  <th className="py-3 px-4 text-center">มา (คน)</th>
                  <th className="py-3 px-4 text-center">ขาด (คน)</th>
                  <th className="py-3 px-4 text-center">ลา (คน)</th>
                  <th className="py-3 px-4 text-center">รวมที่เช็ค (คน)</th>
                  <th className="py-3 px-4 text-right">อัตราการมา (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {dailySummaries.map((d) => (
                  <tr key={d.date} className="hover:bg-purple-50/40">
                    <td className="py-3 px-4 font-bold text-purple-950 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-purple-600" />
                      <span>{d.date}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-purple-700">{d.lastRecordedTime}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">{d.present}</td>
                    <td className="py-3 px-4 text-center font-bold text-rose-600">{d.absent}</td>
                    <td className="py-3 px-4 text-center font-bold text-amber-600">{d.leave}</td>
                    <td className="py-3 px-4 text-center font-semibold text-purple-900">{d.total}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold ${
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

      {/* ==================== TAB 4: MONTHLY SUMMARY ==================== */}
      {activeTab === 'monthly' && (
        <div className="bg-white rounded-3xl border border-purple-100 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-purple-100 bg-purple-50/50 flex items-center justify-between">
            <h3 className="font-bold text-purple-950 text-sm">สรุปสถิติรายเดือน ({monthlySummaries.length} เดือน)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-purple-100/50 text-purple-900 font-bold border-b border-purple-200">
                  <th className="py-3 px-4">เดือน / ปี</th>
                  <th className="py-3 px-4 text-center">จำนวนวันที่จัดหะละเกาะห์</th>
                  <th className="py-3 px-4 text-center">มา (คน-ครั้ง)</th>
                  <th className="py-3 px-4 text-center">ขาด (คน-ครั้ง)</th>
                  <th className="py-3 px-4 text-center">ลา (คน-ครั้ง)</th>
                  <th className="py-3 px-4 text-center">รวม (คน-ครั้ง)</th>
                  <th className="py-3 px-4 text-right">อัตราการมา (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {monthlySummaries.map((m) => (
                  <tr key={m.month} className="hover:bg-purple-50/40">
                    <td className="py-3 px-4 font-bold text-purple-950">{m.month}</td>
                    <td className="py-3 px-4 text-center font-medium text-purple-800">{m.sessionsCount} วัน</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">{m.present}</td>
                    <td className="py-3 px-4 text-center font-bold text-rose-600">{m.absent}</td>
                    <td className="py-3 px-4 text-center font-bold text-amber-600">{m.leave}</td>
                    <td className="py-3 px-4 text-center font-semibold text-purple-900">{m.total}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold ${
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

      {/* ==================== TAB 5: SUMMARY BY TEACHER ==================== */}
      {activeTab === 'teacher' && (
        <div className="bg-white rounded-3xl border border-purple-100 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-purple-100 bg-purple-50/50 flex items-center justify-between">
            <h3 className="font-bold text-purple-950 text-sm">สรุปสถิติรายอาจารย์และกลุ่ม ({teacherSummaries.length} ท่าน)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-purple-100/50 text-purple-900 font-bold border-b border-purple-200">
                  <th className="py-3 px-4 w-10 text-center">#</th>
                  <th className="py-3 px-4">อาจารย์ผู้รับผิดชอบ</th>
                  <th className="py-3 px-4">กลุ่ม / ชั้นปี</th>
                  <th className="py-3 px-4 text-center">จำนวน นศ.</th>
                  <th className="py-3 px-4 text-center">วันที่เช็ค</th>
                  <th className="py-3 px-4 text-center">มา</th>
                  <th className="py-3 px-4 text-center">ขาด</th>
                  <th className="py-3 px-4 text-center">ลา</th>
                  <th className="py-3 px-4 text-center">เวลาเช็คล่าสุด</th>
                  <th className="py-3 px-4 text-right">อัตราการเข้า (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {teacherSummaries.map((t, idx) => (
                  <tr key={t.teacherName} className="hover:bg-purple-50/40">
                    <td className="py-3 px-4 text-center text-purple-400 font-medium">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-purple-950">{t.teacherName}</td>
                    <td className="py-3 px-4 text-purple-800/80">{t.groupName} ({t.gender})</td>
                    <td className="py-3 px-4 text-center font-semibold text-purple-900">{t.studentCount} คน</td>
                    <td className="py-3 px-4 text-center">{t.checkedDatesCount} วัน</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">{t.totalPresent}</td>
                    <td className="py-3 px-4 text-center font-bold text-rose-600">{t.totalAbsent}</td>
                    <td className="py-3 px-4 text-center font-bold text-amber-600">{t.totalLeave}</td>
                    <td className="py-3 px-4 text-center font-mono text-[11px] text-purple-700">{t.lastCheckedTime}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold ${
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

      {/* ==================== TAB 6: SUMMARY BY STUDENT ==================== */}
      {activeTab === 'student' && (
        <div className="bg-white rounded-3xl border border-purple-100 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-purple-100 bg-purple-50/50 flex items-center justify-between">
            <h3 className="font-bold text-purple-950 text-sm">สรุปสถิติรายนักศึกษา ({studentSummaries.length} คน)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-purple-100/50 text-purple-900 font-bold border-b border-purple-200">
                  <th className="py-3 px-4 w-10 text-center">#</th>
                  <th className="py-3 px-4">รหัสนักศึกษา</th>
                  <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                  <th className="py-3 px-4">กลุ่ม / อาจารย์</th>
                  <th className="py-3 px-4 text-center">เช็คชื่อ</th>
                  <th className="py-3 px-4 text-center">มา</th>
                  <th className="py-3 px-4 text-center">ขาด</th>
                  <th className="py-3 px-4 text-center">ลา</th>
                  <th className="py-3 px-4 text-center">บันทึกล่าสุด</th>
                  <th className="py-3 px-4 text-right">อัตราการมา (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {studentSummaries.slice(0, 100).map((st, idx) => (
                  <tr key={st.studentId} className="hover:bg-purple-50/40">
                    <td className="py-2.5 px-4 text-center text-purple-400">{idx + 1}</td>
                    <td className="py-2.5 px-4 font-mono font-medium text-purple-950">{st.studentId}</td>
                    <td className="py-2.5 px-4 font-bold text-purple-950">{st.fullName}</td>
                    <td className="py-2.5 px-4 text-purple-800/80">
                      <div>{st.groupName}</div>
                      <div className="text-[10px] text-purple-600">{st.teacherName}</div>
                    </td>
                    <td className="py-2.5 px-4 text-center font-medium text-purple-900">{st.totalDays} ครั้ง</td>
                    <td className="py-2.5 px-4 text-center font-bold text-emerald-600">{st.presentDays}</td>
                    <td className="py-2.5 px-4 text-center font-bold text-rose-600">{st.absentDays}</td>
                    <td className="py-2.5 px-4 text-center font-bold text-amber-600">{st.leaveDays}</td>
                    <td className="py-2.5 px-4 text-center font-mono text-[11px] text-purple-700">{st.lastRecordedTime}</td>
                    <td className="py-2.5 px-4 text-right">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold ${
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
            <div className="p-3 bg-purple-50 border-t border-purple-100 text-center text-xs text-purple-800/70">
              แสดง 100 รายการแรกจาก {studentSummaries.length} คน (กดส่งออก Excel เพื่อดูครบทั้งหมด)
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 7: ALL RECORDS WITH REAL-TIME CLOCK ==================== */}
      {activeTab === 'raw' && (
        <div className="bg-white rounded-3xl border border-purple-100 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-purple-100 bg-purple-50/50 flex items-center justify-between">
            <h3 className="font-bold text-purple-950 text-sm">
              ประวัติการเช็คชื่อทั้งหมดพร้อมเวลากำกับ Real-time ({filteredRecords.length} รายการ)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-purple-100/50 text-purple-900 font-bold border-b border-purple-200">
                  <th className="py-3 px-4">วันที่ (Date)</th>
                  <th className="py-3 px-4 text-center">เวลาบันทึกจริง (Real-time Clock)</th>
                  <th className="py-3 px-4">รหัสนักศึกษา</th>
                  <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                  <th className="py-3 px-4 text-center">สถานะ</th>
                  <th className="py-3 px-4">อาจารย์ผู้รับผิดชอบ</th>
                  <th className="py-3 px-4">กลุ่ม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {filteredRecords.slice(0, 150).map((r, idx) => (
                  <tr key={`${r.date}_${r.studentId}_${idx}`} className="hover:bg-purple-50/40">
                    <td className="py-2.5 px-4 font-mono font-medium text-purple-950">{r.date}</td>
                    <td className="py-2.5 px-4 text-center font-mono text-purple-800">
                      <span className="inline-flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100">
                        <Clock className="w-3 h-3 text-purple-500" />
                        <span>{r.recordedTime || '-'}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-purple-900">{r.studentId}</td>
                    <td className="py-2.5 px-4 font-bold text-purple-950">{r.studentName}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full font-bold ${
                        r.status === 'มา' ? 'bg-emerald-100 text-emerald-800' : r.status === 'ขาด' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-purple-800">{r.teacherName}</td>
                    <td className="py-2.5 px-4 text-purple-700/80">{r.groupName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredRecords.length > 150 && (
            <div className="p-3 bg-purple-50 border-t border-purple-100 text-center text-xs text-purple-800/70">
              แสดง 150 รายการแรกจาก {filteredRecords.length} รายการ
            </div>
          )}
        </div>
      )}
    </div>
  );
};
