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
  Sparkles
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

  // Strictly filter by chosen gender and search term
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
    <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 py-3 sm:py-6 space-y-5">
      {/* 1. TOP CENTER OFFICIAL LOGO */}
      <div className="flex flex-col items-center justify-center text-center space-y-2">
        <div className="relative group">
          <div className="p-2 sm:p-3 bg-white rounded-2xl border border-purple-100 shadow-sm flex items-center justify-center max-w-sm sm:max-w-md mx-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt="คณะศึกษาศาสตร์ มหาวิทยาลัยฟาฏอนี"
              className="max-h-16 sm:max-h-20 w-auto object-contain"
            />
          </div>

          {/* Discreet button to change logo */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="เปลี่ยนโลโก้"
            className="mt-1.5 inline-flex items-center space-x-1 text-[11px] font-bold text-purple-700/80 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg transition-all"
          >
            <Upload className="w-3 h-3" />
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

        <div className="pt-1">
          <h1 className="text-xl sm:text-2xl font-black text-purple-950 tracking-tight">
            ระบบเช็คชื่อกลุ่มศึกษาอัลกุรอาน
          </h1>
          <p className="text-xs text-purple-800/70 font-medium">
            คณะศึกษาศาสตร์ มหาวิทยาลัยฟาฏอนี
          </p>
        </div>
      </div>

      {/* 2. MINIMAL & ULTRA-EASY GENDER SELECTOR (2 Big Modern Cards) */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => setSelectedGender('ชาย')}
          className={`p-3.5 sm:p-4 rounded-2xl text-center border-2 transition-all flex flex-col items-center justify-center ${
            selectedGender === 'ชาย'
              ? 'border-purple-700 bg-purple-700 text-white shadow-md shadow-purple-900/15'
              : 'border-purple-200 bg-white text-purple-950 hover:bg-purple-50/70 hover:border-purple-300'
          }`}
        >
          <div className="text-base sm:text-lg font-extrabold flex items-center gap-1.5">
            <span>👨‍💼 กลุ่มชาย</span>
          </div>
          <span className={`text-[11px] mt-0.5 font-medium ${selectedGender === 'ชาย' ? 'text-purple-100' : 'text-purple-700/70'}`}>
            ({maleCount} กลุ่มอาจารย์)
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedGender('หญิง')}
          className={`p-3.5 sm:p-4 rounded-2xl text-center border-2 transition-all flex flex-col items-center justify-center ${
            selectedGender === 'หญิง'
              ? 'border-purple-700 bg-purple-700 text-white shadow-md shadow-purple-900/15'
              : 'border-purple-200 bg-white text-purple-950 hover:bg-purple-50/70 hover:border-purple-300'
          }`}
        >
          <div className="text-base sm:text-lg font-extrabold flex items-center gap-1.5">
            <span>👩‍💼 กลุ่มหญิง</span>
          </div>
          <span className={`text-[11px] mt-0.5 font-medium ${selectedGender === 'หญิง' ? 'text-purple-100' : 'text-purple-700/70'}`}>
            ({femaleCount} กลุ่มอาจารย์)
          </span>
        </button>
      </div>

      {/* 3. SEARCH BOX */}
      <div className="relative">
        <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder={`ค้นหาชื่ออาจารย์กลุ่ม${selectedGender}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-10 py-3 text-sm bg-white border border-purple-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-purple-950 placeholder-purple-300 shadow-sm"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute right-3.5 top-3 text-xs font-bold text-purple-400 hover:text-purple-700"
          >
            ล้าง
          </button>
        )}
      </div>

      {/* 4. TEACHER LIST (Strictly for Selected Gender) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1 text-xs font-bold text-purple-900/70">
          <span>เลือกชื่อเพื่อเช็คชื่อ ({filteredTeachers.length} กลุ่ม)</span>
          <span className="text-[11px] text-purple-600">กลุ่ม{selectedGender}</span>
        </div>

        <div className="space-y-2">
          {filteredTeachers.map((t) => {
            const count = getStudentCount(t.name);
            return (
              <button
                key={t.groupId}
                type="button"
                onClick={() => onSelectTeacher(t.name)}
                className="w-full text-left p-3.5 sm:p-4 rounded-2xl bg-white border border-purple-100/90 hover:border-purple-300 shadow-sm active:bg-purple-50/80 transition-all flex items-center justify-between group"
              >
                <div className="pr-2 flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-0.5">
                    <span className="text-[11px] font-extrabold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                      {t.yearLevel}
                    </span>
                    <span className="text-xs text-purple-800/60 truncate">
                      {t.groupName}
                    </span>
                  </div>
                  <h3 className="font-bold text-purple-950 text-sm sm:text-base truncate group-hover:text-purple-700">
                    {t.name}
                  </h3>
                  <div className="text-[11px] text-purple-800/60 mt-0.5 font-medium flex items-center gap-1">
                    <Users className="w-3 h-3 text-purple-500" />
                    <span>สมาชิกในกลุ่ม {count} คน</span>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 group-hover:bg-purple-700 group-hover:text-white transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>

        {filteredTeachers.length === 0 && (
          <div className="py-8 text-center bg-white rounded-2xl border border-purple-100 text-purple-400 text-xs">
            ไม่พบรายชื่อที่ตรงกับ &ldquo;{searchTerm}&rdquo; ในกลุ่ม{selectedGender}
          </div>
        )}
      </div>

      {/* 5. BOTTOM ADMIN LINK */}
      <div className="pt-3 border-t border-purple-100 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={onGoToAdmin}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-purple-900 bg-white hover:bg-purple-50 border border-purple-200 px-3.5 py-2 rounded-xl shadow-sm transition-all"
        >
          <ShieldCheck className="w-4 h-4 text-purple-600" />
          <span>เข้าสู่ระบบผู้ดูแลระบบ (Admin)</span>
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          className="inline-flex items-center space-x-1 text-xs font-bold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-2 rounded-xl transition-all"
        >
          <Settings className="w-3.5 h-3.5 text-purple-600" />
          <span>ตั้งค่า</span>
        </button>
      </div>
    </div>
  );
};
