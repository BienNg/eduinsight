// src/features/import/services/processors/attendanceProcessor.js
import { ref, get, update } from "firebase/database";
import { database } from "../../../firebase/config";
import { isGreenColor, isRedColor } from '../helpers/excelHelpers';

export const processAttendanceData = (row, excelRow, students, currentSession) => {
  for (const student of students) {
    const columnIndex = student.columnIndex;
    const cellValue = row[columnIndex];
    const excelCell = excelRow.getCell(columnIndex + 1); // +1 because ExcelJS is 1-based
    
    if (cellValue !== undefined && cellValue !== null || excelCell.fill) {
      let attendanceValue = 'unknown';
      let comment = '';
      
      // Try to get cell comment if any
      if (excelCell.note) {
        comment = excelCell.note.texts.map(t => t.text).join('');
      } else if (typeof cellValue === 'string' && cellValue.trim() !== '') {
        comment = cellValue;
      }
      
      // Color-based detection
      if (excelCell.fill && excelCell.fill.type === 'pattern' && excelCell.fill.fgColor) {
        const color = excelCell.fill.fgColor.argb || '';
        
        // Green -> present, Red/Pink -> absent
        if (isGreenColor(color)) {
          attendanceValue = 'present';
        }
        else if (isRedColor(color)) {
          attendanceValue = 'absent';
        }
      }
      
      // If we couldn't determine from color, try text values
      if (attendanceValue === 'unknown' && cellValue) {
        const cellText = cellValue.toString().toLowerCase();
        if (cellText === 'true' || cellText === 'anwesend' || cellText === 'present') {
          attendanceValue = 'present';
        } else if (cellText === 'false' || cellText === 'abwesend' || cellText === 'absent') {
          attendanceValue = 'absent';
        } else if (cellText.includes('krank') || cellText.includes('sick')) {
          attendanceValue = 'sick';
        } else if (cellText.includes('kamera aus') || cellText.includes('mic aus')) {
          attendanceValue = 'technical_issues';
        }
      }
      
      // Non-empty cell means student has joined by this session date
      if (attendanceValue !== 'unknown' || comment) {
        // Record attendance with comment
        currentSession.attendance[student.id] = {
          status: attendanceValue,
          comment: comment || ''
        };
        
        // Update student join date if this is the first record of them in this course
        if (currentSession.date) {
          updateStudentJoinDate(student.id, currentSession.courseId, currentSession.date);
        }
      }
    }
  }
};

// Helper function to update student join date
const updateStudentJoinDate = async (studentId, courseId, sessionDate) => {
  try {
    const studentSnapshot = await get(ref(database, `students/${studentId}`));
    
    if (studentSnapshot.exists()) {
      const studentData = studentSnapshot.val();
      const joinDates = studentData.joinDates || {};
      
      // If no join date for this course yet, or if this date is earlier
      if (!joinDates[courseId] || 
          parseDate(sessionDate) < parseDate(joinDates[courseId])) {
        joinDates[courseId] = sessionDate;
        update(ref(database, `students/${studentId}`), { joinDates });
      }
    }
  } catch (error) {
    console.error(`Error updating student join date: ${error.message}`);
  }
};

// Helper to parse date string
const parseDate = (dateString) => {
  if (!dateString) return null;
  const [day, month, year] = dateString.split('.').map(Number);
  return new Date(year, month - 1, day);
};