// src/features/common/TabCard.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import '../styles/cards/TabCard.css';

const TabCard = ({ tabs, activeTab, setActiveTab, title, className = '' }) => {
  const [previousTab, setPreviousTab] = useState(activeTab);
  const [direction, setDirection] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [contentHeight, setContentHeight] = useState('auto');
  const contentRef = useRef(null);
  
  const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
  
  // Calculate and set the panel content height when the active tab changes
  useEffect(() => {
    if (contentRef.current) {
      // Measure the active tab content height
      const activeTabContent = contentRef.current.querySelector('.tab-content.active');
      if (activeTabContent) {
        const height = activeTabContent.offsetHeight;
        if (height > 0) {
          setContentHeight(`${height}px`);
        }
      }
    }
  }, [activeTab, tabs]);
  
  const handleAnimationEnd = () => {
    if (isAnimating) {
      setIsAnimating(false);
      setPreviousTab(activeTab);
      
      // After animation ends, reset to auto height to accommodate content changes
      setTimeout(() => {
        const activeTabContent = contentRef.current?.querySelector('.tab-content.active');
        if (activeTabContent) {
          const height = activeTabContent.offsetHeight;
          if (height > 0) {
            setContentHeight(`${height}px`);
          } else {
            setContentHeight('auto');
          }
        }
      }, 50); // Small delay to ensure content is rendered
    }
  };

  const handlePrevTab = () => {
    if (activeIndex > 0 && !isAnimating) {
      // First, make sure we have a fixed height before animation
      if (contentRef.current) {
        const currentHeight = contentRef.current.offsetHeight;
        setContentHeight(`${currentHeight}px`);
      }
      
      setDirection('right');
      setPreviousTab(activeTab);
      setIsAnimating(true);
      setActiveTab(tabs[activeIndex - 1].id);
    }
  };
  
  const handleNextTab = () => {
    if (activeIndex < tabs.length - 1 && !isAnimating) {
      // First, make sure we have a fixed height before animation
      if (contentRef.current) {
        const currentHeight = contentRef.current.offsetHeight;
        setContentHeight(`${currentHeight}px`);
      }
      
      setDirection('left');
      setPreviousTab(activeTab);
      setIsAnimating(true);
      setActiveTab(tabs[activeIndex + 1].id);
    }
  };

  const handleTabClick = (tabId) => {
    if (tabId === activeTab || isAnimating) return;
    
    // First, make sure we have a fixed height before animation
    if (contentRef.current) {
      const currentHeight = contentRef.current.offsetHeight;
      setContentHeight(`${currentHeight}px`);
    }
    
    const clickedIndex = tabs.findIndex(tab => tab.id === tabId);
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    
    setDirection(clickedIndex > currentIndex ? 'left' : 'right');
    setPreviousTab(activeTab);
    setIsAnimating(true);
    setActiveTab(tabId);
  };
  
  const renderTabContent = () => {
    if (!isAnimating) {
      // When not animating, just show the active tab
      const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;
      return (
        <div className="tab-content active">
          {activeTabContent}
        </div>
      );
    }
    
    // During animation, show both previous and new tab with appropriate animations
    const previousTabContent = tabs.find(tab => tab.id === previousTab)?.content;
    const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;
    
    return (
      <>
        <div 
          className={`tab-content ${direction === 'left' ? 'slide-out-left' : 'slide-out-right'}`}
          onAnimationEnd={handleAnimationEnd}
        >
          {previousTabContent}
        </div>
        <div 
          className={`tab-content ${direction === 'left' ? 'slide-in-right' : 'slide-in-left'}`}
        >
          {activeTabContent}
        </div>
      </>
    );
  };
  
  // Determine if we should override the overflow behavior
  const contentStyle = {
    height: contentHeight,
    transition: 'height 0.3s ease',
    // Only use overflow:hidden during animations, otherwise use the CSS default
    overflow: isAnimating ? 'hidden' : 'visible',
    // Remove the scrolling when not needed
    overflowY: isAnimating ? 'hidden' : 'visible'
  };
  
  return (
    <div className={`tab-card ${className}`}>
      <div className="panel-header">
        <h3 className="panel-title">{title}</h3>
        <div className="tab-card-navigation">
          <button 
            className={`tab-nav-button ${activeIndex === 0 || isAnimating ? 'disabled' : ''}`}
            onClick={handlePrevTab}
            disabled={activeIndex === 0 || isAnimating}
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          
          <div className="tab-indicators">
            {tabs.map((tab, index) => (
              <div 
                key={tab.id}
                className={`tab-indicator ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabClick(tab.id)}
              />
            ))}
          </div>
          
          <button 
            className={`tab-nav-button ${activeIndex === tabs.length - 1 || isAnimating ? 'disabled' : ''}`}
            onClick={handleNextTab}
            disabled={activeIndex === tabs.length - 1 || isAnimating}
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </div>
      <div 
        className="panel-content" 
        ref={contentRef}
        style={contentStyle}
      >
        {renderTabContent()}
      </div>
    </div>
  );
};

export default TabCard;