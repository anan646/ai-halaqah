'use client';

import React from 'react';
import { BookOpen, BarChart3, UserCheck, Settings, ExternalLink, RefreshCw } from 'lucide-react';
import { getGoogleSheetUrl } from '@/lib/api-client';

interface NavbarProps {
  currentTab: 'teacher' | 'admin';
  setCurrentTab: (tab: 'teacher' | 'admin') => void;
  onOpenSettings: () => void;
  onRefreshData: () => void;
  isSyncing: boolean;
  totalStudents: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenSettings,
  onRefreshData,
  isSyncing,
  totalStudents,
}) => {
  const sheetUrl = getGoogleSheetUrl();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-lg tracking-tight">หะละเกาะห์ อัลกุรอาน</span>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                  {totalStudents} นศ.
                </span>
              </div>
              <p className="text-xs text-gray-500 hidden sm:block">ระบบเช็คชื่อและติดตามผลกลุ่มศึกษาอัลกุรอาน</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setCurrentTab('teacher')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'teacher'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>อาจารย์ประจำกลุ่ม</span>
            </button>
            <button
              onClick={() => setCurrentTab('admin')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'admin'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>แดชบอร์ด แอดมิน</span>
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onRefreshData}
              disabled={isSyncing}
              title="รีเฟรชข้อมูล"
              className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
            </button>

            <a
              href={sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center space-x-1.5 text-xs text-gray-600 hover:text-emerald-700 bg-gray-50 hover:bg-emerald-50 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
              <span>Google Sheet</span>
            </a>

            <button
              onClick={onOpenSettings}
              className="flex items-center space-x-1.5 text-xs text-gray-700 hover:text-emerald-700 bg-gray-50 hover:bg-emerald-50 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-gray-500" />
              <span className="hidden sm:inline">เชื่อมต่อชีต</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
