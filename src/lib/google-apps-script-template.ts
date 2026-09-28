export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * โค้ด Google Apps Script สำหรับระบบบันทึกการเช็คชื่อกลุ่มศึกษาอัลกุรอาน (หะละเกาะห์)
 * ใช้เชื่อมต่อกับ Google Sheet: https://docs.google.com/spreadsheets/d/1S8XLzMp1w9CdeW5rydKmTYvvL_ie-ecFIfQbqi_P_D0/edit
 * 
 * วิธีติดตั้ง (ทำเพียง 1 ครั้ง):
 * 1. เปิด Google Sheet ดังกล่าว
 * 2. ไปที่เมนู "ส่วนขยาย" (Extensions) > "Apps Script"
 * 3. ลบโค้ดเดิมออกทั้งหมด แล้ววางโค้ดนี้ลงไป
 * 4. กดปุ่มบันทึก (รูปแผ่นดิสก์ หรือ Ctrl + S)
 * 5. กดปุ่ม "ทำให้ใช้งานได้" (Deploy) > "การทำให้ใช้งานได้รายการใหม่" (New deployment)
 * 6. เลือกประเภท: "เว็บแอป" (Web app)
 * 7. ตั้งค่า:
 *    - คำอธิบาย: Halaqah Quran API v2
 *    - ดำเนินการในฐานะ: ตัวฉันเอง (Me)
 *    - ใครมีสิทธิ์เข้าถึง: ทุกคน (Anyone)  <-- สำคัญมาก! เพื่อให้เว็บแอปส่งข้อมูลได้
 * 8. กด "ทำให้ใช้งานได้" (Deploy) และให้สิทธิ์เข้าถึง (Authorize)
 * 9. คัดลอก "URL ของเว็บแอป" (Web app URL) ไปใส่ในเว็บแอปพลิเคชัน
 */

const SHEET_ATTENDANCE = 'Attendance';
const SHEET_STUDENTS = 'Students';
const SHEET_TEACHERS = 'Teachers';
const SHEET_SETTINGS = 'Settings';

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'getAttendance';
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheets(ss);

  if (action === 'getAttendance') {
    const sheet = ss.getSheetByName(SHEET_ATTENDANCE);
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return jsonResponse({ success: true, count: 0, records: [] });
    }
    const records = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[1] && !row[3]) continue;
      records.push({
        id: String(row[0] || ''),
        date: formatDate(row[1]),
        recordedTime: String(row[2] || ''),
        studentId: String(row[3] || ''),
        studentName: String(row[4] || ''),
        status: String(row[5] || 'มา'),
        teacherName: String(row[6] || ''),
        groupName: String(row[7] || ''),
        yearLevel: String(row[8] || ''),
        gender: String(row[9] || ''),
        timestamp: String(row[10] || '')
      });
    }
    return jsonResponse({ success: true, count: records.length, records: records });
  }

  if (action === 'getSettings') {
    const sheet = ss.getSheetByName(SHEET_SETTINGS);
    const data = sheet.getDataRange().getValues();
    const settings = {};
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        settings[String(data[i][0])] = String(data[i][1] || '');
      }
    }
    return jsonResponse({ success: true, settings: settings });
  }

  if (action === 'getStats') {
    const attSheet = ss.getSheetByName(SHEET_ATTENDANCE);
    const stdSheet = ss.getSheetByName(SHEET_STUDENTS);
    return jsonResponse({
      success: true,
      totalAttendanceRows: Math.max(0, attSheet.getLastRow() - 1),
      totalStudentRows: Math.max(0, stdSheet.getLastRow() - 1)
    });
  }

  return jsonResponse({ success: false, message: 'Invalid action' });
}

