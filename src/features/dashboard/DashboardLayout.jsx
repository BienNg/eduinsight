// src/features/dashboard/DashboardLayout.jsx
import { useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

// Content components
import DashboardContent from './DashboardContent';
import ImportContent from './ImportContent';
import MonatContent from '../months/MonatContent';
import KlassenContent from '../courses/CourseContent';
import SchulerContent from './SchulerContent';
import LehrerContent from '../teachers/TeacherContent';
import DatabaseView from '../database/DatabaseView';

// Route components for detail views
import TeacherDetail from '../teachers/TeacherDetail';
import CourseDetail from '../courses/CourseDetail';
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
  faUserTie,
  faDatabase
} from '@fortawesome/free-solid-svg-icons';

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const handleNavigation = (route) => {
    switch (route) {
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
      case 'database':
        navigate('/database');
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
      <div className="sidebar">
        <ul className="nav-items">
          <li
            data-tooltip="Excel Import"
            className={location.pathname === '/import' ? 'active' : ''}
            onClick={() => handleNavigation('import')}
          >
            <FontAwesomeIcon icon={faFileExcel} className="icon" />
          </li>
          <li
            data-tooltip="Dashboard"
            className={location.pathname === '/' ? 'active' : ''}
            onClick={() => handleNavigation('dashboard')}
          >
            <FontAwesomeIcon icon={faChartLine} className="icon" />
          </li>
          <li
            data-tooltip="Monat"
            className={location.pathname.startsWith('/months') ? 'active' : ''}
            onClick={() => handleNavigation('monat')}
          >
            <FontAwesomeIcon icon={faCalendarAlt} className="icon" />
          </li>
          <li
            data-tooltip="Klassen"
            className={location.pathname.startsWith('/courses') ? 'active' : ''}
            onClick={() => handleNavigation('klassen')}
          >
            <FontAwesomeIcon icon={faChalkboardTeacher} className="icon" />
          </li>
          <li
            data-tooltip="Lehrer"
            className={location.pathname.startsWith('/teachers') ? 'active' : ''}
            onClick={() => handleNavigation('lehrer')}
          >
            <FontAwesomeIcon icon={faUserTie} className="icon" />
          </li>
          <li
            data-tooltip="Schüler"
            className={location.pathname.startsWith('/students') ? 'active' : ''}
            onClick={() => handleNavigation('schuler')}
          >
            <FontAwesomeIcon icon={faUserGraduate} className="icon" />
          </li>
          <li
            data-tooltip="Database"
            className={location.pathname.startsWith('/database') ? 'active' : ''}
            onClick={() => handleNavigation('database')}
          >
            <FontAwesomeIcon icon={faDatabase} className="icon" />
          </li>
        </ul>
      </div>

      {/* Content Area - This updates with route changes */}
      <div className="content-area">
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
            <Route path="/courses/group/:groupName/course/:courseId" element={<KlassenContent />} />

            {/* Teacher routes */}
            <Route path="/teachers" element={<LehrerContent />} />
            <Route path="/teachers/:id" element={<TeacherDetail />} />

            {/* Student routes */}
            <Route path="/students" element={<SchulerContent />} />
            <Route path="/students/:id" element={<StudentDetail />} />
            
            {/* Add the new route for database view */}
            <Route path="/database" element={<DatabaseView />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;