import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, WidthType, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { AttendanceRecord, TeacherSummary, StudentSummary } from './types';

// ======================== EXCEL EXPORT ========================
export function exportToExcel(
  records: AttendanceRecord[],
  teacherSummaries: TeacherSummary[],
  studentSummaries: StudentSummary[],
  filterTitle: string = 'รายงานภาพรวม'
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: ข้อมูลการเช็คชื่อทั้งหมด (Detailed Records)
  const detailRows = records.map((r, i) => ({
    'ลำดับ': i + 1,
    'วันที่': r.date,
    'รหัสนักศึกษา': r.studentId,
    'ชื่อ-นามสกุล': r.studentName,
    'สถานะ': r.status,
    'อาจารย์ผู้รับผิดชอบ': r.teacherName,
    'กลุ่ม': r.groupName,
    'ชั้นปี': r.yearLevel,
    'เพศ': r.gender,
  }));
  const wsDetails = XLSX.utils.json_to_sheet(detailRows);
  XLSX.utils.book_append_sheet(wb, wsDetails, 'บันทึกการเช็คชื่อ');

  // Sheet 2: สรุปรายอาจารย์ (Summary by Teacher)
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
  }));
  const wsTeachers = XLSX.utils.json_to_sheet(teacherRows);
  XLSX.utils.book_append_sheet(wb, wsTeachers, 'สรุปรายอาจารย์');

  // Sheet 3: สรุปรายนักศึกษา (Summary by Student)
  const studentRows = studentSummaries.map((s, i) => ({
    'ลำดับ': i + 1,
    'รหัสนักศึกษา': s.studentId,
    'ชื่อ-นามสกุล': s.fullName,
    'กลุ่ม': s.groupName,
    'อาจารย์ผู้รับผิดชอบ': s.teacherName,
    'ชั้นปี': s.yearLevel,
    'เพศ': s.gender,
    'จำนวนครั้งที่เช็ค': s.totalDays,
    'มา': s.presentDays,
    'ขาด': s.absentDays,
    'ลา': s.leaveDays,
    'อัตราการเข้า (%)': `${s.attendanceRate.toFixed(1)}%`,
  }));
  const wsStudents = XLSX.utils.json_to_sheet(studentRows);
  XLSX.utils.book_append_sheet(wb, wsStudents, 'สรุปรายนักศึกษา');

  // Generate and download
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `รายงานการเช็คชื่อหะละเกาะห์_${filterTitle}_${dateStr}.xlsx`);
}

// ======================== WORD (.DOCX) EXPORT ========================
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
    shading: { fill: '059669' },
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

// ======================== PDF / PRINT EXPORT ========================
export function printPdfReport() {
  window.print();
}
