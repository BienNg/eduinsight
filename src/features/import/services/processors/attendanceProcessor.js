// src/features/import/services/processors/attendanceProcessor.js
import { ref, get, update } from "firebase/database";
import { database } from "../../../firebase/config";
import { isGreenColor, isRedColor } from '../helpers/colorUtils';
import { parseDate } from '../../../utils/dateUtils';


export const processAttendanceData = (row, excelRow, students, currentSession) => {
  for (const student of students) {
    const columnIndex = student.columnIndex;
    const cellValue = row[columnIndex];
    const excelCell = excelRow.getCell(columnIndex + 1); // +1 because ExcelJS is 1-based

    // Extract comment if any (from cell note or text value)
    let comment = '';
    if (excelCell.note) {
      comment = excelCell.note.texts.map(t => t.text).join('');
    } else if (typeof cellValue === 'string' && cellValue.trim() !== '') {
      comment = cellValue;
    }

    // Determine attendance status ONLY from cell color
    let attendanceValue = 'unknown';
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

    // Record attendance if we determined a status OR if there's a comment
    if (attendanceValue !== 'unknown' || comment) {
      // Store both the color-determined status and the comment
      currentSession.attendance[student.id] = {
        status: attendanceValue, // Based only on color
        comment: comment         // Preserve any comment regardless of status
      };

      // Update student join date if this is the first record of them in this course
      if (currentSession.date) {
        updateStudentJoinDate(student.id, currentSession.courseId, currentSession.date);
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

      // Use the imported parseDate function
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

export default {
  processAttendanceData
};