function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    const action = contents.action || 'saveAttendance';
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureSheets(ss);

    // 1. บันทึกการเช็คชื่อแบบ Batch พร้อมเวลากำกับ Real-time
    if (action === 'saveAttendance') {
      const records = contents.records || [];
      if (!records || records.length === 0) {
        return jsonResponse({ success: false, message: 'No records provided' });
      }

      const sheet = ss.getSheetByName(SHEET_ATTENDANCE);
      const data = sheet.getDataRange().getValues();
      
      const existingMap = {};
      for (let i = 1; i < data.length; i++) {
        const d = formatDate(data[i][1]);
        const sId = String(data[i][3]);
        if (d && sId) {
          existingMap[d + '_' + sId] = i + 1;
        }
      }

      const newRows = [];
      let updatedCount = 0;
      let insertedCount = 0;
      const now = new Date();
      const nowFormatted = Utilities.formatDate(now, 'Asia/Bangkok', 'HH:mm:ss');
      const nowISO = now.toISOString();

      records.forEach(function(r) {
        const key = r.date + '_' + r.studentId;
        const recordTime = r.recordedTime || nowFormatted;
        const rowData = [
          r.id || ('ATT_' + r.date + '_' + r.studentId),
          r.date,
          recordTime,
          r.studentId,
          r.studentName,
          r.status,
          r.teacherName,
          r.groupName,
          r.yearLevel,
          r.gender,
          r.timestamp || nowISO
        ];

        if (existingMap[key]) {
          const rowIdx = existingMap[key];
          sheet.getRange(rowIdx, 1, 1, rowData.length).setValues([rowData]);
          updatedCount++;
        } else {
          newRows.push(rowData);
          insertedCount++;
        }
      });

      if (newRows.length > 0) {
        const lastRow = sheet.getLastRow();
        sheet.getRange(lastRow + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
      }

      return jsonResponse({
        success: true,
        message: 'บันทึกการเช็คชื่อลง Google Sheet สำเร็จ',
        inserted: insertedCount,
        updated: updatedCount,
        totalProcessed: records.length
      });
    }

    // 2. สำรองข้อมูลทั้งหมดขึ้น Google Sheet (Students, Teachers, Attendance, Settings)
    if (action === 'backupAll') {
      const students = contents.students || [];
      const teachers = contents.teachers || [];
      const attendance = contents.attendance || [];
      const logoUrl = contents.logoUrl || '';

      // Backup Students
      if (students.length > 0) {
        const stdSheet = ss.getSheetByName(SHEET_STUDENTS);
        stdSheet.clearContents();
        const stdHeaders = ['รหัสนักศึกษา', 'ชื่อ-นามสกุล', 'กลุ่ม', 'ชั้นปี', 'เพศ', 'อาจารย์ผู้รับผิดชอบ'];
        stdSheet.appendRow(stdHeaders);
        stdSheet.getRange(1, 1, 1, stdHeaders.length)
          .setBackground('#7e22ce').setFontColor('#FFFFFF').setFontWeight('bold');
        const stdRows = students.map(function(s) {
          return [s.studentId, s.fullName, s.groupName, s.yearLevel, s.gender, s.teacherName];
        });
        stdSheet.getRange(2, 1, stdRows.length, stdHeaders.length).setValues(stdRows);
      }

      // Backup Teachers
      if (teachers.length > 0) {
        const tSheet = ss.getSheetByName(SHEET_TEACHERS);
        tSheet.clearContents();
        const tHeaders = ['ชื่ออาจารย์ผู้รับผิดชอบ', 'กลุ่มที่ดูแล', 'ชั้นปี', 'เพศ'];
        tSheet.appendRow(tHeaders);
        tSheet.getRange(1, 1, 1, tHeaders.length)
          .setBackground('#7e22ce').setFontColor('#FFFFFF').setFontWeight('bold');
        const tRows = teachers.map(function(t) {
          return [t.name, t.groupName, t.yearLevel, t.gender];
        });
        tSheet.getRange(2, 1, tRows.length, tHeaders.length).setValues(tRows);
      }

      // Backup Attendance
      if (attendance.length > 0) {
        const attSheet = ss.getSheetByName(SHEET_ATTENDANCE);
        const data = attSheet.getDataRange().getValues();
        const existingMap = {};
        for (let i = 1; i < data.length; i++) {
          const d = formatDate(data[i][1]);
          const sId = String(data[i][3]);
          if (d && sId) existingMap[d + '_' + sId] = i + 1;
        }

        const newRows = [];
        attendance.forEach(function(r) {
          const key = r.date + '_' + r.studentId;
          const rowData = [
            r.id || ('ATT_' + r.date + '_' + r.studentId),
            r.date,
            r.recordedTime || '',
            r.studentId,
            r.studentName,
            r.status,
            r.teacherName,
            r.groupName,
            r.yearLevel,
            r.gender,
            r.timestamp || new Date().toISOString()
          ];
          if (existingMap[key]) {
            attSheet.getRange(existingMap[key], 1, 1, rowData.length).setValues([rowData]);
          } else {
            newRows.push(rowData);
          }
        });
        if (newRows.length > 0) {
          const lastRow = attSheet.getLastRow();
          attSheet.getRange(lastRow + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
        }
      }

      // Backup Logo / Settings
      if (logoUrl) {
        const setSheet = ss.getSheetByName(SHEET_SETTINGS);
        setSheet.clearContents();
        setSheet.appendRow(['Key', 'Value']);
        setSheet.appendRow(['logoUrl', logoUrl]);
        setSheet.appendRow(['lastSyncTime', Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss')]);
      }

      return jsonResponse({
        success: true,
        message: 'สำรองข้อมูลทั้งหมดขึ้น Google Sheet ครบถ้วนเรียบร้อยแล้ว!',
        studentsCount: students.length,
        teachersCount: teachers.length,
        attendanceCount: attendance.length
      });
    }

    // 3. บันทึกเฉพาะ Logo / Settings
    if (action === 'saveSettings') {
      const setSheet = ss.getSheetByName(SHEET_SETTINGS);
      if (contents.logoUrl) {
        setSheet.clearContents();
        setSheet.appendRow(['Key', 'Value']);
        setSheet.appendRow(['logoUrl', contents.logoUrl]);
        setSheet.appendRow(['lastSyncTime', Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss')]);
      }
      return jsonResponse({ success: true, message: 'บันทึกการตั้งค่าสำเร็จ' });
    }

    return jsonResponse({ success: false, message: 'Unknown action' });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function ensureSheets(ss) {
  // 1. Attendance Sheet
  let attSheet = ss.getSheetByName(SHEET_ATTENDANCE);
  if (!attSheet) {
    attSheet = ss.insertSheet(SHEET_ATTENDANCE);
    const headers = [
      'รหัสบันทึก (ID)',
      'วันที่ (Date)',
      'เวลาที่บันทึก (Real-time Clock)',
      'รหัสนักศึกษา (Student ID)',
      'ชื่อ-นามสกุล (Student Name)',
      'สถานะการเข้าร่วม (Status)',
      'อาจารย์ผู้รับผิดชอบ (Teacher)',
      'ชื่อกลุ่ม (Group)',
      'ชั้นปี (Year Level)',
      'เพศ (Gender)',
      'วันเวลาสากล (Timestamp)'
    ];
    attSheet.appendRow(headers);
    attSheet.getRange(1, 1, 1, headers.length)
      .setBackground('#7e22ce')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold');
    attSheet.setFrozenRows(1);
  }

  // 2. Students Sheet
  let stdSheet = ss.getSheetByName(SHEET_STUDENTS);
  if (!stdSheet) {
    stdSheet = ss.insertSheet(SHEET_STUDENTS);
    const headers = ['รหัสนักศึกษา', 'ชื่อ-นามสกุล', 'กลุ่ม', 'ชั้นปี', 'เพศ', 'อาจารย์ผู้รับผิดชอบ'];
    stdSheet.appendRow(headers);
    stdSheet.getRange(1, 1, 1, headers.length)
      .setBackground('#7e22ce')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold');
    stdSheet.setFrozenRows(1);
  }

  // 3. Teachers Sheet
  let tSheet = ss.getSheetByName(SHEET_TEACHERS);
  if (!tSheet) {
    tSheet = ss.insertSheet(SHEET_TEACHERS);
    const headers = ['ชื่ออาจารย์ผู้รับผิดชอบ', 'กลุ่มที่ดูแล', 'ชั้นปี', 'เพศ'];
    tSheet.appendRow(headers);
    tSheet.getRange(1, 1, 1, headers.length)
      .setBackground('#7e22ce')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold');
    tSheet.setFrozenRows(1);
  }

  // 4. Settings Sheet
  let setSheet = ss.getSheetByName(SHEET_SETTINGS);
  if (!setSheet) {
    setSheet = ss.insertSheet(SHEET_SETTINGS);
    setSheet.appendRow(['Key', 'Value']);
    setSheet.getRange(1, 1, 1, 2)
      .setBackground('#7e22ce')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold');
  }
}

function formatDate(val) {
  if (!val) return '';
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }
  return String(val).trim();
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
