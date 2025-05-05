// src/features/import/services/processors/courseProcessor.js
import * as XLSX from 'xlsx';
import { createRecord, updateRecord } from '../../../firebase/database';
import { getOrCreateGroupRecord, getNextCourseColor } from '../firebaseService';
import { findExistingCourse } from '../firebaseService';
import { detectWeekdayPatternWithOutliers } from '../../../utils/sessionUtils';
import { processSessionData } from './sessionProcessor';
import { extractStudentData } from './studentProcessor';
import { 
  parseExcelData, 
  extractCourseInfo 
} from '../parsers/excelParser';

export const processCourseData = async (arrayBuffer, filename, options) => {
  // Parse Excel file data
  const { workbook, jsonData, excelWorksheet, headerRowIndex } = await parseExcelData(arrayBuffer);
  
  // Extract course info (group, level, mode)
  const courseInfo = extractCourseInfo(filename, jsonData, workbook.SheetNames[0]);
  
  // Check if course already exists
  const existingCourse = await findExistingCourse(courseInfo.groupName, courseInfo.level);
  if (existingCourse) {
    const latestSessionInfo = existingCourse.latestSessionDate
      ? `The latest session recorded is on the ${existingCourse.latestSessionDate}`
      : 'No sessions have been recorded yet';
    throw new Error(`The Course ${existingCourse.name} already exists. ${latestSessionInfo}.`);
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