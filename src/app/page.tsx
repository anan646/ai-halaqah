'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { LandingPageView } from '@/components/LandingPageView';
import { TeacherAttendanceView } from '@/components/TeacherAttendanceView';
import { AdminDashboardView } from '@/components/AdminDashboardView';
import { AdminLoginView } from '@/components/AdminLoginView';
import { SettingsModal } from '@/components/SettingsModal';
import { AttendanceRecord } from '@/lib/types';
import { fetchAllAttendance, getLocalAttendanceRecords, getSavedLogo, backupAllToGoogleSheet } from '@/lib/api-client';
import { getAdminSession, setAdminSession } from '@/lib/admin-auth';
import { getActiveStudents } from '@/lib/data-store';

export default function HomePage() {
  const [currentTab, setCurrentTab] = useState<'landing' | 'teacher' | 'admin'>('landing');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [customLogo, setCustomLogo] = useState<string>('');
  const [activeTeacherName, setActiveTeacherName] = useState<string>('');

  // Admin authentication state
  const [adminUser, setAdminUser] = useState<{ id: string; name: string; role: 'admin' | 'subadmin' } | null>(null);

  // Load records & logo & admin session
  const loadData = useCallback(async () => {
    setIsSyncing(true);
    setRecords(getLocalAttendanceRecords());
    setCustomLogo(getSavedLogo());
    setAdminUser(getAdminSession());

    try {
      const res = await fetchAllAttendance();
      setRecords(res.records);
    } catch (err) {
      console.error('Error fetching records:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Synchronize with Browser History & Mobile Back/Forward button
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') as 'landing' | 'teacher' | 'admin' | null;
      const teacher = params.get('teacher');

      if (tab === 'teacher') {
        setCurrentTab('teacher');
        if (teacher) setActiveTeacherName(decodeURIComponent(teacher));
      } else if (tab === 'admin') {
        setCurrentTab('admin');
      } else {
        setCurrentTab('landing');
      }
    };

    // Parse initial URL on mount if user arrived via link
    handlePopState();

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Custom navigation that pushes state to browser history
  const navigateToTab = (tab: 'landing' | 'teacher' | 'admin', teacherName?: string) => {
    setCurrentTab(tab);
    if (teacherName !== undefined) {
      setActiveTeacherName(teacherName);
    }
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      if (tab === 'teacher' && (teacherName || activeTeacherName)) {
        url.searchParams.set('teacher', teacherName || activeTeacherName);
      } else {
        url.searchParams.delete('teacher');
      }
      window.history.pushState({ tab, teacherName: teacherName || activeTeacherName }, '', url.toString());
    }
  };

  // Back navigation that honors browser history
  const handleBackNavigation = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      navigateToTab('landing');
    }
  };

  // Handle teacher selection from Landing Page
  const handleSelectTeacher = (teacherName: string) => {
    navigateToTab('teacher', teacherName);
  };

  // Handle Backup All to Google Sheet
  const handleBackupAll = async () => {
    setIsBackingUp(true);
    const res = await backupAllToGoogleSheet();
    setIsBackingUp(false);
    alert(res.message);
    if (res.success) {
      loadData();
    }
  };

  // Admin Logout
  const handleAdminLogout = () => {
    setAdminSession(null);
    setAdminUser(null);
    navigateToTab('landing');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfbfe] text-purple-950 font-sans overflow-x-hidden">
      {/* Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => navigateToTab(tab)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRefreshData={loadData}
        onBackupAll={handleBackupAll}
        isSyncing={isSyncing}
        isBackingUp={isBackingUp}
        totalStudents={getActiveStudents().length}
        customLogo={customLogo}
        isAdminLoggedIn={!!adminUser}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 pt-2 sm:pt-4 pb-32 md:pb-12">
        {currentTab === 'landing' && (
          <LandingPageView
            records={records}
            onSelectTeacher={handleSelectTeacher}
            onGoToAdmin={() => navigateToTab('admin')}
            onOpenSettings={() => setIsSettingsOpen(true)}
            customLogo={customLogo}
            onLogoUpdated={(logo) => setCustomLogo(logo)}
          />
        )}

        {currentTab === 'teacher' && (
          <TeacherAttendanceView
            records={records}
            onAttendanceSaved={loadData}
            activeTeacherName={activeTeacherName}
            onTeacherChanged={(name) => {
              setActiveTeacherName(name);
              if (typeof window !== 'undefined') {
                const url = new URL(window.location.href);
                url.searchParams.set('teacher', name);
                window.history.replaceState({ tab: 'teacher', teacherName: name }, '', url.toString());
              }
            }}
            onBackToLanding={handleBackNavigation}
          />
        )}

        {currentTab === 'admin' && (
          adminUser ? (
            <AdminDashboardView
              records={records}
              adminUser={adminUser}
              onLogout={handleAdminLogout}
              onBackToLanding={handleBackNavigation}
              customLogo={customLogo}
              onLogoUpdated={(logo) => setCustomLogo(logo)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onBackupAll={handleBackupAll}
              isBackingUp={isBackingUp}
            />
          ) : (
            <AdminLoginView
              onLoginSuccess={(user) => {
                setAdminUser(user);
                navigateToTab('admin');
              }}
              onCancel={handleBackNavigation}
              customLogo={customLogo}
            />
          )
        )}
      </main>

      {/* Settings Modal (Admin only) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={loadData}
      />

      {/* Clean Footer */}
      <footer className="border-t border-purple-100 bg-white py-4 mt-auto text-center text-xs text-purple-800/60 print:hidden hidden md:block">
        <p className="font-semibold text-purple-900">ระบบบันทึกการเช็คชื่อกลุ่มศึกษาอัลกุรอาน (หะละเกาะห์)</p>
      </footer>
    </div>
  );
}
