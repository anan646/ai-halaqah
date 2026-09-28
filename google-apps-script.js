/**
 * โค้ด Google Apps Script สำหรับระบบบันทึกการเช็คชื่อกลุ่มศึกษาอัลกุรอาน (หะละเกาะห์)
 * ใช้เชื่อมต่อกับ Google Sheet: https://docs.google.com/spreadsheets/d/1S8XLzMp1w9CdeW5rydKmTYvvL_ie-ecFIfQbqi_P_D0/edit
 * 
 * วิธีติดตั้ง:
 * 1. เปิด Google Sheet ลิงก์ด้านบน
 * 2. ไปที่เมนู "ส่วนขยาย" (Extensions) > "Apps Script"
 * 3. ลบโค้ดเดิมออกทั้งหมด แล้ววางโค้ดในไฟล์นี้ลงไป
 * 4. กดปุ่มบันทึก (รูปแผ่นดิสก์ หรือ Ctrl + S)
 * 5. กดปุ่ม "ทำให้ใช้งานได้" (Deploy) > "การทำให้ใช้งานได้รายการใหม่" (New deployment)
 * 6. เลือกประเภท: "เว็บแอป" (Web app)
 * 7. ตั้งค่า:
 *    - คำอธิบาย: Halaqah Quran Attendance API
 *    - ดำเนินการในฐานะ: ตัวฉันเอง (Me)
 *    - ใครมีสิทธิ์เข้าถึง: ทุกคน (Anyone)  <-- สำคัญมาก! เพื่อให้เว็บแอปบน Vercel บันทึกและดึงข้อมูลได้
 * 8. กด "ทำให้ใช้งานได้" (Deploy) และให้สิทธิ์เข้าถึง (Authorize access)
 * 9. คัดลอก "URL ของเว็บแอป" (Web app URL) ไปใส่ในเว็บแอปพลิเคชัน
 */

const SHEET_ATTENDANCE = 'Attendance';

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
      if (!row[1] && !row[2]) continue; // skip empty
      records.push({
        id: String(row[0] || ''),
        date: formatDate(row[1]),
        studentId: String(row[2] || ''),
        studentName: String(row[3] || ''),
        status: String(row[4] || 'มา'),
        teacherName: String(row[5] || ''),
        groupName: String(row[6] || ''),
        yearLevel: String(row[7] || ''),
        gender: String(row[8] || ''),
        timestamp: String(row[9] || '')
      });
    }
    return jsonResponse({ success: true, count: records.length, records: records });
  }

  if (action === 'getStats') {
    const sheet = ss.getSheetByName(SHEET_ATTENDANCE);
    const lastRow = Math.max(0, sheet.getLastRow() - 1);
    return jsonResponse({ success: true, totalRecords: lastRow });
  }

  return jsonResponse({ success: false, message: 'Invalid action' });
}

function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    const action = contents.action || 'saveAttendance';
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureSheets(ss);

    if (action === 'saveAttendance') {
      const records = contents.records || [];
      if (!records || records.length === 0) {
        return jsonResponse({ success: false, message: 'No records provided' });
      }

      const sheet = ss.getSheetByName(SHEET_ATTENDANCE);
      const data = sheet.getDataRange().getValues();
      
      // Index existing rows by Date + StudentId
      const existingMap = {};
      for (let i = 1; i < data.length; i++) {
        const d = formatDate(data[i][1]);
        const sId = String(data[i][2]);
        if (d && sId) {
          existingMap[d + '_' + sId] = i + 1; // 1-based row index in sheet
        }
      }

      const newRows = [];
      let updatedCount = 0;
      let insertedCount = 0;
      const now = new Date().toISOString();

      records.forEach(function(r) {
        const key = r.date + '_' + r.studentId;
        const rowData = [
          r.id || ('ATT_' + r.date + '_' + r.studentId),
          r.date,
          r.studentId,
          r.studentName,
          r.status,
          r.teacherName,
          r.groupName,
          r.yearLevel,
          r.gender,
          now
        ];

        if (existingMap[key]) {
          // Update existing row
          const rowIdx = existingMap[key];
          sheet.getRange(rowIdx, 1, 1, rowData.length).setValues([rowData]);
          updatedCount++;
        } else {
          // New row to append
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
        message: 'บันทึกข้อมูลเรียบร้อยแล้ว',
        inserted: insertedCount,
        updated: updatedCount,
        totalProcessed: records.length
      });
    }

    return jsonResponse({ success: false, message: 'Unknown action' });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function ensureSheets(ss) {
  let attSheet = ss.getSheetByName(SHEET_ATTENDANCE);
  if (!attSheet) {
    attSheet = ss.insertSheet(SHEET_ATTENDANCE);
    const headers = [
      'รหัสบันทึก (ID)',
      'วันที่ (Date)',
      'รหัสนักศึกษา (Student ID)',
      'ชื่อ-นามสกุล (Student Name)',
      'สถานะการเข้าร่วม (Status)',
      'อาจารย์ผู้รับผิดชอบ (Teacher)',
      'ชื่อกลุ่ม (Group)',
      'ชั้นปี (Year Level)',
      'เพศ (Gender)',
      'วันเวลาที่บันทึก (Timestamp)'
    ];
    attSheet.appendRow(headers);
    attSheet.getRange(1, 1, 1, headers.length)
      .setBackground('#059669')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold');
    attSheet.setFrozenRows(1);
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
