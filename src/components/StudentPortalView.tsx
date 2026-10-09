'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  Check,
  Clock,
  FileText,
  GraduationCap,
  HelpCircle,
  Lock,
  LogOut,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  UserX,
  X,
  KeyRound,
  UserPlus,
  QrCode,
} from 'lucide-react';
import { AttendanceRecord, Student, Announcement, SemesterSettings } from '@/lib/types';
import {
  getAnnouncements,
  getStudentMajor,
  getStudentLevel,
  isRecordInTerm,
  getSemesterSettings,
  saveSemesterSettings,
  saveTermHistory,
  formatTermLabel,
  SEMESTER_SETTINGS_UPDATED_EVENT,
  ATTENDANCE_RECORDS_UPDATED_EVENT,
} from '@/lib/data-store';
import { getCertificateConfig, saveCertificateConfig, CERT_CONFIG_UPDATED_EVENT } from '@/lib/certificate-config';
import { CertificateModal } from './CertificateModal';
import { AnnouncementBox } from './AnnouncementBox';
import { FeedbackModal } from './FeedbackModal';
import { StudentSelfRegisterModal } from './StudentSelfRegisterModal';
import { fetchPublicData, PublicData, PublicRosterStudent, getLocalAttendanceRecords } from '@/lib/api-client';

interface Props {
  records: AttendanceRecord[];
  students: Student[];
  customLogo: string;
  resetSignal?: number;
  onBack: () => void;
  onOpenTutorial: () => void;
}

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const formatThaiDate = (s: string) => {
  const [y, m, d] = s.split('-');
  if (!y || !m || !d) return s;
  return `${parseInt(d, 10)} ${THAI_MONTHS[parseInt(m, 10) - 1]} ${parseInt(y, 10) + 543}`;
};

const initialOf = (name: string) => name.replace(/^(นางสาว|น\.ส\.|นาย|นาง|ด\.ช\.|ด\.ญ\.|Mr\.|Ms\.)\s*/i, '').trim().charAt(0) || '?';

const readKey = (sid: string) => `halaqah_ann_read_${sid}`;

const Ring: React.FC<{ value: number }> = ({ value }) => {
  const r = 38;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="9" />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="#fcd34d"
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (c * v) / 100}
        style={{ transition: 'stroke-dashoffset .8s ease' }}
      />
    </svg>
  );
};

