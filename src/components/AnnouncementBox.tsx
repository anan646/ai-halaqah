'use client';

import React, { useState } from 'react';
import { AlertTriangle, Bell, BellRing, CheckCheck, ChevronDown, Zap } from 'lucide-react';
import { Announcement } from '@/lib/types';

interface Props {
  items: Announcement[];
  readIds: string[];
  onMarkRead: (ids: string[]) => void;
  preview?: boolean;
}

const RANK: Record<string, number> = { urgent: 3, warning: 2, normal: 1 };

const fmt = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
};

/** กล่องแจ้งเตือนกล่องเดียวสำหรับนักศึกษา — ด่วนเด่นสุดและกางอยู่เสมอ ที่เหลือพับเก็บให้อ่านง่าย */
export const AnnouncementBox: React.FC<Props> = ({ items, readIds, onMarkRead, preview }) => {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  if (items.length === 0) return null;

  const sorted = [...items].sort(
    (a, b) => RANK[b.priority] - RANK[a.priority] || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const unread = sorted.filter((a) => !readIds.includes(a.id));
  const hasUrgent = sorted.some((a) => a.priority === 'urgent');

  return (
    <div
      className={`rounded-3xl overflow-hidden shadow-card border bg-white ${
        hasUrgent ? 'border-rose-300 ring-4 ring-rose-100' : 'border-purple-200'
      }`}
    >
      <div
        className={`px-5 py-3.5 flex items-center justify-between gap-3 text-white ${
          hasUrgent
            ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-orange-500'
            : 'bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-800'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            {hasUrgent ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
            {unread.length > 0 && !preview && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-white text-[10px] font-black text-rose-600 flex items-center justify-center">
                {unread.length}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="font-black text-sm leading-tight">การแจ้งเตือน</div>
            <div className="text-[11px] text-white/80 leading-tight">
              {unread.length > 0 && !preview ? `ยังไม่ได้อ่าน ${unread.length} เรื่อง` : `ทั้งหมด ${sorted.length} เรื่อง`}
            </div>
          </div>
        </div>
        {unread.length > 0 && !preview && (
          <button
            type="button"
            onClick={() => onMarkRead(unread.map((a) => a.id))}
            className="shrink-0 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-xs font-bold flex items-center gap-1.5 transition"
          >
            <CheckCheck className="w-3.5 h-3.5" /> อ่านทั้งหมด
          </button>
        )}
      </div>

      <div className="divide-y divide-purple-100/80">
        {sorted.map((a) => {
          const isRead = readIds.includes(a.id);
          const alwaysOpen = a.priority !== 'normal';
          const expanded = alwaysOpen || open[a.id];

          const tone =
            a.priority === 'urgent'
              ? { bar: 'bg-rose-500', chip: 'bg-rose-600 text-white', bg: 'bg-rose-50/70', label: 'ด่วน', icon: <Zap className="w-3 h-3" /> }
              : a.priority === 'warning'
              ? { bar: 'bg-amber-500', chip: 'bg-amber-500 text-white', bg: 'bg-amber-50/60', label: 'สำคัญ', icon: <AlertTriangle className="w-3 h-3" /> }
              : { bar: 'bg-purple-400', chip: 'bg-purple-100 text-purple-800', bg: 'bg-white', label: 'ทั่วไป', icon: <Bell className="w-3 h-3" /> };

          return (
            <div key={a.id} className={`relative ${tone.bg}`}>
              <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${tone.bar}`} />
              <button
                type="button"
                disabled={alwaysOpen}
                onClick={() => {
                  setOpen((p) => ({ ...p, [a.id]: !p[a.id] }));
                  if (!isRead && !preview) onMarkRead([a.id]);
                }}
                className={`w-full text-left pl-6 pr-4 py-3.5 ${alwaysOpen ? 'cursor-default' : 'hover:bg-purple-50/60'}`}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${tone.chip}`}>
                    {tone.icon}
                    {tone.label}
                  </span>
                  {a.targetType === 'specific' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">เฉพาะท่าน</span>
                  )}
                  {!isRead && !preview && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
                  <span className="ml-auto text-[10px] text-purple-400 font-semibold">{fmt(a.createdAt)}</span>
                  {!alwaysOpen && (
                    <ChevronDown className={`w-4 h-4 text-purple-400 transition ${expanded ? 'rotate-180' : ''}`} />
                  )}
                </div>
                <div
                  className={`mt-1.5 font-black leading-snug ${
                    a.priority === 'urgent' ? 'text-rose-900 text-base' : 'text-purple-950 text-sm'
                  } ${!expanded ? 'truncate' : ''}`}
                >
                  {a.title}
                </div>
                {expanded && (
                  <p className="mt-1.5 text-sm text-purple-900/80 leading-relaxed whitespace-pre-wrap">{a.content}</p>
                )}
                {expanded && a.authorName && (
                  <div className="mt-2 text-[11px] text-purple-400">โดย {a.authorName}</div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
