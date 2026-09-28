'use client';

import React from 'react';
import { BookOpen, BarChart3, UserCheck, Settings, RefreshCw, Home, CloudUpload, Lock } from 'lucide-react';
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
  totalStudents,
  customLogo,
  isAdminLoggedIn,
}) => {
  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-purple-100 sticky top-0 z-40 shadow-sm print:hidden">
      <div className="max-w-6xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Brand & Logo */}
          <button
            onClick={() => setCurrentTab('landing')}
            className="flex items-center space-x-2 text-left shrink-0"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-600 p-0.5 shadow-sm flex items-center justify-center overflow-hidden">
              {customLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={customLogo} alt="Logo" className="w-full h-full object-cover rounded-[10px]" />
              ) : (
                <BookOpen className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-purple-950 text-sm sm:text-base tracking-tight">
                หะละเกาะห์
              </span>
              <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded-full">
                {totalStudents} นศ.
              </span>
            </div>
          </button>

          {/* Navigation Tabs (Centered & Mobile-Optimized) */}
          <div className="flex items-center bg-purple-100/70 p-1 rounded-2xl border border-purple-200">
            <button
              onClick={() => setCurrentTab('landing')}
              className={`flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currentTab === 'landing'
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'text-purple-900 hover:text-purple-950'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>หน้าแรก</span>
            </button>

            <button
              onClick={() => setCurrentTab('teacher')}
              className={`flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currentTab === 'teacher'
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'text-purple-900 hover:text-purple-950'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>อาจารย์</span>
            </button>

            <button
              onClick={() => setCurrentTab('admin')}
              className={`flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currentTab === 'admin'
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'text-purple-900 hover:text-purple-950'
              }`}
            >
              {isAdminLoggedIn ? <BarChart3 className="w-3.5 h-3.5" /> : <Lock className="w-3 h-3" />}
              <span>แอดมิน</span>
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center space-x-1 shrink-0">
            <button
              onClick={onBackupAll}
              disabled={isBackingUp}
              title="สำรองข้อมูลทั้งหมดขึ้น Google Sheet"
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all flex items-center gap-1"
            >
              <CloudUpload className={`w-3.5 h-3.5 ${isBackingUp ? 'animate-bounce' : ''}`} />
              <span className="hidden md:inline">{isBackingUp ? 'กำลังสำรอง...' : 'สำรองชีต'}</span>
            </button>

            <button
              onClick={onRefreshData}
              disabled={isSyncing}
              title="รีเฟรชข้อมูล"
              className="p-2 text-purple-600 hover:text-purple-950 hover:bg-purple-50 rounded-xl transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onOpenSettings}
              title="ตั้งค่าเชื่อมต่อ"
              className="p-2 text-purple-700 hover:text-purple-950 hover:bg-purple-50 rounded-xl transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
