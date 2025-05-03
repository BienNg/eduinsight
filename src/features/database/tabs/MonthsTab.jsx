// src/features/database/components/tabs/MonthsTab.jsx
import React from 'react';

const MonthsTab = ({ months }) => (
  <div className="course-groups-grid">
    {months.map((month) => (
      <div className="group-card" key={month.id}>
        <div className="group-header" style={{ backgroundColor: '#0066cc' }}>
          <h3>{month.name}</h3>
          <span className="group-count">{month.sessionCount || 0} session(s)</span>
        </div>
        <div className="group-info">
          <div className="info-item">
            <span className="label">Courses:</span>
            <span className="value">{month.courseIds?.length || 0}</span>
          </div>
          <div className="info-item">
            <span className="label">Teachers:</span>
            <span className="value">{month.teacherIds?.length || 0}</span>
          </div>
        </div>
      </div>
    ))}
    {months.length === 0 && <div className="empty-state">No months found</div>}
  </div>
);

export default MonthsTab;