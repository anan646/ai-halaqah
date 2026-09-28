'use client';

import React, { useState, useEffect } from 'react';
import { X, Copy, Check, ExternalLink, Database, Sparkles, CloudUpload, CheckCircle2, AlertCircle } from 'lucide-react';
import { GOOGLE_APPS_SCRIPT_CODE } from '@/lib/google-apps-script-template';
import { getGoogleSheetUrl, getSavedScriptUrl, setSavedScriptUrl, backupAllToGoogleSheet, getLastBackupTime } from '@/lib/api-client';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [scriptUrl, setScriptUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [backupResult, setBackupResult] = useState<{ success: boolean; message: string } | null>(null);
  const [lastBackup, setLastBackup] = useState('');

  useEffect(() => {
    if (isOpen) {
      setScriptUrl(getSavedScriptUrl());
      setTestResult(null);
      setBackupResult(null);
      setLastBackup(getLastBackupTime());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = GOOGLE_APPS_SCRIPT_CODE;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSave = () => {
    setSavedScriptUrl(scriptUrl);
    onSaved();
    onClose();
  };

  const handleTestConnection = async () => {
    if (!scriptUrl.trim()) {
      setTestResult({ success: false, message: 'กรุณากรอก Web App URL ก่อนทดสอบ' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`${scriptUrl.trim()}?action=getStats`, { method: 'GET' });
      const data = await res.json();
      setTesting(false);
      if (data && data.success) {
        setTestResult({ success: true, message: 'เชื่อมต่อสำเร็จ! Google Sheet พร้อมรับส่งข้อมูล' });
      } else {
        setTestResult({ success: false, message: `การตอบกลับ: ${data?.message || 'ไม่สำเร็จ'}` });
      }
    } catch (e: any) {
      setTesting(false);
      setTestResult({ success: false, message: `ไม่สามารถเชื่อมต่อได้: ${e.message || e}` });
    }
  };

  const handleBackupAll = async () => {
    setSavedScriptUrl(scriptUrl);
    setBackingUp(true);
    setBackupResult(null);
    const res = await backupAllToGoogleSheet();
    setBackingUp(false);
    setBackupResult(res);
    if (res.success) {
      setLastBackup(getLastBackupTime());
    }
  };

  const sheetUrl = getGoogleSheetUrl();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-purple-100">
        {/* Header */}
        <div className="p-6 border-b border-purple-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-purple-950">ตั้งค่าการเชื่อมต่อ Google Sheet</h3>
              <p className="text-xs text-purple-800/60">ฐานข้อมูลของระบบกลุ่มศึกษาอัลกุรอาน</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-purple-400 hover:text-purple-700 rounded-xl hover:bg-purple-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Linked Google Sheet info */}
          <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200/80 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-purple-900">Google Sheet ที่ใช้งาน</div>
              <p className="text-xs text-purple-700/80 mt-0.5 truncate max-w-md font-mono">
                {sheetUrl}
              </p>
            </div>
            <a
              href={sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 bg-white px-3 py-1.5 rounded-xl border border-purple-200 shadow-sm"
            >
              <span>เปิดดูชีต</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Web App URL field */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-purple-950">
              Google Apps Script Web App URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={scriptUrl}
                onChange={(e) => setScriptUrl(e.target.value)}
                className="flex-1 px-4 py-2.5 text-xs font-mono border border-purple-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-purple-50/40 text-purple-950"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="px-4 py-2.5 bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-xs rounded-2xl transition-colors whitespace-nowrap disabled:opacity-50"
              >
                {testing ? 'กำลังทดสอบ...' : 'ทดสอบ'}
              </button>
            </div>
            {testResult && (
              <p className={`text-xs mt-1 font-semibold ${testResult.success ? 'text-emerald-600' : 'text-rose-600'}`}>
                {testResult.message}
              </p>
            )}
          </div>

          {/* Backup All Button Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                <CloudUpload className="w-4 h-4 text-purple-700" />
                <span>สำรองข้อมูลทั้งหมดขึ้น Google Sheet</span>
              </div>
              <p className="text-[11px] text-purple-800/70 mt-0.5">
                ส่งรายชื่อนักศึกษา 514 คน, อาจารย์ 40 ท่าน, ประวัติเช็คชื่อ และโลโก้ไปยัง Google Sheet ทันที
              </p>
              {lastBackup && (
                <p className="text-[10px] text-purple-600 font-medium mt-1">
                  สำรองล่าสุดเมื่อ: {lastBackup}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleBackupAll}
              disabled={backingUp}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white font-bold text-xs rounded-xl shadow-md transition-all whitespace-nowrap disabled:opacity-50"
            >
              {backingUp ? 'กำลังสำรองข้อมูล...' : 'สำรองขึ้น Google Sheet ทันที'}
            </button>
          </div>
          {backupResult && (
            <p className={`text-xs font-semibold ${backupResult.success ? 'text-emerald-700' : 'text-rose-700'}`}>
              {backupResult.message}
            </p>
          )}

          {/* Step-by-step Setup Guide */}
          <div className="bg-purple-50/50 rounded-2xl p-5 border border-purple-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-purple-950">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>วิธีติดตั้ง Google Apps Script ใน Google Sheet (ทำเพียง 1 นาที)</span>
              </div>
              <button
                onClick={handleCopyCode}
                className={`flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-xl font-bold transition-all ${
                  copied
                    ? 'bg-purple-700 text-white shadow-sm'
                    : 'bg-purple-200 text-purple-900 hover:bg-purple-300'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ดสคริปต์'}</span>
              </button>
            </div>

            <ol className="text-xs text-purple-900/80 space-y-2 list-decimal list-inside leading-relaxed">
              <li>
                เปิด Google Sheet แล้วไปที่เมนู <strong>ส่วนขยาย (Extensions) &gt; Apps Script</strong>
              </li>
              <li>
                ลบโค้ดเดิมออกทั้งหมด แล้วกดปุ่ม <strong>คัดลอกโค้ดสคริปต์</strong> ด้านบนนี้ไปวาง
              </li>
              <li>กดบันทึก (Ctrl + S หรือรูปแผ่นดิสก์)</li>
              <li>
                กดปุ่ม <strong>ทำให้ใช้งานได้ (Deploy) &gt; การทำให้ใช้งานได้รายการใหม่ (New deployment)</strong>
              </li>
              <li>
                เลือกประเภท <strong>เว็บแอป (Web app)</strong> โดยตั้งค่า:
                <ul className="list-disc list-inside ml-4 mt-1 text-purple-800 font-semibold">
                  <li>คำอธิบาย: Halaqah Quran API v2</li>
                  <li>ดำเนินการในฐานะ: <strong>ตัวฉันเอง (Me)</strong></li>
                  <li>ใครมีสิทธิ์เข้าถึง: <strong className="text-purple-700 underline">ทุกคน (Anyone)</strong> (สำคัญมาก)</li>
                </ul>
              </li>
              <li>กด <strong>ทำให้ใช้งานได้ (Deploy)</strong> แล้วคัดลอก Web App URL มาใส่ในช่องด้านบน</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-purple-100 flex items-center justify-end space-x-3 bg-purple-50/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-purple-700 hover:text-purple-950 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white font-bold text-xs rounded-2xl shadow-md transition-all"
          >
            บันทึกการตั้งค่า
          </button>
        </div>
      </div>
    </div>
  );
};
