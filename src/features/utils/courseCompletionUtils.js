// src/features/utils/courseCompletionUtils.js

import { getAllRecords } from '../firebase/database';

/**
 * Determines if a course is completed by checking if the last session is completed
 * @param {string} courseId - The ID of the course to check
 * @param {Array} allSessions - Optional - all sessions data if already available
 * @returns {Promise<boolean>} - Promise resolving to true if the course is completed
 */
export const isCourseCompleted = async (courseId, allSessions = null) => {
  if (!courseId) {
    return false;
  }

  try {
    // If sessions aren't provided, fetch them
    const sessions = allSessions || await getAllRecords('sessions');

    // Filter to get only the sessions for this specific course
    const courseSessions = sessions.filter(session => session.courseId === courseId);

    if (!courseSessions || courseSessions.length === 0) {
      return false;
    }

    // Sort sessions by their name/number (assuming titles are like "1_A1.1_Online_VN")
    const sortedSessions = [...courseSessions].sort((a, b) => {
      // Extract the number from the beginning of the title
      const getSessionNumber = (title) => {
        if (!title) return 0;
        const match = title.match(/^(\d+)_/);
        return match ? parseInt(match[1], 10) : 0;
      };

      const numA = getSessionNumber(a.title);
      const numB = getSessionNumber(b.title);

      return numB - numA; // Descending order (highest number first)
    });

    // Get the session with the highest number (the last session)
    const lastSession = sortedSessions[0];

    // A course is completed if the last session has 'completed' status
    const isCompleted = lastSession &&
      (lastSession.status === 'completed' ||
        lastSession.status === 'complete');

    return isCompleted;
  } catch (error) {
    console.error('Error checking course completion:', error);
    return false;
  }
};

/**
 * Synchronous version that checks if a course is completed when all sessions are already available
 * @param {string} courseId - The ID of the course to check
 * @param {Array} allSessions - All sessions data
 * @returns {boolean} - True if the course is completed
 */
export const isCourseCompletedSync = (courseId, allSessions) => {
  if (!courseId || !allSessions || !Array.isArray(allSessions)) {
    return false;
  }

  // Filter to get only the sessions for this specific course
  const courseSessions = allSessions.filter(session => session.courseId === courseId);

  if (courseSessions.length === 0) {
    return false;
  }

  // Sort sessions by their name/number
  const sortedSessions = [...courseSessions].sort((a, b) => {
    // Extract the number from the beginning of the title
    const getSessionNumber = (title) => {
      if (!title) return 0;
      const match = title.match(/^(\d+)_/);
      return match ? parseInt(match[1], 10) : 0;
    };

    const numA = getSessionNumber(a.title);
    const numB = getSessionNumber(b.title);

    return numB - numA; // Descending order (highest number first)
  });

  // Get the session with the highest number (the last session)
  const lastSession = sortedSessions[0];

  // A course is completed if the last session has 'completed' status
  const isCompleted = lastSession &&
    (lastSession.status === 'completed' ||
      lastSession.status === 'complete');

  return isCompleted;
};


/**
 * Returns the appropriate background color for a course badge based on completion status
 * @param {boolean} isCompleted - Whether the course is completed
 * @returns {string} - The color code for the badge
 */
export const getCourseBadgeColor = (isCompleted) => {
  return isCompleted ? '#E3F2FD' : '#2663EB';
};

/**
 * Returns the appropriate text color for a course badge based on completion status
 * @param {boolean} isCompleted - Whether the course is completed
 * @returns {string} - The color code for the text
 */
export const getCourseBadgeTextColor = (isCompleted) => {
  return isCompleted ? '#333333' : '#FFFFFF';
};