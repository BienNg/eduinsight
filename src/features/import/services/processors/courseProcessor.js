// src/features/import/services/processors/courseProcessor.js
import * as XLSX from 'xlsx';
import { createRecord, updateRecord, getRecordById } from '../../../firebase/database';
import { getOrCreateGroupRecord, getNextCourseColor } from '../firebaseService';
import { findExistingCourse } from '../firebaseService';
import { detectWeekdayPatternWithOutliers } from '../../../utils/sessionUtils';
import { processSessionData } from './sessionProcessor';
import { extractStudentData } from './studentProcessor';
import {
  parseExcelData,
  extractCourseInfo
} from '../parsers/excelParser';
import { findColumnIndex } from '../helpers/columnFinder';
import { excelDateToJSDate, formatDate, formatTime } from '../../../utils/dateUtils';
import { createTeacherRecord, getOrCreateMonthRecord } from '../firebaseService';
import { isGreenColor, isRedColor } from '../helpers/colorUtils';
import { updateStudentJoinDate } from './attendanceProcessor';

/**
 * Format the current date and time in the specified format
 * @returns {string} Formatted date/time string like "2025-05-20 (14:34)"
 */
const getFormattedDateTime = () => {
  const now = new Date();

  // Get year, month, day
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const day = String(now.getDate()).padStart(2, '0');

  // Get hours and minutes
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  // Create the formatted string
  return `${year}-${month}-${day} (${hours}:${minutes})`;
};

