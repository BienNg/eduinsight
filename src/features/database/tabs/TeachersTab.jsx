// src/features/database/components/tabs/TeachersTab.jsx
import React from 'react';

const TeachersTab = ({ teachers }) => (
  <div className="teacher-cards-grid">
    {teachers.map((teacher) => (
      <div className="teacher-card" key={teacher.id}>
        <div className="teacher-card-header">
          <h3>{teacher.name}</h3>
        </div>
        <div className="teacher-card-body">
          <div className="info-item">
            <span className="label">Country:</span>
            <span className="value">{teacher.country || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="label">Courses:</span>
            <span className="value">{teacher.courseIds?.length || 0}</span>
          </div>
        </div>
      </div>
    ))}
    {teachers.length === 0 && <div className="empty-state">No teachers found</div>}
  </div>
);

export default TeachersTab;