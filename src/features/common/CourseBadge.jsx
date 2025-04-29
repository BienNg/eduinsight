import React from 'react';
import '../styles/CourseBadge.css';
import { isLightColor } from '../utils/colorUtils';

const CourseBadge = ({ course, onClick }) => {
  return (
    <div 
      className="course-badge" 
      style={{ 
        backgroundColor: course.color || '#e0e0e0',
        color: isLightColor(course.color) ? '#333' : '#fff',
        cursor: 'pointer'
      }}
      onClick={() => onClick && onClick(course)}
    >
      {course.name || 'Unnamed Course'}
    </div>
  );
};

export default CourseBadge;