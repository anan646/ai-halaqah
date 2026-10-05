'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeftRight, ArrowRight, ArrowLeft, GripVertical, Search, Undo2, X } from 'lucide-react';
import { Student, Teacher } from '@/lib/types';
import { getStudentMajor, moveStudentToTeacher } from '@/lib/data-store';

interface Props {
  teachers: Teacher[];
  students: Student[];
  onChanged: () => void;
}

type Side = 'left' | 'right';

interface DragState {
  ids: string[];
  from: Side;
  label: string;
  x: number;
  y: number;
  over: Side | null;
}

interface Toast {
  text: string;
  undo?: { ids: string[]; back: Record<string, string> };
}

const Column: React.FC<{
  side: Side;
  teachers: Teacher[];
  teacherName: string;
  onTeacher: (n: string) => void;
  members: Student[];
  selected: string[];
  onToggle: (id: string) => void;
  onToggleAll: (all: boolean) => void;
  onRowPointerDown: (e: React.PointerEvent, st: Student) => void;
  onMoveSelected: () => void;
  moveDisabled: boolean;
  isOver: boolean;
  dragSource: boolean;
}> = ({
  side,
  teachers,
  teacherName,
  onTeacher,
  members,
  selected,
  onToggle,
  onToggleAll,
  onRowPointerDown,
  onMoveSelected,
  moveDisabled,
  isOver,
  dragSource,
}) => {
  const [q, setQ] = useState('');
  const shown = members.filter(
    (s) => !q.trim() || s.fullName.toLowerCase().includes(q.toLowerCase()) || s.studentId.includes(q.trim())
  );
  const allChecked = members.length > 0 && selected.length === members.length;

  return (
    <div
      data-drop-col={side}
      className={`rounded-3xl border bg-white flex flex-col transition-all min-h-[420px] ${
        isOver && !dragSource
          ? 'border-purple-500 ring-4 ring-purple-200 bg-purple-50/50'
          : 'border-purple-100 shadow-card'
      }`}
    >
      <div className="p-4 space-y-3 border-b border-purple-100">
        <div className="flex items-center gap-2">
          <select
            value={teacherName}
            onChange={(e) => onTeacher(e.target.value)}
            className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-purple-200 bg-purple-50/60 text-sm font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {teachers.map((t) => (
              <option key={t.groupId + t.name} value={t.name}>
                {t.name} • {t.groupName}
              </option>
            ))}
          </select>
          <span className="shrink-0 px-2.5 py-1.5 rounded-xl bg-purple-100 text-purple-800 text-xs font-black">
            {members.length} คน
          </span>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหาในกลุ่มนี้"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-purple-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-bold text-purple-800 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allChecked}
              onChange={(e) => onToggleAll(e.target.checked)}
              className="rounded text-purple-700"
            />
            เลือกทั้งหมด{selected.length > 0 && ` (${selected.length})`}
          </label>
          <button
            type="button"
            disabled={moveDisabled}
            onClick={onMoveSelected}
            className="px-3 py-1.5 rounded-lg bg-purple-800 text-white text-xs font-bold disabled:opacity-30 hover:bg-purple-900 flex items-center gap-1 transition"
          >
            {side === 'left' ? (
              <>
                ย้ายไปขวา <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <ArrowLeft className="w-3.5 h-3.5" /> ย้ายไปซ้าย
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[480px] p-2">
        {shown.map((st) => {
          const checked = selected.includes(st.studentId);
          return (
            <div
              key={st.studentId}
              onPointerDown={(e) => onRowPointerDown(e, st)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl select-none cursor-grab active:cursor-grabbing transition ${
                checked ? 'bg-purple-100' : 'hover:bg-purple-50'
              }`}
              style={{ touchAction: 'pan-y' }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(st.studentId)}
                onPointerDown={(e) => e.stopPropagation()}
                className="rounded text-purple-700 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-purple-950 truncate">{st.fullName}</div>
                <div className="text-[11px] text-purple-500 truncate font-mono">
                  {st.studentId} • {getStudentMajor(st)}
                </div>
              </div>
              <span
                data-grip
                className="p-1.5 -m-1 text-purple-300 hover:text-purple-600 shrink-0"
                style={{ touchAction: 'none' }}
              >
                <GripVertical className="w-4 h-4" />
              </span>
            </div>
          );
        })}
        {shown.length === 0 && (
          <div className="py-16 text-center text-sm text-purple-300">
            {members.length === 0 ? 'ยังไม่มีนักศึกษาในกลุ่มนี้ ลากชื่อมาวางที่นี่ได้' : 'ไม่พบรายชื่อที่ค้นหา'}
          </div>
        )}
      </div>
    </div>
  );
};

export const TransferPanel: React.FC<Props> = ({ teachers, students, onChanged }) => {
  const [leftT, setLeftT] = useState('');
  const [rightT, setRightT] = useState('');
  const [selL, setSelL] = useState<string[]>([]);
  const [selR, setSelR] = useState<string[]>([]);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const pending = useRef<{ st: Student; side: Side; x: number; y: number } | null>(null);

  useEffect(() => {
    if (teachers.length > 0 && !leftT) setLeftT(teachers[0].name);
    if (teachers.length > 1 && !rightT) setRightT(teachers[1].name);
  }, [teachers, leftT, rightT]);

  const leftMembers = useMemo(() => students.filter((s) => s.teacherName === leftT), [students, leftT]);
  const rightMembers = useMemo(() => students.filter((s) => s.teacherName === rightT), [students, rightT]);
  const same = !!leftT && leftT === rightT;

  const showToast = (t: Toast) => {
    setToast(t);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 6000);
  };

  const doMove = (ids: string[], target: string) => {
    if (!target) return;
    const back: Record<string, string> = {};
    let n = 0;
    ids.forEach((id) => {
      const prev = students.find((s) => s.studentId === id);
      // อยู่กลุ่มเดิมอยู่แล้ว = ไม่ต้องทำอะไรและไม่ต้องแจ้งเตือน
      if (!prev || prev.teacherName === target) return;
      const res = moveStudentToTeacher(id, target);
      if (res.success) {
        back[id] = prev.teacherName;
        n++;
      }
    });
    if (n === 0) return;
    setSelL([]);
    setSelR([]);
    onChanged();
    showToast({ text: `ย้าย ${n} คน ไปกลุ่ม ${target}`, undo: { ids: Object.keys(back), back } });
  };

  const undo = () => {
    if (!toast?.undo) return;
    const { ids, back } = toast.undo;
    ids.forEach((id) => moveStudentToTeacher(id, back[id]));
    onChanged();
    setToast(null);
  };

  const targetOf = (side: Side) => (side === 'left' ? leftT : rightT);

  const sideAtPoint = (x: number, y: number): Side | null => {
    const el = document.elementFromPoint(x, y)?.closest('[data-drop-col]') as HTMLElement | null;
    return (el?.dataset.dropCol as Side) || null;
  };

  const onRowPointerDown = (side: Side) => (e: React.PointerEvent, st: Student) => {
    if (e.button !== 0) return;
    // บนจอสัมผัส เริ่มลากได้เฉพาะตอนจับที่ไอคอนจับ เพื่อไม่ให้ชนกับการเลื่อนหน้า
    if (e.pointerType === 'touch' && !(e.target as HTMLElement).closest('[data-grip]')) return;
    pending.current = { st, side, x: e.clientX, y: e.clientY };
  };

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const p = pending.current;
      if (p && !dragRef.current) {
        if (Math.hypot(e.clientX - p.x, e.clientY - p.y) < 6) return;
        const sel = p.side === 'left' ? selL : selR;
        const ids = sel.includes(p.st.studentId) && sel.length > 1 ? sel : [p.st.studentId];
        dragRef.current = {
          ids,
          from: p.side,
          label: ids.length > 1 ? `${ids.length} คน` : p.st.fullName,
          x: e.clientX,
          y: e.clientY,
          over: null,
        };
      }
      if (dragRef.current) {
        e.preventDefault();
        dragRef.current = { ...dragRef.current, x: e.clientX, y: e.clientY, over: sideAtPoint(e.clientX, e.clientY) };
        setDrag(dragRef.current);
      }
    };
    const up = (e: PointerEvent) => {
      const d = dragRef.current;
      pending.current = null;
      dragRef.current = null;
      if (d) {
        setDrag(null);
        const over = sideAtPoint(e.clientX, e.clientY);
        if (over && over !== d.from) doMove(d.ids, targetOf(over));
      }
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selL, selR, leftT, rightT, students]);

  const toggle = (side: Side) => (id: string) => {
    const set = side === 'left' ? setSelL : setSelR;
    set((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <p className="text-sm text-purple-800/80">
          เลือกอาจารย์ทั้งสองฝั่ง แล้ว <b>ลากชื่อนักศึกษา</b> ไปวางอีกฝั่ง หรือติ๊กเลือกหลายคนแล้วกดปุ่มย้าย
        </p>
        <button
          type="button"
          onClick={() => {
            setLeftT(rightT);
            setRightT(leftT);
            setSelL([]);
            setSelR([]);
          }}
          className="px-3.5 py-2 rounded-xl bg-white border border-purple-200 text-purple-800 text-xs font-bold hover:bg-purple-50 flex items-center gap-1.5"
        >
          <ArrowLeftRight className="w-4 h-4" /> สลับซ้าย-ขวา
        </button>
      </div>

      {same && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm px-4 py-3 font-semibold">
          เลือกอาจารย์ทั้งสองฝั่งเป็นคนเดียวกัน กรุณาเลือกคนละท่านเพื่อย้ายนักศึกษา
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Column
          side="left"
          teachers={teachers}
          teacherName={leftT}
          onTeacher={(n) => {
            setLeftT(n);
            setSelL([]);
          }}
          members={leftMembers}
          selected={selL}
          onToggle={toggle('left')}
          onToggleAll={(all) => setSelL(all ? leftMembers.map((s) => s.studentId) : [])}
          onRowPointerDown={onRowPointerDown('left')}
          onMoveSelected={() => doMove(selL, rightT)}
          moveDisabled={same || selL.length === 0}
          isOver={drag?.over === 'left'}
          dragSource={drag?.from === 'left'}
        />
        <Column
          side="right"
          teachers={teachers}
          teacherName={rightT}
          onTeacher={(n) => {
            setRightT(n);
            setSelR([]);
          }}
          members={rightMembers}
          selected={selR}
          onToggle={toggle('right')}
          onToggleAll={(all) => setSelR(all ? rightMembers.map((s) => s.studentId) : [])}
          onRowPointerDown={onRowPointerDown('right')}
          onMoveSelected={() => doMove(selR, leftT)}
          moveDisabled={same || selR.length === 0}
          isOver={drag?.over === 'right'}
          dragSource={drag?.from === 'right'}
        />
      </div>

      {/* ชื่อที่ลอยตามเมาส์ */}
      {drag &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed z-[10000] pointer-events-none flex items-center gap-2 pl-2 pr-4 py-2 rounded-full bg-purple-900 text-white text-sm font-bold shadow-2xl shadow-purple-900/40 ring-2 ring-white/80 whitespace-nowrap"
            style={{ left: 0, top: 0, transform: `translate(${drag.x - 16}px, ${drag.y - 18}px)` }}
          >
            <GripVertical className="w-4 h-4 text-purple-300" />
            {drag.label}
          </div>,
          document.body
        )}

      {toast && typeof document !== 'undefined' && createPortal(
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] flex items-center gap-3 pl-5 pr-3 py-3 rounded-2xl bg-purple-950 text-white shadow-2xl text-sm font-semibold animate-fadeIn">
          <span>{toast.text}</span>
          {toast.undo && (
            <button
              type="button"
              onClick={undo}
              className="px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-bold flex items-center gap-1"
            >
              <Undo2 className="w-3.5 h-3.5" /> เลิกทำ
            </button>
          )}
          <button type="button" onClick={() => setToast(null)} className="p-1 text-white/60 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};
