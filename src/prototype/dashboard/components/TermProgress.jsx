// src/prototype/dashboard/components/TermProgress.jsx
import React from 'react';
import './components.css';  // Add this import


const TermProgress = ({ currentWeek, totalWeeks }) => {
  const progress = (currentWeek / totalWeeks) * 100;
  
  return (
    <div className="term-progress-card">
      <h3>Current Term</h3>
      <div className="progress-indicator">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="progress-text">
          Week {currentWeek} of {totalWeeks}
        </div>
      </div>
      <div className="term-dates">
        <div>Term 1, 2025</div>
        <div>Jan 5 - Mar 30</div>
      </div>
    </div>
  );
};

export default TermProgress;