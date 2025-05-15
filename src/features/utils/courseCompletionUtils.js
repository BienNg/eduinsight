// src/features/utils/courseCompletionUtils.js
/**
 * Determines if a course is completed by checking if the last session is completed
 * @param {Array} sessions - Array of session objects for the course
 * @returns {boolean} - True if the course is completed, false otherwise
 */
export const isCourseCompleted = (sessions) => {
  if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
    return false;
  }
  
  // Sort sessions by date (most recent last)
  const sortedSessions = [...sessions].sort((a, b) => {
    if (!a.date || !b.date) return 0;
    
    const [dayA, monthA, yearA] = a.date.split('.').map(Number);
    const [dayB, monthB, yearB] = b.date.split('.').map(Number);
    
    const dateA = new Date(yearA, monthA - 1, dayA);
    const dateB = new Date(yearB, monthB - 1, dayB);
    
    return dateA - dateB; // Ascending order (oldest first, newest last)
  });
  
  // Get the very last session chronologically
  const lastSession = sortedSessions[sortedSessions.length - 1];
  
  // Check if the last session is completed
  return lastSession?.status === 'completed' || lastSession?.status === 'complete';
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