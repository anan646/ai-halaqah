'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Printer,
  Search,
  Users,
  UserCheck,
} from 'lucide-react';
import { AttendanceRecord, Student } from '@/lib/types';
import { getStudentMajor } from '@/lib/data-store';

export interface TeacherRow {
  id: string;
  teacher: string;
  group: string;
  yearLevel: string;
  gender: string;
  cohort: 'male' | 'female2' | 'female3';
  studentsCount: number;
  isRecorded: boolean;
  datesCount: number;
}

interface Props {
  rows: TeacherRow[];
  students: Student[];
  records: AttendanceRecord[];
  selected: string | null;
  onSelect: (name: string | null) => void;
  onExportExcel: (name: string) => void;
  onExportWord: (name: string) => void;
  onPrint: (name: string) => void;
  onOpenStudent: (s: Student) => void;
}

type Filter = 'all' | 'male' | 'female2' | 'female3' | 'pending';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'male', label: 'ชาย' },
  { id: 'female2', label: 'หญิง ปี 2' },
  { id: 'female3', label: 'หญิง ปี 3+' },
  { id: 'pending', label: 'ยังไม่บันทึก' },
];

export const TeacherDetailPanel: React.FC<Props> = ({
  rows,
  students,
  records,
  selected,
  onSelect,
  onExportExcel,
  onExportWord,
  onPrint,
  onOpenStudent,
}) => {
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === 'pending' && r.isRecorded) return false;
      if (filter !== 'all' && filter !== 'pending' && r.cohort !== filter) return false;
      if (!q) return true;
      return r.teacher.toLowerCase().includes(q) || r.group.toLowerCase().includes(q);
    });
  }, [rows, filter, search]);

  const current = rows.find((r) => r.teacher === selected) || null;

  // ข้อมูลนักศึกษาในกลุ่ม: นับตามรหัสนักศึกษา เพื่อให้ประวัติติดตัวนักศึกษาแม้ถูกย้ายกลุ่มมาแล้ว
  const detail = useMemo(() => {
    if (!current) return null;
    const members = students.filter((s) => s.teacherName === current.teacher);
    const ids = new Set(members.map((m) => m.studentId));
    const groupRecords = records.filter((r) => ids.has(r.studentId) || r.teacherName === current.teacher);
    const dates = Array.from(new Set(groupRecords.map((r) => r.date))).sort();
    const summaries = members.map((st) => {
      const map: Record<string, string> = {};
      let present = 0;
      let absent = 0;
      let leave = 0;
      groupRecords
        .filter((r) => r.studentId === st.studentId)
        .forEach((r) => {
          map[r.date] = r.status;
          if (r.status === 'มา') present++;
          else if (r.status === 'ขาด') absent++;
          else if (r.status === 'ลา') leave++;
        });
      const rate = dates.length > 0 ? (present / dates.length) * 100 : 0;
      return { st, map, present, absent, leave, rate, pass: rate >= 80 };
    });
    return { members, dates, summaries, passCount: summaries.filter((s) => s.pass).length };
  }, [current, students, records]);

  const idx = current ? filtered.findIndex((r) => r.teacher === current.teacher) : -1;
  const go = (delta: number) => {
    if (filtered.length === 0) return;
    const base = idx === -1 ? 0 : idx;
    const next = filtered[(base + delta + filtered.length) % filtered.length];
    onSelect(next.teacher);
  };

  const showListOnMobile = !current;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5 items-start">
      {/* ===== รายชื่ออาจารย์ (เลือก/เปลี่ยนได้ตลอด) ===== */}
      <div className={`${showListOnMobile ? 'block' : 'hidden'} lg:block bg-white rounded-3xl border border-purple-100 shadow-card overflow-hidden lg:sticky lg:top-4`}>
        <div className="p-4 space-y-3 border-b border-purple-100">
          <div className="relative">
            <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่ออาจารย์หรือกลุ่ม..."
              className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-purple-50/70 border border-purple-100 text-sm text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                  filter === f.id ? 'bg-purple-800 text-white' : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="text-[11px] text-purple-600 font-semibold">แสดง {filtered.length} จาก {rows.length} กลุ่ม</div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-2 space-y-1">
          {filtered.map((r) => {
            const active = r.teacher === selected;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => onSelect(r.teacher)}
                className={`w-full text-left px-3.5 py-3 rounded-2xl transition flex items-center gap-3 ${
                  active
                    ? 'bg-gradient-to-r from-purple-700 to-purple-900 text-white shadow-md'
                    : 'hover:bg-purple-50 text-purple-950'
                }`}
              >
                <span
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                    active ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {r.teacher.replace(/^(อาจารย์|อ\.|ดร\.|ผศ\.|รศ\.)+\s*/g, '').charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold truncate">{r.teacher}</span>
                  <span className={`block text-[11px] truncate ${active ? 'text-purple-200' : 'text-purple-600/80'}`}>
                    {r.group} • {r.studentsCount} คน
                  </span>
                </span>
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${r.isRecorded ? 'bg-emerald-400' : 'bg-amber-400'}`}
                  title={r.isRecorded ? 'บันทึกแล้ว' : 'ยังไม่บันทึก'}
                />
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-10 text-center text-sm text-purple-400">ไม่พบอาจารย์ที่ตรงเงื่อนไข</div>
          )}
        </div>
      </div>

      {/* ===== รายละเอียดกลุ่มที่เลือก ===== */}
      <div className={`${showListOnMobile ? 'hidden' : 'block'} lg:block space-y-4 min-w-0`}>
        {!current || !detail ? (
          <div className="bg-white rounded-3xl border border-dashed border-purple-200 p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
              <UserCheck className="w-7 h-7" />
            </div>
            <div className="font-black text-purple-950">เลือกอาจารย์จากรายการด้านซ้าย</div>
            <p className="text-sm text-purple-700/70">จะแสดงรายชื่อนักศึกษาและตารางเช็คชื่อของกลุ่มนั้น เปลี่ยนอาจารย์ได้ทุกเมื่อ</p>
          </div>
        ) : (
          <>
            <div className="rounded-3xl bg-gradient-to-br from-purple-800 via-purple-900 to-indigo-950 text-white p-5 sm:p-6 shadow-lg space-y-4">
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onSelect(null)}
                  className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 text-xs font-bold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> เปลี่ยนอาจารย์
                </button>
                <div className="hidden lg:flex items-center gap-1.5 text-xs text-purple-200 font-semibold">
                  <span>{current.group}</span>
                  <span>•</span>
                  <span>{current.gender}</span>
                  <span>•</span>
                  <span>{current.yearLevel}</span>
                </div>
                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => go(-1)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center"
                    title="อาจารย์ก่อนหน้า"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => go(1)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center"
                    title="อาจารย์ถัดไป"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black leading-snug">{current.teacher}</h2>
                <p className="lg:hidden text-xs text-purple-200 mt-0.5">
                  {current.group} • {current.gender} • {current.yearLevel}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {[
                  ['นักศึกษา', `${detail.members.length}`, 'คน'],
                  ['เช็คชื่อแล้ว', `${detail.dates.length}`, 'ครั้ง'],
                  ['ผ่านเกณฑ์ ≥80%', `${detail.passCount}`, 'คน'],
                ].map(([label, v, unit]) => (
                  <div key={label} className="rounded-2xl bg-white/10 px-3.5 py-2.5">
                    <div className="text-[11px] text-purple-200 font-semibold">{label}</div>
                    <div className="text-2xl font-black leading-tight">
                      {v}
                      <span className="text-xs font-bold text-purple-300 ml-1">{unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onExportExcel(current.teacher)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-300" /> Excel
                </button>
                <button
                  onClick={() => onExportWord(current.teacher)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4 text-sky-300" /> Word
                </button>
                <button
                  onClick={() => onPrint(current.teacher)}
                  className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-purple-950 text-xs font-black flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> พิมพ์ใบบันทึก
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-purple-100 shadow-card overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between border-b border-purple-100">
                <div className="flex items-center gap-2 font-black text-purple-950">
                  <Users className="w-5 h-5 text-purple-600" /> รายชื่อนักศึกษาในกลุ่ม
                </div>
                <div className="text-xs text-purple-600 font-semibold">
                  <span className="text-emerald-600 font-black">✓</span> มา • <span className="text-rose-600 font-black">✗</span> ขาด •{' '}
                  <span className="text-amber-600 font-black">△</span> ลา
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-purple-50 text-purple-900 text-xs">
                      <th className="py-3 px-3 w-10 text-center font-bold">#</th>
                      <th className="py-3 px-3 text-left font-bold min-w-[210px] sticky left-0 bg-purple-50 z-10">นักศึกษา</th>
                      {detail.dates.map((d) => (
                        <th key={d} className="py-3 px-2 text-center font-bold whitespace-nowrap">
                          {d.slice(5).split('-').reverse().join('/')}
                        </th>
                      ))}
                      <th className="py-3 px-3 text-center font-bold">มา</th>
                      <th className="py-3 px-3 text-center font-bold">ขาด</th>
                      <th className="py-3 px-3 text-center font-bold">ลา</th>
                      <th className="py-3 px-3 text-center font-bold">ร้อยละ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-50">
                    {detail.summaries.map((s, i) => (
                      <tr key={s.st.studentId} className="hover:bg-purple-50/50 group">
                        <td className="py-2.5 px-3 text-center text-purple-400 text-xs">{i + 1}</td>
                        <td className="py-2.5 px-3 sticky left-0 bg-white group-hover:bg-purple-50/50 z-10">
                          <button type="button" onClick={() => onOpenStudent(s.st)} className="text-left">
                            <span className="block font-bold text-purple-950 leading-snug">{s.st.fullName}</span>
                            <span className="block text-[11px] text-purple-500 font-mono">
                              {s.st.studentId} • {getStudentMajor(s.st)}
                            </span>
                          </button>
                        </td>
                        {detail.dates.map((d) => {
                          const v = s.map[d];
                          return (
                            <td key={d} className="py-2.5 px-2 text-center">
                              {v === 'มา' && <span className="text-emerald-600 font-black">✓</span>}
                              {v === 'ขาด' && <span className="text-rose-600 font-black">✗</span>}
                              {v === 'ลา' && <span className="text-amber-600 font-black">△</span>}
                              {!v && <span className="text-purple-200">-</span>}
                            </td>
                          );
                        })}
                        <td className="py-2.5 px-3 text-center font-bold text-emerald-700">{s.present}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-rose-700">{s.absent}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-amber-700">{s.leave}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-block min-w-[58px] px-2 py-0.5 rounded-full text-xs font-black ${
                              s.pass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {s.rate.toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                    {detail.summaries.length === 0 && (
                      <tr>
                        <td colSpan={7 + detail.dates.length} className="py-10 text-center text-purple-400">
                          ยังไม่มีนักศึกษาในกลุ่มนี้
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
