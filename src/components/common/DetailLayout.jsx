// src/components/common/DetailLayout.jsx
import React from 'react';
import TabComponent from './TabComponent';
import './DetailLayout.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const DetailLayout = ({ 
  title, 
  subtitle,
  onClose, 
  tabs, 
  activeTab, 
  setActiveTab, 
  headerRight, 
  children,
  breadcrumbParent,
  onBreadcrumbClick
}) => {
  return (
    <div className="detail-wrapper">
      {breadcrumbParent && (
        <div className="breadcrumb">
          <span className="breadcrumb-link" onClick={onBreadcrumbClick || onClose}>
            {breadcrumbParent}
          </span>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">{title}</span>
        </div>
      )}
      
      <div className="detail-header">
        <div className="header-left">
          <h2>{title}</h2>
          {subtitle && <div className="detail-subtitle">{subtitle}</div>}
        </div>
        {headerRight}
        <button className="back-button" onClick={onClose}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </button>
      </div>

      <TabComponent tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab}>
        {/* Tab content will be rendered here */}
      </TabComponent>

      <div className="detail-content">
        {children}
      </div>
    </div>
  );
};

export default DetailLayout;