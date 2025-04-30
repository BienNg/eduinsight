/**
 * Checks if a session is considered "long" (at least 1h50m)
 * @param {string} startTime - Start time in format "HH:MM"
 * @param {string} endTime - End time in format "HH:MM"
 * @returns {boolean} - True if session duration is at least 1h50m
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
    
    // Check if duration is at least 1h50m (110 minutes)
    return durationMinutes >= 110;
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

  /**
 * Detects weekday patterns and outliers from a collection of sessions
 * @param {Array} sessions - Array of session objects with date property
 * @returns {Object} Object containing pattern weekdays, outliers, and missing days
 */
export const detectWeekdayPatternWithOutliers = (sessions) => {
  if (!sessions || sessions.length === 0) return { pattern: [], outliers: [] };
  
  // Set Monday as first day of week (Mon = 0, Tue = 1, ..., Sun = 6)
  const weekdayCounts = [0, 0, 0, 0, 0, 0, 0]; // Mon, Tue, Wed, Thu, Fri, Sat, Sun
  const weekdayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Track dates by weekday for outlier detection
  const sessionsByWeekday = [[], [], [], [], [], [], []]; // Array of session dates for each weekday
  
  let earliestDate = null;
  let latestDate = null;
  
  // First pass: count weekdays and collect dates
  sessions.forEach(session => {
    if (session.date) {
      // Convert date string (DD.MM.YYYY) to Date object
      const [day, month, year] = session.date.split('.').map(Number);
      if (day && month && year) {
        const date = new Date(year, month - 1, day);
        
        // Track date range
        if (!earliestDate || date < earliestDate) earliestDate = date;
        if (!latestDate || date > latestDate) latestDate = date;
        
        // Convert to Monday-first format
        const jsWeekday = date.getDay(); // 0-6 (Sunday-Saturday)
        const mondayFirstWeekday = jsWeekday === 0 ? 6 : jsWeekday - 1;
        
        weekdayCounts[mondayFirstWeekday]++;
        
        // Store the session for this weekday
        sessionsByWeekday[mondayFirstWeekday].push({
          date: session.date,
          jsDate: date,
          sessionId: session.id
        });
      }
    }
  });
  
  if (!earliestDate || !latestDate) return { pattern: [], outliers: [] };
  
  // Calculate course duration in weeks
  const courseDurationMs = latestDate - earliestDate;
  const courseDurationWeeks = Math.ceil(courseDurationMs / (7 * 24 * 60 * 60 * 1000));
  
  // Identify the pattern weekdays
  const patternDays = [];
  const consistencyThreshold = 0.6; // 60% consistency requirement
  
  weekdayCounts.forEach((count, index) => {
    const consistency = count / courseDurationWeeks;
    if (consistency >= consistencyThreshold && count >= 2) {
      patternDays.push(index);
    }
  });
  
  // Find outliers - sessions on non-pattern days
  const outliers = [];
  for (let i = 0; i < 7; i++) {
    // If this weekday is not part of the pattern but has sessions
    if (!patternDays.includes(i) && sessionsByWeekday[i].length > 0) {
      // All these sessions are outliers
      sessionsByWeekday[i].forEach(session => {
        outliers.push({
          date: session.date,
          weekday: weekdayNames[i],
          sessionId: session.sessionId
        });
      });
    }
  }
  
  // Find missing pattern days - expected pattern days without sessions
  const missingDays = [];
  
  // Only check for missing days if we have a clear pattern
  if (patternDays.length > 0) {
    // Create a set of all dates within course duration
    let currentDate = new Date(earliestDate);
    while (currentDate <= latestDate) {
      const jsWeekday = currentDate.getDay();
      const mondayFirstWeekday = jsWeekday === 0 ? 6 : jsWeekday - 1;
      
      // If this day should have a session according to the pattern
      if (patternDays.includes(mondayFirstWeekday)) {
        // Check if we actually have a session on this date
        const dateString = `${currentDate.getDate().toString().padStart(2, '0')}.${(currentDate.getMonth() + 1).toString().padStart(2, '0')}.${currentDate.getFullYear()}`;
        
        // Find if any session has this date
        const hasSession = sessions.some(session => session.date === dateString);
        
        if (!hasSession) {
          missingDays.push({
            date: dateString,
            weekday: weekdayNames[mondayFirstWeekday]
          });
        }
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
  
  return {
    pattern: patternDays.sort().map(index => weekdayNames[index]),
    outliers: outliers,
    missingDays: missingDays
  };
};

/**
 * Calculates session duration based on group type and mode
 * @param {string} groupType - Group type (G, A, P, M) from the group record
 * @param {string} groupMode - Group mode (Online, Offline) from the group record
 * @param {boolean} isFirstSession - Whether this is the first session in the course
 * @param {string} startTime - Session start time (HH:MM)
 * @param {string} endTime - Session end time (HH:MM)
 * @returns {number} - Duration in hours
 */
export const calculateSessionDuration = (groupType, groupMode, isFirstSession, startTime, endTime) => {
  // G-Online special case
  if (groupType === 'G' && groupMode === 'Online') {
    // Only if it's first session AND actual duration is long
    if (isFirstSession && startTime && endTime && isLongSession(startTime, endTime)) {
      return 2.0;
    } else {
      return 1.5; // Standard G-Online duration
    }
  }
  
  // Other group types
  if (groupType === 'G' && groupMode === 'Offline') {
    return 2.5; // G-Offline
  } else if (groupType === 'A' || groupType === 'P') {
    return 1.5; // A and P courses
  } else if (groupType === 'M') {
    return 1.25; // M courses
  }
  
  // Default fallback
  return 1.5;
};