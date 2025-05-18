// src/features/months/components/TeachersList.jsx
import React from 'react';
import { calculateTotalHours } from '../../utils/timeUtils';
import '../../styles/TeachersList.css'; // Import the dedicated CSS file

const TeachersList = ({ teachers, sessions, onTeacherSelect, selectedTeacher }) => {
  if (!teachers.length) {
    return <div className="empty-message">Keine Lehrer in diesem Monat.</div>;
  }

  return (
    <div className="compact-teacher-list">
      {teachers.map(teacher => {
        const teacherSessions = sessions.filter(s => s.teacherId === teacher.id);
        const teacherHours = calculateTotalHours(teacherSessions);
        const isSelected = selectedTeacher?.id === teacher.id;
        
        return (
          <div
            className={`compact-teacher-item ${isSelected ? 'selected' : ''}`}
            key={teacher.id}
            onClick={() => onTeacherSelect(teacher)}
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