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
      {/* 1. แถบบนสำหรับเดสก์ท็อป */}
      <header className="hidden md:block sticky top-0 z-40 w-full print:hidden bg-white/85 backdrop-blur-xl border-b border-purple-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          <button
            onClick={() => setCurrentTab('landing')}
            className="flex items-center gap-3 text-left shrink-0 group focus:outline-none"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt="" className="h-9 w-auto max-w-[150px] object-contain select-none" />
            <span className="h-8 w-px bg-purple-200" />
            <span className="leading-tight">
              <span className="block font-black text-purple-950 text-sm group-hover:text-purple-700 transition-colors">หะละเกาะห์</span>
              <span className="block text-[11px] text-purple-600/80 font-medium">ระบบบันทึกและติดตามการเข้าร่วม</span>
            </span>
          </button>

          <nav className="flex items-center gap-1">
            {(
              [
                ['landing', 'หน้าแรก', <Home key="h" className="w-4 h-4" />],
                ['admin', 'แอดมิน', isAdminLoggedIn ? <BarChart3 key="a" className="w-4 h-4" /> : <Lock key="l" className="w-3.5 h-3.5" />],
              ] as const
            ).map(([tab, label, icon]) => (
              <button
                key={tab}
                onClick={() => setCurrentTab(tab)}
                className={`relative flex items-center gap-2 px-4 h-16 text-sm font-bold transition-colors ${
                  currentTab === tab ? 'text-purple-900' : 'text-purple-700/70 hover:text-purple-950'
                }`}
              >
                {icon}
                <span>{label}</span>
                {currentTab === tab && <span className="absolute left-3 right-3 bottom-0 h-[3px] rounded-t-full bg-purple-700" />}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 shrink-0">
            {isAdminLoggedIn && (
              <>
                <button
                  onClick={onBackupAll}
                  disabled={isBackingUp}
                  title="สำรองข้อมูลทั้งหมดขึ้น Google Sheet"
                  className="h-9 px-3 rounded-xl text-sm font-bold text-purple-800 hover:bg-purple-50 flex items-center gap-1.5 disabled:opacity-50 transition"
                >
                  <CloudUpload className={`w-4 h-4 ${isBackingUp ? 'animate-bounce' : ''}`} />
                  <span className="hidden lg:inline">{isBackingUp ? 'กำลังสำรอง...' : 'สำรองขึ้นชีต'}</span>
                </button>
                <button
                  onClick={onOpenSettings}
                  title="ตั้งค่าการเชื่อมต่อ Google Sheet"
                  className="w-9 h-9 rounded-xl text-purple-700 hover:bg-purple-50 flex items-center justify-center transition"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </>
            )}
            {onOpenTutorial && (
              <button
                onClick={onOpenTutorial}
                title="คู่มือการใช้งาน"
                className="h-9 px-3 rounded-xl text-sm font-bold text-purple-800 hover:bg-purple-50 flex items-center gap-1.5 transition"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="hidden lg:inline">คู่มือ</span>
              </button>
            )}
            <button
              onClick={onRefreshData}
              disabled={isSyncing}
              title="รีเฟรชข้อมูล"
              className="w-9 h-9 rounded-xl text-purple-700 hover:bg-purple-50 flex items-center justify-center disabled:opacity-50 transition"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
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
