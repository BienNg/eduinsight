// Modify MonatContent.jsx
import React, { useState, useEffect } from 'react';
import '../styles/MonatContent.css';
import '../styles/MonthDetail.css';
import '../styles/MonthTabs.css';
import '../common/Tabs.css';

import OverviewTab from './tabs/MonthOverviewTab';
import useMonthData from '../dashboard/hooks/useMonthData';
import TabComponent from '../common/TabComponent';

const getMonthName = (monthId) => {
  const [year, month] = monthId.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
};

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

  // Set initial active tab to the most recent month
  const [activeTab, setActiveTab] = useState('');

  // Sort months in descending order (newest first)
  const sortedMonths = [...months].sort((a, b) => b.id.localeCompare(a.id));
  
  // Effect to set the initial active tab after data is loaded
  useEffect(() => {
    if (sortedMonths.length > 0 && !activeTab) {
      setActiveTab(sortedMonths[0].id);
    }
  }, [sortedMonths, activeTab]);

  // Create tabs for all available months
  const tabs = sortedMonths.map(month => ({
    id: month.id,
    label: getMonthName(month.id)
  }));

  if (loading) {
    return <div>Daten werden geladen...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (months.length === 0) {
    return (
      <div>
        <p>Keine Monatsdaten gefunden. Importieren Sie Kursdaten über den Excel Import.</p>
      </div>
    );
  }

  return (
    <div className="monat-content">
      <div className="month-header-container">
        <div className="month-title-section">
          <p className="overview-description">Alle wichtigen Daten auf einem Blick</p>
          <h1 className="overview-heading">
            Übersicht für {activeTab ? getMonthName(activeTab) : ''}
          </h1>
        </div>
        <div className="month-tabs-section">
          <TabComponent
            tabs={tabs}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>
      </div>

      <div className="month-content-area">
        {activeTab && (
          <OverviewTab
            currentMonthId={activeTab}
            monthDetails={monthDetails}
            sessions={sessions}
            courses={courses}
            teachers={teachers}
            groups={groups}
          />
        )}
      </div>
    </div>
  );
};

export default MonatContent;