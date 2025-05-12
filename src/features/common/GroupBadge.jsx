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
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      {group.name}
    </div>
  );
};

export default GroupBadge;