const updateExistingCourseWithNewSessions = async (
  existingCourse,
  jsonData,
  excelWorksheet,
  headerRowIndex,
  options
) => {
  const formattedDateTime = getFormattedDateTime();

  if (options?.metadata?.sourceUrl) {
    const googleSheetsUrl = options.metadata.sourceUrl;

    // Check if course doesn't have a sourceUrl yet
    if (!existingCourse.sheetName && options.metadata.sheetName) {
      await updateRecord('courses', existingCourse.id, {
        sourceUrl: options.metadata.sourceUrl,
        sheetName: options.metadata.sheetName,
        sheetIndex: options.metadata.sheetIndex || 0,
        lastUpdated: formattedDateTime
      });

      // Update our local copy
      existingCourse = {
        ...existingCourse,
        sourceUrl: options.metadata.sourceUrl,
        sheetName: options.metadata.sheetName,
        sheetIndex: options.metadata.sheetIndex || 0,
        lastUpdated: formattedDateTime
      };

      console.log(`Updated course ${existingCourse.name} with Google Sheets URL: ${googleSheetsUrl}`);
    } else {
      console.log(`Course ${existingCourse.name} already has a Google Sheets URL: ${existingCourse.sourceUrl}`);
    }
  }

  const monthIds = new Set();

  if (!existingCourse.sessionIds || !Array.isArray(existingCourse.sessionIds)) {
    console.warn(`Course ${existingCourse.name} has no sessionIds array. Creating empty array.`);
    existingCourse.sessionIds = [];
  }

  // Get the existing sessions for this course
  const existingSessions = [];
  for (const sessionId of existingCourse.sessionIds) {
    const session = await getRecordById('sessions', sessionId);
    if (session) {
      existingSessions.push(session);
    }
  }

  // Get the group record for this course
  const groupRecord = await getRecordById('groups', existingCourse.groupId);
  if (!groupRecord) {
    throw new Error(`Could not find group record for course ${existingCourse.name}`);
  }

  // Process header row to find column indices
  const headerRow = jsonData[headerRowIndex];
  const students = await extractStudentData(headerRow, existingCourse.id, existingCourse.groupId);

  const columnIndices = {
    folien: findColumnIndex(headerRow, ["Folien", "Canva"]),
    date: findColumnIndex(headerRow, ["Unterrichtstag", "Datum", "Tag", "Date", "Day"]),
    teacher: findColumnIndex(headerRow, ["Lehrer"]),
    startTime: findColumnIndex(headerRow, ["von"]),
    endTime: findColumnIndex(headerRow, ["bis"])
  };

  // Track sessions from the Excel file
  const excelSessions = [];
  let currentSessionTitle = null;
  let currentSession = null;

  // First, extract all session data from the Excel file
  for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
    const row = jsonData[i];

    // Skip empty rows
    if (!row || row.length === 0 || (row.length === 1 && !row[0])) {
      continue;
    }

    // Extract values
    const getValue = (index) => index !== -1 && index < row.length ? row[index] : null;

    const folienTitle = getValue(columnIndices.folien);
    const dateValue = getValue(columnIndices.date);
    const teacherValue = getValue(columnIndices.teacher);
    const startTimeValue = getValue(columnIndices.startTime);
    const endTimeValue = getValue(columnIndices.endTime);

    // If this is a new session title
    if (folienTitle && folienTitle.toString().trim() !== '') {
      // Save previous session if we have one
      if (currentSession) {
        excelSessions.push(currentSession);
      }

      // Format date 
      let formattedDate = '';
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
      }

      // Format times if available
      const formattedStartTime = formatTime(startTimeValue);
      const formattedEndTime = formatTime(endTimeValue);

      // Extract teacher ID if available
      let teacherId = '';
      if (teacherValue) {
        teacherId = teacherValue.toString().trim();
      }

      // Create new session object (not a DB record)
      currentSessionTitle = folienTitle;
      currentSession = {
        title: folienTitle,
        date: formattedDate || '',
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        teacherId: teacherId,
        hasTeacher: !!teacherId,
        isComplete: !!formattedDate && !!formattedStartTime && !!formattedEndTime && !!teacherId
      };
    }
  }

  // Add the last session if we have one
  if (currentSession) {
    excelSessions.push(currentSession);
  }

  // Now, update existing sessions that need updating
  const updatedSessions = [];
  const updatedSessionTitles = [];

  for (const existingSession of existingSessions) {
    // Find matching session in Excel data by title only
    const matchingExcelSession = excelSessions.find(session =>
      session.title === existingSession.title
    );

    if (matchingExcelSession && matchingExcelSession.isComplete) {
      // Check if the existing session needs updating
      let needsUpdate = existingSession.status !== 'completed' ||
        !existingSession.teacherId ||
        !existingSession.startTime ||
        !existingSession.endTime;

      // Also check if date needs updating
      const dateNeedsUpdate = matchingExcelSession.date &&
        matchingExcelSession.date !== existingSession.date;

      needsUpdate = needsUpdate || dateNeedsUpdate;

      if (needsUpdate) {
        // Create update object with only the fields that need updating
        const updates = {
          status: 'completed'
        };

        // Handle teacher ID properly
        if (matchingExcelSession.teacherId) {
          // Get the proper teacher record from the database using the teacher name
          const teacherName = matchingExcelSession.teacherId; // This is actually the teacher name from Excel
          const teacherRecord = await createTeacherRecord(teacherName);

          // Now use the actual teacher ID from the database
          if (teacherRecord && teacherRecord.id !== existingSession.teacherId) {
            updates.teacherId = teacherRecord.id;
          }
        }

        // Handle date update and monthId update if needed
        if (dateNeedsUpdate) {
          updates.date = matchingExcelSession.date;

          // If the date changes, we need to update the monthId
          if (matchingExcelSession.date) {
            // Get or create the month record for the new date
            const monthRecord = await getOrCreateMonthRecord(matchingExcelSession.date);
            if (monthRecord) {
              updates.monthId = monthRecord.id;

              // Track this month ID for course updates
              monthIds.add(monthRecord.id);
            }
          }
        }

        if (matchingExcelSession.startTime && matchingExcelSession.startTime !== existingSession.startTime) {
          updates.startTime = matchingExcelSession.startTime;
        }

        if (matchingExcelSession.endTime && matchingExcelSession.endTime !== existingSession.endTime) {
          updates.endTime = matchingExcelSession.endTime;
        }
        if (matchingExcelSession.date) {
          // Find the row in Excel file that corresponds to this session
          let sessionRowIndex = -1;
          for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length === 0) continue;

            const folienTitle = row[columnIndices.folien];
            if (folienTitle && folienTitle.toString().trim() === existingSession.title) {
              sessionRowIndex = i;
              break;
            }
          }

          // If we found the row, process attendance
          if (sessionRowIndex >= 0) {
            const excelRow = excelWorksheet.getRow(sessionRowIndex + 1); // +1 because ExcelJS is 1-based
            const row = jsonData[sessionRowIndex];

            // Create new attendance object to overwrite existing data
            const newAttendance = {};

            // Process attendance for each student
            for (const student of students) {
              const columnIndex = student.columnIndex;
              const cellValue = row[columnIndex];
              const excelCell = excelRow.getCell(columnIndex + 1); // +1 because ExcelJS is 1-based

              // Extract comment if any
              let comment = '';
              if (excelCell.note) {
                comment = excelCell.note.texts.map(t => t.text).join('');
              } else if (typeof cellValue === 'string' && cellValue.trim() !== '') {
                comment = cellValue;
              }

              // Determine attendance status from cell color
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
                newAttendance[student.id] = {
                  status: attendanceValue,
                  comment: comment
                };
              }
            }

            // Update attendance in the database if there's any data
            if (Object.keys(newAttendance).length > 0) {
              updates.attendance = newAttendance;

              // Update session join dates for students
              for (const studentId in newAttendance) {
                updateStudentJoinDate(studentId, existingCourse.id, matchingExcelSession.date);
              }
            }
          }
        }

        // Only update if we have actual changes
        if (Object.keys(updates).length > 1) { 
          await updateRecord('sessions', existingSession.id, updates);

          updatedSessions.push({
            ...existingSession,
            ...updates
          });

          updatedSessionTitles.push(existingSession.title);
        }
      }
    }
  }


  if (updatedSessions.length === 0) {
    throw new Error(
      `No sessions were updated for course "${existingCourse.name}". ` +
      `The course already exists with ${existingSessions.length} sessions. ` +
      `The latest session recorded is on ${existingCourse.latestSessionDate || 'unknown date'}.`
    );
  }

  // Update the course's lastUpdated timestamp
  await updateRecord('courses', existingCourse.id, {
    lastUpdated: formattedDateTime
  });

  // Create a success message with the updated session details
  const updateMessage = `Updated ${updatedSessions.length} sessions in course "${existingCourse.name}": ${updatedSessionTitles.join(', ')}`;
  if (updatedSessions.length > 0) {
    // Get all sessions for this course (including updated ones)
    const allSessions = [];
    for (const sessionId of existingCourse.sessionIds) {
      const session = await getRecordById('sessions', sessionId);
      if (session) {
        allSessions.push(session);
      }
    }

    // Determine new course status
    const newStatus = determineCourseStatus(allSessions);

    // Update course status if changed
    if (newStatus !== existingCourse.status) {
      await updateRecord('courses', existingCourse.id, {
        status: newStatus,
        lastUpdated: formattedDateTime
      });

      // Update local copy
      existingCourse.status = newStatus;
    }
  }
  return {
    ...existingCourse,
    updatedSessionsCount: updatedSessions.length,
    updatedSessionTitles: updatedSessionTitles,
    updateMessage,
    monthIds: Array.from(monthIds),
    lastUpdated: formattedDateTime
  };
};

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


