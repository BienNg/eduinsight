// src/features/common/TeacherBadge.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/TeacherBadge.css';


const TeacherBadge = ({ teacher }) => {
  const navigate = useNavigate();
  
  const handleClick = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    
    // Navigate to the teacher detail view
    if (teacher && teacher.id) {
      navigate(`/teachers/${teacher.id}`);
    }
  };

  // Handle middle-click to open in new tab
  const handleMouseDown = (event) => {
    if (event.button === 1) { // Middle mouse button
      event.preventDefault();
      event.stopPropagation(); // Prevent event bubbling
      
      if (teacher && teacher.id) {
        const url = `/teachers/${teacher.id}`;
        window.open(url, '_blank');
      }
    }
  };
  
  return (
    <div 
      className="teacher-badge" 
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      role="button"
      tabIndex={0}
    >
      {teacher.name}
    </div>
  );
};

export default TeacherBadge;