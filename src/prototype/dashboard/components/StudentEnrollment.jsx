// src/prototype/dashboard/components/StudentEnrollment.jsx
import React from 'react';
import './components.css'; 

const StudentEnrollment = ({ currentCount, previousCount }) => {
  const percentChange = ((currentCount - previousCount) / previousCount) * 100;
  const isIncrease = percentChange > 0;
  
  return (
    <div className="student-enrollment-card">
      <h3>Student Enrollment</h3>
      <div className="enrollment-count">{currentCount}</div>
      <div className={`enrollment-change ${isIncrease ? 'increase' : 'decrease'}`}>
        <span className="change-arrow">
          {isIncrease ? '↑' : '↓'}
        </span>
        <span className="change-percent">
          {Math.abs(percentChange).toFixed(1)}%
        </span>
        <span className="change-label">
          vs. previous term
        </span>
      </div>
      <div className="enrollment-sparkline">
        {/* Simple sparkline visualization */}
        <div className="sparkline-container">
          {[90, 95, 105, 102, 108, currentCount].map((value, index) => (
            <div 
              key={index}
              className="sparkline-point"
              style={{ 
                height: `${(value / 150) * 100}%`,
                backgroundColor: index === 5 ? '#0088FE' : '#ccc'
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentEnrollment;