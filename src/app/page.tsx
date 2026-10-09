'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { LandingPageView } from '@/components/LandingPageView';
import { TeacherAttendanceView } from '@/components/TeacherAttendanceView';
import { AdminDashboardView } from '@/components/AdminDashboardView';
import { AdminLoginView } from '@/components/AdminLoginView';
import { SettingsModal } from '@/components/SettingsModal';
import { OnboardingTutorialModal } from '@/components/OnboardingTutorialModal';
import { AttendanceRecord } from '@/lib/types';
import {
  fetchAllAttendance,
  getLocalAttendanceRecords,
  getSavedLogo,
  backupAllToGoogleSheet,
  applyPublicDataToLocal,
  fetchAllFeedbacks,
} from '@/lib/api-client';
import { getAdminSession, setAdminSession } from '@/lib/admin-auth';
import { getActiveStudents } from '@/lib/data-store';
import { PublicPendingReportPage } from '@/components/PendingReport';
import { PwaInstallPrompt, usePwaRegister } from '@/components/PwaInstall';
import { decodeSnapshot, PendingSnapshot } from '@/lib/pending-report';

const TUTORIAL_DISMISSED_KEY = 'halaqah_tutorial_never_show_v1';

export default function HomePage() {
  const [currentTab, setCurrentTab] = useState<'landing' | 'teacher' | 'admin'>('landing');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [dataVersion, setDataVersion] = useState(0);
  usePwaRegister();
  const idleRef = useRef(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [customLogo, setCustomLogo] = useState<string>('');
  const [activeTeacherName, setActiveTeacherName] = useState<string>('');
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialRole, setTutorialRole] = useState<'student' | 'faculty'>('student');
  // ลิงก์รายงานสาธารณะ (?view=pending-report&d=...) เปิดได้โดยไม่ต้องล็อกอิน
  const [publicReport, setPublicReport] = useState<{ snap: PendingSnapshot | null } | null>(null);
  const [landingPortalView, setLandingPortalView] = useState<'select' | 'student' | 'faculty'>('select');

  // Tutorial buttons are only active and visible when user is in student view or faculty/teacher view
  const isTutorialVisible =
    (currentTab === 'landing' && (landingPortalView === 'student' || landingPortalView === 'faculty')) ||
    currentTab === 'teacher';

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
      const determinedRole =
        currentTab === 'teacher' || landingPortalView === 'faculty' ? 'faculty' : 'student';
      setTutorialRole(determinedRole);
    }
    setIsTutorialOpen(true);
  };

  // Admin authentication state
  const [adminUser, setAdminUser] = useState<{ id: string; name: string; role: 'admin' | 'subadmin' } | null>(null);

  // Load records & logo & admin session (supports silent background sync)
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsSyncing(true);
    setRecords(getLocalAttendanceRecords());
    setCustomLogo(getSavedLogo());
    setAdminUser(getAdminSession());

    // ซิงค์ข้อมูลสาธารณะ (รหัสผ่านอาจารย์, ประกาศ, รายชื่ออาจารย์/นศ., ภาคเรียน) จาก Google Sheet
    applyPublicDataToLocal().catch(() => null);

    try {
      const res = await fetchAllAttendance();
      if (res && res.records && res.records.length > 0) {
        setRecords(res.records);
      }
    } catch (err) {
      console.error('Error fetching records:', err);
    }

    // ซิงค์ข้อเสนอแนะจาก Google Sheet (รวมข้อเสนอแนะจากสมาร์ทโฟนของทุกคน)
    fetchAllFeedbacks().catch((err) => {
      console.warn('Error fetching feedbacks:', err);
    });

    if (!silent) setIsSyncing(false);
  }, []);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // ระบบเชื่อมโยงข้อมูลแบบเรียลไทม์ (Real-time PWA Sync):
  // 1. ซิงค์ทันทีเมื่อสลับกลับมาที่แอป (focus)
  // 2. ซิงค์เมื่อเปิดหน้าจอหรือปลดล็อกมือถือ (visibilitychange)
  // 3. ซิงค์เมื่อเชื่อมต่อเน็ตสำเร็จ (online)
  // 4. Heartbeat ซิงค์ข้อมูลเบื้องหลังอัตโนมัติทุก 30 วินาที (แบบ silent ไม่รบกวนหน้าจอ)
  useEffect(() => {
    const handleSync = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible' && navigator.onLine) {
        loadData(true);
      }
    };

    window.addEventListener('focus', handleSync);
    document.addEventListener('visibilitychange', handleSync);
    window.addEventListener('online', handleSync);

    const interval = setInterval(handleSync, 30000);

    return () => {
      window.removeEventListener('focus', handleSync);
      document.removeEventListener('visibilitychange', handleSync);
      window.removeEventListener('online', handleSync);
      clearInterval(interval);
    };
  }, [loadData]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'pending-report') {
      const d = params.get('d');
      setPublicReport({ snap: d ? decodeSnapshot(d) : null });
    }
  }, []);

  useEffect(() => {
    idleRef.current = currentTab === 'landing' && landingPortalView === 'select';
  }, [currentTab, landingPortalView]);

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
    setLandingPortalView('select');
    navigateToTab('landing');
  };

  // Admin Logout
  const handleAdminLogout = () => {
    setAdminSession(null);
    setAdminUser(null);
    handleGoToLandingHome();
  };

  if (publicReport) {
    return (
      <PublicPendingReportPage
        snap={publicReport.snap}
        onGoHome={() => {
          window.location.href = window.location.pathname;
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfbfe] text-purple-950 font-sans overflow-x-hidden">
      {/* Navigation (Hidden in Admin Dashboard view to prevent overlapping with Admin Sidebar & Header) */}
      {!(currentTab === 'admin' && adminUser) && (
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
          onOpenTutorial={isTutorialVisible ? () => handleOpenGeneralTutorial() : undefined}
        />
      )}

      {/* Main Content Area: full-bleed for Admin Dashboard, centered container for Portal & Teacher views */}
      <main
        className={`flex-1 w-full ${
          currentTab === 'admin' && adminUser
            ? 'p-0 m-0 max-w-none'
            : 'max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 pt-2 sm:pt-4 pb-32 md:pb-12'
        }`}
      >
        {currentTab === 'landing' && (
          <LandingPageView
            key="landing-portal"
            records={records}
            landingResetSignal={landingResetSignal}
            onSelectTeacher={handleSelectTeacher}
            onGoToAdmin={() => navigateToTab('admin')}
            onOpenSettings={() => setIsSettingsOpen(true)}
            customLogo={customLogo}
            onLogoUpdated={(logo) => setCustomLogo(logo)}
            onOpenTutorial={() => handleOpenGeneralTutorial()}
            onPortalViewChange={(view) => setLandingPortalView(view)}
          />
        )}

        {currentTab === 'teacher' && (
          <TeacherAttendanceView
            key="teacher-attendance"
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

      {/* Onboarding Tutorial Step-by-Step Modal */}
      <OnboardingTutorialModal
        isOpen={isTutorialOpen}
        role={tutorialRole}
        onClose={() => setIsTutorialOpen(false)}
        onDismissForever={handleDismissTutorialForever}
      />

      {/* ชวนติดตั้งแอป (แสดงที่หน้าแรกเท่านั้น) */}
      {currentTab === 'landing' && landingPortalView === 'select' && <PwaInstallPrompt />}

      {/* Clean Footer */}
      <footer className="border-t border-purple-100 bg-white py-4 mt-auto text-center text-xs text-purple-800/60 print:hidden hidden md:block">
        <p className="font-semibold text-purple-900">ระบบบันทึกการเช็คชื่อกลุ่มศึกษาอัลกุรอาน (หะละเกาะห์)</p>
      </footer>
    </div>
  );
}
