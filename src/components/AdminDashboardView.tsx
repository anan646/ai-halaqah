'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Check,
  Move,
  Upload,
  Settings,
  TrendingUp,
  Award,
  ChevronRight,
  GripVertical,
  Megaphone,
  Bell,
  Lock,
  Key,
  Database as DatabaseIcon
} from 'lucide-react';
import { AttendanceRecord, TeacherSummary, StudentSummary, DailySummary, SubAdmin, Teacher, Student, Announcement } from '@/lib/types';
import {
  getActiveTeachers,
  getActiveStudents,
  moveStudentToTeacher,
  updateStudentInfo,
  updateTeacherInfo,
  resetToInitialData,
  getFacultyPassword,
  saveFacultyPassword,
  getAnnouncements,
  addAnnouncement,
  deleteAnnouncement,
} from '@/lib/data-store';
import { exportToExcel, exportToWord, downloadPdfReport, printReport } from '@/lib/export-utils';
import { getSubAdmins, addSubAdmin, deleteSubAdmin } from '@/lib/admin-auth';
import { setSavedLogo } from '@/lib/api-client';

interface AdminDashboardViewProps {
  records: AttendanceRecord[];
  adminUser?: { id: string; name: string; role: 'admin' | 'subadmin' };
  onLogout: () => void;
  onBackToLanding?: () => void;
  customLogo?: string;
  onLogoUpdated?: (newLogo: string) => void;
  onOpenSettings?: () => void;
  onBackupAll?: () => void;
  isBackingUp?: boolean;
}

