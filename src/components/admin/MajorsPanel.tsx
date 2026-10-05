'use client';

import React, { useState } from 'react';
import { Check, GraduationCap, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Student } from '@/lib/types';
import { getStudentMajor } from '@/lib/data-store';

interface Props {
  majors: string[];
  students: Student[];
  onAdd: (name: string) => void;
  onRename: (from: string, to: string) => void;
  onDelete: (name: string) => void;
}

export const MajorsPanel: React.FC<Props> = ({ majors, students, onAdd, onRename, onDelete }) => {
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const counts = new Map<string, number>();
  students.forEach((s) => {
    const m = getStudentMajor(s);
    counts.set(m, (counts.get(m) || 0) + 1);
  });

  const startEdit = (m: string) => {
    setEditing(m);
    setDraft(m);
  };
  const commit = () => {
    if (editing && draft.trim() && draft.trim() !== editing) onRename(editing, draft.trim());
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!newName.trim()) return;
          onAdd(newName.trim());
          setNewName('');
        }}
        className="flex flex-col sm:flex-row gap-2"
      >
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="ชื่อสาขาวิชาใหม่"
          className="flex-1 px-4 py-2.5 rounded-xl border border-purple-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-purple-800 hover:bg-purple-900 text-white text-sm font-bold flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> เพิ่มสาขา
        </button>
      </form>

      <div className="rounded-2xl border border-purple-100 divide-y divide-purple-50 overflow-hidden">
        {majors.map((m) => {
          const count = counts.get(m) || 0;
          const isEditing = editing === m;
          return (
            <div key={m} className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-purple-50/40">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                {isEditing ? (
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commit();
                      if (e.key === 'Escape') setEditing(null);
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-purple-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                ) : (
                  <div className="text-sm font-bold text-purple-950 truncate">{m}</div>
                )}
                <div className="text-[11px] text-purple-500">{count} คน</div>
              </div>
              {isEditing ? (
                <div className="flex gap-1">
                  <button onClick={commit} className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100" title="บันทึก">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditing(null)} className="p-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100" title="ยกเลิก">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(m)}
                    className="px-3 py-1.5 rounded-lg text-purple-700 hover:bg-purple-100 text-xs font-bold flex items-center gap-1"
                  >
                    <Pencil className="w-3.5 h-3.5" /> แก้ไขชื่อ
                  </button>
                  <button
                    onClick={() => onDelete(m)}
                    disabled={count > 0}
                    title={count > 0 ? 'ยังมีนักศึกษาในสาขานี้' : 'ลบสาขา'}
                    className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-25 disabled:hover:bg-transparent"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-purple-600/80">
        เปลี่ยนชื่อสาขาแล้ว นักศึกษาทุกคนในสาขานั้น (รวมที่ระบบเดาจากรหัสนักศึกษา) จะเปลี่ยนตามทันที
      </p>
    </div>
  );
};