// Helper function to extract session data from Excel without creating DB records
const extractExcelSessionsData = (jsonData, excelWorksheet, headerRowIndex, columnIndices) => {
  const headerRow = jsonData[headerRowIndex];
  const excelSessions = [];
  let currentSessionTitle = null;
  let currentSession = null;

  // Process each row for sessions
  for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
    const row = jsonData[i];

    // Skip empty rows
    if (!row || row.length === 0 || (row.length === 1 && !row[0])) {
      continue;
    }

    // Extract values
    const getValue = (index) => index !== -1 && index < row.length ? row[index] : null;

    const folienTitle = getValue(columnIndices.folien);
    const dateValue = getValue(columnIndices.date);
    const teacherValue = getValue(columnIndices.teacher);
    const startTimeValue = getValue(columnIndices.startTime);
    const endTimeValue = getValue(columnIndices.endTime);

    // If this is a new session title
    if (folienTitle && folienTitle.toString().trim() !== '') {
      // Save previous session if we have one
      if (currentSession) {
        excelSessions.push(currentSession);
      }

      // Format date 
      let formattedDate = '';
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
      }

      // Format times if available
      const formattedStartTime = formatTime(startTimeValue);
      const formattedEndTime = formatTime(endTimeValue);

      // Create new session object (without creating a DB record)
      currentSessionTitle = folienTitle;
      currentSession = {
        title: folienTitle,
        date: formattedDate || '',
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        teacherId: teacherValue ? teacherValue.toString().trim() : '',
        status: determineSessionStatus(formattedDate)
      };
    }
  }

  // Add the last session if we have one
  if (currentSession) {
    excelSessions.push(currentSession);
  }

  return excelSessions;
};

