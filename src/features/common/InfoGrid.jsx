// src/components/common/InfoGrid.jsx
import React from 'react';
import './InfoGrid.css';

const InfoGrid = ({ items }) => {
  return (
    <div className="info-grid">
      {items.map((item, index) => (
        <div key={index} className="info-item">
          <span className="label">{item.label}:</span>
          <span className="value">{item.value}</span>
        </div>
      ))}
    </div>
  );
};

export default InfoGrid;