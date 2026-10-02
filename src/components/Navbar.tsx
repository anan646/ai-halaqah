'use client';

import React from 'react';
import { BookOpen, BarChart3, UserCheck, Settings, RefreshCw, Home, CloudUpload, Lock, HelpCircle } from 'lucide-react';

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
  onOpenTutorial?: () => void;
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
  onOpenTutorial,
}) => {
  const logoSrc = customLogo || '/logo.png';

  return (
    <>
      {/* 1. TOP NAVBAR (Hidden on mobile as requested in screenshot, shown on desktop) */}
      <header className="hidden md:block sticky top-2 sm:top-3.5 z-40 w-full px-2.5 sm:px-4 print:hidden pointer-events-none">
        <div className="max-w-5xl mx-auto pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-xl border border-purple-200/80 shadow-[0_8px_30px_rgb(126,34,206,0.08)] rounded-full px-3.5 sm:px-5 py-2 flex items-center justify-between gap-3 transition-all duration-300">
            
            {/* Brand Logo & Title */}
            <button
              onClick={() => setCurrentTab('landing')}
              className="flex items-center space-x-2.5 sm:space-x-3 text-left shrink-0 group focus:outline-none"
            >
              <div className="h-9 sm:h-10 max-w-[150px] sm:max-w-[200px] flex items-center justify-center overflow-hidden">
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

              {onOpenTutorial && (
                <button
                  onClick={onOpenTutorial}
                  title="สอนการใช้งานระบบ"
                  className="p-1.5 sm:px-3 sm:py-1.5 rounded-full text-xs font-bold text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 transition-all flex items-center gap-1.5 active:scale-95 shadow-2xs"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-purple-700" />
                  <span className="hidden sm:inline">คู่มือ</span>
                </button>
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

      {/* 2. FLOATING BOTTOM NAVIGATION BAR WITH GLASS-FX & PURPLE THEME */}
      <div className="md:hidden fixed bottom-4 inset-x-0 z-40 flex justify-center px-4 pointer-events-none print:hidden">
        <nav className="pointer-events-auto relative w-full max-w-[320px] rounded-full overflow-hidden border border-purple-200/60 shadow-[0_12px_38px_rgba(107,33,168,0.25),0_2px_10px_rgba(107,33,168,0.12)] p-2 transition-all duration-300">
          {/* Glass-FX Backdrop Layer with Purple Theme */}
          <div className="glass-fx absolute inset-0 z-0 is-on pointer-events-none" aria-hidden="true">
            <div className="absolute inset-0 backdrop-blur-xl" />
            <div className="absolute inset-0" style={{ background: 'rgba(255, 255, 255, 0.45)' }} />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-purple-600/15 to-indigo-500/10" />
            <div
              className="absolute inset-0"
              style={{
                boxShadow:
                  'inset 0 -1px 1px 0 rgba(255, 255, 255, 0.6), inset 0 1px 1px 0 rgba(255, 255, 255, 0.5), inset 0 0 16px 0 rgba(147, 51, 234, 0.15)',
              }}
            />
          </div>

          {/* Interactive Navigation Items (Spacious & Thumb-Friendly) */}
          <div className="relative z-10 flex items-center justify-between gap-1.5 w-full">
            <button
              type="button"
              onClick={() => setCurrentTab('landing')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full transition-all duration-200 active:scale-95 ${
                currentTab === 'landing'
                  ? 'bg-gradient-to-r from-purple-800 to-purple-900 text-white font-black shadow-md shadow-purple-950/25 scale-102'
                  : 'text-purple-950/80 hover:text-purple-950 hover:bg-white/40 font-bold'
              }`}
            >
              <Home className="w-5 h-5 shrink-0" />
              <span className="text-sm font-extrabold">หน้าแรก</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentTab('admin')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full transition-all duration-200 active:scale-95 ${
                currentTab === 'admin'
                  ? 'bg-gradient-to-r from-purple-800 to-purple-900 text-white font-black shadow-md shadow-purple-950/25 scale-102'
                  : 'text-purple-950/80 hover:text-purple-950 hover:bg-white/40 font-bold'
              }`}
            >
              {isAdminLoggedIn ? (
                <BarChart3 className="w-5 h-5 shrink-0" />
              ) : (
                <Lock className="w-4 h-4 shrink-0" />
              )}
              <span className="text-sm font-extrabold">แอดมิน</span>
            </button>
          </div>
        </nav>
      </div>
    </>
  );
};
