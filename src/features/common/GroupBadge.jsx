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

  // Handle middle-click to open in new tab
  const handleMouseDown = (event) => {
    if (event.button === 1) { // Middle mouse button
      event.preventDefault();
      event.stopPropagation(); // Prevent event bubbling
      
      if (group && group.name) {
        const url = `/courses/group/${group.name}`;
        window.open(url, '_blank');
      }
    }
  };
  
  return (
    <div 
      className="group-badge"
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      role="button"
      tabIndex={0}
    >
      {group.name}
    </div>
  );
};

export default GroupBadge;