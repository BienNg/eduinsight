// src/components/Dashboard/Dashboard.jsx
import { useState } from 'react';
import './Dashboard.css';
import DashboardContent from './DashboardContent';
import MonatContent from './MonatContent';
import KlassenContent from './KlassenContent';
import SchulerContent from './SchulerContent';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, 
  faCalendarAlt, 
  faChalkboardTeacher, 
  faUserGraduate,
  faChevronLeft,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';

const Dashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };
  
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent />;
      case 'monat':
        return <MonatContent />;
      case 'klassen':
        return <KlassenContent />;
      case 'schuler':
        return <SchulerContent />;
      default:
        return <DashboardContent />;
    }
  };
  
  return (
    <div className="dashboard-container">
      <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h2>{collapsed ? 'EI' : 'EduInsight'}</h2>
          <button className="toggle-btn" onClick={toggleSidebar}>
            <FontAwesomeIcon icon={collapsed ? faChevronRight : faChevronLeft} />
          </button>
        </div>
        
        <div className="nav-section">
          <div className="nav-title">{collapsed ? 'L' : 'Lehrer'}</div>
          <ul className="nav-items">
            <li 
              className={activeTab === 'dashboard' ? 'active' : ''} 
              onClick={() => setActiveTab('dashboard')}
            >
              <FontAwesomeIcon icon={faChartLine} className="icon" />
              {!collapsed && <span>Dashboard</span>}
            </li>
            <li 
              className={activeTab === 'monat' ? 'active' : ''} 
              onClick={() => setActiveTab('monat')}
            >
              <FontAwesomeIcon icon={faCalendarAlt} className="icon" />
              {!collapsed && <span>Monat</span>}
            </li>
            <li 
              className={activeTab === 'klassen' ? 'active' : ''} 
              onClick={() => setActiveTab('klassen')}
            >
              <FontAwesomeIcon icon={faChalkboardTeacher} className="icon" />
              {!collapsed && <span>Klassen</span>}
            </li>
            <li 
              className={activeTab === 'schuler' ? 'active' : ''} 
              onClick={() => setActiveTab('schuler')}
            >
              <FontAwesomeIcon icon={faUserGraduate} className="icon" />
              {!collapsed && <span>Schüler</span>}
            </li>
          </ul>
        </div>
      </div>
      
      <div className="content-area">
        <div className="content-header">
          <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
        </div>
        <div className="content-body">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;