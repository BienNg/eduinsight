// src/features/utils/dateQueryUtils.js

import { getRecordById, getAllRecords } from '../firebase/database';
import { isLongSession } from './sessionUtils';

/**
 * Gets the range for the current month (first day and last day)
 * @returns {Object} Object with firstDay and lastDay Date objects
 */
export const getCurrentMonthRange = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { firstDay, lastDay };
};

/**
 * Gets the range for the previous month (first day and last day)
 * @returns {Object} Object with firstDay and lastDay Date objects
 */
export const getPreviousMonthRange = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
  return { firstDay, lastDay };
};

/**
 * Formats a date into a month ID string (MM.YYYY)
 * @param {Date} date - Date object to format
 * @returns {string} Month ID in format MM.YYYY
 */
export const formatMonthId = (date) => {
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${month}.${year}`;
};

/**
 * Gets sessions for a specific month
 * @param {string} monthId - Month ID in format MM.YYYY
 * @returns {Promise<Array>} Array of session objects for this month
 */
export const getSessionsByMonth = async (monthId) => {
  try {
    // This is a placeholder - implement according to your database structure
    // You might need to fetch all sessions and filter by date, or
    // have a query mechanism in your database to get sessions by month
    
    // Example implementation:
    const allSessions = await getAllSessions();
    return allSessions.filter(session => {
      if (!session.date) return false;
      
      const dateParts = session.date.split('.');
      if (dateParts.length !== 3) return false;
      
      const sessionMonthId = `${dateParts[1]}.${dateParts[2]}`;
      return sessionMonthId === monthId;
    });
  } catch (error) {
    console.error(`Error fetching sessions for month ${monthId}:`, error);
    throw error;
  }
};

/**
 * Gets all sessions from the database
 * @returns {Promise<Array>} Array of all session objects
 */
const getAllSessions = async () => {
  // Implement according to your database structure
  // This is a placeholder function
  try {
    // You might have a function like this in your database.js
    // Placeholder example:
    const sessionsData = await getAllRecords('sessions');
    return sessionsData;
  } catch (error) {
    console.error("Error fetching all sessions:", error);
    throw error;
  }
};

/**
 * Gets current month sessions for a specific teacher
 * @param {string} teacherId - ID of the teacher
 * @returns {Promise<Array>} Array of session objects for this teacher
 */
export const getTeacherCurrentMonthData = async (teacherId) => {
  try {
    // Get current month sessions
    const { firstDay } = getCurrentMonthRange();
    const monthId = formatMonthId(firstDay);
    const monthSessions = await getSessionsByMonth(monthId);
    
    // Filter for this teacher
    const teacherSessions = monthSessions.filter(session => session.teacherId === teacherId);
    
    // Get courses for these sessions
    return processTeacherSessions(teacherSessions);
  } catch (error) {
    console.error(`Error fetching current month data for teacher ${teacherId}:`, error);
    throw error;
  }
};

/**
 * Gets previous month sessions for a specific teacher
 * @param {string} teacherId - ID of the teacher
 * @returns {Promise<Array>} Array of session objects for this teacher
 */
export const getTeacherPreviousMonthData = async (teacherId) => {
  try {
    // Get previous month sessions
    const { firstDay } = getPreviousMonthRange();
    const monthId = formatMonthId(firstDay);
    const monthSessions = await getSessionsByMonth(monthId);
    
    // Filter for this teacher
    const teacherSessions = monthSessions.filter(session => session.teacherId === teacherId);
    
    // Get courses for these sessions
    return processTeacherSessions(teacherSessions);
  } catch (error) {
    console.error(`Error fetching previous month data for teacher ${teacherId}:`, error);
    throw error;
  }
};

/**
 * Helper function to process teacher sessions and group by course
 * @param {Array} teacherSessions - Array of sessions for a teacher
 * @returns {Promise<Array>} Processed data grouped by course
 */
const processTeacherSessions = async (teacherSessions) => {
  // Get all unique course IDs from the sessions
  const courseIds = [...new Set(teacherSessions.map(session => session.courseId))];
  
  // Fetch course data for each course ID
  const coursePromises = courseIds.map(courseId => 
    getRecordById('courses', courseId)
  );
  const coursesData = await Promise.all(coursePromises);
  const validCourses = coursesData.filter(course => course !== null);
  
  // Group sessions by course and calculate stats
  const courseSessionMap = {};
  
  teacherSessions.forEach(session => {
    if (!courseSessionMap[session.courseId]) {
      const course = validCourses.find(c => c.id === session.courseId);
      if (!course) return; // Skip if course not found
      
      courseSessionMap[session.courseId] = {
        course,
        sessions: [],
        totalHours: 0,
        longSessionsCount: 0
      };
    }
    
    courseSessionMap[session.courseId].sessions.push(session);
    const isLong = isLongSession(session.startTime, session.endTime);
    courseSessionMap[session.courseId].totalHours += isLong ? 2 : 1.5;
    if (isLong) {
      courseSessionMap[session.courseId].longSessionsCount++;
    }
  });
  
  return Object.values(courseSessionMap);
};

// Export additional functions needed by TeacherDetail.jsx
export { getCurrentMonthSessions, getPreviousMonthSessions };

/**
 * Gets sessions for the current month
 * @returns {Promise<Array>} Array of session objects for the current month
 */
async function getCurrentMonthSessions() {
  const { firstDay } = getCurrentMonthRange();
  const monthId = formatMonthId(firstDay);
  return getSessionsByMonth(monthId);
}

/**
 * Gets sessions for the previous month
 * @returns {Promise<Array>} Array of session objects for the previous month
 */
async function getPreviousMonthSessions() {
  const { firstDay } = getPreviousMonthRange();
  const monthId = formatMonthId(firstDay);
  return getSessionsByMonth(monthId);
}