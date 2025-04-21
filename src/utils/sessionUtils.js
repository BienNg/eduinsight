/**
 * Checks if a session is considered "long" (around 2 hours)
 * @param {string} startTime - Start time in format "HH:MM"
 * @param {string} endTime - End time in format "HH:MM"
 * @returns {boolean} - True if session duration is between 1h50m and 2h10m
 */
export const isLongSession = (startTime, endTime) => {
    if (!startTime || !endTime) return false;
    
    try {
      // Parse time strings
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      
      // Calculate total minutes
      const startTotalMinutes = startHours * 60 + startMinutes;
      const endTotalMinutes = endHours * 60 + endMinutes;
      
      // Calculate duration in minutes
      let durationMinutes = endTotalMinutes - startTotalMinutes;
      
      // Handle sessions that cross midnight
      if (durationMinutes < 0) {
        durationMinutes += 24 * 60;
      }
      
      // Check if duration is between 1h50m (110 minutes) and 2h10m (130 minutes)
      return durationMinutes >= 110 && durationMinutes <= 130;
    } catch (error) {
      console.error("Error calculating session duration:", error);
      return false;
    }
  };
  
  /**
   * Counts long sessions in an array of sessions
   * @param {Array} sessions - Array of session objects
   * @returns {number} - Count of long sessions
   */
  export const countLongSessions = (sessions) => {
    if (!sessions || !Array.isArray(sessions)) return 0;
    return sessions.filter(session => isLongSession(session.startTime, session.endTime)).length;
  };