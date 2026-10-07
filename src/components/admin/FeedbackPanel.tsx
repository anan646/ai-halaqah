'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  MessageSquare,
  Users,
  GraduationCap,
  Download,
  Trash2,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Check,
  Smartphone,
  Lightbulb,
  ShieldCheck,
  Star,
  FileSpreadsheet,
  RotateCw,
  Cloud,
} from 'lucide-react';
import { FeedbackItem, FeedbackRole, FeedbackCategory, FeedbackStatus } from '@/lib/types';
import {
  getFeedbacks,
  updateFeedbackStatus,
  deleteFeedback,
  FEEDBACKS_UPDATED_EVENT,
} from '@/lib/data-store';
import {
  fetchAllFeedbacks,
  sendFeedbackToGoogleSheet,
  deleteFeedbackFromGoogleSheet,
} from '@/lib/api-client';

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

function formatThaiDateTime(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const day = d.getDate();
    const month = THAI_MONTHS[d.getMonth()];
    const year = d.getFullYear() + 543;
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year} เวลา ${hours}:${minutes} น.`;
  } catch {
    return isoStr;
  }
}

const RATING_EMOJIS: Record<number, { emoji: string; text: string }> = {
  5: { emoji: '😍', text: 'ยอดเยี่ยม' },
  4: { emoji: '😀', text: 'ดี' },
  3: { emoji: '😐', text: 'ปานกลาง' },
  2: { emoji: '🙁', text: 'ควรปรับปรุง' },
  1: { emoji: '😡', text: 'มีปัญหา' },
};

const CATEGORY_NAMES: Record<FeedbackCategory, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  grouping: { label: 'การจัดกลุ่ม / โยกย้าย', icon: Users },
  system: { label: 'การใช้งานระบบ / เช็คชื่อ', icon: Smartphone },
  general: { label: 'ข้อเสนอแนะทั่วไป', icon: Lightbulb },
};

export const FeedbackPanel: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>(() => getFeedbacks());
  const [roleFilter, setRoleFilter] = useState<'all' | FeedbackRole>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | FeedbackCategory>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | FeedbackStatus>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Sync from Google Sheet on mount and poll every 8 seconds
  useEffect(() => {
    fetchAllFeedbacks().then((res) => {
      if (res.fromRemote) setFeedbacks(getFeedbacks());
    });
    const timer = setInterval(() => {
      fetchAllFeedbacks().then((res) => {
        if (res.fromRemote) setFeedbacks(getFeedbacks());
      });
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  // Reload feedbacks on event or storage change
  useEffect(() => {
    const reload = () => setFeedbacks(getFeedbacks());
    window.addEventListener(FEEDBACKS_UPDATED_EVENT, reload);
    window.addEventListener('storage', reload);
    return () => {
      window.removeEventListener(FEEDBACKS_UPDATED_EVENT, reload);
      window.removeEventListener('storage', reload);
    };
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetchAllFeedbacks();
      setFeedbacks(getFeedbacks());
      if (res.fromRemote) {
        // toast or notice
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // KPIs
  const stats = useMemo(() => {
    const total = feedbacks.length;
    const unread = feedbacks.filter((f) => f.status === 'unread').length;
    const studentItems = feedbacks.filter((f) => f.role === 'student');
    const teacherItems = feedbacks.filter((f) => f.role === 'teacher');

    const calcAvg = (items: FeedbackItem[]) => {
      const rated = items.filter((f) => typeof f.rating === 'number' && f.rating > 0);
      if (rated.length === 0) return 0;
      const sum = rated.reduce((acc, f) => acc + (f.rating || 0), 0);
      return sum / rated.length;
    };

    return {
      total,
      unread,
      studentCount: studentItems.length,
      studentAvgRating: calcAvg(studentItems),
      teacherCount: teacherItems.length,
      teacherAvgRating: calcAvg(teacherItems),
    };
  }, [feedbacks]);

  // Filtered List
  const filteredList = useMemo(() => {
    return feedbacks.filter((f) => {
      if (roleFilter !== 'all' && f.role !== roleFilter) return false;
      if (categoryFilter !== 'all' && f.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && (f.status || 'unread') !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const msgMatch = f.message.toLowerCase().includes(q);
        const noteMatch = (f.adminNote || '').toLowerCase().includes(q);
        if (!msgMatch && !noteMatch) return false;
      }
      return true;
    });
  }, [feedbacks, roleFilter, categoryFilter, statusFilter, searchQuery]);

  const handleUpdateStatus = (id: string, status: FeedbackStatus) => {
    updateFeedbackStatus(id, status);
    const updated = getFeedbacks();
    setFeedbacks(updated);
    const item = updated.find((f) => f.id === id);
    if (item) sendFeedbackToGoogleSheet(item).catch(() => null);
  };

  const handleSaveNote = (id: string) => {
    const target = feedbacks.find((f) => f.id === id);
    if (target) {
      updateFeedbackStatus(id, target.status || 'read', noteInput.trim());
      const updated = getFeedbacks();
      setFeedbacks(updated);
      const item = updated.find((f) => f.id === id);
      if (item) sendFeedbackToGoogleSheet(item).catch(() => null);
    }
    setEditingNoteId(null);
    setNoteInput('');
  };

  const handleDelete = (id: string) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อเสนอแนะนี้?')) {
      deleteFeedback(id);
      setFeedbacks(getFeedbacks());
      deleteFeedbackFromGoogleSheet(id).catch(() => null);
    }
  };

  // Export to CSV / Excel
  const handleExportCsv = () => {
    if (filteredList.length === 0) {
      alert('ไม่มีข้อมูลสำหรับส่งออก');
      return;
    }

    const headers = ['วันที่เวลา', 'บทบาท', 'หมวดหมู่', 'คะแนนความพึงพอใจ', 'ข้อความความคิดเห็น', 'สถานะ', 'บันทึกช่วยจำแอดมิน'];
    const rows = filteredList.map((f) => [
      formatThaiDateTime(f.createdAt),
      f.role === 'student' ? 'นักศึกษา' : 'อาจารย์',
      CATEGORY_NAMES[f.category]?.label || f.category,
      f.rating ? `${f.rating} ดาว (${RATING_EMOJIS[f.rating]?.text || ''})` : '-',
      `"${f.message.replace(/"/g, '""')}"`,
      f.status === 'resolved' ? 'ดำเนินการแล้ว' : f.status === 'read' ? 'อ่านแล้ว' : 'ยังไม่อ่าน',
      `"${(f.adminNote || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `รายงานข้อเสนอแนะ_ฮะละเกาะฮ์_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header & Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-purple-100 shadow-card">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-900 text-white flex items-center justify-center shrink-0 shadow-md">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-purple-950">ความคิดเห็น & ข้อเสนอแนะ</h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                <ShieldCheck className="w-3 h-3" /> ไม่ระบุตัวตน
              </span>
            </div>
            <p className="text-xs text-purple-700/80 mt-0.5">
              รับฟังเสียงสะท้อนจากนักศึกษาและอาจารย์ เพื่อนำมาปรับปรุงการจัดกลุ่มและระบบ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold transition active:scale-95 border border-purple-200/70 disabled:opacity-50"
            title="ดึงข้อมูลล่าสุดจาก Google Sheet"
          >
            <RotateCw className={`w-3.5 h-3.5 text-purple-700 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'กำลังดึงข้อมูล...' : 'ดึงข้อมูลล่าสุด'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-100/80 hover:bg-purple-200 text-purple-950 text-xs font-bold transition active:scale-95 shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-purple-700" />
            <span>ส่งออก (CSV)</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-purple-100 shadow-card">
          <div className="flex items-center justify-between text-xs font-bold text-purple-600 mb-1">
            <span>ความคิดเห็นทั้งหมด</span>
            <MessageSquare className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-950">{stats.total}</div>
          <div className="text-[11px] text-purple-500 mt-1">รายการจากผู้ใช้ระบบ</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-amber-200/80 shadow-card">
          <div className="flex items-center justify-between text-xs font-bold text-amber-700 mb-1">
            <span>ยังไม่อ่าน</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600">{stats.unread}</div>
          <div className="text-[11px] text-amber-700/80 mt-1">รอการตรวจสอบ</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-purple-100 shadow-card">
          <div className="flex items-center justify-between text-xs font-bold text-purple-700 mb-1">
            <span>จากนักศึกษา</span>
            <GraduationCap className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-purple-950">{stats.studentCount}</span>
            {stats.studentAvgRating > 0 && (
              <span className="text-xs font-bold text-amber-600 flex items-center gap-0.5">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {stats.studentAvgRating.toFixed(1)}
              </span>
            )}
          </div>
          <div className="text-[11px] text-purple-500 mt-1">เสียงสะท้อนนักศึกษา</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-purple-100 shadow-card">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-700 mb-1">
            <span>จากอาจารย์</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-purple-950">{stats.teacherCount}</span>
            {stats.teacherAvgRating > 0 && (
              <span className="text-xs font-bold text-amber-600 flex items-center gap-0.5">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {stats.teacherAvgRating.toFixed(1)}
              </span>
            )}
          </div>
          <div className="text-[11px] text-purple-500 mt-1">เสียงสะท้อนอาจารย์</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-purple-100 shadow-card space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาข้อความความคิดเห็น หรือบันทึกช่วยจำ..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-purple-50/40 border border-purple-200 text-purple-950 placeholder:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-purple-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 shrink-0 mr-1">
            <Filter className="w-3.5 h-3.5" /> ตัวกรอง:
          </div>

          {/* Role Filter */}
          <div className="inline-flex rounded-xl bg-purple-50 p-0.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1 rounded-lg transition ${
                roleFilter === 'all' ? 'bg-purple-900 text-white shadow-2xs' : 'text-purple-700 hover:text-purple-950'
              }`}
            >
              ทุกบทบาท
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('student')}
              className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${
                roleFilter === 'student' ? 'bg-purple-900 text-white shadow-2xs' : 'text-purple-700 hover:text-purple-950'
              }`}
            >
              <GraduationCap className="w-3 h-3" /> นักศึกษา
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('teacher')}
              className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${
                roleFilter === 'teacher' ? 'bg-purple-900 text-white shadow-2xs' : 'text-purple-700 hover:text-purple-950'
              }`}
            >
              <Users className="w-3 h-3" /> อาจารย์
            </button>
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-xs font-bold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
          >
            <option value="all">ทุกหมวดหมู่</option>
            <option value="grouping">การจัดกลุ่ม / โยกย้าย</option>
            <option value="system">การใช้งานระบบ / เช็คชื่อ</option>
            <option value="general">ข้อเสนอแนะทั่วไป</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-xs font-bold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="unread">ยังไม่อ่าน</option>
            <option value="read">อ่านแล้ว</option>
            <option value="resolved">ดำเนินการแล้ว</option>
          </select>

          {/* Clear Filters */}
          {(roleFilter !== 'all' || categoryFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setRoleFilter('all');
                setCategoryFilter('all');
                setStatusFilter('all');
                setSearchQuery('');
              }}
              className="px-2.5 py-1 text-xs text-rose-600 hover:text-rose-800 font-bold underline"
            >
              ล้างตัวกรอง
            </button>
          )}

          <div className="ml-auto text-xs text-purple-700 font-bold">
            พบ {filteredList.length} รายการ
          </div>
        </div>
      </div>

      {/* Feedbacks List */}
      <div className="space-y-3">
        {filteredList.map((item) => {
          const CategoryIcon = CATEGORY_NAMES[item.category]?.icon || MessageSquare;
          const ratingData = item.rating ? RATING_EMOJIS[item.rating] : null;

          return (
            <div
              key={item.id}
              className={`bg-white rounded-3xl p-5 border transition-all duration-200 shadow-card ${
                item.status === 'unread'
                  ? 'border-amber-300 ring-2 ring-amber-100 bg-amber-50/20'
                  : item.status === 'resolved'
                  ? 'border-emerald-200 bg-emerald-50/10'
                  : 'border-purple-100'
              }`}
            >
              {/* Top row: Badges and Date */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Role Badge */}
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black shadow-2xs ${
                      item.role === 'student'
                        ? 'bg-purple-100 text-purple-900'
                        : 'bg-indigo-100 text-indigo-900'
                    }`}
                  >
                    {item.role === 'student' ? <GraduationCap className="w-3.5 h-3.5 text-purple-700" /> : <Users className="w-3.5 h-3.5 text-indigo-700" />}
                    <span>{item.role === 'student' ? 'นักศึกษา' : 'อาจารย์'}</span>
                  </span>

                  {/* Category Badge */}
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200 text-xs font-bold">
                    <CategoryIcon className="w-3.5 h-3.5 text-purple-600" />
                    <span>{CATEGORY_NAMES[item.category]?.label || item.category}</span>
                  </span>

                  {/* Rating Badge */}
                  {ratingData && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold">
                      <span className="text-base select-none leading-none">{ratingData.emoji}</span>
                      <span>{item.rating} / 5</span>
                    </span>
                  )}

                  {/* Status Badge */}
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                      item.status === 'resolved'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : item.status === 'read'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                    }`}
                  >
                    {item.status === 'resolved' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : item.status === 'read' ? (
                      <CheckCircle2 className="w-3 h-3 text-blue-600" />
                    ) : (
                      <Clock className="w-3 h-3 text-amber-600" />
                    )}
                    <span>
                      {item.status === 'resolved'
                        ? 'ดำเนินการแล้ว'
                        : item.status === 'read'
                        ? 'อ่านแล้ว'
                        : 'ยังไม่อ่าน'}
                    </span>
                  </span>
                </div>

                <div className="text-[11px] text-purple-500 font-medium">
                  {formatThaiDateTime(item.createdAt)}
                </div>
              </div>

              {/* Message Content */}
              <div className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100/80 text-xs sm:text-sm text-purple-950 font-medium whitespace-pre-wrap leading-relaxed">
                {item.message}
              </div>

              {/* Admin Note Section */}
              <div className="mt-3 pt-3 border-t border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {editingNoteId === item.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        placeholder="พิมพ์บันทึกช่วยจำของแอดมิน..."
                        className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-600 text-purple-950"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveNote(item.id)}
                        className="px-3 py-1.5 bg-purple-900 text-white rounded-xl text-xs font-bold hover:bg-purple-950"
                      >
                        บันทึก
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingNoteId(null)}
                        className="px-2.5 py-1.5 text-gray-500 text-xs font-bold hover:text-gray-700"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  ) : item.adminNote ? (
                    <div
                      onClick={() => {
                        setEditingNoteId(item.id);
                        setNoteInput(item.adminNote || '');
                      }}
                      className="text-xs text-purple-700 bg-purple-100/50 hover:bg-purple-100 px-3 py-1.5 rounded-xl cursor-pointer border border-purple-200/50 inline-block"
                      title="คลิกเพื่อแก้ไขบันทึก"
                    >
                      <span className="font-bold text-purple-900">📝 บันทึกแอดมิน:</span> {item.adminNote}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNoteId(item.id);
                        setNoteInput('');
                      }}
                      className="text-[11px] text-purple-600 hover:text-purple-900 underline font-semibold"
                    >
                      + เพิ่มบันทึกช่วยจำของแอดมิน
                    </button>
                  )}
                </div>

                {/* Actions: Mark read / Mark resolved / Delete */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {item.status !== 'read' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(item.id, 'read')}
                      className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold transition active:scale-95"
                    >
                      ทำเครื่องหมายว่าอ่านแล้ว
                    </button>
                  )}
                  {item.status !== 'resolved' ? (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(item.id, 'resolved')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition active:scale-95 flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>ดำเนินการแล้ว</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(item.id, 'read')}
                      className="px-2.5 py-1.5 rounded-xl text-purple-600 hover:bg-purple-50 text-xs font-semibold"
                    >
                      เปลี่ยนกลับเป็นอ่านแล้ว
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition"
                    title="ลบข้อเสนอแนะนี้"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredList.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center border border-purple-100 text-purple-400 space-y-2">
            <MessageSquare className="w-10 h-10 mx-auto text-purple-200" />
            <div className="font-bold text-sm text-purple-700">ไม่พบข้อเสนอแนะที่ตรงกับเงื่อนไข</div>
            <div className="text-xs text-purple-400">
              เมื่อนักศึกษาหรืออาจารย์ส่งข้อความเข้ามา ระบบจะแสดงในส่วนนี้ทันที
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
