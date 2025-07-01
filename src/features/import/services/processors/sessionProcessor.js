// src/features/import/services/processors/sessionProcessor.js
import { createRecord, updateRecord, getRecordById } from '../../../firebase/database';
import { createTeacherRecord, getOrCreateMonthRecord } from '../firebaseService';
import { calculateSessionDuration, isLongSession } from '../../../utils/sessionUtils';
import { ref, get, update } from "firebase/database";
import { database } from "../../../firebase/config";
import { findColumnIndex } from '../helpers/columnFinder';
import {
  formatDate,
  excelDateToJSDate,
  isFutureDate,
  formatTime
} from '../../../utils/dateUtils';
import { processAttendanceData } from './attendanceProcessor';


export const processSessionData = async (
  jsonData,
  excelWorksheet,
  headerRowIndex,
  courseRecord,
  groupRecord,
  students,
  options
) => {
  const headerRow = jsonData[headerRowIndex];

  // Map column indices
  const columnIndices = {
    folien: findColumnIndex(headerRow, ["Folien", "Canva"]),
    inhalt: findColumnIndex(headerRow, ["Inhalt"]),
    notizen: findColumnIndex(headerRow, ["Notizen"]),
    date: findColumnIndex(headerRow, ["Datum", "Date", "Unterrichtstag"]),
    startTime: findColumnIndex(headerRow, ["von"]),
    endTime: findColumnIndex(headerRow, ["bis"]),
    teacher: findColumnIndex(headerRow, ["Lehrer"]),
    message: findColumnIndex(headerRow, ["Nachrichten"])
  };

  // Group type and mode for duration calculation
  const groupType = groupRecord.type || 'G';
  const groupMode = groupRecord.mode || 'Unknown';

  let sessions = [];
  let currentSessionTitle = null;
  let currentSession = null;
  let teacherIds = new Set();
  let monthIds = new Set();
  let firstSessionDate = null;
  let lastSessionDate = null;
  let lastKnownDate = null;
  let isFirstSession = true;
  let sessionOrderCounter = 0;

  // Process each row for sessions
  for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
    const row = jsonData[i];

    // Skip empty rows
    if (!row || row.length === 0 || (row.length === 1 && !row[0])) {
      continue;
    }

    // Extract values
    const getValue = (index, expectedType = null) => {
      if (index === -1 || index >= row.length) return null;

      const value = row[index];
      if (value === null || value === undefined) return null;

      // Special handling for known column types
      if (expectedType === 'time' && typeof value === 'number' && value >= 0 && value < 1) {
        // This is an Excel time value (between 0 and 1)
        return formatTime(value);
      }

      if (expectedType === 'date' && typeof value === 'number' && value > 40000) {
        // This is likely an Excel date value
        const jsDate = excelDateToJSDate(value);
        return jsDate ? formatDate(jsDate) : null;
      }

      if (expectedType === 'teacher' && typeof value === 'number') {
        // If a number appears in teacher column, it's likely an error
        if (value > 0 && value < 1) {
          console.warn(`Ignoring Excel time value ${value} in teacher column`);
          return null;
        }
      }

      return value;
    };
    const folienTitle = getValue(columnIndices.folien);
    const contentValue = getValue(columnIndices.inhalt);
    const notesValue = getValue(columnIndices.notizen);
    const dateValue = getValue(columnIndices.date, 'date');
    const startTimeValue = getValue(columnIndices.startTime, 'time');
    const endTimeValue = getValue(columnIndices.endTime, 'time');
    const teacherValue = getValue(columnIndices.teacher, 'teacher');
    const messageValue = getValue(columnIndices.message);

    // If this is a new session title
    if (folienTitle && folienTitle.toString().trim() !== '') {
      // Save previous session if we have one
      if (currentSession) {
        if (isFirstSession && currentSession.startTime && currentSession.endTime) {
          currentSession.isLongSession = isLongSession(currentSession.startTime, currentSession.endTime);
          isFirstSession = false;
        }

        // Validate completed sessions have teachers
        if (currentSession.status === 'completed' && (!currentSession.teacherId || currentSession.teacherId === '')) {
          throw new Error(`Session "${currentSession.title}" on ${currentSession.date || 'unknown date'} is completed but has no teacher assigned. All completed sessions must have a teacher.`);
        }

        const sessionRecord = await createRecord('sessions', currentSession);
        courseRecord.sessionIds.push(sessionRecord.id);

        // Update month record with the new session
        if (currentSession.monthId) {
          await updateMonthRecord(currentSession.monthId, courseRecord.id);
        }

        sessions.push(sessionRecord);
      }

      // If it's a new session title or different from current one, start a new session
      if (folienTitle !== currentSessionTitle) {
        // Format date and determine if it's a future date
        let formattedDate = '';
        let isFutureSessionDate = false;

        if (dateValue) {
          // Format the date
          if (typeof dateValue === 'string' && dateValue.includes('.')) {
            formattedDate = dateValue;
          } else if (typeof dateValue === 'number') {
            const jsDate = excelDateToJSDate(dateValue);
            if (jsDate) {
              formattedDate = formatDate(jsDate);
            }
          }

          // Check if it's a future date
          if (formattedDate) {
            isFutureSessionDate = isFutureDate(formattedDate);
          }
        }

        // Format times if available
        const formattedStartTime = formatTime(startTimeValue);
        const formattedEndTime = formatTime(endTimeValue);

        // Get teacher and create record
        let teacherId = '';
        if (teacherValue) {
          // Check if teacherValue is an Excel time value (between 0 and 1)
          const isExcelTimeValue =
            typeof teacherValue === 'number' &&
            teacherValue > 0 &&
            teacherValue < 1;

          if (isExcelTimeValue) {
            console.warn(`Detected Excel time value (${teacherValue}) in teacher column. Ignoring this value.`);
            // Skip creating teacher record for time values
          } else {
            // For valid teacher values, create the teacher record
            try {
              const teacherRecord = await createTeacherRecord(teacherValue);
              if (teacherRecord) {
                teacherId = teacherRecord.id;
                teacherIds.add(teacherRecord.id);

                // If this is the first teacher we've found, set it as the course's teacher
                if (!courseRecord.teacherId) {
                  courseRecord.teacherId = teacherId;
                }
              }
            } catch (error) {
              console.error(`Error creating teacher record for value: ${teacherValue}`, error);
            }
          }
        }

        // Get or create month record
        let monthId = null;
        if (formattedDate && !isFutureSessionDate) {
          try {
            const monthRecord = await getOrCreateMonthRecord(formattedDate);
            if (monthRecord) {
              monthId = monthRecord.id;
              monthIds.add(monthId);
            }
          } catch (error) {
            console.error(`Error getting/creating month record for date ${formattedDate}:`, error);
          }
        }

        // Create new session object
        currentSessionTitle = folienTitle;

        currentSession = {
          courseId: courseRecord.id,
          title: folienTitle,
          content: contentValue || '',
          notes: notesValue || '',
          date: isFutureSessionDate ? '' : (formattedDate || ''),
          startTime: isFutureSessionDate ? '' : formattedStartTime,
          endTime: isFutureSessionDate ? '' : formattedEndTime,
          teacherId: teacherId || '',
          contentItems: [],
          attendance: {},
          monthId: isFutureSessionDate ? null : monthId,
          sessionOrder: sessionOrderCounter++,
          duration: calculateSessionDuration(
            groupType,
            groupMode,
            isFirstSession,
            formattedStartTime,
            formattedEndTime
          ),
          status: determineSessionStatus(formattedDate)
        };

        // Update tracking variables
        if (formattedDate) {
          lastKnownDate = formattedDate;

          // Update first/last session dates for the course
          if (!firstSessionDate || formattedDate < firstSessionDate) {
            firstSessionDate = formattedDate;
          }
          if (!lastSessionDate || formattedDate > lastSessionDate) {
            lastSessionDate = formattedDate;
          }
        }
      }
      // If it's the same title but new content
      else if (contentValue && contentValue.trim() !== '') {
        if (!currentSession.contentItems) {
          currentSession.contentItems = [];
        }
        currentSession.contentItems.push({
          content: contentValue,
          notes: notesValue || '',
        });
      }
    }
    // Additional content for current session
    else if (currentSession && contentValue) {
      currentSession.contentItems.push({
        content: contentValue,
        notes: notesValue || '',
      });
    }

    // Process attendance data for this row
    if (currentSession && students.length > 0) {
      processAttendanceData(
        row,
        excelWorksheet.getRow(i + 1),
        students,
        currentSession
      );
    }
  }

  // Process the last session if we have one
  if (currentSession) {
    // Validate completed sessions have teachers
    if (currentSession.status === 'completed' && (!currentSession.teacherId || currentSession.teacherId === '')) {
      throw new Error(`Session "${currentSession.title}" on ${currentSession.date || 'unknown date'} is completed but has no teacher assigned. All completed sessions must have a teacher.`);
    }

    const sessionRecord = await createRecord('sessions', currentSession);
    courseRecord.sessionIds.push(sessionRecord.id);

    if (currentSession.monthId) {
      await updateMonthRecord(currentSession.monthId, courseRecord.id);
    }

    sessions.push(sessionRecord);
  }

  return {
    sessions,
    teacherIds,
    monthIds,
    firstSessionDate,
    lastSessionDate
  };
};

// Helper function to update month record
const updateMonthRecord = async (monthId, courseId) => {
  const monthRef = ref(database, `months/${monthId}`);
  const monthSnapshot = await get(monthRef);

  if (monthSnapshot.exists()) {
    const monthData = monthSnapshot.val();

    // Initialize courseIds array if it doesn't exist
    if (!monthData.courseIds) {
      monthData.courseIds = [];
    }

    // Update month course IDs if not already there
    if (!monthData.courseIds.includes(courseId)) {
      monthData.courseIds.push(courseId);
    }

    // Increment session count
    monthData.sessionCount = (monthData.sessionCount || 0) + 1;

    // Update the month record
    await update(monthRef, {
      courseIds: monthData.courseIds,
      sessionCount: monthData.sessionCount
    });
  }
};

// Helper function to determine session status
const determineSessionStatus = (dateString) => {
  if (!dateString) return 'ongoing';

  const [day, month, year] = dateString.split('.').map(Number);
  // Create date objects with consistent timezone handling
  const sessionDate = new Date(Date.UTC(year, month - 1, day));
  const today = new Date();
  // Convert today to UTC midnight
  const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

  return sessionDate >= todayUTC ? 'ongoing' : 'completed';
};

export default {
  processSessionData
};