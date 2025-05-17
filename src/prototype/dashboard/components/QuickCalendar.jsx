// src/prototype/dashboard/components/QuickCalendar.jsx
import React from 'react';
import './components.css'; 

const QuickCalendar = () => {
  const today = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Mock upcoming events
  const upcomingEvents = [
    { date: '2025-02-20', title: 'End of Month Assessment' },
    { date: '2025-02-28', title: 'Teacher Meeting' }
  ];
  
  return (
    <div className="quick-calendar-card">
      <h3>Calendar</h3>
      <div className="calendar-header">
        <div className="current-month">{monthNames[today.getMonth()]} {today.getFullYear()}</div>
        <div className="today-indicator">Today: {today.getDate()} {monthNames[today.getMonth()]}</div>
      </div>
      <div className="upcoming-events">
        <h4>Upcoming Events</h4>
        {upcomingEvents.map((event, index) => (
          <div key={index} className="event-item">
            <div className="event-date">{formatDate(event.date)}</div>
            <div className="event-title">{event.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;
};

export default QuickCalendar;