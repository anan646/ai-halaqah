'use client';

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Upload,
  Download,
  X,
  CheckCircle2,
  AlertTriangle,
  Users,
  Sparkles,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { ModalPortal } from './ModalPortal';
import { Student, Teacher } from '@/lib/types';
import { downloadStudentImportTemplate } from '@/lib/export-utils';

interface ExcelImportModalProps {
  isOpen: boolean;
  teachers: Teacher[];
  existingStudentIds: Set<string>;
  onClose: () => void;
  onImportSuccess: (importedStudents: Student[]) => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  teachers,
  existingStudentIds,
  onClose,
  onImportSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedStudents, setParsedStudents] = useState<Student[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDefaultTeacher, setSelectedDefaultTeacher] = useState<string>(
    teachers[0]?.name || ''
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Infer major from student ID 9 digits (digits 4-6)
  const inferMajorFromId = (sid: string): string => {
    if (sid.length >= 6) {
      const code = sid.substring(3, 6);
      if (code === '441') return 'อิสลามศึกษา';
      if (code === '442') return 'ภาษาอาหรับ';
      if (code === '443') return 'วิทยาศาสตร์ทั่วไป';
      if (code === '444') return 'เคมี';
      if (code === '445') return 'ภาษาอังกฤษ';
      if (code === '446') return 'ภาษามลายูและเทคโนโลยีการศึกษา';
      if (code === '447') return 'การศึกษาปฐมวัย';
    }
    return 'อิสลามศึกษา';
  };

  // Infer year from student ID (first 2 digits)
  const inferYearFromId = (sid: string): string => {
    if (sid.length >= 2) {
      const prefix = sid.substring(0, 2);
      if (prefix === '68') return 'ปี 1';
      if (prefix === '67') return 'ปี 2';
      if (prefix === '66') return 'ปี 3';
      if (prefix === '65') return 'ปี 4';
    }
    return 'ปี 1';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (f: File) => {
    setFile(f);
    setIsProcessing(true);
    setWarnings([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const wb = XLSX.read(buffer, { type: 'array' });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws);

        if (!rawJson || rawJson.length === 0) {
          setWarnings(['ไม่พบข้อมูลในไฟล์ Excel หรือตารางว่างเปล่า']);
          setParsedStudents([]);
          setIsProcessing(false);
          return;
        }

        const newParsed: Student[] = [];
        const warnList: string[] = [];
        const seenInFile = new Set<string>();

        rawJson.forEach((row, idx) => {
          // Normalize keys
          const keys = Object.keys(row);
          const findVal = (terms: string[]) => {
            const foundKey = keys.find((k) =>
              terms.some((t) => k.trim().toLowerCase().includes(t.toLowerCase()))
            );
            return foundKey ? String(row[foundKey]).trim() : '';
          };

          const rawId = findVal(['รหัสนักศึกษา', 'รหัส', 'studentid', 'id', 'student_id']);
          const rawName = findVal(['ชื่อ-นามสกุล', 'ชื่อ - นามสกุล', 'ชื่อ', 'fullname', 'name', 'studentname']);
          const rawGender = findVal(['เพศ', 'gender']);
          const rawYear = findVal(['ชั้นปี', 'ปี', 'yearlevel', 'year']);
          const rawMajor = findVal(['สาขาวิชา', 'สาขา', 'major']);
          const rawTeacher = findVal(['อาจารย์ผู้ดูแล', 'อาจารย์', 'ครู', 'teachername', 'teacher']);
          const rawLevel = findVal(['ระดับ', 'level', 'grouplevel']);

          // Clean ID
          const cleanId = rawId.replace(/\D/g, '');
          if (!cleanId || cleanId.length < 5) {
            // Skip rows without valid student ID
            return;
          }

          if (seenInFile.has(cleanId)) {
            warnList.push(`บรรทัด ${idx + 2}: รหัส ${cleanId} ซ้ำกันในไฟล์`);
            return;
          }
          seenInFile.add(cleanId);

          if (existingStudentIds.has(cleanId)) {
            warnList.push(`รหัส ${cleanId} (${rawName || 'ไม่ระบุชื่อ'}) มีอยู่ในระบบแล้ว (จะทำการอัปเดตข้อมูล)`);
          }

          // Clean Name
          const cleanName = rawName || `นักศึกษา ${cleanId}`;

          // Infer Gender
          let gender: 'ชาย' | 'หญิง' = 'ชาย';
          if (rawGender.includes('หญิง') || rawGender.toLowerCase() === 'female' || cleanName.startsWith('นางสาว') || cleanName.startsWith('น.ส.')) {
            gender = 'หญิง';
          } else if (cleanName.startsWith('นาย')) {
            gender = 'ชาย';
          }

          // Infer Year
          const yearLevel = rawYear || inferYearFromId(cleanId);

          // Infer Major
          const major = rawMajor || inferMajorFromId(cleanId);

          // Match Teacher
          let matchedTeacher = teachers.find(
            (t) => t.name.toLowerCase() === rawTeacher.toLowerCase() || t.groupName === rawTeacher
          );
          if (!matchedTeacher) {
            matchedTeacher = teachers.find((t) => t.name === selectedDefaultTeacher) || teachers[0];
          }

          // Clean Level
          let level: '01' | '02' | '03' = '01';
          if (rawLevel === '02' || rawLevel.includes('02') || rawLevel.includes('2')) level = '02';
          else if (rawLevel === '03' || rawLevel.includes('03') || rawLevel.includes('3')) level = '03';

          newParsed.push({
            studentId: cleanId,
            fullName: cleanName,
            gender,
            yearLevel,
            major,
            teacherName: matchedTeacher?.name || selectedDefaultTeacher,
            groupName: matchedTeacher?.groupName || 'กลุ่มหะละเกาะห์',
            groupId: matchedTeacher?.groupId || '',
            level,
          });
        });

        setParsedStudents(newParsed);
        setWarnings(warnList);
      } catch (err) {
        console.error('Error parsing excel:', err);
        setWarnings(['เกิดข้อผิดพลาดในการอ่านไฟล์ กรุณาตรวจสอบว่าเป็นไฟล์ Excel (.xlsx) ที่ถูกต้อง']);
        setParsedStudents([]);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(f);
  };

  const handleConfirmSave = () => {
    if (parsedStudents.length === 0) return;
    onImportSuccess(parsedStudents);
    onClose();
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-white rounded-3xl p-5 sm:p-7 w-full max-w-3xl border border-purple-200 shadow-2xl space-y-5 my-auto relative max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-purple-100 pb-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base sm:text-lg text-purple-950">
                  นำเข้าข้อมูลนักศึกษาผ่านไฟล์ Excel (.xlsx)
                </h3>
                <p className="text-xs text-purple-700/80">
                  อัปโหลดไฟล์ตารางนักศึกษาเข้าสู่ฐานข้อมูลระบบหะละเกาะห์
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-y-auto space-y-4 flex-1 pr-1 text-xs">
            {/* Step 1: Template Download Banner */}
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="font-extrabold text-purple-950 flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-4 h-4 text-purple-700" />
                  <span>ยังไม่มีไฟล์เทมเพลตสำหรับกรอก?</span>
                </div>
                <p className="text-[11px] text-purple-800/80">
                  ดาวน์โหลดไฟล์เทมเพลตมาตรฐาน (มีเฉพาะหัวตาราง 7 ช่องตามกำหนด ไม่มีข้อมูลค้าง)
                </p>
              </div>

              <button
                type="button"
                onClick={() => downloadStudentImportTemplate()}
                className="px-4 py-2 bg-white hover:bg-purple-100 text-purple-950 border border-purple-300 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 active:scale-95 shrink-0"
              >
                <Download className="w-4 h-4 text-purple-700" />
                <span>ดาวน์โหลดเทมเพลต Excel</span>
              </button>
            </div>

            {/* Target Teacher Assign Selector */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-700" />
                  <span>กำหนดอาจารย์ผู้ดูแลกลุ่มสำหรับนักศึกษาใหม่:</span>
                </span>
                <p className="text-[11px] text-indigo-800/80">
                  หากในไฟล์ไม่ได้ระบุชื่ออาจารย์ หรือต้องการกำหนดให้ทุกคนอยู่ในกลุ่มเดียวกัน
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedDefaultTeacher}
                  onChange={(e) => {
                    const chosen = e.target.value;
                    setSelectedDefaultTeacher(chosen);
                    if (parsedStudents.length > 0) {
                      const tObj = teachers.find((t) => t.name === chosen);
                      setParsedStudents((prev) =>
                        prev.map((s) => ({
                          ...s,
                          teacherName: chosen,
                          groupName: tObj?.groupName || s.groupName,
                          groupId: tObj?.groupId || s.groupId,
                        }))
                      );
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl border border-indigo-300 bg-white text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-xs"
                >
                  {teachers.map((t) => (
                    <option key={t.groupId} value={t.name}>
                      {t.name} ({t.groupName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 2: Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const droppedFile = e.dataTransfer.files[0];
                if (droppedFile) processFile(droppedFile);
              }}
              className="border-2 border-dashed border-purple-300 hover:border-purple-600 bg-purple-50/30 hover:bg-purple-50/60 p-6 rounded-2xl text-center cursor-pointer transition-all space-y-2"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6" />
              </div>
              <div className="font-extrabold text-sm text-purple-950">
                {file ? file.name : 'คลิกเพื่อเลือกไฟล์ หรือลากไฟล์ Excel (.xlsx) มาวางที่นี่'}
              </div>
              <p className="text-[11px] text-purple-700/70">
                รองรับไฟล์นามสกุล .xlsx, .xls หรือ .csv
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Warnings / Feedback */}
            {warnings.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-xs text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>ข้อสังเกตจากไฟล์ ({warnings.length} รายการ):</span>
                </div>
                <div className="max-h-24 overflow-y-auto space-y-0.5 text-[11px] text-amber-900/90 pl-5 list-disc">
                  {warnings.slice(0, 5).map((w, i) => (
                    <div key={i}>• {w}</div>
                  ))}
                  {warnings.length > 5 && (
                    <div>... และอื่นๆ อีก {warnings.length - 5} รายการ</div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Parsed Students Preview Table */}
            {parsedStudents.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-xs sm:text-sm text-purple-950 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>ตรวจพบข้อมูลนักศึกษาพร้อมนำเข้า: {parsedStudents.length} คน</span>
                  </h4>
                  <span className="text-[10px] text-purple-700 font-mono">
                    ตัวอย่าง 10 แถวแรก
                  </span>
                </div>

                <div className="overflow-x-auto border border-purple-200 rounded-2xl max-h-56">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-purple-100 text-purple-950 font-black border-b border-purple-200 sticky top-0">
                        <th className="py-2 px-3">รหัส</th>
                        <th className="py-2 px-3">ชื่อ-นามสกุล</th>
                        <th className="py-2 px-3">สาขาวิชา</th>
                        <th className="py-2 px-3 text-center">เพศ</th>
                        <th className="py-2 px-3 text-center">ชั้นปี</th>
                        <th className="py-2 px-3">อาจารย์ผู้ดูแล</th>
                        <th className="py-2 px-3 text-center">ระดับ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-100 bg-white">
                      {parsedStudents.slice(0, 15).map((st) => (
                        <tr key={st.studentId} className="hover:bg-purple-50/50">
                          <td className="py-1.5 px-3 font-mono font-bold text-purple-900">
                            {st.studentId}
                          </td>
                          <td className="py-1.5 px-3 font-bold text-purple-950">
                            {st.fullName}
                          </td>
                          <td className="py-1.5 px-3 text-purple-800">{st.major}</td>
                          <td className="py-1.5 px-3 text-center">{st.gender}</td>
                          <td className="py-1.5 px-3 text-center font-medium">{st.yearLevel}</td>
                          <td className="py-1.5 px-3 text-purple-900 font-medium">
                            {st.teacherName}
                          </td>
                          <td className="py-1.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                              ระดับ {st.level || '01'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-purple-100 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-all"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              disabled={parsedStudents.length === 0 || isProcessing}
              onClick={handleConfirmSave}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isProcessing
                  ? 'กำลังอ่านไฟล์...'
                  : `ยืนยันบันทึกนักศึกษา ${parsedStudents.length} คน เข้าสู่ฐานข้อมูล`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
