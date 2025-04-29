// src/features/courses/components/CourseDetailPanel.jsx
import React from 'react';
import ProgressBar from '../../common/ProgressBar';
import { useNavigate } from 'react-router-dom';

const CourseDetailPanel = ({ course, students, sessions, loading }) => {
  const navigate = useNavigate();

  if (loading) {
    return <div className="course-detail-loading">Loading course details...</div>;
  }

  if (!course) {
    return (
      <div className="no-course-selected">
        <p>Wählen Sie einen Kurs aus, um Details anzuzeigen</p>
      </div>
    );
  }

  // Calculate stats
  const sessionCount = sessions.length;
  const studentsCount = students.length;
  const completedSessions = sessions.filter(s => s.status === 'completed').length;
  const completionRate = sessionCount > 0 ? Math.round((completedSessions / sessionCount) * 100) : 0;

  // Calculate attendance rate
  let totalAttendances = 0;
  let totalPossibleAttendances = 0;

  sessions.forEach(session => {
    if (session.attendance) {
      const attendanceEntries = Object.values(session.attendance);
      const presentCount = attendanceEntries.filter(entry => 
        (typeof entry === 'object' ? entry.status === 'present' : entry === 'present')
      ).length;
      
      totalAttendances += presentCount;
      totalPossibleAttendances += attendanceEntries.length;
    }
  });

  const attendanceRate = totalPossibleAttendances > 0 
    ? Math.round((totalAttendances / totalPossibleAttendances) * 100) 
    : 0;

  // Navigate to full course detail view
  const viewFullDetails = () => {
    navigate(`/courses/${course.id}`);
  };

  return (
    <div className="course-detail-panel animate-card">
      <div className="panel-header">
        <h2 className="panel-title">{course.name}</h2>
        <div className="level-badge">{course.level || 'No Level'}</div>
      </div>

      <div className="panel-content">
        <div className="stats-row">
          <div className="stat-box">
            <h3>Schüler</h3>
            <div className="stat-value">{studentsCount}</div>
          </div>
          <div className="stat-box">
            <h3>Lektionen</h3>
            <div className="stat-value">{sessionCount}</div>
          </div>
          <div className="stat-box">
            <h3>Anwesenheit</h3>
            <div className="stat-value">{attendanceRate}%</div>
          </div>
        </div>

        <div className="course-info-card">
          <h3>Kursfortschritt</h3>
          <ProgressBar
            progress={completionRate}
            color={course.color || '#0088FE'}
            showLabel={true}
          />
        </div>

        <div className="course-info-card">
          <h3>Schüler</h3>
          <div className="student-list">
            {students.length > 0 ? (
              <div className="student-grid">
                {students.slice(0, 5).map(student => (
                  <div key={student.id} className="student-item">
                    {student.name}
                  </div>
                ))}
                {students.length > 5 && (
                  <div className="more-students">
                    +{students.length - 5} mehr
                  </div>
                )}
              </div>
            ) : (
              <p className="no-students-hint">Keine Schüler in diesem Kurs</p>
            )}
          </div>
        </div>

        <div className="next-session-card">
          <h3>Nächste Lektion</h3>
          {sessions.length > 0 ? (
            <div className="next-session-info">
              <div className="session-date">
                {sessions[0].date || 'Kein Datum'}
              </div>
              <div className="session-time">
                {sessions[0].startTime} - {sessions[0].endTime}
              </div>
              <div className="session-title">
                {sessions[0].title || 'Keine Titel'}
              </div>
            </div>
          ) : (
            <p className="no-sessions-hint">Keine Lektionen geplant</p>
          )}
        </div>

        <button 
          className="view-details-btn" 
          onClick={viewFullDetails}
        >
          Vollständige Details anzeigen
        </button>
      </div>
    </div>
  );
};

export default CourseDetailPanel;