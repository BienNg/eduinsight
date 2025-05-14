// src/features/courses/CourseDetail/components/CourseCalendar.jsx
import React from 'react';
import '../../../styles/CourseCalendar.css';

const CourseCalendar = ({ course, sessions = [] }) => {
  // Extract actual dates from sessions
  const sortedSessions = [...sessions].sort((a, b) => {
    // Helper function to parse German date format (DD.MM.YYYY)
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      const [day, month, year] = dateStr.split('.').map(Number);
      return new Date(year, month - 1, day);
    };
    
    const dateA = parseDate(a.date);
    const dateB = parseDate(b.date);
    
    if (!dateA) return 1;
    if (!dateB) return -1;
    
    return dateA - dateB;
  });
  
  // Get the first session date
  const firstSession = sortedSessions.length > 0 ? sortedSessions[0] : null;
  
  // Get the last completed session
  const lastCompletedSession = [...sortedSessions]
    .filter(session => session.status === "completed" || session.status === "complete")
    .pop(); // Get the last one after filtering
  
  const startDate = firstSession?.date || "N/A";
  const lastCompletedDate = lastCompletedSession?.date || "N/A";
  
  // Format for display (DD.MM)
  const formatShortDate = (dateStr) => {
    if (!dateStr || dateStr === "N/A") return "N/A";
    const parts = dateStr.split('.');
    if (parts.length < 2) return dateStr;
    return `${parts[0]}.${parts[1]}`;
  };
  
  // Generate calendar data
  const generateCalendarData = () => {
    const weeks = [];
    const daysInMonth = 31;
    const startDay = 3; // Wednesday (0 = Monday, 6 = Sunday)
    
    // Create a map of dates with sessions
    const sessionDays = new Map();
    sortedSessions.forEach(session => {
      if (session.date) {
        const day = parseInt(session.date.split('.')[0]);
        sessionDays.set(day, true);
      }
    });
    
    // Get today's day of month
    const today = new Date().getDate();
    
    let currentWeek = Array(startDay).fill(null);
    
    for (let day = 1; day <= daysInMonth; day++) {
      // Add the day to the current week
      currentWeek.push({
        day,
        hasSession: sessionDays.has(day),
        isToday: day === today
      });
      
      // If we've reached Sunday (end of the week) or the last day of the month
      if (currentWeek.length === 7 || day === daysInMonth) {
        // Fill the rest of the week with null for days in the next month
        while (currentWeek.length < 7) {
          currentWeek.push(null);
        }
        
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    
    return weeks;
  };
  
  const calendarData = generateCalendarData();
  
  return (
    <div className="course-calendar overview-panel animate-card">
      <div className="calendar-header">
        <div className="calendar-title-section">
          <h2 className="calendar-title">Kurs Kalender</h2>
          <span className="calendar-date-range">
            {startDate !== "N/A" && lastCompletedDate !== "N/A" 
              ? `From ${formatShortDate(startDate)} - ${formatShortDate(lastCompletedDate)}, ${new Date().getFullYear()}`
              : startDate !== "N/A" ? `From ${formatShortDate(startDate)}` : "No sessions scheduled"}
          </span>
        </div>
        <button className="kurs-start-button">Kurs Start</button>
      </div>
      
      <div className="calendar-summary">
        <div className="calendar-metric">
          <div className="metric-value">{formatShortDate(startDate)}</div>
          <div className="metric-label">Start</div>
        </div>
        <div className="calendar-metric">
          <div className="metric-value">{formatShortDate(lastCompletedDate)}</div>
          <div className="metric-label">Laufend</div>
        </div>
        <div className="status-indicator">
          <div className="status-circle"></div>
        </div>
      </div>
      
      <div className="calendar-grid">
        <div className="calendar-days-header">
          <div className="day-header">M</div>
          <div className="day-header">D</div>
          <div className="day-header">M</div>
          <div className="day-header">D</div>
          <div className="day-header">F</div>
          <div className="day-header">S</div>
          <div className="day-header">S</div>
        </div>
        
        {calendarData.map((week, weekIndex) => (
          <div key={`week-${weekIndex}`} className="calendar-week">
            {week.map((day, dayIndex) => (
              <div 
                key={`day-${weekIndex}-${dayIndex}`} 
                className={`calendar-day ${day ? (day.hasSession ? 'has-session' : 'no-session') : ''} ${day?.isToday ? 'today' : ''}`}
              >
                {day && day.day}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseCalendar;