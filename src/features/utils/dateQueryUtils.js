// src/features/utils/dateQueryUtils.js
import { ref, query, orderByChild, startAt, endAt, get, equalTo } from "firebase/database";
import { database } from "../firebase/config";

/**
 * Gets the first and last day of the current month
 * @returns {Object} Object with firstDay and lastDay dates
 */
export const getCurrentMonthRange = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { firstDay, lastDay };
};

/**
 * Gets the first and last day of the previous month
 * @returns {Object} Object with firstDay and lastDay dates
 */
export const getPreviousMonthRange = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
  return { firstDay, lastDay };
};

/**
 * Formats date as YYYY-MM
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatMonthId = (date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Gets courses for a specific month
 * @param {string} monthId - Month ID in format 'YYYY-MM'
 * @returns {Promise<Array>} Array of course objects
 */
export const getCoursesByMonth = async (monthId) => {
  try {
    // First get the month record to find associated courseIds
    const monthRef = ref(database, `months/${monthId}`);
    const monthSnapshot = await get(monthRef);
    
    if (!monthSnapshot.exists() || !monthSnapshot.val().courseIds) {
      return [];
    }
    
    const courseIds = monthSnapshot.val().courseIds;
    
    // Batch fetch all courses at once
    const promises = courseIds.map(courseId => 
      get(ref(database, `courses/${courseId}`))
    );
    
    const courseSnapshots = await Promise.all(promises);
    
    // Map results to array of course objects
    return courseSnapshots
      .filter(snapshot => snapshot.exists())
      .map(snapshot => snapshot.val());
  } catch (error) {
    console.error(`Error fetching courses for month ${monthId}:`, error);
    throw error;
  }
};

/**
 * Gets sessions for a specific month
 * @param {string} monthId - Month ID in format 'YYYY-MM'
 * @returns {Promise<Array>} Array of session objects
 */
export const getSessionsByMonth = async (monthId) => {
  try {
    // Query sessions directly by monthId
    const sessionsRef = ref(database, 'sessions');
    const sessionsQuery = query(sessionsRef, orderByChild('monthId'), equalTo(monthId));
    const snapshot = await get(sessionsQuery);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    // Convert to array
    const sessions = [];
    snapshot.forEach(childSnapshot => {
      sessions.push(childSnapshot.val());
    });
    
    return sessions;
  } catch (error) {
    console.error(`Error fetching sessions for month ${monthId}:`, error);
    throw error;
  }
};

/**
 * Gets courses for the current month
 * @returns {Promise<Array>} Array of course objects
 */
export const getCurrentMonthCourses = async () => {
  const { firstDay } = getCurrentMonthRange();
  const monthId = formatMonthId(firstDay);
  return getCoursesByMonth(monthId);
};

/**
 * Gets courses for the previous month
 * @returns {Promise<Array>} Array of course objects
 */
export const getPreviousMonthCourses = async () => {
  const { firstDay } = getPreviousMonthRange();
  const monthId = formatMonthId(firstDay);
  return getCoursesByMonth(monthId);
};

/**
 * Gets sessions for the current month
 * @returns {Promise<Array>} Array of session objects
 */
export const getCurrentMonthSessions = async () => {
  const { firstDay } = getCurrentMonthRange();
  const monthId = formatMonthId(firstDay);
  return getSessionsByMonth(monthId);
};

/**
 * Gets sessions for the previous month
 * @returns {Promise<Array>} Array of session objects
 */
export const getPreviousMonthSessions = async () => {
  const { firstDay } = getPreviousMonthRange();
  const monthId = formatMonthId(firstDay);
  return getSessionsByMonth(monthId);
};