// src/components/Dashboard/MonatContent.jsx
import './MonatContent.css';
import '../styles/MonthDetail.css';
import '../styles/MonthTabs.css';
import '../common/Tabs.css';
import OverviewTab from './tabs/OverviewTab';
import AllMonthsTab from './tabs/AllMonthsTab';
import useMonthData from './hooks/useMonthData';

import TabComponent from '../common/TabComponent';

import React, { useState, useRef, useLayoutEffect } from 'react';

const MonatContent = () => {
  const {
    months,
    teachers,
    courses,
    sessions,
    students,
    groups,
    loading,
    error,
    expandedMonth,
    monthDetails,
    currentMonthId,
    filterMonths
  } = useMonthData();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const tabsContainerRef = useRef(null);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'all', label: 'Alle Monate' }
  ];

  // Handle tab slider position
  useLayoutEffect(() => {
    const updateTabIndicator = () => {
      if (tabsContainerRef.current) {
        const tabContainer = tabsContainerRef.current;
        const activeTabElement = tabContainer.querySelector('.app-tab.active');
        if (activeTabElement) {
          const tabRect = activeTabElement.getBoundingClientRect();
          const containerRect = tabContainer.getBoundingClientRect();
          const left = tabRect.left - containerRect.left;
          tabContainer.style.setProperty('--slider-width', `${tabRect.width}px`);
          tabContainer.style.setProperty('--slider-left', `${left}px`);
        }
      }
    };
    updateTabIndicator();
    const timer = setTimeout(updateTabIndicator, 50);
    window.addEventListener('resize', updateTabIndicator);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateTabIndicator);
    };
  }, [activeTab]);

  const filterMonthsWithQuery = (monthsToFilter) => {
    return filterMonths(searchQuery)(monthsToFilter);
  };

  if (loading) {
    return <div className="notion-page notion-loading">Daten werden geladen...</div>;
  }

  if (error) {
    return <div className="notion-page notion-error">{error}</div>;
  }

  if (months.length === 0) {
    return (
      <div className="notion-page notion-empty">
        <p>Keine Monatsdaten gefunden. Importieren Sie Kursdaten über den Excel Import.</p>
      </div>
    );
  }

  return (
    <div className="notion-page monat-content">
      <TabComponent
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        ref={tabsContainerRef}
      >
        {activeTab === 'overview' && (
          <OverviewTab
            currentMonthId={currentMonthId}
            monthDetails={monthDetails}
            sessions={sessions}
            courses={courses}
            teachers={teachers}
            groups={groups} // Add this line
          />
        )}
        {activeTab === 'all' && (
          <AllMonthsTab
            filterMonths={filterMonthsWithQuery}
            months={months}
            monthDetails={monthDetails}
          />
        )}
      </TabComponent>
    </div>
  );
};

export default MonatContent;