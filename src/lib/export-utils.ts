import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, WidthType, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { AttendanceRecord, TeacherSummary, StudentSummary } from './types';

// ======================== EXCEL EXPORT (.XLSX) ========================
export function exportToExcel(
  records: AttendanceRecord[],
  teacherSummaries: TeacherSummary[],
  studentSummaries: StudentSummary[],
  filterTitle: string = 'รายงานภาพรวม'
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: สรุปภาพรวมและสถิติรายกลุ่ม (Overview & Teachers)
  const teacherRows = teacherSummaries.map((t, i) => ({
    'ลำดับ': i + 1,
    'อาจารย์ผู้รับผิดชอบ': t.teacherName,
    'กลุ่ม': t.groupName,
    'ชั้นปี': t.yearLevel,
    'เพศ': t.gender,
    'จำนวนนักศึกษา (คน)': t.studentCount,
    'จำนวนครั้งที่เช็ค (วัน)': t.checkedDatesCount,
    'มา (คน-ครั้ง)': t.totalPresent,
    'ขาด (คน-ครั้ง)': t.totalAbsent,
    'ลา (คน-ครั้ง)': t.totalLeave,
    'อัตราการเข้าร่วม (%)': `${t.overallRate.toFixed(1)}%`,
    'สถานะกลุ่ม': t.checkedDatesCount > 0 ? 'บันทึกแล้ว' : 'ยังไม่บันทึก',
    'เวลาบันทึกล่าสุด': t.lastCheckedTime || '-',
  }));
  const wsTeachers = XLSX.utils.json_to_sheet(teacherRows);
  XLSX.utils.book_append_sheet(wb, wsTeachers, 'สรุปภาพรวมรายกลุ่ม');

  // Sheet 2: สรุปรายนักศึกษาทุกคน พร้อมผลประเมินผ่าน/ไม่ผ่าน (Students Assessment)
  const studentRows = studentSummaries.map((s, i) => {
    const isPassed = s.attendanceRate >= 80;
    return {
      'ลำดับ': i + 1,
      'รหัสนักศึกษา': s.studentId,
      'ชื่อ-นามสกุล': s.fullName,
      'สาขาวิชา': s.major || '-',
      'กลุ่ม': s.groupName,
      'อาจารย์ผู้รับผิดชอบ': s.teacherName,
      'ชั้นปี': s.yearLevel,
      'เพศ': s.gender,
      'จำนวนครั้งที่จัด': s.totalDays,
      'มา (ครั้ง)': s.presentDays,
      'ขาด (ครั้ง)': s.absentDays,
      'ลา (ครั้ง)': s.leaveDays,
      'อัตราการเข้าร่วม (%)': `${s.attendanceRate.toFixed(1)}%`,
      'ผลการประเมิน (เกณฑ์ 80%)': isPassed ? 'ผ่านเกณฑ์' : 'ไม่ผ่านเกณฑ์',
      'เวลาบันทึกล่าสุด': s.lastRecordedTime || '-',
    };
  });
  const wsStudents = XLSX.utils.json_to_sheet(studentRows);
  XLSX.utils.book_append_sheet(wb, wsStudents, 'ผลการประเมินนักศึกษา');

  // Sheet 3: ข้อมูลการเช็คชื่อทั้งหมด (Detailed Records)
  const detailRows = records.map((r, i) => ({
    'ลำดับ': i + 1,
    'วันที่': r.date,
    'เวลาที่บันทึก': r.recordedTime || '-',
    'รหัสนักศึกษา': r.studentId,
    'ชื่อ-นามสกุล': r.studentName,
    'สาขาวิชา': r.major || '-',
    'สถานะ': r.status,
    'อาจารย์ผู้รับผิดชอบ': r.teacherName,
    'กลุ่ม': r.groupName,
    'ชั้นปี': r.yearLevel,
    'เพศ': r.gender,
  }));
  const wsDetails = XLSX.utils.json_to_sheet(detailRows);
  XLSX.utils.book_append_sheet(wb, wsDetails, 'ประวัติการเช็คชื่อทั้งหมด');

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `รายงานการเช็คชื่อหะละเกาะห์_${filterTitle}_${dateStr}.xlsx`);
}

