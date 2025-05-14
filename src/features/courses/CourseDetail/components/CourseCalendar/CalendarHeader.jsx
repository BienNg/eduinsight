// src/features/courses/CourseDetail/components/CourseCalendar/CalendarHeader.jsx
import React from 'react';

const CalendarHeader = ({ startDateStr, endDateStr, formatShortDate, startDate }) => {
  const currentYear = startDate ? startDate.getFullYear() : new Date().getFullYear();
  
  return (
    <div className="calendar-header">
      <div className="calendar-title-section">
        <h2 className="calendar-title">Kurs Kalender</h2>
        <span className="calendar-date-range">
          {startDateStr !== "N/A" && endDateStr !== "N/A" 
            ? `From ${formatShortDate(startDateStr)} - ${formatShortDate(endDateStr)}, ${currentYear}`
            : startDateStr !== "N/A" ? `From ${formatShortDate(startDateStr)}` : "No sessions scheduled"}
        </span>
      </div>
      <button className="kurs-start-button">Kurs Start</button>
    </div>
  );
};

export default CalendarHeader;