export const StudentPortalView: React.FC<Props> = ({
  records,
  students,
  customLogo,
  resetSignal,
  onBack,
  onOpenTutorial,
}) => {
  const [input, setInput] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [certOpen, setCertOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // ระบบเช็คชื่อด้วย PIN / ลงทะเบียน นศ. ปี 1
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [prefilledPin, setPrefilledPin] = useState('');
  const [isNewOnlyMode, setIsNewOnlyMode] = useState(false);

  // อ่าน ?checkinPin= หรือ ?pin= จาก URL เมื่อเปิดจาก QR Code
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const p = params.get('checkinPin') || params.get('pin');
      if (p) {
        setPrefilledPin(p);
        setIsRegisterOpen(true);
      }
    }
  }, []);

  const handleSelfCheckInSuccess = (resStudent: Student, resRecord: AttendanceRecord) => {
    setStudent(resStudent);
    setLiveRecords((prev) => {
      const filtered = prev.filter((r) => !(r.studentId === resRecord.studentId && r.date === resRecord.date));
      return [resRecord, ...filtered];
    });
    setNotFound(false);
    setIsRegisterOpen(false);
    syncPublic();
  };

  // ข้อมูลภาคการศึกษาและเป้าหมายชั่วโมง (อัปเดตแบบเรียลไทม์)
  const [semester, setSemester] = useState<SemesterSettings>(() => getSemesterSettings());

  // ข้อมูลการเช็คชื่อ (อัปเดตแบบเรียลไทม์ทันทีที่อาจารย์หรือแอดมินบันทึก)
  const [liveRecords, setLiveRecords] = useState<AttendanceRecord[]>(() => {
    const local = getLocalAttendanceRecords();
    return local && local.length > 0 ? local : records;
  });

  // ซิงค์ liveRecords เมื่อ props records มีการเปลี่ยนแปลง
  useEffect(() => {
    if (records && records.length > 0) {
      setLiveRecords(records);
    }
  }, [records]);

  // ติดตามการเปลี่ยนแปลงของภาคการศึกษา/เป้าหมายครั้งแบบเรียลไทม์ (Custom Event, Storage Event, Polling)
  useEffect(() => {
    const syncSemester = () => {
      setSemester(getSemesterSettings());
    };
    window.addEventListener(SEMESTER_SETTINGS_UPDATED_EVENT, syncSemester);
    window.addEventListener('storage', syncSemester);
    const timer = setInterval(syncSemester, 3000);
    return () => {
      window.removeEventListener(SEMESTER_SETTINGS_UPDATED_EVENT, syncSemester);
      window.removeEventListener('storage', syncSemester);
      clearInterval(timer);
    };
  }, []);

  // ติดตามการบันทึกการเช็คชื่อแบบเรียลไทม์ (Custom Event, Storage Event, Polling)
  useEffect(() => {
    const syncAttendance = () => {
      const current = getLocalAttendanceRecords();
      if (current && current.length > 0) {
        setLiveRecords(current);
      }
    };
    window.addEventListener(ATTENDANCE_RECORDS_UPDATED_EVENT, syncAttendance);
    window.addEventListener('storage', syncAttendance);
    const timer = setInterval(syncAttendance, 3000);
    return () => {
      window.removeEventListener(ATTENDANCE_RECORDS_UPDATED_EVENT, syncAttendance);
      window.removeEventListener('storage', syncAttendance);
      clearInterval(timer);
    };
  }, []);

  // ข้อมูลกลางจาก Google Sheet (ประกาศ, รายชื่อ, ภาคเรียน, เกียรติบัตร) ทำให้นักศึกษาเห็นตรงกันทุกเครื่อง
  const [remote, setRemote] = useState<PublicData>({
    ok: false,
    announcements: [],
    roster: [],
    teachers: [],
    majors: [],
    semester: null,
  });

  const syncPublic = useCallback(async () => {
    try {
      const pub = await fetchPublicData();
      if (pub && pub.ok) {
        setRemote(pub);
        if (pub.semester) {
          saveSemesterSettings({ ...getSemesterSettings(), ...pub.semester });
          setSemester(getSemesterSettings());
        }
        if (pub.certificateConfig) {
          saveCertificateConfig({ ...getCertificateConfig(), ...pub.certificateConfig });
        }
        if (pub.terms && pub.terms.length) {
          saveTermHistory(pub.terms);
        }
      }
    } catch {
      // Background sync silently
    }
  }, []);

  useEffect(() => {
    syncPublic();
    const timer = setInterval(syncPublic, 15000);
    const onFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        syncPublic();
      }
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [syncPublic]);

  useEffect(() => {
    if (resetSignal) {
      setStudent(null);
      setInput('');
      setNotFound(false);
    }
  }, [resetSignal]);

  useEffect(() => {
    if (!student) inputRef.current?.focus();
  }, [student]);

  const search = (raw: string) => {
    const q = raw.trim().replace(/[\s-]/g, '').toLowerCase();
    if (!q) return;
    const norm = (id: string) => (id || '').replace(/[\s-]/g, '').toLowerCase();
    const local = students.find((s) => norm(s.studentId) === q);
    const fromSheet = remote.roster.find((s) => norm(s.studentId) === q);
    // ข้อมูลจาก Google Sheet ใหม่กว่าข้อมูลที่ฝังในแอป จึงใช้ทับ แต่คงสาขา/ระดับจากข้อมูลในเครื่องถ้ามี
    const found: Student | undefined = fromSheet
      ? ({ ...local, ...fromSheet, level: fromSheet.level || local?.level || '01', groupId: local?.groupId || '' } as Student)
      : local;
    if (found) {
      setStudent(found);
      setNotFound(false);
      try {
        setReadIds(JSON.parse(localStorage.getItem(readKey(found.studentId)) || '[]'));
      } catch {
        setReadIds([]);
      }
    } else {
      setStudent(null);
      setNotFound(true);
    }
  };

  const onChange = (v: string) => {
    const clean = v.replace(/[^\d\s-]/g, '');
    setInput(clean);
    setNotFound(false);
    // รหัส 9 หลักครบแล้วค้นหาให้อัตโนมัติ
    if (clean.replace(/\D/g, '').length === 9) search(clean);
  };

  const markRead = (ids: string[]) => {
    if (!student) return;
    const next = Array.from(new Set([...readIds, ...ids]));
    setReadIds(next);
    try {
      localStorage.setItem(readKey(student.studentId), JSON.stringify(next));
    } catch {}
  };

  const announcements = useMemo<Announcement[]>(() => {
    if (!student) return [];
    const sid = student.studentId.trim();
    const now = Date.now();
    const source = remote.ok ? remote.announcements : getAnnouncements();
    return source.filter(
      (a) =>
        (a.targetType === 'all' || a.targetStudentIds.includes(sid)) &&
        (!a.expiresAt || new Date(a.expiresAt).getTime() > now)
    );
  }, [student, remote]);

  const stats = useMemo(() => {
    if (!student) return null;
    const recs = liveRecords
      .filter((r) => (r.studentId || '').trim() === student.studentId.trim() && isRecordInTerm(r, semester))
      .sort((a, b) => b.date.localeCompare(a.date));
    const present = recs.filter((r) => r.status === 'มา').length;
    const absent = recs.filter((r) => r.status === 'ขาด').length;
    const leave = recs.filter((r) => r.status === 'ลา').length;
    const total = recs.length;
    // ผูก % การเข้าร่วมกับจำนวนครั้งเป้าหมายที่กำหนดโดยแอดมิน (semester.targetSessions)
    const target = semester?.targetSessions > 0 ? semester.targetSessions : (total || 12);
    const rate = target > 0 ? Math.min(100, (present / target) * 100) : 0;
    const passed = rate >= 80;
    return { recs, present, absent, leave, total, target, rate, passed };
  }, [student, liveRecords, semester]);

  // ปิดหน้าต่างเกียรติบัตรทันทีหากอัตราการเข้าร่วมตกลงต่ำกว่า 80% แบบเรียลไทม์
  useEffect(() => {
    if (stats && !stats.passed && certOpen) {
      setCertOpen(false);
    }
  }, [stats?.passed, certOpen]);

  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const isTodayChecked = useMemo(() => {
    if (!student) return false;
    return liveRecords.some(
      (r) => (r.studentId || '').trim() === student.studentId.trim() && r.date === todayStr && r.status === 'มา'
    );
  }, [student, liveRecords, todayStr]);

  const logo = customLogo || '/logo.png';

  /* ============================ หน้ากรอกรหัส ============================ */
  if (!student || !stats) {
    return (
      <div className="max-w-md mx-auto space-y-4 animate-fadeIn">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-purple-800 hover:text-purple-950 px-3 py-2 rounded-full hover:bg-purple-100 transition"
          >
            <ArrowLeft className="w-4 h-4" /> กลับ
          </button>
          <button
            type="button"
            onClick={onOpenTutorial}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-purple-700 px-3 py-2 rounded-full hover:bg-purple-100 transition"
          >
            <HelpCircle className="w-4 h-4" /> วิธีใช้
          </button>
        </div>

        <div className="relative">
          <div className="relative bg-gradient-to-br from-purple-700 via-purple-800 to-indigo-900 px-6 pt-9 pb-16 text-center text-white overflow-hidden rounded-[2rem] shadow-xl shadow-purple-900/20">
            <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-20 -left-10 w-56 h-56 rounded-full bg-fuchsia-400/20 blur-3xl" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logo}
              alt=""
              className="relative h-16 mx-auto object-contain brightness-0 invert opacity-95"
              onError={(e) => ((e.currentTarget.style.display = 'none'))}
            />
            <h1 className="relative mt-4 text-2xl font-black tracking-tight">สวัสดีนักศึกษา</h1>
            <p className="relative text-sm text-purple-200 mt-1">กรอกรหัสนักศึกษาเพื่อดูผลการเช็คชื่อของคุณ</p>
          </div>

          <div className="relative -mt-9 mx-4 rounded-3xl bg-white shadow-xl shadow-purple-900/15 border border-purple-100 p-5 space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                search(input);
              }}
              className="space-y-3"
            >
              <label htmlFor="sid" className="text-xs font-bold text-purple-700">
                รหัสนักศึกษา
              </label>
              <input
                id="sid"
                ref={inputRef}
                value={input}
                onChange={(e) => onChange(e.target.value)}
                inputMode="numeric"
                autoComplete="off"
                autoFocus
                placeholder="เช่น 681441001"
                className={`w-full text-center text-2xl sm:text-3xl font-black tracking-[0.18em] font-mono py-4 rounded-2xl bg-purple-50/80 border-2 focus:outline-none focus:ring-4 transition placeholder:text-purple-200 placeholder:tracking-normal placeholder:font-semibold placeholder:text-xl ${
                  notFound
                    ? 'border-rose-300 focus:ring-rose-100 text-rose-700'
                    : 'border-purple-100 focus:border-purple-500 focus:ring-purple-100 text-purple-950'
                }`}
              />
              {notFound && (
                <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 space-y-2.5 text-center animate-fadeIn">
                  <div className="text-sm text-amber-900 font-bold">
                    ⚠️ ไม่พบรหัสนักศึกษา <span className="font-mono text-purple-900">{input}</span> ในระบบ
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    หากคุณเป็น <strong>นักศึกษาชั้นปีที่ 1</strong> หรือยังไม่เคยมีรายชื่อในระบบ สามารถลงทะเบียนตนเองและเช็คชื่อด้วย PIN กิจกรรมวันนี้ได้ทันที
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewOnlyMode(true);
                      setIsRegisterOpen(true);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition"
                  >
                    <UserPlus className="w-4 h-4" /> ลงทะเบียน นศ. ปี 1 / เช็คชื่อด้วย PIN
                  </button>
                </div>
              )}
              <button
                type="submit"
                disabled={!input.trim()}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-800 hover:to-purple-950 disabled:opacity-40 text-white font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-purple-900/25 active:scale-[0.98] transition"
              >
                ดูข้อมูลของฉัน <ArrowRight className="w-5 h-5" />
              </button>
            </form>

            {/* ปุ่มทางลัดเช็คชื่อด้วย PIN กิจกรรมวันนี้ (สำหรับ นศ. ทุกคน / ปี 1) */}
            <div className="pt-2 border-t border-purple-50">
              <button
                type="button"
                onClick={() => {
                  setIsNewOnlyMode(false);
                  setIsRegisterOpen(true);
                }}
                className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 hover:from-purple-100 hover:to-indigo-100 text-purple-900 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98 border border-purple-100/80 shadow-2xs"
              >
                <KeyRound className="w-4 h-4 text-purple-700" />
                <span>🎯 เช็คชื่อกิจกรรมวันนี้ด้วย PIN (สำหรับ นศ. ทุกคน / ปี 1)</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-purple-600 pt-1">
              <div className="flex items-center gap-1 text-purple-500">
                <ShieldCheck className="w-3.5 h-3.5" /> แสดงเฉพาะข้อมูลตนเอง
              </div>
              <button
                type="button"
                onClick={() => setFeedbackOpen(true)}
                className="text-purple-700 hover:text-purple-950 font-bold underline flex items-center gap-1 transition"
              >
                <MessageSquare className="w-3.5 h-3.5" /> ส่งข้อเสนอแนะ
              </button>
            </div>
          </div>
        </div>

        <FeedbackModal
          isOpen={feedbackOpen}
          onClose={() => setFeedbackOpen(false)}
          presetRole="student"
        />

        <StudentSelfRegisterModal
          isOpen={isRegisterOpen}
          onClose={() => setIsRegisterOpen(false)}
          prefilledStudentId={input}
          prefilledPin={prefilledPin}
          majors={remote.majors && remote.majors.length > 0 ? remote.majors : ['อิสลามศึกษา', 'การสอนอิสลามศึกษา', 'ภาษาอาหรับ', 'การสอนภาษาอาหรับ', 'หลักสูตรและการสอน', 'นวัตกรรมดิจิทัล']}
          isNewStudentOnly={isNewOnlyMode}
          student={null}
          onSuccess={handleSelfCheckInSuccess}
        />
      </div>
    );
  }

  /* ============================ หน้าข้อมูลนักศึกษา ============================ */
  const level = getStudentLevel(student);
  const passRequirement = Math.ceil(stats.target * 0.8);
  const remainingToPass = Math.max(0, passRequirement - stats.present);
  const badge =
    stats.rate >= 100
      ? 'เข้าครบ 100%'
      : stats.rate >= 90
      ? 'ดีเยี่ยม 90%+'
      : stats.rate >= 80
      ? 'ผ่านเกณฑ์ (80%+)'
      : `ขาดอีก ${remainingToPass} ครั้ง เพื่อผ่าน`;

  const tiles = [
    { label: 'มา', value: stats.present, icon: <Check className="w-4 h-4" />, grad: 'from-violet-500 to-purple-700' },
    { label: 'ขาด', value: stats.absent, icon: <UserX className="w-4 h-4" />, grad: 'from-fuchsia-600 to-purple-800' },
    { label: 'ลา', value: stats.leave, icon: <FileText className="w-4 h-4" />, grad: 'from-indigo-500 to-violet-700' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            setStudent(null);
            setInput('');
          }}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-purple-800 px-3.5 py-2 rounded-full bg-white border border-purple-100 shadow-sm hover:bg-purple-50 transition"
        >
          <LogOut className="w-4 h-4" /> ใช้รหัสอื่น
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFeedbackOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-purple-800 px-3.5 py-2 rounded-full bg-white border border-purple-100 shadow-sm hover:bg-purple-50 transition active:scale-95"
            title="ส่งข้อเสนอแนะถึงผู้ดูแลระบบ (ไม่ระบุตัวตน)"
          >
            <MessageSquare className="w-3.5 h-3.5 text-purple-700" />
            <span>ข้อเสนอแนะ</span>
          </button>
          <button
            type="button"
            onClick={onOpenTutorial}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-purple-700 px-3 py-2 rounded-full hover:bg-purple-100 transition"
          >
            <HelpCircle className="w-4 h-4" /> วิธีใช้
          </button>
        </div>
      </div>

      {/* ===== การ์ดโปรไฟล์ ===== */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-purple-700 via-purple-800 to-indigo-900 text-white shadow-2xl shadow-purple-900/25">
        <div className="absolute -top-20 -right-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-24 -left-12 w-64 h-64 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="relative p-6 sm:p-7 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white/15 backdrop-blur ring-2 ring-white/30 flex items-center justify-center text-3xl sm:text-4xl font-black shrink-0">
              {initialOf(student.fullName)}
            </div>
            <div className="min-w-0">
              <div className="inline-block px-3 py-0.5 rounded-full bg-white/15 text-xs font-mono font-bold tracking-wider">
                {student.studentId}
              </div>
              <h2 className="text-xl sm:text-2xl font-black leading-snug mt-1 break-words">{student.fullName}</h2>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <span className="px-3 py-1.5 rounded-full bg-white/15">{student.gender === 'ชาย' ? 'นักศึกษาชาย' : 'นักศึกษาหญิง'}</span>
            <span className="px-3 py-1.5 rounded-full bg-white/15">{student.yearLevel}</span>
            <span className="px-3 py-1.5 rounded-full bg-white/15 inline-flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" />
              {getStudentMajor(student)}
            </span>
            <span className="px-3 py-1.5 rounded-full bg-amber-300 text-purple-950">ระดับ {level}</span>
          </div>

          <div className="rounded-2xl bg-white/10 backdrop-blur px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] text-purple-200 font-semibold">อาจารย์ผู้ดูแลกลุ่ม</div>
              <div className="font-bold text-sm sm:text-base truncate">{student.teacherName}</div>
            </div>
            <div className="text-xs font-bold px-3 py-1.5 rounded-full bg-white text-purple-900 shrink-0">{student.groupName}</div>
          </div>
        </div>
      </div>

      {/* ===== แจ้งเตือนเช็คชื่อวันนี้ด้วย PIN (หากยังไม่ได้เช็ค) ===== */}
      {!isTodayChecked && (
        <div className="rounded-3xl bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-purple-900/15 animate-fadeIn">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0 text-amber-300">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <div className="font-black text-sm sm:text-base">ยังไม่ได้เช็คชื่อกิจกรรมวันนี้ ({formatThaiDate(todayStr)})</div>
              <div className="text-xs text-purple-200 mt-0.5">มีรหัส PIN 4 หลัก จากอาจารย์หรือจอโปรเจกเตอร์ใช่ไหม? กดเช็คชื่อได้เลย</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsNewOnlyMode(false);
              setIsRegisterOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-purple-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition shrink-0"
          >
            <KeyRound className="w-4 h-4" /> กรอก PIN เช็คชื่อวันนี้
          </button>
        </div>
      )}

      {/* ===== การแจ้งเตือน (กล่องเดียว) ===== */}
      <AnnouncementBox items={announcements} readIds={readIds} onMarkRead={markRead} />

      {/* ===== ส่วนเกียรติบัตร (อัปเดตเรียลไทม์ • เฉพาะนักศึกษาที่ผ่านเกณฑ์ 80% เท่านั้น) ===== */}
      {stats.passed ? (
        <div className="rounded-3xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 text-purple-950 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-amber-500/20 border border-amber-200 animate-fadeIn">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-white/60 backdrop-blur shadow-sm flex items-center justify-center shrink-0 text-amber-800">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-base">ยินดีด้วย! คุณผ่านเกณฑ์ ({stats.rate.toFixed(1)}%)</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-extrabold shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
                  ปลดล็อกแล้ว
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/70 text-purple-950 text-[10px] font-bold">
                  ⚡ เรียลไทม์
                </span>
              </div>
              <div className="text-xs font-semibold text-purple-900/90 mt-1">
                {stats.rate >= 90 ? 'เกียรตินิยม A+ • ' : ''}เข้าร่วมครบตามเกณฑ์ ≥80% ({passRequirement} ครั้งขึ้นไป) รับเกียรติบัตรได้เลย
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCertOpen(true)}
            className="px-5 py-3 rounded-2xl bg-purple-900 hover:bg-purple-950 text-white font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition shrink-0 shadow-md shadow-purple-950/20"
          >
            <Sparkles className="w-4 h-4 text-amber-300" /> ดูเกียรติบัตร / บันทึก PDF
          </button>
        </div>
      ) : (
        <div className="rounded-3xl bg-white border border-purple-100 p-5 shadow-card space-y-3.5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0 text-purple-500">
                <Lock className="w-6 h-6 text-purple-700" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-purple-950 text-sm sm:text-base">เกียรติบัตรถูกล็อก</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-extrabold">
                    ต้องผ่าน ≥80%
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold">
                    ⚡ อัปเดตเรียลไทม์
                  </span>
                </div>
                <div className="text-xs text-purple-700/80 mt-1">
                  ปัจจุบันเข้าร่วม {stats.present}/{stats.target} ครั้ง ({stats.rate.toFixed(1)}%) • ขาดอีก <strong className="text-purple-950">{remainingToPass} ครั้ง</strong> เพื่อปลดล็อกเกียรติบัตร
                </div>
              </div>
            </div>
            <div className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-purple-50 text-purple-400 border border-purple-100 text-xs font-bold shrink-0 cursor-not-allowed select-none">
              <Lock className="w-3.5 h-3.5" /> เกียรติบัตรยังไม่ปลดล็อก
            </div>
          </div>

          {/* แถบความคืบหน้าสู่เกณฑ์ 80% */}
          <div className="pt-0.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-purple-800/80 mb-1.5">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                อัตราการเข้าร่วมปัจจุบัน: <strong className="text-purple-950">{stats.rate.toFixed(1)}%</strong>
              </span>
              <span>
                เกณฑ์ผ่าน: <strong className="text-purple-950">80.0%</strong> ({passRequirement} ครั้ง)
              </span>
            </div>
            <div className="relative w-full h-3 rounded-full bg-purple-100/80 overflow-hidden ring-1 ring-purple-200/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-600 to-purple-700 transition-all duration-500"
                style={{ width: `${Math.min(100, stats.rate)}%` }}
              />
              {/* เส้นขีดบอกตำแหน่ง 80% */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10"
                style={{ left: '80%' }}
                title="เกณฑ์ผ่าน 80%"
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-purple-500 mt-1">
              <span>0%</span>
              <span className="font-bold text-amber-700">เกณฑ์ 80%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      )}

      {/* ===== สถิติ ===== */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-3 sm:col-span-3 rounded-3xl bg-gradient-to-br from-purple-700 to-indigo-800 text-white p-5 flex items-center gap-5 shadow-lg shadow-purple-900/15">
          <div className="relative shrink-0">
            <Ring value={stats.rate} />
            <div className="absolute inset-0 flex items-center justify-center font-black text-xl">{stats.rate.toFixed(0)}%</div>
          </div>
          <div className="min-w-0">
            <div className="text-xs text-purple-200 font-semibold">อัตราการเข้าร่วม • {formatTermLabel(semester)}</div>
            <div className="text-2xl font-black leading-tight">
              {stats.present}
              <span className="text-sm font-bold text-purple-200"> / {stats.target} ครั้ง (เป้าหมาย)</span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {badge && <span className="px-2.5 py-1 rounded-full bg-white/15 text-[11px] font-bold">{badge}</span>}
              <span className="px-2.5 py-1 rounded-full bg-white/15 text-[11px] font-bold">เกณฑ์ผ่าน 80% ({passRequirement} ครั้ง)</span>
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-[11px] text-purple-200">เช็คชื่อแล้ว {stats.total} ครั้ง</span>
            </div>
          </div>
        </div>
        {tiles.map((t) => (
          <div key={t.label} className={`rounded-3xl bg-gradient-to-br ${t.grad} text-white p-4 shadow-lg shadow-purple-900/10`}>
            <div className="flex items-center gap-1.5 text-xs font-bold text-white/85">
              {t.icon}
              {t.label}
            </div>
            <div className="text-3xl font-black mt-1 leading-none">{t.value}</div>
            <div className="text-[11px] text-white/70 mt-1">ครั้ง</div>
          </div>
        ))}
      </div>

      {/* ===== ประวัติ ===== */}
      <div className="bg-white rounded-3xl border border-purple-100 shadow-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5 text-purple-600" />
          <h3 className="font-black text-purple-950">ประวัติการเช็คชื่อ ({stats.recs.length})</h3>
        </div>
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {stats.recs.map((r, i) => (
            <div key={`${r.date}-${i}`} className="flex items-center gap-3 rounded-2xl bg-purple-50/50 px-4 py-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white ${
                  r.status === 'มา' ? 'bg-emerald-500' : r.status === 'ขาด' ? 'bg-rose-500' : 'bg-amber-500'
                }`}
              >
                {r.status === 'มา' ? <Check className="w-5 h-5" /> : r.status === 'ขาด' ? <X className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-purple-950 text-sm">{formatThaiDate(r.date)}</div>
                <div className="text-[11px] text-purple-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {r.recordedTime || '-'} น. • {r.teacherName}
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black ${
                  r.status === 'มา' ? 'bg-emerald-100 text-emerald-800' : r.status === 'ขาด' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {r.status}
              </span>
            </div>
          ))}
          {stats.recs.length === 0 && (
            <div className="py-10 text-center text-sm text-purple-300 flex flex-col items-center gap-2">
              <BookOpen className="w-8 h-8" />
              ยังไม่มีบันทึกการเช็คชื่อ
            </div>
          )}
        </div>
      </div>

      {certOpen && (
        <CertificateModal
          student={student}
          attendanceRate={stats.rate}
          totalPresent={stats.present}
          totalSessions={stats.target}
          customLogo={customLogo}
          onClose={() => setCertOpen(false)}
        />
      )}

      <FeedbackModal
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        presetRole="student"
      />

      {student && (
        <StudentSelfRegisterModal
          isOpen={isRegisterOpen}
          onClose={() => setIsRegisterOpen(false)}
          prefilledStudentId={student.studentId}
          prefilledPin={prefilledPin}
          majors={remote.majors && remote.majors.length > 0 ? remote.majors : ['อิสลามศึกษา', 'การสอนอิสลามศึกษา', 'ภาษาอาหรับ', 'การสอนภาษาอาหรับ', 'หลักสูตรและการสอน', 'นวัตกรรมดิจิทัล']}
          isNewStudentOnly={false}
          student={student}
          onSuccess={handleSelfCheckInSuccess}
        />
      )}
    </div>
  );
};
