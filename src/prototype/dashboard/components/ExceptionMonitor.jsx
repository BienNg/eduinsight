// src/prototype/dashboard/components/ExceptionMonitor.jsx
import React, { useState } from 'react';
import './components.css'; 

const ExceptionMonitor = ({ alerts, filters }) => {
  const [activeTab, setActiveTab] = useState('attendance');
  
  // Count alerts by type
  const alertCounts = {
    attendance: alerts.attendance.length,
    scheduling: alerts.scheduling.length,
    dataQuality: alerts.dataQuality.length,
    progress: alerts.progress.length
  };
  
  const totalAlerts = Object.values(alertCounts).reduce((sum, count) => sum + count, 0);
  
  return (
    <div className="exception-monitor-card">
      <div className="exception-header">
        <h3>Exception Monitoring</h3>
        <div className="total-alerts">
          {totalAlerts} alerts
        </div>
      </div>
      
      <div className="exception-tabs">
        <button 
          className={`tab-button ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          Attendance
          {alertCounts.attendance > 0 && (
            <span className="alert-count">{alertCounts.attendance}</span>
          )}
        </button>
        <button 
          className={`tab-button ${activeTab === 'scheduling' ? 'active' : ''}`}
          onClick={() => setActiveTab('scheduling')}
        >
          Scheduling
          {alertCounts.scheduling > 0 && (
            <span className="alert-count">{alertCounts.scheduling}</span>
          )}
        </button>
        <button 
          className={`tab-button ${activeTab === 'dataQuality' ? 'active' : ''}`}
          onClick={() => setActiveTab('dataQuality')}
        >
          Data Quality
          {alertCounts.dataQuality > 0 && (
            <span className="alert-count">{alertCounts.dataQuality}</span>
          )}
        </button>
        <button 
          className={`tab-button ${activeTab === 'progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('progress')}
        >
          Progress
          {alertCounts.progress > 0 && (
            <span className="alert-count">{alertCounts.progress}</span>
          )}
        </button>
      </div>
      
      <div className="exception-content">
        {activeTab === 'attendance' && (
          <div className="alert-list">
            {alerts.attendance.length > 0 ? (
              alerts.attendance.map(alert => (
                <div key={alert.id} className={`alert-item severity-${alert.severity}`}>
                  <div className="alert-indicator"></div>
                  <div className="alert-content">
                    <div className="alert-message">{alert.message}</div>
                    <div className="alert-details">
                      {alert.value && <span>Rate: {alert.value}%</span>}
                    </div>
                  </div>
                  <div className="alert-actions">
                    <button className="action-button">View</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-alerts">No attendance alerts detected</div>
            )}
          </div>
        )}
        
        {activeTab === 'scheduling' && (
          <div className="alert-list">
            {alerts.scheduling.length > 0 ? (
              alerts.scheduling.map(alert => (
                <div key={alert.id} className={`alert-item severity-${alert.severity}`}>
                  <div className="alert-indicator"></div>
                  <div className="alert-content">
                    <div className="alert-message">{alert.message}</div>
                  </div>
                  <div className="alert-actions">
                    <button className="action-button">View</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-alerts">No scheduling alerts detected</div>
            )}
          </div>
        )}
        
        {activeTab === 'dataQuality' && (
          <div className="alert-list">
            {alerts.dataQuality.length > 0 ? (
              alerts.dataQuality.map(alert => (
                <div key={alert.id} className={`alert-item severity-${alert.severity}`}>
                  <div className="alert-indicator"></div>
                  <div className="alert-content">
                    <div className="alert-message">{alert.message}</div>
                  </div>
                  <div className="alert-actions">
                    <button className="action-button">Fix</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-alerts">No data quality issues detected</div>
            )}
          </div>
        )}
        
        {activeTab === 'progress' && (
          <div className="alert-list">
            {alerts.progress.length > 0 ? (
              alerts.progress.map(alert => (
                <div key={alert.id} className={`alert-item severity-${alert.severity}`}>
                  <div className="alert-indicator"></div>
                  <div className="alert-content">
                    <div className="alert-message">{alert.message}</div>
                    <div className="alert-details">
                      <span>Expected: {alert.expected}%</span>
                      <span>Actual: {alert.actual}%</span>
                    </div>
                  </div>
                  <div className="alert-actions">
                    <button className="action-button">View</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-alerts">No progress alerts detected</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExceptionMonitor;