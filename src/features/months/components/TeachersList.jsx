import React from 'react';
import { calculateTotalHours } from '../../utils/timeUtils';

const TeachersList = ({ teachers, sessions, onTeacherHover }) => {
  if (!teachers.length) {
    return <div className="empty-message">Keine Lehrer in diesem Monat.</div>;
  }

  return (
    <div className="compact-teacher-list">
      {teachers.map(teacher => {
        const teacherSessions = sessions.filter(s => s.teacherId === teacher.id);
        const teacherHours = calculateTotalHours(teacherSessions);
        return (
          <div
            className="compact-teacher-item"
            key={teacher.id}
            onMouseEnter={(e) => onTeacherHover(teacher, e)}
            onMouseLeave={() => {}}
          >
            <div className="teacher-name">{teacher.name}</div>
            <div className="teacher-meta">
              <span>{teacherSessions.length} Lektionen</span>
              <span>{teacherHours.toFixed(1)}h</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TeachersList;