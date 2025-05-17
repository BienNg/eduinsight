// src/prototype/dashboard/components/AttendanceAnalytics.jsx
import React from 'react';
import './components.css'; 

const AttendanceAnalytics = ({ attendanceData, filters }) => {
  // Get appropriate attendance data based on filters
  const getFilteredAttendance = () => {
    if (filters.groupId) {
      const groupAttendance = attendanceData.byGroup.find(g => g.group === filters.groupId);
      return groupAttendance ? groupAttendance.rate : attendanceData.overall;
    }
    
    if (filters.courseType !== 'all') {
      const levelAttendance = attendanceData.byLevel.find(l => l.level === filters.courseType);
      return levelAttendance ? levelAttendance.rate : attendanceData.overall;
    }
    
    return attendanceData.overall;
  };
  
  const currentAttendance = getFilteredAttendance();
  const attendanceTrend = attendanceData.trend;
  
  // Determine color based on attendance rate
  const getAttendanceColor = (rate) => {
    if (rate >= 90) return '#4CAF50'; // Green
    if (rate >= 80) return '#FFC107'; // Yellow
    return '#F44336'; // Red
  };
  
  const attendanceColor = getAttendanceColor(currentAttendance);
  
  return (
    <div className="attendance-analytics-card">
      <h3>Attendance Rate</h3>
      <div 
        className="attendance-percentage" 
        style={{ color: attendanceColor }}
      >
        {currentAttendance}%
      </div>
      <div className="attendance-trend">
        {attendanceTrend.map((week, index) => (
          <div key={index} className="trend-bar-container">
            <div className="trend-label">{week.week.substring(5)}</div>
            <div className="trend-bar">
              <div 
                className="trend-fill"
                style={{ 
                  height: `${week.rate}%`,
                  backgroundColor: getAttendanceColor(week.rate)
                }}
              ></div>
            </div>
            <div className="trend-value">{week.rate}%</div>
          </div>
        ))}
      </div>
      <div className="attendance-summary">
        <div className="summary-item">
          <div className="summary-label">Highest</div>
          <div className="summary-value">
            {Math.max(...attendanceTrend.map(w => w.rate))}%
          </div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Lowest</div>
          <div className="summary-value">
            {Math.min(...attendanceTrend.map(w => w.rate))}%
          </div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Average</div>
          <div className="summary-value">
            {(attendanceTrend.reduce((acc, w) => acc + w.rate, 0) / attendanceTrend.length).toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceAnalytics;