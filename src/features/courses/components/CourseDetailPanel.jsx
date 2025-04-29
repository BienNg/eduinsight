// src/features/courses/components/CourseDetailPanel.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressBar from '../../common/ProgressBar';

const CourseDetailPanel = ({ course, students, sessions, loading }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="course-detail-loading">
        <div className="skeleton-header"></div>
        <div className="skeleton-content"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="no-course-selected">
        <p>Wählen Sie einen Kurs aus, um Details anzuzeigen ssss</p>
      </div>
    );
  }

  const handleViewDetails = () => {
    navigate(`/courses/${course.id}`);
  };

  return (
    <div className="course-detail-container">
      <div className="panel-header">
        <h2 className="panel-title">{course.name}</h2>
        <div
          className="level-badge"
          style={{ backgroundColor: course.color || '#0088FE' }}
        >
          {course.level || 'No Level'}
        </div>
      </div>

      <div className="panel-content">
        <div className="stats-row">
          <div className="stat-box">
            <h3>Schüler</h3>
            <div className="stat-value">{students.length}</div>
          </div>
          <div className="stat-box">
            <h3>Lektionen</h3>
            <div className="stat-value">{sessions.length}</div>
          </div>
        </div>

        <div className="course-info-card">
          <h3>Informationen</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Status:</span>
              <span className="value">{course.status || 'Unknown'}</span>
            </div>
            <div className="info-item">
              <span className="label">Begin:</span>
              <span className="value">{course.startDate || '-'}</span>
            </div>
            <div className="info-item">
              <span className="label">Ende:</span>
              <span className="value">{course.endDate || '-'}</span>
            </div>
          </div>
        </div>

        <button className="view-details-btn" onClick={handleViewDetails}>
          Alle Details anzeigen
        </button>
      </div>
    </div>
  );
};

export default CourseDetailPanel;