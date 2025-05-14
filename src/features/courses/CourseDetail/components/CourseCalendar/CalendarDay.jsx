// src/features/courses/CourseDetail/components/CourseCalendar/CalendarDay.jsx
import React from 'react';

const CalendarDay = ({ day }) => {
  if (!day) return <div className="calendar-day"></div>;
  
  const hasSessionClass = day.hasSession ? 'has-session' : 'no-session';
  const todayClass = day.isToday ? 'today' : '';
  
  return (
    <div className={`calendar-day ${hasSessionClass} ${todayClass}`}>
      {day.day}
    </div>
  );
};

export default CalendarDay;