export const processCourseData = async (arrayBuffer, filename, options) => {
  // Parse Excel file data with sheet name if available
  const { workbook, jsonData, excelWorksheet, headerRowIndex, sheetName } =
    await parseExcelData(arrayBuffer, {
      sheetName: options?.metadata?.sheetName
    });
  // Extract course info or use metadata
  let courseInfo;
  if (options && options.metadata && options.metadata.groupName) {
    courseInfo = {
      groupName: options.metadata.groupName,
      level: options.metadata.level || '',
      mode: options.metadata.mode || 'Unknown',
      language: options.metadata.language || ''
    };

    // Validation for metadata-based processing
    if (!courseInfo.level && courseInfo.groupName.charAt(0).toUpperCase() !== 'A') {
      throw new Error(`Level information is missing for ${courseInfo.groupName}`);
    }
  } else {
    courseInfo = extractCourseInfo(filename, jsonData, workbook.SheetNames[0]);
  }

  // Additional validation for level detection
  if (courseInfo.groupName.charAt(0).toUpperCase() !== 'A' && !courseInfo.level) {
    throw new Error(`Level information not found for ${courseInfo.groupName}`);
  }

  // Create or get group record
  const groupRecord = await getOrCreateGroupRecord(courseInfo.groupName, courseInfo.mode);

  // NEW CODE: Check if course already exists
  const existingCourse = await findExistingCourse(courseInfo.groupName, courseInfo.level);
  if (existingCourse) {
    console.log(`Found existing course: ${existingCourse.name}`);

    // NEW STEP: Check and update sourceUrl if the import is from Google Sheets
    if (options?.metadata?.sourceUrl && !existingCourse.sourceUrl) {
      console.log(`Updating course ${existingCourse.name} with Google Sheets URL`);
      await updateRecord('courses', existingCourse.id, {
        sourceUrl: options.metadata.sourceUrl
      });

      // Update our local copy of existingCourse
      existingCourse.sourceUrl = options.metadata.sourceUrl;
    }

    // Update the course with new sessions
    return await updateExistingCourseWithNewSessions(
      existingCourse,
      jsonData,
      excelWorksheet,
      headerRowIndex,
      options
    );
  }

  // If no existing course, continue with creating a new one...
  // Rest of your existing code for creating a new course
  const courseColor = await getNextCourseColor();

  // Create course record
  const courseName = courseInfo.level ? `${courseInfo.groupName} ${courseInfo.level}` : courseInfo.groupName;
  const courseRecord = await createRecord('courses', {
    name: courseName,
    level: courseInfo.level,
    groupId: groupRecord.id,
    startDate: '',
    endDate: '',
    sessionIds: [],
    studentIds: [],
    teacherIds: [],
    status: 'ongoing',
    color: courseColor,
    sourceUrl: options?.metadata?.sourceUrl || '',
    sheetName: options?.metadata?.sheetName || '',
    sheetIndex: options?.metadata?.sheetIndex || 0,
    lastUpdated: getFormattedDateTime() // Format: "2025-05-20 (14:34)"
  });

  // Update group with course ID
  const updatedGroupCourseIds = [...(groupRecord.courseIds || []), courseRecord.id];
  await updateRecord('groups', groupRecord.id, {
    courseIds: updatedGroupCourseIds
    // We're only updating courseIds, keeping all other properties intact
  });

  // Get header row and extract student data
  const headerRow = jsonData[headerRowIndex];
  const students = await extractStudentData(headerRow, courseRecord.id, groupRecord.id);

  // Update course with student IDs
  await updateRecord('courses', courseRecord.id, {
    studentIds: students.map(s => s.id)
  });

  // Process sessions
  const { sessions, teacherIds, monthIds, firstSessionDate, lastSessionDate } =
    await processSessionData(
      jsonData,
      excelWorksheet,
      headerRowIndex,
      courseRecord,
      groupRecord,
      students,
      options
    );

  // Determine course status
  const courseStatus = determineCourseStatus(sessions);

  // Detect weekday pattern
  const validSessions = sessions.filter(session => session.date);
  const { pattern, outliers, missingDays } = detectWeekdayPatternWithOutliers(validSessions);

  // Update course with final data
  await updateRecord('courses', courseRecord.id, {
    startDate: firstSessionDate || '',
    endDate: lastSessionDate || '',
    sessionIds: courseRecord.sessionIds,
    teacherIds: Array.from(teacherIds),
    status: courseStatus,
    weekdays: {
      pattern: pattern,
      outliers: outliers,
      missingDays: missingDays
    },
    monthIds: Array.from(monthIds),
    lastUpdated: getFormattedDateTime() // Add formatted date/time
  });

  return {
    ...courseRecord,
    sessionCount: sessions.length,
    monthIds: monthIds
  };
};

const determineCourseStatus = (sessions) => {
  if (sessions.length === 0) return 'ongoing';

  // Check if all sessions have dates (no planned future sessions without dates)
  const allSessionsHaveDates = sessions.every(session => !!session.date);

  // Check if all sessions are completed
  const allSessionsCompleted = sessions.every(session => session.status === 'completed');

  // If all sessions have dates and all are completed, mark the course as completed
  if (allSessionsHaveDates && allSessionsCompleted) return 'completed';

  // Otherwise, if there are any ongoing sessions, keep the course ongoing
  return 'ongoing';
};