// src/features/common/CourseBadge.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/CourseBadge.css';

const CourseBadge = ({ course, onClick, disableNavigation = false }) => {
  const navigate = useNavigate();
  
  const handleClick = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    
    if (onClick) {
      onClick(e);
      return;
    }
    
    // Navigate to the course detail view if navigation is enabled
    if (!disableNavigation && course && course.id) {
      navigate(`/courses/${course.id}`);
    }
  };
  
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return '#4CAF50'; // green
      case 'ongoing':
        return '#2196F3'; // blue
      default:
        return '#9E9E9E'; // gray for unknown status
    }
  };
  
  const backgroundColor = course.color || getStatusColor(course.status || 'ongoing');
  
  return (
    <div 
      className="course-badge" 
      style={{ 
        backgroundColor,
        color: isLightColor(backgroundColor) ? '#333' : '#fff'
      }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      {course.name || course.status?.charAt(0).toUpperCase() + course.status?.slice(1) || 'Unknown'}
    </div>
  );
};

// Helper function to determine if text should be dark or light based on background
const isLightColor = (hexColor) => {
  if (!hexColor || hexColor === '') return true;
  
  // Remove # if it exists
  hexColor = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hexColor.substr(0, 2), 16);
  const g = parseInt(hexColor.substr(2, 2), 16);
  const b = parseInt(hexColor.substr(4, 2), 16);
  
  // Calculate brightness
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  // Return true if color is light
  return brightness > 128;
};

export default CourseBadge;