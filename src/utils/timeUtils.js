// src/utils/timeUtils.js

/**
 * Calculate total teaching hours based on a flat rate of 1.5 hours per session
 * @param {Array} sessions - Array of session objects
 * @returns {number} - Total hours (each session counted as 1.5 hours)
 */
export const calculateTotalHours = (sessions) => {
    if (!sessions || !Array.isArray(sessions) || sessions.length === 0) return 0;
    
    // Each session counts as exactly 1.5 hours
    return sessions.length * 1.5;
  };