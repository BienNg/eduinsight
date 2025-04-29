// src/features/common/CourseBadge.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/CourseBadge.css';
import { isLightColor } from '../utils/colorUtils';

const CourseBadge = ({ course }) => {
  const navigate = useNavigate();
  
  const handleClick = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    
    // Navigate to the course detail view
    if (course && course.id) {
      navigate(`/courses/${course.id}`);
    }
  };
  
  return (
    <div 
      className="course-badge" 
      style={{ 
        backgroundColor: course.color || '#e0e0e0',
        color: isLightColor(course.color) ? '#333' : '#fff'
      }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      {course.name || 'Unnamed Course'}
    </div>
  );
};

export default CourseBadge;