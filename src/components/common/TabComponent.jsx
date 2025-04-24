// src/components/common/TabComponent.jsx
import React, { useRef, useLayoutEffect } from 'react';
import '../../styles/common/Tabs.css';

const TabComponent = ({ tabs, activeTab, setActiveTab, children }) => {
  const tabsContainerRef = useRef(null);

  useLayoutEffect(() => {
    const updateTabIndicator = () => {
      if (tabsContainerRef.current) {
        const tabContainer = tabsContainerRef.current;
        const activeTabElement = tabContainer.querySelector('.app-tab.active');

        if (activeTabElement) {
          // Get dimensions
          const tabRect = activeTabElement.getBoundingClientRect();
          const containerRect = tabContainer.getBoundingClientRect();

          // Calculate positions
          const left = tabRect.left - containerRect.left;

          // Set custom properties for the sliding indicator
          tabContainer.style.setProperty('--slider-width', `${tabRect.width}px`);
          tabContainer.style.setProperty('--slider-left', `${left}px`);
        }
      }
    };

    // Run immediately
    updateTabIndicator();

    // Also run after a short delay to ensure everything has rendered
    const timer = setTimeout(updateTabIndicator, 50);

    // Run on window resize too
    window.addEventListener('resize', updateTabIndicator);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateTabIndicator);
    };
  }, [activeTab]); // Depends on activeTab

  return (
    <div className="tab-component">
      <div className="app-tab-list" ref={tabsContainerRef}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`app-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="app-tab-panel">
        {children}
      </div>
    </div>
  );
};

export default TabComponent;