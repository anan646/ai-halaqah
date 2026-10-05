'use client';

import React, { useMemo, useState } from 'react';
import { AlertTriangle, Bell, Megaphone, Send, Trash2, Users, X, Zap } from 'lucide-react';
import { Announcement, Student } from '@/lib/types';
import { AnnouncementBox } from '../AnnouncementBox';

interface Props {
  announcements: Announcement[];
  students: Student[];
  authorName: string;
  onCreate: (data: Omit<Announcement, 'id' | 'createdAt'>) => void;
  onDelete: (id: string) => void;
}

type Priority = Announcement['priority'];

const LEVELS: { id: Priority; label: string; hint: string; icon: React.ReactNode; cls: string; on: string }[] = [
  { id: 'normal', label: 'ทั่วไป', hint: 'ข่าวสารปกติ', icon: <Bell className="w-5 h-5" />, cls: 'text-purple-700', on: 'border-purple-600 bg-purple-50 ring-2 ring-purple-200' },
  { id: 'warning', label: 'สำคัญ', hint: 'ควรอ่านเร็ว ๆ นี้', icon: <AlertTriangle className="w-5 h-5" />, cls: 'text-amber-600', on: 'border-amber-500 bg-amber-50 ring-2 ring-amber-200' },
  { id: 'urgent', label: 'ด่วน', hint: 'เด่นสุด ขึ้นบนสุด', icon: <Zap className="w-5 h-5" />, cls: 'text-rose-600', on: 'border-rose-500 bg-rose-50 ring-2 ring-rose-200' },
];

const EXPIRY = [
  { id: '7', label: '7 วัน' },
  { id: '30', label: '30 วัน' },
  { id: '0', label: 'จนกว่าจะลบ' },
];

