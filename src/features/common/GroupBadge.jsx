// src/features/common/GroupBadge.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/GroupBadge.css';

const GroupBadge = ({ group }) => {
  const navigate = useNavigate();
  
  const handleClick = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    
    // Navigate to the courses group view
    if (group && group.name) {
      navigate(`/courses/group/${group.name}`);
    }
  };
  
  return (
    <div 
      className="group-badge" 
      style={{ 
        backgroundColor: group.color || '#e0e0e0',
        color: isLightColor(group.color) ? '#333' : '#fff'
      }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      {group.name}
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

export default GroupBadge;