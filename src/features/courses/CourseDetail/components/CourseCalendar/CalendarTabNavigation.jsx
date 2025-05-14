// src/features/courses/CourseDetail/components/CourseCalendar/CalendarTabNavigation.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

const CalendarTabNavigation = ({ 
  monthTabs, 
  activeTab, 
  isAnimating, 
  handlePrevTab, 
  handleNextTab, 
  handleTabClick 
}) => {
  return (
    <div className="calendar-tab-navigation">
      <div className="panel-header">
        <h3 className="panel-title">
          {monthTabs[activeTab]?.label || "Calendar"}
        </h3>
        
        <div className="tab-card-navigation">
          <button 
            className={`tab-nav-button ${activeTab === 0 || isAnimating ? 'disabled' : ''}`}
            onClick={handlePrevTab}
            disabled={activeTab === 0 || isAnimating}
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          
          <div className="tab-indicators">
            {monthTabs.map((tab, index) => (
              <div 
                key={tab.id}
                className={`tab-indicator ${activeTab === index ? 'active' : ''}`}
                onClick={() => handleTabClick(index)}
              />
            ))}
          </div>
          
          <button 
            className={`tab-nav-button ${activeTab === monthTabs.length - 1 || isAnimating ? 'disabled' : ''}`}
            onClick={handleNextTab}
            disabled={activeTab === monthTabs.length - 1 || isAnimating}
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarTabNavigation;