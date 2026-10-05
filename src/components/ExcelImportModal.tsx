'use client';

import React, { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Upload, Users, X } from 'lucide-react';
import { ModalPortal } from './ModalPortal';
import { Student, Teacher } from '@/lib/types';
import { downloadStudentImportTemplate } from '@/lib/export-utils';
import { inferMajorFromStudentId } from '@/lib/data-store';

interface ExcelImportModalProps {
  isOpen: boolean;
  teachers: Teacher[];
  majors: string[];
  existingStudentIds: Set<string>;
  onClose: () => void;
  /** newStudents = นักศึกษาใหม่ที่จะเพิ่ม, updates = รายที่ซ้ำและผู้ใช้เลือกให้อัปเดตข้อมูล */
  onImport: (newStudents: Student[], updates: Student[]) => void;
}

interface Row {
  student: Student;
  duplicate: boolean;
  teacherName: string; // อาจารย์ที่จะให้อยู่ภายใต้ (แก้ได้ทีละคน)
  level: '01' | '02' | '03';
}

const yearFromId = (sid: string) => {
  const p = sid.substring(0, 2);
  return p === '68' ? 'ปี 1' : p === '67' ? 'ปี 2' : p === '66' ? 'ปี 3' : p === '65' ? 'ปี 4' : 'ปี 1';
};

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  teachers,
  majors,
  existingStudentIds,
  onClose,
  onImport,
}) => {
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [bulkTeacher, setBulkTeacher] = useState('');
  const [updateDuplicates, setUpdateDuplicates] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const newRows = useMemo(() => rows.filter((r) => !r.duplicate), [rows]);
  const dupRows = useMemo(() => rows.filter((r) => r.duplicate), [rows]);

  if (!isOpen) return null;

  const reset = () => {
    setFileName('');
    setRows([]);
    setNotes([]);
    setBulkTeacher('');
    setUpdateDuplicates(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const processFile = (f: File) => {
    setFileName(f.name);
    setBusy(true);
    setNotes([]);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result as ArrayBuffer, { type: 'array' });
        const json: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        if (!json.length) {
          setNotes(['ไม่พบข้อมูลในไฟล์ (ตารางว่างเปล่า)']);
          setRows([]);
          return;
        }
        const out: Row[] = [];
        const warn: string[] = [];
        const seen = new Set<string>();

        json.forEach((row, idx) => {
          const keys = Object.keys(row);
          const val = (terms: string[]) => {
            const k = keys.find((x) => terms.some((t) => x.trim().toLowerCase().includes(t.toLowerCase())));
            return k ? String(row[k]).trim() : '';
          };
          const id = val(['รหัสนักศึกษา', 'รหัส', 'studentid', 'id']).replace(/\D/g, '');
          if (!id || id.length < 5) return;
          if (seen.has(id)) {
            warn.push(`แถว ${idx + 2}: รหัส ${id} ซ้ำกันในไฟล์ (ข้าม)`);
            return;
          }
          seen.add(id);

          const name = val(['ชื่อ-นามสกุล', 'ชื่อ - นามสกุล', 'ชื่อ', 'fullname', 'name']) || `นักศึกษา ${id}`;
          const g = val(['เพศ', 'gender']);
          const gender: 'ชาย' | 'หญิง' =
            g.includes('หญิง') || g.toLowerCase() === 'female' || name.startsWith('นางสาว') || name.startsWith('น.ส.') ? 'หญิง' : 'ชาย';
          const year = val(['ชั้นปี', 'ปี', 'yearlevel']) || yearFromId(id);
          const major = val(['สาขาวิชา', 'สาขา', 'major']) || inferMajorFromStudentId(id, year);
          const tRaw = val(['อาจารย์ผู้ดูแล', 'อาจารย์', 'teacher']);
          const lv = val(['ระดับ', 'level']);
          const level: '01' | '02' | '03' = lv.includes('3') ? '03' : lv.includes('2') ? '02' : '01';

          const matched = teachers.find((t) => t.name.toLowerCase() === tRaw.toLowerCase() || t.groupName === tRaw);
          out.push({
            duplicate: existingStudentIds.has(id),
            teacherName: matched?.name || '',
            level,
            student: {
              studentId: id,
              fullName: name,
              gender,
              yearLevel: year,
              major,
              level,
              teacherName: matched?.name || '',
              groupName: matched?.groupName || '',
              groupId: matched?.groupId || '',
            },
          });
        });

        const unmatched = out.filter((r) => !r.duplicate && !r.teacherName).length;
        if (unmatched > 0) warn.push(`นักศึกษาใหม่ ${unmatched} คนยังไม่ได้ระบุอาจารย์ที่ตรงกับระบบ กรุณาเลือกอาจารย์ในตารางด้านล่าง`);
        setRows(out);
        setNotes(warn);
      } catch (err) {
        console.error(err);
        setNotes(['อ่านไฟล์ไม่สำเร็จ กรุณาตรวจสอบว่าเป็นไฟล์ Excel (.xlsx) ที่ถูกต้อง']);
        setRows([]);
      } finally {
        setBusy(false);
      }
    };
    reader.readAsArrayBuffer(f);
  };

  const setTeacherFor = (id: string, name: string) =>
    setRows((prev) => prev.map((r) => (r.student.studentId === id ? { ...r, teacherName: name } : r)));

  const setLevelFor = (id: string, level: Row['level']) =>
    setRows((prev) => prev.map((r) => (r.student.studentId === id ? { ...r, level } : r)));

  /** กำหนดอาจารย์/ระดับ ให้นักศึกษาที่ติ๊กเลือก (ถ้าไม่ได้ติ๊กใครเลย = ทุกคนที่เป็นรายชื่อใหม่) */
  const applyToPicked = (patch: Partial<Pick<Row, 'teacherName' | 'level'>>) => {
    setRows((prev) =>
      prev.map((r) =>
        !r.duplicate && (picked.length === 0 || picked.includes(r.student.studentId)) ? { ...r, ...patch } : r
      )
    );
  };

  const applyBulk = (name: string) => {
    setBulkTeacher(name);
    if (!name) return;
    setRows((prev) => prev.map((r) => (r.duplicate ? r : { ...r, teacherName: name })));
  };

  const withTeacher = (r: Row): Student => {
    const t = teachers.find((x) => x.name === r.teacherName);
    return {
      ...r.student,
      level: r.level,
      teacherName: t?.name || r.student.teacherName,
      groupName: t?.groupName || r.student.groupName,
      groupId: t?.groupId || r.student.groupId,
      yearLevel: r.student.yearLevel || t?.yearLevel || '',
    };
  };

  const missingTeacher = newRows.filter((r) => !r.teacherName).length;
  const canImport = !busy && (newRows.length > 0 || (updateDuplicates && dupRows.length > 0)) && missingTeacher === 0;

  const confirm = () => {
    onImport(newRows.map(withTeacher), updateDuplicates ? dupRows.map(withTeacher) : []);
    close();
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl my-auto max-h-[94vh] flex flex-col overflow-hidden">
          <div className="px-5 sm:px-6 py-4 flex items-center justify-between border-b border-purple-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-purple-950">นำเข้านักศึกษาจาก Excel</h3>
                <p className="text-xs text-purple-600">โหลดเทมเพลต กรอก แล้วอัปโหลดกลับมา</p>
              </div>
            </div>
            <button onClick={close} className="p-2 rounded-xl text-purple-500 hover:bg-purple-50">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-sm">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => downloadStudentImportTemplate({ majors, teachers: teachers.map((t) => t.name) })}
                className="sm:w-60 px-4 py-3 rounded-2xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> 1. โหลดเทมเพลต
              </button>
              <div
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files[0];
                  if (f) processFile(f);
                }}
                className="flex-1 px-4 py-3 rounded-2xl border-2 border-dashed border-purple-300 hover:bg-purple-50 cursor-pointer text-center text-purple-800 font-bold flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {fileName || '2. เลือกไฟล์ที่กรอกแล้ว (หรือลากมาวาง)'}
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) processFile(f);
                    e.target.value = '';
                  }}
                />
              </div>
            </div>

            {notes.length > 0 && (
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3.5 space-y-1 text-amber-900">
                {notes.slice(0, 6).map((n, i) => (
                  <div key={i} className="flex gap-2 text-xs font-semibold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    {n}
                  </div>
                ))}
              </div>
            )}

            {rows.length > 0 && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5">
                    <div className="text-xs font-bold text-emerald-700">นักศึกษาใหม่</div>
                    <div className="text-2xl font-black text-emerald-900">{newRows.length} คน</div>
                  </div>
                  <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3.5">
                    <div className="text-xs font-bold text-amber-700">มีอยู่ในระบบแล้ว</div>
                    <div className="text-2xl font-black text-amber-900">{dupRows.length} คน</div>
                  </div>
                </div>

                {dupRows.length > 0 && (
                  <div className="rounded-2xl border border-amber-300 bg-amber-50/60 p-4 space-y-2">
                    <div className="flex items-center gap-2 font-black text-amber-900">
                      <AlertTriangle className="w-4 h-4" /> แจ้งเตือน: พบรายชื่อที่มีในระบบแล้ว {dupRows.length} คน
                    </div>
                    <div className="max-h-28 overflow-y-auto text-xs text-amber-900/90 grid sm:grid-cols-2 gap-x-4 gap-y-0.5">
                      {dupRows.map((r) => (
                        <div key={r.student.studentId} className="truncate">
                          {r.student.studentId} • {r.student.fullName}
                        </div>
                      ))}
                    </div>
                    <label className="flex items-center gap-2 text-xs font-bold text-amber-900 cursor-pointer select-none pt-1">
                      <input type="checkbox" checked={updateDuplicates} onChange={(e) => setUpdateDuplicates(e.target.checked)} className="rounded" />
                      อัปเดตข้อมูลของรายชื่อที่ซ้ำด้วยข้อมูลจากไฟล์ (ถ้าไม่ติ๊ก จะข้ามรายชื่อเหล่านี้)
                    </label>
                  </div>
                )}

                {newRows.length > 0 && (
                  <div className="space-y-2">
                    <div className="rounded-2xl bg-purple-50 border border-purple-100 p-3 flex flex-col lg:flex-row lg:items-center gap-2">
                      <div className="font-bold text-purple-950 text-xs flex items-center gap-1.5 shrink-0">
                        <Users className="w-4 h-4 text-purple-600" />
                        {picked.length > 0 ? `กำหนดให้ ${picked.length} คนที่เลือก` : 'กำหนดให้นักศึกษาใหม่ทุกคน'}
                      </div>
                      <div className="flex flex-wrap gap-2 lg:ml-auto">
                        <select
                          value={bulkTeacher}
                          onChange={(e) => {
                            setBulkTeacher(e.target.value);
                            if (e.target.value) applyToPicked({ teacherName: e.target.value });
                          }}
                          className="px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-bold text-purple-900 max-w-[260px]"
                        >
                          <option value="">อาจารย์ผู้ดูแล...</option>
                          {teachers.map((t) => (
                            <option key={t.groupId + t.name} value={t.name}>
                              {t.name} • {t.groupName}
                            </option>
                          ))}
                        </select>
                        <select
                          value=""
                          onChange={(e) => e.target.value && applyToPicked({ level: e.target.value as Row['level'] })}
                          className="px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-bold text-purple-900"
                        >
                          <option value="">ระดับ...</option>
                          <option value="01">ระดับ 01</option>
                          <option value="02">ระดับ 02</option>
                          <option value="03">ระดับ 03</option>
                        </select>
                        {picked.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setPicked([])}
                            className="px-3 py-2 rounded-xl text-xs font-bold text-purple-700 hover:bg-purple-100"
                          >
                            ล้างที่เลือก
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="border border-purple-100 rounded-2xl overflow-hidden">
                      <div className="max-h-80 overflow-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-purple-50 text-purple-900 sticky top-0 z-10">
                            <tr>
                              <th className="py-2 px-3 w-8">
                                <input
                                  type="checkbox"
                                  checked={picked.length > 0 && picked.length === newRows.length}
                                  onChange={(e) => setPicked(e.target.checked ? newRows.map((r) => r.student.studentId) : [])}
                                  className="rounded"
                                />
                              </th>
                              <th className="py-2 px-3 text-left font-bold">รหัส</th>
                              <th className="py-2 px-3 text-left font-bold">ชื่อ-นามสกุล</th>
                              <th className="py-2 px-3 text-left font-bold">ชั้นปี / สาขา</th>
                              <th className="py-2 px-3 text-left font-bold min-w-[220px]">อาจารย์ผู้ดูแล</th>
                              <th className="py-2 px-3 text-left font-bold">ระดับ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-purple-50">
                            {newRows.map((r) => {
                              const id = r.student.studentId;
                              const on = picked.includes(id);
                              return (
                                <tr key={id} className={on ? 'bg-purple-50/70' : ''}>
                                  <td className="py-1.5 px-3">
                                    <input
                                      type="checkbox"
                                      checked={on}
                                      onChange={() => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}
                                      className="rounded"
                                    />
                                  </td>
                                  <td className="py-1.5 px-3 font-mono font-bold text-purple-900">{id}</td>
                                  <td className="py-1.5 px-3 font-semibold text-purple-950">{r.student.fullName}</td>
                                  <td className="py-1.5 px-3 text-purple-700">
                                    {r.student.yearLevel} • {r.student.major}
                                  </td>
                                  <td className="py-1.5 px-3">
                                    <select
                                      value={r.teacherName}
                                      onChange={(e) => setTeacherFor(id, e.target.value)}
                                      className={`w-full px-2 py-1.5 rounded-lg border text-xs font-semibold ${
                                        r.teacherName ? 'border-purple-200 bg-white' : 'border-rose-300 bg-rose-50 text-rose-700'
                                      }`}
                                    >
                                      <option value="">— เลือกอาจารย์ —</option>
                                      {teachers.map((t) => (
                                        <option key={t.groupId + t.name} value={t.name}>
                                          {t.name} • {t.groupName}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="py-1.5 px-3">
                                    <select
                                      value={r.level}
                                      onChange={(e) => setLevelFor(id, e.target.value as Row['level'])}
                                      className="px-2 py-1.5 rounded-lg border border-purple-200 bg-white text-xs font-semibold"
                                    >
                                      <option value="01">01</option>
                                      <option value="02">02</option>
                                      <option value="03">03</option>
                                    </select>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="px-5 sm:px-6 py-4 border-t border-purple-100 flex items-center justify-between gap-3">
            <div className="text-xs font-semibold text-rose-600">
              {missingTeacher > 0 ? `ยังไม่ได้เลือกอาจารย์ ${missingTeacher} คน` : ''}
            </div>
            <div className="flex gap-2">
              <button onClick={close} className="px-4 py-2.5 rounded-xl bg-purple-50 text-purple-800 font-bold text-sm hover:bg-purple-100">
                ยกเลิก
              </button>
              <button
                disabled={!canImport}
                onClick={confirm}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-purple-900 text-white font-black text-sm disabled:opacity-40 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {busy ? 'กำลังอ่านไฟล์...' : `นำเข้า ${newRows.length} คน${updateDuplicates && dupRows.length ? ` + อัปเดต ${dupRows.length}` : ''}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
