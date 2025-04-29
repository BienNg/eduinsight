// src/features/courses/components/CourseDetailPanel.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBook, 
  faUsers, 
  faCalendarAlt, 
  faChalkboardTeacher, 
  faGraduationCap, 
  faInfoCircle, 
  faMapMarkerAlt, 
  faClock
} from '@fortawesome/free-solid-svg-icons';
import '../../styles/CourseDetailPanel.css';

const CourseDetailPanel = ({ course, students, sessions, loading }) => {
  if (loading) {
    return (
      <div className="course-detail-panel">
        <div className="course-detail-panel-loading">
          <div className="course-detail-panel-skeleton"></div>
          <div className="course-detail-panel-skeleton"></div>
          <div className="course-detail-panel-skeleton"></div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-detail-panel">
        <div className="course-detail-panel-empty-state">
          <FontAwesomeIcon icon={faBook} size="2x" style={{ color: '#cccccc', marginBottom: '16px' }} />
          <h3>Kurs auswählen</h3>
          <p>Wählen Sie einen Kurs aus, um Details anzuzeigen</p>
        </div>
      </div>
    );
  }

  // Format date if available
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE');
  };

  return (
    <div className="course-detail-panel">
      <div className="course-detail-panel-header">
        <h2 className="course-detail-panel-title">{course.name || 'Kursdetails'}</h2>
      </div>

      <div className="course-detail-panel-section">
        <h3 className="course-detail-panel-section-title">
          <FontAwesomeIcon icon={faInfoCircle} className="course-detail-panel-icon" />
          Kursdetails
        </h3>
        <div className="course-detail-panel-info-grid">
          <div className="course-detail-panel-info-item">
            <span className="course-detail-panel-info-label">Stufe</span>
            <span className="course-detail-panel-info-value">
              <FontAwesomeIcon icon={faGraduationCap} className="course-detail-panel-icon" />
              {course.level || 'N/A'}
            </span>
          </div>
          <div className="course-detail-panel-info-item">
            <span className="course-detail-panel-info-label">Kurstyp</span>
            <span className="course-detail-panel-info-value">
              <FontAwesomeIcon icon={faBook} className="course-detail-panel-icon" />
              {course.type || 'Standard'}
            </span>
          </div>
          <div className="course-detail-panel-info-item">
            <span className="course-detail-panel-info-label">Lehrkraft</span>
            <span className="course-detail-panel-info-value">
              <FontAwesomeIcon icon={faChalkboardTeacher} className="course-detail-panel-icon" />
              {course.teacherName || 'Nicht zugewiesen'}
            </span>
          </div>
          <div className="course-detail-panel-info-item">
            <span className="course-detail-panel-info-label">Ort</span>
            <span className="course-detail-panel-info-value">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="course-detail-panel-icon" />
              {course.location || 'Online'}
            </span>
          </div>
          <div className="course-detail-panel-info-item">
            <span className="course-detail-panel-info-label">Startdatum</span>
            <span className="course-detail-panel-info-value">
              <FontAwesomeIcon icon={faCalendarAlt} className="course-detail-panel-icon" />
              {formatDate(course.startDate)}
            </span>
          </div>
          <div className="course-detail-panel-info-item">
            <span className="course-detail-panel-info-label">Dauer</span>
            <span className="course-detail-panel-info-value">
              <FontAwesomeIcon icon={faClock} className="course-detail-panel-icon" />
              {course.duration || '60'} Min.
            </span>
          </div>
        </div>
      </div>

      <div className="course-detail-panel-section">
        <h3 className="course-detail-panel-section-title">
          <FontAwesomeIcon icon={faUsers} className="course-detail-panel-icon" />
          Teilnehmer ({students?.length || 0})
        </h3>
        <div className="course-detail-panel-student-list">
          {students && students.length > 0 ? (
            students.map((student) => (
              <div key={student.id} className="course-detail-panel-student-item">
                <span className="course-detail-panel-student-name">{student.name}</span>
              </div>
            ))
          ) : (
            <div className="course-detail-panel-empty-state">
              Keine Teilnehmer gefunden
            </div>
          )}
        </div>
      </div>

      <div className="course-detail-panel-section">
        <h3 className="course-detail-panel-section-title">
          <FontAwesomeIcon icon={faCalendarAlt} className="course-detail-panel-icon" />
          Lektionen ({sessions?.length || 0})
        </h3>
        <div className="course-detail-panel-session-list">
          {sessions && sessions.length > 0 ? (
            sessions.map((session) => (
              <div key={session.id} className="course-detail-panel-session-item">
                <span className="course-detail-panel-session-date">{formatDate(session.date)}</span>
                <span className="course-detail-panel-session-status">
                  {session.status === 'completed' ? 'Abgeschlossen' : 'Geplant'}
                </span>
              </div>
            ))
          ) : (
            <div className="course-detail-panel-empty-state">
              Keine Lektionen gefunden
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPanel;