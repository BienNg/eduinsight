// src/features/dashboard/DashboardLayout.jsx
import { useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

// Content components
import DashboardContent from './DashboardContent';
import ImportContent from './ImportContent';
import MonatContent from './MonatContent';
import KlassenContent from './KlassenContent';
import SchulerContent from './SchulerContent';
import LehrerContent from './LehrerContent';

// Route components for detail views
import TeacherDetail from '../teachers/TeacherDetail';
import CourseDetail from './CourseDetail';
import StudentDetail from '../students/StudentDetail';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine,
  faCalendarAlt,
  faChalkboardTeacher,
  faUserGraduate,
  faChevronLeft,
  faChevronRight,
  faFileExcel,
  faUserTie
} from '@fortawesome/free-solid-svg-icons';

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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

  // Helper function to determine page title
  const getPageTitle = () => {
    const path = location.pathname;
    
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/import')) return 'Excel Import';
    if (path.startsWith('/months')) return 'Monat';
    if (path.startsWith('/courses')) return 'Klassen';
    if (path.startsWith('/teachers')) return 'Lehrer';
    if (path.startsWith('/students')) return 'Schüler';
    
    return 'Dashboard';
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar - This stays consistent */}
      <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h2>{collapsed ? 'EI' : 'EduInsight'}</h2>
          <button className="toggle-btn" onClick={toggleSidebar}>
            <FontAwesomeIcon icon={collapsed ? faChevronRight : faChevronLeft} />
          </button>
        </div>
        
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

      {/* Content Area - This updates with route changes */}
      <div className="content-area">
        <div className="content-header">
          <h1>{getPageTitle()}</h1>
        </div>
        <div className="content-body">
          <Routes>
            <Route path="/" element={<DashboardContent />} />
            <Route path="/import" element={<ImportContent />} />
            
            {/* Month routes */}
            <Route path="/months" element={<MonatContent />} />
            <Route path="/months/:id" element={<MonatContent />} />
            
            {/* Course routes */}
            <Route path="/courses" element={<KlassenContent />} />
            <Route path="/courses/:id" element={<CourseDetail />} />
            <Route path="/courses/group/:groupName" element={<KlassenContent />} />
            
            {/* Teacher routes */}
            <Route path="/teachers" element={<LehrerContent />} />
            <Route path="/teachers/:id" element={<TeacherDetail />} />
            
            {/* Student routes */}
            <Route path="/students" element={<SchulerContent />} />
            <Route path="/students/:id" element={<StudentDetail />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;