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

  // Handle teacher selection from Landing Page
  const handleSelectTeacher = (teacherName: string) => {
    setActiveTeacherName(teacherName);
    setCurrentTab('teacher');
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
    setCurrentTab('landing');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfbfe] text-purple-950 font-sans overflow-x-hidden">
      {/* Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
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
      <main className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 pt-3 sm:pt-4">
        {currentTab === 'landing' && (
          <LandingPageView
            onSelectTeacher={handleSelectTeacher}
            onGoToAdmin={() => setCurrentTab('admin')}
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
            onTeacherChanged={setActiveTeacherName}
            onBackToLanding={() => setCurrentTab('landing')}
          />
        )}

        {currentTab === 'admin' && (
          adminUser ? (
            <AdminDashboardView
              records={records}
              adminUser={adminUser}
              onLogout={handleAdminLogout}
              onBackToLanding={() => setCurrentTab('landing')}
            />
          ) : (
            <AdminLoginView
              onLoginSuccess={(user) => setAdminUser(user)}
              onCancel={() => setCurrentTab('landing')}
              customLogo={customLogo}
            />
          )
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={loadData}
      />

      {/* Clean Footer (Removed requested slogans) */}
      <footer className="border-t border-purple-100 bg-white py-4 mt-auto text-center text-xs text-purple-800/60 print:hidden">
        <p className="font-semibold text-purple-900">ระบบบันทึกการเช็คชื่อกลุ่มศึกษาอัลกุรอาน (หะละเกาะห์)</p>
      </footer>
    </div>
  );
}
