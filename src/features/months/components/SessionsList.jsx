import React from 'react';

const SessionsList = ({ sessions, courses, teachers }) => {
  if (!sessions.length) {
    return <div className="empty-message">Keine Lektionen in diesem Monat.</div>;
  }

  const displaySessions = sessions.slice(0, 10);
  const hiddenCount = sessions.length - 10;

  return (
    <div className="compact-session-list">
      {displaySessions.map(session => {
        const course = courses.find(c => c.id === session.courseId) || {};
        const teacher = teachers.find(t => t.id === session.teacherId) || {};
        return (
          <div className="compact-session-item" key={session.id}>
            <div className="session-main-info">
              <div className="session-date">{session.date}</div>
              <div className="session-title">{session.title}</div>
            </div>
            <div className="session-meta">
              <span className="meta-course">{course.name || 'Unbekannter Kurs'}</span>
              <span className="meta-teacher">{teacher.name || 'Unbekannter Lehrer'}</span>
            </div>
          </div>
        );
      })}
      {hiddenCount > 0 && (
        <div className="more-items-hint">
          +{hiddenCount} weitere Lektionen
        </div>
      )}
    </div>
  );
};

export default SessionsList;