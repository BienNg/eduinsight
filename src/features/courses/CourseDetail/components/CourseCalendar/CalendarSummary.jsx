// src/features/courses/CourseDetail/components/CourseCalendar/CalendarSummary.jsx
import React from 'react';

const CalendarSummary = ({
  startDateStr,
  lastCompletedDate,
  lastCompletedSession,
  completedSessions,
  totalSessions,
  formatShortDate,
  isCompleted
}) => {
  // Get the session title or use a fallback
  const sessionTitle = lastCompletedSession?.title || 'Keine Stunde';

  return (
    <div className="calendar-summary">
      <div className="calendar-metric">
        <div className="metric-value">{formatShortDate(startDateStr)}</div>
        <div className="metric-label">Start</div>
      </div>
      <div className="calendar-metric">
        <div className="metric-value">{formatShortDate(lastCompletedDate)}</div>
        <div className="metric-label">{sessionTitle}</div>
      </div>
      <div className="calendar-metric">
        <div className="metric-value">{`${completedSessions}/${totalSessions}`}</div>
        <div className="metric-label">Sessions</div>
      </div>
      <div className="status-indicator">
        <div
          className={`status-circle ${isCompleted ? 'completed' : ''}`}
        ></div>
      </div>
    </div>
  );
};

export default CalendarSummary;