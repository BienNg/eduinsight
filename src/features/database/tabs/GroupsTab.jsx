// src/features/database/components/tabs/GroupsTab.jsx
import React from 'react';

const GroupsTab = ({ groups }) => (
  <div className="course-groups-grid">
    {groups.map((group) => (
      <div className="group-card" key={group.id}>
        <div className="group-header" style={{ backgroundColor: group.color || '#0066cc' }}>
          <h3>{group.name}</h3>
          <span className="group-count">{group.courseIds?.length || 0} course(s)</span>
        </div>
        <div className="group-info">
          <div className="info-item">
            <span className="label">Type:</span>
            <span className="value">{group.type || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="label">Mode:</span>
            <span className="value">{group.mode || 'N/A'}</span>
          </div>
        </div>
      </div>
    ))}
    {groups.length === 0 && <div className="empty-state">No groups found</div>}
  </div>
);

export default GroupsTab;