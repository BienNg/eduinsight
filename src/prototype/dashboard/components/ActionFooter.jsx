// src/prototype/dashboard/components/ActionFooter.jsx
import React from 'react';
import './components.css'; 

const ActionFooter = () => {
  return (
    <div className="action-footer-container">
      <div className="action-buttons">
        <button className="action-button">
          <span className="action-icon">📊</span>
          Generate Report
        </button>
        <button className="action-button">
          <span className="action-icon">📤</span>
          Export Data
        </button>
        <button className="action-button">
          <span className="action-icon">⚙️</span>
          Configure Alerts
        </button>
      </div>
      
      <div className="quick-nav">
        <div className="quick-nav-label">Quick Navigation:</div>
        <div className="quick-nav-links">
          <a href="#" className="quick-nav-link">Courses</a>
          <a href="#" className="quick-nav-link">Teachers</a>
          <a href="#" className="quick-nav-link">Students</a>
          <a href="#" className="quick-nav-link">Schedule</a>
        </div>
      </div>
    </div>
  );
};

export default ActionFooter;