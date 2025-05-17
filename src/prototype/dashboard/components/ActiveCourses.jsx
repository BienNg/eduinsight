// src/prototype/dashboard/components/ActiveCourses.jsx
import React from 'react';
import './components.css'; 

const ActiveCourses = ({ courses }) => {
  // Count courses by level
  const coursesByLevel = courses.reduce((acc, course) => {
    acc[course.level] = (acc[course.level] || 0) + 1;
    return acc;
  }, {});
  
  // Prepare data for mini chart
  const levels = Object.keys(coursesByLevel).sort();
  const counts = levels.map(level => coursesByLevel[level]);
  
  return (
    <div className="active-courses-card">
      <h3>Active Courses</h3>
      <div className="course-count">{courses.length}</div>
      <div className="level-distribution">
        {levels.map((level, index) => (
          <div key={level} className="level-item">
            <div className="level-name">{level}</div>
            <div className="level-bar">
              <div 
                className="level-fill"
                style={{ 
                  width: `${(coursesByLevel[level] / courses.length) * 100}%`,
                  backgroundColor: getColorForLevel(level)
                }}
              ></div>
            </div>
            <div className="level-count">{coursesByLevel[level]}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper function to get a color for each level
const getColorForLevel = (level) => {
  const colors = {
    'A1.1': '#0088FE',
    'A1.2': '#00C49F',
    'A2.1': '#FFBB28',
    'A2.2': '#FF8042',
    'B1.1': '#8884d8',
    'B1.2': '#82ca9d'
  };
  return colors[level] || '#ccc';
};

export default ActiveCourses;