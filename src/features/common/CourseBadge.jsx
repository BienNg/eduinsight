// src/features/common/CourseBadge.jsx
import React from 'react';
import '../styles/CourseBadge.css';
import { isCourseCompleted, getCourseBadgeColor, getCourseBadgeTextColor } from '../utils/courseCompletionUtils';

const CourseBadge = ({ course, onClick, sessions = [] }) => {
  // Filter sessions to only include those for this course
  const courseSessions = sessions.filter(session => session.courseId === course.id);
  
  
  // Determine if the course is completed
  const isCompleted = isCourseCompleted(courseSessions);
  
  // Get appropriate colors based on completion status
  const backgroundColor = getCourseBadgeColor(isCompleted);
  const textColor = getCourseBadgeTextColor(isCompleted);

  return (
    <div 
      className="course-badge" 
      style={{ 
        backgroundColor,
        color: textColor,
        cursor: 'pointer'
      }}
      onClick={() => onClick && onClick(course)}
    >
      {course.name || 'Unnamed Course'}
    </div>
  );
};

export default CourseBadge;