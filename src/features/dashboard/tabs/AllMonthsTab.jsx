// src/components/Dashboard/tabs/AllMonthsTab.jsx
import React from 'react';

const AllMonthsTab = ({ filterMonths, months, monthDetails }) => {
  const filteredMonths = filterMonths(months).sort((a, b) => b.id.localeCompare(a.id));
  
  return (
    <>
      {/* Implementation for all months view - this was commented out in your original code
          I'm creating a placeholder component structure here */}
      <div className="all-months-container">
        {filteredMonths.length > 0 ? (
          filteredMonths.map(month => (
            <div key={month.id} className="month-card">
              <h3>{month.name || month.id}</h3>
              {/* Add your month details rendering here */}
            </div>
          ))
        ) : (
          <div className="notion-empty">Keine Monate gefunden, die den Filterkriterien entsprechen.</div>
        )}
      </div>
    </>
  );
};

export default AllMonthsTab;