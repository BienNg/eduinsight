// src/features/common/DetailLayout.jsx
import React from 'react';
import './DetailLayout.css';

const DetailLayout = ({
  title,
  tabs,
  activeTab,
  setActiveTab,
  onClose,
  children,
  showTabsInHeader = false // New prop with default value
}) => {
  return (
    <div className="student-detail-container">
      <div className="student-detail-view">
        <div className="detail-header">
          <div className="header-content">
            <h2>{title}</h2>


            {/* Conditionally render tabs in header if showTabsInHeader is true */}
            {showTabsInHeader && tabs && tabs.length > 0 && (
              <div className="header-tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={activeTab === tab.id ? 'active' : ''}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
            <button className="close-button" onClick={onClose}>
              ←
            </button>

          </div>
        </div>

        {/* Only render tabs section if not showing in header */}
        {!showTabsInHeader && tabs && tabs.length > 0 && (
          <div className="detail-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={activeTab === tab.id ? 'active' : ''}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <div className="detail-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DetailLayout;