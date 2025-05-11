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

    // Debug: Log only relevant cell properties instead of the entire object
    console.log(`Cell for ${student.name}:`, {
      value: cellValue,
      fillType: excelCell.fill?.type,
      pattern: excelCell.fill?.pattern,
      hasFgColor: !!excelCell.fill?.fgColor,
      fgColorRGB: excelCell.fill?.fgColor?.rgb,
      fgColorARGB: excelCell.fill?.fgColor?.argb,
      fgColorTheme: excelCell.fill?.fgColor?.theme,
      fgColorTint: excelCell.fill?.fgColor?.tint,
      hasBgColor: !!excelCell.fill?.bgColor,
      bgColorRGB: excelCell.fill?.bgColor?.rgb,
      bgColorARGB: excelCell.fill?.bgColor?.argb
    });

    // Determine attendance status from cell value and properties
    let attendanceValue = 'unknown';

    // Try text-based detection first
    if (typeof cellValue === 'string') {
      const cellText = cellValue.toString().toLowerCase().trim();

      // Common attendance markers
      if (['p', 'present', 'yes', 'y', '✓', '✔', 'da', 'a', 'anwesend', '+'].includes(cellText)) {
        attendanceValue = 'present';
      } else if (['a', 'absent', 'no', 'n', '✗', '✘', 'ne', 'abwesend', '-'].includes(cellText)) {
        attendanceValue = 'absent';
      }
    }

    // If still unknown, try color detection
    if (attendanceValue === 'unknown' && excelCell.fill) {
      // Try to extract color information from different possible properties
      let colorValue = null;

      if (excelCell.fill.fgColor) {
        if (excelCell.fill.fgColor.argb) {
          colorValue = excelCell.fill.fgColor.argb;
        } else if (excelCell.fill.fgColor.rgb) {
          colorValue = excelCell.fill.fgColor.rgb;
        } else if (excelCell.fill.fgColor.theme !== undefined) {
          // For theme colors, we need a special handling
          // Typically theme 0 = white, 1 = black, 2 = red, 3 = green, etc.
          const theme = excelCell.fill.fgColor.theme;
          const tint = excelCell.fill.fgColor.tint || 0;

          console.log(`Theme color detected: theme=${theme}, tint=${tint}`);

          // Map common Excel themes to attendance
          if (theme === 3 || theme === 4 || theme === 6) {  // Common green theme indices
            attendanceValue = 'present';
          } else if (theme === 2 || theme === 5) {  // Common red theme indices
            attendanceValue = 'absent';
          }

          // Continue with other detection methods if theme color didn't resolve
        }
      }

      // If we got a color value from argb or rgb, check for green/red
      if (colorValue) {
        console.log(`Found color value: ${colorValue} for ${student.name}`);

        if (isGreenColor(colorValue)) {
          attendanceValue = 'present';
        } else if (isRedColor(colorValue)) {
          attendanceValue = 'absent';
        }
      }

      // Special handling for Excel pattern fills
      if (attendanceValue === 'unknown' && excelCell.fill.type === 'pattern') {
        // Some versions of Excel use pattern type with specific patterns for colors
        const pattern = excelCell.fill.pattern;

        if (pattern === 1 || pattern === 'solid') {
          // For solid fills, we can try to infer from other properties
          // Typically solid green = present, solid red = absent

          // This is a heuristic approach - we're trying to detect if this cell
          // is likely a standard Excel "present" or "absent" cell based on pattern
          if (excelCell.style && excelCell.style.font && excelCell.style.font.color) {
            // Sometimes the font color is the inverse of the fill color
            const fontColor = excelCell.style.font.color.argb || excelCell.style.font.color.rgb;

            if (fontColor) {
              console.log(`Font color: ${fontColor} for ${student.name}`);

              // If font is white, it might be on a dark (e.g., red) background = absent
              if (fontColor.endsWith('FFFFFF')) {
                attendanceValue = 'absent';
              }
              // If font is black, it might be on a light (e.g., green) background = present
              else if (fontColor.endsWith('000000')) {
                attendanceValue = 'present';
              }
            }
          }
        }
      }
    }

    // Additional detection based on cell format
    if (attendanceValue === 'unknown') {
      // Check if cell has conditional formatting or specific styles
      if (excelCell.style) {
        // Check for green/red text color
        if (excelCell.style.font && excelCell.style.font.color) {
          const fontColor = excelCell.style.font.color.argb || excelCell.style.font.color.rgb;

          if (fontColor) {
            if (isGreenColor(fontColor)) {
              attendanceValue = 'present';
            } else if (isRedColor(fontColor)) {
              attendanceValue = 'absent';
            }
          }
        }
      }
    }

    // Check for presence/absence based on value
    if (attendanceValue === 'unknown') {
      // Check for boolean values or numbers
      if (cellValue === true) {
        attendanceValue = 'present';
      } else if (cellValue === false) {
        attendanceValue = 'absent';
      } else if (cellValue === 1 || cellValue === '1') {
        attendanceValue = 'present';
      } else if (cellValue === 0 || cellValue === '0') {
        attendanceValue = 'absent';
      }
    }

    // Record attendance if we determined a status OR if there's a comment
    if (attendanceValue !== 'unknown' || comment) {
      // Initialize attendance object if it doesn't exist
      if (!currentSession.attendance) {
        currentSession.attendance = {};
      }

      currentSession.attendance[student.id] = {
        status: attendanceValue,
        comment: comment
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