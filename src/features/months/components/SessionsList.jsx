// src/features/months/components/SessionsList.jsx
import React from 'react';
import { calculateTotalHours } from '../../utils/timeUtils';

const SessionsList = ({ sessions, courses, teachers }) => {
  if (!sessions.length) {
    return <div className="empty-message">Keine Lektionen in diesem Monat.</div>;
  }

  // Group sessions by course
  const sessionsByCourse = {};
  sessions.forEach(session => {
    const course = courses.find(c => c.id === session.courseId);
    if (course) {
      const courseName = course.name || 'Unbekannter Kurs';
      if (!sessionsByCourse[courseName]) {
        sessionsByCourse[courseName] = [];
      }
      sessionsByCourse[courseName].push(session);
    }
  });

  // Sort course names alphabetically
  const sortedCourses = Object.keys(sessionsByCourse).sort();

  return (
    <div className="tooltip-content">
      {sortedCourses.map(courseName => {
        const courseSessions = sessionsByCourse[courseName];
        // Calculate total sessions count for this course
        const sessionCount = courseSessions.length;
        // Calculate total hours using the utility function
        const totalHours = calculateTotalHours(courseSessions);
        
        return (
          <div key={courseName} className="tooltip-group">
            <div className="group-name">{courseName}</div>
            <div className="group-sessions">
              {courseSessions.map(session => {
                const teacher = teachers.find(t => t.id === session.teacherId) || {};
                return (
                  <div key={session.id} className="session-item">
                    <span className="session-date">{session.date}</span>
                    <span className="session-title">{session.title}</span>
                    <span className="session-course">{teacher.name || 'Unbekannter Lehrer'}</span>
                    <span className="session-duration">
                      {session.duration ? `${session.duration}h` : '-'}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="group-summary">
              {sessionCount} Lektionen ({totalHours.toFixed(1)}h)
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SessionsList;