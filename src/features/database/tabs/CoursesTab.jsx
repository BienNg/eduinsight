// src/features/database/components/tabs/CoursesTab.jsx
import React from 'react';

const CoursesTab = ({ courses }) => (
  <div className="courses-grid">
    {courses.map((course) => (
      <div className="course-card" key={course.id}>
        <div className="course-header">
          <h3>{course.name}</h3>
          {course.level && <span className="course-level">{course.level}</span>}
        </div>
        <div className="course-info">
          <div className="info-item">
            <span className="label">Status:</span>
            <span className="value">{course.status || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="label">Sessions:</span>
            <span className="value">{course.sessionIds?.length || 0}</span>
          </div>
          <div className="info-item">
            <span className="label">Students:</span>
            <span className="value">{course.studentIds?.length || 0}</span>
          </div>
        </div>
      </div>
    ))}
    {courses.length === 0 && <div className="empty-state">No courses found</div>}
  </div>
);

export default CoursesTab;