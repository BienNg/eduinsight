// src/features/months/components/TeacherTooltip.jsx
import React from 'react';
import '../../styles/tooltips/TeacherTooltip.css';

const TeacherTooltip = ({ teacher, sessions, courses, groups }) => {
  if (!teacher || !sessions || sessions.length === 0) {
    return <div className="teacher-tooltip">No sessions found</div>;
  }

  // Group sessions by group
  const sessionsByGroup = {};
  
  sessions.forEach(session => {
    const course = courses.find(c => c.id === session.courseId);
    if (!course) return;
    
    const group = groups.find(g => g.id === course.groupId);
    const groupName = group ? group.name : 'Unknown Group';
    
    if (!sessionsByGroup[groupName]) {
      sessionsByGroup[groupName] = [];
    }
    
    sessionsByGroup[groupName].push({
      ...session,
      courseName: course.name || 'Unknown Course'
    });
  });

  // Sort the groups alphabetically
  const sortedGroups = Object.keys(sessionsByGroup).sort();

  return (
    <div className="teacher-tooltip">
      <div className="tooltip-header">
        <h3>{teacher.name}'s Sessions</h3>
        <div className="tooltip-summary">
          <span>Total: {sessions.length} sessions</span>
        </div>
      </div>
      
      <div className="tooltip-content">
        {sortedGroups.map(groupName => (
          <div key={groupName} className="tooltip-group">
            <div className="group-name">{groupName}</div>
            <div className="group-sessions">
              {sessionsByGroup[groupName].map(session => (
                <div key={session.id} className="session-item">
                  <span className="session-date">{session.date}</span>
                  <span className="session-title">{session.title}</span>
                  <span className="session-course">{session.courseName}</span>
                </div>
              ))}
            </div>
            <div className="group-summary">
              {sessionsByGroup[groupName].length} sessions
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeacherTooltip;