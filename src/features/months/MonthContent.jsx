// src/features/months/MonthContent.jsx
import React, { useState, useEffect } from 'react';
import '../styles/MonatContent.css';
import '../styles/MonthDetail.css';
import '../styles/MonthTabs.css';
import '../common/Tabs.css';
import '../styles/Content.css';

// Components
import TeachersList from './components/TeachersList';
import CourseAnalytics from './components/CourseAnalytics';
import SessionsList, { getTotalSessionHours } from './components/SessionsList';
import MonthCourseCalendars from './components/MonthCourseCalendars';


import GroupProgressList from './components/GroupProgressList';
import TabComponent from '../common/TabComponent';
import useMonthData from '../dashboard/hooks/useMonthData';

// Utilities
import { getMonthName, groupCoursesByGroup } from './utils/monthUtils';

const getMonthNameFromId = (monthId) => {
  const [year, month] = monthId.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
};

const MonatContent = () => {
  const {
    months,
    teachers,
    courses,
    sessions,
    students,
    groups,
    loading,
    error,
    expandedMonth,
    monthDetails,
    currentMonthId,
    filterMonths
  } = useMonthData();

  // Set initial active tab to the most recent month
  const [activeTab, setActiveTab] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Sort months in descending order (newest first)
  const sortedMonths = [...months].sort((a, b) => b.id.localeCompare(a.id));

  // Effect to set the initial active tab after data is loaded
  useEffect(() => {
    if (sortedMonths.length > 0 && !activeTab) {
      setActiveTab(sortedMonths[0].id);
    }
  }, [sortedMonths, activeTab]);

  // Create tabs for all available months
  const tabs = sortedMonths.map(month => ({
    id: month.id,
    label: getMonthNameFromId(month.id)
  }));

  // Helper function to get group name by groupId
  const getGroupName = (groupId) => {
    const group = groups.find(g => g.id === groupId);
    return group ? group.name : 'Ungrouped';
  };

  // Handle teacher selection/deselection
  const handleTeacherSelect = (teacher) => {
    setIsAnimating(true);

    // After a short delay, change the selected teacher
    setTimeout(() => {
      setSelectedTeacher(selectedTeacher?.id === teacher.id ? null : teacher);
      setIsAnimating(false);
    }, 150);
  };

  if (loading) {
    return <div>Daten werden geladen...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (months.length === 0) {
    return (
      <div>
        <p>Keine Monatsdaten gefunden. Importieren Sie Kursdaten über den Excel Import.</p>
      </div>
    );
  }

  // Get month details and filter data for currently selected month
  const details = activeTab && monthDetails[activeTab] ? monthDetails[activeTab] : null;
  const currentMonthSessions = sessions
    .filter(session => session.monthId === activeTab)
    .sort((a, b) => {
      if (!a.date || !b.date) return 0;
      const partsA = a.date.split('.');
      const partsB = b.date.split('.');
      if (partsA.length === 3 && partsB.length === 3) {
        const dateA = new Date(partsA[2], partsA[1] - 1, partsA[0]);
        const dateB = new Date(partsB[2], partsB[1] - 1, partsB[0]);
        return dateB - dateA;
      }
      return 0;
    });

  // Filter sessions based on selected teacher
  const filteredSessions = selectedTeacher
    ? currentMonthSessions.filter(session => session.teacherId === selectedTeacher.id)
    : currentMonthSessions;

  const currentMonthCourses = courses.filter(course =>
    currentMonthSessions.some(session => session.courseId === course.id)
  );

  const currentMonthTeachers = teachers.filter(teacher =>
    currentMonthSessions.some(session => session.teacherId === teacher.id)
  );

  // Group courses by groupId
  const courseGroups = groupCoursesByGroup(currentMonthCourses, getGroupName);
  const filteredCourseGroups = selectedTeacher
    ? Object.fromEntries(
      Object.entries(courseGroups).map(([groupName, groupCourses]) => [
        groupName,
        groupCourses.filter(course =>
          sessions.some(session =>
            session.courseId === course.id &&
            session.teacherId === selectedTeacher.id
          )
        )
      ]).filter(([_, courses]) => courses.length > 0)
    )
    : courseGroups;

  const buildTeacherMonthData = () => {
    if (!selectedTeacher) return null;

    // Get all sessions for the selected teacher
    const teacherSessions = sessions.filter(s => s.teacherId === selectedTeacher.id);

    // Create a mapping of month to array of course IDs
    const teacherMonthData = {};
    teacherSessions.forEach(session => {
      if (session.monthId && session.courseId) {
        if (!teacherMonthData[session.monthId]) {
          teacherMonthData[session.monthId] = new Set();
        }
        teacherMonthData[session.monthId].add(session.courseId);
      }
    });

    // Convert sets to arrays for each month
    Object.keys(teacherMonthData).forEach(monthId => {
      teacherMonthData[monthId] = Array.from(teacherMonthData[monthId]);
    });

    return teacherMonthData;
  };

  const teacherMonthData = buildTeacherMonthData();

  return (
    <div className="monat-content">
      <div className="month-header-container">
        <div className="month-title-section">
          <p className="overview-description">Alle wichtigen Daten auf einem Blick</p>
          <h1 className="overview-heading">
            Übersicht für {activeTab ? getMonthNameFromId(activeTab) : ''}
          </h1>
        </div>
        <div className="month-tabs-section">
          <TabComponent
            tabs={tabs}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>
      </div>

      <div className="month-content-area">
        {activeTab && (
          <div className="overview-tab-content">
            <div className="three-column-overview-grid">
              {/* Teachers Column */}
              <div className="overview-panel">
                <div className="panel-header">
                  <h3 className="panel-title">Lehrer ({currentMonthTeachers.length})</h3>
                </div>
                <div className="panel-content">
                  <TeachersList
                    teachers={currentMonthTeachers}
                    sessions={currentMonthSessions}
                    onTeacherSelect={handleTeacherSelect}
                    selectedTeacher={selectedTeacher}
                  />
                </div>
              </div>

              {/* Center Column - Analytics and Courses */}
              <div className="overview-column">
                <CourseAnalytics
                  courses={currentMonthCourses}
                  monthDetails={monthDetails}
                  selectedTeacher={selectedTeacher}
                  sessions={currentMonthSessions}
                  teacherMonthData={teacherMonthData}
                />

                <div className="overview-panel">
                  <div className="panel-header">
                    <h3 className="panel-title">
                      Kurse im {getMonthNameFromId(activeTab)} ({currentMonthCourses.length})
                    </h3>
                  </div>
                  <div className="panel-content">
                    <GroupProgressList
                      courseGroups={filteredCourseGroups}
                      sessions={sessions}
                      teachers={teachers}
                      selectedTeacher={selectedTeacher}
                    />
                  </div>
                </div>
              </div>

              {/* Sessions Column */}
              <div className="overview-panel">
                <div className={`panel-header ${isAnimating ? 'animating' : ''}`}>
                  <h3 className="panel-title">
                    {selectedTeacher
                      ? `Lektionen von ${selectedTeacher.name} (${filteredSessions.length})`
                      : `Lektionen (${currentMonthSessions.length})`}
                  </h3>
                  <div className="tooltip-summary">
                    <span>Total: {getTotalSessionHours(filteredSessions).toFixed(1)}h</span>
                  </div>
                </div>
                <div className="panel-content">
                  <SessionsList
                    sessions={filteredSessions}
                    courses={courses}
                    teachers={teachers}
                  />
                </div>
              </div>
            </div>

            <MonthCourseCalendars
              courses={currentMonthCourses}
              sessions={currentMonthSessions}
              selectedTeacher={selectedTeacher}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MonatContent;