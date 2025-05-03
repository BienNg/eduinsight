// src/features/import/components/ChangelogPanel.jsx
import React, { useState, useEffect } from 'react';
import { getChangelog, searchChangelog } from '../../firebase/changelog';

const ChangelogPanel = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupedLogs, setGroupedLogs] = useState({});
  
  // Load changelog data
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const data = await getChangelog(50);
      setLogs(data);
      setLoading(false);
    };
    
    fetchLogs();
  }, []);
  
  // Group logs by day when logs change
  useEffect(() => {
    const groups = {};
    logs.forEach(log => {
      if (!groups[log.day]) {
        groups[log.day] = [];
      }
      groups[log.day].push(log);
    });
    
    setGroupedLogs(groups);
  }, [logs]);
  
  // Handle search
  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim() === '') {
      // Reset to normal view if search is cleared
      const data = await getChangelog(50);
      setLogs(data);
    } else {
      // Search logs
      const results = await searchChangelog(query);
      setLogs(results);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Format time for display
  const formatTime = (dateString) => {
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };

  return (
    <div className="changelog-panel" style={{ 
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      marginTop: '20px',
      maxHeight: '600px',
      overflowY: 'auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0 }}>Activity Log</h3>
        <input
          type="text"
          placeholder="Search logs..."
          value={searchQuery}
          onChange={handleSearch}
          style={{
            padding: '8px 12px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            width: '40%'
          }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          No activities found
        </div>
      ) : (
        Object.keys(groupedLogs).sort().reverse().map(day => (
          <div key={day} className="day-group">
            <div style={{ 
              padding: '8px 0',
              marginTop: '10px',
              borderBottom: '1px solid #eee',
              fontWeight: 'bold',
              position: 'sticky',
              top: 0,
              backgroundColor: 'white',
              zIndex: 1
            }}>
              {formatDate(day)}
            </div>
            
            {groupedLogs[day].map((log) => (
              <div key={log.id} style={{ 
                padding: '12px 0',
                borderBottom: '1px solid #f5f5f5',
                fontSize: '14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 'medium', color: '#1e88e5' }}>
                    {log.filename}
                  </span>
                  <span style={{ color: '#666', fontSize: '12px' }}>
                    {formatTime(log.timestamp)}
                  </span>
                </div>
                
                <div style={{ marginTop: '6px', color: '#444' }}>
                  <div>Added {log.coursesAdded > 0 ? `${log.coursesAdded} course(s), ` : ''}{log.sessionsAdded} session(s) 
                  {log.monthsAffected.length > 0 ? ` to ${log.monthsAffected.length} month(s)` : ''}</div>
                  
                  {(log.studentsAdded > 0 || log.teachersAdded > 0) && (
                    <div style={{ marginTop: '4px', fontSize: '13px', color: '#666' }}>
                      {log.studentsAdded > 0 ? `${log.studentsAdded} new student(s)` : ''}
                      {log.studentsAdded > 0 && log.teachersAdded > 0 ? ', ' : ''}
                      {log.teachersAdded > 0 ? `${log.teachersAdded} new teacher(s)` : ''}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
};

export default ChangelogPanel;