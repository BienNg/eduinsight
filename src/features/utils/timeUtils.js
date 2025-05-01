/**
 * Calculate total teaching hours based on completed session durations
 * @param {Array} sessions - Array of session objects with duration and date properties
 * @returns {number} - Total hours summed from all completed session durations
 */
export const calculateTotalHours = (sessions) => {
  if (!sessions || !Array.isArray(sessions) || sessions.length === 0) return 0;
  
  const today = new Date();
  
  // Sum durations of only completed sessions
  return sessions.reduce((total, session) => {
      // Skip sessions without dates or with future dates
      if (!session.date) return total;
      
      // Parse date from DD.MM.YYYY format
      const [day, month, year] = session.date.split('.').map(Number);
      const sessionDate = new Date(year, month - 1, day);
      
      // Only count sessions that have already occurred
      if (sessionDate <= today && session.duration) {
          return total + session.duration;
      }
      
      return total;
  }, 0);
};