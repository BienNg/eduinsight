// src/features/courses/components/CourseDetailPanel.jsx
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBook,
  faUsers,
  faCalendarAlt,
  faChalkboardTeacher,
  faGraduationCap,
  faInfoCircle,
  faMapMarkerAlt,
  faClock,
  faEllipsisV,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import { handleDeleteCourse } from '../../utils/courseDeletionUtils';
import { getRecordById } from '../../firebase/database';
import '../../styles/CourseDetailPanel.css';

const CourseDetailPanel = ({ course, students, sessions, loading, setCourses }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [deletingCourseId, setDeletingCourseId] = useState(null);
  const [error, setError] = useState(null);
  const [teacherName, setTeacherName] = useState('Nicht zugewiesen');


  useEffect(() => {
    const fetchTeacherData = async () => {
      if (course && course.teacherIds && course.teacherIds.length > 0) {
        try {
          // Use the first teacher ID from the array
          const teacherId = course.teacherIds[0];
          const teacherRecord = await getRecordById('teachers', teacherId);
          if (teacherRecord && teacherRecord.name) {
            setTeacherName(teacherRecord.name);
          }
        } catch (err) {
          console.error("Error fetching teacher data:", err);
        }
      } else {
        setTeacherName('Nicht zugewiesen');
      }
    };

    fetchTeacherData();
  }, [course]);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      if (showDropdown) setShowDropdown(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDropdown]);

  const handleDelete = (e) => {
    if (course) {
      handleDeleteCourse(
        course.id,
        course.name,
        setDeletingCourseId,
        setCourses,
        setError,
        e
      );
    }
    setShowDropdown(false);
  };

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

  return (
    <div className="course-detail-panel">
      <div className="course-detail-panel-header">
        <h2 className="course-detail-panel-title">{course.name || 'Kursdetails'}</h2>
        <div className="course-detail-panel-actions">
          {deletingCourseId === course.id ? (
            <span className="course-detail-panel-deleting">Löschen...</span>
          ) : (
            <div className="course-detail-panel-settings" onClick={toggleDropdown}>
              <FontAwesomeIcon icon={faEllipsisV} />
              {showDropdown && (
                <div className="course-detail-panel-dropdown">
                  <button className="course-detail-panel-dropdown-item" onClick={handleDelete}>
                    <FontAwesomeIcon icon={faTrash} className="course-detail-panel-dropdown-icon" />
                    Kurs löschen
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="course-detail-panel-error">{error}</div>
      )}

      <div className="course-detail-panel-section">
        <h3 className="course-detail-panel-section-title">
          <FontAwesomeIcon icon={faInfoCircle} className="course-detail-panel-icon" />
          Kursdetails
        </h3>
        <div className="course-detail-panel-info-grid">
          <div className="course-detail-panel-info-item">
            <span className="course-detail-panel-info-value">
              <FontAwesomeIcon icon={faGraduationCap} className="course-detail-panel-icon" />
              {course.level || 'N/A'}
            </span>
          </div>
          <div className="course-detail-panel-info-item">
            <span className="course-detail-panel-info-value">
              <FontAwesomeIcon icon={faBook} className="course-detail-panel-icon" />
              {course.type || 'Standard'}
            </span>
          </div>
          <div className="course-detail-panel-info-item">
            <span className="course-detail-panel-info-value">
              <FontAwesomeIcon icon={faChalkboardTeacher} className="course-detail-panel-icon" />
              {teacherName}
            </span>
          </div>
          <div className="course-detail-panel-info-item">
            <span className="course-detail-panel-info-value">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="course-detail-panel-icon" />
              {course.location || 'Online'}
            </span>
          </div>
          <div className="course-detail-panel-info-item">
            <span className="course-detail-panel-info-value">
              <FontAwesomeIcon icon={faCalendarAlt} className="course-detail-panel-icon" />
              {course.startDate}
            </span>
          </div>
          <div className="course-detail-panel-info-item">
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
                <span className="course-detail-panel-session-title">{session.title || 'Unbenannte Lektion'}</span>
                <span className="course-detail-panel-session-date">{session.date}</span>
                <div className="course-detail-panel-session-badges">
                  <span className={`course-detail-panel-status-badge ${session.status === 'completed' ? 'status-completed' : 'status-planned'}`}>
                    {session.status === 'completed' ? 'Abgeschlossen' : 'Geplant'}
                  </span>
                  <span className="course-detail-panel-duration-badge">
                    {session.duration || course.duration || '60'} h.
                  </span>
                </div>
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