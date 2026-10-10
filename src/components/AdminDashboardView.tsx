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
  ChevronDown,
  ExternalLink,
  GripVertical,
  Megaphone,
  Bell,
  Lock,
  Key,
  Database as DatabaseIcon,
  GraduationCap,
  BookOpen,
  ArrowUp,
  ArrowDown,
  Menu,
  Share2,
  PlusCircle,
  AlertTriangle,
  UserX,
  CheckSquare,
  Square,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import {
  AttendanceRecord,
  TeacherSummary,
  StudentSummary,
  DailySummary,
  SubAdmin,
  Teacher,
  Student,
  Announcement,
  GroupLevel,
  SemesterSettings,
} from '@/lib/types';
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
  addStudentsBatch,
  addTeachersBatch,
  deleteStudent,
  deleteTeacher,
  getActiveMajors,
  addNewMajor,
  deleteCustomMajor,
  getStudentMajor,
  inferMajorFromStudentId,
  DEFAULT_MAJORS,
  getGroupLevel,
  setGroupLevel,
  promoteGroupLevel,
  demoteGroupLevel,
  getStudentLevel,
  setStudentLevel,
  promoteStudentLevel,
  demoteStudentLevel,
  promoteAcademicYear,
  getSemesterSettings,
  saveSemesterSettings,
  exportFullDatabaseJson,
  importFullDatabaseJson,
  renameMajor,
  setCurrentTerm,
  getTermKey,
  isRecordInTerm,
  getTermHistory,
  promoteSelectedStudents,
  setStudentYearLevel,
  batchAssignStudentsToTeacher,
  deleteStudentsBatch,
  getFeedbacks,
  FEEDBACKS_UPDATED_EVENT,
} from '@/lib/data-store';
import {
  exportToExcel,
  exportToWord,
  downloadPdfReport,
  printReport,
  exportComprehensiveMasterExcel,
  exportGroupDetailedExcel,
  downloadStudentImportTemplate,
} from '@/lib/export-utils';
import { getSubAdmins, addSubAdmin, deleteSubAdmin, pushSubAdminAdd, pushSubAdminDelete } from '@/lib/admin-auth';
import { setSavedLogo, pushAnnouncements, pushSemester, pushLogo, restoreFromGoogleSheet, pushFacultyPassword, pushMasterAdminPassword, pushDeleteStudent, pushDeleteStudentsBatch, pushDeleteTeacher } from '@/lib/api-client';
import { ModalPortal } from './ModalPortal';
import { PinProjectorModal } from './PinProjectorModal';
import { AdminManualModal } from './AdminManualModal';
import { ExcelImportModal } from './ExcelImportModal';
import { CertificateStudioModal } from './CertificateStudioModal';
import { TeacherDetailPanel } from './admin/TeacherDetailPanel';
import { TransferPanel } from './admin/TransferPanel';
import { AnnouncementsPanel } from './admin/AnnouncementsPanel';
import { MajorsPanel } from './admin/MajorsPanel';
import { TermManager } from './admin/TermManager';
import { FeedbackPanel } from './admin/FeedbackPanel';
import { savePendingReportPdf } from './PendingReport';
import { buildPendingShareUrl, PendingSnapshot } from '@/lib/pending-report';

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

type TabType =
  | 'overview'
  | 'teachers'
  | 'pending'
  | 'levels'
  | 'matrix'
  | 'analytics'
  | 'periodic'
  | 'transfer'
  | 'editor'
  | 'announcements'
  | 'feedbacks'
  | 'system_management'
  | 'certificates'
  | 'export';


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
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Active Teachers, Students, & Majors state from data-store
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [majorsList, setMajorsList] = useState<string[]>([]);
  const [newMajorInput, setNewMajorInput] = useState('');
  const [majorMsg, setMajorMsg] = useState<{ text: string; success: boolean } | null>(null);

  const reloadDataStore = () => {
    setTeachers(getActiveTeachers());
    setStudents(getActiveStudents());
    setMajorsList(getActiveMajors());
  };

  useEffect(() => {
    reloadDataStore();
  }, []);

  // ==================== LEVEL MANAGEMENT STATE (ระดับ 01, 02, 03) ====================
  const [levelFilter, setLevelFilter] = useState<'all' | '01' | '02' | '03'>('all');
  const [levelSearchTerm, setLevelSearchTerm] = useState('');
  const [cascadeLevelToStudents, setCascadeLevelToStudents] = useState(true);
  const [expandedLevelGroup, setExpandedLevelGroup] = useState<string | null>(null);
  const [levelActionMsg, setLevelActionMsg] = useState<{ text: string; success: boolean } | null>(null);

  // ==================== SEMESTER & PROMOTION STATE ====================
  const [semesterSettings, setSemesterSettings] = useState<SemesterSettings>(() => getSemesterSettings());
  const [promotionResult, setPromotionResult] = useState<string | null>(null);
  const [backupRestoreMsg, setBackupRestoreMsg] = useState<{ text: string; success: boolean } | null>(null);
  const restoreFileInputRef = useRef<HTMLInputElement>(null);

  const handlePromoteGroupLevelAdmin = (teacherName: string) => {
    const res = promoteGroupLevel(teacherName, cascadeLevelToStudents);
    setLevelActionMsg({ text: res.message, success: res.success });
    reloadDataStore();
    setTimeout(() => setLevelActionMsg(null), 4000);
  };

  const handleDemoteGroupLevelAdmin = (teacherName: string) => {
    const res = demoteGroupLevel(teacherName, cascadeLevelToStudents);
    setLevelActionMsg({ text: res.message, success: res.success });
    reloadDataStore();
    setTimeout(() => setLevelActionMsg(null), 4000);
  };

  const handleSetGroupLevelAdmin = (teacherName: string, newLevel: GroupLevel) => {
    const res = setGroupLevel(teacherName, newLevel, cascadeLevelToStudents);
    setLevelActionMsg({ text: res.message, success: res.success });
    reloadDataStore();
    setTimeout(() => setLevelActionMsg(null), 4000);
  };

  const handlePromoteStudentLevelAdmin = (studentId: string) => {
    const res = promoteStudentLevel(studentId);
    setLevelActionMsg({ text: res.message, success: res.success });
    reloadDataStore();
    setTimeout(() => setLevelActionMsg(null), 4000);
  };

  const handleDemoteStudentLevelAdmin = (studentId: string) => {
    const res = demoteStudentLevel(studentId);
    setLevelActionMsg({ text: res.message, success: res.success });
    reloadDataStore();
    setTimeout(() => setLevelActionMsg(null), 4000);
  };

  const handleExecuteAcademicYearPromotion = () => {
    const confirmPrompt = window.confirm(
      'คำเตือน: การเลื่อนชั้นปีการศึกษาจะปรับระดับชั้นของนักศึกษาทุกคนดังนี้:\n- ชั้นปีที่ 2 -> ชั้นปีที่ 3\n- ชั้นปีที่ 3 -> ชั้นปีที่ 4 (และปรับหลักสูตรเป็น "การสอน...")\n- ชั้นปีที่ 4 -> "สำเร็จการศึกษา"\n\nคุณแน่ใจหรือไม่ว่าต้องการดำเนินการเลื่อนชั้นปีการศึกษา?'
    );
    if (!confirmPrompt) return;

    const res = promoteAcademicYear();
    reloadDataStore();
    setPromotionResult(res.message);
  };

  const handleDownloadFullBackup = () => {
    const jsonStr = exportFullDatabaseJson();
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `halaqah_full_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setBackupRestoreMsg({ text: 'ดาวน์โหลดไฟล์สำรองข้อมูล JSON เรียบร้อยแล้ว', success: true });
    setTimeout(() => setBackupRestoreMsg(null), 4000);
  };

  const handleRestoreFullBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;
      const res = importFullDatabaseJson(content);
      reloadDataStore();
      setBackupRestoreMsg({ text: res.message, success: res.success });
      setTimeout(() => setBackupRestoreMsg(null), 5000);
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const [semesterSavedMsg, setSemesterSavedMsg] = useState<string | null>(null);

  const handleSaveSemesterConfig = async () => {
    saveSemesterSettings(semesterSettings);
    setSemesterSavedMsg('กำลังซิงค์ขึ้นฐานข้อมูลกลาง...');
    const res = await pushSemester(semesterSettings);
    if (res.success) {
      setSemesterSavedMsg('บันทึกและซิงค์เป้าหมายภาคเรียนไปยังทุกอุปกรณ์สำเร็จ');
    } else {
      setSemesterSavedMsg(`บันทึกในเครื่องแล้ว (${res.message || 'ยังไม่ซิงค์'})`);
    }
    setTimeout(() => setSemesterSavedMsg(null), 4000);
  };

  const uniqueRecordedDatesCount = useMemo(() => {
    return new Set(records.map((r) => r.date)).size;
  }, [records]);
  // ==================== MATRIX VIEW STATE (ตามรูปแนบ 4) ====================
  const [matrixTeacherName, setMatrixTeacherName] = useState<string>('');
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);


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
  const [editorSubTab, setEditorSubTab] = useState<'students' | 'teachers' | 'majors'>('students');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [originalStudentId, setOriginalStudentId] = useState<string>('');
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [originalTeacherName, setOriginalTeacherName] = useState<string>('');
  const [editorMsg, setEditorMsg] = useState<{ text: string; success: boolean } | null>(null);
  const [editorSearch, setEditorSearch] = useState('');

  // ==================== STUDENT FILTER & BATCH ASSIGN STATE ====================
  const [studentStatusFilter, setStudentStatusFilter] = useState<'all' | 'unassigned' | 'assigned' | 'duplicate'>('all');
  const [studentYearFilter, setStudentYearFilter] = useState<string>('all');
  const [studentGenderFilter, setStudentGenderFilter] = useState<string>('all');
  const [studentMajorFilter, setStudentMajorFilter] = useState<string>('all');
  const [studentTeacherFilter, setStudentTeacherFilter] = useState<string>('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [batchTargetTeacher, setBatchTargetTeacher] = useState<string>('');
  const [isBatchAssigning, setIsBatchAssigning] = useState<boolean>(false);

  // ==================== ANONYMOUS FEEDBACKS STATE ====================
  const [unreadFeedbacksCount, setUnreadFeedbacksCount] = useState<number>(() => {
    return getFeedbacks().filter((f) => f.status === 'unread').length;
  });

  useEffect(() => {
    const syncFb = () => {
      setUnreadFeedbacksCount(getFeedbacks().filter((f) => f.status === 'unread').length);
    };
    window.addEventListener(FEEDBACKS_UPDATED_EVENT, syncFb);
    window.addEventListener('storage', syncFb);
    return () => {
      window.removeEventListener(FEEDBACKS_UPDATED_EVENT, syncFb);
      window.removeEventListener('storage', syncFb);
    };
  }, []);

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

  // ==================== EXPORT CENTER ADVANCED STATE ====================
  const [exportMode, setExportMode] = useState<'master' | 'group'>('master');
  const [exportSelectedTeacher, setExportSelectedTeacher] = useState<string>('');

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
    setIsAddAnnouncementModalOpen(false);
    setAnnToast({ text: 'โพสต์ประกาศส่งไปยังระบบนักศึกษาเรียบร้อยแล้ว!', success: true });
    setTimeout(() => setAnnToast(null), 4000);
  };

  const syncAnnouncements = async () => {
    const res = await pushAnnouncements(getAnnouncements());
    setSyncToast(res.message);
    setTimeout(() => setSyncToast(null), 5000);
  };

  const handleCreateAnnouncementData = (data: Omit<Announcement, 'id' | 'createdAt'>) => {
    addAnnouncement(data);
    setAnnouncementsList(getAnnouncements());
    syncAnnouncements();
  };

  const handleDeleteAnnouncement = (id: string) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบประกาศนี้?')) {
      deleteAnnouncement(id);
      setAnnouncementsList(getAnnouncements());
      syncAnnouncements();
    }
  };

  // ==================== FACULTY PASSWORD STATE ====================
  const [facultyPass, setFacultyPass] = useState('');
  const [newFacultyPass, setNewFacultyPass] = useState('');
  const [facultyPassMsg, setFacultyPassMsg] = useState<{ text: string; success: boolean } | null>(null);
  const [isSavingFacultyPass, setIsSavingFacultyPass] = useState(false);

  useEffect(() => {
    setFacultyPass(getFacultyPassword());
  }, []);

  const handleSaveFacultyPass = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFacultyPass.trim();
    if (!trimmed || trimmed.length < 4) {
      setFacultyPassMsg({ text: 'รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร', success: false });
      return;
    }
    setIsSavingFacultyPass(true);
    setFacultyPassMsg(null);
    try {
      const res = await pushFacultyPassword(trimmed);
      setFacultyPass(trimmed);
      setNewFacultyPass('');
      setFacultyPassMsg({
        text: res.message || 'บันทึกและซิงค์รหัสผ่านไปยังทุกอุปกรณ์ (รวมถึง PWA บนมือถือ) เรียบร้อยแล้ว',
        success: res.success,
      });
    } catch (err: any) {
      setFacultyPassMsg({ text: `เกิดข้อผิดพลาด: ${err?.message || err}`, success: false });
    } finally {
      setIsSavingFacultyPass(false);
      setTimeout(() => setFacultyPassMsg(null), 5000);
    }
  };

  // ==================== MASTER ADMIN PASSWORD STATE ====================
  const [newMasterAdminPass, setNewMasterAdminPass] = useState('');
  const [confirmMasterAdminPass, setConfirmMasterAdminPass] = useState('');
  const [masterAdminPassMsg, setMasterAdminPassMsg] = useState<{ text: string; success: boolean } | null>(null);
  const [isSavingMasterAdminPass, setIsSavingMasterAdminPass] = useState(false);

  const handleSaveMasterAdminPass = async (e: React.FormEvent) => {
    e.preventDefault();
    const pass = newMasterAdminPass.trim();
    if (!pass || pass.length < 4) {
      setMasterAdminPassMsg({ text: 'รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร', success: false });
      return;
    }
    if (pass !== confirmMasterAdminPass.trim()) {
      setMasterAdminPassMsg({ text: 'รหัสผ่านยืนยันไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง', success: false });
      return;
    }
    setIsSavingMasterAdminPass(true);
    setMasterAdminPassMsg(null);
    try {
      const res = await pushMasterAdminPassword(pass);
      if (res.success) {
        setNewMasterAdminPass('');
        setConfirmMasterAdminPass('');
        try {
          sessionStorage.setItem('halaqah_admin_key', pass);
        } catch {}
      }
      setMasterAdminPassMsg({ text: res.message, success: res.success });
    } catch (err: any) {
      setMasterAdminPassMsg({ text: `เกิดข้อผิดพลาด: ${err?.message || err}`, success: false });
    } finally {
      setIsSavingMasterAdminPass(false);
      setTimeout(() => setMasterAdminPassMsg(null), 5000);
    }
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

    const target = semesterSettings.targetSessions || 12;
    return students.map((st) => {
      const recs = map.get(st.studentId) || [];
      const present = recs.filter((r) => r.status === 'มา').length;
      const absent = recs.filter((r) => r.status === 'ขาด').length;
      const leave = recs.filter((r) => r.status === 'ลา').length;
      const total = recs.length;
      // ผูก % การเข้าร่วมกับจำนวนครั้งที่กำหนดโดยแอดมิน (targetSessions)
      const rate = target > 0 ? Math.min(100, (present / target) * 100) : 0;
      const latest = recs[recs.length - 1];

      return {
        studentId: st.studentId,
        fullName: st.fullName,
        major: getStudentMajor(st),
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
  }, [records, students, semesterSettings]);

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

  const matrixUniqueDates = matrixTeacherDates;

  const matrixRecords = useMemo(() => {
    if (!matrixCurrentTeacher) return [];
    return records.filter((r) => r.teacherName === matrixCurrentTeacher.name);
  }, [matrixCurrentTeacher, records]);

  const matrixStudentSummaries = useMemo(() => {
    return matrixStudents.map((st) => {
      const studentRecs = matrixRecords.filter((r) => r.studentId === st.studentId);
      const attendanceMap: Record<string, string> = {};
      let present = 0;
      let absent = 0;
      let leave = 0;

      studentRecs.forEach((r) => {
        attendanceMap[r.date] = r.status;
        if (r.status === 'มา') present++;
        else if (r.status === 'ขาด') absent++;
        else if (r.status === 'ลา') leave++;
      });

      // ผูก % การเข้าร่วมกับจำนวนครั้งที่กำหนดโดยแอดมิน (targetSessions)
      const target = semesterSettings.targetSessions || matrixUniqueDates.length || 12;
      const rate = target > 0 ? Math.min(100, (present / target) * 100) : 0;
      const evaluation = rate >= 80 ? 'ผ่าน' : 'ไม่ผ่าน';

      return {
        studentId: st.studentId,
        name: st.fullName,
        major: getStudentMajor(st),
        attendanceMap,
        present,
        absent,
        leave,
        rate,
        evaluation,
      };
    });
  }, [matrixStudents, matrixRecords, matrixUniqueDates, semesterSettings]);

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

  // Batch Transfer handler
  const handleTransferBatch = (studentIds: string[], targetTeacher: string) => {
    if (studentIds.length === 0 || !targetTeacher) return;
    let count = 0;
    studentIds.forEach((sid) => {
      const res = moveStudentToTeacher(sid, targetTeacher);
      if (res.success) count++;
    });
    reloadDataStore();
    setSelectedLeftStudents([]);
    setSelectedRightStudents([]);
    setTransferToast({
      text: `ย้ายนักศึกษา ${count} คน เข้าสู่กลุ่ม ${targetTeacher} เรียบร้อยแล้ว`,
      success: true,
    });
    setSyncToast(`ย้ายนักศึกษา ${count} คน`);
    setTimeout(() => {
      setTransferToast(null);
      setSyncToast(null);
    }, 4000);
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
          pushLogo(base64).catch(() => null);
          alert('เปลี่ยนรูปโลโก้ระบบและเริ่มซิงค์ไปยังทุกอุปกรณ์เรียบร้อยแล้ว');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetLogo = () => {
    if (confirm('คุณต้องการรีเซ็ตโลโก้กลับเป็นรูปทางการเริ่มต้นหรือไม่?')) {
      setSavedLogo('');
      if (onLogoUpdated) onLogoUpdated('/logo.png');
      pushLogo('').catch(() => null);
      alert('รีเซ็ตโลโก้กลับเป็นรูปทางการเริ่มต้นเรียบร้อยแล้ว');
    }
  };

  // Save student edit
  const handleSaveStudentEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    const lookupId = originalStudentId || editingStudent.studentId;
    const res = updateStudentInfo(lookupId, editingStudent);
    setEditorMsg({ text: res.message, success: res.success });
    if (res.success) {
      reloadDataStore();
      setEditingStudent(null);
      setOriginalStudentId('');
    }
  };

  // Save teacher edit
  const handleSaveTeacherEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    const lookupName = originalTeacherName || editingTeacher.name;
    const res = updateTeacherInfo(lookupName, {
      name: editingTeacher.name,
      groupName: editingTeacher.groupName,
      yearLevel: editingTeacher.yearLevel,
      gender: editingTeacher.gender,
    });
    setEditorMsg({ text: res.message, success: res.success });
    if (res.success) {
      reloadDataStore();
      setEditingTeacher(null);
      setOriginalTeacherName('');
    }
  };

  // Delete student handler
  const handleDeleteStudent = (studentId: string, studentName: string) => {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนักศึกษา "${studentName}" (${studentId})?`)) {
      const res = deleteStudent(studentId);
      setEditorMsg({ text: res.message, success: res.success });
      if (res.success) {
        reloadDataStore();
        // ส่งคำสั่งลบไปยัง Google Sheet ทันที (พร้อมลบประวัติการเช็คชื่อถ้ามี)
        pushDeleteStudent(studentId, true).catch(() => null);
      }
    }
  };

  // Delete teacher handler
  const handleDeleteTeacher = (teacherName: string) => {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบอาจารย์ "${teacherName}"? (ข้อมูลนักศึกษาในกลุ่มเดิมจะยังคงอยู่)`)) {
      const res = deleteTeacher(teacherName);
      setEditorMsg({ text: res.message, success: res.success });
      if (res.success) {
        reloadDataStore();
        // ส่งคำสั่งลบไปยัง Google Sheet ทันที
        pushDeleteTeacher(teacherName).catch(() => null);
      }
    }
  };

  // ==================== STUDENT FILTER & BATCH ACTIONS ====================
  const activeTeacherNamesSet = useMemo(() => {
    return new Set(teachers.map((t) => t.name.trim()));
  }, [teachers]);

  const isStudentUnassigned = useMemo(() => {
    return (s: Student) => {
      if (!s.teacherName) return true;
      const tn = s.teacherName.trim();
      if (tn === '' || tn === '-' || tn.includes('ไม่ระบุ') || tn.includes('ตกหล่น')) return true;
      return !activeTeacherNamesSet.has(tn);
    };
  }, [activeTeacherNamesSet]);

  const unassignedStudentsCount = useMemo(() => {
    return students.filter(isStudentUnassigned).length;
  }, [students, isStudentUnassigned]);

  const assignedStudentsCount = useMemo(() => {
    return students.length - unassignedStudentsCount;
  }, [students, unassignedStudentsCount]);

  // ระบบตรวจสอบนักศึกษาที่มีรหัสหรือชื่อซ้ำกัน
  const duplicateStudentInfo = useMemo(() => {
    const idCounts = new Map<string, number>();
    const nameCounts = new Map<string, number>();

    students.forEach((s) => {
      const id = (s.studentId || '').trim().toLowerCase();
      if (id) idCounts.set(id, (idCounts.get(id) || 0) + 1);

      const name = (s.fullName || '').trim().replace(/\s+/g, ' ').toLowerCase();
      if (name) nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
    });

    const duplicateIdSet = new Set<string>();
    const duplicateNameSet = new Set<string>();

    idCounts.forEach((count, id) => {
      if (count > 1) duplicateIdSet.add(id);
    });
    nameCounts.forEach((count, name) => {
      if (count > 1) duplicateNameSet.add(name);
    });

    const isDuplicate = (s: Student) => {
      const id = (s.studentId || '').trim().toLowerCase();
      const name = (s.fullName || '').trim().replace(/\s+/g, ' ').toLowerCase();
      return Boolean((id && duplicateIdSet.has(id)) || (name && duplicateNameSet.has(name)));
    };

    const getDuplicateReason = (s: Student) => {
      const id = (s.studentId || '').trim().toLowerCase();
      const name = (s.fullName || '').trim().replace(/\s+/g, ' ').toLowerCase();
      const hasId = id && duplicateIdSet.has(id);
      const hasName = name && duplicateNameSet.has(name);
      if (hasId && hasName) return 'รหัสและชื่อซ้ำ';
      if (hasId) return 'รหัสนักศึกษาซ้ำ';
      if (hasName) return 'ชื่อ-นามสกุลซ้ำ';
      return null;
    };

    const duplicateList = students.filter(isDuplicate);
    return {
      duplicateIdSet,
      duplicateNameSet,
      isDuplicate,
      getDuplicateReason,
      count: duplicateList.length,
    };
  }, [students]);

  const filteredStudents = useMemo(() => {
    const matched = students.filter((s) => {
      // 1. Status filter (all | unassigned | assigned | duplicate)
      if (studentStatusFilter === 'unassigned' && !isStudentUnassigned(s)) return false;
      if (studentStatusFilter === 'assigned' && isStudentUnassigned(s)) return false;
      if (studentStatusFilter === 'duplicate' && !duplicateStudentInfo.isDuplicate(s)) return false;

      // 2. Year level filter
      if (studentYearFilter !== 'all' && s.yearLevel !== studentYearFilter) return false;

      // 3. Gender filter
      if (studentGenderFilter !== 'all' && s.gender !== studentGenderFilter) return false;

      // 4. Major filter
      if (studentMajorFilter !== 'all') {
        const major = getStudentMajor(s);
        if (major !== studentMajorFilter) return false;
      }

      // 5. Specific Teacher filter
      if (studentTeacherFilter !== 'all') {
        if (studentTeacherFilter === '__unassigned__') {
          if (!isStudentUnassigned(s)) return false;
        } else if (s.teacherName !== studentTeacherFilter) {
          return false;
        }
      }

      // 6. Search input (รหัส, ชื่อ, อาจารย์, สาขา, กลุ่ม)
      if (editorSearch.trim()) {
        const q = editorSearch.toLowerCase().trim();
        const sMajor = getStudentMajor(s).toLowerCase();
        const match =
          s.fullName.toLowerCase().includes(q) ||
          s.studentId.toLowerCase().includes(q) ||
          (s.teacherName && s.teacherName.toLowerCase().includes(q)) ||
          sMajor.includes(q) ||
          (s.groupName && s.groupName.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });

    // หากกำลังกรองรายชื่อซ้ำ ให้เรียงกลุ่มซ้ำติดกัน เพื่อให้แอดมินเปรียบเทียบได้ง่าย
    if (studentStatusFilter === 'duplicate') {
      return [...matched].sort((a, b) => {
        const aId = (a.studentId || '').trim().toLowerCase();
        const bId = (b.studentId || '').trim().toLowerCase();
        if (duplicateStudentInfo.duplicateIdSet.has(aId) && aId === bId) {
          return a.fullName.localeCompare(b.fullName, 'th');
        }
        const aName = (a.fullName || '').trim().replace(/\s+/g, ' ').toLowerCase();
        const bName = (b.fullName || '').trim().replace(/\s+/g, ' ').toLowerCase();
        if (duplicateStudentInfo.duplicateNameSet.has(aName) && aName === bName) {
          return a.studentId.localeCompare(b.studentId);
        }
        if (duplicateStudentInfo.duplicateIdSet.has(aId) && duplicateStudentInfo.duplicateIdSet.has(bId)) {
          return aId.localeCompare(bId);
        }
        return aName.localeCompare(bName, 'th');
      });
    }

    return matched;
  }, [
    students,
    studentStatusFilter,
    studentYearFilter,
    studentGenderFilter,
    studentMajorFilter,
    studentTeacherFilter,
    editorSearch,
    isStudentUnassigned,
    duplicateStudentInfo,
  ]);

  const isAllFilteredSelected = useMemo(() => {
    if (filteredStudents.length === 0) return false;
    return filteredStudents.every((s) => selectedStudentIds.includes(s.studentId));
  }, [filteredStudents, selectedStudentIds]);

  const handleToggleSelectAllStudents = () => {
    if (isAllFilteredSelected) {
      const filteredIds = new Set(filteredStudents.map((s) => s.studentId));
      setSelectedStudentIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      const newIds = filteredStudents.map((s) => s.studentId);
      setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...newIds])));
    }
  };

  const handleToggleSelectStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSelectAllUnassigned = () => {
    const unassigned = students.filter(isStudentUnassigned);
    setSelectedStudentIds(unassigned.map((s) => s.studentId));
    setStudentStatusFilter('unassigned');
  };

  const handleBatchAssignTeacher = () => {
    if (!batchTargetTeacher) {
      setEditorMsg({ text: 'กรุณาเลือกอาจารย์ผู้ดูแลเป้าหมาย', success: false });
      return;
    }
    if (selectedStudentIds.length === 0) {
      setEditorMsg({ text: 'กรุณาเลือกนักศึกษาอย่างน้อย 1 คน', success: false });
      return;
    }

    setIsBatchAssigning(true);
    const res = batchAssignStudentsToTeacher(selectedStudentIds, batchTargetTeacher);
    setIsBatchAssigning(false);

    setEditorMsg({ text: res.message, success: res.success });
    if (res.success) {
      setSelectedStudentIds([]);
      reloadDataStore();
    }
    setTimeout(() => setEditorMsg(null), 5000);
  };

  const handleBatchDeleteStudents = () => {
    if (selectedStudentIds.length === 0) {
      setEditorMsg({ text: 'กรุณาเลือกนักศึกษาที่ต้องการลบอย่างน้อย 1 คน', success: false });
      return;
    }

    const confirmMsg = `⚠️ คำเตือนสำคัญ:\nคุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนักศึกษาที่เลือกจำนวน ${selectedStudentIds.length} คน ออกจากระบบอย่างถาวร?\n\n(การดำเนินการนี้จะลบข้อมูลออกและไม่สามารถกู้คืนกลับมาได้)`;
    if (!window.confirm(confirmMsg)) {
      return;
    }

    const toDeleteIds = [...selectedStudentIds];
    const res = deleteStudentsBatch(toDeleteIds);
    setEditorMsg({ text: res.message, success: res.success });
    if (res.success) {
      setSelectedStudentIds([]);
      reloadDataStore();
      pushDeleteStudentsBatch(toDeleteIds, true).catch(() => null);
    }
    setTimeout(() => setEditorMsg(null), 5000);
  };

  const hasActiveStudentFilters =
    studentStatusFilter !== 'all' ||
    studentYearFilter !== 'all' ||
    studentGenderFilter !== 'all' ||
    studentMajorFilter !== 'all' ||
    studentTeacherFilter !== 'all' ||
    editorSearch.trim() !== '';

  const handleResetStudentFilters = () => {
    setStudentStatusFilter('all');
    setStudentYearFilter('all');
    setStudentGenderFilter('all');
    setStudentMajorFilter('all');
    setStudentTeacherFilter('all');
    setEditorSearch('');
  };

  // Manual / Guide & Quick Modal States
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isCertStudioOpen, setIsCertStudioOpen] = useState(false);
  const [isAddAnnouncementModalOpen, setIsAddAnnouncementModalOpen] = useState(false);
  const [isAddSubAdminModalOpen, setIsAddSubAdminModalOpen] = useState(false);
  const [isAddMajorModalOpen, setIsAddMajorModalOpen] = useState(false);
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);
  const [isPinProjectorOpen, setIsPinProjectorOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Transfer dual-column states
  const [selectedLeftStudents, setSelectedLeftStudents] = useState<string[]>([]);
  const [selectedRightStudents, setSelectedRightStudents] = useState<string[]>([]);
  const [leftSearchTerm, setLeftSearchTerm] = useState('');
  const [rightSearchTerm, setRightSearchTerm] = useState('');

  // Show manual guide automatically only once on this device
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const seen = localStorage.getItem('halaqah_admin_manual_seen_v1');
      if (!seen) {
        setIsManualModalOpen(true);
      }
    }
  }, []);

  // 1. Single Student Add State
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [newStudentData, setNewStudentData] = useState<Partial<Student>>({
    studentId: '',
    fullName: '',
    gender: 'ชาย',
    yearLevel: 'ปี 2',
    teacherName: '',
    groupName: '',
    major: '',
  });

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentData.studentId?.trim() || !newStudentData.fullName?.trim()) {
      alert('กรุณากรอกรหัสนักศึกษาและชื่อ-นามสกุลให้ครบถ้วน');
      return;
    }
    const cleanId = newStudentData.studentId.trim();
    const t = teachers.find((item) => item.name === newStudentData.teacherName) || teachers[0];
    const res = addStudentsBatch([
      {
        studentId: cleanId,
        fullName: newStudentData.fullName.trim(),
        gender: newStudentData.gender || 'ชาย',
        yearLevel: newStudentData.yearLevel || t?.yearLevel || 'ปี 2',
        groupName: newStudentData.groupName?.trim() || t?.groupName || 'กลุ่มศึกษา',
        teacherName: t ? t.name : 'ไม่ระบุอาจารย์',
        groupId: t ? t.groupId : '',
        major: (newStudentData.major || '').trim() || inferMajorFromStudentId(cleanId, newStudentData.yearLevel || t?.yearLevel || 'ปี 2'),
      },
    ]);
    setEditorMsg({ text: res.message, success: res.success });
    if (res.success) {
      reloadDataStore();
      setIsAddStudentModalOpen(false);
      setNewStudentData({ studentId: '', fullName: '', gender: 'ชาย', yearLevel: 'ปี 2', teacherName: '', groupName: '', major: '' });
    }
  };

  // Major Management Handlers
  const handleAddNewMajor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMajorInput.trim()) return;
    const res = addNewMajor(newMajorInput.trim());
    setMajorMsg({ text: res.message, success: res.success });
    if (res.success) {
      reloadDataStore();
      setNewMajorInput('');
      setIsAddMajorModalOpen(false);
    }
    setTimeout(() => setMajorMsg(null), 4000);
  };

  const handleDeleteMajor = (name: string) => {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบสาขาวิชา "${name}"?`)) {
      const res = deleteCustomMajor(name);
      setMajorMsg({ text: res.message, success: res.success });
      if (res.success) {
        reloadDataStore();
      }
      setTimeout(() => setMajorMsg(null), 4000);
    }
  };

  // 2. Single Teacher Add State
  const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState(false);
  const [newTeacherData, setNewTeacherData] = useState<Partial<Teacher>>({
    name: '',
    groupName: '',
    gender: 'ชาย',
    yearLevel: 'ปี 2',
  });

  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherData.name?.trim()) {
      alert('กรุณากรอกชื่อ-สกุล อาจารย์');
      return;
    }
    const res = addTeachersBatch([
      {
        name: newTeacherData.name.trim(),
        groupName: newTeacherData.groupName?.trim() || `กลุ่ม ${newTeacherData.name.trim()}`,
        gender: newTeacherData.gender || 'ชาย',
        yearLevel: newTeacherData.yearLevel || 'ปี 2',
        groupId: `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      },
    ]);
    setEditorMsg({ text: res.message, success: res.success });
    if (res.success) {
      reloadDataStore();
      setIsAddTeacherModalOpen(false);
      setNewTeacherData({ name: '', groupName: '', gender: 'ชาย', yearLevel: 'ปี 2' });
    }
  };

  // 3. Bulk Paste / Import Modal State
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [bulkImportType, setBulkImportType] = useState<'students' | 'teachers'>('students');
  const [bulkRawText, setBulkRawText] = useState('');
  const [bulkDefaultTeacher, setBulkDefaultTeacher] = useState('');
  const [bulkDefaultYear, setBulkDefaultYear] = useState('ปี 2');
  const [bulkDefaultGender, setBulkDefaultGender] = useState<'ชาย' | 'หญิง'>('ชาย');

  // Bulk Process
  const handleProcessBulkImport = () => {
    if (!bulkRawText.trim()) {
      alert('กรุณาวางหรือพิมพ์ข้อมูลก่อนดำเนินการ');
      return;
    }

    const lines = bulkRawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      alert('ไม่พบข้อมูลในข้อความที่วาง');
      return;
    }

    if (bulkImportType === 'students') {
      const parsedStudents: Student[] = [];
      const defaultT = teachers.find((t) => t.name === bulkDefaultTeacher) || teachers[0];

      lines.forEach((line) => {
        // Support Tab separated (from Excel/Sheets) or comma separated or pipe or spaces
        let parts = line.split('\t');
        if (parts.length === 1 && line.includes(',')) parts = line.split(',');
        else if (parts.length === 1 && line.includes('|')) parts = line.split('|');
        
        parts = parts.map((p) => p.trim());

        if (parts.length >= 2) {
          // Format: ID, Name, (Optional: Gender, Year, Teacher, Group)
          const sid = parts[0];
          const name = parts[1];
          const gender = parts[2] && (parts[2].includes('หญิง') || parts[2].toLowerCase() === 'f') ? 'หญิง' : (parts[2] && parts[2].includes('ชาย') ? 'ชาย' : bulkDefaultGender);
          const year = parts[3] || bulkDefaultYear;
          const teacher = parts[4] || (defaultT ? defaultT.name : 'ไม่ระบุอาจารย์');
          const group = parts[5] || (defaultT ? defaultT.groupName : 'กลุ่มศึกษา');

          parsedStudents.push({
            studentId: sid,
            fullName: name,
            gender: gender as 'ชาย' | 'หญิง',
            yearLevel: year,
            teacherName: teacher,
            groupName: group,
            groupId: defaultT ? defaultT.groupId : '',
            major: parts[6] || inferMajorFromStudentId(sid, year),
          });
        } else if (parts.length === 1) {
          // Check if it's just ID or contains space
          const spaceParts = line.split(/\s+/);
          if (spaceParts.length >= 2) {
            const sid = spaceParts[0];
            const name = spaceParts.slice(1).join(' ');
            parsedStudents.push({
              studentId: sid,
              fullName: name,
              gender: bulkDefaultGender,
              yearLevel: bulkDefaultYear,
              teacherName: defaultT ? defaultT.name : 'ไม่ระบุอาจารย์',
              groupName: defaultT ? defaultT.groupName : 'กลุ่มศึกษา',
              groupId: defaultT ? defaultT.groupId : '',
              major: inferMajorFromStudentId(sid, bulkDefaultYear),
            });
          }
        }
      });

      if (parsedStudents.length === 0) {
        alert('ไม่สามารถแยกข้อมูลได้ กรุณาตรวจสอบรูปแบบข้อความ (เช่น รหัสนักศึกษา [วรรคหรือ Tab] ชื่อ-นามสกุล)');
        return;
      }

      const res = addStudentsBatch(parsedStudents);
      setEditorMsg({ text: res.message, success: res.success });
      if (res.success) {
        reloadDataStore();
        setIsBulkImportModalOpen(false);
        setBulkRawText('');
      }
    } else {
      // Teachers Bulk
      const parsedTeachers: Teacher[] = [];
      lines.forEach((line) => {
        let parts = line.split('\t');
        if (parts.length === 1 && line.includes(',')) parts = line.split(',');
        else if (parts.length === 1 && line.includes('|')) parts = line.split('|');

        parts = parts.map((p) => p.trim());
        const tName = parts[0];
        const gName = parts[1] || `กลุ่ม ${tName}`;
        const gender = parts[2] && (parts[2].includes('หญิง') || parts[2].toLowerCase() === 'f') ? 'หญิง' : (parts[2] && parts[2].includes('ชาย') ? 'ชาย' : bulkDefaultGender);
        const year = parts[3] || bulkDefaultYear;

        if (tName) {
          parsedTeachers.push({
            name: tName,
            groupName: gName,
            gender: gender as 'ชาย' | 'หญิง',
            yearLevel: year,
            groupId: `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          });
        }
      });

      if (parsedTeachers.length === 0) {
        alert('ไม่พบรายชื่ออาจารย์ที่ถูกต้อง');
        return;
      }

      const res = addTeachersBatch(parsedTeachers);
      setEditorMsg({ text: res.message, success: res.success });
      if (res.success) {
        reloadDataStore();
        setIsBulkImportModalOpen(false);
        setBulkRawText('');
      }
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
      setIsAddSubAdminModalOpen(false);
      if (res.admin) {
        pushSubAdminAdd(res.admin).then((r) => {
          setSyncToast(r.message);
          setTimeout(() => setSyncToast(null), 4000);
        });
      }
    } else {
      setSubAdminMsg({ text: res.message, success: false });
    }
  };

  const handleDeleteSubAdmin = (id: string) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบสิทธิ์แอดมินรองนี้?')) {
      deleteSubAdmin(id);
      setSubAdminsList(getSubAdmins());
      pushSubAdminDelete(id).then((r) => {
        setSyncToast(r.message);
        setTimeout(() => setSyncToast(null), 4000);
      });
    }
  };

  // ==================== REAL-TIME CONTROL & STATUS STATE ====================
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState('พร้อมใช้งาน');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(60);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Dropdown states for Top Bar
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isSheetsDropdownOpen, setIsSheetsDropdownOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const sheetsDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setIsExportDropdownOpen(false);
      }
      if (sheetsDropdownRef.current && !sheetsDropdownRef.current.contains(event.target as Node)) {
        setIsSheetsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Set initial update time
  useEffect(() => {
    const now = new Date();
    setLastUpdatedTime(now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' น.');
  }, []);

  // Overview Filters & Sort
  const [overviewSearch, setOverviewSearch] = useState('');
  const [overviewSort, setOverviewSort] = useState<'sessions' | 'rate' | 'default'>('default');

  // Teacher Details Filters
  const [cohortFilter, setCohortFilter] = useState<'all' | 'male' | 'female2' | 'female3' | 'recorded' | 'pending'>('all');
  const [teacherSearch, setTeacherSearch] = useState('');

  const handleManualSync = async (isSilent = false) => {
    if (isSyncing) return;
    setIsSyncing(true);
    if (!isSilent) {
      setSyncToast('⏳ กำลังเชื่อมต่อและซิงค์ข้อมูลสด...');
    }
    try {
      reloadDataStore();
      const now = new Date();
      const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' น.';
      setLastUpdatedTime(timeStr);
      setSyncToast(`✅ ซิงค์ข้อมูลสดเรียบร้อยแล้ว (${timeStr})`);
    } catch {
      reloadDataStore();
      setSyncToast('เชื่อมต่อเสร็จสิ้น (ใช้ข้อมูลที่บันทึกในระบบล่าสุด)');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncToast(null), 3500);
    }
  };

  // Auto-refresh timer
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const interval = setInterval(() => {
      handleManualSync(true);
    }, autoRefreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshInterval]);

  const GOOGLE_SHEETS_SOURCES = [
    {
      id: 'male',
      name: 'ชาย (ทุกชั้นปี) - 12 กลุ่ม',
      url: 'https://docs.google.com/spreadsheets/d/12RUrWwlRFCOITwt3wyYwjxYGsgrJ_P-a8P4UGf_H0_U/edit?gid=1686068478',
    },
    {
      id: 'female2',
      name: 'หญิง (ปี 2) - 15 กลุ่ม',
      url: 'https://docs.google.com/spreadsheets/d/1iCFV5-NCUk3lexSj9VSkKH8WyFTV3523hbskrgOuonQ/edit?gid=456483790',
    },
    {
      id: 'female3',
      name: 'หญิง (ปี 3) - 13 กลุ่ม',
      url: 'https://docs.google.com/spreadsheets/d/1-8VN0z99DCRdI-wY5rzPFYVQieXNvY0tEpcSB1LRnaQ/edit?gid=841705446',
    },
  ];

  // ==================== ภาคการศึกษาที่กำลังดู (ค่าเริ่มต้น = ภาคปัจจุบันที่แอดมินตั้งไว้) ====================
  const [termFilter, setTermFilter] = useState<string>('current');
  const [termHistory, setTermHistory] = useState(() => getTermHistory());
  const [isTermManagerOpen, setIsTermManagerOpen] = useState(false);

  const termOptions = useMemo(() => {
    const currentKey = getTermKey(semesterSettings);
    return termHistory.filter((t) => t.key !== currentKey);
  }, [termHistory, semesterSettings]);

  const filteredRecords = useMemo(() => {
    if (termFilter === 'all') return records;
    if (termFilter === 'current') return records.filter((r) => isRecordInTerm(r, semesterSettings));
    const info = termHistory.find((t) => t.key === termFilter);
    if (!info) return records;
    return records.filter((r) =>
      isRecordInTerm(r, {
        ...semesterSettings,
        academicYear: info.academicYear,
        semesterName: info.semesterName,
        startDate: info.startDate,
        endDate: info.endDate,
      })
    );
  }, [records, termFilter, termHistory, semesterSettings]);

  const termFilterLabel =
    termFilter === 'all'
      ? 'ทุกภาคการศึกษา'
      : termFilter === 'current'
      ? `${semesterSettings.semesterName} ปีการศึกษา ${semesterSettings.academicYear}`
      : (() => {
          const t = termHistory.find((x) => x.key === termFilter);
          return t ? `${t.semesterName} ปีการศึกษา ${t.academicYear}` : termFilter;
        })();

  // ==================== 40 TEACHERS COMPARISON & DETAILED STATS ====================
  const allTeachersComparison = useMemo(() => {
    return teachers.map((t, index) => {
      const groupStudents = students.filter((s) => s.teacherName === t.name);
      // นับตามนักศึกษาในกลุ่มด้วย เพื่อให้นักศึกษาที่ถูกย้ายกลุ่มยังนับเป็นการเช็คชื่อของกลุ่มปัจจุบัน
      const memberIds = new Set(groupStudents.map((s) => s.studentId));
      const teacherRecords = filteredRecords.filter((r) => r.teacherName === t.name || memberIds.has(r.studentId));
      const dates = Array.from(new Set(teacherRecords.map((r) => r.date))).sort();

      let cohort: 'male' | 'female2' | 'female3' = 'male';
      let cohortName = 'ชาย (ทุกชั้นปี)';
      if (t.gender === 'หญิง') {
        if (t.yearLevel?.includes('2') || t.groupName?.includes('ปี 2')) {
          cohort = 'female2';
          cohortName = 'หญิง (ปี 2)';
        } else {
          cohort = 'female3';
          cohortName = 'หญิง (ปี 3)';
        }
      } else {
        cohort = 'male';
        cohortName = 'ชาย (ทุกชั้นปี)';
      }

      const present = teacherRecords.filter((r) => r.status === 'มา').length;
      const absent = teacherRecords.filter((r) => r.status === 'ขาด').length;
      const leave = teacherRecords.filter((r) => r.status === 'ลา').length;
      const totalChecks = present + absent + leave;
      const rate = totalChecks > 0 ? Math.round((present / totalChecks) * 100) : 0;
      const isRecorded = dates.length > 0;

      return {
        index: index + 1,
        id: t.name,
        teacher: t.name,
        group: t.groupName,
        yearLevel: t.yearLevel,
        gender: t.gender,
        cohort,
        cohortName,
        studentsCount: groupStudents.length,
        datesCount: dates.length,
        dates,
        present,
        absent,
        leave,
        rate,
        isRecorded,
        students: groupStudents,
      };
    });
  }, [teachers, students, records]);

  // Overview KPI Stats
  const overviewKpi = useMemo(() => {
    const totalTeachers = allTeachersComparison.length;
    const recordedTeachers = allTeachersComparison.filter((t) => t.isRecorded);
    const recordedCount = recordedTeachers.length;
    const pendingCount = totalTeachers - recordedCount;
    const recordedPercent = totalTeachers > 0 ? ((recordedCount / totalTeachers) * 100).toFixed(1) : '0';

    const totalSessions = allTeachersComparison.reduce((acc, t) => acc + t.datesCount, 0);
    const totalPresent = allTeachersComparison.reduce((acc, t) => acc + t.present, 0);
    const totalAbsent = allTeachersComparison.reduce((acc, t) => acc + t.absent, 0);
    const totalLeave = allTeachersComparison.reduce((acc, t) => acc + t.leave, 0);
    const totalChecks = totalPresent + totalAbsent + totalLeave;

    const avgRate = totalChecks > 0 ? ((totalPresent / totalChecks) * 100).toFixed(1) : '0';
    const absentRate = totalChecks > 0 ? ((totalAbsent / totalChecks) * 100).toFixed(1) : '0';
    const leaveRate = totalChecks > 0 ? ((totalLeave / totalChecks) * 100).toFixed(1) : '0';

    let rateLevel = 'ระดับดี';
    const numRate = parseFloat(avgRate);
    if (numRate >= 85) rateLevel = 'ระดับดีเยี่ยม';
    else if (numRate >= 75) rateLevel = 'ระดับดี';
    else if (numRate >= 60) rateLevel = 'ระดับปานกลาง';
    else rateLevel = 'ต้องปรับปรุง';

    // Top teacher
    const sortedBySessions = [...allTeachersComparison].sort((a, b) => b.datesCount - a.datesCount || b.rate - a.rate);
    const topTeacher = sortedBySessions[0] || null;

    // Cohorts breakdown
    const maleList = allTeachersComparison.filter((t) => t.cohort === 'male');
    const maleRecorded = maleList.filter((t) => t.isRecorded).length;
    const malePercent = maleList.length > 0 ? ((maleRecorded / maleList.length) * 100).toFixed(1) : '0';

    const f2List = allTeachersComparison.filter((t) => t.cohort === 'female2');
    const f2Recorded = f2List.filter((t) => t.isRecorded).length;
    const f2Percent = f2List.length > 0 ? ((f2Recorded / f2List.length) * 100).toFixed(1) : '0';

    const f3List = allTeachersComparison.filter((t) => t.cohort === 'female3');
    const f3Recorded = f3List.filter((t) => t.isRecorded).length;
    const f3Percent = f3List.length > 0 ? ((f3Recorded / f3List.length) * 100).toFixed(1) : '0';

    const totalStudents = students.length;
    const totalCheckins = totalChecks;
    const attendanceRate = totalChecks > 0 ? (totalPresent / totalChecks) * 100 : 0;
    const presentPct = totalChecks > 0 ? (totalPresent / totalChecks) * 100 : 0;
    const absentPct = totalChecks > 0 ? (totalAbsent / totalChecks) * 100 : 0;
    const leavePct = totalChecks > 0 ? (totalLeave / totalChecks) * 100 : 0;

    const malePresent = maleList.reduce((acc, t) => acc + t.present, 0);
    const maleTotalChecks = maleList.reduce((acc, t) => acc + t.present + t.absent + t.leave, 0);
    const maleRate = maleTotalChecks > 0 ? (malePresent / maleTotalChecks) * 100 : 0;

    const f2Present = f2List.reduce((acc, t) => acc + t.present, 0);
    const f2TotalChecks = f2List.reduce((acc, t) => acc + t.present + t.absent + t.leave, 0);
    const f2Rate = f2TotalChecks > 0 ? (f2Present / f2TotalChecks) * 100 : 0;

    const f3Present = f3List.reduce((acc, t) => acc + t.present, 0);
    const f3TotalChecks = f3List.reduce((acc, t) => acc + t.present + t.absent + t.leave, 0);
    const f3Rate = f3TotalChecks > 0 ? (f3Present / f3TotalChecks) * 100 : 0;

    return {
      totalGroups: totalTeachers,
      totalTeachers,
      recordedCount,
      activeTeachers: recordedCount,
      pendingCount,
      recordedPercent,
      totalStudents,
      totalSessions,
      totalCheckins,
      totalPresent,
      presentCount: totalPresent,
      totalAbsent,
      absentCount: totalAbsent,
      totalLeave,
      leaveCount: totalLeave,
      totalChecks,
      attendanceRate,
      avgRate,
      presentPct,
      absentPct,
      leavePct,
      absentRate,
      leaveRate,
      rateLevel,
      topTeacher,
      maleTotal: maleList.length,
      maleRecorded,
      malePercent,
      f2Total: f2List.length,
      f2Recorded,
      f2Percent,
      f3Total: f3List.length,
      f3Recorded,
      f3Percent,
      cohortMale: {
        totalTeachers: maleList.length,
        activeTeachers: maleRecorded,
        rate: maleRate,
        totalCheckins: maleTotalChecks,
      },
      cohortFemale2: {
        totalTeachers: f2List.length,
        activeTeachers: f2Recorded,
        rate: f2Rate,
        totalCheckins: f2TotalChecks,
      },
      cohortFemale3: {
        totalTeachers: f3List.length,
        activeTeachers: f3Recorded,
        rate: f3Rate,
        totalCheckins: f3TotalChecks,
      },
    };
  }, [allTeachersComparison, students.length]);

  // Filtered Overview Teachers for table
  const filteredOverviewTeachers = useMemo(() => {
    let list = allTeachersComparison.filter((t) => {
      if (overviewSearch.trim()) {
        const q = overviewSearch.trim().toLowerCase();
        return (
          t.teacher.toLowerCase().includes(q) ||
          t.group.toLowerCase().includes(q) ||
          t.cohortName.toLowerCase().includes(q)
        );
      }
      return true;
    });

    if (overviewSort === 'sessions') {
      list = [...list].sort((a, b) => b.datesCount - a.datesCount || b.rate - a.rate);
    } else if (overviewSort === 'rate') {
      list = [...list].sort((a, b) => b.rate - a.rate || b.datesCount - a.datesCount);
    }
    return list;
  }, [allTeachersComparison, overviewSearch, overviewSort]);

  // Filtered Teachers for Teacher Details grid
  const filteredTeachersForDetails = useMemo(() => {
    return allTeachersComparison.filter((t) => {
      if (cohortFilter === 'male' && t.cohort !== 'male') return false;
      if (cohortFilter === 'female2' && t.cohort !== 'female2') return false;
      if (cohortFilter === 'female3' && t.cohort !== 'female3') return false;
      if (cohortFilter === 'recorded' && !t.isRecorded) return false;
      if (cohortFilter === 'pending' && t.isRecorded) return false;

      if (teacherSearch.trim()) {
        const q = teacherSearch.trim().toLowerCase();
        return (
          t.teacher.toLowerCase().includes(q) ||
          t.group.toLowerCase().includes(q) ||
          t.cohortName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allTeachersComparison, cohortFilter, teacherSearch]);

  // ==================== CLIENTSIDE EXPORT HELPERS ====================
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 150);
  };

  const exportOverviewExcel = () => {
    let rowsHtml = '';
    allTeachersComparison.forEach((t, i) => {
      rowsHtml += `
        <tr>
          <td style="text-align:center;">${i + 1}</td>
          <td>${t.teacher}</td>
          <td>${t.group}</td>
          <td>${t.cohortName}</td>
          <td style="text-align:center;">${t.studentsCount}</td>
          <td style="text-align:center;">${t.datesCount}</td>
          <td style="text-align:center; color:#065f46;">${t.isRecorded ? t.present : '-'}</td>
          <td style="text-align:center; color:#991b1b;">${t.isRecorded ? t.absent : '-'}</td>
          <td style="text-align:center; color:#92400e;">${t.isRecorded ? t.leave : '-'}</td>
          <td style="text-align:right; font-weight:bold;">${t.isRecorded ? t.rate + '%' : '-'}</td>
          <td style="text-align:center;">${t.isRecorded ? 'บันทึกแล้ว' : 'ยังไม่บันทึก'}</td>
        </tr>
      `;
    });

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Sarabun', 'Tahoma', sans-serif; font-size: 13px; }
          h2 { color: #581c87; margin-bottom: 4px; }
          table { border-collapse: collapse; width: 100%; margin-top: 10px; }
          th { background-color: #581c87; color: #ffffff; font-weight: bold; border: 1px solid #000; padding: 6px 8px; text-align: center; }
          td { border: 1px solid #cbd5e1; padding: 5px 8px; }
          .summary-box { background-color: #fbfbfe; border: 1px solid #e9d5ff; padding: 10px; margin-bottom: 12px; }
        </style>
      </head>
      <body>
        <h2>รายงานสรุปผลการเช็คชื่อกลุ่มศึกษาอัลกุรอาน (หะละเกาะห์) - ภาพรวมโครงการ</h2>
        <div class="summary-box">
          <b>ข้อมูลสรุป ณ วันที่:</b> ${new Date().toLocaleDateString('th-TH')} เวลา ${new Date().toLocaleTimeString('th-TH')} น.<br>
          <b>อาจารย์ทั้งหมด:</b> ${overviewKpi.totalTeachers} ท่าน (บันทึกผลแล้ว ${overviewKpi.recordedCount} ท่าน คิดเป็น ${overviewKpi.recordedPercent}%) | 
          <b>จำนวนครั้งบันทึกรวม:</b> ${overviewKpi.totalSessions} ครั้ง | 
          <b>อัตราการมาเรียนเฉลี่ย:</b> ${overviewKpi.avgRate}% (มา ${overviewKpi.totalPresent} ครั้ง, ขาด ${overviewKpi.totalAbsent} ครั้ง, ลา ${overviewKpi.totalLeave} ครั้ง)
        </div>
        <table>
          <thead>
            <tr>
              <th>ลำดับ</th>
              <th>ชื่ออาจารย์</th>
              <th>กลุ่ม</th>
              <th>ส่วน / ชั้นปี</th>
              <th>นศ. (คน)</th>
              <th>ครั้งที่บันทึก</th>
              <th>มา</th>
              <th>ขาด</th>
              <th>ลา</th>
              <th>อัตรามาเรียน</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `;
    downloadFile(excelTemplate, 'สรุปภาพรวมการเช็คชื่อหะละเกาะห์_2569.xls', 'application/vnd.ms-excel;charset=utf-8');
    setSyncToast('📗 ดาวน์โหลดไฟล์ Excel ภาพรวมเรียบร้อยแล้ว');
    setTimeout(() => setSyncToast(null), 3000);
  };

  const exportOverviewWord = () => {
    let rowsHtml = '';
    allTeachersComparison.forEach((t, i) => {
      rowsHtml += `
        <tr>
          <td style="text-align:center;">${i + 1}</td>
          <td style="font-weight:bold;">${t.teacher}</td>
          <td>${t.group}</td>
          <td>${t.cohortName}</td>
          <td style="text-align:center;">${t.studentsCount}</td>
          <td style="text-align:center; font-weight:bold;">${t.datesCount}</td>
          <td style="text-align:center; color:#065f46;">${t.isRecorded ? t.present : '-'}</td>
          <td style="text-align:center; color:#991b1b;">${t.isRecorded ? t.absent : '-'}</td>
          <td style="text-align:center; color:#92400e;">${t.isRecorded ? t.leave : '-'}</td>
          <td style="text-align:right; font-weight:bold;">${t.isRecorded ? t.rate + '%' : '-'}</td>
          <td style="text-align:center;">${t.isRecorded ? 'บันทึกแล้ว' : 'ยังไม่บันทึก'}</td>
        </tr>
      `;
    });

    const wordTemplate = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>รายงานสรุปภาพรวมการเช็คชื่อหะละเกาะห์</title>
        <style>
          @page { size: A4 landscape; margin: 15mm; }
          body { font-family: 'TH Sarabun New', 'Sarabun', Tahoma, sans-serif; font-size: 14pt; line-height: 1.3; color: #1e293b; }
          h2 { color: #581c87; font-size: 18pt; text-align: center; margin-bottom: 4px; }
          .sub { text-align: center; font-size: 12pt; color: #64748b; margin-bottom: 15px; }
          .kpi-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          .kpi-table td { border: 1px solid #cbd5e1; padding: 8px 12px; background: #f8fafc; font-size: 12pt; }
          table { border-collapse: collapse; width: 100%; font-size: 12pt; }
          th { background-color: #581c87; color: white; border: 1px solid #333; padding: 6px; text-align: center; }
          td { border: 1px solid #94a3b8; padding: 5px 6px; }
        </style>
      </head>
      <body>
        <h2>รายงานสรุปภาพรวมผลการเช็คชื่อกลุ่มศึกษาอัลกุรอาน (หะละเกาะห์)</h2>
        <div class="sub">ประจำปีการศึกษา 2569 • ข้อมูล ณ วันที่ ${new Date().toLocaleDateString('th-TH')} เวลา ${new Date().toLocaleTimeString('th-TH')} น.</div>
        <table class="kpi-table">
          <tr>
            <td><b>อาจารย์ทั้งหมด:</b> ${overviewKpi.totalTeachers} ท่าน<br>บันทึกแล้ว: ${overviewKpi.recordedCount} ท่าน (${overviewKpi.recordedPercent}%)</td>
            <td><b>จำนวนครั้งบันทึกรวม:</b> ${overviewKpi.totalSessions} ครั้ง</td>
            <td><b>อัตรามาเรียนเฉลี่ย:</b> <b style="color:#065f46; font-size:14pt;">${overviewKpi.avgRate}%</b><br>มา ${overviewKpi.totalPresent} | ขาด ${overviewKpi.totalAbsent} | ลา ${overviewKpi.totalLeave}</td>
          </tr>
        </table>
        <table>
          <thead>
            <tr>
              <th style="width:35px;">#</th>
              <th>ชื่ออาจารย์</th>
              <th>กลุ่ม</th>
              <th>ส่วน / ชั้นปี</th>
              <th style="width:45px;">นศ.</th>
              <th style="width:50px;">ครั้ง</th>
              <th style="width:40px;">มา</th>
              <th style="width:40px;">ขาด</th>
              <th style="width:40px;">ลา</th>
              <th style="width:65px;">อัตรามา</th>
              <th style="width:75px;">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `;
    downloadFile(wordTemplate, 'สรุปภาพรวมการเช็คชื่อหะละเกาะห์_2569.doc', 'application/msword;charset=utf-8');
    setSyncToast('📘 ดาวน์โหลดไฟล์ Word ภาพรวมเรียบร้อยแล้ว');
    setTimeout(() => setSyncToast(null), 3000);
  };

  const printOverviewReport = () => {
    let rowsHtml = '';
    allTeachersComparison.forEach((t, i) => {
      rowsHtml += `
        <tr>
          <td style="text-align:center;">${i + 1}</td>
          <td style="font-weight:600;">${t.teacher}</td>
          <td>${t.group}</td>
          <td>${t.cohortName}</td>
          <td style="text-align:center;">${t.studentsCount}</td>
          <td style="text-align:center; font-weight:bold;">${t.datesCount}</td>
          <td style="text-align:center; color:#065f46;">${t.isRecorded ? t.present : '-'}</td>
          <td style="text-align:center; color:#991b1b;">${t.isRecorded ? t.absent : '-'}</td>
          <td style="text-align:center; color:#92400e;">${t.isRecorded ? t.leave : '-'}</td>
          <td style="text-align:right; font-weight:bold;">${t.isRecorded ? t.rate + '%' : '-'}</td>
          <td style="text-align:center;">${t.isRecorded ? '<span style="color:#065f46; font-weight:bold;">บันทึกแล้ว</span>' : '<span style="color:#92400e;">ยังไม่บันทึก</span>'}</td>
        </tr>
      `;
    });

    const printHtml = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <title>พิมพ์รายงานสรุปภาพรวมการเช็คชื่อหะละเกาะห์ (PDF)</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          body { font-family: 'Sarabun', sans-serif; font-size: 11pt; color: #1e293b; padding: 10px; }
          .header { text-align: center; border-bottom: 2px solid #581c87; padding-bottom: 8px; margin-bottom: 12px; }
          .header h1 { margin: 0; font-size: 16pt; color: #581c87; }
          .header p { margin: 4px 0 0; font-size: 10pt; color: #64748b; }
          .kpi-grid { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 12px; }
          .kpi-card { flex: 1; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 12px; background: #f8fafc; font-size: 10pt; }
          table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
          th { background-color: #581c87; color: white; border: 1px solid #333; padding: 6px; text-align: center; }
          td { border: 1px solid #cbd5e1; padding: 4px 6px; }
          tr:nth-child(even) { background-color: #f8fafc; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>รายงานสรุปภาพรวมผลการเช็คชื่อกลุ่มศึกษาอัลกุรอาน (หะละเกาะห์)</h1>
          <p>ข้อมูลอัปเดต ณ วันที่ ${new Date().toLocaleDateString('th-TH')} เวลา ${new Date().toLocaleTimeString('th-TH')} น.</p>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <b>อาจารย์ทั้งหมด:</b> ${overviewKpi.totalTeachers} ท่าน<br>
            <span style="color:#065f46;">บันทึกแล้ว:</span> ${overviewKpi.recordedCount} ท่าน (${overviewKpi.recordedPercent}%)
          </div>
          <div class="kpi-card">
            <b>ครั้งที่บันทึกรวม:</b> ${overviewKpi.totalSessions} ครั้ง<br>
            <span>กลุ่มค้างส่ง: ${overviewKpi.pendingCount} ท่าน</span>
          </div>
          <div class="kpi-card">
            <b>อัตราการมาเรียนเฉลี่ย:</b> <span style="color:#065f46; font-size:12pt; font-weight:bold;">${overviewKpi.avgRate}%</span><br>
            <span>มา ${overviewKpi.totalPresent} | ขาด ${overviewKpi.totalAbsent} | ลา ${overviewKpi.totalLeave}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:35px;">#</th>
              <th>ชื่ออาจารย์</th>
              <th>กลุ่ม</th>
              <th>ส่วน / ชั้นปี</th>
              <th style="width:50px;">นศ.</th>
              <th style="width:60px;">ครั้งบันทึก</th>
              <th style="width:40px;">มา</th>
              <th style="width:40px;">ขาด</th>
              <th style="width:40px;">ลา</th>
              <th style="width:65px;">อัตรามา</th>
              <th style="width:75px;">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(printHtml);
      printWin.document.close();
    }
  };

  const printAllTeachersBooklet = () => {
    let sectionsHtml = '';
    allTeachersComparison.forEach((g, gIdx) => {
      const groupStudents = students.filter((s) => s.teacherName === g.teacher);
      let dateHeaders = '';
      g.dates.forEach((d) => {
        dateHeaders += `<th style="text-align:center;">${d}</th>`;
      });

      let rowsHtml = '';
      groupStudents.forEach((st, idx) => {
        const stRecords = records.filter((r) => r.studentId === st.studentId && r.teacherName === g.teacher);
        let present = 0, absent = 0, leave = 0;
        let cellRecords = '';
        g.dates.forEach((d) => {
          const match = stRecords.find((r) => r.date === d);
          const status = match ? match.status : '-';
          if (status === 'มา') present++;
          else if (status === 'ขาด') absent++;
          else if (status === 'ลา') leave++;
          const color = status === 'มา' ? '#065f46' : status === 'ขาด' ? '#991b1b' : status === 'ลา' ? '#92400e' : '#64748b';
          cellRecords += `<td style="text-align:center; color:${color}; font-weight:bold;">${status}</td>`;
        });
        const totalChecks = present + absent + leave;
        const rate = totalChecks > 0 ? Math.round((present / totalChecks) * 100) : 0;

        rowsHtml += `
          <tr>
            <td style="text-align:center;">${idx + 1}</td>
            <td style="text-align:center; font-family:monospace;">${st.studentId}</td>
            <td>${st.fullName}</td>
            <td>${getStudentMajor(st)}</td>
            ${cellRecords}
            <td style="text-align:center; font-weight:bold; color:#065f46;">${present}</td>
            <td style="text-align:center; font-weight:bold; color:#991b1b;">${absent}</td>
            <td style="text-align:center; font-weight:bold; color:#92400e;">${leave}</td>
            <td style="text-align:right; font-weight:bold;">${rate}%</td>
          </tr>
        `;
      });

      sectionsHtml += `
        <div class="page-section ${gIdx < allTeachersComparison.length - 1 ? 'page-break' : ''}">
          <div class="header">
            <h1>รายงานผลการเช็คชื่อกลุ่มศึกษาอัลกุรอาน (หะละเกาะห์)</h1>
            <p>กลุ่มที่ ${gIdx + 1} จากทั้งหมด ${allTeachersComparison.length} กลุ่ม • ปีการศึกษา 2569</p>
          </div>

          <div class="info-box">
            <b>อาจารย์:</b> ${g.teacher} &nbsp;&nbsp;|&nbsp;&nbsp; <b>กลุ่ม:</b> ${g.group} (${g.cohortName})<br>
            <b>จำนวนนักศึกษา:</b> ${g.studentsCount} คน &nbsp;&nbsp;|&nbsp;&nbsp; 
            <b>สถานะ:</b> ${g.isRecorded ? `บันทึกแล้ว (${g.datesCount} ครั้ง)` : 'ยังไม่มีการบันทึก'}<br>
            <b>อัตรามาเรียน:</b> ${g.rate}% (มา ${g.present} | ขาด ${g.absent} | ลา ${g.leave})
          </div>

          <table>
            <thead>
              <tr>
                <th style="width:30px;">#</th>
                <th style="width:85px;">รหัสนักศึกษา</th>
                <th>ชื่อ - สกุล นักศึกษา</th>
                <th style="width:110px;">สาขาวิชา</th>
                ${dateHeaders}
                <th style="width:30px;">มา</th>
                <th style="width:30px;">ขาด</th>
                <th style="width:30px;">ลา</th>
                <th style="width:50px;">อัตรามา</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="10" style="text-align:center; color:#94a3b8; padding:15px;">ยังไม่มีรายชื่อนักศึกษาในกลุ่ม</td></tr>'}
            </tbody>
          </table>
        </div>
      `;
    });

    const printHtml = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <title>รายงานผลการเช็คชื่อครบทุกกลุ่ม (40 อาจารย์)</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          body { font-family: 'Sarabun', sans-serif; font-size: 11pt; color: #1e293b; padding: 0; }
          .page-break { page-break-after: always; }
          .page-section { padding-top: 5px; }
          .header { text-align: center; border-bottom: 2px solid #581c87; padding-bottom: 6px; margin-bottom: 12px; }
          .header h1 { margin: 0; font-size: 15pt; color: #581c87; }
          .header p { margin: 3px 0 0; font-size: 9.5pt; color: #64748b; }
          .info-box { background: #fbfbfe; border: 1px solid #e9d5ff; border-radius: 6px; padding: 8px 12px; margin-bottom: 10px; font-size: 10pt; }
          table { width: 100%; border-collapse: collapse; font-size: 9pt; }
          th { background-color: #581c87; color: white; border: 1px solid #333; padding: 5px; text-align: center; }
          td { border: 1px solid #cbd5e1; padding: 4px 6px; }
          tr:nth-child(even) { background-color: #f8fafc; }
        </style>
      </head>
      <body>
        ${sectionsHtml}
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(printHtml);
      printWin.document.close();
    }
  };

  const exportTeacherExcel = (tName: string) => {
    const t = allTeachersComparison.find((x) => x.teacher === tName) || allTeachersComparison[0];
    if (!t) return;
    const groupStudents = students.filter((s) => s.teacherName === t.teacher);

    let dateHeaders = '';
    t.dates.forEach((d) => {
      dateHeaders += `<th style="background-color:#581c87; color:white; border:1px solid #000;">${d}</th>`;
    });

    let rowsHtml = '';
    groupStudents.forEach((st, idx) => {
      const stRecords = records.filter((r) => r.studentId === st.studentId && r.teacherName === t.teacher);
      let present = 0, absent = 0, leave = 0;
      let cellRecords = '';
      t.dates.forEach((d) => {
        const match = stRecords.find((r) => r.date === d);
        const status = match ? match.status : '-';
        if (status === 'มา') present++;
        else if (status === 'ขาด') absent++;
        else if (status === 'ลา') leave++;
        const color = status === 'มา' ? '#065f46' : status === 'ขาด' ? '#991b1b' : status === 'ลา' ? '#92400e' : '#64748b';
        cellRecords += `<td style="text-align:center; color:${color}; font-weight:bold; border:1px solid #cbd5e1;">${status}</td>`;
      });
      const totalChecks = present + absent + leave;
      const rate = totalChecks > 0 ? Math.round((present / totalChecks) * 100) : 0;

      rowsHtml += `
        <tr>
          <td style="text-align:center; border:1px solid #cbd5e1;">${idx + 1}</td>
          <td style="text-align:center; font-family:monospace; border:1px solid #cbd5e1;">${st.studentId}</td>
          <td style="border:1px solid #cbd5e1;">${st.fullName}</td>
          <td style="border:1px solid #cbd5e1;">${getStudentMajor(st)}</td>
          ${cellRecords}
          <td style="text-align:center; font-weight:bold; color:#065f46; border:1px solid #cbd5e1;">${present}</td>
          <td style="text-align:center; font-weight:bold; color:#991b1b; border:1px solid #cbd5e1;">${absent}</td>
          <td style="text-align:center; font-weight:bold; color:#92400e; border:1px solid #cbd5e1;">${leave}</td>
          <td style="text-align:right; font-weight:bold; border:1px solid #cbd5e1;">${rate}%</td>
        </tr>
      `;
    });

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Sarabun', 'Tahoma', sans-serif; font-size: 13px; }
          h2 { color: #581c87; }
          table { border-collapse: collapse; width: 100%; margin-top: 10px; }
          th { background-color: #581c87; color: #ffffff; border: 1px solid #000; padding: 6px; text-align: center; }
          td { border: 1px solid #cbd5e1; padding: 5px; }
          .box { background: #fbfbfe; border: 1px solid #e9d5ff; padding: 10px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <h2>รายงานผลการเช็คชื่อกลุ่มศึกษาอัลกุรอาน (หะละเกาะห์)</h2>
        <div class="box">
          <b>อาจารย์ผู้รับผิดชอบ:</b> ${t.teacher}<br>
          <b>กลุ่ม:</b> ${t.group} (${t.cohortName}) | <b>จำนวนนักศึกษา:</b> ${t.studentsCount} คน<br>
          <b>จำนวนครั้งที่บันทึก:</b> ${t.datesCount} ครั้ง | <b>อัตราการมาเรียนของกลุ่ม:</b> ${t.rate}%<br>
          <b>สถิติรวม:</b> มา ${t.present} ครั้ง, ขาด ${t.absent} ครั้ง, ลา ${t.leave} ครั้ง
        </div>
        <table>
          <thead>
            <tr>
              <th>ลำดับ</th>
              <th>รหัสนักศึกษา</th>
              <th>ชื่อ - นามสกุล นักศึกษา</th>
              <th>สาขาวิชา</th>
              ${dateHeaders}
              <th>มา</th>
              <th>ขาด</th>
              <th>ลา</th>
              <th>อัตราการมา</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `;
    downloadFile(excelTemplate, `เช็คชื่อหะละเกาะห์_${t.teacher}.xls`, 'application/vnd.ms-excel;charset=utf-8');
    setSyncToast(`📗 ดาวน์โหลดไฟล์ Excel ของ ${t.teacher} เรียบร้อย`);
    setTimeout(() => setSyncToast(null), 3000);
  };

  const exportTeacherWord = (tName: string) => {
    const t = allTeachersComparison.find((x) => x.teacher === tName) || allTeachersComparison[0];
    if (!t) return;
    const groupStudents = students.filter((s) => s.teacherName === t.teacher);

    let dateHeaders = '';
    t.dates.forEach((d) => {
      dateHeaders += `<th>${d}</th>`;
    });

    let rowsHtml = '';
    groupStudents.forEach((st, idx) => {
      const stRecords = records.filter((r) => r.studentId === st.studentId && r.teacherName === t.teacher);
      let present = 0, absent = 0, leave = 0;
      let cellRecords = '';
      t.dates.forEach((d) => {
        const match = stRecords.find((r) => r.date === d);
        const status = match ? match.status : '-';
        if (status === 'มา') present++;
        else if (status === 'ขาด') absent++;
        else if (status === 'ลา') leave++;
        const color = status === 'มา' ? '#065f46' : status === 'ขาด' ? '#991b1b' : status === 'ลา' ? '#92400e' : '#64748b';
        cellRecords += `<td style="text-align:center; color:${color}; font-weight:bold;">${status}</td>`;
      });
      const totalChecks = present + absent + leave;
      const rate = totalChecks > 0 ? Math.round((present / totalChecks) * 100) : 0;

      rowsHtml += `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td style="text-align:center; font-family:monospace;">${st.studentId}</td>
          <td style="font-weight:500;">${st.fullName}</td>
          <td>${getStudentMajor(st)}</td>
          ${cellRecords}
          <td style="text-align:center; font-weight:bold; color:#065f46;">${present}</td>
          <td style="text-align:center; font-weight:bold; color:#991b1b;">${absent}</td>
          <td style="text-align:center; font-weight:bold; color:#92400e;">${leave}</td>
          <td style="text-align:right; font-weight:bold;">${rate}%</td>
        </tr>
      `;
    });

    const wordTemplate = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>รายงานผลการเช็คชื่อ - ${t.teacher}</title>
        <style>
          @page { size: A4 landscape; margin: 15mm; }
          body { font-family: 'TH Sarabun New', 'Sarabun', Tahoma, sans-serif; font-size: 14pt; line-height: 1.3; color: #1e293b; }
          h2 { color: #581c87; font-size: 18pt; text-align: center; margin-bottom: 4px; }
          .sub { text-align: center; font-size: 12pt; color: #64748b; margin-bottom: 12px; }
          .info-box { background: #fbfbfe; border: 1px solid #e9d5ff; padding: 10px 14px; margin-bottom: 14px; font-size: 13pt; }
          table { border-collapse: collapse; width: 100%; font-size: 12pt; }
          th { background-color: #581c87; color: white; border: 1px solid #333; padding: 6px; text-align: center; }
          td { border: 1px solid #94a3b8; padding: 5px 6px; }
        </style>
      </head>
      <body>
        <h2>รายงานผลการเช็คชื่อกลุ่มศึกษาอัลกุรอาน (หะละเกาะห์)</h2>
        <div class="sub">ประจำปีการศึกษา 2569</div>

        <div class="info-box">
          <b>อาจารย์ผู้รับผิดชอบ:</b> ${t.teacher} &nbsp;&nbsp;|&nbsp;&nbsp; 
          <b>กลุ่ม:</b> ${t.group} (${t.cohortName})<br>
          <b>จำนวนนักศึกษาในกลุ่ม:</b> ${t.studentsCount} คน &nbsp;&nbsp;|&nbsp;&nbsp; 
          <b>วันที่เช็คชื่อ:</b> ${t.dates.join(', ') || '-'}<br>
          <b>อัตราการมาเรียนเฉลี่ย:</b> ${t.rate}% (มา ${t.present} | ขาด ${t.absent} | ลา ${t.leave})
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:35px;">#</th>
              <th style="width:90px;">รหัสนักศึกษา</th>
              <th>ชื่อ - สกุล นักศึกษา</th>
              <th style="width:110px;">สาขาวิชา</th>
              ${dateHeaders}
              <th style="width:35px;">มา</th>
              <th style="width:35px;">ขาด</th>
              <th style="width:35px;">ลา</th>
              <th style="width:65px;">อัตรามา</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `;
    downloadFile(wordTemplate, `เช็คชื่อหะละเกาะห์_${t.teacher}.doc`, 'application/msword;charset=utf-8');
    setSyncToast(`📘 ดาวน์โหลดไฟล์ Word ของ ${t.teacher} เรียบร้อย`);
    setTimeout(() => setSyncToast(null), 3000);
  };

  const printTeacherReport = (tName: string) => {
    const t = allTeachersComparison.find((x) => x.teacher === tName) || allTeachersComparison[0];
    if (!t) return;
    const groupStudents = students.filter((s) => s.teacherName === t.teacher);

    let dateHeaders = '';
    t.dates.forEach((d) => {
      dateHeaders += `<th style="text-align:center;">${d}</th>`;
    });

    let rowsHtml = '';
    groupStudents.forEach((st, idx) => {
      const stRecords = records.filter((r) => r.studentId === st.studentId && r.teacherName === t.teacher);
      let present = 0, absent = 0, leave = 0;
      let cellRecords = '';
      t.dates.forEach((d) => {
        const match = stRecords.find((r) => r.date === d);
        const status = match ? match.status : '-';
        if (status === 'มา') present++;
        else if (status === 'ขาด') absent++;
        else if (status === 'ลา') leave++;
        const color = status === 'มา' ? '#065f46' : status === 'ขาด' ? '#991b1b' : status === 'ลา' ? '#92400e' : '#64748b';
        cellRecords += `<td style="text-align:center; color:${color}; font-weight:bold;">${status}</td>`;
      });
      const totalChecks = present + absent + leave;
      const rate = totalChecks > 0 ? Math.round((present / totalChecks) * 100) : 0;

      rowsHtml += `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td style="text-align:center; font-family:monospace;">${st.studentId}</td>
          <td>${st.fullName}</td>
          <td>${getStudentMajor(st)}</td>
          ${cellRecords}
          <td style="text-align:center; font-weight:bold; color:#065f46;">${present}</td>
          <td style="text-align:center; font-weight:bold; color:#991b1b;">${absent}</td>
          <td style="text-align:center; font-weight:bold; color:#92400e;">${leave}</td>
          <td style="text-align:right; font-weight:bold;">${rate}%</td>
        </tr>
      `;
    });

    const printHtml = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <title>พิมพ์รายงานผลการเช็คชื่อ - ${t.teacher}</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          body { font-family: 'Sarabun', sans-serif; font-size: 11pt; color: #1e293b; padding: 10px; }
          .header { text-align: center; border-bottom: 2px solid #581c87; padding-bottom: 8px; margin-bottom: 12px; }
          .header h1 { margin: 0; font-size: 16pt; color: #581c87; }
          .header p { margin: 4px 0 0; font-size: 10pt; color: #64748b; }
          .info-box { background: #fbfbfe; border: 1px solid #e9d5ff; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; font-size: 11pt; }
          table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
          th { background-color: #581c87; color: white; border: 1px solid #333; padding: 6px; text-align: center; }
          td { border: 1px solid #cbd5e1; padding: 4px 6px; }
          tr:nth-child(even) { background-color: #f8fafc; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>รายงานผลการเช็คชื่อกลุ่มศึกษาอัลกุรอาน (หะละเกาะห์)</h1>
          <p>ข้อมูล ณ วันที่ ${new Date().toLocaleDateString('th-TH')} เวลา ${new Date().toLocaleTimeString('th-TH')} น.</p>
        </div>

        <div class="info-box">
          <b>อาจารย์:</b> ${t.teacher} &nbsp;&nbsp;|&nbsp;&nbsp; <b>กลุ่ม:</b> ${t.group} (${t.cohortName})<br>
          <b>จำนวนนักศึกษา:</b> ${t.studentsCount} คน &nbsp;&nbsp;|&nbsp;&nbsp; 
          <b>วันที่เช็คชื่อ:</b> ${t.dates.join(', ') || '-'}<br>
          <b>อัตราการมาเรียนเฉลี่ย:</b> ${t.rate}% (มา ${t.present} | ขาด ${t.absent} | ลา ${t.leave})
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:35px;">#</th>
              <th style="width:90px;">รหัสนักศึกษา</th>
              <th>ชื่อ - สกุล นักศึกษา</th>
              <th style="width:110px;">สาขาวิชา</th>
              ${dateHeaders}
              <th style="width:35px;">มา</th>
              <th style="width:35px;">ขาด</th>
              <th style="width:35px;">ลา</th>
              <th style="width:65px;">อัตรามา</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(printHtml);
      printWin.document.close();
    }
  };

  const exportPendingExcel = () => {
    const pending = allTeachersComparison.filter((t) => !t.isRecorded);
    let rowsHtml = '';
    pending.forEach((t, i) => {
      rowsHtml += `
        <tr>
          <td style="text-align:center;">${i + 1}</td>
          <td>${t.teacher}</td>
          <td>${t.group}</td>
          <td>${t.cohortName}</td>
          <td style="text-align:center;">${t.studentsCount}</td>
          <td style="text-align:center; color:#991b1b; font-weight:bold;">ยังไม่ส่งผลเช็คชื่อ</td>
        </tr>
      `;
    });

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Sarabun', 'Tahoma', sans-serif; font-size: 13px; }
          h2 { color: #b45309; }
          table { border-collapse: collapse; width: 100%; margin-top: 10px; }
          th { background-color: #d97706; color: #ffffff; border: 1px solid #000; padding: 6px; text-align: center; }
          td { border: 1px solid #cbd5e1; padding: 5px; }
        </style>
      </head>
      <body>
        <h2>รายชื่อกลุ่มที่ยังไม่พบประวัติการเช็คชื่อหะละเกาะห์ (${pending.length} ท่าน)</h2>
        <p>ข้อมูล ณ วันที่: ${new Date().toLocaleDateString('th-TH')} เวลา ${new Date().toLocaleTimeString('th-TH')} น.</p>
        <table>
          <thead>
            <tr>
              <th>ลำดับ</th>
              <th>ชื่ออาจารย์</th>
              <th>กลุ่ม</th>
              <th>ส่วน / ชั้นปี</th>
              <th>จำนวนนักศึกษา (คน)</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `;
    downloadFile(excelTemplate, 'รายชื่ออาจารย์ที่ยังไม่เช็คชื่อหะละเกาะห์.xls', 'application/vnd.ms-excel;charset=utf-8');
    setSyncToast('📗 ดาวน์โหลดรายชื่อกลุ่มค้างส่งเรียบร้อยแล้ว');
    setTimeout(() => setSyncToast(null), 3000);
  };

  // ==================== รายงานกลุ่มที่ยังไม่บันทึก: PDF / ลิงก์สาธารณะ ====================
  const pendingRows = allTeachersComparison.filter((t) => !t.isRecorded);
  const [pendingBusy, setPendingBusy] = useState(false);

  const buildPendingSnapshot = (): PendingSnapshot => ({
    v: 1,
    t: new Date().toISOString(),
    label: `${semesterSettings.semesterName} ปีการศึกษา ${semesterSettings.academicYear}`,
    total: allTeachersComparison.length,
    rows: pendingRows.map((t) => ({
      teacher: t.teacher,
      group: t.group,
      year: t.yearLevel || '-',
      gender: t.gender,
      students: t.studentsCount,
    })),
  });

  const handleSharePdf = async () => {
    setPendingBusy(true);
    try {
      await savePendingReportPdf(buildPendingSnapshot());
      setSyncToast('บันทึกไฟล์ PDF รายงานเรียบร้อย');
    } catch (err) {
      console.error(err);
      setSyncToast('สร้างไฟล์ PDF ไม่สำเร็จ');
    } finally {
      setPendingBusy(false);
      setTimeout(() => setSyncToast(null), 3000);
    }
  };

  const handleCopyPendingLink = async () => {
    const url = buildPendingShareUrl(buildPendingSnapshot());
    try {
      await navigator.clipboard.writeText(url);
      setSyncToast('คัดลอกลิงก์แล้ว ทุกคนเปิดดูได้โดยไม่ต้องล็อกอิน');
    } catch {
      window.prompt('คัดลอกลิงก์นี้ไปแชร์', url);
    }
    setTimeout(() => setSyncToast(null), 3500);
  };

  const handleOpenPendingLink = () => {
    window.open(buildPendingShareUrl(buildPendingSnapshot()), '_blank');
  };

  // ==================== เมนูนำทาง (รวมหัวข้อที่เกี่ยวข้องกันไว้ด้วยกัน) ====================
  const goTab = (t: TabType) => {
    setActiveTab(t);
    setIsMobileSidebarOpen(false);
  };

  const PAGE_TITLES: Partial<Record<TabType, string>> = {
    overview: 'ภาพรวม',
    analytics: 'ภาพรวม',
    periodic: 'สรุปตามวัน/เดือน/ปี',
    teachers: 'รายอาจารย์',
    matrix: 'รายอาจารย์',
    pending: 'กลุ่มที่ยังไม่บันทึก',
    levels: 'ระดับกลุ่ม',
    editor: 'จัดการข้อมูล นักศึกษา/อาจารย์',
    transfer: 'โยกย้ายกลุ่ม',
    announcements: 'ส่งประกาศ',
    feedbacks: 'ความคิดเห็น & ข้อเสนอแนะ',
    certificates: 'สตูดิโอเกียรติบัตร',
    export: 'ส่งออกไฟล์',
    system_management: 'ตั้งค่าระบบ',
  };

  const NAV_GROUPS: {
    title: string;
    items: {
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      ids: TabType[];
      badge?: () => number;
      badgeTone?: 'alert';
    }[];
  }[] = [
    {
      title: 'รายงาน',
      items: [
        { label: 'ภาพรวม', icon: BarChart3, ids: ['overview', 'analytics', 'periodic'] },
        {
          label: 'กลุ่มอาจารย์',
          icon: UserCheck,
          ids: ['teachers', 'matrix', 'pending', 'levels'],
          badge: () => overviewKpi.pendingCount,
          badgeTone: 'alert',
        },
      ],
    },
    {
      title: 'จัดการ',
      items: [
        { label: 'ข้อมูล นศ./อาจารย์', icon: DatabaseIcon, ids: ['editor'] },
        { label: 'โยกย้ายกลุ่ม', icon: ArrowRightLeft, ids: ['transfer'] },
        { label: 'ส่งประกาศ', icon: Megaphone, ids: ['announcements'], badge: () => announcementsList.length },
        {
          label: 'ความคิดเห็น & ข้อเสนอแนะ',
          icon: MessageSquare,
          ids: ['feedbacks'],
          badge: () => unreadFeedbacksCount,
          badgeTone: 'alert',
        },
      ],
    },
    {
      title: 'ระบบ',
      items: [
        { label: 'เกียรติบัตร', icon: Award, ids: ['certificates'] },
        { label: 'ส่งออกไฟล์', icon: Download, ids: ['export'] },
        { label: 'ตั้งค่า & สำรองข้อมูล', icon: Settings, ids: ['system_management'] },
      ],
    },
  ];

  const reportTabs = () =>
    renderSubTabs([
      { ids: ['overview', 'analytics'], label: 'ภาพรวม' },
      { ids: ['periodic'], label: 'รายวัน/เดือน/ปี' },
    ]);
  const groupTabs = () =>
    renderSubTabs([
      { ids: ['teachers', 'matrix'], label: 'รายอาจารย์' },
      { ids: ['pending'], label: 'ยังไม่บันทึก', badge: overviewKpi.pendingCount },
      { ids: ['levels'], label: 'ระดับกลุ่ม' },
    ]);

  /** แถบแท็บย่อยสำหรับหน้าที่รวมหลายหัวข้อ */
  const renderSubTabs = (
    items: { ids: TabType[]; label: string; badge?: number }[]
  ) => (
    <div className="inline-flex flex-wrap gap-1 p-1 rounded-2xl bg-purple-100/70 print:hidden">
      {items.map((it) => {
        const active = it.ids.includes(activeTab);
        return (
          <button
            key={it.label}
            type="button"
            onClick={() => setActiveTab(it.ids[0])}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
              active ? 'bg-white text-purple-900 shadow-sm' : 'text-purple-700 hover:text-purple-950'
            }`}
          >
            <span>{it.label}</span>
            {!!it.badge && it.badge > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black">{it.badge}</span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-slate-50/50">
      {/* ==================== WORKSPACE CONTAINER WITH FIXED LEFT SIDEBAR ==================== */}
      <div className="w-full flex">
        {/* LEFT SIDEBAR NAVIGATION - FIXED TO FAR LEFT */}
        <aside
          className={`fixed left-0 top-0 bottom-0 w-64 lg:w-72 h-screen z-40 bg-white border-r border-purple-100 p-4 shadow-lg flex flex-col justify-between overflow-y-auto transition-transform duration-300 print:hidden ${
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                {customLogo ? (
                  <img src={customLogo} alt="Logo" className="h-9 w-auto max-w-[56px] object-contain" />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-700 to-indigo-900 text-white flex items-center justify-center font-black text-xs">
                    HQ
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-black text-purple-950 leading-tight">หะละเกาะห์</div>
                  <div className="text-[11px] text-purple-600 font-semibold leading-tight truncate">
                    ระบบแอดมิน
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="lg:hidden p-1.5 rounded-lg text-purple-600 hover:bg-purple-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {NAV_GROUPS.map((group) => (
              <div key={group.title}>
                <div className="px-3 pb-1.5 text-[11px] font-bold text-purple-400 tracking-wider">{group.title}</div>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = item.ids.includes(activeTab);
                    const Icon = item.icon;
                    const badge = item.badge ? item.badge() : 0;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => goTab(item.ids[0])}
                        className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-center justify-between text-sm ${
                          active
                            ? 'bg-gradient-to-r from-purple-700 to-purple-900 text-white font-bold shadow-md shadow-purple-900/20'
                            : 'text-purple-900/80 hover:bg-purple-50 font-semibold'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <Icon className={`w-[18px] h-[18px] ${active ? 'text-amber-300' : 'text-purple-500'}`} />
                          <span>{item.label}</span>
                        </span>
                        {badge > 0 && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              active ? 'bg-amber-400 text-purple-950' : item.badgeTone === 'alert' ? 'bg-rose-100 text-rose-700' : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 space-y-2">
            <button
              type="button"
              onClick={() => {
                setIsPinProjectorOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-purple-950 text-xs font-black shadow-md transition active:scale-95"
            >
              <KeyRound className="w-4 h-4 text-purple-950" />
              <span>ห้องเช็คชื่อ PIN (ฉายจอใหญ่)</span>
            </button>
            <button
              type="button"
              onClick={() => setIsManualModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold transition"
            >
              <BookOpen className="w-4 h-4 text-purple-700" />
              <span>คู่มือการใช้งาน</span>
            </button>
          </div>
        </aside>

        {/* Mobile Backdrop when sidebar is open */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* MAIN CONTENT WRAPPER (Shifted to right by 72 on large screen) */}
        <div className="flex-1 w-full lg:pl-72 min-w-0 flex flex-col">
          <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-6 space-y-4 sm:space-y-6 pb-28 animate-fadeIn">
            {/* ==================== REFINED EXECUTIVE HEADER ==================== */}
            <header className="rounded-3xl bg-gradient-to-br from-purple-800 via-purple-900 to-indigo-950 text-white p-4 sm:p-5 shadow-lg shadow-purple-950/20 print:hidden">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setIsMobileSidebarOpen(true)}
                    className="lg:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20"
                    title="เปิดเมนู"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                  {onBackToLanding && (
                    <button
                      type="button"
                      onClick={onBackToLanding}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition shrink-0"
                      title="กลับหน้าแรก"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  )}
                  <div className="min-w-0">
                    <div className="text-[11px] text-purple-200 font-semibold truncate">
                      {adminUser?.role === 'subadmin' ? 'แอดมินรอง' : 'ผู้ดูแลระบบ'} • {adminUser?.name || 'แอดมิน'}
                    </div>
                    <h1 className="text-lg sm:text-2xl font-black tracking-tight leading-tight truncate">
                      {PAGE_TITLES[activeTab] || 'แดชบอร์ดแอดมิน'}
                    </h1>
                  </div>
                </div>

                <div className="flex items-center flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTermManagerOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold transition"
                    title="ตั้งค่าภาคเรียน"
                  >
                    <Calendar className="w-3.5 h-3.5 text-amber-300" />
                    <span>{semesterSettings.semesterName} {semesterSettings.academicYear}</span>
                  </button>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-400/20 text-emerald-100 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-300" />
                    <span>บันทึกแล้ว {overviewKpi.recordedCount}/{overviewKpi.totalTeachers} กลุ่ม</span>
                  </div>

                  <button
                    onClick={onLogout}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-rose-500/80 text-xs font-bold transition"
                    title="ออกจากระบบ"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>ออก</span>
                  </button>
                </div>
              </div>

              <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-purple-200">
                  <span className={`inline-block w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-300 animate-ping' : 'bg-emerald-400'}`} />
                  <span className="font-bold text-white">{isSyncing ? 'กำลังซิงค์...' : 'ซิงค์แล้ว'}</span>
                  <span>อัปเดต {lastUpdatedTime}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPinProjectorOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-amber-400 text-purple-950 font-black shadow-md active:scale-95 transition"
                    title="เปิดห้องเช็คชื่อด้วย PIN / QR Code สำหรับฉายจอใหญ่ (กิจกรรมรวม / นศ. ปี 1)"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-purple-950" />
                    <span>🎯 เช็คชื่อ PIN / จอใหญ่</span>
                  </button>

                  <button
                    onClick={() => handleManualSync(false)}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-purple-900 hover:bg-purple-50 font-bold transition disabled:opacity-60"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>ซิงค์ข้อมูล</span>
                  </button>

                  <select
                    value={autoRefreshInterval}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setAutoRefreshInterval(val);
                      setSyncToast(val > 0 ? `รีเฟรชอัตโนมัติทุก ${val >= 60 ? `${val / 60} นาที` : `${val} วินาที`}` : 'ปิดรีเฟรชอัตโนมัติ');
                      setTimeout(() => setSyncToast(null), 3000);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-white/10 text-white font-bold focus:outline-none cursor-pointer [&>option]:text-purple-950"
                    title="รีเฟรชอัตโนมัติ"
                  >
                    <option value={0}>ไม่รีเฟรชเอง</option>
                    <option value={30}>ทุก 30 วิ</option>
                    <option value={60}>ทุก 1 นาที</option>
                    <option value={300}>ทุก 5 นาที</option>
                  </select>

                  <div className="relative" ref={exportDropdownRef}>
                    <button
                      onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                      className="px-3 py-1.5 rounded-xl font-bold bg-white/10 hover:bg-white/20 transition flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>ส่งออก / พิมพ์</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {isExportDropdownOpen && (
                      <div className="absolute right-0 mt-1.5 w-64 bg-white text-purple-950 rounded-2xl shadow-xl border border-purple-100 p-2 z-50 animate-fadeIn">
                        <button
                          onClick={() => { setIsExportDropdownOpen(false); exportOverviewExcel(); }}
                          className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-purple-50 flex items-center gap-2"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                          <span>Excel ภาพรวม</span>
                        </button>
                        <button
                          onClick={() => { setIsExportDropdownOpen(false); exportOverviewWord(); }}
                          className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-purple-50 flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span>Word ภาพรวม</span>
                        </button>
                        <button
                          onClick={() => { setIsExportDropdownOpen(false); printOverviewReport(); }}
                          className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-purple-50 flex items-center gap-2"
                        >
                          <Printer className="w-4 h-4 text-purple-700" />
                          <span>พิมพ์ / PDF ภาพรวม</span>
                        </button>
                        <div className="border-t border-purple-100 my-1" />
                        <button
                          onClick={() => { setIsExportDropdownOpen(false); printAllTeachersBooklet(); }}
                          className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-purple-50 flex items-center gap-2"
                        >
                          <BookOpen className="w-4 h-4 text-amber-600" />
                          <span>พิมพ์รวมทุกกลุ่ม (Booklet)</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="relative" ref={sheetsDropdownRef}>
                    <button
                      onClick={() => setIsSheetsDropdownOpen(!isSheetsDropdownOpen)}
                      className="px-3 py-1.5 rounded-xl font-bold bg-white/10 hover:bg-white/20 transition flex items-center gap-1.5"
                    >
                      <span>Google Sheet</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {isSheetsDropdownOpen && (
                      <div className="absolute right-0 mt-1.5 w-72 bg-white text-purple-950 rounded-2xl shadow-xl border border-purple-100 p-2 z-50 animate-fadeIn">
                        <button
                          onClick={() => {
                            setIsSheetsDropdownOpen(false);
                            onBackupAll?.();
                          }}
                          disabled={isBackingUp}
                          className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-purple-50 font-bold flex items-center gap-2"
                        >
                          <Upload className="w-4 h-4 text-purple-700" />
                          {isBackingUp ? 'กำลังส่งข้อมูล...' : 'ส่งข้อมูลทั้งหมดขึ้นชีต'}
                        </button>
                        <button
                          onClick={async () => {
                            setIsSheetsDropdownOpen(false);
                            if (!confirm('ดึงข้อมูลจาก Google Sheet มาแทนข้อมูลในเครื่องนี้?')) return;
                            const r = await restoreFromGoogleSheet();
                            reloadDataStore();
                            setSemesterSettings(getSemesterSettings());
                            setTermHistory(getTermHistory());
                            setAnnouncementsList(getAnnouncements());
                            setSubAdminsList(getSubAdmins());
                            setSyncToast(r.message);
                            setTimeout(() => setSyncToast(null), 5000);
                            if (r.success) handleManualSync(true);
                          }}
                          className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-purple-50 font-bold flex items-center gap-2"
                        >
                          <Download className="w-4 h-4 text-purple-700" />
                          ดึงข้อมูลล่าสุดจากชีต
                        </button>
                        <div className="border-t border-purple-100 my-1" />
                        {GOOGLE_SHEETS_SOURCES.map((s) => (
                          <a
                            key={s.id}
                            href={s.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block px-3 py-2 text-xs rounded-xl hover:bg-purple-50 font-medium"
                          >
                            {s.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </header>

            {/* MAIN TAB CONTENT CONTAINER */}
            <main className="w-full min-w-0">
              {/* ==================== TAB 1: ภาพรวมทั้งหมด (OVERVIEW & MATRIX COMPARISON) ==================== */}
          {/* ==================== TAB 1: ภาพรวมทั้งหมด (OVERVIEW & MATRIX COMPARISON) ==================== */}
          {(activeTab === 'overview' || activeTab === 'analytics') && (
        <div className="space-y-6 animate-fadeIn">
          {reportTabs()}
          {/* Academic Year & Semester Selector Banner (ดูข้อมูลย้อนหลัง & สลับปีการศึกษา) */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-purple-100 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-purple-500">กำลังแสดงข้อมูล</div>
                <h3 className="text-base sm:text-lg font-black text-purple-950">{termFilterLabel}</h3>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={termFilter}
                onChange={(e) => setTermFilter(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-purple-200 bg-purple-50 text-sm font-bold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="current">ภาคปัจจุบัน ({getTermKey(semesterSettings)})</option>
                {termOptions.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.semesterName} ปีการศึกษา {t.academicYear}
                  </option>
                ))}
                <option value="all">ทุกภาคการศึกษา</option>
              </select>
              <button
                type="button"
                onClick={() => setIsTermManagerOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-purple-800 hover:bg-purple-900 text-white text-sm font-bold flex items-center gap-1.5"
              >
                <Settings className="w-4 h-4" /> ตั้งค่าภาคการศึกษา
              </button>
            </div>
          </div>

          {/* Top 4 KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl border border-purple-100 p-5 shadow-card relative overflow-hidden group hover:shadow-card-hover transition">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full pointer-events-none -mr-4 -mt-4 transition group-hover:scale-110" />
              <div className="flex items-center justify-between mb-3 relative z-10">
                <span className="text-xs font-bold text-purple-900/70">กลุ่มหะละเกาะห์ทั้งหมด</span>
                <span className="p-2.5 rounded-2xl bg-purple-100 text-purple-900 text-lg">👥</span>
              </div>
              <div className="text-3xl font-black text-purple-950 font-mono tracking-tight relative z-10">
                {overviewKpi.totalGroups}
              </div>
              <div className="mt-2 text-xs font-semibold text-purple-700 flex items-center gap-1.5 relative z-10">
                <span>บันทึกแล้ว {overviewKpi.activeTeachers} กลุ่ม</span>
                <span className="text-purple-300">•</span>
                <span className="text-amber-700 font-bold">รอ {overviewKpi.pendingCount}</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-purple-100 p-5 shadow-card relative overflow-hidden group hover:shadow-card-hover transition">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full pointer-events-none -mr-4 -mt-4 transition group-hover:scale-110" />
              <div className="flex items-center justify-between mb-3 relative z-10">
                <span className="text-xs font-bold text-purple-900/70">จำนวนนักศึกษาทั้งหมด</span>
                <span className="p-2.5 rounded-2xl bg-purple-100 text-purple-900 text-lg">🎓</span>
              </div>
              <div className="text-3xl font-black text-purple-950 font-mono tracking-tight relative z-10">
                {overviewKpi.totalStudents} <span className="text-sm font-bold text-purple-900/60">คน</span>
              </div>
              <div className="mt-2 text-xs font-semibold text-purple-700 relative z-10">
                เฉลี่ย {overviewKpi.totalGroups > 0 ? (overviewKpi.totalStudents / overviewKpi.totalGroups).toFixed(1) : 0} คน / กลุ่ม
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-purple-100 p-5 shadow-card relative overflow-hidden group hover:shadow-card-hover transition">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full pointer-events-none -mr-4 -mt-4 transition group-hover:scale-110" />
              <div className="flex items-center justify-between mb-3 relative z-10">
                <span className="text-xs font-bold text-purple-900/70">จำนวนครั้งเช็คชื่อรวม</span>
                <span className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800 text-lg">📝</span>
              </div>
              <div className="text-3xl font-black text-purple-950 font-mono tracking-tight relative z-10">
                {overviewKpi.totalCheckins.toLocaleString()} <span className="text-sm font-bold text-purple-900/60">ครั้ง</span>
              </div>
              <div className="mt-2 text-xs font-semibold text-emerald-700 flex items-center gap-2 relative z-10">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>มา {overviewKpi.presentCount.toLocaleString()} • ขาด {overviewKpi.absentCount.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-purple-100 p-5 shadow-card relative overflow-hidden group hover:shadow-card-hover transition">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full pointer-events-none -mr-4 -mt-4 transition group-hover:scale-110" />
              <div className="flex items-center justify-between mb-3 relative z-10">
                <span className="text-xs font-bold text-purple-900/70">อัตราการมาเรียนเฉลี่ย</span>
                <span className="p-2.5 rounded-2xl bg-amber-100 text-amber-900 text-lg">📊</span>
              </div>
              <div className="text-3xl font-black text-purple-950 font-mono tracking-tight relative z-10">
                {overviewKpi.attendanceRate.toFixed(1)}%
              </div>
              <div className="mt-2 text-xs font-semibold text-purple-700 relative z-10">
                เกณฑ์ผ่าน 80% (หะละเกาะห์รวม)
              </div>
            </div>
          </div>

          {/* Semester Target Progress Banner */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-purple-950 text-[11px] font-black uppercase tracking-wider">
                    เป้าหมายหลักสูตร
                  </span>
                  <span className="text-xs text-purple-200">
                    {semesterSettings.semesterName} ปีการศึกษา {semesterSettings.academicYear}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black">
                  ความคืบหน้ากิจกรรมหะละเกาะห์ ({uniqueRecordedDatesCount} / {semesterSettings.targetSessions} สัปดาห์)
                </h3>
                <p className="text-xs text-purple-200/80">
                  {uniqueRecordedDatesCount >= semesterSettings.targetSessions
                    ? '🎉 จัดกิจกรรมครบตามเกณฑ์เป้าหมายของภาคเรียนนี้แล้ว'
                    : `เหลืออีก ${Math.max(0, semesterSettings.targetSessions - uniqueRecordedDatesCount)} สัปดาห์/ครั้ง เพื่อให้ครบตามเป้าหมายของภาคเรียน`}
                </p>
              </div>

              <div className="flex items-center gap-4 min-w-[260px]">
                <div className="flex-1">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-purple-200">ความคืบหน้า</span>
                    <span className="font-mono text-amber-300">
                      {Math.min(100, Math.round((uniqueRecordedDatesCount / (semesterSettings.targetSessions || 1)) * 100))}%
                    </span>
                  </div>
                  <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden p-0.5">
                    <div
                      className="bg-gradient-to-r from-amber-400 to-amber-300 h-full rounded-full transition-all duration-700 shadow-sm"
                      style={{
                        width: `${Math.min(100, Math.round((uniqueRecordedDatesCount / (semesterSettings.targetSessions || 1)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Charts & Cohort Progress (2 Columns) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donut Distribution Card */}
            <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-card space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-purple-950 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-purple-700" />
                    <span>สัดส่วนการเข้าเรียน (มา • ขาด • ลา)</span>
                  </h3>
                  <p className="text-xs text-purple-800/70 mt-0.5">
                    อัตราส่วนของสถานะการเช็คชื่อทั้งหมดในระบบ
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-950 text-xs font-bold">
                  {overviewKpi.totalCheckins.toLocaleString()} รายการ
                </span>
              </div>

              {/* SVG Donut and Legend */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-2">
                {/* SVG Donut */}
                <div className="relative w-44 h-44 flex items-center justify-center">
                  {(() => {
                    const total = overviewKpi.totalCheckins || 1;
                    const r = 58;
                    const circ = 2 * Math.PI * r;
                    const p1 = (overviewKpi.presentCount / total) * circ;
                    const p2 = (overviewKpi.absentCount / total) * circ;
                    const p3 = (overviewKpi.leaveCount / total) * circ;
                    const o1 = 0;
                    const o2 = -p1;
                    const o3 = -(p1 + p2);

                    return (
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                        <circle cx="80" cy="80" r={r} fill="none" stroke="#f3f4f6" strokeWidth="22" />
                        {overviewKpi.totalCheckins > 0 ? (
                          <>
                            <circle
                              cx="80"
                              cy="80"
                              r={r}
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="22"
                              strokeDasharray={`${p1} ${circ - p1}`}
                              strokeDashoffset={o1}
                              className="transition-all duration-700"
                            />
                            <circle
                              cx="80"
                              cy="80"
                              r={r}
                              fill="none"
                              stroke="#ef4444"
                              strokeWidth="22"
                              strokeDasharray={`${p2} ${circ - p2}`}
                              strokeDashoffset={o2}
                              className="transition-all duration-700"
                            />
                            <circle
                              cx="80"
                              cy="80"
                              r={r}
                              fill="none"
                              stroke="#f59e0b"
                              strokeWidth="22"
                              strokeDasharray={`${p3} ${circ - p3}`}
                              strokeDashoffset={o3}
                              className="transition-all duration-700"
                            />
                          </>
                        ) : (
                          <circle cx="80" cy="80" r={r} fill="none" stroke="#e5e7eb" strokeWidth="22" />
                        )}
                      </svg>
                    );
                  })()}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-2xl font-black text-purple-950 font-mono">
                      {overviewKpi.attendanceRate.toFixed(1)}%
                    </span>
                    <span className="text-[11px] font-bold text-purple-800/70">อัตราการมา</span>
                  </div>
                </div>

                {/* Legend & Stats */}
                <div className="space-y-3 w-full sm:w-56">
                  <div className="flex items-center justify-between p-2.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 shadow-sm" />
                      <span className="text-xs font-bold text-purple-950">มาเรียน</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-emerald-900 font-mono">
                        {overviewKpi.presentCount.toLocaleString()} ({overviewKpi.presentPct.toFixed(1)}%)
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-2xl bg-rose-50/70 border border-rose-100">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-md bg-rose-500 shadow-sm" />
                      <span className="text-xs font-bold text-purple-950">ขาดเรียน</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-rose-900 font-mono">
                        {overviewKpi.absentCount.toLocaleString()} ({overviewKpi.absentPct.toFixed(1)}%)
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-2xl bg-amber-50/70 border border-amber-100">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-md bg-amber-500 shadow-sm" />
                      <span className="text-xs font-bold text-purple-950">ลากิจ / ป่วย</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-amber-900 font-mono">
                        {overviewKpi.leaveCount.toLocaleString()} ({overviewKpi.leavePct.toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cohort Progress Bars Card */}
            <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-card space-y-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-black text-purple-950 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-700" />
                    <span>ความก้าวหน้ารายช่วงชั้น / กลุ่ม</span>
                  </h3>
                  <span className="text-xs text-purple-800/70 font-semibold">แยกตามเพศและชั้นปี</span>
                </div>
                <p className="text-xs text-purple-800/70">
                  สัดส่วนและอัตราการเข้าเรียนจำแนกตาม 3 สายกลุ่มหลัก
                </p>
              </div>

              <div className="space-y-4 py-2">
                {/* Cohort 1: ชาย */}
                <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-purple-950 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      กลุ่มนักศึกษาชาย ({overviewKpi.cohortMale.totalTeachers} กลุ่ม)
                    </span>
                    <span className="font-mono font-bold text-purple-900">
                      {overviewKpi.cohortMale.rate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-3 w-full bg-purple-100/70 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${overviewKpi.cohortMale.rate}%` }}
                      className="h-full bg-blue-600 rounded-full transition-all duration-700"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-purple-800/70">
                    <span>บันทึกแล้ว {overviewKpi.cohortMale.activeTeachers}/{overviewKpi.cohortMale.totalTeachers} กลุ่ม</span>
                    <span>เช็คชื่อรวม {overviewKpi.cohortMale.totalCheckins.toLocaleString()} ครั้ง</span>
                  </div>
                </div>

                {/* Cohort 2: หญิง ปี 2 */}
                <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-purple-950 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                      กลุ่มนักศึกษาหญิง ปี 2 ({overviewKpi.cohortFemale2.totalTeachers} กลุ่ม)
                    </span>
                    <span className="font-mono font-bold text-purple-900">
                      {overviewKpi.cohortFemale2.rate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-3 w-full bg-purple-100/70 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${overviewKpi.cohortFemale2.rate}%` }}
                      className="h-full bg-pink-600 rounded-full transition-all duration-700"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-purple-800/70">
                    <span>บันทึกแล้ว {overviewKpi.cohortFemale2.activeTeachers}/{overviewKpi.cohortFemale2.totalTeachers} กลุ่ม</span>
                    <span>เช็คชื่อรวม {overviewKpi.cohortFemale2.totalCheckins.toLocaleString()} ครั้ง</span>
                  </div>
                </div>

                {/* Cohort 3: หญิง ปี 3 */}
                <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-purple-950 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                      กลุ่มนักศึกษาหญิง ปี 3 ({overviewKpi.cohortFemale3.totalTeachers} กลุ่ม)
                    </span>
                    <span className="font-mono font-bold text-purple-900">
                      {overviewKpi.cohortFemale3.rate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-3 w-full bg-purple-100/70 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${overviewKpi.cohortFemale3.rate}%` }}
                      className="h-full bg-purple-600 rounded-full transition-all duration-700"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-purple-800/70">
                    <span>บันทึกแล้ว {overviewKpi.cohortFemale3.activeTeachers}/{overviewKpi.cohortFemale3.totalTeachers} กลุ่ม</span>
                    <span>เช็คชื่อรวม {overviewKpi.cohortFemale3.totalCheckins.toLocaleString()} ครั้ง</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Teacher Comparison Matrix Table (ตารางเปรียบเทียบทุกกลุ่ม 40 อาจารย์) */}
          <div className="bg-white rounded-3xl border border-purple-100 p-5 sm:p-6 shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100 pb-4">
              <div>
                <h3 className="text-base font-black text-purple-950 flex items-center gap-2">
                  <span>ตารางเปรียบเทียบความก้าวหน้าและการเช็คชื่อทุกกลุ่ม</span>
                  <span className="text-xs bg-purple-100 text-purple-900 font-bold px-2 py-0.5 rounded-full">
                    {filteredOverviewTeachers.length} กลุ่ม
                  </span>
                </h3>
                <p className="text-xs text-purple-800/70 mt-0.5">
                  แสดงสถิติ มา-ขาด-ลา อัตราการเข้าร่วม และวันที่บันทึกล่าสุดของอาจารย์ทุกกลุ่ม
                </p>
              </div>

              {/* Controls: Search, Sort, Export Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-purple-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={overviewSearch}
                    onChange={(e) => setOverviewSearch(e.target.value)}
                    placeholder="ค้นหาชื่ออาจารย์ / กลุ่ม..."
                    className="pl-9 pr-3 py-1.5 text-xs font-semibold rounded-xl border border-purple-200 bg-purple-50/40 text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-600 w-48 sm:w-56"
                  />
                </div>

                <div className="flex items-center gap-1 bg-purple-50 p-1 rounded-xl border border-purple-200 text-xs">
                  <button
                    onClick={() => setOverviewSort('default')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition ${
                      overviewSort === 'default' ? 'bg-purple-900 text-white shadow-sm' : 'text-purple-900 hover:bg-purple-100'
                    }`}
                  >
                    ลำดับกลุ่ม
                  </button>
                  <button
                    onClick={() => setOverviewSort('rate')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition ${
                      overviewSort === 'rate' ? 'bg-purple-900 text-white shadow-sm' : 'text-purple-900 hover:bg-purple-100'
                    }`}
                  >
                    เรียงตาม %
                  </button>
                  <button
                    onClick={() => setOverviewSort('sessions')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition ${
                      overviewSort === 'sessions' ? 'bg-purple-900 text-white shadow-sm' : 'text-purple-900 hover:bg-purple-100'
                    }`}
                  >
                    เรียงครั้ง
                  </button>
                </div>

                <button
                  onClick={exportOverviewExcel}
                  className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-950 font-bold text-xs flex items-center gap-1.5 transition"
                  title="ดาวน์โหลดตารางเปรียบเทียบเป็นไฟล์ Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-purple-800" />
                  <span>Excel</span>
                </button>

                <button
                  onClick={exportOverviewWord}
                  className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-950 font-bold text-xs flex items-center gap-1.5 transition"
                  title="ดาวน์โหลดตารางเปรียบเทียบเป็นไฟล์ Word"
                >
                  <FileText className="w-3.5 h-3.5 text-purple-800" />
                  <span>Word</span>
                </button>

                <button
                  onClick={printOverviewReport}
                  className="px-3 py-1.5 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                  title="พิมพ์รายงานสรุปภาพรวม"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>พิมพ์</span>
                </button>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto rounded-2xl border border-purple-100">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-purple-900 text-white">
                    <th className="py-3 px-3 font-black text-center w-12">ที่</th>
                    <th className="py-3 px-4 font-black">ชื่ออาจารย์ผู้ดูแล</th>
                    <th className="py-3 px-3 font-black">กลุ่ม</th>
                    <th className="py-3 px-3 font-black text-center">นักศึกษา</th>
                    <th className="py-3 px-3 font-black text-center">จำนวนครั้ง</th>
                    <th className="py-3 px-3 font-black text-center">มา</th>
                    <th className="py-3 px-3 font-black text-center">ขาด</th>
                    <th className="py-3 px-3 font-black text-center">ลา</th>
                    <th className="py-3 px-4 font-black text-center w-36">อัตราการมา</th>
                    <th className="py-3 px-3 font-black text-center">บันทึกล่าสุด</th>
                    <th className="py-3 px-3 font-black text-center">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100">
                  {filteredOverviewTeachers.map((t, idx) => (
                    <tr
                      key={t.id}
                      className="hover:bg-purple-50/60 transition group cursor-pointer"
                      onClick={() => {
                        setTeacherSearch(t.teacher);
                        setActiveTab('teachers');
                      }}
                    >
                      <td className="py-3 px-3 text-center font-mono font-bold text-purple-900/70">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-purple-950 group-hover:text-purple-700">
                        <div className="flex items-center gap-1.5">
                          <span>{t.teacher}</span>
                          {!t.isRecorded && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                              ยังไม่บันทึก
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-purple-800">
                        {t.group} ({t.cohortName})
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-purple-950">
                        {t.studentsCount}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-purple-950">
                        {t.datesCount}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700">
                        {t.present}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-rose-700">
                        {t.absent}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-amber-700">
                        {t.leave}
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-mono font-bold">
                            <span
                              className={
                                t.rate >= 80
                                  ? 'text-emerald-700'
                                  : t.rate >= 50
                                  ? 'text-amber-700'
                                  : 'text-rose-700'
                              }
                            >
                              {t.rate}%
                            </span>
                          </div>
                          <div className="h-2 w-full bg-purple-100/60 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${t.rate}%` }}
                              className={`h-full rounded-full transition-all duration-500 ${
                                t.rate >= 80 ? 'bg-emerald-500' : t.rate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center text-[11px] font-semibold text-purple-800/80">
                        {t.dates.length > 0 ? t.dates[t.dates.length - 1] : '-'}
                      </td>
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setTeacherSearch(t.teacher);
                            setActiveTab('teachers');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-purple-100 hover:bg-purple-900 hover:text-white text-purple-900 font-bold text-[11px] transition"
                        >
                          ดูรายละเอียด
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredOverviewTeachers.length === 0 && (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-purple-800/60 font-medium">
                        ไม่พบข้อมูลกลุ่มหรืออาจารย์ที่ตรงกับคำค้นหา
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {(activeTab === 'teachers' || activeTab === 'matrix') && (
        <div className="space-y-5 animate-fadeIn">
          {groupTabs()}
          <TeacherDetailPanel
            rows={allTeachersComparison}
            students={students}
            records={filteredRecords}
            selected={matrixTeacherName || null}
            onSelect={(name) => setMatrixTeacherName(name || '')}
            onExportExcel={exportTeacherExcel}
            onExportWord={exportTeacherWord}
            onPrint={printTeacherReport}
            onOpenStudent={(s) => setSelectedStudentForModal(s)}
          />
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="space-y-5 animate-fadeIn">
          {groupTabs()}

          <div className="rounded-3xl bg-gradient-to-br from-purple-800 via-purple-900 to-indigo-950 text-white p-5 sm:p-6 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-purple-200">กลุ่มที่ยังไม่มีการบันทึกการเช็คชื่อ</div>
                <div className="text-4xl font-black leading-tight mt-1">
                  {pendingRows.length}
                  <span className="text-base font-bold text-purple-300 ml-2">จาก {allTeachersComparison.length} กลุ่ม</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSharePdf}
                  disabled={pendingBusy || pendingRows.length === 0}
                  className="px-4 py-2.5 rounded-xl bg-white text-purple-900 hover:bg-purple-50 disabled:opacity-50 font-bold text-sm flex items-center gap-2 transition active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  {pendingBusy ? 'กำลังสร้าง PDF...' : 'แชร์เป็นไฟล์ PDF'}
                </button>
                <button
                  type="button"
                  onClick={handleCopyPendingLink}
                  className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-purple-950 font-black text-sm flex items-center gap-2 transition active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  คัดลอกลิงก์ (ไม่ต้องล็อกอิน)
                </button>
                <button
                  type="button"
                  onClick={handleOpenPendingLink}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 font-bold text-sm flex items-center gap-2 transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  ดูหน้าที่แชร์
                </button>
                <button
                  type="button"
                  onClick={exportPendingExcel}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 font-bold text-sm flex items-center gap-2 transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                  Excel
                </button>
              </div>
            </div>
            <p className="text-xs text-purple-300">
              ลิงก์ที่คัดลอกเป็นรายงาน ณ เวลาที่กด ทุกคนเปิดดูได้โดยไม่ต้องล็อกอิน หากข้อมูลเปลี่ยนให้คัดลอกลิงก์ใหม่
            </p>
          </div>

          {pendingRows.length === 0 ? (
            <div className="bg-white rounded-3xl border border-emerald-200 p-10 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-lg font-black text-emerald-900">ทุกกลุ่มบันทึกการเช็คชื่อครบแล้ว</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {pendingRows.map((t, idx) => (
                <div key={t.id} className="bg-white rounded-2xl border border-purple-100 shadow-card p-4 flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 text-sm font-black flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-purple-950 text-sm truncate">{t.teacher}</div>
                    <div className="text-xs text-purple-600/80 truncate">
                      {t.group} • {t.studentsCount} คน
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMatrixTeacherName(t.teacher);
                      setActiveTab('teachers');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-800 hover:text-white text-purple-800 text-xs font-bold transition shrink-0"
                  >
                    ดูกลุ่ม
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB: จัดการระดับกลุ่ม (LEVELS 01, 02, 03) ==================== */}
      {activeTab === 'levels' && (
        <div className="space-y-6 animate-fadeIn">
          {groupTabs()}
          {/* Action Notification Toast */}
          {levelActionMsg && (
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-bold animate-fadeIn ${
                levelActionMsg.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{levelActionMsg.text}</span>
              </div>
              <button onClick={() => setLevelActionMsg(null)} className="underline ml-2 text-xs">
                ปิด
              </button>
            </div>
          )}

          {/* ระดับ 01 / 02 / 03 */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {(
              [
                { id: '01', grad: 'from-sky-500 to-indigo-600', ring: 'ring-sky-300' },
                { id: '02', grad: 'from-violet-500 to-purple-700', ring: 'ring-purple-300' },
                { id: '03', grad: 'from-amber-400 to-orange-500', ring: 'ring-amber-300' },
              ] as const
            ).map((lv) => {
              const gCount = teachers.filter((t) => (t.level || '01') === lv.id).length;
              const sCount = students.filter((s) => (s.level || '01') === lv.id).length;
              const active = levelFilter === lv.id;
              return (
                <button
                  key={lv.id}
                  type="button"
                  onClick={() => setLevelFilter(active ? 'all' : lv.id)}
                  className={`relative overflow-hidden text-left rounded-3xl p-4 sm:p-5 text-white bg-gradient-to-br ${lv.grad} shadow-lg transition hover:-translate-y-0.5 ${
                    active ? `ring-4 ${lv.ring}` : levelFilter !== 'all' ? 'opacity-60' : ''
                  }`}
                >
                  <div className="absolute -right-4 -bottom-6 text-[96px] sm:text-[120px] leading-none font-black text-white/15 select-none">
                    {lv.id}
                  </div>
                  <div className="relative">
                    <div className="text-xs sm:text-sm font-bold text-white/85">ระดับ</div>
                    <div className="text-4xl sm:text-5xl font-black leading-none">{lv.id}</div>
                    <div className="mt-3 text-[11px] sm:text-xs font-semibold text-white/90 space-y-0.5">
                      <div>{gCount} กลุ่ม</div>
                      <div>{sCount} คน</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl p-3 sm:p-4 border border-purple-100 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาชื่ออาจารย์หรือกลุ่ม..."
                value={levelSearchTerm}
                onChange={(e) => setLevelSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-purple-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <label className="text-xs font-bold text-purple-800 flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={cascadeLevelToStudents}
                onChange={(e) => setCascadeLevelToStudents(e.target.checked)}
                className="rounded text-purple-700 w-4 h-4"
              />
              ปรับระดับนักศึกษาในกลุ่มตามอัตโนมัติ
            </label>
          </div>

          {/* Group Level Cards Grid */}
          <div className="space-y-3">
            {teachers
              .filter((t) => {
                const lvl = t.level || '01';
                if (levelFilter !== 'all' && lvl !== levelFilter) return false;
                if (levelSearchTerm.trim()) {
                  const s = levelSearchTerm.toLowerCase();
                  return t.name.toLowerCase().includes(s) || t.groupName.toLowerCase().includes(s);
                }
                return true;
              })
              .map((t, idx) => {
                const currentLvl = (t.level as GroupLevel) || '01';
                const groupStList = students.filter((s) => s.teacherName === t.name);
                const isExpanded = expandedLevelGroup === t.name;

                return (
                  <div
                    key={t.name}
                    className="bg-white rounded-3xl border border-purple-100 p-4 sm:p-5 shadow-card hover:shadow-card-hover transition space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Info */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900">
                            กลุ่มที่ {idx + 1}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-800">
                            {t.yearLevel} • {t.gender === 'ชาย' ? 'ชาย' : 'หญิง'}
                          </span>
                          <span
                            className={`text-xs font-black px-3 py-0.5 rounded-full border ${
                              currentLvl === '01'
                                ? 'bg-blue-50 text-blue-900 border-blue-200'
                                : currentLvl === '02'
                                ? 'bg-purple-50 text-purple-900 border-purple-200'
                                : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                            }`}
                          >
                            🏷️ ระดับ {currentLvl}
                          </span>
                        </div>

                        <h4 className="text-sm sm:text-base font-black text-purple-950">
                          {t.name}
                        </h4>
                        <p className="text-xs text-purple-800/80 font-medium">
                          {t.groupName} • นักศึกษาในกลุ่ม <strong>{groupStList.length}</strong> คน
                        </p>
                      </div>

                      {/* Right: Promote, Demote & Direct Select */}
                      <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                        {/* Direct Select */}
                        <select
                          value={currentLvl}
                          onChange={(e) =>
                            handleSetGroupLevelAdmin(t.name, e.target.value as GroupLevel)
                          }
                          className="px-3 py-1.5 text-xs font-bold rounded-xl bg-purple-50 border border-purple-200 text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer"
                        >
                          <option value="01">ระดับ 01 (พื้นฐาน)</option>
                          <option value="02">ระดับ 02 (ปานกลาง)</option>
                          <option value="03">ระดับ 03 (ก้าวหน้า)</option>
                        </select>

                        {/* Promote Button */}
                        <button
                          onClick={() => handlePromoteGroupLevelAdmin(t.name)}
                          disabled={currentLvl === '03'}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                          title="เลื่อนระดับกลุ่มขึ้น (01 -> 02 -> 03)"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                          <span>เลื่อนระดับ ⬆️</span>
                        </button>

                        {/* Demote Button */}
                        <button
                          onClick={() => handleDemoteGroupLevelAdmin(t.name)}
                          disabled={currentLvl === '01'}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                          title="ลดระดับกลุ่มลง (03 -> 02 -> 01)"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                          <span>ลดระดับ ⬇️</span>
                        </button>

                        {/* Expand Student Accordion */}
                        <button
                          onClick={() =>
                            setExpandedLevelGroup(isExpanded ? null : t.name)
                          }
                          className="px-3 py-1.5 rounded-xl border border-purple-200 hover:bg-purple-50 text-purple-900 font-bold text-xs transition flex items-center gap-1"
                        >
                          <span>{isExpanded ? 'ย่อรายชื่อ' : `ดู นศ. (${groupStList.length})`}</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Student Level List */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-purple-50 space-y-2 animate-fadeIn bg-purple-50/30 p-3 rounded-2xl">
                        <div className="flex items-center justify-between text-xs font-bold text-purple-900">
                          <span>รายชื่อนักศึกษาในกลุ่มนี้ ({groupStList.length} คน)</span>
                          <span className="text-[11px] text-purple-700 font-normal">
                            * สามารถปรับระดับนักศึกษารายคนได้อิสระ
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                          {groupStList.map((st, sIdx) => {
                            const stLvl = (st.level as GroupLevel) || '01';
                            return (
                              <div
                                key={st.studentId}
                                className="bg-white p-2.5 rounded-xl border border-purple-100 flex items-center justify-between gap-2 shadow-2xs"
                              >
                                <div className="min-w-0">
                                  <div className="text-xs font-black text-purple-950 truncate">
                                    {sIdx + 1}. {st.fullName}
                                  </div>
                                  <div className="text-[10px] text-purple-700 font-mono flex items-center gap-1.5">
                                    <span>{st.studentId}</span>
                                    <span>•</span>
                                    <span>{st.major || '-'}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                                      stLvl === '01'
                                        ? 'bg-blue-100 text-blue-900'
                                        : stLvl === '02'
                                        ? 'bg-purple-100 text-purple-900'
                                        : 'bg-emerald-100 text-emerald-900'
                                    }`}
                                  >
                                    ระดับ {stLvl}
                                  </span>

                                  <button
                                    onClick={() => handlePromoteStudentLevelAdmin(st.studentId)}
                                    disabled={stLvl === '03'}
                                    className="p-1 rounded bg-purple-50 hover:bg-emerald-100 text-purple-900 hover:text-emerald-700 disabled:opacity-30 transition"
                                    title="เลื่อนระดับ"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDemoteStudentLevelAdmin(st.studentId)}
                                    disabled={stLvl === '01'}
                                    className="p-1 rounded bg-purple-50 hover:bg-rose-100 text-purple-900 hover:text-rose-700 disabled:opacity-30 transition"
                                    title="ลดระดับ"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ==================== TAB 3: PERIODIC SUMMARY (วัน/เดือน/ปี ที่บันทึกจริง) ==================== */}
      {activeTab === 'periodic' && (
        <>
        {reportTabs()}

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
        </>
      )}

      {/* ==================== โยกย้ายกลุ่ม ==================== */}
      {activeTab === 'transfer' && (
        <div className="animate-fadeIn">
          <TransferPanel teachers={teachers} students={students} onChanged={reloadDataStore} />
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
            <div className="bg-purple-100/70 p-1 rounded-full border border-purple-200 flex flex-wrap gap-1">
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
              <button
                type="button"
                onClick={() => setEditorSubTab('majors')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  editorSubTab === 'majors' ? 'bg-purple-800 text-white shadow-sm' : 'text-purple-900'
                }`}
              >
                สาขาวิชา ({majorsList.length})
              </button>
            </div>
          </div>

          {/* Feedback Message */}
          {(editorMsg || majorMsg) && (
            <div
              className={`p-3 rounded-xl text-xs font-bold border flex items-center justify-between ${
                (editorMsg?.success || majorMsg?.success)
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              <span>{editorMsg?.text || majorMsg?.text}</span>
              <button onClick={() => { setEditorMsg(null); setMajorMsg(null); }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Action & Search Row (for students / teachers) */}
          {editorSubTab !== 'majors' && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-purple-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder={
                    editorSubTab === 'students'
                      ? 'ค้นหารหัส, ชื่อ นศ., สาขาวิชา, อาจารย์...'
                      : 'ค้นหาชื่ออาจารย์, กลุ่ม...'
                  }
                  value={editorSearch}
                  onChange={(e) => setEditorSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs border border-purple-200 rounded-xl bg-purple-50/30 text-purple-950 placeholder-purple-300"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Button: Add Single */}
                {editorSubTab === 'students' ? (
                  <button
                    type="button"
                    onClick={() => setIsAddStudentModalOpen(true)}
                    className="px-3.5 py-2.5 bg-purple-800 hover:bg-purple-900 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>เพิ่มนักศึกษา</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddTeacherModalOpen(true)}
                    className="px-3.5 py-2.5 bg-purple-800 hover:bg-purple-900 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>เพิ่มอาจารย์</span>
                  </button>
                )}

                {/* Button: Download Excel Template */}
                {editorSubTab === 'students' && (
                  <button
                    type="button"
                    onClick={() => downloadStudentImportTemplate({ majors: majorsList, teachers: teachers.map((t) => t.name) })}
                    className="px-3 py-2.5 bg-white hover:bg-emerald-50 text-emerald-950 border border-emerald-300 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
                    title="ดาวน์โหลดไฟล์เทมเพลต Excel สำหรับกรอกข้อมูล นศ."
                  >
                    <Download className="w-4 h-4 text-emerald-700" />
                    <span>โหลดเทมเพลต Excel</span>
                  </button>
                )}

                {/* Button: Import Excel File */}
                {editorSubTab === 'students' && (
                  <button
                    type="button"
                    onClick={() => setIsExcelImportModalOpen(true)}
                    className="px-3 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                    title="นำเข้าไฟล์ Excel (.xlsx) ที่กรอกเสร็จแล้ว"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>นำเข้าไฟล์ Excel</span>
                  </button>
                )}

                {/* Button: Bulk Paste / Import (Teachers only - removed for students per user request) */}
                {editorSubTab === 'teachers' && (
                  <button
                    type="button"
                    onClick={() => {
                      setBulkImportType('teachers');
                      setBulkRawText('');
                      setIsBulkImportModalOpen(true);
                    }}
                    className="px-3 py-2.5 bg-purple-100 hover:bg-purple-200 text-purple-950 border border-purple-200 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
                    title="คัดลอกและวางข้อมูลอาจารย์จาก Excel / ชีต หรือข้อความ"
                  >
                    <Upload className="w-4 h-4 text-purple-700" />
                    <span>คัดลอก/วาง ข้อความ (อาจารย์)</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Students List & Advanced Filtering */}
          {editorSubTab === 'students' && (
            <div className="space-y-3">
              {/* Quick Filter Pills & Result Counter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                {/* Status Filter Buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setStudentStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      studentStatusFilter === 'all'
                        ? 'bg-purple-800 text-white shadow-xs'
                        : 'bg-white hover:bg-purple-50 text-purple-900 border border-purple-200'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>ทั้งหมด ({students.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStudentStatusFilter('unassigned')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      studentStatusFilter === 'unassigned'
                        ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-400'
                        : unassignedStudentsCount > 0
                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                        : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
                    }`}
                  >
                    <AlertTriangle className={`w-3.5 h-3.5 ${unassignedStudentsCount > 0 && studentStatusFilter !== 'unassigned' ? 'text-amber-600' : ''}`} />
                    <span>⚠️ ตกหล่น/ไม่มีอาจารย์ ({unassignedStudentsCount})</span>
                    {unassignedStudentsCount > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                        studentStatusFilter === 'unassigned' ? 'bg-white text-amber-800' : 'bg-amber-200 text-amber-900'
                      }`}>
                        ต้องระบุ
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStudentStatusFilter('assigned')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      studentStatusFilter === 'assigned'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>มีอาจารย์แล้ว ({assignedStudentsCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStudentStatusFilter('duplicate')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      studentStatusFilter === 'duplicate'
                        ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-400'
                        : duplicateStudentInfo.count > 0
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300'
                        : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
                    }`}
                  >
                    <AlertTriangle className={`w-3.5 h-3.5 ${duplicateStudentInfo.count > 0 && studentStatusFilter !== 'duplicate' ? 'text-rose-600' : ''}`} />
                    <span>⚠️ ตรวจพบชื่อ/รหัสซ้ำ ({duplicateStudentInfo.count})</span>
                    {duplicateStudentInfo.count > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                        studentStatusFilter === 'duplicate' ? 'bg-white text-rose-800' : 'bg-rose-200 text-rose-900'
                      }`}>
                        ต้องตรวจ
                      </span>
                    )}
                  </button>
                </div>

                {/* Counter, Select-All Shortcut & Clear filters button */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-purple-900 font-medium self-end sm:self-auto">
                  {filteredStudents.length > 0 && (
                    <button
                      type="button"
                      onClick={handleToggleSelectAllStudents}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-900 text-[11px] font-bold transition-all active:scale-95 shadow-xs"
                      title={isAllFilteredSelected ? 'ยกเลิกการเลือกทั้งหมด' : 'เลือกนักศึกษาทั้งหมดที่แสดงตามตัวกรอง'}
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>{isAllFilteredSelected ? 'ยกเลิกเลือกทั้งหมด' : `เลือกทั้งหมด (${filteredStudents.length})`}</span>
                    </button>
                  )}

                  <span>
                    แสดง <strong className="font-extrabold text-purple-950">{filteredStudents.length}</strong> จาก {students.length} คน
                  </span>
                  {hasActiveStudentFilters && (
                    <button
                      type="button"
                      onClick={handleResetStudentFilters}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-semibold transition-all active:scale-95"
                      title="ล้างตัวกรองและการค้นหาทั้งหมด"
                    >
                      <X className="w-3 h-3" />
                      <span>ล้างตัวกรอง</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Secondary Filter Controls (Dropdowns: ชั้นปี, เพศ, สาขาวิชา, อาจารย์) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-purple-50/50 p-2.5 rounded-2xl border border-purple-100">
                <div>
                  <label className="block text-[10px] font-bold text-purple-900 mb-1">ชั้นปี</label>
                  <select
                    value={studentYearFilter}
                    onChange={(e) => setStudentYearFilter(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-purple-200 rounded-lg text-purple-950 font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="all">ทุกชั้นปี</option>
                    <option value="ปี 1">ปี 1</option>
                    <option value="ปี 2">ปี 2</option>
                    <option value="ปี 3">ปี 3</option>
                    <option value="ปี 4">ปี 4</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-purple-900 mb-1">เพศ</label>
                  <select
                    value={studentGenderFilter}
                    onChange={(e) => setStudentGenderFilter(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-purple-200 rounded-lg text-purple-950 font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="all">ทุกเพศ</option>
                    <option value="ชาย">ชาย</option>
                    <option value="หญิง">หญิง</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-purple-900 mb-1">สาขาวิชา</label>
                  <select
                    value={studentMajorFilter}
                    onChange={(e) => setStudentMajorFilter(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-purple-200 rounded-lg text-purple-950 font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="all">ทุกสาขาวิชา ({majorsList.length})</option>
                    {majorsList.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-purple-900 mb-1">อาจารย์ผู้ดูแล</label>
                  <select
                    value={studentTeacherFilter}
                    onChange={(e) => setStudentTeacherFilter(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-purple-200 rounded-lg text-purple-950 font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="all">ทุกอาจารย์ ({teachers.length})</option>
                    <option value="__unassigned__" className="text-amber-700 font-bold">⚠️ เฉพาะไม่มีอาจารย์/ตกหล่น</option>
                    {teachers.map((t) => (
                      <option key={t.groupId} value={t.name}>
                        {t.name} ({t.groupName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* BATCH ACTION BAR (When 1 or more students are selected) */}
              {selectedStudentIds.length > 0 && (
                <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white p-3.5 rounded-2xl shadow-xl border border-purple-600 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-purple-950 font-black text-xs shadow-sm ring-2 ring-purple-300">
                      {selectedStudentIds.length}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-extrabold text-xs text-white">เลือกนักศึกษาอยู่ {selectedStudentIds.length} คน</p>
                        {!isAllFilteredSelected && filteredStudents.length > selectedStudentIds.length && (
                          <button
                            type="button"
                            onClick={handleToggleSelectAllStudents}
                            className="px-2 py-0.5 bg-purple-800/80 hover:bg-purple-700 text-purple-200 hover:text-white rounded text-[10px] font-bold transition-all underline"
                          >
                            เลือกทั้งหมดที่แสดง ({filteredStudents.length})
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-purple-200">
                        สามารถกำหนดอาจารย์ผู้ดูแลพร้อมกัน หรือกดลบนักศึกษาที่เลือกทั้งหมดออกจากระบบ
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Batch Assign Group */}
                    <div className="flex items-center gap-1.5 bg-purple-900/60 p-1 rounded-xl border border-purple-500/50">
                      <select
                        value={batchTargetTeacher}
                        onChange={(e) => setBatchTargetTeacher(e.target.value)}
                        className="px-2.5 py-1.5 text-xs bg-white text-purple-950 font-bold rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-purple-400 max-w-[200px] sm:max-w-xs"
                      >
                        <option value="">-- เลือกอาจารย์เป้าหมาย --</option>
                        {teachers.map((t) => (
                          <option key={t.groupId} value={t.name}>
                            {t.name} ({t.groupName} - {t.gender} {t.yearLevel})
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={handleBatchAssignTeacher}
                        disabled={!batchTargetTeacher || isBatchAssigning}
                        className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1 active:scale-95 whitespace-nowrap"
                        title="กำหนดอาจารย์ผู้ดูแลให้นักศึกษาที่เลือกทั้งหมด"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isBatchAssigning ? 'บันทึก...' : 'กำหนดอาจารย์'}</span>
                      </button>
                    </div>

                    {/* Batch Delete Button */}
                    <button
                      type="button"
                      onClick={handleBatchDeleteStudents}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 whitespace-nowrap"
                      title="ลบข้อมูลนักศึกษาที่เลือกทั้งหมดออกจากระบบอย่างถาวร"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>ลบที่เลือก ({selectedStudentIds.length} คน)</span>
                    </button>

                    {/* Deselect / Cancel */}
                    <button
                      type="button"
                      onClick={() => setSelectedStudentIds([])}
                      className="px-3 py-2 bg-purple-800/80 hover:bg-purple-700 text-purple-200 hover:text-white font-semibold text-xs rounded-xl transition-all"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              )}

              {/* Quick shortcut banner when viewing unassigned and not all selected */}
              {studentStatusFilter === 'unassigned' && unassignedStudentsCount > 0 && selectedStudentIds.length === 0 && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-amber-950">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      พบนศ. ที่ยังไม่มีอาจารย์ผู้ดูแลหรือตกหล่นจำนวน <strong className="font-bold text-amber-900">{unassignedStudentsCount}</strong> คน
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSelectAllUnassigned}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition-all shadow-xs active:scale-95 flex items-center gap-1.5"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>เลือก นศ. ที่ไม่มีอาจารย์ทั้งหมด ({unassignedStudentsCount} คน)</span>
                  </button>
                </div>
              )}

              {/* Quick shortcut banner when viewing duplicates */}
              {studentStatusFilter === 'duplicate' && duplicateStudentInfo.count > 0 && (
                <div className="bg-rose-50 border border-rose-300 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-rose-950 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      ตรวจพบรายชื่อนักศึกษาที่มีรหัสหรือชื่อซ้ำกันทั้งหมด <strong className="font-bold text-rose-900">{duplicateStudentInfo.count}</strong> รายการ (เรียงกลุ่มซ้ำติดกันเพื่อให้เปรียบเทียบและลบได้ง่าย)
                    </span>
                  </div>
                  {selectedStudentIds.length === 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedStudentIds(filteredStudents.map((s) => s.studentId))}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-all shadow-xs active:scale-95 flex items-center gap-1.5 shrink-0"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>เลือกรายการซ้ำทั้งหมด ({duplicateStudentInfo.count} คน)</span>
                    </button>
                  )}
                </div>
              )}

              {/* Students Data Table */}
              <div className="overflow-x-auto border border-purple-100 rounded-2xl shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-purple-100/60 text-purple-950 font-bold border-b border-purple-200">
                      <th className="py-2.5 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={isAllFilteredSelected}
                          onChange={handleToggleSelectAllStudents}
                          className="w-4 h-4 rounded border-purple-300 text-purple-800 focus:ring-purple-400 cursor-pointer"
                          title={isAllFilteredSelected ? 'ยกเลิกการเลือกทั้งหมด' : 'เลือกทั้งหมดที่แสดง'}
                        />
                      </th>
                      <th className="py-2.5 px-3">รหัส</th>
                      <th className="py-2.5 px-3">ชื่อ - นามสกุล</th>
                      <th className="py-2.5 px-3">สาขาวิชา</th>
                      <th className="py-2.5 px-3 text-center">เพศ</th>
                      <th className="py-2.5 px-3 text-center">ชั้นปี</th>
                      <th className="py-2.5 px-3">กลุ่ม</th>
                      <th className="py-2.5 px-3">อาจารย์ผู้ดูแล</th>
                      <th className="py-2.5 px-3 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-50">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-gray-500">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <UserX className="w-8 h-8 text-purple-300" />
                            <p className="font-semibold text-sm text-purple-950">ไม่พบข้อมูลนักศึกษาที่ตรงกับเงื่อนไข</p>
                            <p className="text-xs text-purple-500">ลองเปลี่ยนคำค้นหา หรือล้างตัวกรองเพื่อดูข้อมูลทั้งหมด</p>
                            {hasActiveStudentFilters && (
                              <button
                                type="button"
                                onClick={handleResetStudentFilters}
                                className="mt-2 px-3.5 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-xl font-bold text-xs transition-all"
                              >
                                ล้างตัวกรองทั้งหมด
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((st) => {
                        const isUnassigned = isStudentUnassigned(st);
                        const isSelected = selectedStudentIds.includes(st.studentId);
                        const isTeacherDeleted = st.teacherName && !activeTeacherNamesSet.has(st.teacherName.trim());
                        const isDup = duplicateStudentInfo.isDuplicate(st);
                        const dupReason = duplicateStudentInfo.getDuplicateReason(st);

                        return (
                          <tr
                            key={st.studentId}
                            className={`transition-colors ${
                              isSelected
                                ? 'bg-purple-100/70'
                                : isDup
                                ? 'bg-rose-50/60 hover:bg-rose-100/70'
                                : isUnassigned
                                ? 'bg-amber-50/40 hover:bg-amber-100/50'
                                : 'hover:bg-purple-50/40'
                            }`}
                          >
                            <td className="py-2 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectStudent(st.studentId)}
                                className="w-4 h-4 rounded border-purple-300 text-purple-800 focus:ring-purple-400 cursor-pointer"
                              />
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-purple-900">
                              <div className="flex items-center gap-1">
                                <span>{st.studentId}</span>
                                {duplicateStudentInfo.duplicateIdSet.has((st.studentId || '').trim().toLowerCase()) && (
                                  <span className="px-1 py-0.2 rounded text-[9px] font-black bg-rose-200 text-rose-900 border border-rose-300" title="รหัสนักศึกษานี้ซ้ำกับรายการอื่น">
                                    รหัสซ้ำ
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2 px-3 font-bold text-purple-950">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span>{st.fullName}</span>
                                {dupReason && (
                                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                                    ⚠️ {dupReason}
                                  </span>
                                )}
                                {isUnassigned && (
                                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                                    ตกหล่น
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200 whitespace-nowrap">
                                {getStudentMajor(st)}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  st.gender === 'ชาย' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                                }`}
                              >
                                {st.gender}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center font-medium">{st.yearLevel}</td>
                            <td className="py-2 px-3 text-purple-800/80">{st.groupName || '-'}</td>
                            <td className="py-2 px-3">
                              {isUnassigned ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  <span>{isTeacherDeleted ? `${st.teacherName} (ไม่อยู่ในระบบ)` : 'ยังไม่มีอาจารย์'}</span>
                                </span>
                              ) : (
                                <span className="text-purple-900 font-semibold">{st.teacherName}</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOriginalStudentId(st.studentId);
                                    setEditingStudent(st);
                                  }}
                                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-lg font-bold text-[11px] transition-all"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>แก้ไข</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStudent(st.studentId, st.fullName)}
                                  className="p-1 hover:bg-rose-100 text-rose-600 rounded-lg transition-all"
                                  title="ลบนักศึกษา"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
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
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setOriginalTeacherName(t.name);
                                  setEditingTeacher(t);
                                }}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-lg font-bold text-[11px] transition-all"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>แก้ไข</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTeacher(t.name)}
                                className="p-1 hover:bg-rose-100 text-rose-600 rounded-lg transition-all"
                                title="ลบอาจารย์"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}

          {/* Majors List & Management View */}
          {editorSubTab === 'majors' && (
            <MajorsPanel
              majors={majorsList}
              students={students}
              onAdd={(name) => {
                const res = addNewMajor(name);
                setMajorMsg({ text: res.message, success: res.success });
                reloadDataStore();
                setTimeout(() => setMajorMsg(null), 4000);
              }}
              onRename={(from, to) => {
                const res = renameMajor(from, to);
                setMajorMsg({ text: res.message, success: res.success });
                reloadDataStore();
                setTimeout(() => setMajorMsg(null), 4000);
              }}
              onDelete={handleDeleteMajor}
            />
          )}

          {/* EDIT STUDENT MODAL */}
          {editingStudent && (
            <ModalPortal>
              <div
                className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
                onClick={(e) => {
                  if (e.target === e.currentTarget) setEditingStudent(null);
                }}
              >
                <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md border border-purple-200 shadow-2xl space-y-4 my-auto animate-fadeIn max-h-[92vh] overflow-y-auto">
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
                      value={editingStudent.teacherName || ''}
                      onChange={(e) => {
                        const t = teachers.find((item) => item.name === e.target.value);
                        setEditingStudent({
                          ...editingStudent,
                          teacherName: e.target.value,
                          groupName: t ? t.groupName : editingStudent.groupName,
                          groupId: t ? t.groupId : editingStudent.groupId,
                        });
                      }}
                      className="w-full mt-1 p-2.5 border border-purple-200 rounded-xl font-semibold"
                    >
                      {!teachers.some((t) => t.name === editingStudent.teacherName) && (
                        <option value={editingStudent.teacherName || ''}>
                          ⚠️ {editingStudent.teacherName ? `${editingStudent.teacherName} (ไม่อยู่ในระบบ/ตกหล่น)` : '-- ยังไม่มีอาจารย์ผู้ดูแล (ตกหล่น) --'}
                        </option>
                      )}
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

                  <div>
                    <label className="font-bold text-purple-900">สาขาวิชา</label>
                    <select
                      value={editingStudent.major || getStudentMajor(editingStudent)}
                      onChange={(e) => setEditingStudent({ ...editingStudent, major: e.target.value })}
                      className="w-full mt-1 p-2.5 border border-purple-200 rounded-xl font-semibold"
                    >
                      {majorsList.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
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
          </ModalPortal>
        )}

        {/* EDIT TEACHER MODAL */}
        {editingTeacher && (
          <ModalPortal>
            <div
              className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
              onClick={(e) => {
                if (e.target === e.currentTarget) setEditingTeacher(null);
              }}
            >
              <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md border border-purple-200 shadow-2xl space-y-4 my-auto animate-fadeIn max-h-[92vh] overflow-y-auto">
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
          </ModalPortal>
        )}

          {/* ==================== MODAL: ADD STUDENT (เดี่ยว) ==================== */}
          {isAddStudentModalOpen && (
            <ModalPortal>
              <div
                className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
                onClick={(e) => {
                  if (e.target === e.currentTarget) setIsAddStudentModalOpen(false);
                }}
              >
                <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md border border-purple-200 shadow-2xl space-y-4 my-auto animate-fadeIn max-h-[92vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                    <h3 className="font-extrabold text-sm sm:text-base text-purple-950 flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4 text-purple-700" />
                      <span>เพิ่มข้อมูลนักศึกษาใหม่</span>
                    </h3>
                    <button onClick={() => setIsAddStudentModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                <form onSubmit={handleCreateStudent} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-purple-900">รหัสนักศึกษา <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      placeholder="เช่น 681441001"
                      value={newStudentData.studentId}
                      onChange={(e) => setNewStudentData({ ...newStudentData, studentId: e.target.value })}
                      className="w-full mt-1 p-2.5 border border-purple-200 rounded-xl font-mono font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-purple-900">ชื่อ - นามสกุล <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      placeholder="เช่น นายอับดุลลอฮ์ มูซา"
                      value={newStudentData.fullName}
                      onChange={(e) => setNewStudentData({ ...newStudentData, fullName: e.target.value })}
                      className="w-full mt-1 p-2.5 border border-purple-200 rounded-xl font-semibold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-purple-900">เพศ</label>
                      <select
                        value={newStudentData.gender}
                        onChange={(e) => setNewStudentData({ ...newStudentData, gender: e.target.value as any })}
                        className="w-full mt-1 p-2.5 border border-purple-200 rounded-xl font-semibold"
                      >
                        <option value="ชาย">ชาย</option>
                        <option value="หญิง">หญิง</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-purple-900">ชั้นปี</label>
                      <select
                        value={newStudentData.yearLevel}
                        onChange={(e) => setNewStudentData({ ...newStudentData, yearLevel: e.target.value })}
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
                      value={newStudentData.teacherName}
                      onChange={(e) => {
                        const t = teachers.find((item) => item.name === e.target.value);
                        setNewStudentData({
                          ...newStudentData,
                          teacherName: e.target.value,
                          groupName: t ? t.groupName : newStudentData.groupName,
                        });
                      }}
                      className="w-full mt-1 p-2.5 border border-purple-200 rounded-xl font-semibold"
                    >
                      <option value="">-- เลือกอาจารย์ผู้ดูแล --</option>
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
                      placeholder="เช่น ชั้นปีที่ 2 กลุ่มที่ 1"
                      value={newStudentData.groupName}
                      onChange={(e) => setNewStudentData({ ...newStudentData, groupName: e.target.value })}
                      className="w-full mt-1 p-2.5 border border-purple-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-purple-900 flex items-center justify-between">
                      <span>สาขาวิชา</span>
                      <span className="text-[10px] text-purple-600 font-normal">
                        *หากไม่เลือก จะตรวจจับจากรหัสให้อัตโนมัติ
                      </span>
                    </label>
                    <select
                      value={newStudentData.major || ''}
                      onChange={(e) => setNewStudentData({ ...newStudentData, major: e.target.value })}
                      className="w-full mt-1 p-2.5 border border-purple-200 rounded-xl font-semibold"
                    >
                      <option value="">-- ตรวจจับอัตโนมัติตามรหัสนักศึกษา --</option>
                      {majorsList.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddStudentModalOpen(false)}
                      className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-sm"
                    >
                      เพิ่มนักศึกษา
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </ModalPortal>
        )}

        {/* ==================== MODAL: ADD TEACHER (เดี่ยว) ==================== */}
        {isAddTeacherModalOpen && (
          <ModalPortal>
            <div
              className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsAddTeacherModalOpen(false);
              }}
            >
              <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md border border-purple-200 shadow-2xl space-y-4 my-auto animate-fadeIn max-h-[92vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-purple-950 flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-purple-700" />
                    <span>เพิ่มข้อมูลอาจารย์ใหม่</span>
                  </h3>
                  <button onClick={() => setIsAddTeacherModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateTeacher} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-purple-900">ชื่อ - สกุล อาจารย์ <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      placeholder="เช่น อาจารย์ฮาซัน มูซา"
                      value={newTeacherData.name}
                      onChange={(e) => setNewTeacherData({ ...newTeacherData, name: e.target.value })}
                      className="w-full mt-1 p-2.5 border border-purple-200 rounded-xl font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-purple-900">ชื่อกลุ่มหะละเกาะห์</label>
                    <input
                      type="text"
                      placeholder="เช่น ชั้นปีที่ 2 กลุ่มที่ 10"
                      value={newTeacherData.groupName}
                      onChange={(e) => setNewTeacherData({ ...newTeacherData, groupName: e.target.value })}
                      className="w-full mt-1 p-2.5 border border-purple-200 rounded-xl font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-purple-900">เพศกลุ่ม</label>
                      <select
                        value={newTeacherData.gender}
                        onChange={(e) => setNewTeacherData({ ...newTeacherData, gender: e.target.value as any })}
                        className="w-full mt-1 p-2.5 border border-purple-200 rounded-xl font-semibold"
                      >
                        <option value="ชาย">ชาย</option>
                        <option value="หญิง">หญิง</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-purple-900">ชั้นปีที่กำกับดูแล</label>
                      <select
                        value={newTeacherData.yearLevel}
                        onChange={(e) => setNewTeacherData({ ...newTeacherData, yearLevel: e.target.value })}
                        className="w-full mt-1 p-2.5 border border-purple-200 rounded-xl font-semibold"
                      >
                        <option value="ปี 2">ปี 2</option>
                        <option value="ปี 3">ปี 3</option>
                        <option value="ปี 4">ปี 4</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddTeacherModalOpen(false)}
                      className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-sm"
                    >
                      เพิ่มอาจารย์
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </ModalPortal>
        )}

        {/* ==================== MODAL: BULK IMPORT / PASTE (คัดลอก-วางจากที่อื่น) ==================== */}
        {isBulkImportModalOpen && (
          <ModalPortal>
            <div
              className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsBulkImportModalOpen(false);
              }}
            >
              <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-xl border border-purple-200 shadow-2xl space-y-4 max-h-[92vh] flex flex-col my-auto animate-fadeIn overflow-y-auto">
                <div className="flex items-center justify-between border-b border-purple-100 pb-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm sm:text-base text-purple-950">
                        คัดลอกและวางข้อมูล ({bulkImportType === 'students' ? 'นักศึกษา' : 'อาจารย์'})
                      </h3>
                      <p className="text-[11px] text-purple-750/70 font-medium">
                        วางข้อมูลที่คัดลอกมาจาก Excel, Google Sheets หรือตารางข้อความได้ทันที
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setIsBulkImportModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 overflow-y-auto flex-1 pr-1 text-xs">
                  {/* Format Helper Banner */}
                  <div className="p-3 bg-purple-50/80 rounded-2xl border border-purple-200/80 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-purple-950 text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                      <span>รูปแบบการวางที่รองรับ:</span>
                    </div>
                    {bulkImportType === 'students' ? (
                      <p className="text-[11px] text-purple-900/80 leading-relaxed font-mono">
                        รหัสนักศึกษา [Tab หรือวรรค] ชื่อ-นามสกุล [Tab หรือวรรค] เพศ [Tab] ชั้นปี<br />
                        <span className="text-purple-600 font-sans">* ระบบตรวจจับ <strong>สาขาวิชา</strong> ให้โดยอัตโนมัติจากรหัส 9 หลัก หรือวางเฉพาะ <strong>รหัสนักศึกษา</strong> และ <strong>ชื่อ-นามสกุล</strong> ได้ทันที</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-purple-900/80 leading-relaxed font-mono">
                        ชื่อ-สกุล อาจารย์ [Tab หรือวรรค] ชื่อกลุ่ม [Tab] เพศ [Tab] ชั้นปี<br />
                        <span className="text-purple-600 font-sans">* หรือวางเฉพาะ <strong>ชื่ออาจารย์</strong> แต่ละบรรทัดได้ทันที</span>
                      </p>
                    )}
                  </div>

                  {/* Defaults for missing fields */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-gray-50/70 p-3 rounded-2xl border border-gray-200">
                    {bulkImportType === 'students' && (
                      <div className="col-span-2 sm:col-span-1">
                        <label className="font-bold text-purple-950 block mb-0.5 text-[11px]">อาจารย์เริ่มต้น:</label>
                        <select
                          value={bulkDefaultTeacher}
                          onChange={(e) => setBulkDefaultTeacher(e.target.value)}
                          className="w-full p-2 border border-purple-200 rounded-xl font-semibold bg-white"
                        >
                          {teachers.map((t) => (
                            <option key={t.groupId} value={t.name}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="font-bold text-purple-950 block mb-0.5 text-[11px]">เพศเริ่มต้น:</label>
                      <select
                        value={bulkDefaultGender}
                        onChange={(e) => setBulkDefaultGender(e.target.value as any)}
                        className="w-full p-2 border border-purple-200 rounded-xl font-semibold bg-white"
                      >
                        <option value="ชาย">ชาย</option>
                        <option value="หญิง">หญิง</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-purple-950 block mb-0.5 text-[11px]">ชั้นปีเริ่มต้น:</label>
                      <select
                        value={bulkDefaultYear}
                        onChange={(e) => setBulkDefaultYear(e.target.value)}
                        className="w-full p-2 border border-purple-200 rounded-xl font-semibold bg-white"
                      >
                        <option value="ปี 2">ปี 2</option>
                        <option value="ปี 3">ปี 3</option>
                        <option value="ปี 4">ปี 4</option>
                      </select>
                    </div>
                  </div>

                  {/* Textarea for copy/paste */}
                  <div>
                    <label className="font-bold text-purple-950 block mb-1">
                      วางข้อความที่คัดลอกมาที่นี่ (Ctrl + V):
                    </label>
                    <textarea
                      rows={8}
                      placeholder={
                        bulkImportType === 'students'
                          ? "681441001\tนายอับดุลลอฮ์ บินอะห์มัด\tชาย\tปี 2\n681441002\tนายมูฮัมหมัด ซาและ\tชาย\tปี 2\n681441003\tนางสาวฟาติมะฮ์ ดอเลาะ\tหญิง\tปี 2"
                          : "อาจารย์อับดุลลอฮ์ มาหะมะ\tกลุ่มที่ 1\tชาย\tปี 2\nอาจารย์มารียัม มะแซ\tกลุ่มที่ 2\tหญิง\tปี 2"
                      }
                      value={bulkRawText}
                      onChange={(e) => setBulkRawText(e.target.value)}
                      className="w-full p-3 font-mono text-xs border border-purple-200 rounded-2xl bg-purple-50/20 text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                    <div className="flex items-center justify-between text-[11px] text-purple-750/70 mt-1">
                      <span>จำนวนบรรทัดที่วาง: {bulkRawText.split(/\r?\n/).filter((l) => l.trim()).length} รายการ</span>
                      <button
                        type="button"
                        onClick={() => setBulkRawText('')}
                        className="text-purple-600 hover:text-purple-900 font-bold"
                      >
                        ล้างข้อความ
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-purple-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsBulkImportModalOpen(false)}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 text-xs"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleProcessBulkImport}
                    className="px-5 py-2 bg-gradient-to-r from-purple-800 to-purple-900 hover:from-purple-900 hover:to-purple-950 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>นำเข้าข้อมูลเข้าระบบ</span>
                  </button>
                </div>
              </div>
            </div>
          </ModalPortal>
        )}
        </div>
      )}

      {/* ==================== TAB 6: EXPORT CENTER (ศูนย์ส่งออกไฟล์อัจฉริยะ) ==================== */}
      {activeTab === 'export' && (
        <div className="bg-white rounded-3xl border border-purple-100 p-5 sm:p-7 shadow-card space-y-6 animate-fadeIn">
          <div className="border-b border-purple-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-2xl bg-purple-100 text-purple-900 text-lg">📤</span>
              <div>
                <h2 className="text-base sm:text-xl font-black text-purple-950 flex items-center gap-2">
                  <span>ศูนย์ส่งออกรายงานอัจฉริยะ (Comprehensive Export Center)</span>
                </h2>
                <p className="text-xs text-purple-800/70 mt-0.5">
                  รองรับการเลือกส่งออกทั้งแบบ <strong>ภาพรวมทั้งโครงการ (มีรายละเอียดนักศึกษาทุกคน การเข้าร่วม อัตรา % และผลผ่าน/ไม่ผ่าน)</strong> หรือเลือก <strong>ส่งออกแบบรายกลุ่ม</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Mode Switcher: ภาพรวมทั้งโครงการ vs รายกลุ่ม */}
          <div className="bg-purple-50/70 p-3 sm:p-4 rounded-3xl border border-purple-200/80 space-y-4">
            <label className="text-xs font-black text-purple-950 block">
              1. เลือกขอบเขตข้อมูลที่ต้องการส่งออก (Export Scope):
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Master Overview */}
              <button
                type="button"
                onClick={() => setExportMode('master')}
                className={`p-4 rounded-2xl text-left border transition-all flex items-start gap-3 ${
                  exportMode === 'master'
                    ? 'bg-purple-900 text-white border-purple-950 shadow-md ring-2 ring-purple-600'
                    : 'bg-white hover:bg-purple-100/50 border-purple-200 text-purple-950'
                }`}
              >
                <div className={`p-2 rounded-xl text-lg ${exportMode === 'master' ? 'bg-purple-800 text-amber-300' : 'bg-purple-100 text-purple-800'}`}>
                  📊
                </div>
                <div>
                  <div className="font-black text-sm flex items-center gap-1.5">
                    <span>ภาพรวมทั้งโครงการ (Master Overview)</span>
                    {exportMode === 'master' && <span className="text-[10px] bg-amber-400 text-purple-950 px-1.5 py-0.2 rounded font-black">เลือกอยู่</span>}
                  </div>
                  <p className={`text-xs mt-1 ${exportMode === 'master' ? 'text-purple-200' : 'text-purple-800/70'}`}>
                    มีสถิติภาพรวมทุกกลุ่ม, รายชื่อนักศึกษาทุกคน (40 กลุ่ม), สถิติ มา-ขาด-ลา, อัตราการเข้าร่วม %, และสรุปผล <strong>ผ่าน/ไม่ผ่านเกณฑ์</strong> ครบถ้วน
                  </p>
                </div>
              </button>

              {/* Option 2: By Group / Teacher */}
              <button
                type="button"
                onClick={() => {
                  setExportMode('group');
                  if (!exportSelectedTeacher && teachers.length > 0) {
                    setExportSelectedTeacher(teachers[0].name);
                  }
                }}
                className={`p-4 rounded-2xl text-left border transition-all flex items-start gap-3 ${
                  exportMode === 'group'
                    ? 'bg-purple-900 text-white border-purple-950 shadow-md ring-2 ring-purple-600'
                    : 'bg-white hover:bg-purple-100/50 border-purple-200 text-purple-950'
                }`}
              >
                <div className={`p-2 rounded-xl text-lg ${exportMode === 'group' ? 'bg-purple-800 text-amber-300' : 'bg-purple-100 text-purple-800'}`}>
                  👥
                </div>
                <div>
                  <div className="font-black text-sm flex items-center gap-1.5">
                    <span>เฉพาะกลุ่มที่เลือก (Single Group)</span>
                    {exportMode === 'group' && <span className="text-[10px] bg-amber-400 text-purple-950 px-1.5 py-0.2 rounded font-black">เลือกอยู่</span>}
                  </div>
                  <p className={`text-xs mt-1 ${exportMode === 'group' ? 'text-purple-200' : 'text-purple-800/70'}`}>
                    เจาะจงเฉพาะกลุ่มของอาจารย์ท่านใดท่านหนึ่ง แสดงตาราง Matrix ตามวันที่บันทึกจริง พร้อมสรุปรายบุคคลของกลุ่มนั้น
                  </p>
                </div>
              </button>
            </div>

            {/* If Group mode selected: Show Teacher Dropdown & Quick Selector */}
            {exportMode === 'group' && (
              <div className="pt-2 border-t border-purple-200/80 animate-fadeIn space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <label className="text-xs font-bold text-purple-950">
                    เลือกอาจารย์ผู้ดูแลกลุ่ม:
                  </label>
                  <select
                    value={exportSelectedTeacher || (teachers[0]?.name ?? '')}
                    onChange={(e) => setExportSelectedTeacher(e.target.value)}
                    className="w-full sm:w-80 px-3.5 py-2 text-xs font-bold border border-purple-300 rounded-xl bg-white text-purple-950 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    {teachers.map((t) => (
                      <option key={t.groupId} value={t.name}>
                        {t.name} ({t.groupName} - {t.gender} {t.yearLevel})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected teacher mini badge info */}
                {(() => {
                  const targetTeacher = teachers.find((t) => t.name === (exportSelectedTeacher || teachers[0]?.name));
                  if (!targetTeacher) return null;
                  const tStudents = students.filter((s) => s.teacherName === targetTeacher.name);
                  const tRecords = records.filter((r) => r.teacherName === targetTeacher.name);
                  const tDates = Array.from(new Set(tRecords.map((r) => r.date))).sort();

                  return (
                    <div className="p-3 rounded-2xl bg-white border border-purple-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-purple-950">{targetTeacher.name}</span>
                        <span className="text-purple-700 font-semibold">({targetTeacher.groupName} • {targetTeacher.gender})</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-purple-800/80 font-bold">
                        <span>นักศึกษา {tStudents.length} คน</span>
                        <span>•</span>
                        <span>บันทึกแล้ว {tDates.length} ครั้ง</span>
                        <span>•</span>
                        <span>เช็คชื่อรวม {tRecords.length} รายการ</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Certificate Studio Direct Banner */}
          <div className="bg-gradient-to-r from-amber-500/15 via-purple-600/10 to-amber-500/15 p-5 sm:p-6 rounded-3xl border-2 border-amber-300/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎖️</span>
                <h3 className="font-black text-purple-950 text-base sm:text-lg">
                  สตูดิโอออกแบบ & จัดการเกียรติบัตร (Certificate Studio)
                </h3>
                <span className="text-[10px] bg-amber-400 text-purple-950 font-black px-2 py-0.5 rounded-full shadow-2xs">
                  10 เทมเพลตมาตรฐาน
                </span>
              </div>
              <p className="text-xs text-purple-800/80 max-w-2xl leading-relaxed">
                เลือกรูปแบบเกียรติบัตรทางการ อัปโหลดพื้นหลังของหน่วยงานตนเอง จัดวางเลเอาต์ (ชื่อ, รหัส, สาขา, สถิติ, ตราเกียรตินิยม A+) ปรับแต่งชื่อผู้ลงนาม และสั่งพิมพ์หรือดาวน์โหลด PDF แยกกันได้ทันที
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('certificates')}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 shrink-0 flex items-center gap-2"
            >
              <span>✨</span>
              <span>เปิดสตูดิโอเกียรติบัตร</span>
            </button>
          </div>

          {/* Export Action Cards (Excel, Word, PDF, Print) */}
          <div className="space-y-3">
            <label className="text-xs font-black text-purple-950 block">
              2. เลือกรูปแบบเอกสารที่ต้องการดาวน์โหลด (File Formats):
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Excel Action */}
              <div className="p-5 rounded-3xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70 transition-all flex flex-col justify-between space-y-3 group hover:shadow-card">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-3 shadow-sm group-hover:scale-105 transition">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h3 className="font-black text-purple-950 text-base">รายงาน Excel (.xlsx)</h3>
                  <p className="text-xs text-purple-800/80 mt-1">
                    {exportMode === 'master'
                      ? 'มี 5 แผ่นงาน (KPI สรุป, ตาราง 40 กลุ่ม, ผลประเมิน นศ. ทุกคน, นศ. ไม่ผ่านเกณฑ์, Matrix รายวัน)'
                      : 'ตาราง Matrix รายบุคคลของกลุ่มนี้ บันทึกการเข้าเรียนรายวัน พร้อมคำนวณร้อยละและผลประเมิน'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (exportMode === 'master') {
                      exportComprehensiveMasterExcel(
                        records,
                        teacherSummaries,
                        studentSummaries,
                        distinctRecordedDates,
                        'รายงานภาพรวมทั้งโครงการ'
                      );
                    } else {
                      const tName = exportSelectedTeacher || teachers[0]?.name;
                      const targetTeacher = teachers.find((t) => t.name === tName);
                      const tStudents = students.filter((s) => s.teacherName === tName);
                      const tRecords = records.filter((r) => r.teacherName === tName);
                      exportGroupDetailedExcel(
                        tName,
                        targetTeacher?.groupName || 'กลุ่ม',
                        tStudents,
                        tRecords
                      );
                    }
                  }}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลด Excel</span>
                </button>
              </div>

              {/* 2. Word Action */}
              <div className="p-5 rounded-3xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50/70 transition-all flex flex-col justify-between space-y-3 group hover:shadow-card">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-3 shadow-sm group-hover:scale-105 transition">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="font-black text-purple-950 text-base">รายงาน Word (.doc / .docx)</h3>
                  <p className="text-xs text-purple-800/80 mt-1">
                    {exportMode === 'master'
                      ? 'เอกสารรายงานทางการสรุปผลทั้งโครงการ จัดตารางสรุป 40 กลุ่ม พร้อมเสนอผู้บริหาร'
                      : 'เอกสารใบบันทึกเช็คชื่อของกลุ่มที่เลือก จัดตารางรายชื่อพร้อมช่องลายเซ็นอาจารย์ผู้ดูแล'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (exportMode === 'master') {
                      exportToWord(records, teacherSummaries, 'รายงานการเช็คชื่อหะละเกาะห์_ภาพรวม');
                    } else {
                      const tName = exportSelectedTeacher || teachers[0]?.name;
                      exportTeacherWord(tName);
                    }
                  }}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลด Word</span>
                </button>
              </div>

              {/* 3. PDF Action (เฉพาะดาวน์โหลด PDF) */}
              <div className="p-5 rounded-3xl border border-purple-200 bg-purple-50/40 hover:bg-purple-50/70 transition-all flex flex-col justify-between space-y-3 group hover:shadow-card">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-purple-700 text-white flex items-center justify-center mb-3 shadow-sm group-hover:scale-105 transition">
                    <Download className="w-5 h-5" />
                  </div>
                  <h3 className="font-black text-purple-950 text-base">เอกสาร PDF ทางการ (.pdf)</h3>
                  <p className="text-xs text-purple-800/80 mt-1">
                    {exportMode === 'master'
                      ? 'บันทึกเป็นไฟล์ PDF รายงานสรุปภาพรวมโครงการ พร้อมตราสัญลักษณ์คณะและสถิติครบถ้วน'
                      : 'บันทึกเป็นไฟล์ PDF รายงานสรุปผลรายกลุ่มพร้อมรายละเอียดนักศึกษาในกลุ่ม'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (exportMode === 'master') {
                      downloadPdfReport(records, teacherSummaries, 'รายงานภาพรวมทั้งโครงการ');
                    } else {
                      const tName = exportSelectedTeacher || teachers[0]?.name;
                      printTeacherReport(tName);
                    }
                  }}
                  className="w-full py-2.5 px-4 bg-purple-700 hover:bg-purple-800 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>บันทึกเป็น PDF</span>
                </button>
              </div>

              {/* 4. Print Action (เฉพาะสั่งพิมพ์เอกสาร) */}
              <div className="p-5 rounded-3xl border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-all flex flex-col justify-between space-y-3 group hover:shadow-card">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-gray-800 text-white flex items-center justify-center mb-3 shadow-sm group-hover:scale-105 transition">
                    <Printer className="w-5 h-5" />
                  </div>
                  <h3 className="font-black text-purple-950 text-base">สั่งพิมพ์ออกทางเครื่องพิมพ์</h3>
                  <p className="text-xs text-purple-800/80 mt-1">
                    {exportMode === 'master'
                      ? 'สั่งพิมพ์เล่มรายงานฉบับสมบูรณ์รวม 40 กลุ่ม (Booklet) ทุกอาจารย์พร้อมกันอัตโนมัติ'
                      : 'สั่งพิมพ์ใบบันทึกเช็คชื่อของกลุ่มที่เลือกโดยตรง พร้อมซ่อนเครื่องมือและเมนูต่างๆ'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (exportMode === 'master') {
                      printAllTeachersBooklet();
                    } else {
                      const tName = exportSelectedTeacher || teachers[0]?.name;
                      printTeacherReport(tName);
                    }
                  }}
                  className="w-full py-2.5 px-4 bg-gray-800 hover:bg-black active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>{exportMode === 'master' ? 'สั่งพิมพ์เล่ม 40 กลุ่ม' : 'สั่งพิมพ์กลุ่มนี้'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ประกาศถึงนักศึกษา ==================== */}
      {activeTab === 'announcements' && (
        <div className="animate-fadeIn">
          <AnnouncementsPanel
            announcements={announcementsList}
            students={students}
            authorName={adminUser?.name || 'แอดมิน'}
            onCreate={handleCreateAnnouncementData}
            onDelete={handleDeleteAnnouncement}
          />
        </div>
      )}

      {/* ==================== TAB: SYSTEM MANAGEMENT (การจัดการระบบ: รหัสผ่าน, โลโก้, แอดมิน) ==================== */}
      {activeTab === 'system_management' && (
        <div className="bg-white rounded-3xl border border-purple-100 p-5 sm:p-7 shadow-card space-y-6 animate-fadeIn">
          <div className="border-b border-purple-100 pb-3">
            <h2 className="text-base sm:text-xl font-black text-purple-950 flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-700" />
              <span>การจัดการระบบ (รหัสผ่านบุคลากร, แอดมินรอง, โลโก้ และฐานข้อมูล)</span>
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
                    รหัสผ่านเข้าใช้งานสำหรับบุคลากร
                  </h3>
                  <p className="text-[11px] text-purple-700/70">
                    รหัสที่อาจารย์ใช้กรอกเพื่อเข้าสู่หน้าเช็คชื่อ (ซิงค์อัตโนมัติไปยังทุกอุปกรณ์ & PWA)
                  </p>
                </div>
              </div>

              {facultyPassMsg && (
                <div className={`p-2.5 rounded-xl text-xs font-bold ${facultyPassMsg.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {facultyPassMsg.text}
                </div>
              )}

              <form onSubmit={handleSaveFacultyPass} className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-purple-900 bg-white/70 p-2.5 rounded-xl border border-purple-200/60">
                  <span>รหัสผ่านบุคลากรปัจจุบัน:</span>
                  <span className="font-mono font-bold bg-purple-100 text-purple-950 px-2.5 py-1 rounded-lg">
                    {facultyPass || 'edu.sdd'}
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-purple-900 block mb-1">
                    ตั้งรหัสผ่านใหม่สำหรับบุคลากร
                  </label>
                  <input
                    type="text"
                    placeholder="พิมพ์รหัสผ่านใหม่ (เช่น รหัสที่ต้องการ)"
                    value={newFacultyPass}
                    onChange={(e) => setNewFacultyPass(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-bold border border-purple-200 rounded-xl bg-white"
                  />
                  <div className="text-[10px] text-purple-700/80 mt-1">
                    * รหัสจะถูกบันทึกลง Google Sheet และอัปเดตให้อาจารย์ที่ใช้งานผ่านมือถือ/PWA ทันที
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSavingFacultyPass}
                  className="px-5 py-2.5 bg-purple-800 hover:bg-purple-900 text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-60"
                >
                  {isSavingFacultyPass ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังซิงค์ไปยัง Google Sheet & PWA...</span>
                    </>
                  ) : (
                    <span>บันทึกรหัสผ่านบุคลากรใหม่ (ซิงค์ทุกอุปกรณ์)</span>
                  )}
                </button>
              </form>
            </div>

            {/* 1B. MASTER ADMIN PASSWORD MANAGEMENT */}
            <div className="p-5 rounded-3xl border border-purple-200/80 bg-purple-50/40 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-purple-950 text-sm">
                    เปลี่ยนรหัสผ่านแอดมินหลัก (Master Passcode)
                  </h3>
                  <p className="text-[11px] text-purple-700/70">
                    สำหรับล็อกอินเข้า Dashboard แอดมินหลักจากคอมพิวเตอร์และมือถือ (PWA)
                  </p>
                </div>
              </div>

              {masterAdminPassMsg && (
                <div className={`p-2.5 rounded-xl text-xs font-bold ${masterAdminPassMsg.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {masterAdminPassMsg.text}
                </div>
              )}

              <form onSubmit={handleSaveMasterAdminPass} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-purple-900 block mb-1">
                      รหัสผ่านแอดมินใหม่
                    </label>
                    <input
                      type="password"
                      placeholder="ระบุรหัสใหม่ (อย่างน้อย 4 หลัก)"
                      value={newMasterAdminPass}
                      onChange={(e) => setNewMasterAdminPass(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs font-bold border border-purple-200 rounded-xl bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-purple-900 block mb-1">
                      ยืนยันรหัสผ่านใหม่อีกครั้ง
                    </label>
                    <input
                      type="password"
                      placeholder="ยืนยันรหัสผ่านใหม่"
                      value={confirmMasterAdminPass}
                      onChange={(e) => setConfirmMasterAdminPass(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs font-bold border border-purple-200 rounded-xl bg-white"
                      required
                    />
                  </div>
                </div>
                <div className="text-[10px] text-purple-700/80">
                  * รหัสตั้งต้นของระบบคือ <span className="font-mono font-bold text-purple-950">71300807</span> เมื่อเปลี่ยนแล้ว ระบบจะซิงค์ให้อุปกรณ์อื่น/PWA ล็อกอินด้วยรหัสใหม่ได้ทันที
                </div>

                <button
                  type="submit"
                  disabled={isSavingMasterAdminPass}
                  className="px-5 py-2.5 bg-purple-800 hover:bg-purple-900 text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-60"
                >
                  {isSavingMasterAdminPass ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังซิงค์รหัสแอดมินไปยังทุกอุปกรณ์...</span>
                    </>
                  ) : (
                    <span>เปลี่ยนรหัสผ่านแอดมินหลัก (ซิงค์ทุกอุปกรณ์)</span>
                  )}
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-200/60 pb-3">
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
                <button
                  type="button"
                  onClick={() => setIsAddSubAdminModalOpen(true)}
                  className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>เพิ่มแอดมินรอง (หน้าต่างป๊อปอัพ)</span>
                </button>
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
                        <div className="text-[11px] text-purple-700/70 font-mono">เพิ่มเมื่อ: {isNaN(Date.parse(sub.createdAt)) ? sub.createdAt : new Date(sub.createdAt).toLocaleDateString('th-TH')}</div>
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

            {/* 5. ACADEMIC YEAR ROLL-OVER */}
            <div className="p-5 rounded-3xl border border-indigo-200/80 bg-indigo-50/40 space-y-4 md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-purple-950 text-sm">
                    เลื่อนชั้นปีการศึกษา (Academic Year Rollover)
                  </h3>
                  <p className="text-[11px] text-purple-700/70">
                    ปรับชั้นปีนักศึกษาอัตโนมัติเมื่อขึ้นปีการศึกษาใหม่
                  </p>
                </div>
              </div>

              <div className="p-3 bg-white/80 rounded-2xl border border-indigo-100 text-xs text-purple-900 space-y-1.5 leading-relaxed">
                <div className="font-bold flex items-center gap-1.5 text-indigo-950">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>กฎการปรับระดับชั้นปี:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-purple-800/80 ml-1">
                  <li>ชั้นปีที่ 2 ➔ เลื่อนเป็น <b>ชั้นปีที่ 3</b></li>
                  <li>ชั้นปีที่ 3 ➔ เลื่อนเป็น <b>ชั้นปีที่ 4</b> (ปรับสาขาเป็น &quot;การสอน...&quot;)</li>
                  <li>ชั้นปีที่ 4 ➔ ปรับสถานะเป็น <b>สำเร็จการศึกษา</b></li>
                </ul>
              </div>

              {promotionResult && (
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{promotionResult}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleExecuteAcademicYearPromotion}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2"
              >
                <GraduationCap className="w-4 h-4" />
                <span>ดำเนินการเลื่อนชั้นปีการศึกษา</span>
              </button>
            </div>

            {/* 6. SEMESTER & DATE SETTINGS */}
            <div className="p-5 rounded-3xl border border-amber-200/80 bg-amber-50/40 space-y-4 md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-purple-950 text-sm">
                    ตั้งค่าภาคการศึกษา & กำหนดช่วงวันเดือนปี
                  </h3>
                  <p className="text-[11px] text-purple-700/70">
                    กำหนดภาคเรียน ปีการศึกษา วันเริ่มต้น-สิ้นสุด และวันจัดกิจกรรม
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-purple-900 mb-1">ภาคการศึกษา</label>
                    <select
                      value={semesterSettings.semesterName}
                      onChange={(e) =>
                        setSemesterSettings({ ...semesterSettings, semesterName: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold bg-white"
                    >
                      <option value="ภาคเรียนที่ 1">ภาคเรียนที่ 1</option>
                      <option value="ภาคเรียนที่ 2">ภาคเรียนที่ 2</option>
                      <option value="ภาคฤดูร้อน">ภาคฤดูร้อน</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-purple-900 mb-1">ปีการศึกษา (พ.ศ.)</label>
                    <input
                      type="text"
                      value={semesterSettings.academicYear}
                      onChange={(e) =>
                        setSemesterSettings({ ...semesterSettings, academicYear: e.target.value })
                      }
                      placeholder="2567"
                      className="w-full px-3 py-2 text-xs border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-purple-900 mb-1">
                      วันเริ่มต้นภาคเรียน
                    </label>
                    <input
                      type="date"
                      value={semesterSettings.startDate || ''}
                      onChange={(e) =>
                        setSemesterSettings({ ...semesterSettings, startDate: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 text-xs border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-purple-900 mb-1">
                      วันสิ้นสุดภาคเรียน
                    </label>
                    <input
                      type="date"
                      value={semesterSettings.endDate || ''}
                      onChange={(e) =>
                        setSemesterSettings({ ...semesterSettings, endDate: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 text-xs border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-purple-900 mb-1">
                      วันจัดกิจกรรมในสัปดาห์
                    </label>
                    <select
                      value={semesterSettings.activityDay || 'ทุกวันพุธ'}
                      onChange={(e) =>
                        setSemesterSettings({ ...semesterSettings, activityDay: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold bg-white"
                    >
                      <option value="ทุกวันพุธ">ทุกวันพุธ</option>
                      <option value="ทุกวันพฤหัสบดี">ทุกวันพฤหัสบดี</option>
                      <option value="ทุกวันศุกร์">ทุกวันศุกร์</option>
                      <option value="ทุกวันเสาร์">ทุกวันเสาร์</option>
                      <option value="ทุกวันอาทิตย์">ทุกวันอาทิตย์</option>
                      <option value="ทุกวันจันทร์">ทุกวันจันทร์</option>
                      <option value="ทุกวันอังคาร">ทุกวันอังคาร</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-purple-900 mb-1">
                      เป้าหมายจำนวนครั้ง
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={semesterSettings.targetSessions}
                      onChange={(e) =>
                        setSemesterSettings({
                          ...semesterSettings,
                          targetSessions: parseInt(e.target.value) || 12,
                        })
                      }
                      className="w-full px-3 py-2 text-xs border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono font-bold bg-white"
                    />
                  </div>
                </div>

                {semesterSavedMsg && (
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 animate-fadeIn">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{semesterSavedMsg}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSaveSemesterConfig}
                  className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกการตั้งค่าภาคการศึกษา & วันเดือนปี</span>
                </button>
              </div>
            </div>

            {/* 7. EMERGENCY JSON FULL BACKUP & RESTORE */}
            <div className="p-5 rounded-3xl border border-sky-200/80 bg-sky-50/40 space-y-4 md:col-span-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
                  <DatabaseIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-purple-950 text-sm">
                    สำรองและกู้คืนฐานข้อมูลฉุกเฉิน (JSON Snapshot 1-Click)
                  </h3>
                  <p className="text-[11px] text-purple-700/70">
                    ดาวน์โหลดหรือกู้คืนข้อมูลโครงสร้างทั้งหมด (นักศึกษา, อาจารย์, สาขา, ประวัติคาบ, ระดับกลุ่ม) ได้ทันทีโดยไม่ต้องผ่านเซิร์ฟเวอร์
                  </p>
                </div>
              </div>

              {backupRestoreMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    backupRestoreMsg.success
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{backupRestoreMsg.text}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleDownloadFullBackup}
                  className="flex-1 py-2.5 px-4 bg-sky-700 hover:bg-sky-800 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลดไฟล์ Snapshot (.json)</span>
                </button>

                <label className="flex-1 py-2.5 px-4 bg-white hover:bg-sky-100 active:scale-95 text-sky-900 border border-sky-300 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer">
                  <Upload className="w-4 h-4 text-sky-700" />
                  <span>กู้คืนข้อมูลจากไฟล์ Snapshot (.json)</span>
                  <input
                    ref={restoreFileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleRestoreFullBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 9: สตูดิโอเกียรติบัตร (CERTIFICATE STUDIO) ==================== */}
      {activeTab === 'certificates' && (
        <div className="bg-white rounded-3xl border border-purple-100 p-4 sm:p-6 shadow-card space-y-4 animate-fadeIn">
          <CertificateStudioModal
            isOpen={true}
            onClose={() => setActiveTab('overview')}
            systemLogo={customLogo}
            isEmbedded={true}
          />
        </div>
      )}

      {/* ==================== TAB: ความคิดเห็น & ข้อเสนอแนะ (FEEDBACK PANEL) ==================== */}
      {activeTab === 'feedbacks' && (
        <div className="animate-fadeIn">
          <FeedbackPanel />
        </div>
      )}
            </main>
          </div>
        </div>
      </div>

      {/* STUDENT DETAIL MODAL */}
      {selectedStudentForModal && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedStudentForModal(null);
            }}
          >
            <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-lg border border-purple-200 shadow-2xl space-y-4 my-auto relative">
              <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                <div>
                  <h3 className="font-extrabold text-base text-purple-950">{selectedStudentForModal.fullName}</h3>
                  <p className="text-xs text-purple-700 font-mono">
                    รหัส: {selectedStudentForModal.studentId} • {selectedStudentForModal.groupName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStudentForModal(null)}
                  className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 flex items-center justify-center transition-all"
                >
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
                  className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ADMIN MANUAL MODAL (คู่มือการใช้งาน UX/UI มินิมอล อ่านเข้าใจง่าย) */}
      <AdminManualModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
      />

      <TermManager
        open={isTermManagerOpen}
        onClose={() => setIsTermManagerOpen(false)}
        settings={semesterSettings}
        history={termHistory}
        students={students}
        records={records}
        onSaved={(s) => {
          setSemesterSettings(s);
          setTermHistory(getTermHistory());
          setTermFilter('current');
          pushSemester().then((r) => {
            setSyncToast(r.message);
            setTimeout(() => setSyncToast(null), 4000);
          });
        }}
        onStudentsChanged={reloadDataStore}
      />

      {/* EXCEL IMPORT MODAL */}      <ExcelImportModal
        isOpen={isExcelImportModalOpen}
        majors={majorsList}
        teachers={teachers}
        existingStudentIds={useMemo(() => new Set(students.map((s) => s.studentId)), [students])}
        onClose={() => setIsExcelImportModalOpen(false)}
        onImport={(newStudents, updates) => {
          const res = addStudentsBatch(newStudents);
          updates.forEach((u) => updateStudentInfo(u.studentId, u));
          reloadDataStore();
          const msg = `นำเข้านักศึกษาใหม่ ${res.addedCount} คน` + (updates.length ? ` • อัปเดต ${updates.length} คน` : '');
          setEditorMsg({ text: msg, success: true });
          setSyncToast(msg);
          setTimeout(() => setSyncToast(null), 4000);
        }}
      />


      {/* ADD SUB-ADMIN MODAL */}
      {isAddSubAdminModalOpen && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsAddSubAdminModalOpen(false);
            }}
          >
            <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md border border-purple-200 shadow-2xl space-y-4 my-auto relative">
              <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-purple-950">เพิ่มแอดมินรองคนใหม่</h3>
                    <p className="text-[11px] text-purple-700">กำหนดชื่อและรหัสผ่านสำหรับล็อกอิน</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddSubAdminModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 flex items-center justify-center transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {subAdminMsg && (
                <div className={`p-2.5 rounded-xl text-xs font-bold ${subAdminMsg.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {subAdminMsg.text}
                </div>
              )}

              <form onSubmit={handleAddSubAdmin} className="space-y-3.5 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-purple-900 block mb-1">ชื่อแอดมินรอง *</label>
                  <input
                    type="text"
                    placeholder="เช่น อ.ฟาฏิมะห์, ครูสุไลมาน"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-purple-200 rounded-xl bg-purple-50/30 font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-purple-900 block mb-1">รหัสผ่านสำหรับล็อกอิน (Passcode) *</label>
                  <input
                    type="password"
                    placeholder="ระบุรหัสผ่าน (อย่างน้อย 4 หลัก)"
                    value={newSubPasscode}
                    onChange={(e) => setNewSubPasscode(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-purple-200 rounded-xl bg-purple-50/30 font-mono font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    required
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-purple-100">
                  <button
                    type="button"
                    onClick={() => setIsAddSubAdminModalOpen(false)}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-all"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-purple-800 hover:bg-purple-900 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>บันทึกแอดมินรอง</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ADD MAJOR MODAL */}
      {isAddMajorModalOpen && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsAddMajorModalOpen(false);
            }}
          >
            <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md border border-purple-200 shadow-2xl space-y-4 my-auto relative">
              <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-purple-950">เพิ่มสาขาวิชาใหม่</h3>
                    <p className="text-[11px] text-purple-700">สำหรับนักศึกษาและหลักสูตรใหม่</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddMajorModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 flex items-center justify-center transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {majorMsg && (
                <div className={`p-2.5 rounded-xl text-xs font-bold ${majorMsg.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {majorMsg.text}
                </div>
              )}

              <form onSubmit={handleAddNewMajor} className="space-y-3.5 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-purple-900 block mb-1">ชื่อสาขาวิชาใหม่ *</label>
                  <input
                    type="text"
                    placeholder="เช่น นวัตกรรมดิจิทัล, วิศวกรรมปัญญาประดิษฐ์..."
                    value={newMajorInput}
                    onChange={(e) => setNewMajorInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-purple-200 rounded-xl bg-purple-50/30 font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    required
                  />
                </div>

                <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-[11px] text-purple-800 space-y-1">
                  <p className="font-bold">คำแนะนำ:</p>
                  <p>สาขาวิชาที่เพิ่มใหม่จะปรากฏในตัวเลือกของระบบทันที และสามารถจัดสรรนักศึกษาเข้ากลุ่มได้</p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-purple-100">
                  <button
                    type="button"
                    onClick={() => setIsAddMajorModalOpen(false)}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-all"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-purple-800 hover:bg-purple-900 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>เพิ่มสาขาวิชา</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ห้องเช็คชื่อ PIN / QR Code สำหรับฉายโปรเจกเตอร์หรือกิจกรรมรวม */}
      {isPinProjectorOpen && (
        <PinProjectorModal
          isOpen={isPinProjectorOpen}
          onClose={() => {
            setIsPinProjectorOpen(false);
            handleManualSync(true);
          }}
          records={records}
          todayDate={new Date().toISOString().split('T')[0]}
          defaultTopic="กิจกรรมหะละเกาะห์รวม"
        />
      )}

      {/* Floating Sync Toast Notification */}
      {syncToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce bg-purple-950 text-white px-5 py-3 rounded-2xl shadow-2xl border border-purple-400/30 flex items-center gap-2 text-xs font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span>{syncToast}</span>
        </div>
      )}
    </div>
  );
};

