// src/features/dashboard/LehrerContent.jsx
import { useState, useEffect } from 'react';
import { getAllRecords } from '../firebase/database';
import '../styles/Content.css';
import { useNavigate } from 'react-router-dom';
import TabComponent from '../common/TabComponent';

const LehrerContent = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const teachersData = await getAllRecords('teachers');
      setTeachers(teachersData);
    } catch (err) {
      console.error("Error fetching teachers:", err);
      setError("Failed to load teachers. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (teacherId) => {
    navigate(`/teachers/${teacherId}`);
  };

  // Define the tabs
  const tabs = [
    { id: 'overview', label: 'Übersicht' },
    { id: 'allTeachers', label: 'Alle Lehrer' }
  ];

  return (
    <div className="lehrer-content">
      <TabComponent 
        tabs={tabs} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
      >
        {activeTab === 'overview' && (
          <div className="overview-tab-content">
            {/* Overview tab content will go here */}
            <p>Teacher overview content will be added later</p>
          </div>
        )}
        
        {activeTab === 'allTeachers' && (
          <div className="all-teachers-content">
            {/* All Teachers tab content will go here */}
            {loading && <div className="loading-indicator">Loading teachers data...</div>}
            
            {error && <div className="error-message">{error}</div>}
            
            {!loading && !error && teachers.length === 0 && (
              <div className="empty-state">
                <p>No teachers found. Import teacher data using Excel Import.</p>
              </div>
            )}
            
            {!loading && !error && teachers.length > 0 && (
              <div className="teachers-container">
                {/* Your teachers display layout will go here */}
                <p>Teacher count: {teachers.length}</p>
              </div>
            )}
          </div>
        )}
      </TabComponent>
    </div>
  );
};

export default LehrerContent;