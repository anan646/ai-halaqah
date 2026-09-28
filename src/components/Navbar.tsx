'use client';

import React from 'react';
import { BookOpen, BarChart3, UserCheck, Settings, ExternalLink, RefreshCw, Home, CloudUpload } from 'lucide-react';
import { getGoogleSheetUrl } from '@/lib/api-client';

interface NavbarProps {
  currentTab: 'landing' | 'teacher' | 'admin';
  setCurrentTab: (tab: 'landing' | 'teacher' | 'admin') => void;
  onOpenSettings: () => void;
  onRefreshData: () => void;
  onBackupAll: () => void;
  isSyncing: boolean;
  isBackingUp: boolean;
  totalStudents: number;
  customLogo?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenSettings,
  onRefreshData,
  onBackupAll,
  isSyncing,
  isBackingUp,
  totalStudents,
  customLogo,
}) => {
  const sheetUrl = getGoogleSheetUrl();

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-purple-100 sticky top-0 z-40 shadow-sm print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Logo */}
          <button
            onClick={() => setCurrentTab('landing')}
            className="flex items-center space-x-3 text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-500 p-0.5 shadow-md shadow-purple-900/15 flex items-center justify-center overflow-hidden">
              {customLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={customLogo} alt="Logo" className="w-full h-full object-cover rounded-[10px]" />
              ) : (
                <BookOpen className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-purple-950 text-base sm:text-lg tracking-tight group-hover:text-purple-700 transition-colors">
                  หะละเกาะห์ อัลกุรอาน
                </span>
                <span className="text-[11px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full border border-purple-200">
                  {totalStudents} นศ.
                </span>
              </div>
              <p className="text-[11px] text-purple-700/60 hidden sm:block">ระบบเช็คชื่อกลุ่มศึกษาอัลกุรอาน</p>
            </div>
          </button>

          {/* Navigation Tabs (Purple Theme) */}
          <div className="flex items-center bg-purple-50/70 p-1 rounded-2xl border border-purple-100">
            <button
              onClick={() => setCurrentTab('landing')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                currentTab === 'landing'
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'text-purple-800/70 hover:text-purple-950'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">หน้าแรก</span>
            </button>
            <button
              onClick={() => setCurrentTab('teacher')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                currentTab === 'teacher'
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'text-purple-800/70 hover:text-purple-950'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>อาจารย์</span>
            </button>
            <button
              onClick={() => setCurrentTab('admin')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                currentTab === 'admin'
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'text-purple-800/70 hover:text-purple-950'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>แอดมิน</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Backup All to Google Sheet button */}
            <button
              onClick={onBackupAll}
              disabled={isBackingUp}
              title="สำรองข้อมูลทั้งหมด (นักศึกษา + อาจารย์ + ประวัติ) ขึ้น Google Sheet"
              className="flex items-center space-x-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-xl transition-all disabled:opacity-50"
            >
              <CloudUpload className={`w-3.5 h-3.5 ${isBackingUp ? 'animate-bounce' : ''}`} />
              <span className="hidden md:inline">{isBackingUp ? 'กำลังสำรอง...' : 'สำรองขึ้นชีต'}</span>
            </button>

            {/* Refresh */}
            <button
              onClick={onRefreshData}
              disabled={isSyncing}
              title="รีเฟรชข้อมูล"
              className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-xl transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-purple-700' : ''}`} />
            </button>

            {/* Google Sheet Link */}
            <a
              href={sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center space-x-1.5 text-xs text-purple-800/80 hover:text-purple-950 bg-white hover:bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-purple-600" />
              <span>Google Sheet</span>
            </a>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              className="flex items-center space-x-1.5 text-xs font-medium text-purple-800 bg-white hover:bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-purple-600" />
              <span className="hidden sm:inline">ตั้งค่าชีต</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
