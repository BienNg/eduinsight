// src/features/courses/CourseDetail/components/CourseCalendar/CalendarHeader.jsx
import React from 'react';

// Add customTitle as a prop with a default value
const CalendarHeader = ({ startDateStr, endDateStr, formatShortDate, startDate, customTitle = "Kurs Kalender" }) => {
  const currentYear = startDate ? startDate.getFullYear() : new Date().getFullYear();
  
  return (
    <div className="calendar-header">
      <div className="calendar-title-section">
        {/* Use the customTitle instead of hardcoded "Kurs Kalender" */}
        <h2 className="calendar-title">{customTitle}</h2>
        <span className="calendar-date-range">
          {startDateStr !== "N/A" && endDateStr !== "N/A" 
            ? `From ${formatShortDate(startDateStr)} - ${formatShortDate(endDateStr)}, ${currentYear}`
            : startDateStr !== "N/A" ? `From ${formatShortDate(startDateStr)}` : "No sessions scheduled"}
        </span>
      </div>
    </div>
  );
};

export default CalendarHeader;