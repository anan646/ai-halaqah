'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  LogOut,
  ShieldCheck,
  Sparkles,
  UserX,
  X,
} from 'lucide-react';
import { AttendanceRecord, Student, Announcement } from '@/lib/types';
import { getAnnouncements, getStudentMajor, getStudentLevel, isRecordInTerm, getSemesterSettings, formatTermLabel } from '@/lib/data-store';
import { CertificateModal } from './CertificateModal';
import { AnnouncementBox } from './AnnouncementBox';
import { fetchPublicData, PublicRosterStudent } from '@/lib/api-client';

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
  const [readIds, setReadIds] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const semester = useMemo(() => getSemesterSettings(), []);
  // ข้อมูลกลางจาก Google Sheet (ประกาศและรายชื่อ) ทำให้นักศึกษาเห็นตรงกันทุกเครื่อง
  const [remote, setRemote] = useState<{ ok: boolean; announcements: Announcement[]; roster: PublicRosterStudent[] }>({
    ok: false,
    announcements: [],
    roster: [],
  });

  useEffect(() => {
    fetchPublicData().then(setRemote);
  }, []);

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
  }, [student]);

  const stats = useMemo(() => {
    if (!student) return null;
    const recs = records
      .filter((r) => (r.studentId || '').trim() === student.studentId.trim() && isRecordInTerm(r, semester))
      .sort((a, b) => b.date.localeCompare(a.date));
    const present = recs.filter((r) => r.status === 'มา').length;
    const absent = recs.filter((r) => r.status === 'ขาด').length;
    const leave = recs.filter((r) => r.status === 'ลา').length;
    const total = recs.length;
    const rate = total > 0 ? (present / total) * 100 : 0;
    return { recs, present, absent, leave, total, rate, passed: rate >= 80 };
  }, [student, records, semester]);

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
                <div className="rounded-xl bg-rose-50 border border-rose-100 px-3.5 py-2.5 text-sm text-rose-700 font-semibold text-center">
                  ไม่พบรหัสนี้ในระบบ ตรวจสอบตัวเลขอีกครั้ง หรือติดต่ออาจารย์ผู้ดูแลกลุ่ม
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
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-purple-500">
              <ShieldCheck className="w-3.5 h-3.5" /> แสดงเฉพาะข้อมูลของเจ้าของรหัสเท่านั้น
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ============================ หน้าข้อมูลนักศึกษา ============================ */
  const level = getStudentLevel(student);
  const badge =
    stats.total === 0
      ? null
      : stats.rate === 100
      ? 'เข้าครบ 100%'
      : stats.rate >= 90
      ? 'ดีเยี่ยม 90%+'
      : stats.rate >= 80
      ? 'ผ่านเกณฑ์'
      : 'ต้องปรับปรุง';

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
          className="inline-flex items-center gap-1.5 text-sm font-bold text-purple-800 px-3.5 py-2 rounded-full bg-white border border-purple-100 shadow-sm hover:bg-purple-50 transition"
        >
          <LogOut className="w-4 h-4" /> ใช้รหัสอื่น
        </button>
        <button
          type="button"
          onClick={onOpenTutorial}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-purple-700 px-3 py-2 rounded-full hover:bg-purple-100 transition"
        >
          <HelpCircle className="w-4 h-4" /> วิธีใช้
        </button>
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

      {/* ===== การแจ้งเตือน (กล่องเดียว) ===== */}
      <AnnouncementBox items={announcements} readIds={readIds} onMarkRead={markRead} />

      {/* ===== เกียรติบัตร ===== */}
      {stats.passed && (
        <div className="rounded-3xl bg-gradient-to-r from-amber-400 to-yellow-300 text-purple-950 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/50 flex items-center justify-center shrink-0">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <div className="font-black">ยินดีด้วย! คุณผ่านเกณฑ์ ({stats.rate.toFixed(1)}%)</div>
              <div className="text-xs font-semibold text-purple-900/80">
                {stats.rate >= 90 ? 'เกียรตินิยม A+ ' : ''}รับเกียรติบัตรได้เลย
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCertOpen(true)}
            className="px-5 py-3 rounded-2xl bg-purple-900 hover:bg-purple-950 text-white font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition shrink-0"
          >
            <Sparkles className="w-4 h-4 text-amber-300" /> ดูเกียรติบัตร
          </button>
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
              <span className="text-sm font-bold text-purple-200"> / {stats.total} ครั้ง</span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {badge && <span className="px-2.5 py-1 rounded-full bg-white/15 text-[11px] font-bold">{badge}</span>}
              <span className="px-2.5 py-1 rounded-full bg-white/15 text-[11px] font-bold">เกณฑ์ผ่าน 80%</span>
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
          totalSessions={stats.total}
          customLogo={customLogo}
          onClose={() => setCertOpen(false)}
        />
      )}
    </div>
  );
};
