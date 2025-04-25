// src/components/common/EntityDetailContent.jsx
import React from 'react';
import './EntityDetailContent.css';

const EntityDetailContent = ({ 
  title, 
  loading, 
  error, 
  empty, 
  emptyMessage = "No data found.", 
  children 
}) => {
  return (
    <div className="entity-detail-section">
      {title && <h3>{title}</h3>}
      
      {loading ? (
        <div className="loading-indicator">Loading data...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : empty ? (
        <div className="empty-state">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
};

export default EntityDetailContent;