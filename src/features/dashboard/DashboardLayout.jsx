// src/features/dashboard/DashboardLayout.jsx
import { useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

// Content components
import DashboardContent from './DashboardContent';
import ImportContent from './ImportContent';
import MonthContent from '../months/MonthContent';
import KlassenContent from '../courses/CourseContent';
import SchulerContent from './SchulerContent';
import LehrerContent from '../teachers/TeacherContent';
import DatabaseView from '../database/DatabaseView';

// Route components for detail views
import TeacherDetail from '../teachers/TeacherDetail';
import CourseDetail from '../courses/CourseDetail';
import StudentDetail from '../students/StudentDetail';
import PrototypeDashboard from '../../prototype/dashboard/PrototypeDashboard';

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

  // Helper function to get the URL for each route
  const getRouteUrl = (route) => {
    switch (route) {
      case 'dashboard':
        return '/';
      case 'monat':
        return '/months';
      case 'klassen':
        return '/courses';
      case 'lehrer':
        return '/teachers';
      case 'schuler':
        return '/students';
      case 'import':
        return '/import';
      case 'database':
        return '/database';
      default:
        return '/';
    }
  };

  // Handle middle-click to open in new tab
  const handleMouseDown = (event, route) => {
    if (event.button === 1) { // Middle mouse button
      event.preventDefault();
      const url = getRouteUrl(route);
      window.open(url, '_blank');
    }
  };

  // Helper function to determine page title
  const getPageTitle = () => {
    const path = location.pathname;

    if (path === '/') return 'Dashboard Overview';
    if (path.startsWith('/import')) return 'Excel Import';
    if (path.startsWith('/months')) {
      if (path === '/months') return 'Monthly Overview';
      return 'Month Details';
    }
    if (path.startsWith('/courses')) {
      if (path === '/courses') return 'Course Management';
      return 'Course Details';
    }
    if (path.startsWith('/teachers')) {
      if (path === '/teachers') return 'Teacher Management';
      return 'Teacher Profile';
    }
    if (path.startsWith('/students')) {
      if (path === '/students') return 'Student Management';
      return 'Student Profile';
    }
    if (path.startsWith('/database')) return 'Database Overview';

    return 'Dashboard';
  };

  // Check if current page is import page (needs special handling)
  const isImportPage = location.pathname.startsWith('/import');

  return (
    <div className="dashboard-container">
      {/* Modern Sidebar */}
      <div className="sidebar">
        <ul className="nav-items">
          <li
            data-tooltip="Excel Import"
            className={location.pathname === '/import' ? 'active' : ''}
            onClick={() => handleNavigation('import')}
            onMouseDown={(e) => handleMouseDown(e, 'import')}
          >
            <FontAwesomeIcon icon={faFileExcel} className="icon" />
          </li>
          <li
            data-tooltip="Dashboard"
            className={location.pathname === '/' ? 'active' : ''}
            onClick={() => handleNavigation('dashboard')}
            onMouseDown={(e) => handleMouseDown(e, 'dashboard')}
          >
            <FontAwesomeIcon icon={faChartLine} className="icon" />
          </li>
          <li
            data-tooltip="Monthly View"
            className={location.pathname.startsWith('/months') ? 'active' : ''}
            onClick={() => handleNavigation('monat')}
            onMouseDown={(e) => handleMouseDown(e, 'monat')}
          >
            <FontAwesomeIcon icon={faCalendarAlt} className="icon" />
          </li>
          <li
            data-tooltip="Courses"
            className={location.pathname.startsWith('/courses') ? 'active' : ''}
            onClick={() => handleNavigation('klassen')}
            onMouseDown={(e) => handleMouseDown(e, 'klassen')}
          >
            <FontAwesomeIcon icon={faChalkboardTeacher} className="icon" />
          </li>
          <li
            data-tooltip="Teachers"
            className={location.pathname.startsWith('/teachers') ? 'active' : ''}
            onClick={() => handleNavigation('lehrer')}
            onMouseDown={(e) => handleMouseDown(e, 'lehrer')}
          >
            <FontAwesomeIcon icon={faUserTie} className="icon" />
          </li>
          <li
            data-tooltip="Students"
            className={location.pathname.startsWith('/students') ? 'active' : ''}
            onClick={() => handleNavigation('schuler')}
            onMouseDown={(e) => handleMouseDown(e, 'schuler')}
          >
            <FontAwesomeIcon icon={faUserGraduate} className="icon" />
          </li>
          <li
            data-tooltip="Database"
            className={location.pathname.startsWith('/database') ? 'active' : ''}
            onClick={() => handleNavigation('database')}
            onMouseDown={(e) => handleMouseDown(e, 'database')}
          >
            <FontAwesomeIcon icon={faDatabase} className="icon" />
          </li>
        </ul>
      </div>

      {/* Content Area */}
      <div className="content-area">
        {/* Conditional Header - only show for non-import pages */}
        {!isImportPage && (
          <div className="content-header">
            <h1>{getPageTitle()}</h1>
          </div>
        )}

        {/* Content Body */}
        <div className="content-body">
          <Routes>
            <Route path="/" element={<DashboardContent />} />
            <Route path="/import" element={<ImportContent />} />

            {/* Month routes */}
            <Route path="/months" element={<MonthContent />} />
            <Route path="/months/:id" element={<MonthContent />} />

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

            {/* Database route */}
            <Route path="/database" element={<DatabaseView />} />

            {/* Prototype dashboard route */}
            <Route path="/prototype/dashboard" element={<PrototypeDashboard />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;