'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  Users,
  ShieldCheck,
  Upload,
  ChevronRight,
  User,
  Settings,
  Sparkles,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { getActiveTeachers, getActiveStudents } from '@/lib/data-store';
import { setSavedLogo } from '@/lib/api-client';

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
  const [selectedGender, setSelectedGender] = useState<'ชาย' | 'หญิง'>('ชาย');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allTeachers = useMemo(() => getActiveTeachers(), []);
  const allStudents = useMemo(() => getActiveStudents(), []);

  // Handle Logo Upload
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('กรุณาเลือกรูปภาพขนาดไม่เกิน 3MB');
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

  // Filtered teachers
  const filteredTeachers = useMemo(() => {
    return allTeachers.filter((t) => {
      const matchGender = t.gender === selectedGender;
      const matchSearch =
        !searchTerm.trim() ||
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.groupName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchGender && matchSearch;
    });
  }, [allTeachers, searchTerm, selectedGender]);

  const maleCount = useMemo(() => allTeachers.filter(t => t.gender === 'ชาย').length, [allTeachers]);
  const femaleCount = useMemo(() => allTeachers.filter(t => t.gender === 'หญิง').length, [allTeachers]);

  const getStudentCount = (teacherName: string) => {
    return allStudents.filter((s) => s.teacherName === teacherName).length;
  };

  const logoSrc = customLogo || '/logo.jpg';

  return (
    <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-6 animate-fadeIn">
      {/* 1. TOP CENTER OFFICIAL LOGO WITH DOUBLE-BEZEL ARCHITECTURE */}
      <div className="flex flex-col items-center justify-center text-center space-y-3">
        <div className="relative group">
          {/* Outer Shell */}
          <div className="p-2 sm:p-2.5 rounded-3xl bg-purple-100/60 border border-purple-200/70 shadow-card transition-all duration-300 hover:shadow-card-hover">
            {/* Inner Core */}
            <div className="bg-white rounded-[1.25rem] px-5 py-3 sm:py-4 shadow-sm flex items-center justify-center max-w-xs sm:max-w-md mx-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoSrc}
                alt="คณะศึกษาศาสตร์ มหาวิทยาลัยฟาฏอนี"
                className="max-h-16 sm:max-h-20 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </div>
          </div>

          {/* Change Logo Action */}
          <div className="flex justify-center mt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="เปลี่ยนรูปตราสัญลักษณ์"
              className="inline-flex items-center space-x-1.5 text-[11px] font-semibold text-purple-700/80 hover:text-purple-950 bg-white/80 hover:bg-white border border-purple-200/80 px-3 py-1 rounded-full shadow-sm transition-all duration-200 active:scale-95"
            >
              <Upload className="w-3 h-3 text-purple-600" />
              <span>เปลี่ยนรูปโลโก้</span>
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

        {/* Title & Eyebrow */}
        <div className="space-y-1 pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-100/80 border border-purple-200/60 text-purple-900 text-[11px] font-bold">
            <Sparkles className="w-3 h-3 text-purple-600" />
            <span>ระบบบันทึกและติดตามการเข้าร่วม</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-purple-950 tracking-tight text-balance">
            กลุ่มศึกษาอัลกุรอาน (หะละเกาะห์)
          </h1>
          <p className="text-xs text-purple-800/80 font-medium">
            คณะศึกษาศาสตร์ มหาวิทยาลัยฟาฏอนี
          </p>
        </div>
      </div>

      {/* 2. TACTILE GENDER SELECTOR (2 Sculpted Cards) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Male Group */}
        <button
          type="button"
          onClick={() => setSelectedGender('ชาย')}
          className={`p-4 sm:p-5 rounded-3xl text-left border transition-all duration-300 relative overflow-hidden group active:scale-[0.98] ${
            selectedGender === 'ชาย'
              ? 'bg-gradient-to-br from-purple-800 via-purple-800 to-indigo-900 text-white border-purple-700 shadow-lg shadow-purple-900/15'
              : 'bg-white text-purple-950 border-purple-200/80 hover:border-purple-300 hover:shadow-card'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl sm:text-3xl">👨‍💼</span>
            <span
              className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full ${
                selectedGender === 'ชาย'
                  ? 'bg-white/20 text-white'
                  : 'bg-purple-100 text-purple-800'
              }`}
            >
              {maleCount} กลุ่ม
            </span>
          </div>
          <div className="mt-3">
            <div className="text-base sm:text-lg font-black tracking-tight">กลุ่มชาย</div>
            <div
              className={`text-[11px] mt-0.5 font-medium ${
                selectedGender === 'ชาย' ? 'text-purple-200' : 'text-purple-700/70'
              }`}
            >
              นักศึกษาและอาจารย์ชาย
            </div>
          </div>
        </button>

        {/* Female Group */}
        <button
          type="button"
          onClick={() => setSelectedGender('หญิง')}
          className={`p-4 sm:p-5 rounded-3xl text-left border transition-all duration-300 relative overflow-hidden group active:scale-[0.98] ${
            selectedGender === 'หญิง'
              ? 'bg-gradient-to-br from-purple-800 via-purple-800 to-indigo-900 text-white border-purple-700 shadow-lg shadow-purple-900/15'
              : 'bg-white text-purple-950 border-purple-200/80 hover:border-purple-300 hover:shadow-card'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl sm:text-3xl">👩‍💼</span>
            <span
              className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full ${
                selectedGender === 'หญิง'
                  ? 'bg-white/20 text-white'
                  : 'bg-purple-100 text-purple-800'
              }`}
            >
              {femaleCount} กลุ่ม
            </span>
          </div>
          <div className="mt-3">
            <div className="text-base sm:text-lg font-black tracking-tight">กลุ่มหญิง</div>
            <div
              className={`text-[11px] mt-0.5 font-medium ${
                selectedGender === 'หญิง' ? 'text-purple-200' : 'text-purple-700/70'
              }`}
            >
              นักศึกษาและอาจารย์หญิง
            </div>
          </div>
        </button>
      </div>

      {/* 3. SEARCH BOX WITH NESTED PILL ARCHITECTURE */}
      <div className="relative">
        <div className="absolute left-3.5 top-3 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center pointer-events-none">
          <Search className="w-3.5 h-3.5 text-purple-700" />
        </div>
        <input
          type="text"
          placeholder={`ค้นหาชื่ออาจารย์กลุ่ม${selectedGender}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-12 py-3 text-xs sm:text-sm bg-white border border-purple-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-purple-950 placeholder-purple-300 shadow-sm transition-all"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute right-3.5 top-2.5 text-xs font-bold text-purple-500 hover:text-purple-800 bg-purple-50 px-2 py-1 rounded-lg"
          >
            ล้าง
          </button>
        )}
      </div>

      {/* 4. TEACHER LIST CARDS (With Button-in-Button Trailing Action) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1 text-xs font-bold text-purple-900/70">
          <span>รายชื่ออาจารย์ผู้รับผิดชอบ ({filteredTeachers.length} กลุ่ม)</span>
          <span className="text-[11px] font-mono text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-full">
            กลุ่ม{selectedGender}
          </span>
        </div>

        <div className="space-y-2.5">
          {filteredTeachers.map((t) => {
            const count = getStudentCount(t.name);
            return (
              <button
                key={t.groupId}
                type="button"
                onClick={() => onSelectTeacher(t.name)}
                className="w-full text-left p-3.5 sm:p-4 rounded-2xl bg-white border border-purple-100/90 hover:border-purple-300 shadow-card hover:shadow-card-hover transition-all duration-300 ease-spring active:scale-[0.99] flex items-center justify-between group"
              >
                <div className="pr-3 flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-[10px] font-mono font-extrabold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200/50">
                      {t.yearLevel}
                    </span>
                    <span className="text-xs text-purple-800/70 font-semibold truncate">
                      {t.groupName}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-purple-950 text-sm sm:text-base truncate group-hover:text-purple-700 transition-colors">
                    {t.name}
                  </h3>
                  <div className="text-[11px] text-purple-800/60 mt-1 font-medium flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-purple-500" />
                    <span>สมาชิกในกลุ่ม {count} คน</span>
                  </div>
                </div>

                {/* Trailing Button-in-Button Icon */}
                <div className="w-9 h-9 rounded-full bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center shrink-0 group-hover:bg-purple-800 group-hover:text-white group-hover:translate-x-1 transition-all duration-300 shadow-sm">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>

        {filteredTeachers.length === 0 && (
          <div className="py-12 text-center bg-white rounded-3xl border border-purple-100 text-purple-400 text-xs">
            ไม่พบรายชื่ออาจารย์ที่ตรงกับ &ldquo;{searchTerm}&rdquo; ในกลุ่ม{selectedGender}
          </div>
        )}
      </div>

      {/* 5. FOOTER QUICK ACTIONS */}
      <div className="pt-4 border-t border-purple-100/80 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={onGoToAdmin}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-purple-900 bg-white hover:bg-purple-50 border border-purple-200 px-4 py-2.5 rounded-full shadow-sm transition-all duration-200 active:scale-95"
        >
          <ShieldCheck className="w-4 h-4 text-purple-700" />
          <span>เข้าสู่ระบบแอดมิน (Admin)</span>
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          className="inline-flex items-center space-x-1 text-xs font-bold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3.5 py-2.5 rounded-full transition-all duration-200 active:scale-95"
        >
          <Settings className="w-3.5 h-3.5 text-purple-700" />
          <span>ตั้งค่า</span>
        </button>
      </div>
    </div>
  );
};
