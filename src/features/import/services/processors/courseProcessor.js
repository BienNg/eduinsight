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

const updateExistingCourseWithNewSessions = async (
  existingCourse,
  jsonData,
  excelWorksheet,
  headerRowIndex,
  options
) => {
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

  // Get the students for this course
  const students = [];
  for (const studentId of existingCourse.studentIds) {
    const student = await getRecordById('students', studentId);
    if (student) {
      students.push({
        id: student.id,
        name: student.name,
        columnIndex: -1 // We don't know the column index from the DB
      });
    }
  }

  // Process header row to find column indices
  const headerRow = jsonData[headerRowIndex];

  // Map student names to column indices
  for (let j = 10; j < headerRow.length; j++) {
    const studentName = headerRow[j];
    if (studentName && typeof studentName === 'string' && studentName.trim() !== '') {
      // Skip column headers
      if (studentName === "Anwesenheitsliste" ||
        studentName.includes("Nachrichten von/ für")) {
        continue;
      }

      // Match student name to our existing students
      for (const student of students) {
        if (studentName.trim().toLowerCase() === student.name.trim().toLowerCase()) {
          student.columnIndex = j;
          break;
        }
      }
    }
  }

  // Process the new sessions from the Excel file
  const { sessions: newSessionsData } = await processSessionData(
    jsonData,
    excelWorksheet,
    headerRowIndex,
    { ...existingCourse, sessionIds: [] }, // Create a copy with empty sessionIds to avoid duplicates
    groupRecord,
    students,
    options
  );

  // Filter to only keep completed sessions that are not already in the database
  const newCompletedSessions = newSessionsData.filter(newSession => {
    // Check if this is a completed session
    if (newSession.status !== 'completed') return false;

    // Check if we already have this session by matching title and date
    const existingSession = existingSessions.find(
      existing => existing.title === newSession.title && existing.date === newSession.date
    );

    // It's a new session if it doesn't exist or was previously not completed
    return !existingSession || existingSession.status !== 'completed';
  });

  if (newCompletedSessions.length === 0) {
    throw new Error(
      `No new completed sessions found for course "${existingCourse.name}". ` +
      `The course already exists with ${existingSessions.length} sessions. ` +
      `The latest session recorded is on ${existingCourse.latestSessionDate || 'unknown date'}.`
    );
  }

  // Add the new sessions to the existing course
  const updatedSessionIds = [...existingCourse.sessionIds];
  const updatedTeacherIds = new Set(existingCourse.teacherIds || []);
  const updatedMonthIds = new Set(existingCourse.monthIds || []);
  const updatedSessionTitles = [];

  for (const session of newCompletedSessions) {
    updatedSessionIds.push(session.id);
    updatedSessionTitles.push(session.title);

    if (session.teacherId) {
      updatedTeacherIds.add(session.teacherId);
    }

    if (session.monthId) {
      updatedMonthIds.add(session.monthId);
    }
  }

  // Update the course record with new session IDs and other updated data
  await updateRecord('courses', existingCourse.id, {
    sessionIds: updatedSessionIds,
    teacherIds: Array.from(updatedTeacherIds),
    monthIds: Array.from(updatedMonthIds)
  });

  // Create a success message with the updated session details
  const updateMessage = `Updated existing course "${existingCourse.name}" with ${newCompletedSessions.length} new completed sessions: ${updatedSessionTitles.join(', ')}`;

  return {
    ...existingCourse,
    sessionIds: updatedSessionIds,
    teacherIds: Array.from(updatedTeacherIds),
    monthIds: Array.from(updatedMonthIds),
    sessionCount: updatedSessionIds.length,
    updatedSessionsCount: newCompletedSessions.length,
    updatedSessionTitles: updatedSessionTitles,
    updateMessage: `Updated existing course "${existingCourse.name}" with ${newCompletedSessions.length} new completed sessions: ${updatedSessionTitles.join(', ')}`
  };

};

export const processCourseData = async (arrayBuffer, filename, options) => {
  // Parse Excel file data
  const { workbook, jsonData, excelWorksheet, headerRowIndex } = await parseExcelData(arrayBuffer);

  // Extract course info (group, level, mode)
  const courseInfo = extractCourseInfo(filename, jsonData, workbook.SheetNames[0]);

  // Check if course already exists
  const existingCourse = await findExistingCourse(courseInfo.groupName, courseInfo.level);
  if (existingCourse) {
    return await updateExistingCourseWithNewSessions(
      existingCourse,
      jsonData,
      excelWorksheet,
      headerRowIndex,
      options
    );
  }

  // Create or get group record
  const groupRecord = await getOrCreateGroupRecord(courseInfo.groupName, courseInfo.mode);
  if (!groupRecord || !groupRecord.id) {
    throw new Error("Failed to process file: Could not create group record");
  }

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