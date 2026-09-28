'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { LandingPageView } from '@/components/LandingPageView';
import { TeacherAttendanceView } from '@/components/TeacherAttendanceView';
import { AdminDashboardView } from '@/components/AdminDashboardView';
import { SettingsModal } from '@/components/SettingsModal';
import { AttendanceRecord } from '@/lib/types';
import { fetchAllAttendance, getLocalAttendanceRecords, getSavedLogo, setSavedLogo, backupAllToGoogleSheet } from '@/lib/api-client';
import { INITIAL_STUDENTS } from '@/lib/students-data';

export default function HomePage() {
  // Default to 'landing' as requested: เข้ามาแล้วเจอหน้า Landing Page ก่อน
  const [currentTab, setCurrentTab] = useState<'landing' | 'teacher' | 'admin'>('landing');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [customLogo, setCustomLogo] = useState<string>('');
  const [activeTeacherName, setActiveTeacherName] = useState<string>('');

  // Load records & logo
  const loadData = useCallback(async () => {
    setIsSyncing(true);
    setRecords(getLocalAttendanceRecords());
    setCustomLogo(getSavedLogo());

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

  const handleLogoUpdated = (newLogo: string) => {
    setCustomLogo(newLogo);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcff] text-purple-950 font-sans">
      {/* Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRefreshData={loadData}
        onBackupAll={handleBackupAll}
        isSyncing={isSyncing}
        isBackingUp={isBackingUp}
        totalStudents={INITIAL_STUDENTS.length}
        customLogo={customLogo}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {currentTab === 'landing' && (
          <LandingPageView
            onSelectTeacher={handleSelectTeacher}
            onGoToAdmin={() => setCurrentTab('admin')}
            onOpenSettings={() => setIsSettingsOpen(true)}
            customLogo={customLogo}
            onLogoUpdated={handleLogoUpdated}
          />
        )}

        {currentTab === 'teacher' && (
          <TeacherAttendanceView
            records={records}
            onAttendanceSaved={loadData}
            activeTeacherName={activeTeacherName}
            onTeacherChanged={setActiveTeacherName}
          />
        )}

        {currentTab === 'admin' && (
          <AdminDashboardView
            records={records}
          />
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={loadData}
      />

      {/* Footer */}
      <footer className="border-t border-purple-100 bg-white py-6 mt-auto text-center text-xs text-purple-800/60 print:hidden">
        <p className="font-semibold text-purple-900">ระบบบันทึกการเช็คชื่อกลุ่มศึกษาอัลกุรอาน (หะละเกาะห์) • ธีมสีม่วงสบายตา</p>
        <p className="mt-1 text-purple-700/50">เชื่อมต่อ Google Sheet • สำรองข้อมูลได้ทุกที่ทุกเวลา</p>
      </footer>
    </div>
  );
}
