'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  BookOpen,
  Search,
  Users,
  ShieldCheck,
  Upload,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Settings,
  Database,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';
import { Teacher } from '@/lib/types';
import { INITIAL_TEACHERS, INITIAL_STUDENTS } from '@/lib/students-data';
import { getSavedLogo, setSavedLogo, getGoogleSheetUrl } from '@/lib/api-client';

interface LandingPageViewProps {
  onSelectTeacher: (teacherName: string) => void;
  onGoToAdmin: () => void;
  onOpenSettings: () => void;
  customLogo: string;
  onLogoUpdated: (newLogo: string) => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onSelectTeacher,
  onGoToAdmin,
  onOpenSettings,
  customLogo,
  onLogoUpdated,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGender, setSelectedGender] = useState<'ทั้งหมด' | 'ชาย' | 'หญิง'>('ทั้งหมด');
  const [selectedYear, setSelectedYear] = useState<string>('ทั้งหมด');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Logo Upload
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('กรุณาเลือกรูปภาพขนาดไม่เกิน 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          setSavedLogo(base64);
          onLogoUpdated(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter teachers
  const filteredTeachers = useMemo(() => {
    return INITIAL_TEACHERS.filter((t) => {
      const matchGender = selectedGender === 'ทั้งหมด' || t.gender === selectedGender;
      const matchYear = selectedYear === 'ทั้งหมด' || t.yearLevel === selectedYear;
      const matchSearch =
        !searchTerm ||
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.groupName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchGender && matchYear && matchSearch;
    });
  }, [searchTerm, selectedGender, selectedYear]);

  // Count student per teacher
  const getStudentCount = (teacherName: string) => {
    return INITIAL_STUDENTS.filter((s) => s.teacherName === teacherName).length;
  };

  const sheetUrl = getGoogleSheetUrl();

  return (
    <div className="min-h-[85vh] flex flex-col justify-between py-6">
      {/* Top Center Logo & Title Header */}
      <div className="text-center max-w-3xl mx-auto px-4 pt-4 pb-8 space-y-4">
        {/* Logo Container with Quick Upload Trigger */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative group">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-500 p-1.5 shadow-xl shadow-purple-900/15 flex items-center justify-center overflow-hidden border-2 border-purple-200">
              {customLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={customLogo}
                  alt="Halaqah Logo"
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-purple-700/80 rounded-2xl text-white">
                  <BookOpen className="w-12 h-12 text-purple-100" />
                  <span className="text-[10px] font-bold tracking-wider mt-1 text-purple-200 uppercase">
                    HALAQAH
                  </span>
                </div>
              )}
            </div>

            {/* Admin Upload Logo Floating Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="คลิกเพื่อเปลี่ยนโลโก้ระบบทันที"
              className="absolute -bottom-2 -right-2 bg-white text-purple-700 hover:text-purple-900 p-2 rounded-xl shadow-lg border border-purple-200 hover:scale-105 transition-all flex items-center gap-1 text-xs font-semibold"
            >
              <Upload className="w-3.5 h-3.5 text-purple-600" />
              <span className="hidden sm:inline text-[11px]">เปลี่ยนโลโก้</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoFileChange}
            />
          </div>
        </div>

        <div>
          <div className="inline-flex items-center space-x-2 bg-purple-100/80 border border-purple-200 text-purple-800 text-xs px-3 py-1 rounded-full font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>ระบบบันทึกและติดตามการเข้าร่วมกลุ่มศึกษาอัลกุรอาน</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-purple-950 mt-3 tracking-tight">
            หะละเกาะห์ อัลกุรอาน
          </h1>
          <p className="text-sm text-purple-800/70 mt-1 max-w-xl mx-auto">
            ยินดีต้อนรับอาจารย์ผู้รับผิดชอบกลุ่มศึกษาอัลกุรอาน กรุณาเลือกชื่อของท่านเพื่อเข้าสู่ระบบเช็คชื่อประจำกลุ่ม
          </p>
        </div>

        {/* Quick Admin & Sheet Navigation */}
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            onClick={onGoToAdmin}
            className="flex items-center space-x-1.5 text-xs font-semibold text-purple-900 bg-white hover:bg-purple-50 border border-purple-200 px-4 py-2 rounded-xl shadow-sm transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>เข้าสู่ระบบผู้ดูแลระบบ (Admin)</span>
          </button>
          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-1.5 text-xs font-semibold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3.5 py-2 rounded-xl transition-all"
          >
            <Settings className="w-4 h-4 text-purple-600" />
            <span>ตั้งค่า Google Sheet</span>
          </button>
        </div>
      </div>

      {/* Main Search & Teacher Selector Section */}
      <div className="bg-white rounded-3xl border border-purple-100/90 shadow-xl shadow-purple-900/5 p-5 sm:p-7 max-w-6xl mx-auto w-full">
        {/* Search Bar & Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6 pb-5 border-b border-purple-100">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="ค้นหาชื่ออาจารย์ หรือชื่อกลุ่ม (เช่น อาจารย์มุสลิม, กลุ่มที่ 1, ปี 2)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-purple-50/50 border border-purple-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white text-purple-950 placeholder-purple-300 transition-all"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(['ทั้งหมด', 'ชาย', 'หญิง'] as const).map((gender) => (
              <button
                key={gender}
                onClick={() => setSelectedGender(gender)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  selectedGender === gender
                    ? 'bg-purple-700 text-white shadow-sm'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/60'
                }`}
              >
                {gender === 'ทั้งหมด' ? 'เพศ: ทั้งหมด' : `กลุ่ม${gender}`}
              </button>
            ))}

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="ทั้งหมด">ชั้นปี: ทั้งหมด</option>
              <option value="ปี 2">ชั้นปีที่ 2</option>
              <option value="ปี 3">ชั้นปีที่ 3</option>
              <option value="ปี 4">ชั้นปีที่ 4</option>
            </select>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-4 text-xs font-medium text-purple-900/60">
          <span>พบอาจารย์ประจำกลุ่ม {filteredTeachers.length} ท่าน (จากทั้งหมด {INITIAL_TEACHERS.length} ท่าน)</span>
          <span>คลิกที่การ์ดเพื่อเข้าสู่หน้าเช็คชื่อ</span>
        </div>

        {/* Teachers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredTeachers.map((t) => {
            const studentCount = getStudentCount(t.name);
            return (
              <button
                key={t.groupId}
                type="button"
                onClick={() => onSelectTeacher(t.name)}
                className="group p-4 rounded-2xl border border-purple-100 hover:border-purple-300 bg-white hover:bg-gradient-to-br hover:from-purple-50/70 hover:to-white text-left transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-lg">
                      {t.yearLevel}
                    </span>
                    <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">
                      {t.gender}
                    </span>
                  </div>
                  <h3 className="font-bold text-purple-950 text-sm group-hover:text-purple-700 transition-colors line-clamp-1">
                    {t.name}
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">
                    {t.groupName}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-purple-50 flex items-center justify-between text-xs text-purple-800/80">
                  <div className="flex items-center gap-1 font-medium">
                    <Users className="w-3.5 h-3.5 text-purple-500" />
                    <span>{studentCount} คน</span>
                  </div>
                  <span className="text-xs font-semibold text-purple-600 flex items-center group-hover:translate-x-0.5 transition-transform">
                    <span>เช็คชื่อ</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {filteredTeachers.length === 0 && (
          <div className="py-12 text-center text-sm text-purple-400">
            ไม่พบรายชื่ออาจารย์ที่ตรงกับคำค้นหา &ldquo;{searchTerm}&rdquo;
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-center pt-8 text-xs text-purple-800/50">
        <span>ระบบฐานข้อมูลกลุ่มศึกษาอัลกุรอาน • รวมนักศึกษา {INITIAL_STUDENTS.length} คน (40 กลุ่ม)</span>
      </div>
    </div>
  );
};
