// src/components/common/StatBox.jsx
import React from 'react';
import './StatBox.css';

const StatBox = ({ title, value, icon }) => {
  return (
    <div className="stat-box">
      {icon && <div className="stat-icon">{icon}</div>}
      <h3>{title}</h3>
      <div className="stat-value">{value}</div>
    </div>
  );
};

export default StatBox;