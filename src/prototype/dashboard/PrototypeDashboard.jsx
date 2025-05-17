// src/prototype/dashboard/PrototypeDashboard.jsx
import React, { useState } from 'react';
import { mockCourses, mockStudents, mockAttendance, mockTeachers, mockGroups, mockAlerts } from './mockData';
import './PrototypeDashboard.css';
import './components/components.css';


// Helper components
import TermProgress from './components/TermProgress';
import ActiveCourses from './components/ActiveCourses';
import StudentEnrollment from './components/StudentEnrollment';
import QuickCalendar from './components/QuickCalendar';
import AttendanceAnalytics from './components/AttendanceAnalytics';
import CourseProgress from './components/CourseProgress';
import GroupPerformance from './components/GroupPerformance';
import ExceptionMonitor from './components/ExceptionMonitor';
import FilterSidebar from './components/FilterSidebar';
import ActionFooter from './components/ActionFooter';

const PrototypeDashboard = () => {
  // State to store filter settings
  const [filters, setFilters] = useState({
    timePeriod: 'term',
    courseType: 'all',
    teacherId: null,
    groupId: null
  });

  // Update filters function
  const updateFilters = (newFilters) => {
    setFilters({...filters, ...newFilters});
  };

  return (
    <div className="prototype-dashboard">
      {/* Top Section: Operational Overview */}
      <div className="operational-overview">
        <TermProgress currentWeek={8} totalWeeks={12} />
        <ActiveCourses courses={mockCourses} />
        <StudentEnrollment 
          currentCount={mockStudents.length} 
          previousCount={108} 
        />
        <QuickCalendar />
      </div>

      {/* Main Content Area */}
      <div className="dashboard-main-content">
        {/* Left sidebar with filters */}
        <aside className="filter-sidebar">
          <FilterSidebar 
            filters={filters} 
            updateFilters={updateFilters} 
            courseTypes={['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2']}
            teachers={mockTeachers}
            groups={mockGroups}
          />
        </aside>

        {/* Performance Indicators (Main Grid) */}
        <main className="performance-indicators">
          <div className="performance-grid">
            <AttendanceAnalytics 
              attendanceData={mockAttendance} 
              filters={filters} 
            />
            <CourseProgress 
              courses={mockCourses} 
              filters={filters} 
            />
            <GroupPerformance 
              groups={mockGroups}
              courses={mockCourses}
              filters={filters}
            />
          </div>

          {/* Exception Monitoring Section */}
          <div className="exception-monitoring">
            <ExceptionMonitor 
              alerts={mockAlerts}
              filters={filters}
            />
          </div>
        </main>
      </div>

      {/* Footer Action Center */}
      <footer className="action-footer">
        <ActionFooter />
      </footer>
    </div>
  );
};

export default PrototypeDashboard;