// ======================== COMPREHENSIVE MASTER EXCEL ========================
export function exportComprehensiveMasterExcel(
  records: AttendanceRecord[],
  teacherSummaries: TeacherSummary[],
  studentSummaries: StudentSummary[],
  allDates: string[],
  title: string = 'รายงานภาพรวมทั้งโครงการฉบับสมบูรณ์'
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: สรุปภาพรวมและ KPI (Executive Summary)
  const totalStudents = studentSummaries.length;
  const passedStudents = studentSummaries.filter((s) => s.attendanceRate >= 80).length;
  const failedStudents = totalStudents - passedStudents;
  const totalPresent = records.filter((r) => r.status === 'มา').length;
  const totalAbsent = records.filter((r) => r.status === 'ขาด').length;
  const totalLeave = records.filter((r) => r.status === 'ลา').length;
  const totalChecks = totalPresent + totalAbsent + totalLeave;
  const overallRate = totalChecks > 0 ? ((totalPresent / totalChecks) * 100).toFixed(1) : '0';

  const summaryInfo = [
    { 'หัวข้อสรุป': 'ชื่อโครงการ', 'รายละเอียด': 'กลุ่มศึกษาอัลกุรอาน (หะละเกาะห์) คณะศึกษาศาสตร์' },
    { 'หัวข้อสรุป': 'วันที่ออกรายงาน', 'รายละเอียด': `${new Date().toLocaleDateString('th-TH')} เวลา ${new Date().toLocaleTimeString('th-TH')} น.` },
    { 'หัวข้อสรุป': 'จำนวนกลุ่มอาจารย์ทั้งหมด', 'รายละเอียด': `${teacherSummaries.length} กลุ่ม` },
    { 'หัวข้อสรุป': 'กลุ่มที่บันทึกแล้ว', 'รายละเอียด': `${teacherSummaries.filter((t) => t.checkedDatesCount > 0).length} กลุ่ม` },
    { 'หัวข้อสรุป': 'กลุ่มที่ยังไม่บันทึก', 'รายละเอียด': `${teacherSummaries.filter((t) => t.checkedDatesCount === 0).length} กลุ่ม` },
    { 'หัวข้อสรุป': 'จำนวนนักศึกษาทั้งหมด', 'รายละเอียด': `${totalStudents} คน` },
    { 'หัวข้อสรุป': 'นักศึกษาที่ผ่านเกณฑ์ (≥80%)', 'รายละเอียด': `${passedStudents} คน (${totalStudents > 0 ? ((passedStudents / totalStudents) * 100).toFixed(1) : 0}%)` },
    { 'หัวข้อสรุป': 'นักศึกษาที่ไม่ผ่านเกณฑ์ (<80%)', 'รายละเอียด': `${failedStudents} คน (${totalStudents > 0 ? ((failedStudents / totalStudents) * 100).toFixed(1) : 0}%)` },
    { 'หัวข้อสรุป': 'จำนวนครั้งการเช็คชื่อรวม', 'รายละเอียด': `${records.length.toLocaleString()} คน-ครั้ง` },
    { 'หัวข้อสรุป': 'มาเข้าร่วมทั้งหมด', 'รายละเอียด': `${totalPresent.toLocaleString()} ครั้ง` },
    { 'หัวข้อสรุป': 'ขาดทั้งหมด', 'รายละเอียด': `${totalAbsent.toLocaleString()} ครั้ง` },
    { 'หัวข้อสรุป': 'ลาทั้งหมด', 'รายละเอียด': `${totalLeave.toLocaleString()} ครั้ง` },
    { 'หัวข้อสรุป': 'อัตราการเข้าร่วมเฉลี่ยทั้งโครงการ', 'รายละเอียด': `${overallRate}%` },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryInfo);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'ภาพรวมโครงการ (KPI)');

  // Sheet 2: ตารางสรุปรายอาจารย์ 40 กลุ่ม (Teachers Comparison)
  const teacherRows = teacherSummaries.map((t, i) => ({
    'ลำดับ': i + 1,
    'อาจารย์ผู้รับผิดชอบ': t.teacherName,
    'กลุ่ม': t.groupName,
    'ชั้นปี': t.yearLevel,
    'เพศ': t.gender,
    'จำนวน นศ. (คน)': t.studentCount,
    'จำนวนครั้งที่เช็ค (วัน)': t.checkedDatesCount,
    'มา (คน-ครั้ง)': t.totalPresent,
    'ขาด (คน-ครั้ง)': t.totalAbsent,
    'ลา (คน-ครั้ง)': t.totalLeave,
    'อัตราเข้าเรียน (%)': `${t.overallRate.toFixed(1)}%`,
    'ผ่านเกณฑ์ (≥80%)': studentSummaries.filter((s) => s.teacherName === t.teacherName && s.attendanceRate >= 80).length,
    'ไม่ผ่านเกณฑ์': studentSummaries.filter((s) => s.teacherName === t.teacherName && s.attendanceRate < 80).length,
    'สถานะการส่งผล': t.checkedDatesCount > 0 ? 'บันทึกแล้ว' : 'ยังไม่บันทึก',
  }));
  const wsTeachers = XLSX.utils.json_to_sheet(teacherRows);
  XLSX.utils.book_append_sheet(wb, wsTeachers, 'สรุปรายกลุ่มอาจารย์');

  // Sheet 3: รายชื่อและผลการประเมินนักศึกษาทุกคน (Master Student Assessment)
  const studentRows = studentSummaries.map((s, i) => {
    const isPassed = s.attendanceRate >= 80;
    return {
      'ลำดับ': i + 1,
      'รหัสนักศึกษา': s.studentId,
      'ชื่อ-นามสกุล': s.fullName,
      'สาขาวิชา': s.major || '-',
      'กลุ่ม': s.groupName,
      'อาจารย์ผู้รับผิดชอบ': s.teacherName,
      'ชั้นปี': s.yearLevel,
      'เพศ': s.gender,
      'จำนวนครั้งที่จัด': s.totalDays,
      'มา (ครั้ง)': s.presentDays,
      'ขาด (ครั้ง)': s.absentDays,
      'ลา (ครั้ง)': s.leaveDays,
      'อัตราการเข้า (%)': `${s.attendanceRate.toFixed(1)}%`,
      'ผลการประเมิน': isPassed ? 'ผ่านเกณฑ์' : 'ไม่ผ่านเกณฑ์',
    };
  });
  const wsStudents = XLSX.utils.json_to_sheet(studentRows);
  XLSX.utils.book_append_sheet(wb, wsStudents, 'ประเมินนักศึกษาทุกคน');

  // Sheet 4: เฉพาะนักศึกษาที่ไม่ผ่านเกณฑ์ (At Risk Students)
  const failedStudentRows = studentSummaries
    .filter((s) => s.attendanceRate < 80)
    .map((s, i) => ({
      'ลำดับ': i + 1,
      'รหัสนักศึกษา': s.studentId,
      'ชื่อ-นามสกุล': s.fullName,
      'สาขาวิชา': s.major || '-',
      'กลุ่ม': s.groupName,
      'อาจารย์ผู้รับผิดชอบ': s.teacherName,
      'ชั้นปี': s.yearLevel,
      'จำนวนครั้งที่จัด': s.totalDays,
      'มา (ครั้ง)': s.presentDays,
      'ขาด (ครั้ง)': s.absentDays,
      'ลา (ครั้ง)': s.leaveDays,
      'อัตราการเข้า (%)': `${s.attendanceRate.toFixed(1)}%`,
      'ผลการประเมิน': 'ไม่ผ่านเกณฑ์',
    }));
  const wsFailed = XLSX.utils.json_to_sheet(failedStudentRows);
  XLSX.utils.book_append_sheet(wb, wsFailed, 'นักศึกษาไม่ผ่านเกณฑ์');

  // Sheet 5: ตาราง Matrix เช็คชื่อรายวันของนักศึกษาทุกคน
  const sortedDates = [...allDates].sort();
  const matrixRows = studentSummaries.map((s, i) => {
    const rowObj: Record<string, any> = {
      'ลำดับ': i + 1,
      'รหัสนักศึกษา': s.studentId,
      'ชื่อ-นามสกุล': s.fullName,
      'สาขาวิชา': s.major || '-',
      'กลุ่ม': s.groupName,
      'อาจารย์ผู้รับผิดชอบ': s.teacherName,
    };

    const sRecords = records.filter((r) => r.studentId === s.studentId);
    sortedDates.forEach((d) => {
      const match = sRecords.find((r) => r.date === d);
      rowObj[d] = match ? match.status : '-';
    });

    rowObj['มา'] = s.presentDays;
    rowObj['ขาด'] = s.absentDays;
    rowObj['ลา'] = s.leaveDays;
    rowObj['ร้อยละ'] = `${s.attendanceRate.toFixed(1)}%`;
    rowObj['ผลประเมิน'] = s.attendanceRate >= 80 ? 'ผ่านเกณฑ์' : 'ไม่ผ่านเกณฑ์';
    return rowObj;
  });
  const wsMatrix = XLSX.utils.json_to_sheet(matrixRows);
  XLSX.utils.book_append_sheet(wb, wsMatrix, 'Matrix เช็คชื่อรายวัน');

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `รายงานหะละเกาะห์_ภาพรวมทั้งโครงการ_${dateStr}.xlsx`);
}