export const AnnouncementsPanel: React.FC<Props> = ({ announcements, students, authorName, onCreate, onDelete }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [audience, setAudience] = useState<'all' | 'specific'>('all');
  const [idsText, setIdsText] = useState('');
  const [expiry, setExpiry] = useState('30');
  const [error, setError] = useState('');

  const ids = useMemo(
    () => Array.from(new Set(idsText.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean))),
    [idsText]
  );
  const matched = ids.map((id) => ({ id, student: students.find((s) => s.studentId === id) }));
  const unknown = matched.filter((m) => !m.student);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('กรุณากรอกหัวข้อและข้อความ');
      return;
    }
    if (audience === 'specific' && ids.length === 0) {
      setError('กรุณาระบุรหัสนักศึกษาอย่างน้อย 1 รหัส');
      return;
    }
    setError('');
    const days = Number(expiry);
    onCreate({
      title: title.trim(),
      content: content.trim(),
      priority,
      targetType: audience,
      targetStudentIds: audience === 'specific' ? ids : [],
      authorName,
      expiresAt: days > 0 ? new Date(Date.now() + days * 86400000).toISOString() : undefined,
    });
    setTitle('');
    setContent('');
    setIdsText('');
    setPriority('normal');
  };

  const previewItem: Announcement[] =
    title.trim() || content.trim()
      ? [
          {
            id: 'preview',
            title: title.trim() || 'หัวข้อประกาศ',
            content: content.trim() || 'ข้อความประกาศจะแสดงที่นี่',
            priority,
            targetType: audience,
            targetStudentIds: [],
            createdAt: new Date().toISOString(),
            authorName,
          },
        ]
      : [];

  const isExpired = (a: Announcement) => !!a.expiresAt && new Date(a.expiresAt).getTime() < Date.now();

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-5 items-start">
      <form onSubmit={submit} className="bg-white rounded-3xl border border-purple-100 shadow-card p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-purple-950">เขียนประกาศใหม่</h2>
            <p className="text-xs text-purple-600">นักศึกษาจะเห็นในกล่องแจ้งเตือนเดียวหลังกรอกรหัส</p>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-purple-900 block mb-1.5">ความเร่งด่วน</label>
          <div className="grid grid-cols-3 gap-2">
            {LEVELS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setPriority(l.id)}
                className={`p-3 rounded-2xl border-2 text-left transition ${
                  priority === l.id ? l.on : 'border-purple-100 hover:border-purple-300 bg-white'
                }`}
              >
                <span className={l.cls}>{l.icon}</span>
                <div className="text-sm font-black text-purple-950 mt-1">{l.label}</div>
                <div className="text-[10px] text-purple-600/80 leading-tight">{l.hint}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="หัวข้อประกาศ"
            maxLength={120}
            className="w-full px-4 py-3 rounded-xl border border-purple-200 font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder="รายละเอียด..."
            className="w-full px-4 py-3 rounded-xl border border-purple-200 text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-purple-900 block mb-1.5">ส่งถึง</label>
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-purple-100/70">
              {(
                [
                  ['all', 'ทุกคน'],
                  ['specific', 'เฉพาะบางคน'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAudience(id)}
                  className={`py-2 rounded-lg text-sm font-bold transition ${
                    audience === id ? 'bg-white text-purple-900 shadow-sm' : 'text-purple-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-purple-900 block mb-1.5">แสดงนาน</label>
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-purple-100/70">
              {EXPIRY.map((x) => (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => setExpiry(x.id)}
                  className={`py-2 rounded-lg text-xs font-bold transition ${
                    expiry === x.id ? 'bg-white text-purple-900 shadow-sm' : 'text-purple-600'
                  }`}
                >
                  {x.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {audience === 'specific' && (
          <div className="space-y-2">
            <textarea
              value={idsText}
              onChange={(e) => setIdsText(e.target.value)}
              rows={2}
              placeholder="วางรหัสนักศึกษา คั่นด้วยเว้นวรรค จุลภาค หรือขึ้นบรรทัดใหม่"
              className="w-full px-4 py-3 rounded-xl border border-purple-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {matched.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {matched.map((m) => (
                  <span
                    key={m.id}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      m.student ? 'bg-purple-100 text-purple-900' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {m.student ? `${m.student.fullName}` : `${m.id} (ไม่พบในระบบ)`}
                  </span>
                ))}
              </div>
            )}
            {unknown.length > 0 && (
              <p className="text-xs text-rose-600 font-semibold">มี {unknown.length} รหัสที่ไม่พบในระบบ ตรวจสอบก่อนส่ง</p>
            )}
          </div>
        )}

        {error && <div className="text-sm font-semibold text-rose-600">{error}</div>}

        <button
          type="submit"
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-800 hover:to-purple-950 text-white font-black flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 active:scale-[0.99] transition"
        >
          <Send className="w-4 h-4" /> ส่งประกาศ
        </button>
      </form>

      <div className="space-y-5 min-w-0">
        {previewItem.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-purple-600 px-1">ตัวอย่างที่นักศึกษาจะเห็น</div>
            <AnnouncementBox items={previewItem} readIds={[]} onMarkRead={() => {}} preview />
          </div>
        )}

        <div className="bg-white rounded-3xl border border-purple-100 shadow-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-purple-950">ประกาศที่ส่งแล้ว ({announcements.length})</h3>
          </div>
          {announcements.length === 0 && (
            <div className="py-8 text-center text-sm text-purple-300">ยังไม่มีประกาศ</div>
          )}
          {announcements.map((a) => (
            <div
              key={a.id}
              className={`rounded-2xl border p-3.5 flex items-start gap-3 ${
                isExpired(a) ? 'opacity-50 border-slate-200 bg-slate-50' : 'border-purple-100 bg-purple-50/40'
              }`}
            >
              <span
                className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${
                  a.priority === 'urgent' ? 'bg-rose-500' : a.priority === 'warning' ? 'bg-amber-500' : 'bg-purple-500'
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-purple-950 text-sm">{a.title}</div>
                <div className="text-xs text-purple-700/80 line-clamp-2 whitespace-pre-wrap">{a.content}</div>
                <div className="text-[11px] text-purple-500 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {a.targetType === 'all' ? 'ทุกคน' : `${a.targetStudentIds.length} คน`}
                  </span>
                  <span>{new Date(a.createdAt).toLocaleDateString('th-TH')}</span>
                  {a.expiresAt && (
                    <span>{isExpired(a) ? 'หมดอายุแล้ว' : `หมดอายุ ${new Date(a.expiresAt).toLocaleDateString('th-TH')}`}</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onDelete(a.id)}
                className="p-2 rounded-lg text-rose-500 hover:bg-rose-50"
                title="ลบประกาศ"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
