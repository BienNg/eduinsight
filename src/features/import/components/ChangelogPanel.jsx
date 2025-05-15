import React, { useState, useEffect } from 'react';
import { getChangelog, searchChangelog } from '../../firebase/changelog';

const ChangelogPanel = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupedLogs, setGroupedLogs] = useState({});
  const [error, setError] = useState(null);
  
  // Load changelog data
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        console.log("Fetching changelog data...");
        const data = await getChangelog(50);
        console.log("Changelog data retrieved:", data.length, "items");
        setLogs(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching changelog:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLogs();
  }, []);
  
  // Group logs by day when logs change
  useEffect(() => {
    if (!logs || logs.length === 0) {
      setGroupedLogs({});
      return;
    }
    
    console.log("Grouping logs by day, total logs:", logs.length);
    const groups = {};
    logs.forEach(log => {
      // Ensure log.day exists, if not, try to extract from timestamp
      const day = log.day || (log.timestamp ? log.timestamp.split('T')[0] : 'unknown');
      
      if (!groups[day]) {
        groups[day] = [];
      }
      groups[day].push(log);
    });
    
    console.log("Grouped logs:", Object.keys(groups).length, "days");
    setGroupedLogs(groups);
  }, [logs]);
  
  // Handle search
  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setLoading(true);
    
    try {
      if (query.trim() === '') {
        // Reset to normal view if search is cleared
        const data = await getChangelog(50);
        setLogs(data);
      } else {
        // Search logs
        const results = await searchChangelog(query);
        setLogs(results);
      }
      setError(null);
    } catch (err) {
      console.error("Error during search:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown Date';
    
    try {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (err) {
      console.error("Error formatting date:", dateString, err);
      return dateString; // Return the original string if parsing fails
    }
  };
  
  // Format time for display
  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    try {
      const options = { hour: '2-digit', minute: '2-digit' };
      return new Date(dateString).toLocaleTimeString(undefined, options);
    } catch (err) {
      console.error("Error formatting time:", dateString, err);
      return '';
    }
  };

  return (
    <div className="changelog-panel" style={{ 
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
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
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#c62828' }}>
          Error: {error}
        </div>
      ) : logs.length === 0 || Object.keys(groupedLogs).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          No activities found
          {searchQuery ? ` matching "${searchQuery}"` : ''}
          {/* Add debug info when in development */}
          {process.env.NODE_ENV === 'development' && 
            <div style={{ fontSize: '12px', marginTop: '10px', color: '#999' }}>
              Debug: {logs.length} logs retrieved, {Object.keys(groupedLogs).length} grouped days
            </div>
          }
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
                    {log.filename || 'Unnamed action'}
                  </span>
                  <span style={{ color: '#666', fontSize: '12px' }}>
                    {formatTime(log.timestamp)}
                  </span>
                </div>
                
                <div style={{ marginTop: '6px', color: '#444' }}>
                  <div>Added {log.coursesAdded > 0 ? `${log.coursesAdded} course(s), ` : ''}{log.sessionsAdded} session(s) 
                  {log.monthsAffected && log.monthsAffected.length > 0 ? ` to ${log.monthsAffected.length} month(s)` : ''}</div>
                  
                  {((log.studentsAdded && log.studentsAdded > 0) || (log.teachersAdded && log.teachersAdded > 0)) && (
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