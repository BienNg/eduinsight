import React from 'react';

const MonthHeader = ({ month, details, expandedMonth, onToggle }) => (
  <div className="notion-block month-header" onClick={() => onToggle(month.id)}>
    <div className="notion-block-content">
      <div className="notion-block-toggle">
        <div className="notion-block-toggle-icon">
          {expandedMonth === month.id ? "▾" : "▸"}
        </div>
        <div className="notion-block-text">{month.name}</div>
      </div>
    </div>
    <div className="notion-metadata">
      <div className="notion-metadata-item">{details.teacherCount} Lehrer</div>
      <div className="notion-metadata-item">{details.studentCount} Schüler</div>
      <div className="notion-metadata-item">{details.hours.toFixed(1)}h</div>
      <div className="notion-metadata-item">{details.sessionCount} Lektionen</div>
    </div>
  </div>
);

export default MonthHeader;
