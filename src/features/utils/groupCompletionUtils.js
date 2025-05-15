// src/features/utils/groupCompletionUtils.js
import { isCourseCompleted } from './courseCompletionUtils';

/**
 * Determines if a group is completed based on B1.2 level course completion
 * @param {Object} group - Group object
 * @param {Array} courses - Array of courses in the group
 * @param {Array} sessions - Array of all sessions
 * @returns {boolean} - True if the group is completed, false otherwise
 */
export const isGroupCompleted = (group, courses, sessions) => {
  // Check if this is a "G" type group
  if (!group.name || !group.name.startsWith('G')) {
    return false;
  }
  
  // Find the B1.2 level course in this group
  const b12Course = courses.find(course => 
    // Match either by groupId (primary) or by group name (fallback)
    (course.groupId === group.id || course.group === group.name) && 
    course.level === 'B1.2'
  );
  
  // If no B1.2 course found, group is not completed
  if (!b12Course) {
    return false;
  }
  
  // Get sessions for this specific course
  const courseSessions = sessions.filter(session => 
    session.courseId === b12Course.id
  );
  
  // Check if the course is completed
  return isCourseCompleted(courseSessions);
};

/**
 * Returns the appropriate color for a group based on completion status
 * @param {boolean} isCompleted - Whether the group is completed
 * @returns {string} - The color code for the group
 */
export const getGroupColor = (isCompleted) => {
  return isCompleted ? '#E3F2FD' : '#2663EB';
};