type TabType = 'matrix' | 'analytics' | 'periodic' | 'transfer' | 'editor' | 'announcements' | 'system_management' | 'export';

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  records,
  adminUser,
  onLogout,
  onBackToLanding,
  customLogo,
  onLogoUpdated,
  onOpenSettings,
  onBackupAll,
  isBackingUp,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('matrix');

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

  // ==================== MATRIX VIEW STATE (ตามรูปแนบ 4) ====================
  const [matrixTeacherName, setMatrixTeacherName] = useState<string>('');
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);

  useEffect(() => {
    if (teachers.length > 0 && !matrixTeacherName) {
      setMatrixTeacherName(teachers[0].name);
    }
  }, [teachers, matrixTeacherName]);

  // ==================== PERIODIC FILTER STATE (วัน/เดือน/ปี ที่บันทึกจริง) ====================
  const [periodType, setPeriodType] = useState<'day' | 'month' | 'year'>('day');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('ทั้งหมด');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('ทั้งหมด');

  // ==================== DRAG & DROP TRANSFER STATE ====================
  const [dragSourceTeacher, setDragSourceTeacher] = useState<string>('');
  const [dragTargetTeacher, setDragTargetTeacher] = useState<string>('');
  const [draggedStudentId, setDraggedStudentId] = useState<string | null>(null);
  const [isDragOverTarget, setIsDragOverTarget] = useState(false);
  const [transferToast, setTransferToast] = useState<{ text: string; success: boolean } | null>(null);
  const [manualTransferSearch, setManualTransferSearch] = useState('');

  useEffect(() => {
    if (teachers.length >= 2) {
      if (!dragSourceTeacher) setDragSourceTeacher(teachers[0].name);
      if (!dragTargetTeacher) setDragTargetTeacher(teachers[1].name);
    }
  }, [teachers, dragSourceTeacher, dragTargetTeacher]);

  // ==================== EDIT MODAL STATE ====================
  const [editorSubTab, setEditorSubTab] = useState<'students' | 'teachers'>('students');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editorMsg, setEditorMsg] = useState<{ text: string; success: boolean } | null>(null);
  const [editorSearch, setEditorSearch] = useState('');

  // ==================== SUB-ADMINS STATE ====================
  const [subAdminsList, setSubAdminsList] = useState<SubAdmin[]>([]);
  const [newSubName, setNewSubName] = useState('');
  const [newSubPasscode, setNewSubPasscode] = useState('');
  const [subAdminMsg, setSubAdminMsg] = useState<{ text: string; success: boolean } | null>(null);

  useEffect(() => {
    setSubAdminsList(getSubAdmins());
  }, []);

  // Logo file input ref
  const logoInputRef = useRef<HTMLInputElement>(null);

  // ==================== ANNOUNCEMENTS STATE ====================
  const [announcementsList, setAnnouncementsList] = useState<Announcement[]>([]);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPriority, setAnnPriority] = useState<'normal' | 'urgent' | 'warning'>('normal');
  const [annTargetType, setAnnTargetType] = useState<'all' | 'specific'>('all');
  const [annTargetIdsStr, setAnnTargetIdsStr] = useState('');
  const [annToast, setAnnToast] = useState<{ text: string; success: boolean } | null>(null);

  useEffect(() => {
    setAnnouncementsList(getAnnouncements());
  }, []);

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;

    let targetIds: string[] = [];
    if (annTargetType === 'specific') {
      targetIds = annTargetIdsStr
        .split(/[,;\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (targetIds.length === 0) {
        setAnnToast({ text: 'กรุณาระบุรหัสนักศึกษาอย่างน้อย 1 รหัส', success: false });
        return;
      }
    }

    addAnnouncement({
      title: annTitle.trim(),
      content: annContent.trim(),
      priority: annPriority,
      targetType: annTargetType,
      targetStudentIds: targetIds,
      authorName: adminUser?.name || 'แอดมิน',
    });

    setAnnouncementsList(getAnnouncements());
    setAnnTitle('');
    setAnnContent('');
    setAnnTargetIdsStr('');
    setAnnToast({ text: 'โพสต์ประกาศส่งไปยังระบบนักศึกษาเรียบร้อยแล้ว!', success: true });
    setTimeout(() => setAnnToast(null), 4000);
  };

  const handleDeleteAnnouncement = (id: string) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบประกาศนี้?')) {
      deleteAnnouncement(id);
      setAnnouncementsList(getAnnouncements());
    }
  };

  // ==================== FACULTY PASSWORD STATE ====================
  const [facultyPass, setFacultyPass] = useState('');
  const [newFacultyPass, setNewFacultyPass] = useState('');
  const [facultyPassMsg, setFacultyPassMsg] = useState<{ text: string; success: boolean } | null>(null);

  useEffect(() => {
    setFacultyPass(getFacultyPassword());
  }, []);

  const handleSaveFacultyPass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFacultyPass.trim() || newFacultyPass.trim().length < 4) {
      setFacultyPassMsg({ text: 'รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร', success: false });
      return;
    }
    saveFacultyPassword(newFacultyPass.trim());
    setFacultyPass(newFacultyPass.trim());
    setNewFacultyPass('');
    setFacultyPassMsg({ text: 'บันทึกรหัสผ่านสำหรับบุคคลากรเรียบร้อยแล้ว', success: true });
    setTimeout(() => setFacultyPassMsg(null), 4000);
  };

  // Distinct recorded dates across all records
  const distinctRecordedDates = useMemo(() => {
    const dates = Array.from(new Set(records.map((r) => r.date))).filter(Boolean);
    return dates.sort((a, b) => b.localeCompare(a));
  }, [records]);

  // Distinct recorded months
  const distinctRecordedMonths = useMemo(() => {
    const months = Array.from(new Set(records.map((r) => r.date.slice(0, 7)))).filter(Boolean);
    return months.sort((a, b) => b.localeCompare(a));
  }, [records]);

  // Format date helper (Thai format)
  const formatThaiDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-');
      const thaiYear = parseInt(y, 10) + 543;
      const shortYear = thaiYear.toString().slice(-2);
      const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${shortYear}`;
    } catch {
      return dateStr;
    }
  };

  const formatThaiMonth = (monthKey: string) => {
    try {
      const [y, m] = monthKey.split('-');
      const thaiYear = parseInt(y, 10) + 543;
      const months = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ];
      return `${months[parseInt(m, 10) - 1]} ${thaiYear}`;
    } catch {
      return monthKey;
    }
  };

  // High-level KPI
  const kpi = useMemo(() => {
    const totalRecords = records.length;
    const present = records.filter((r) => r.status === 'มา').length;
    const absent = records.filter((r) => r.status === 'ขาด').length;
    const leave = records.filter((r) => r.status === 'ลา').length;
    const rate = totalRecords > 0 ? (present / totalRecords) * 100 : 0;
    const distinctDates = distinctRecordedDates.length;

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
  }, [records, students, teachers, distinctRecordedDates]);

  // Teacher Summaries
  const teacherSummaries = useMemo<TeacherSummary[]>(() => {
    return teachers.map((t) => {
      const teacherRecs = records.filter((r) => r.teacherName === t.name);
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
  }, [records, teachers, students]);

  // Student Summaries
  const studentSummaries = useMemo<StudentSummary[]>(() => {
    const map = new Map<string, AttendanceRecord[]>();
    records.forEach((r) => {
      if (!map.has(r.studentId)) map.set(r.studentId, []);
      map.get(r.studentId)!.push(r);
    });

    return students.map((st) => {
      const recs = map.get(st.studentId) || [];
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
  }, [records, students]);

  // ==================== MATRIX VIEW DATA (MATCHING IMAGE 3) ====================
  const matrixCurrentTeacher = useMemo(() => {
    return teachers.find((t) => t.name === matrixTeacherName) || teachers[0];
  }, [matrixTeacherName, teachers]);

  const matrixStudents = useMemo(() => {
    if (!matrixCurrentTeacher) return [];
    return students.filter((s) => s.teacherName === matrixCurrentTeacher.name);
  }, [matrixCurrentTeacher, students]);

  // Distinct recorded dates for this teacher's group
  const matrixTeacherDates = useMemo(() => {
    if (!matrixCurrentTeacher) return [];
    const dates = Array.from(
      new Set(records.filter((r) => r.teacherName === matrixCurrentTeacher.name).map((r) => r.date))
    );
    return dates.sort((a, b) => a.localeCompare(b)); // chronological
  }, [matrixCurrentTeacher, records]);

  // Drag and drop handlers
  const handleDropStudent = (targetTeacher: string) => {
    if (!draggedStudentId || !targetTeacher) return;
    const res = moveStudentToTeacher(draggedStudentId, targetTeacher);
    setTransferToast({ text: res.message, success: res.success });
    setIsDragOverTarget(false);
    setDraggedStudentId(null);
    if (res.success) {
      reloadDataStore();
    }
  };

  // Manual Transfer handler
  const handleManualTransfer = (studentId: string, targetTeacher: string) => {
    const res = moveStudentToTeacher(studentId, targetTeacher);
    setTransferToast({ text: res.message, success: res.success });
    if (res.success) {
      reloadDataStore();
    }
  };

  // Logo upload handler (Admin only)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('กรุณาเลือกไฟล์ภาพขนาดไม่เกิน 3MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          setSavedLogo(base64);
          if (onLogoUpdated) onLogoUpdated(base64);
          alert('เปลี่ยนรูปโลโก้ระบบเรียบร้อยแล้ว');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetLogo = () => {
    if (confirm('คุณต้องการรีเซ็ตโลโก้กลับเป็นรูปทางการเริ่มต้นหรือไม่?')) {
      setSavedLogo('');
      if (onLogoUpdated) onLogoUpdated('/logo.png');
      alert('รีเซ็ตโลโก้กลับเป็นรูปทางการเริ่มต้นเรียบร้อยแล้ว');
    }
  };

  // Save student edit
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

  // Save teacher edit
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

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6 space-y-4 sm:space-y-6 pb-28 animate-fadeIn">
      {/* ==================== 1. TOP EXECUTIVE HEADER ==================== */}
      <div className="bg-white rounded-3xl border border-purple-100 p-4 sm:p-6 shadow-card hover:shadow-card-hover transition-all duration-300 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Back button & Title */}
          <div className="flex items-center space-x-3">
            {onBackToLanding && (
              <button
                type="button"
                onClick={onBackToLanding}
                className="inline-flex items-center space-x-2 text-xs sm:text-sm font-extrabold text-purple-900 hover:text-purple-950 bg-white border border-purple-200 px-4 py-2 rounded-full shadow-card hover:shadow-card-hover transition-all duration-300 ease-spring active:scale-95 group shrink-0"
              >
                <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center group-hover:-translate-x-0.5 transition-transform duration-200">
                  <ArrowLeft className="w-3.5 h-3.5" />
                </div>
                <span>ย้อนกลับหน้าแรก</span>
              </button>
            )}

            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-purple-100 text-purple-900 text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full border border-purple-200/60">
                  {adminUser?.role === 'subadmin' ? 'แอดมินรอง' : 'ผู้ดูแลระบบหลัก'}
                </span>
                <span className="text-xs text-purple-800 font-semibold">{adminUser?.name || 'แอดมิน'}</span>
              </div>
              <h1 className="text-lg sm:text-2xl font-black text-purple-950 mt-0.5 tracking-tight">
                ศูนย์จัดการระบบและแดชบอร์ดแอดมิน
              </h1>
            </div>
          </div>

          {/* Quick Action Pills */}
          <div className="flex items-center space-x-2 print:hidden">
            <button
              onClick={() => setActiveTab('export')}
              className="flex items-center space-x-1.5 bg-purple-700 hover:bg-purple-800 active:scale-95 text-white text-xs font-bold px-3.5 py-2 rounded-full shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออกไฟล์</span>
            </button>

            <button
              onClick={onLogout}
              className="flex items-center space-x-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold px-3.5 py-2 rounded-full active:scale-95 transition-all"
              title="ออกจากระบบแอดมิน"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ออก</span>
            </button>
          </div>
        </div>

        {/* 4 Minimal High-Contrast KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 pt-3 border-t border-purple-50">
          <div className="bg-purple-50/50 p-3.5 rounded-2xl border border-purple-100/90">
            <div className="text-[11px] font-bold text-purple-700">อัตราเข้าเรียนรวม</div>
            <div className="text-xl sm:text-2xl font-black text-purple-950 mt-1 tabular-nums">{kpi.rate.toFixed(1)}%</div>
            <div className="text-[10px] text-purple-800/70 mt-0.5 font-medium">มา {kpi.present} • ขาด {kpi.absent} • ลา {kpi.leave}</div>
          </div>

          <div className="bg-purple-50/50 p-3.5 rounded-2xl border border-purple-100/90">
            <div className="text-[11px] font-bold text-purple-700">บันทึกทั้งหมด</div>
            <div className="text-xl sm:text-2xl font-black text-purple-950 mt-1 tabular-nums">{kpi.totalRecords} ครั้ง</div>
            <div className="text-[10px] text-purple-800/70 mt-0.5 font-medium">จาก {kpi.distinctDates} วันที่เช็คจริง</div>
          </div>

          <div className="bg-purple-50/50 p-3.5 rounded-2xl border border-purple-100/90">
            <div className="text-[11px] font-bold text-purple-700">นักศึกษาในระบบ</div>
            <div className="text-xl sm:text-2xl font-black text-purple-950 mt-1 tabular-nums">{kpi.totalRegisteredStudents} คน</div>
            <div className="text-[10px] text-purple-800/70 mt-0.5 font-medium">
              ชาย {students.filter(s => s.gender === 'ชาย').length} / หญิง {students.filter(s => s.gender === 'หญิง').length}
            </div>
          </div>

          <div className="bg-purple-50/50 p-3.5 rounded-2xl border border-purple-100/90">
            <div className="text-[11px] font-bold text-purple-700">อาจารย์ผู้ดูแล</div>
            <div className="text-xl sm:text-2xl font-black text-purple-950 mt-1 tabular-nums">{kpi.totalRegisteredTeachers} ท่าน</div>
            <div className="text-[10px] text-purple-800/70 mt-0.5 font-medium">
              {teachers.filter(t => t.gender === 'ชาย').length} กลุ่มชาย / {teachers.filter(t => t.gender === 'หญิง').length} กลุ่มหญิง
            </div>
          </div>
        </div>
      </div>

      {/* ==================== 2. MAIN TABS SWITCHER ==================== */}
      <div className="flex bg-white/95 backdrop-blur-md p-1.5 rounded-full border border-purple-200/70 shadow-sm overflow-x-auto space-x-1.5 scrollbar-none print:hidden">
        {[
          { id: 'matrix', label: '📋 ตารางเช็คชื่อรายอาจารย์' },
          { id: 'analytics', label: '📊 แดชบอร์ด & กราฟสถิติ' },
          { id: 'periodic', label: '📅 สรุปตาม วัน/เดือน/ปี ที่บันทึกจริง' },
          { id: 'transfer', label: '🔄 โยกย้ายนักศึกษา (ลากวางได้)' },
          { id: 'editor', label: '✏️ แก้ไขข้อมูล (อาจารย์/นศ.)' },
          { id: 'announcements', label: `📢 ส่งประกาศ ${announcementsList.length > 0 ? `(${announcementsList.length})` : ''}` },
          { id: 'system_management', label: '⚙️ การจัดการระบบ (รหัสผ่าน/โลโก้)' },
          { id: 'export', label: '📤 ศูนย์ส่งออกไฟล์' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all duration-300 active:scale-95 ${
              activeTab === tab.id
                ? 'bg-purple-800 text-white shadow-md shadow-purple-900/20'
                : 'text-purple-900/80 hover:text-purple-950 hover:bg-purple-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ==================== TAB 1: MATRIX VIEW (ตามรูปแนบ 4) ==================== */}
      {activeTab === 'matrix' && (
        <div className="bg-white rounded-3xl border border-purple-100 p-4 sm:p-6 shadow-card space-y-5 animate-fadeIn">
          {/* Header & Teacher Picker */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-purple-100 text-purple-900 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                  ตารางสรุปผลรายกลุ่ม
                </span>
                <span className="text-xs text-purple-700 font-semibold">
                  {matrixCurrentTeacher?.groupName} ({matrixCurrentTeacher?.yearLevel})
                </span>
              </div>
              <h2 className="text-base sm:text-xl font-black text-purple-950 mt-1">
                ตารางบันทึกการเช็คชื่อ: {matrixCurrentTeacher?.name}
              </h2>
              <p className="text-xs text-purple-800/70 mt-0.5">
                แสดงผลการเช็คชื่อของนักศึกษาทุกคนในกลุ่มตามวันที่บันทึกจริง พร้อมการประเมินผลผ่านเกณฑ์
              </p>
            </div>

            {/* Teacher Dropdown */}
            <div className="w-full sm:w-80">
              <label className="text-[11px] font-bold text-purple-900 block mb-1">เลือกอาจารย์ผู้ดูแล:</label>
              <select
                value={matrixTeacherName}
                onChange={(e) => setMatrixTeacherName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-bold border border-purple-200 rounded-2xl bg-purple-50/50 text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-sm"
              >
                {teachers.map((t) => (
                  <option key={t.groupId} value={t.name}>
                    {t.name} ({t.groupName} - {t.gender})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Matrix Table (Matching Image 3 Layout Exactly) */}
          <div className="overflow-x-auto border border-purple-100 rounded-2xl shadow-sm">
            <table className="w-full text-left text-xs border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-purple-100/60 text-purple-950 font-extrabold border-b border-purple-200">
                  <th className="py-3 px-3 text-center w-12">ลำดับ</th>
                  <th className="py-3 px-3 font-mono">รหัสนักศึกษา</th>
                  <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                  <th className="py-3 px-2 text-center">เพศ</th>
                  <th className="py-3 px-3">ชั้นปี</th>
                  <th className="py-3 px-3">กลุ่ม</th>

                  {/* Dynamic Date Columns for this teacher */}
                  {matrixTeacherDates.map((date) => (
                    <th key={date} className="py-3 px-2 text-center whitespace-nowrap font-mono text-[11px]">
                      {formatThaiDate(date)}
                    </th>
                  ))}

                  {matrixTeacherDates.length === 0 && (
                    <th className="py-3 px-3 text-center text-purple-400 font-medium">ยังไม่มีวันที่เช็คชื่อ</th>
                  )}

                  <th className="py-3 px-3 text-center whitespace-nowrap font-bold">รวม (ครั้ง)</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap font-bold">คิดเป็น %</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap font-bold">ผลการประเมิน</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">ดูข้อมูล</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {matrixStudents.map((st, idx) => {
                  const studentRecs = records.filter(
                    (r) => r.studentId === st.studentId && r.teacherName === matrixCurrentTeacher.name
                  );
                  const presentCount = studentRecs.filter((r) => r.status === 'มา').length;
                  const totalDates = matrixTeacherDates.length;
                  const rate = totalDates > 0 ? (presentCount / totalDates) * 100 : 0;
                  const isPassed = rate >= 80;

                  return (
                    <tr key={st.studentId} className="hover:bg-purple-50/40 transition-colors">
                      <td className="py-3 px-3 text-center font-bold text-purple-900/60">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-medium text-purple-950">{st.studentId}</td>
                      <td className="py-3 px-4 font-extrabold text-purple-950 whitespace-nowrap">{st.fullName}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          st.gender === 'ชาย' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                        }`}>
                          {st.gender}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-purple-800 font-semibold">{st.yearLevel}</td>
                      <td className="py-3 px-3 text-purple-800/80 text-[11px] font-mono">{st.groupName}</td>

                      {/* Attendance status cells for each date */}
                      {matrixTeacherDates.map((date) => {
                        const rec = studentRecs.find((r) => r.date === date);
                        return (
                          <td key={date} className="py-2.5 px-2 text-center">
                            {rec ? (
                              rec.status === 'มา' ? (
                                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs mx-auto shadow-sm" title="มา">
                                  ✓
                                </div>
                              ) : rec.status === 'ขาด' ? (
                                <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs mx-auto shadow-sm" title="ขาด">
                                  ✕
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-[10px] mx-auto shadow-sm" title="ลา">
                                  ลา
                                </div>
                              )
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        );
                      })}

                      {matrixTeacherDates.length === 0 && (
                        <td className="py-3 px-3 text-center text-gray-300">-</td>
                      )}

                      {/* Total sessions */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-purple-950">
                        {presentCount} / {totalDates}
                      </td>

                      {/* Percentage */}
                      <td className="py-3 px-3 text-center font-mono font-black text-purple-900">
                        {rate.toFixed(0)}%
                      </td>

                      {/* Evaluation Badge (เหมือนรูปแนบ 4: ผ่านเกณฑ์ / ยังไม่ผ่าน) */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                            isPassed
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {isPassed ? 'ผ่านเกณฑ์' : 'ยังไม่ผ่าน'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedStudentForModal(st)}
                          className="px-2.5 py-1 text-[11px] font-bold text-purple-700 hover:text-purple-950 bg-purple-100/60 hover:bg-purple-200 rounded-lg transition-colors"
                        >
                          ดูประวัติ
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {matrixStudents.length === 0 && (
                  <tr>
                    <td colSpan={10 + matrixTeacherDates.length} className="py-12 text-center text-gray-400">
                      ไม่พบรายชื่อนักศึกษาในกลุ่มอาจารย์ท่านนี้
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: ANALYTICS & CHARTS (แดชบอร์ด & กราฟสถิติ) ==================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Visual Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Visual Donut / Distribution Chart */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-purple-100 shadow-card space-y-4">
              <h3 className="font-black text-purple-950 text-sm sm:text-base flex items-center gap-2">
                <PieChart className="w-4 h-4 text-purple-700" />
                <span>สัดส่วนการเข้าเรียนทั้งหมด (มา • ขาด • ลา)</span>
              </h3>

              {/* Visual Progress Bar */}
              <div className="space-y-2">
                <div className="h-6 w-full bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
                  <div
                    style={{ width: `${kpi.totalRecords > 0 ? (kpi.present / kpi.totalRecords) * 100 : 0}%` }}
                    className="bg-emerald-500 h-full transition-all duration-500"
                    title={`มา: ${kpi.present} ครั้ง`}
                  />
                  <div
                    style={{ width: `${kpi.totalRecords > 0 ? (kpi.absent / kpi.totalRecords) * 100 : 0}%` }}
                    className="bg-rose-500 h-full transition-all duration-500"
                    title={`ขาด: ${kpi.absent} ครั้ง`}
                  />
                  <div
                    style={{ width: `${kpi.totalRecords > 0 ? (kpi.leave / kpi.totalRecords) * 100 : 0}%` }}
                    className="bg-amber-400 h-full transition-all duration-500"
                    title={`ลา: ${kpi.leave} ครั้ง`}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-2">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800">
                    <div className="text-lg font-black">{kpi.present}</div>
                    <div className="text-[10px] font-bold">มา ({kpi.totalRecords > 0 ? ((kpi.present / kpi.totalRecords) * 100).toFixed(1) : 0}%)</div>
                  </div>
                  <div className="p-2 rounded-xl bg-rose-50 text-rose-800">
                    <div className="text-lg font-black">{kpi.absent}</div>
                    <div className="text-[10px] font-bold">ขาด ({kpi.totalRecords > 0 ? ((kpi.absent / kpi.totalRecords) * 100).toFixed(1) : 0}%)</div>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-800">
                    <div className="text-lg font-black">{kpi.leave}</div>
                    <div className="text-[10px] font-bold">ลา ({kpi.totalRecords > 0 ? ((kpi.leave / kpi.totalRecords) * 100).toFixed(1) : 0}%)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Evaluation Passing Rate */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-purple-100 shadow-card space-y-4">
              <h3 className="font-black text-purple-950 text-sm sm:text-base flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-700" />
                <span>การประเมินภาพรวมนักศึกษา (เกณฑ์ 80%)</span>
              </h3>

              {(() => {
                const passedCount = studentSummaries.filter((s) => s.attendanceRate >= 80).length;
                const failedCount = studentSummaries.length - passedCount;
                const passedRate = studentSummaries.length > 0 ? (passedCount / studentSummaries.length) * 100 : 0;

                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-emerald-700">ผ่านเกณฑ์: {passedCount} คน ({passedRate.toFixed(1)}%)</span>
                      <span className="text-rose-700">ยังไม่ผ่าน: {failedCount} คน</span>
                    </div>
                    <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex">
                      <div style={{ width: `${passedRate}%` }} className="bg-emerald-500 h-full transition-all" />
                      <div style={{ width: `${100 - passedRate}%` }} className="bg-rose-400 h-full transition-all" />
                    </div>
                    <p className="text-xs text-purple-800/70">
                      * นักศึกษาที่มีอัตราการเข้าร่วมกิจกรรมหะละเกาะห์ตั้งแต่ 80% ขึ้นไป ถือว่าผ่านเกณฑ์ตามข้อกำหนดของหลักสูตร
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Bar Chart: Attendance by Teacher Group */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-purple-100 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-purple-950 text-sm sm:text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-700" />
                <span>กราฟอัตราการเข้าเรียนจำแนกตามกลุ่มอาจารย์ผู้ดูแล</span>
              </h3>
              <span className="text-[11px] text-purple-700 font-semibold">{teacherSummaries.length} กลุ่ม</span>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-2">
              {teacherSummaries.map((t) => (
                <div key={t.teacherName} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-purple-950 truncate max-w-xs">{t.teacherName} ({t.groupName})</span>
                    <span className="font-mono text-purple-900">{t.overallRate.toFixed(1)}%</span>
                  </div>
                  <div className="h-3 w-full bg-purple-50 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${t.overallRate}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        t.overallRate >= 80 ? 'bg-purple-700' : t.overallRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: PERIODIC SUMMARY (วัน/เดือน/ปี ที่บันทึกจริง) ==================== */}
      {activeTab === 'periodic' && (
        <div className="bg-white rounded-3xl border border-purple-100 p-4 sm:p-6 shadow-card space-y-5 animate-fadeIn">
          {/* Header & Mode Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100 pb-4">
            <div>
              <h2 className="text-base sm:text-xl font-black text-purple-950 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-700" />
                <span>สรุปผลตาม วัน / เดือน / ปี ที่มีการบันทึกจริง</span>
              </h2>
              <p className="text-xs text-purple-800/70 mt-0.5">
                ดูสถิติและผลการเช็คชื่อที่เกิดขึ้นจริง โดยไม่รวมวันที่ไม่มีการจัดกิจกรรม
              </p>
            </div>

            {/* Segmented Period Switcher */}
            <div className="flex bg-purple-100/70 p-1 rounded-full border border-purple-200">
              <button
                type="button"
                onClick={() => setPeriodType('day')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  periodType === 'day' ? 'bg-purple-800 text-white shadow-sm' : 'text-purple-900'
                }`}
              >
                ตามวันที่จริง ({distinctRecordedDates.length})
              </button>
              <button
                type="button"
                onClick={() => setPeriodType('month')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  periodType === 'month' ? 'bg-purple-800 text-white shadow-sm' : 'text-purple-900'
                }`}
              >
                ตามเดือน ({distinctRecordedMonths.length})
              </button>
              <button
                type="button"
                onClick={() => setPeriodType('year')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  periodType === 'year' ? 'bg-purple-800 text-white shadow-sm' : 'text-purple-900'
                }`}
              >
                ตามปีการศึกษา
              </button>
            </div>
          </div>

          {/* VIEW: BY ACTUAL DATES */}
          {periodType === 'day' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {distinctRecordedDates.map((date) => {
                  const dayRecs = records.filter((r) => r.date === date);
                  const present = dayRecs.filter((r) => r.status === 'มา').length;
                  const absent = dayRecs.filter((r) => r.status === 'ขาด').length;
                  const leave = dayRecs.filter((r) => r.status === 'ลา').length;
                  const total = dayRecs.length;
                  const rate = total > 0 ? (present / total) * 100 : 0;
                  const teachersOnDay = new Set(dayRecs.map((r) => r.teacherName)).size;

                  return (
                    <div key={date} className="p-4 rounded-2xl border border-purple-100/90 bg-white hover:border-purple-300 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-extrabold text-purple-950 font-mono">
                          {formatThaiDate(date)}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                          {teachersOnDay} กลุ่มบันทึก
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-black text-purple-900 tabular-nums">{rate.toFixed(1)}%</span>
                        <span className="text-xs text-purple-700/80 font-medium">เข้าเรียน</span>
                      </div>
                      <div className="text-[11px] text-purple-800/70 flex items-center justify-between border-t border-purple-50 pt-2">
                        <span>มา <strong className="text-emerald-700">{present}</strong></span>
                        <span>ขาด <strong className="text-rose-700">{absent}</strong></span>
                        <span>ลา <strong className="text-amber-700">{leave}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {distinctRecordedDates.length === 0 && (
                <div className="py-12 text-center text-gray-400 text-xs">
                  ยังไม่มีการบันทึกข้อมูลการเช็คชื่อในระบบ
                </div>
              )}
            </div>
          )}

          {/* VIEW: BY MONTH */}
          {periodType === 'month' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {distinctRecordedMonths.map((mKey) => {
                  const mRecs = records.filter((r) => r.date.startsWith(mKey));
                  const datesInMonth = new Set(mRecs.map((r) => r.date)).size;
                  const present = mRecs.filter((r) => r.status === 'มา').length;
                  const total = mRecs.length;
                  const rate = total > 0 ? (present / total) * 100 : 0;

                  return (
                    <div key={mKey} className="p-5 rounded-2xl border border-purple-100 bg-white shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-purple-950 text-sm">{formatThaiMonth(mKey)}</h4>
                        <span className="text-xs font-mono font-bold text-purple-700">{datesInMonth} ครั้งที่จัด</span>
                      </div>
                      <div className="text-3xl font-black text-purple-900 tabular-nums">{rate.toFixed(1)}%</div>
                      <div className="text-xs text-purple-800/80">
                        ยอดบันทึกรวม {total} รายการ (มา {present} ครั้ง)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW: BY YEAR */}
          {periodType === 'year' && (
            <div className="p-6 rounded-2xl border border-purple-100 bg-purple-50/30 text-center space-y-3">
              <h3 className="font-black text-lg text-purple-950">ปีการศึกษา 2569</h3>
              <p className="text-xs text-purple-800/70">
                สรุปการจัดกิจกรรมหะละเกาะห์ตลอดทั้งปีการศึกษา
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-2">
                <div className="p-3 bg-white rounded-xl border border-purple-100">
                  <div className="text-xl font-black text-purple-950">{distinctRecordedDates.length}</div>
                  <div className="text-[10px] font-bold text-purple-700">วันที่จัดกิจกรรมจริง</div>
                </div>
                <div className="p-3 bg-white rounded-xl border border-purple-100">
                  <div className="text-xl font-black text-purple-950">{kpi.totalRecords}</div>
                  <div className="text-[10px] font-bold text-purple-700">ยอดบันทึกทั้งหมด</div>
                </div>
                <div className="p-3 bg-white rounded-xl border border-purple-100">
                  <div className="text-xl font-black text-emerald-700">{kpi.rate.toFixed(1)}%</div>
                  <div className="text-[10px] font-bold text-purple-700">อัตราเข้าเฉลี่ยรวม</div>
                </div>
                <div className="p-3 bg-white rounded-xl border border-purple-100">
                  <div className="text-xl font-black text-purple-950">{teachers.length}</div>
                  <div className="text-[10px] font-bold text-purple-700">กลุ่มหะละเกาะห์</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 4: DRAG & DROP STUDENT TRANSFER ==================== */}
      {activeTab === 'transfer' && (
        <div className="bg-white rounded-3xl border border-purple-100 p-4 sm:p-6 shadow-card space-y-6 animate-fadeIn">
          <div className="border-b border-purple-100 pb-3">
            <h2 className="text-base sm:text-lg font-black text-purple-950 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-purple-700" />
              <span>ระบบโยกย้ายนักศึกษา (ลากวางได้ทันที)</span>
            </h2>
            <p className="text-xs text-purple-800/70 mt-1">
              ลากการ์ดนักศึกษาจากกลุ่มต้นทางด้านซ้าย ไปปล่อยที่กล่องกลุ่มปลายทางด้านขวา หรือเลือกย้ายด้วยการค้นหา
            </p>
          </div>

          {/* Feedback Toast */}
          {transferToast && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold border flex items-center justify-between ${
                transferToast.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              <span>{transferToast.text}</span>
              <button onClick={() => setTransferToast(null)}><X className="w-4 h-4" /></button>
            </div>
          )}

          {/* Drag & Drop Dual Workspace */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SOURCE COLUMN (DRAGGABLE STUDENTS) */}
            <div className="space-y-3 bg-purple-50/40 p-4 sm:p-5 rounded-3xl border border-purple-100">
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-purple-950 block">1. เลือกกลุ่มต้นทาง (ที่ต้องการย้ายออก):</label>
                <select
                  value={dragSourceTeacher}
                  onChange={(e) => setDragSourceTeacher(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-purple-200 rounded-xl bg-white text-purple-950 font-bold"
                >
                  {teachers.map((t) => (
                    <option key={t.groupId} value={t.name}>
                      {t.name} ({t.groupName} - {t.gender})
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-[11px] text-purple-700 font-bold pt-1">
                คลิกค้างแล้วลากการ์ดนักศึกษา ({students.filter((s) => s.teacherName === dragSourceTeacher).length} คน):
              </div>

              {/* Draggable student cards */}
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {students
                  .filter((s) => s.teacherName === dragSourceTeacher)
                  .map((st) => (
                    <div
                      key={st.studentId}
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', st.studentId);
                        setDraggedStudentId(st.studentId);
                      }}
                      className="p-3 bg-white rounded-xl border border-purple-200/80 hover:border-purple-400 shadow-sm cursor-grab active:cursor-grabbing flex items-center justify-between group transition-all"
                    >
                      <div className="flex items-center space-x-2.5">
                        <GripVertical className="w-4 h-4 text-purple-400 group-hover:text-purple-700" />
                        <div>
                          <div className="text-xs font-extrabold text-purple-950">{st.fullName}</div>
                          <div className="text-[10px] text-purple-700 font-mono">รหัส: {st.studentId} • {st.gender}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleManualTransfer(st.studentId, dragTargetTeacher)}
                        className="text-[10px] bg-purple-100 hover:bg-purple-200 text-purple-900 px-2.5 py-1 rounded-lg font-bold"
                      >
                        ย้ายเลย ➔
                      </button>
                    </div>
                  ))}

                {students.filter((s) => s.teacherName === dragSourceTeacher).length === 0 && (
                  <div className="p-8 text-center text-xs text-gray-400">ไม่มีนักศึกษาในกลุ่มนี้</div>
                )}
              </div>
            </div>

            {/* TARGET COLUMN (DROP ZONE) */}
            <div className="space-y-3 bg-purple-50/40 p-4 sm:p-5 rounded-3xl border border-purple-100 flex flex-col justify-between">
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-purple-950 block">2. เลือกกลุ่มปลายทาง (ที่ต้องการย้ายเข้า):</label>
                <select
                  value={dragTargetTeacher}
                  onChange={(e) => setDragTargetTeacher(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-purple-200 rounded-xl bg-white text-purple-950 font-bold"
                >
                  {teachers
                    .filter((t) => t.name !== dragSourceTeacher)
                    .map((t) => (
                      <option key={t.groupId} value={t.name}>
                        {t.name} ({t.groupName} - {t.gender})
                      </option>
                    ))}
                </select>
              </div>

              {/* Interactive Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOverTarget(true);
                }}
                onDragLeave={() => setIsDragOverTarget(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  const sid = e.dataTransfer.getData('text/plain') || draggedStudentId;
                  if (sid) {
                    handleDropStudent(dragTargetTeacher);
                  }
                }}
                className={`flex-1 min-h-[220px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-all ${
                  isDragOverTarget
                    ? 'border-purple-600 bg-purple-100/70 scale-[1.01]'
                    : 'border-purple-300 bg-white hover:border-purple-400'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mb-2">
                  <ArrowRightLeft className="w-6 h-6" />
                </div>
                <div className="text-sm font-extrabold text-purple-950">ลากการ์ดนักศึกษามาวางที่นี่</div>
                <div className="text-xs text-purple-700/80 mt-1 font-medium">
                  เพื่อย้ายเข้าสู่กลุ่ม: <span className="font-bold underline">{dragTargetTeacher}</span>
                </div>
              </div>

              <div className="text-[11px] text-purple-700/70 text-center">
                จำนวนนักศึกษาปัจจุบันในกลุ่มปลายทาง: {students.filter((s) => s.teacherName === dragTargetTeacher).length} คน
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 5: DATA EDITOR (แก้ไขข้อมูล) ==================== */}
      {activeTab === 'editor' && (
        <div className="bg-white rounded-3xl border border-purple-100 p-4 sm:p-6 shadow-card space-y-5 animate-fadeIn">
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

            {/* Sub-tabs */}
            <div className="bg-purple-100/70 p-1 rounded-full border border-purple-200 flex">
              <button
                type="button"
                onClick={() => setEditorSubTab('students')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  editorSubTab === 'students' ? 'bg-purple-800 text-white shadow-sm' : 'text-purple-900'
                }`}
              >
                นักศึกษา ({students.length})
              </button>
              <button
                type="button"
                onClick={() => setEditorSubTab('teachers')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  editorSubTab === 'teachers' ? 'bg-purple-800 text-white shadow-sm' : 'text-purple-900'
                }`}
              >
                อาจารย์ ({teachers.length})
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

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-purple-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={editorSubTab === 'students' ? 'ค้นหารหัส, ชื่อ นศ., อาจารย์...' : 'ค้นหาชื่ออาจารย์, กลุ่ม...'}
              value={editorSearch}
              onChange={(e) => setEditorSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-xs border border-purple-200 rounded-xl bg-purple-50/30 text-purple-950 placeholder-purple-300"
            />
          </div>

          {/* Students List */}
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
                  {students
                    .filter(
                      (s) =>
                        !editorSearch ||
                        s.fullName.toLowerCase().includes(editorSearch.toLowerCase()) ||
                        s.studentId.includes(editorSearch) ||
                        s.teacherName.toLowerCase().includes(editorSearch.toLowerCase())
                    )
                    .slice(0, 100)
                    .map((st) => (
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

          {/* Teachers List */}
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
                  {teachers
                    .filter(
                      (t) =>
                        !editorSearch ||
                        t.name.toLowerCase().includes(editorSearch.toLowerCase()) ||
                        t.groupName.toLowerCase().includes(editorSearch.toLowerCase())
                    )
                    .map((t) => {
                      const count = students.filter((s) => s.teacherName === t.name).length;
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

          {/* EDIT STUDENT MODAL */}
          {editingStudent && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn">
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
                      className="w-full mt-1 p-2.5 border border-purple-200 rounded-xl font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-purple-900">ชื่อ - นามสกุล</label>
                    <input
                      type="text"
                      value={editingStudent.fullName}
                      onChange={(e) => setEditingStudent({ ...editingStudent, fullName: e.target.value })}
                      className="w-full mt-1 p-2.5 border border-purple-200 rounded-xl font-semibold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-purple-900">เพศ</label>
                      <select
                        value={editingStudent.gender}
                        onChange={(e) => setEditingStudent({ ...editingStudent, gender: e.target.value as any })}
                        className="w-full mt-1 p-2.5 border border-purple-200 rounded-xl font-semibold"
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
                        className="w-full mt-1 p-2.5 border border-purple-200 rounded-xl font-semibold"
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
                        const t = teachers.find((item) => item.name === e.target.value);
                        setEditingStudent({
                          ...editingStudent,
                          teacherName: e.target.value,
                          groupName: t ? t.groupName : editingStudent.groupName,
                        });
                      }}
                      className="w-full mt-1 p-2.5 border border-purple-200 rounded-xl font-semibold"
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
                      className="w-full mt-1 p-2.5 border border-purple-200 rounded-xl"
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
                      className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-sm"
                    >
                      บันทึกข้อมูล
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* EDIT TEACHER MODAL */}
          {editingTeacher && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn">
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
                      className="w-full mt-1 p-2.5 border border-purple-200 rounded-xl font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-purple-900">ชื่อกลุ่มหะละเกาะห์</label>
                    <input
                      type="text"
                      value={editingTeacher.groupName}
                      onChange={(e) => setEditingTeacher({ ...editingTeacher, groupName: e.target.value })}
                      className="w-full mt-1 p-2.5 border border-purple-200 rounded-xl font-semibold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-purple-900">เพศกลุ่ม</label>
                      <select
                        value={editingTeacher.gender}
                        onChange={(e) => setEditingTeacher({ ...editingTeacher, gender: e.target.value as any })}
                        className="w-full mt-1 p-2.5 border border-purple-200 rounded-xl font-semibold"
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
                        className="w-full mt-1 p-2.5 border border-purple-200 rounded-xl font-semibold"
                      >
                        <option value="ปี 2">ปี 2</option>
                        <option value="ปี 3">ปี 3</option>
                        <option value="ปี 4">ปี 4</option>
                      </select>
                    </div>
                  </div>

                  <p className="text-[11px] text-purple-700 bg-purple-50 p-2.5 rounded-xl border border-purple-100">
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
                      className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-sm"
                    >
                      บันทึกข้อมูล
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 6: EXPORT CENTER (ศูนย์ส่งออกไฟล์) ==================== */}
      {activeTab === 'export' && (
        <div className="bg-white rounded-3xl border border-purple-100 p-5 sm:p-7 shadow-card space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-base sm:text-xl font-black text-purple-950 flex items-center gap-2">
              <Download className="w-5 h-5 text-purple-700" />
              <span>ศูนย์ส่งออกรายงาน (Export Center)</span>
            </h2>
            <p className="text-xs text-purple-800/70 mt-1">
              เลือกรูปแบบไฟล์ที่ต้องการส่งออก ระบบจัดรูปแบบให้อัตโนมัติพร้อมนำไปใช้งานได้ทันที
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Excel */}
            <div className="p-5 rounded-3xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70 transition-all flex flex-col justify-between space-y-3">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-3 shadow-sm">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h3 className="font-black text-purple-950 text-base">รายงาน Excel (.xlsx)</h3>
                <p className="text-xs text-purple-800/80 mt-1">
                  ไฟล์สเปรดชีต Excel สมบูรณ์แบบ มีแผ่นงานแยกภาพรวม, สรุปรายอาจารย์ และรายชื่อนักศึกษา เหมาะสำหรับวิเคราะห์ต่อ
                </p>
              </div>
              <button
                type="button"
                onClick={() => exportToExcel(records, teacherSummaries, studentSummaries, 'รายงานการเช็คชื่อหะละเกาะห์')}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-1.5"
              >
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลด Excel</span>
              </button>
            </div>

            {/* 2. Word */}
            <div className="p-5 rounded-3xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50/70 transition-all flex flex-col justify-between space-y-3">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-3 shadow-sm">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-black text-purple-950 text-base">รายงาน Word (.doc)</h3>
                <p className="text-xs text-purple-800/80 mt-1">
                  เอกสารรายงานสรุปผลกิจกรรมการศึกษาอัลกุรอาน จัดรูปแบบตารางทางการพร้อมสำหรับพิมพ์เสนอผู้บริหาร
                </p>
              </div>
              <button
                type="button"
                onClick={() => exportToWord(records, teacherSummaries, 'รายงานการเช็คชื่อหะละเกาะห์')}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-1.5"
              >
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลด Word</span>
              </button>
            </div>

            {/* 3. PDF */}
            <div className="p-5 rounded-3xl border border-purple-200 bg-purple-50/40 hover:bg-purple-50/70 transition-all flex flex-col justify-between space-y-3">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-purple-700 text-white flex items-center justify-center mb-3 shadow-sm">
                  <Download className="w-5 h-5" />
                </div>
                <h3 className="font-black text-purple-950 text-base">เอกสารสรุป PDF (.pdf)</h3>
                <p className="text-xs text-purple-800/80 mt-1">
                  รายงาน PDF ทางการ มีตราคณะและรายละเอียดตารางสรุปผลครบถ้วน เปิดอ่านได้บนทุกอุปกรณ์
                </p>
              </div>
              <button
                type="button"
                onClick={() => downloadPdfReport(records, teacherSummaries, 'รายงานการเช็คชื่อหะละเกาะห์')}
                className="w-full py-2.5 px-4 bg-purple-700 hover:bg-purple-800 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-1.5"
              >
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลด PDF</span>
              </button>
            </div>

            {/* 4. Print */}
            <div className="p-5 rounded-3xl border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-all flex flex-col justify-between space-y-3">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-gray-800 text-white flex items-center justify-center mb-3 shadow-sm">
                  <Printer className="w-5 h-5" />
                </div>
                <h3 className="font-black text-purple-950 text-base">พิมพ์รายงาน (Print)</h3>
                <p className="text-xs text-purple-800/80 mt-1">
                  เปิดหน้าต่างสั่งพิมพ์ทางเครื่องพิมพ์โดยตรง พร้อมซ่อนเมนูและเครื่องมือต่างๆ ให้หน้ากระดาษสะอาดเรียบร้อย
                </p>
              </div>
              <button
                type="button"
                onClick={() => printReport()}
                className="w-full py-2.5 px-4 bg-gray-800 hover:bg-black active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>สั่งพิมพ์ทันที</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB: ANNOUNCEMENTS (ระบบส่งประกาศถึงนักศึกษา) ==================== */}
      {activeTab === 'announcements' && (
        <div className="bg-white rounded-3xl border border-purple-100 p-5 sm:p-7 shadow-card space-y-6 animate-fadeIn">
          <div className="border-b border-purple-100 pb-3">
            <h2 className="text-base sm:text-xl font-black text-purple-950 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-purple-700" />
              <span>ระบบส่งประกาศและข้อความแจ้งเตือน (ส่งถึงนักศึกษา)</span>
            </h2>
            <p className="text-xs text-purple-800/70 mt-1">
              แอดมินสามารถส่งประกาศไปยังนักศึกษาทุกคน หรือส่งเจาะจงเฉพาะนักศึกษาบางคน เมื่อนักศึกษาค้นหารหัสนักศึกษาจะเห็นประกาศเด่นๆ ที่หน้าแดชบอร์ดของตนเอง
            </p>
          </div>

          {/* Form Create Announcement */}
          <form onSubmit={handleCreateAnnouncement} className="bg-purple-50/50 p-4 sm:p-6 rounded-3xl border border-purple-200/80 space-y-4">
            <div className="font-extrabold text-xs sm:text-sm text-purple-950 flex items-center gap-2">
              <Bell className="w-4 h-4 text-purple-700" />
              <span>สร้างประกาศใหม่</span>
            </div>

            {annToast && (
              <div className={`p-3 rounded-2xl text-xs font-bold ${annToast.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {annToast.text}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-purple-900 block mb-1">หัวข้อประกาศ *</label>
                <input
                  type="text"
                  placeholder="เช่น กำหนดการสอบประเมินอัลกุรอาน, แจ้งเตือนเวลาเข้ากิจกรรม"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-purple-200 rounded-xl bg-white text-purple-950 font-bold"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-purple-900 block mb-1">ข้อความรายละเอียดประกาศ *</label>
                <textarea
                  rows={3}
                  placeholder="พิมพ์ข้อความที่ต้องการแจ้งให้นักศึกษาทราบ..."
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-purple-200 rounded-xl bg-white text-purple-950 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-purple-900 block mb-1">ระดับความสำคัญ</label>
                  <select
                    value={annPriority}
                    onChange={(e) => setAnnPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 border border-purple-200 rounded-xl bg-white font-bold"
                  >
                    <option value="normal">📌 ประกาศทั่วไป (Normal)</option>
                    <option value="warning">⚠️ แจ้งเตือนสำคัญ (Warning)</option>
                    <option value="urgent">🚨 ด่วนที่สุด (Urgent)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-purple-900 block mb-1">กลุ่มเป้าหมายผู้รับ</label>
                  <select
                    value={annTargetType}
                    onChange={(e) => setAnnTargetType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 border border-purple-200 rounded-xl bg-white font-bold"
                  >
                    <option value="all">📢 ส่งถึงนักศึกษาทุกคนในระบบ</option>
                    <option value="specific">🎯 ระบุเฉพาะรหัสนักศึกษาบางคน</option>
                  </select>
                </div>
              </div>

              {annTargetType === 'specific' && (
                <div className="animate-fadeIn">
                  <label className="font-bold text-purple-900 block mb-1">
                    ระบุรหัสนักศึกษา (คั่นด้วยเครื่องหมายจุลภาค , หรือเว้นวรรค)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น 681441001, 681441002, 671441010"
                    value={annTargetIdsStr}
                    onChange={(e) => setAnnTargetIdsStr(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-purple-200 rounded-xl bg-white text-purple-950 font-mono font-bold"
                  />
                  <p className="text-[10px] text-purple-700/70 mt-1">
                    * นักศึกษาที่มีรหัสตรงกับรายการนี้เท่านั้นที่จะมองเห็นประกาศนี้เมื่อค้นหารหัสตนเอง
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-purple-800 to-purple-900 hover:from-purple-900 hover:to-purple-950 text-white font-black text-xs sm:text-sm rounded-2xl shadow-sm transition-all active:scale-95 flex items-center gap-2"
            >
              <Megaphone className="w-4 h-4" />
              <span>โพสต์ประกาศทันที</span>
            </button>
          </form>

          {/* Announcements List */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-xs sm:text-sm text-purple-950 flex items-center justify-between">
              <span>รายการประกาศที่กำลังแสดงผล ({announcementsList.length} รายการ)</span>
            </h3>

            <div className="space-y-2.5">
              {announcementsList.map((ann) => (
                <div
                  key={ann.id}
                  className="p-4 rounded-2xl bg-white border border-purple-100/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-purple-300 transition-all"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        ann.priority === 'urgent'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : ann.priority === 'warning'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-purple-100 text-purple-800 border border-purple-200'
                      }`}>
                        {ann.priority === 'urgent' ? '🚨 ด่วนที่สุด' : ann.priority === 'warning' ? '⚠️ เตือนสำคัญ' : '📌 ทั่วไป'}
                      </span>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-800">
                        {ann.targetType === 'all' ? 'ส่งถึง นศ.ทุกคน' : `ส่งเฉพาะ ${ann.targetStudentIds.length} รหัส`}
                      </span>

                      <span className="text-[10px] text-gray-400 font-mono">
                        {new Date(ann.createdAt).toLocaleString('th-TH')}
                      </span>
                    </div>

                    <h4 className="font-black text-sm text-purple-950">{ann.title}</h4>
                    <p className="text-xs text-purple-900/80 leading-relaxed whitespace-pre-wrap">{ann.content}</p>

                    {ann.targetType === 'specific' && (
                      <div className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg inline-block">
                        รหัสที่ได้รับ: {ann.targetStudentIds.join(', ')}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteAnnouncement(ann.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all self-end sm:self-center"
                    title="ลบประกาศนี้"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {announcementsList.length === 0 && (
                <div className="py-10 text-center text-xs text-gray-400 bg-purple-50/20 rounded-2xl border border-purple-100">
                  ยังไม่มีประกาศที่กำลังเผยแพร่ในระบบ
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB: SYSTEM MANAGEMENT (การจัดการระบบ: รหัสผ่าน, โลโก้, แอดมิน) ==================== */}
      {activeTab === 'system_management' && (
        <div className="bg-white rounded-3xl border border-purple-100 p-5 sm:p-7 shadow-card space-y-6 animate-fadeIn">
          <div className="border-b border-purple-100 pb-3">
            <h2 className="text-base sm:text-xl font-black text-purple-950 flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-700" />
              <span>การจัดการระบบ (รหัสผ่านบุคคลากร, แอดมินรอง, โลโก้ และฐานข้อมูล)</span>
            </h2>
            <p className="text-xs text-purple-800/70 mt-1">
              ศูนย์รวมการควบคุมสิทธิ์ รหัสผ่านเข้าใช้งาน รูปตราสัญลักษณ์ และการสำรองข้อมูล
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. FACULTY PASSWORD MANAGEMENT */}
            <div className="p-5 rounded-3xl border border-purple-200/80 bg-purple-50/40 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-purple-950 text-sm">
                    รหัสผ่านเข้าใช้งานสำหรับบุคคลากร
                  </h3>
                  <p className="text-[11px] text-purple-700/70">
                    รหัสที่อาจารย์ต้องใช้กรอกเพื่อเข้าสู่หน้าเช็คชื่อ
                  </p>
                </div>
              </div>

              {facultyPassMsg && (
                <div className={`p-2.5 rounded-xl text-xs font-bold ${facultyPassMsg.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {facultyPassMsg.text}
                </div>
              )}

              <form onSubmit={handleSaveFacultyPass} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-purple-900 block mb-1">
                    ตั้งรหัสผ่านใหม่สำหรับบุคคลากร
                  </label>
                  <input
                    type="text"
                    placeholder="พิมพ์รหัสผ่านใหม่ (เช่น รหัสที่ต้องการ)"
                    value={newFacultyPass}
                    onChange={(e) => setNewFacultyPass(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-bold border border-purple-200 rounded-xl bg-white"
                  />
                  <div className="text-[10px] text-purple-700/80 mt-1">
                    * รหัสตั้งต้นของระบบคือ <span className="font-mono font-bold text-purple-950">edu.sdd</span> (แอดมินสามารถเปลี่ยนได้ที่นี่)
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-800 hover:bg-purple-900 text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95"
                >
                  บันทึกรหัสผ่านบุคคลากรใหม่
                </button>
              </form>
            </div>

            {/* 2. LOGO MANAGEMENT */}
            <div className="p-5 rounded-3xl border border-purple-200/80 bg-purple-50/40 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-purple-950 text-sm">
                    รูปตราสัญลักษณ์คณะศึกษาศาสตร์ (Logo)
                  </h3>
                  <p className="text-[11px] text-purple-700/70">
                    รูปตราสัญลักษณ์ที่แสดงตรงกลางหน้าแรกของทุกอุปกรณ์
                  </p>
                </div>
              </div>

              <div className="p-3 bg-white/70 rounded-2xl border border-purple-200 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={customLogo || '/logo.png'}
                  alt="Current Logo"
                  className="max-h-24 w-auto object-contain"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="flex-1 py-2.5 px-4 bg-purple-800 hover:bg-purple-900 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>เลือกรูปใหม่จากเครื่อง</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetLogo}
                  className="py-2.5 px-3 bg-white hover:bg-purple-100 active:scale-95 text-purple-900 border border-purple-200 font-bold text-xs rounded-xl transition-all"
                  title="คืนค่าเป็นรูปทางการ"
                >
                  รีเซ็ตเริ่มต้น
                </button>
              </div>
            </div>

            {/* 3. SUB-ADMINS MANAGEMENT */}
            <div className="p-5 rounded-3xl border border-purple-200/80 bg-purple-50/40 space-y-4 md:col-span-2">
              <div className="flex items-center justify-between border-b border-purple-200/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-purple-950 text-sm">
                      จัดการผู้ดูแลระบบและแอดมินรอง (Sub-Admins)
                    </h3>
                    <p className="text-[11px] text-purple-700/70">
                      แอดมินหลักใช้รหัสผ่าน <span className="font-mono font-bold text-purple-950">71300807</span> และสามารถเพิ่มแอดมินรองพร้อมรหัสเฉพาะตัวได้
                    </p>
                  </div>
                </div>
              </div>

              {/* Form add sub-admin */}
              <form onSubmit={handleAddSubAdmin} className="bg-white p-4 rounded-2xl border border-purple-200 space-y-3">
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
                  className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  เพิ่มแอดมินรอง
                </button>
              </form>

              {/* Sub-admins list */}
              <div className="space-y-2">
                <div className="font-bold text-xs text-purple-950">รายชื่อแอดมินรองในระบบ ({subAdminsList.length} ท่าน)</div>
                <div className="divide-y divide-purple-100 border border-purple-200 rounded-2xl overflow-hidden bg-white">
                  {subAdminsList.map((sub) => (
                    <div key={sub.id} className="p-3 flex items-center justify-between text-xs hover:bg-purple-50/30">
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

            {/* 4. GOOGLE SHEET & BACKUP */}
            <div className="p-5 rounded-3xl border border-purple-200/80 bg-purple-50/40 space-y-4 md:col-span-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                  <DatabaseIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-purple-950 text-sm">
                    ฐานข้อมูล Google Sheet & สำรองข้อมูล
                  </h3>
                  <p className="text-[11px] text-purple-700/70">
                    จัดการการเชื่อมต่อ API และสำรองข้อมูลทั้งหมดขึ้น Google Sheet
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                {onBackupAll && (
                  <button
                    type="button"
                    onClick={onBackupAll}
                    disabled={isBackingUp}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2"
                  >
                    <span>{isBackingUp ? 'กำลังสำรองข้อมูล...' : 'สำรองข้อมูลทั้งหมดขึ้น Google Sheet ทันที'}</span>
                  </button>
                )}

                {onOpenSettings && (
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="py-2.5 px-4 bg-white hover:bg-purple-100 active:scale-95 text-purple-950 border border-purple-200 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2"
                  >
                    <Settings className="w-4 h-4 text-purple-700" />
                    <span>แก้ไข URL การเชื่อมต่อ Web App</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT DETAIL MODAL */}
      {selectedStudentForModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-lg border border-purple-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-purple-100 pb-2">
              <div>
                <h3 className="font-extrabold text-base text-purple-950">{selectedStudentForModal.fullName}</h3>
                <p className="text-xs text-purple-700 font-mono">
                  รหัส: {selectedStudentForModal.studentId} • {selectedStudentForModal.groupName}
                </p>
              </div>
              <button onClick={() => setSelectedStudentForModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* History logs for this student */}
            <div className="max-h-72 overflow-y-auto divide-y divide-purple-50">
              {records
                .filter((r) => r.studentId === selectedStudentForModal.studentId)
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((r, i) => (
                  <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                    <span className="font-mono text-purple-900">{formatThaiDate(r.date)}</span>
                    <span className="font-mono text-purple-600 text-[11px]">{r.recordedTime || '-'} น.</span>
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
                  </div>
                ))}
              {records.filter((r) => r.studentId === selectedStudentForModal.studentId).length === 0 && (
                <div className="py-8 text-center text-xs text-gray-400">ยังไม่มีประวัติการเช็คชื่อ</div>
              )}
            </div>

            <div className="pt-2 border-t border-purple-100 text-right">
              <button
                type="button"
                onClick={() => setSelectedStudentForModal(null)}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

