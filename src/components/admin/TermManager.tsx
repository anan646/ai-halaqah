'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpCircle, CalendarRange, Check, GraduationCap, History, Search, X } from 'lucide-react';
import { ModalPortal } from '../ModalPortal';
import { AttendanceRecord, SemesterSettings, Student, TermInfo } from '@/lib/types';
import {
  YEAR_LEVELS,
  getTermKey,
  isRecordInTerm,
  nextYearLevel,
  promoteSelectedStudents,
  setCurrentTerm,
  setStudentYearLevel,
} from '@/lib/data-store';

interface Props {
  open: boolean;
  onClose: () => void;
  settings: SemesterSettings;
  history: TermInfo[];
  students: Student[];
  records: AttendanceRecord[];
  onSaved: (s: SemesterSettings) => void;
  onStudentsChanged: () => void;
}

const SEMESTERS = ['ภาคเรียนที่ 1', 'ภาคเรียนที่ 2', 'ภาคฤดูร้อน'];

export const TermManager: React.FC<Props> = ({
  open,
  onClose,
  settings,
  history,
  students,
  records,
  onSaved,
  onStudentsChanged,
}) => {
  const [tab, setTab] = useState<'term' | 'promote'>('term');
  const [draft, setDraft] = useState<SemesterSettings>(settings);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (open) {
      setDraft(settings);
    }
  }, [open, settings]);
  // นักศึกษาที่ "ไม่เลื่อนชั้น" (ซ้ำชั้น)
  const [holdBack, setHoldBack] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const [yearView, setYearView] = useState('all');

  const thisYear = new Date().getFullYear() + 543;
  const yearChoices = Array.from(new Set([settings.academicYear, ...Array.from({ length: 6 }, (_, i) => String(thisYear - 3 + i))])).sort();

  const rateOf = useMemo(() => {
    const map = new Map<string, { p: number; t: number }>();
    records
      .filter((r) => isRecordInTerm(r, settings))
      .forEach((r) => {
        const cur = map.get(r.studentId) || { p: 0, t: 0 };
        cur.t++;
        if (r.status === 'มา') cur.p++;
        map.set(r.studentId, cur);
      });
    return (id: string) => {
      const v = map.get(id);
      return v && v.t > 0 ? (v.p / v.t) * 100 : null;
    };
  }, [records, settings]);

  const active = students.filter((s) => s.yearLevel !== 'สำเร็จการศึกษา');
  const shown = active.filter((s) => {
    if (yearView !== 'all' && s.yearLevel !== yearView) return false;
    const k = q.trim().toLowerCase();
    return !k || s.fullName.toLowerCase().includes(k) || s.studentId.includes(k);
  });

  if (!open) return null;

  const saveTerm = () => {
    setCurrentTerm(draft);
    onSaved(draft);
    setMsg(`ตั้ง ${draft.semesterName} ปีการศึกษา ${draft.academicYear} เป็นภาคปัจจุบันแล้ว`);
    setTimeout(() => setMsg(''), 3500);
  };

  const switchTo = (t: TermInfo) => {
    setDraft({ ...draft, academicYear: t.academicYear, semesterName: t.semesterName, startDate: t.startDate, endDate: t.endDate });
  };

  const holdLowAttendance = () => {
    const ids = active.filter((s) => {
      const r = rateOf(s.studentId);
      return r !== null && r < 80;
    }).map((s) => s.studentId);
    setHoldBack(ids);
  };

  const doPromote = () => {
    const ids = active.map((s) => s.studentId).filter((id) => !holdBack.includes(id));
    if (!confirm(`ยืนยันเลื่อนชั้นปี ${ids.length} คน และให้ซ้ำชั้น ${holdBack.length} คน?`)) return;
    const res = promoteSelectedStudents(ids);
    onStudentsChanged();
    setHoldBack([]);
    setMsg(`เลื่อนชั้น ${res.promoted} คน • สำเร็จการศึกษา ${res.graduated} คน • ซ้ำชั้น ${res.kept} คน`);
  };

  const input = 'w-full px-3 py-2.5 rounded-xl border border-purple-200 text-sm font-semibold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500';

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="bg-white rounded-3xl w-full max-w-3xl my-auto shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
          <div className="px-5 py-4 bg-gradient-to-r from-purple-800 to-indigo-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarRange className="w-6 h-6 text-amber-300" />
              <div>
                <div className="font-black">ปีและภาคการศึกษา</div>
                <div className="text-xs text-purple-200">ปัจจุบัน: {settings.semesterName} ปีการศึกษา {settings.academicYear}</div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/15">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-5 pt-4">
            <div className="inline-flex gap-1 p-1 rounded-2xl bg-purple-100/70">
              {(
                [
                  ['term', 'ภาคการศึกษาปัจจุบัน'],
                  ['promote', 'เลื่อนชั้นปี'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold ${tab === id ? 'bg-white text-purple-900 shadow-sm' : 'text-purple-700'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {msg && <div className="mx-5 mt-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold px-4 py-2.5">{msg}</div>}

          <div className="p-5 overflow-y-auto space-y-4">
            {tab === 'term' ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-purple-800 block mb-1">ปีการศึกษา</label>
                    <select className={input} value={draft.academicYear} onChange={(e) => setDraft({ ...draft, academicYear: e.target.value })}>
                      {yearChoices.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-purple-800 block mb-1">ภาคการศึกษา</label>
                    <select className={input} value={draft.semesterName} onChange={(e) => setDraft({ ...draft, semesterName: e.target.value })}>
                      {SEMESTERS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-purple-800 block mb-1">วันเริ่มภาค</label>
                    <input type="date" className={input} value={draft.startDate || ''} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-purple-800 block mb-1">วันสิ้นสุดภาค</label>
                    <input type="date" className={input} value={draft.endDate || ''} onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-purple-800 block mb-1">จำนวนครั้งเป้าหมาย</label>
                    <input type="number" min={1} className={input} value={draft.targetSessions} onChange={(e) => setDraft({ ...draft, targetSessions: Number(e.target.value) || 1 })} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-purple-800 block mb-1">วันจัดกิจกรรม</label>
                    <input className={input} value={draft.activityDay || ''} onChange={(e) => setDraft({ ...draft, activityDay: e.target.value })} placeholder="เช่น ทุกวันพุธ" />
                  </div>
                </div>
                <p className="text-xs text-purple-600/80">
                  เมื่อบันทึก ทุกหน้า (แอดมิน อาจารย์ นักศึกษา เกียรติบัตร) จะใช้ภาคนี้ทันที การเช็คชื่อใหม่จะถูกผูกกับภาค{' '}
                  <b>{getTermKey(draft)}</b> ส่วนข้อมูลภาคเก่ายังอยู่ครบและเลือกดูย้อนหลังได้
                </p>
                <button onClick={saveTerm} className="w-full py-3 rounded-2xl bg-purple-800 hover:bg-purple-900 text-white font-black flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" /> ใช้เป็นภาคการศึกษาปัจจุบัน
                </button>

                {history.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-purple-700 flex items-center gap-1.5">
                      <History className="w-4 h-4" /> ภาคการศึกษาที่เคยใช้
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {history.map((t) => (
                        <button
                          key={t.key}
                          onClick={() => switchTo(t)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                            t.key === getTermKey(settings) ? 'bg-purple-800 text-white border-purple-800' : 'bg-white text-purple-800 border-purple-200 hover:bg-purple-50'
                          }`}
                        >
                          {t.semesterName.replace('ภาคเรียนที่', 'ภาค')} / {t.academicYear}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="rounded-2xl bg-purple-50 border border-purple-100 p-4 text-sm text-purple-900 space-y-1">
                  <div className="font-black flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" /> เลื่อนชั้นปีนักศึกษา
                  </div>
                  <div className="text-xs">
                    ติ๊กออก = ไม่เลื่อนชั้น (ซ้ำชั้น) • ปี 4 ที่เลื่อน = สำเร็จการศึกษา • แก้ชั้นปีรายคนได้จากช่องเลือกด้านขวา
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาชื่อ/รหัส" className="w-full pl-9 pr-3 py-2 rounded-xl border border-purple-200 text-sm" />
                  </div>
                  <select value={yearView} onChange={(e) => setYearView(e.target.value)} className="px-3 py-2 rounded-xl border border-purple-200 text-sm font-bold">
                    <option value="all">ทุกชั้นปี</option>
                    {YEAR_LEVELS.slice(0, 4).map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <button onClick={holdLowAttendance} className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                    ซ้ำชั้นคนที่เข้าร่วม &lt;80%
                  </button>
                </div>

                <div className="rounded-2xl border border-purple-100 divide-y divide-purple-50 max-h-[45vh] overflow-y-auto">
                  {shown.map((s) => {
                    const promote = !holdBack.includes(s.studentId);
                    const rate = rateOf(s.studentId);
                    return (
                      <div key={s.studentId} className={`flex items-center gap-3 px-4 py-2.5 ${promote ? '' : 'bg-amber-50/60'}`}>
                        <input
                          type="checkbox"
                          checked={promote}
                          onChange={() =>
                            setHoldBack((h) => (h.includes(s.studentId) ? h.filter((x) => x !== s.studentId) : [...h, s.studentId]))
                          }
                          className="rounded text-purple-700"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-purple-950 truncate">{s.fullName}</div>
                          <div className="text-[11px] text-purple-500 font-mono">
                            {s.studentId} • เข้าร่วม {rate === null ? '-' : `${rate.toFixed(0)}%`}
                          </div>
                        </div>
                        <div className="text-xs font-bold text-purple-700 whitespace-nowrap">
                          {s.yearLevel} → {promote ? nextYearLevel(s.yearLevel) : <span className="text-amber-700">ซ้ำชั้น</span>}
                        </div>
                        <select
                          value={s.yearLevel}
                          onChange={(e) => {
                            setStudentYearLevel(s.studentId, e.target.value);
                            onStudentsChanged();
                          }}
                          className="px-2 py-1 rounded-lg border border-purple-200 text-xs"
                          title="แก้ชั้นปีรายคน"
                        >
                          {YEAR_LEVELS.map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>

                <button onClick={doPromote} className="w-full py-3 rounded-2xl bg-purple-800 hover:bg-purple-900 text-white font-black flex items-center justify-center gap-2">
                  <ArrowUpCircle className="w-5 h-5" /> เลื่อนชั้น {active.length - holdBack.length} คน • ซ้ำชั้น {holdBack.length} คน
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
