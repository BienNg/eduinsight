// src/features/dashboard/MonatContent.jsx
import './MonatContent.css';
import '../styles/MonthDetail.css';
import '../styles/MonthTabs.css';
import '../common/Tabs.css';
import OverviewTab from './tabs/OverviewTab';
import AllMonthsTab from './tabs/AllMonthsTab';
import useMonthData from './hooks/useMonthData';

import TabComponent from '../common/TabComponent';

import React, { useState } from 'react';

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

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'all', label: 'Alle Monate' }
  ];

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
      <div className="month-header-container">
        {activeTab === 'overview' && (
          <div className="month-title-section">
            <p className="overview-description">Alle wichtigen Daten auf einem Blick</p>
            <h1 className="overview-heading">Übersicht über diesen Monat</h1>
          </div>
        )}
        <div className="month-tabs-section">
          <TabComponent
            tabs={tabs}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>
      </div>
      
      <div className="month-content-area">
        {activeTab === 'overview' && (
          <OverviewTab
            currentMonthId={currentMonthId}
            monthDetails={monthDetails}
            sessions={sessions}
            courses={courses}
            teachers={teachers}
            groups={groups}
          />
        )}
        {activeTab === 'all' && (
          <AllMonthsTab
            filterMonths={filterMonthsWithQuery}
            months={months}
            monthDetails={monthDetails}
          />
        )}
      </div>
    </div>
  );
};

export default MonatContent;