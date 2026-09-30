'use client';

import React from 'react';
import { BookOpen, BarChart3, UserCheck, Settings, RefreshCw, Home, CloudUpload, Lock } from 'lucide-react';

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
  isAdminLoggedIn?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenSettings,
  onRefreshData,
  onBackupAll,
  isSyncing,
  isBackingUp,
  customLogo,
  isAdminLoggedIn,
}) => {
  const logoSrc = customLogo || '/logo.jpg';

  return (
    <>
      {/* 1. TOP NAVBAR (Clean, Spaced, Never Sinking or Crowded) */}
      <header className="sticky top-2 sm:top-3.5 z-40 w-full px-2.5 sm:px-4 print:hidden pointer-events-none">
        <div className="max-w-5xl mx-auto pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-xl border border-purple-200/80 shadow-[0_8px_30px_rgb(126,34,206,0.08)] rounded-full px-3.5 sm:px-5 py-2 flex items-center justify-between gap-3 transition-all duration-300">
            
            {/* Brand Logo & Title */}
            <button
              onClick={() => setCurrentTab('landing')}
              className="flex items-center space-x-2.5 text-left shrink-0 group focus:outline-none"
            >
              <div className="h-8 sm:h-9 max-w-[120px] sm:max-w-[150px] flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoSrc}
                  alt="Faculty of Education Logo"
                  className="h-full w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              <div className="flex flex-col text-left">
                <span className="font-black text-purple-950 text-xs sm:text-sm tracking-tight group-hover:text-purple-700 transition-colors leading-tight">
                  หะละเกาะห์
                </span>
                <span className="text-[10px] text-purple-800/80 font-medium leading-tight">
                  ระบบบันทึกและติดตามการเข้าร่วม
                </span>
              </div>
            </button>

            {/* Desktop Navigation Pill (Hidden on Mobile to prevent sinking!) */}
            <nav className="hidden md:flex items-center bg-purple-100/70 p-1 rounded-full border border-purple-200/60 shadow-inner">
              <button
                onClick={() => setCurrentTab('landing')}
                className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
                  currentTab === 'landing'
                    ? 'bg-purple-800 text-white shadow-md shadow-purple-900/20'
                    : 'text-purple-900/80 hover:text-purple-950 hover:bg-white/50'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>หน้าแรก</span>
              </button>

              <button
                onClick={() => setCurrentTab('teacher')}
                className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
                  currentTab === 'teacher'
                    ? 'bg-purple-800 text-white shadow-md shadow-purple-900/20'
                    : 'text-purple-900/80 hover:text-purple-950 hover:bg-white/50'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>อาจารย์</span>
              </button>

              <button
                onClick={() => setCurrentTab('admin')}
                className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
                  currentTab === 'admin'
                    ? 'bg-purple-800 text-white shadow-md shadow-purple-900/20'
                    : 'text-purple-900/80 hover:text-purple-950 hover:bg-white/50'
                }`}
              >
                {isAdminLoggedIn ? <BarChart3 className="w-3.5 h-3.5" /> : <Lock className="w-3 h-3" />}
                <span>แอดมิน</span>
              </button>
            </nav>

            {/* Quick Actions (Settings & Backup restricted to Admin only) */}
            <div className="flex items-center space-x-1 shrink-0">
              {isAdminLoggedIn && (
                <>
                  <button
                    onClick={onBackupAll}
                    disabled={isBackingUp}
                    title="สำรองข้อมูลทั้งหมดขึ้น Google Sheet"
                    className="p-1.5 sm:px-3 sm:py-1.5 rounded-full text-xs font-bold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 transition-all duration-200 flex items-center gap-1 active:scale-95 disabled:opacity-50 shadow-sm"
                  >
                    <CloudUpload className={`w-3.5 h-3.5 text-purple-700 ${isBackingUp ? 'animate-bounce' : ''}`} />
                    <span className="hidden lg:inline">{isBackingUp ? 'กำลังสำรอง...' : 'สำรองชีต'}</span>
                  </button>

                  <button
                    onClick={onOpenSettings}
                    title="ตั้งค่าเชื่อมต่อระบบ"
                    className="p-1.5 sm:p-2 text-purple-700 hover:text-purple-950 hover:bg-purple-100/60 rounded-full transition-all active:scale-90"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              <button
                onClick={onRefreshData}
                disabled={isSyncing}
                title="รีเฟรชข้อมูล"
                className="p-1.5 sm:p-2 text-purple-700 hover:text-purple-950 hover:bg-purple-100/60 rounded-full transition-all active:scale-90 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. MOBILE BOTTOM NAVIGATION BAR (Thumb-friendly, Never crowded or sinking!) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-purple-200/80 shadow-[0_-4px_25px_rgba(126,34,206,0.12)] py-1.5 px-4 flex items-center justify-around print:hidden">
        <button
          onClick={() => setCurrentTab('landing')}
          className={`flex flex-col items-center justify-center py-1 px-4 rounded-2xl transition-all duration-200 ${
            currentTab === 'landing'
              ? 'text-purple-900 font-extrabold scale-105'
              : 'text-purple-700/60 font-semibold hover:text-purple-900'
          }`}
        >
          <div className={`p-1 rounded-full ${currentTab === 'landing' ? 'bg-purple-100 text-purple-800' : ''}`}>
            <Home className="w-4 h-4" />
          </div>
          <span className="text-[11px] mt-0.5">หน้าแรก</span>
        </button>

        <button
          onClick={() => setCurrentTab('teacher')}
          className={`flex flex-col items-center justify-center py-1 px-4 rounded-2xl transition-all duration-200 ${
            currentTab === 'teacher'
              ? 'text-purple-900 font-extrabold scale-105'
              : 'text-purple-700/60 font-semibold hover:text-purple-900'
          }`}
        >
          <div className={`p-1 rounded-full ${currentTab === 'teacher' ? 'bg-purple-100 text-purple-800' : ''}`}>
            <UserCheck className="w-4 h-4" />
          </div>
          <span className="text-[11px] mt-0.5">อาจารย์</span>
        </button>

        <button
          onClick={() => setCurrentTab('admin')}
          className={`flex flex-col items-center justify-center py-1 px-4 rounded-2xl transition-all duration-200 ${
            currentTab === 'admin'
              ? 'text-purple-900 font-extrabold scale-105'
              : 'text-purple-700/60 font-semibold hover:text-purple-900'
          }`}
        >
          <div className={`p-1 rounded-full ${currentTab === 'admin' ? 'bg-purple-100 text-purple-800' : ''}`}>
            {isAdminLoggedIn ? <BarChart3 className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
          </div>
          <span className="text-[11px] mt-0.5">แอดมิน</span>
        </button>
      </nav>
    </>
  );
};
