'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { TeacherAttendanceView } from '@/components/TeacherAttendanceView';
import { AdminDashboardView } from '@/components/AdminDashboardView';
import { SettingsModal } from '@/components/SettingsModal';
import { AttendanceRecord } from '@/lib/types';
import { fetchAllAttendance, getLocalAttendanceRecords } from '@/lib/api-client';
import { INITIAL_STUDENTS } from '@/lib/students-data';

export default function HomePage() {
  const [currentTab, setCurrentTab] = useState<'teacher' | 'admin'>('teacher');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load records
  const loadData = useCallback(async () => {
    setIsSyncing(true);
    // Instant local load first
    setRecords(getLocalAttendanceRecords());

    // Try remote sync
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRefreshData={loadData}
        isSyncing={isSyncing}
        totalStudents={INITIAL_STUDENTS.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentTab === 'teacher' ? (
          <TeacherAttendanceView
            records={records}
            onAttendanceSaved={loadData}
          />
        ) : (
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
      <footer className="border-t border-gray-200 bg-white py-6 mt-auto text-center text-xs text-gray-500 print:hidden">
        <p>ระบบบันทึกการเช็คชื่อกลุ่มศึกษาอัลกุรอาน (หะละเกาะห์) • เชื่อมต่อ Google Sheet</p>
        <p className="mt-1 text-gray-400">พัฒนาสำหรับอาจารย์และผู้ดูแลระบบ • รองรับ GitHub & Vercel</p>
      </footer>
    </div>
  );
}
