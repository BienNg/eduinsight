// src/features/common/CourseBadge.jsx
import React from 'react';
import '../styles/CourseBadge.css';
import { isLightColor } from '../utils/colorUtils';

const CourseBadge = ({ course }) => {
  return (
    <div 
      className="course-badge" 
      style={{ 
        backgroundColor: course.color || '#e0e0e0',
        color: isLightColor(course.color) ? '#333' : '#fff'
      }}
    >
      {course.name || 'Unnamed Course'}
    </div>
  );
};

export default CourseBadge;