'use client';

import React, { useState, useEffect } from 'react';
import { X, Copy, Check, ExternalLink, Database, Sparkles, Key, Info } from 'lucide-react';
import { GOOGLE_APPS_SCRIPT_CODE } from '@/lib/google-apps-script-template';
import { getGoogleSheetUrl, getSavedScriptUrl, setSavedScriptUrl } from '@/lib/api-client';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [scriptUrl, setScriptUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setScriptUrl(getSavedScriptUrl());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
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
        setTestResult({ success: true, message: `เชื่อมต่อสำเร็จ! พบข้อมูลใน Google Sheet แล้ว` });
      } else {
        setTestResult({ success: false, message: `การตอบกลับผิดพลาด: ${data?.message || 'ไม่สำเร็จ'}` });
      }
    } catch (e: any) {
      setTesting(false);
      setTestResult({ success: false, message: `ไม่สามารถเชื่อมต่อได้: ${e.message || e}` });
    }
  };

  const sheetUrl = getGoogleSheetUrl();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">ตั้งค่าการเชื่อมต่อ Google Sheet</h3>
              <p className="text-xs text-gray-500">ฐานข้อมูลของระบบกลุ่มศึกษาอัลกุรอาน</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Linked Google Sheet info */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-emerald-800">Google Sheet ที่ใช้งาน</div>
              <p className="text-xs text-gray-600 mt-0.5 truncate max-w-md font-mono">
                {sheetUrl}
              </p>
            </div>
            <a
              href={sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-white px-3 py-1.5 rounded-lg border border-emerald-200 shadow-sm"
            >
              <span>เปิดชีต</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Web App URL field */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700">
              Google Apps Script Web App URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={scriptUrl}
                onChange={(e) => setScriptUrl(e.target.value)}
                className="flex-1 px-4 py-2.5 text-xs font-mono border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors whitespace-nowrap disabled:opacity-50"
              >
                {testing ? 'กำลังทดสอบ...' : 'ทดสอบ'}
              </button>
            </div>
            {testResult && (
              <p className={`text-xs mt-1 font-medium ${testResult.success ? 'text-emerald-600' : 'text-rose-600'}`}>
                {testResult.message}
              </p>
            )}
            <p className="text-[11px] text-gray-400">
              * หากยังไม่ได้ใส่ URL ระบบจะบันทึกข้อมูลในเครื่อง (LocalStorage) ให้อัตโนมัติและสามารถใช้งานได้ทันที
            </p>
          </div>

          {/* Step-by-step Setup Guide */}
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-gray-800">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>วิธีติดตั้ง Google Apps Script ใน Google Sheet (ทำเพียง 1 นาที)</span>
              </div>
              <button
                onClick={handleCopyCode}
                className={`flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'คัดลอกโค้ดแล้ว!' : 'คัดลอกโค้ดสคริปต์'}</span>
              </button>
            </div>

            <ol className="text-xs text-gray-600 space-y-2 list-decimal list-inside leading-relaxed">
              <li>
                เปิด Google Sheet แล้วไปที่เมนู <strong>ส่วนขยาย (Extensions) &gt; Apps Script</strong>
              </li>
              <li>
                ลบโค้ดเดิมออกทั้งหมด แล้วกด <strong>คัดลอกโค้ดสคริปต์</strong> ด้านบนนี้ไปวาง
              </li>
              <li>กดปุ่มบันทึก (Ctrl + S หรือรูปแผ่นดิสก์)</li>
              <li>
                กดปุ่ม <strong>ทำให้ใช้งานได้ (Deploy) &gt; การทำให้ใช้งานได้รายการใหม่ (New deployment)</strong>
              </li>
              <li>
                เลือกประเภท <strong>เว็บแอป (Web app)</strong> โดยตั้งค่า:
                <ul className="list-disc list-inside ml-4 mt-1 text-gray-500 font-medium">
                  <li>คำอธิบาย: Halaqah API</li>
                  <li>ดำเนินการในฐานะ: <strong>ตัวฉันเอง (Me)</strong></li>
                  <li>ใครมีสิทธิ์เข้าถึง: <strong className="text-emerald-700">ทุกคน (Anyone)</strong> (สำคัญมาก)</li>
                </ul>
              </li>
              <li>กด <strong>ทำให้ใช้งานได้ (Deploy)</strong> แล้วคัดลอก Web App URL มาวางในช่องด้านบน</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex items-center justify-end space-x-3 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all"
          >
            บันทึกการตั้งค่า
          </button>
        </div>
      </div>
    </div>
  );
};
