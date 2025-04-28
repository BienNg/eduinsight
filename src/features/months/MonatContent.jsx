// Css Imports
import '../styles/MonatContent.css';
import '../styles/MonthDetail.css';
import '../styles/MonthTabs.css';
import '../common/Tabs.css';

// JSX Imports
import OverviewTab from './tabs/MonthOverviewTab';
import AllMonthsTab from './tabs/AllMonthsTab';
import useMonthData from '../dashboard/hooks/useMonthData';
import TabComponent from '../common/TabComponent';

// Library Imports
import React, { useState } from 'react';

const getPreviousMonthId = () => {
  const now = new Date();
  // Go back one month
  now.setMonth(now.getMonth() - 1);
  const year = now.getFullYear();
  // Add 1 to getMonth() because it's zero-indexed, then pad with leading zero if needed
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
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

  const previousMonthId = getPreviousMonthId();
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
    <div className=" monat-content">
      <div className="month-header-container">
        {activeTab === 'overview' && (
          <div className="month-title-section">
            <p className="overview-description">Alle wichtigen Daten auf einem Blick</p>
            <h1 className="overview-heading">
              Übersicht für {(() => {
                const [year, month] = previousMonthId.split('-');
                const date = new Date(parseInt(year), parseInt(month) - 1, 1);
                const monthNames = [
                  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
                ];
                return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
              })()}
            </h1>
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
            currentMonthId={previousMonthId} // Pass previousMonthId instead of currentMonthId
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