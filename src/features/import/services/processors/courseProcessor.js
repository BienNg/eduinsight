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


const updateExistingCourseWithNewSessions = async (
  existingCourse,
  jsonData,
  excelWorksheet,
  headerRowIndex,
  options
) => {

  const monthIds = new Set();

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

            // If session had a previous month, we should also decrement that month's count
            // This would require additional code to manage the month records
          }
        }

        // Rest of updates remain the same
        if (matchingExcelSession.startTime && matchingExcelSession.startTime !== existingSession.startTime) {
          updates.startTime = matchingExcelSession.startTime;
        }

        if (matchingExcelSession.endTime && matchingExcelSession.endTime !== existingSession.endTime) {
          updates.endTime = matchingExcelSession.endTime;
        }

        // Only update if we have actual changes
        if (Object.keys(updates).length > 1) { // More than just status
          // Update the session in the database
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

  // Create a success message with the updated session details
  const updateMessage = `Updated ${updatedSessions.length} sessions in course "${existingCourse.name}": ${updatedSessionTitles.join(', ')}`;

  return {
    ...existingCourse,
    updatedSessionsCount: updatedSessions.length,
    updatedSessionTitles: updatedSessionTitles,
    updateMessage,
    monthIds: Array.from(monthIds)
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
  // Parse Excel file data
  const { workbook, jsonData, excelWorksheet, headerRowIndex } = await parseExcelData(arrayBuffer);

  // Log the options to debug
  console.log("processCourseData received options:", options);

  // Extract course info (group, level, mode) - use metadata if available
  let courseInfo;

  // Check if options contains metadata with groupName
  if (options && options.metadata && options.metadata.groupName) {
    console.log("Using metadata from options:", options.metadata);
    courseInfo = {
      groupName: options.metadata.groupName,
      level: options.metadata.level || '',
      mode: options.metadata.mode || 'Unknown',
      language: options.metadata.language || ''
    };
    
    // Add validation here for metadata-based processing
    if (!courseInfo.level && courseInfo.groupName.charAt(0).toUpperCase() !== 'A') {
      throw new Error(`Level information (e.g., A1, B2.1) is missing for ${courseInfo.groupName}. This is required for non-A type courses.`);
    }
  } else {
    // Fall back to extracting from filename
    console.log("No metadata found, extracting from filename");
    courseInfo = extractCourseInfo(filename, jsonData, workbook.SheetNames[0]);
  }

  // Additional validation to ensure level is detected for non-A courses
  if (courseInfo.groupName.charAt(0).toUpperCase() !== 'A' && !courseInfo.level) {
    throw new Error(`Level information (e.g., A1, B2.1) not found for ${courseInfo.groupName}. Please include level information in the filename.`);
  }

  // Create or get group record - PASS THE MODE CORRECTLY
  const groupRecord = await getOrCreateGroupRecord(courseInfo.groupName, courseInfo.mode);
  

  // Get color for the course
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
    color: courseColor
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
    monthIds: Array.from(monthIds)
  });

  return {
    ...courseRecord,
    sessionCount: sessions.length,
    monthIds: monthIds
  };
};

const determineCourseStatus = (sessions) => {
  if (sessions.length === 0) return 'ongoing';

  const hasAnyOngoingSessions = sessions.some(session => session.status === 'ongoing');
  if (hasAnyOngoingSessions) return 'ongoing';

  const allSessionsCompleted = sessions.every(session => session.status === 'completed');
  if (allSessionsCompleted) return 'completed';

  return 'ongoing';
};

export default {
  processCourseData
};