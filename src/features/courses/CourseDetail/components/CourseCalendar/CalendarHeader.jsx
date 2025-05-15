// src/features/courses/CourseDetail/components/CourseCalendar/CalendarHeader.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLink } from '@fortawesome/free-solid-svg-icons';

const CalendarHeader = ({ 
  startDateStr, 
  endDateStr, 
  formatShortDate, 
  startDate, 
  customTitle = "Kurs Kalender",
  sourceUrl // Add this new prop
}) => {
  const currentYear = startDate ? startDate.getFullYear() : new Date().getFullYear();
  
  // Function to handle URL click
  const handleUrlClick = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    if (sourceUrl) {
      window.open(sourceUrl, '_blank', 'noopener,noreferrer');
    }
  };
  
  return (
    <div className="calendar-header">
      <div className="calendar-title-section">
        <div className="calendar-title-container">
          <h2 className="calendar-title">{customTitle}</h2>
          {sourceUrl && (
            <span 
              className="calendar-source-url" 
              onClick={handleUrlClick}
              title="Open Google Sheet"
            >
              <FontAwesomeIcon icon={faLink} />
            </span>
          )}
        </div>
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