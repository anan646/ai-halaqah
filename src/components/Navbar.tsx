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
  return (
    <header className="sticky top-2 sm:top-3.5 z-50 w-full px-2.5 sm:px-4 print:hidden pointer-events-none">
      <div className="max-w-5xl mx-auto pointer-events-auto">
        <div className="bg-white/90 backdrop-blur-xl border border-purple-200/70 shadow-[0_8px_30px_rgb(126,34,206,0.08)] rounded-full px-3 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between gap-2 transition-all duration-300">
          
          {/* Brand & Logo with Subtitle */}
          <button
            onClick={() => setCurrentTab('landing')}
            className="flex items-center space-x-2 text-left shrink-0 group focus:outline-none"
          >
            <div className="p-0.5 rounded-full bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-600 shadow-sm transition-transform duration-300 group-hover:scale-105 active:scale-95">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white flex items-center justify-center overflow-hidden">
                {customLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={customLogo} alt="Logo" className="w-full h-full object-contain p-0.5" />
                ) : (
                  <BookOpen className="w-4 h-4 text-purple-700" />
                )}
              </div>
            </div>
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-purple-950 text-xs sm:text-sm tracking-tight group-hover:text-purple-700 transition-colors leading-tight">
                หะละเกาะห์
              </span>
              <span className="text-[10px] text-purple-800/80 font-medium leading-tight">
                ระบบบันทึกและติดตามการเข้าร่วม
              </span>
            </div>
          </button>

          {/* Navigation Pill (Centered & Tactile) */}
          <nav className="flex items-center bg-purple-100/70 p-1 rounded-full border border-purple-200/60 shadow-inner">
            <button
              onClick={() => setCurrentTab('landing')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
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
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
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
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
                currentTab === 'admin'
                  ? 'bg-purple-800 text-white shadow-md shadow-purple-900/20'
                  : 'text-purple-900/80 hover:text-purple-950 hover:bg-white/50'
              }`}
            >
              {isAdminLoggedIn ? <BarChart3 className="w-3.5 h-3.5" /> : <Lock className="w-3 h-3" />}
              <span>แอดมิน</span>
            </button>
          </nav>

          {/* Quick Action Buttons (Settings & Backup restricted to Admin only) */}
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
                  <span className="hidden md:inline">{isBackingUp ? 'กำลังสำรอง...' : 'สำรองชีต'}</span>
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
  );
};
