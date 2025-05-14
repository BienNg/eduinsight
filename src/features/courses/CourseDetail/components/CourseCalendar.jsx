// src/features/courses/CourseDetail/components/CourseCalendar.jsx
import React from 'react';
import '../../../styles/CourseCalendar.css';

const CourseCalendar = ({ course }) => {
  // Dummy data for the calendar
  const startDate = "04.05.2025";
  const currentStatus = "17.05.2025 Laufend";
  
  // Generate dummy calendar data
  const generateCalendarData = () => {
    const weeks = [];
    const daysInMonth = 31;
    const startDay = 3; // Wednesday (0 = Monday, 6 = Sunday)
    
    let currentWeek = Array(startDay).fill(null);
    
    for (let day = 1; day <= daysInMonth; day++) {
      // Add the day to the current week
      currentWeek.push({
        day,
        hasSession: Math.random() > 0.6, // Randomly determine if there's a session
        isToday: day === 17
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
          <span className="calendar-date-range">From 15 Feb - 15 May, 2024</span>
        </div>
        <button className="kurs-start-button">Kurs Start</button>
      </div>
      
      <div className="calendar-summary">
        <div className="calendar-metric">
          <div className="metric-value">{startDate.split('.')[0]}.{startDate.split('.')[1]}</div>
          <div className="metric-label">Start</div>
        </div>
        <div className="calendar-metric">
          <div className="metric-value">{currentStatus.split(' ')[0].split('.')[0]}.{currentStatus.split(' ')[0].split('.')[1]}</div>
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