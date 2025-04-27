// Update src/components/Dashboard/Dashboard.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import '../styles/Dashboard.css';
import DashboardContent from './DashboardContent';
import MonatContent from '../months/MonatContent';
import KlassenContent from './KlassenContent';
import SchulerContent from './SchulerContent';
import LehrerContent from './LehrerContent'; // Add this import
import ImportContent from './ImportContent';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine,
  faCalendarAlt,
  faChalkboardTeacher,
  faUserGraduate,
  faChevronLeft,
  faChevronRight,
  faFileExcel,
  faUserTie // Add this for teacher icon
} from '@fortawesome/free-solid-svg-icons';

const Dashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const handleNavigation = (route) => {
    switch(route) {
      case 'dashboard':
        navigate('/');
        break;
      case 'monat':
        navigate('/months');
        break;
      case 'klassen':
        navigate('/courses');
        break;
      case 'lehrer':
        navigate('/teachers');
        break;
      case 'schuler':
        navigate('/students');
        break;
      case 'import':
        navigate('/import');
        break;
      default:
        navigate('/');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent />;
      case 'monat':
        return <MonatContent />;
      case 'klassen':
        return <KlassenContent />;
      case 'lehrer':
        return <LehrerContent />;
      case 'schuler':
        return <SchulerContent />;
      case 'import':
        return <ImportContent />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className="dashboard-container">
      <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        {/* ... sidebar header ... */}
        
        <div className="nav-section">
          <div className="nav-title">{collapsed ? 'I' : 'Import'}</div>
          <ul className="nav-items">
            <li
              className={location.pathname === '/import' ? 'active' : ''}
              onClick={() => handleNavigation('import')}
            >
              <FontAwesomeIcon icon={faFileExcel} className="icon" />
              {!collapsed && <span>Excel Import</span>}
            </li>
          </ul>
        </div>

        <div className="nav-section">
          <div className="nav-title">{collapsed ? 'L' : 'Tabs'}</div>
          <ul className="nav-items">
            <li
              className={location.pathname === '/' ? 'active' : ''}
              onClick={() => handleNavigation('dashboard')}
            >
              <FontAwesomeIcon icon={faChartLine} className="icon" />
              {!collapsed && <span>Dashboard</span>}
            </li>
            <li
              className={location.pathname.startsWith('/months') ? 'active' : ''}
              onClick={() => handleNavigation('monat')}
            >
              <FontAwesomeIcon icon={faCalendarAlt} className="icon" />
              {!collapsed && <span>Monat</span>}
            </li>
            <li
              className={location.pathname.startsWith('/courses') ? 'active' : ''}
              onClick={() => handleNavigation('klassen')}
            >
              <FontAwesomeIcon icon={faChalkboardTeacher} className="icon" />
              {!collapsed && <span>Klassen</span>}
            </li>
            <li
              className={location.pathname.startsWith('/teachers') ? 'active' : ''}
              onClick={() => handleNavigation('lehrer')}
            >
              <FontAwesomeIcon icon={faUserTie} className="icon" />
              {!collapsed && <span>Lehrer</span>}
            </li>
            <li
              className={location.pathname.startsWith('/students') ? 'active' : ''}
              onClick={() => handleNavigation('schuler')}
            >
              <FontAwesomeIcon icon={faUserGraduate} className="icon" />
              {!collapsed && <span>Schüler</span>}
            </li>
          </ul>
        </div>
      </div>

      <div className="content-area">
        <div className="content-header">
          <h1>
            {activeTab === 'dashboard' && 'Dashboard'}
            {activeTab === 'monat' && 'Monat'}
            {activeTab === 'klassen' && 'Klassen'}
            {activeTab === 'lehrer' && 'Lehrer'} {/* Add this line */}
            {activeTab === 'schuler' && 'Schüler'}
            {activeTab === 'import' && 'Excel Import'}
          </h1>
        </div>
        <div className="content-body">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;