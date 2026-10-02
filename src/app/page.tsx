'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { LandingPageView } from '@/components/LandingPageView';
import { TeacherAttendanceView } from '@/components/TeacherAttendanceView';
import { AdminDashboardView } from '@/components/AdminDashboardView';
import { AdminLoginView } from '@/components/AdminLoginView';
import { SettingsModal } from '@/components/SettingsModal';
import { OnboardingTutorialModal } from '@/components/OnboardingTutorialModal';
import { AttendanceRecord } from '@/lib/types';
import { fetchAllAttendance, getLocalAttendanceRecords, getSavedLogo, backupAllToGoogleSheet } from '@/lib/api-client';
import { getAdminSession, setAdminSession } from '@/lib/admin-auth';
import { getActiveStudents } from '@/lib/data-store';
import { HelpCircle } from 'lucide-react';

const TUTORIAL_DISMISSED_KEY = 'halaqah_tutorial_never_show_v1';

export default function HomePage() {
  const [currentTab, setCurrentTab] = useState<'landing' | 'teacher' | 'admin'>('landing');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [customLogo, setCustomLogo] = useState<string>('');
  const [activeTeacherName, setActiveTeacherName] = useState<string>('');
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialRole, setTutorialRole] = useState<'student' | 'faculty'>('student');

  const handleDismissTutorialForever = () => {
    if (typeof window !== 'undefined') {
      const key = tutorialRole === 'student' ? 'halaqah_tutorial_student_dismissed_v1' : 'halaqah_tutorial_faculty_dismissed_v1';
      localStorage.setItem(key, 'true');
    }
    setIsTutorialOpen(false);
  };

  const handleOpenGeneralTutorial = (role?: 'student' | 'faculty') => {
    if (role) {
      setTutorialRole(role);
    } else {
      setTutorialRole(currentTab === 'teacher' ? 'faculty' : 'student');
    }
    setIsTutorialOpen(true);
  };

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

  const [landingResetSignal, setLandingResetSignal] = useState(0);

  const handleGoToLandingHome = () => {
    setLandingResetSignal((prev) => prev + 1);
    navigateToTab('landing');
  };

  // Admin Logout
  const handleAdminLogout = () => {
    setAdminSession(null);
    setAdminUser(null);
    handleGoToLandingHome();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfbfe] text-purple-950 font-sans overflow-x-hidden">
      {/* Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => (tab === 'landing' ? handleGoToLandingHome() : navigateToTab(tab))}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRefreshData={loadData}
        onBackupAll={handleBackupAll}
        isSyncing={isSyncing}
        isBackingUp={isBackingUp}
        totalStudents={getActiveStudents().length}
        customLogo={customLogo}
        isAdminLoggedIn={!!adminUser}
        onOpenTutorial={() => handleOpenGeneralTutorial()}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 pt-2 sm:pt-4 pb-32 md:pb-12">
        {currentTab === 'landing' && (
          <LandingPageView
            records={records}
            landingResetSignal={landingResetSignal}
            onSelectTeacher={handleSelectTeacher}
            onGoToAdmin={() => navigateToTab('admin')}
            onOpenSettings={() => setIsSettingsOpen(true)}
            customLogo={customLogo}
            onLogoUpdated={(logo) => setCustomLogo(logo)}
            onOpenTutorial={() => handleOpenGeneralTutorial('student')}
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
            onOpenTutorial={() => handleOpenGeneralTutorial('faculty')}
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

      {/* Floating Tutorial / Help Button (เปิดดูคู่มือซ้ำได้ตลอดเวลา) */}
      <div className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-30 print:hidden animate-fadeIn">
        <button
          type="button"
          onClick={() => handleOpenGeneralTutorial()}
          className="group flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-white/95 hover:bg-white text-purple-950 font-extrabold text-xs rounded-full border border-purple-200/90 shadow-[0_8px_25px_rgba(107,33,168,0.18)] hover:shadow-[0_12px_30px_rgba(107,33,168,0.28)] backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95"
          title="สอนการใช้งานระบบ"
        >
          <div className="w-6 h-6 rounded-full bg-purple-100 group-hover:bg-purple-800 text-purple-700 group-hover:text-white flex items-center justify-center transition-colors">
            <HelpCircle className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold">สอนการใช้งาน</span>
        </button>
      </div>

      {/* Onboarding Tutorial Step-by-Step Modal */}
      <OnboardingTutorialModal
        isOpen={isTutorialOpen}
        role={tutorialRole}
        onClose={() => setIsTutorialOpen(false)}
        onDismissForever={handleDismissTutorialForever}
      />

      {/* Clean Footer */}
      <footer className="border-t border-purple-100 bg-white py-4 mt-auto text-center text-xs text-purple-800/60 print:hidden hidden md:block">
        <p className="font-semibold text-purple-900">ระบบบันทึกการเช็คชื่อกลุ่มศึกษาอัลกุรอาน (หะละเกาะห์)</p>
      </footer>
    </div>
  );
}
