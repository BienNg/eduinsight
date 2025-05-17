// src/prototype/dashboard/components/CourseProgress.jsx
import React from 'react';
import './components.css'; 

const CourseProgress = ({ courses, filters }) => {
  // Filter courses based on selected filters
  const filteredCourses = courses.filter(course => {
    if (filters.groupId && course.groupId !== filters.groupId) return false;
    if (filters.courseType !== 'all' && course.level !== filters.courseType) return false;
    if (filters.teacherId && course.teacherId !== filters.teacherId) return false;
    return true;
  });
  
  // Sort by progress (ascending)
  const sortedCourses = [...filteredCourses].sort((a, b) => a.progress - b.progress);
  
  return (
    <div className="course-progress-card">
      <h3>Course Progress</h3>
      <div className="course-progress-list">
        {sortedCourses.map(course => (
          <div key={course.id} className="course-progress-item">
            <div className="course-info">
              <div className="course-name">{course.name}</div>
              <div className="course-level">{course.level}</div>
            </div>
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${course.progress}%`,
                    backgroundColor: getProgressColor(course.progress)
                  }}
                ></div>
              </div>
              <div className="progress-stats">
                <span>{course.progress}%</span>
                <span>{course.completedSessions}/{course.totalSessions} sessions</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="course-calendar-grid">
        <h4>Course Calendar Overview</h4>
        <div className="mini-calendars">
          {sortedCourses.slice(0, 3).map(course => (
            <div key={course.id} className="mini-calendar">
              <div className="mini-calendar-header">{course.name}</div>
              <div className="mini-calendar-grid">
                {Array.from({ length: 20 }, (_, i) => (
                  <div 
                    key={i} 
                    className={`calendar-cell ${i < course.completedSessions ? 'completed' : 
                                             i === course.completedSessions ? 'current' : 
                                             'upcoming'}`}
                  ></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper function to get color based on progress
const getProgressColor = (progress) => {
  if (progress >= 80) return '#4CAF50'; // Green
  if (progress >= 40) return '#2196F3'; // Blue
  if (progress >= 20) return '#FFC107'; // Yellow
  return '#F44336'; // Red
};

export default CourseProgress;