// ======================== DETAILED GROUP EXCEL ========================
export function exportGroupDetailedExcel(
  teacherName: string,
  teacherGroup: string,
  groupStudents: { studentId: string; fullName: string; major?: string; gender: string; yearLevel: string }[],
  groupRecords: AttendanceRecord[]
) {
  const wb = XLSX.utils.book_new();
  const uniqueDates = Array.from(new Set(groupRecords.map((r) => r.date))).sort();

  // Sheet 1: Matrix บันทึกการเข้าเรียนรายบุคคล
  const matrixRows = groupStudents.map((st, i) => {
    const stRecords = groupRecords.filter((r) => r.studentId === st.studentId);
    let present = 0;
    let absent = 0;
    let leave = 0;

    const rowObj: Record<string, any> = {
      'ลำดับ': i + 1,
      'รหัสนักศึกษา': st.studentId,
      'ชื่อ-นามสกุล': st.fullName,
      'สาขาวิชา': st.major || '-',
      'ชั้นปี': st.yearLevel,
      'เพศ': st.gender,
    };

    uniqueDates.forEach((d) => {
      const match = stRecords.find((r) => r.date === d);
      const status = match ? match.status : '-';
      if (status === 'มา') present++;
      else if (status === 'ขาด') absent++;
      else if (status === 'ลา') leave++;
      rowObj[d] = status;
    });

    const totalDays = uniqueDates.length;
    const rate = totalDays > 0 ? (present / totalDays) * 100 : 0;
    rowObj['มา (ครั้ง)'] = present;
    rowObj['ขาด (ครั้ง)'] = absent;
    rowObj['ลา (ครั้ง)'] = leave;
    rowObj['อัตราการเข้า (%)'] = `${rate.toFixed(1)}%`;
    rowObj['ผลการประเมิน'] = rate >= 80 ? 'ผ่านเกณฑ์' : 'ไม่ผ่านเกณฑ์';

    return rowObj;
  });

  const wsGroup = XLSX.utils.json_to_sheet(matrixRows);
  XLSX.utils.book_append_sheet(wb, wsGroup, `กลุ่ม ${teacherName}`);

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `รายงานเช็คชื่อหะละเกาะห์_${teacherName}_${teacherGroup}_${dateStr}.xlsx`);
}

// ======================== WORD EXPORT (.DOCX) ========================
export async function exportToWord(
  records: AttendanceRecord[],
  teacherSummaries: TeacherSummary[],
  filterTitle: string = 'รายงานสรุปภาพรวม'
) {
  const total = records.length;
  const present = records.filter((r) => r.status === 'มา').length;
  const absent = records.filter((r) => r.status === 'ขาด').length;
  const leave = records.filter((r) => r.status === 'ลา').length;
  const rate = total > 0 ? ((present / total) * 100).toFixed(1) : '0';

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: 'รายงานผลการเข้าร่วมกลุ่มศึกษาอัลกุรอาน (หะละเกาะห์)',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `${filterTitle} | ข้อมูล ณ วันที่ ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}`,
                italics: true,
                size: 20,
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          // Stats summary
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '1. ข้อมูลสรุปภาพรวม (Overview Statistics)', bold: true })],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `• จำนวนรายการเช็คชื่อทั้งหมด: ${total.toLocaleString()} คน-ครั้ง\n` }),
              new TextRun({ text: `• มาเข้าร่วม: ${present.toLocaleString()} คน-ครั้ง (${rate}%)\n` }),
              new TextRun({ text: `• ขาด: ${absent.toLocaleString()} คน-ครั้ง\n` }),
              new TextRun({ text: `• ลา: ${leave.toLocaleString()} คน-ครั้ง\n` }),
            ],
          }),
          new Paragraph({ text: '' }),

          // Teacher Summary Table
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '2. สรุปผลรายกลุ่มและอาจารย์ผู้รับผิดชอบ', bold: true })],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createHeaderCell('กลุ่ม / ชั้นปี'),
                  createHeaderCell('อาจารย์ผู้รับผิดชอบ'),
                  createHeaderCell('จำนวน นศ.'),
                  createHeaderCell('มา'),
                  createHeaderCell('ขาด'),
                  createHeaderCell('ลา'),
                  createHeaderCell('อัตราเข้า (%)'),
                ],
              }),
              ...teacherSummaries.slice(0, 50).map(
                (t) =>
                  new TableRow({
                    children: [
                      createDataCell(`${t.groupName}`),
                      createDataCell(`${t.teacherName}`),
                      createDataCell(`${t.studentCount}`, AlignmentType.CENTER),
                      createDataCell(`${t.totalPresent}`, AlignmentType.CENTER),
                      createDataCell(`${t.totalAbsent}`, AlignmentType.CENTER),
                      createDataCell(`${t.totalLeave}`, AlignmentType.CENTER),
                      createDataCell(`${t.overallRate.toFixed(1)}%`, AlignmentType.RIGHT),
                    ],
                  })
              ),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const dateStr = new Date().toISOString().slice(0, 10);
  saveAs(blob, `รายงานการเช็คชื่อหะละเกาะห์_${filterTitle}_${dateStr}.docx`);
}

