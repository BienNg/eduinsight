// src/features/common/TabCard.jsx (updated)
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import '../styles/cards/TabCard.css';

const TabCard = ({ tabs, activeTab, setActiveTab, title, className = '' }) => {
  const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
  
  const handlePrevTab = () => {
    if (activeIndex > 0) {
      setActiveTab(tabs[activeIndex - 1].id);
    }
  };
  
  const handleNextTab = () => {
    if (activeIndex < tabs.length - 1) {
      setActiveTab(tabs[activeIndex + 1].id);
    }
  };
  
  return (
    <div className={`tab-card ${className}`}>
      <div className="panel-header">
        <h3 className="panel-title">{title}</h3>
        <div className="tab-card-navigation">
          <button 
            className={`tab-nav-button ${activeIndex === 0 ? 'disabled' : ''}`}
            onClick={handlePrevTab}
            disabled={activeIndex === 0}
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          
          <div className="tab-indicators">
            {tabs.map((tab, index) => (
              <div 
                key={tab.id}
                className={`tab-indicator ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              />
            ))}
          </div>
          
          <button 
            className={`tab-nav-button ${activeIndex === tabs.length - 1 ? 'disabled' : ''}`}
            onClick={handleNextTab}
            disabled={activeIndex === tabs.length - 1}
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </div>
      <div className="panel-content">
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  );
};

export default TabCard;