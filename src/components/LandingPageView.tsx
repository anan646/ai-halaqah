'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  BookOpen,
  Search,
  Users,
  ShieldCheck,
  Upload,
  ChevronRight,
  User,
  Settings
} from 'lucide-react';
import { INITIAL_TEACHERS, INITIAL_STUDENTS } from '@/lib/students-data';
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
  // Strict Gender toggle: default to 'ชาย' or user selects
  const [selectedGender, setSelectedGender] = useState<'ชาย' | 'หญิง'>('ชาย');
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

  // Strictly filter by chosen gender and search term
  const filteredTeachers = useMemo(() => {
    return INITIAL_TEACHERS.filter((t) => {
      const matchGender = t.gender === selectedGender;
      const matchSearch =
        !searchTerm.trim() ||
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.groupName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchGender && matchSearch;
    });
  }, [searchTerm, selectedGender]);

  const getStudentCount = (teacherName: string) => {
    return INITIAL_STUDENTS.filter((s) => s.teacherName === teacherName).length;
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-5">
      {/* 1. TOP CENTER LOGO & TITLE */}
      <div className="flex flex-col items-center justify-center text-center space-y-3">
        {/* Logo Container */}
        <div className="relative flex flex-col items-center">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-600 p-1 shadow-lg shadow-purple-900/15 flex items-center justify-center overflow-hidden border-2 border-purple-200">
            {customLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={customLogo}
                alt="Logo"
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-purple-700 rounded-2xl text-white">
                <BookOpen className="w-12 h-12 text-purple-100" />
                <span className="text-[10px] font-extrabold tracking-widest mt-1 text-purple-200">
                  HALAQAH
                </span>
              </div>
            )}
          </div>

          {/* Button to Add/Change Logo */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2.5 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Upload className="w-3.5 h-3.5 text-purple-600" />
            <span>{customLogo ? 'เปลี่ยนโลโก้' : '+ เพิ่มโลโก้'}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoFileChange}
          />
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-purple-950 tracking-tight">
            หะละเกาะห์ อัลกุรอาน
          </h1>
          <p className="text-xs sm:text-sm text-purple-800/70 mt-1">
            ระบบเช็คชื่อกลุ่มศึกษาอัลกุรอาน
          </p>
        </div>
      </div>

      {/* 2. GENDER SELECTOR TOGGLE (ชาย / หญิง) - Mobile First Big Buttons */}
      <div className="bg-purple-100/70 p-1.5 rounded-2xl flex border border-purple-200">
        <button
          type="button"
          onClick={() => setSelectedGender('ชาย')}
          className={`flex-1 py-3 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center space-x-2 transition-all ${
            selectedGender === 'ชาย'
              ? 'bg-purple-700 text-white shadow-md shadow-purple-900/15'
              : 'text-purple-900 hover:text-purple-950'
          }`}
        >
          <User className="w-4 h-4" />
          <span>กลุ่มชาย ({INITIAL_TEACHERS.filter(t => t.gender === 'ชาย').length} กลุ่ม)</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedGender('หญิง')}
          className={`flex-1 py-3 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center space-x-2 transition-all ${
            selectedGender === 'หญิง'
              ? 'bg-purple-700 text-white shadow-md shadow-purple-900/15'
              : 'text-purple-900 hover:text-purple-950'
          }`}
        >
          <User className="w-4 h-4" />
          <span>กลุ่มหญิง ({INITIAL_TEACHERS.filter(t => t.gender === 'หญิง').length} กลุ่ม)</span>
        </button>
      </div>

      {/* 3. SEARCH BOX */}
      <div className="relative">
        <Search className="w-5 h-5 text-purple-400 absolute left-4 top-3.5" />
        <input
          type="text"
          placeholder={`ค้นหาชื่ออาจารย์กลุ่ม${selectedGender}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 text-sm bg-white border border-purple-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-purple-950 placeholder-purple-300 shadow-sm"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute right-4 top-3 text-xs font-bold text-purple-400 hover:text-purple-700 px-1"
          >
            ล้าง
          </button>
        )}
      </div>

      {/* 4. TEACHER LIST (Strictly for Selected Gender) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1 text-xs font-bold text-purple-900/70">
          <span>รายชื่ออาจารย์ประจำกลุ่ม{selectedGender} ({filteredTeachers.length} ท่าน)</span>
          <span>แตะชื่อเพื่อเข้าเช็คชื่อ</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {filteredTeachers.map((t) => {
            const count = getStudentCount(t.name);
            return (
              <button
                key={t.groupId}
                type="button"
                onClick={() => onSelectTeacher(t.name)}
                className="w-full text-left p-4 rounded-2xl bg-white border border-purple-100 hover:border-purple-300 shadow-sm active:bg-purple-50/70 transition-all flex items-center justify-between group min-h-[64px]"
              >
                <div className="pr-3 flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md shrink-0">
                      {t.yearLevel}
                    </span>
                    <span className="text-xs text-gray-500 truncate">
                      {t.groupName}
                    </span>
                  </div>
                  <h3 className="font-bold text-purple-950 text-sm sm:text-base truncate group-hover:text-purple-700">
                    {t.name}
                  </h3>
                  <div className="text-[11px] text-purple-800/60 mt-0.5 flex items-center gap-1 font-medium">
                    <Users className="w-3 h-3 text-purple-500" />
                    <span>นักศึกษา {count} คน</span>
                  </div>
                </div>

                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 group-hover:bg-purple-700 group-hover:text-white transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </button>
            );
          })}
        </div>

        {filteredTeachers.length === 0 && (
          <div className="py-10 text-center bg-white rounded-2xl border border-purple-100 text-purple-400 text-xs sm:text-sm">
            ไม่พบอาจารย์ที่ตรงกับ &ldquo;{searchTerm}&rdquo; ในกลุ่ม{selectedGender}
          </div>
        )}
      </div>

      {/* 5. BOTTOM ADMIN LINK */}
      <div className="pt-4 border-t border-purple-100 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={onGoToAdmin}
          className="inline-flex items-center space-x-2 text-xs font-bold text-purple-900 bg-white hover:bg-purple-50 border border-purple-200 px-4 py-2.5 rounded-xl shadow-sm transition-all active:scale-95"
        >
          <ShieldCheck className="w-4 h-4 text-purple-600" />
          <span>เข้าสู่ระบบผู้ดูแลระบบ (Admin)</span>
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3.5 py-2.5 rounded-xl transition-all"
        >
          <Settings className="w-4 h-4 text-purple-600" />
          <span>ตั้งค่าชีต</span>
        </button>
      </div>
    </div>
  );
};