function createHeaderCell(text: string): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 18 })],
      }),
    ],
    shading: { fill: '7e22ce' }, // Soothing purple theme
  });
}

function createDataCell(text: string, alignment: any = AlignmentType.LEFT): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        alignment,
        children: [new TextRun({ text, size: 18 })],
      }),
    ],
  });
}

// ======================== SEPARATE: DOWNLOAD PDF (.PDF) ========================
export function downloadPdfReport(
  records: AttendanceRecord[],
  teacherSummaries: TeacherSummary[],
  title: string = 'รายงานสรุปภาพรวม'
) {
  const total = records.length;
  const present = records.filter((r) => r.status === 'มา').length;
  const absent = records.filter((r) => r.status === 'ขาด').length;
  const leave = records.filter((r) => r.status === 'ลา').length;
  const rate = total > 0 ? ((present / total) * 100).toFixed(1) : '0';
  const todayStr = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

  // Generate an elegant, self-contained printable HTML document formatted as PDF ready for download
  const htmlContent = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>${title} - ระบบกลุ่มศึกษาอัลกุรอาน</title>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: 'Sarabun', sans-serif; color: #1e1b4b; margin: 0; padding: 20px; font-size: 13px; line-height: 1.5; }
    .header { text-align: center; border-bottom: 2px solid #7e22ce; padding-bottom: 12px; margin-bottom: 16px; }
    .title { font-size: 20px; font-weight: 700; color: #581c87; margin: 0; }
    .subtitle { font-size: 13px; color: #6b7280; margin-top: 4px; }
    .kpi-grid { display: flex; gap: 12px; margin-bottom: 20px; }
    .kpi-card { flex: 1; background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 10px; text-align: center; }
    .kpi-card .val { font-size: 18px; font-weight: 700; color: #7e22ce; }
    .kpi-card .lbl { font-size: 11px; color: #6b21a8; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
    th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; }
    th { background: #7e22ce; color: #ffffff; font-weight: 600; text-align: center; }
    .center { text-align: center; }
    .right { text-align: right; }
    .badge { font-weight: 700; padding: 2px 6px; border-radius: 4px; font-size: 11px; }
    .badge-pass { color: #047857; background: #d1fae5; }
    .footer { text-align: center; font-size: 11px; color: #9ca3af; margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="title">รายงานผลการเข้าร่วมกลุ่มศึกษาอัลกุรอาน (หะละเกาะห์)</h1>
    <div class="subtitle">${title} • วันที่พิมพ์รายงาน: ${todayStr}</div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="val">${total.toLocaleString()}</div>
      <div class="lbl">บันทึกทั้งหมด (คน-ครั้ง)</div>
    </div>
    <div class="kpi-card">
      <div class="val" style="color: #059669;">${present.toLocaleString()} (${rate}%)</div>
      <div class="lbl">มาเข้าร่วม</div>
    </div>
    <div class="kpi-card">
      <div class="val" style="color: #e11d48;">${absent.toLocaleString()}</div>
      <div class="lbl">ขาด</div>
    </div>
    <div class="kpi-card">
      <div class="val" style="color: #d97706;">${leave.toLocaleString()}</div>
      <div class="lbl">ลา</div>
    </div>
  </div>

  <h3 style="color: #581c87; margin-bottom: 6px;">สรุปรายอาจารย์ผู้รับผิดชอบ (${teacherSummaries.length} กลุ่ม)</h3>
  <table>
    <thead>
      <tr>
        <th style="width: 35px;">#</th>
        <th>อาจารย์ผู้รับผิดชอบ</th>
        <th>กลุ่ม / ชั้นปี</th>
        <th style="width: 50px;">นศ.</th>
        <th style="width: 50px;">มา</th>
        <th style="width: 50px;">ขาด</th>
        <th style="width: 50px;">ลา</th>
        <th style="width: 70px;">อัตราเข้า</th>
      </tr>
    </thead>
    <tbody>
      ${teacherSummaries.map((t, idx) => `
        <tr>
          <td class="center">${idx + 1}</td>
          <td><strong>${t.teacherName}</strong></td>
          <td>${t.groupName} (${t.gender})</td>
          <td class="center">${t.studentCount}</td>
          <td class="center" style="color: #059669; font-weight: bold;">${t.totalPresent}</td>
          <td class="center" style="color: #e11d48; font-weight: bold;">${t.totalAbsent}</td>
          <td class="center" style="color: #d97706; font-weight: bold;">${t.totalLeave}</td>
          <td class="right"><span class="badge ${t.overallRate >= 80 ? 'badge-pass' : ''}">${t.overallRate.toFixed(1)}%</span></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    ระบบบันทึกและติดตามการเข้าร่วมกลุ่มศึกษาอัลกุรอาน • เอกสารส่งออกจากระบบ
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>`;

  // Open printable PDF preview in a new window
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
}

// ======================== SEPARATE: BROWSER PRINT ========================
export function printReport() {
  window.print();
}
