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
  
  return (
    <div 
      className="teacher-badge" 
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      {teacher.name}
    </div>
  );
};

export default TeacherBadge;