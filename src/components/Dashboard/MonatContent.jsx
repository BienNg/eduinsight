// src/components/Dashboard/MonatContent.jsx
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { getAllRecords } from '../../firebase/database';
import { isLongSession, countLongSessions } from '../../utils/sessionUtils';
import { calculateTotalHours } from '../../utils/timeUtils';
import './MonthDetail.css';
import './MonthTabs.css'; // We'll create this CSS file
import '../../styles/common/Tabs.css';
import TabComponent from '../common/TabComponent';

const MonatContent = () => {
  const [months, setMonths] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedMonth, setExpandedMonth] = useState(null);
  const [monthDetails, setMonthDetails] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMonthId, setCurrentMonthId] = useState(null);
  const [activeTab, setActiveTab] = useState('current')
  const tabsContainerRef = useRef(null);
  const tabs = [
    { id: 'current', label: 'Aktueller Monat' },
    { id: 'all', label: 'Alle Monate' }
  ];

  // Add this useEffect to handle the underline animation
  // Update the useEffect to work with your custom tab buttons
  useLayoutEffect(() => {
    const updateTabIndicator = () => {
      if (tabsContainerRef.current) {
        const tabContainer = tabsContainerRef.current;
        const activeTabElement = tabContainer.querySelector('.app-tab.active');

        if (activeTabElement) {
          // Get dimensions
          const tabRect = activeTabElement.getBoundingClientRect();
          const containerRect = tabContainer.getBoundingClientRect();

          // Calculate positions
          const left = tabRect.left - containerRect.left;

          // Set custom properties for the sliding indicator
          tabContainer.style.setProperty('--slider-width', `${tabRect.width}px`);
          tabContainer.style.setProperty('--slider-left', `${left}px`);
        }
      }
    };

    // Run immediately
    updateTabIndicator();

    // Also run after a short delay to ensure everything has rendered
    const timer = setTimeout(updateTabIndicator, 50);

    // Run on window resize too
    window.addEventListener('resize', updateTabIndicator);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateTabIndicator);
    };
  }, [activeTab]); // Depends on activeTab

  useEffect(() => {
    // Small delay to ensure the DOM is fully rendered
    const timer = setTimeout(() => {
      if (tabsContainerRef.current) {
        const tabContainer = tabsContainerRef.current;
        const activeTabElement = tabContainer.querySelector('.app-tab.active');

        if (activeTabElement) {
          // Get dimensions
          const tabRect = activeTabElement.getBoundingClientRect();
          const containerRect = tabContainer.getBoundingClientRect();

          // Calculate positions
          const left = tabRect.left - containerRect.left;

          // Set custom properties for the sliding indicator
          tabContainer.style.setProperty('--slider-width', `${tabRect.width}px`);
          tabContainer.style.setProperty('--slider-left', `${left}px`);
        }
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch all required data
        const monthsData = await getAllRecords('months');
        const teachersData = await getAllRecords('teachers');
        const coursesData = await getAllRecords('courses');
        const sessionsData = await getAllRecords('sessions');
        const studentsData = await getAllRecords('students');

        // Set the basic data
        setMonths(monthsData);
        setTeachers(teachersData);
        setCourses(coursesData);
        setSessions(sessionsData);
        setStudents(studentsData);

        // Process and calculate stats for each month
        const details = {};

        monthsData.forEach((month) => {
          // Get sessions for this month
          const monthSessions = sessionsData.filter((session) => session.monthId === month.id);

          // Calculate hours using the timeUtils function (with flat rate)
          const totalHours = calculateTotalHours(monthSessions);

          // Get unique course IDs
          const courseIds = [...new Set(monthSessions.map((session) => session.courseId))];

          // Get courses for this month
          const monthCourses = coursesData.filter((course) =>
            courseIds.includes(course.id)
          );

          // Get unique teacher IDs
          const teacherIds = [...new Set(monthCourses.flatMap((course) =>
            course.teacherIds ? course.teacherIds : []
          ))];

          // Get teachers for this month
          const monthTeachers = teachersData.filter((teacher) =>
            teacherIds.includes(teacher.id)
          );

          // Get all students from these courses
          const studentIds = new Set();
          monthCourses.forEach((course) => {
            if (course.studentIds) {
              course.studentIds.forEach((id) => studentIds.add(id));
            }
          });

          // Process teacher details
          const teacherDetails = teacherIds.map((teacherId) => {
            const teacher = teachersData.find((t) => t.id === teacherId);
            if (!teacher) return null;

            // Get ALL sessions for this month where this teacher is listed as the teacher
            const teacherSessions = monthSessions.filter((session) => session.teacherId === teacherId);

            // Calculate hours using the timeUtils function (with flat rate)
            const teacherHours = calculateTotalHours(teacherSessions);

            // Get unique course IDs from the teacher's sessions
            const teacherCourseIds = [...new Set(teacherSessions.map((session) => session.courseId))];
            const teacherCourses = coursesData.filter((course) => teacherCourseIds.includes(course.id));

            // Get all students from these courses
            const teacherStudentIds = new Set();
            teacherCourses.forEach((course) => {
              if (course.studentIds) {
                course.studentIds.forEach((id) => teacherStudentIds.add(id));
              }
            });

            return {
              id: teacherId,
              name: teacher.name,
              courseCount: teacherCourses.length,
              sessionCount: teacherSessions.length,
              studentCount: teacherStudentIds.size,
              hours: teacherHours,
              longSessions: countLongSessions(teacherSessions)
            };
          }).filter((t) => t !== null);

          details[month.id] = {
            teacherCount: teacherIds.length,
            studentCount: studentIds.size,
            courseCount: courseIds.length,
            sessionCount: monthSessions.length,
            hours: totalHours,
            teachers: teacherDetails,
            longSessions: countLongSessions(monthSessions),
            courses: monthCourses  // Adding courses to details for more detailed view
          };
        });

        setMonthDetails(details);

        // Find current month
        const now = new Date();
        const currentMonth = now.toISOString().substring(0, 7); // YYYY-MM format
        const currentMonthObj = monthsData.find(month => month.id.startsWith(currentMonth));

        if (currentMonthObj) {
          setCurrentMonthId(currentMonthObj.id);
          setExpandedMonth(currentMonthObj.id); // Auto-expand current month
        } else {
          // If current month not found, use the latest month
          const sortedMonths = [...monthsData].sort((a, b) => b.id.localeCompare(a.id));
          if (sortedMonths.length > 0) {
            setCurrentMonthId(sortedMonths[0].id);
            setExpandedMonth(sortedMonths[0].id);
          }
        }
      } catch (err) {
        console.error("Error fetching month data:", err);
        setError("Failed to load month data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleMonthExpansion = (monthId) => {
    setExpandedMonth(expandedMonth === monthId ? null : monthId);
  };

  const renderMonthHeader = (month, details) => (
    <div className="notion-block month-header" onClick={() => toggleMonthExpansion(month.id)}>
      <div className="notion-block-content">
        <div className="notion-block-toggle">
          <div className="notion-block-toggle-icon">
            {expandedMonth === month.id ? "▾" : "▸"}
          </div>
          <div className="notion-block-text">{month.name}</div>
        </div>
      </div>
      <div className="notion-metadata">
        <div className="notion-metadata-item">{details.teacherCount} Lehrer</div>
        <div className="notion-metadata-item">{details.studentCount} Schüler</div>
        <div className="notion-metadata-item">{details.hours.toFixed(1)}h</div>
        <div className="notion-metadata-item">{details.sessionCount} Lektionen</div>
      </div>
    </div>
  );

  const renderMonthSummary = (details) => (
    <div className="notion-callout">
      <div className="notion-callout-content">
        <div className="notion-stat-grid">
          <div className="notion-stat">
            <div className="notion-stat-value">{details.courseCount}</div>
            <div className="notion-stat-label">Kurse</div>
          </div>
          <div className="notion-stat">
            <div className="notion-stat-value">{details.sessionCount}</div>
            <div className="notion-stat-label">Lektionen</div>
          </div>
          <div className="notion-stat">
            <div className="notion-stat-value">{details.studentCount}</div>
            <div className="notion-stat-label">Schüler</div>
          </div>
          <div className="notion-stat">
            <div className="notion-stat-value">{details.hours.toFixed(1)}</div>
            <div className="notion-stat-label">Stunden</div>
          </div>
          <div className="notion-stat">
            <div className="notion-stat-value">{details.longSessions}</div>
            <div className="notion-stat-label">2h-Lektionen</div>
          </div>
        </div>
      </div>
    </div>
  );

  // New render function for teacher cards instead of the togglable list
  const renderTeacherCards = (teachers) => (
    <div className="teacher-cards-grid">
      {teachers.map((teacher) => (
        <div className="teacher-card" key={teacher.id}>
          <div className="teacher-card-header">
            <h3 className="teacher-name">{teacher.name}</h3>
          </div>
          <div className="teacher-card-body">
            <div className="teacher-stats">
              <div className="teacher-stat-row">
                <div className="teacher-stat">
                  <div className="stat-label">Stunden</div>
                  <div className="stat-value">{teacher.hours.toFixed(1)}h</div>
                </div>
                <div className="teacher-stat">
                  <div className="stat-label">Lektionen</div>
                  <div className="stat-value">{teacher.sessionCount}</div>
                </div>
              </div>
              <div className="teacher-stat-row">
                <div className="teacher-stat">
                  <div className="stat-label">Kurse</div>
                  <div className="stat-value">{teacher.courseCount}</div>
                </div>
                <div className="teacher-stat">
                  <div className="stat-label">Schüler</div>
                  <div className="stat-value">{teacher.studentCount}</div>
                </div>
              </div>
              {teacher.longSessions > 0 && (
                <div className="teacher-stat-row long-sessions">
                  <div className="teacher-stat">
                    <div className="stat-label">2h-Lektionen</div>
                    <div className="stat-value">{teacher.longSessions}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // New function to render course cards for the current month view
  const renderCourseCards = (courses) => (
    <div className="courses-grid">
      {courses.map((course) => (
        <div className="course-card" key={course.id}>
          <div className="course-header">
            <h3>{course.name || 'Unbenannter Kurs'}</h3>
            <div className="course-level">{course.level || 'N/A'}</div>
          </div>
          <div className="course-info">
            <div className="info-item">
              <div className="label">Schüler</div>
              <div className="value">{course.studentIds ? course.studentIds.length : 0}</div>
            </div>
            <div className="info-item">
              <div className="label">Lektionen</div>
              <div className="value">
                {sessions.filter(session => session.courseId === course.id && session.monthId === currentMonthId).length}
              </div>
            </div>
            <div className="info-item">
              <div className="label">Stunden</div>
              <div className="value">
                {calculateTotalHours(sessions.filter(session => session.courseId === course.id && session.monthId === currentMonthId)).toFixed(1)}h
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // New component for the current month details
  const renderCurrentMonthDetails = () => {
    if (!currentMonthId || !monthDetails[currentMonthId]) {
      return <div className="notion-empty">Keine Daten für den aktuellen Monat verfügbar.</div>;
    }

    const month = months.find(m => m.id === currentMonthId);
    const details = monthDetails[currentMonthId];

    return (
      <div className="current-month-details">
        <h1 className="notion-h1">{month ? month.name : 'Aktueller Monat'}</h1>

        {/* Summary Stats */}
        <div className="current-month-summary">
          {renderMonthSummary(details)}
        </div>

        {/* Teachers Section */}
        <div className="current-month-section">
          <h2 className="notion-h2">Lehrer</h2>
          {details.teachers.length === 0 ? (
            <div className="notion-empty-message">Keine Lehrer in diesem Monat.</div>
          ) : (
            renderTeacherCards(details.teachers)
          )}
        </div>

        {/* Courses Section */}
        <div className="current-month-section">
          <h2 className="notion-h2">Kurse</h2>
          {details.courses.length === 0 ? (
            <div className="notion-empty-message">Keine Kurse in diesem Monat.</div>
          ) : (
            renderCourseCards(details.courses)
          )}
        </div>
      </div>
    );
  };

  // Filter function for search
  const filterMonths = (months) => {
    if (!searchQuery) return months;

    return months.filter(month => {
      // Search by month name
      if (month.name && month.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return true;
      }

      const details = monthDetails[month.id];
      if (!details) return false;

      // Search by teacher name
      const teacherMatch = details.teachers.some(teacher =>
        teacher.name && teacher.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (teacherMatch) return true;

      // Search by course name
      const courseMatch = details.courses && details.courses.some(course =>
        course.name && course.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (courseMatch) return true;

      // Search by group name (assuming groups are in courses)
      const groupMatch = details.courses && details.courses.some(course =>
        course.group && course.group.toLowerCase().includes(searchQuery.toLowerCase())
      );

      return groupMatch;
    });
  };

  // Main render function
  if (loading) {
    return <div className="notion-page notion-loading">Daten werden geladen...</div>;
  }

  if (error) {
    return <div className="notion-page notion-error">{error}</div>;
  }

  if (months.length === 0) {
    return (
      <div className="notion-page notion-empty">
        <p>Keine Monatsdaten gefunden. Importieren Sie Kursdaten über den Excel Import.</p>
      </div>
    );
  }

  const filteredMonths = filterMonths(months).sort((a, b) => b.id.localeCompare(a.id));

  return (
    <div className="notion-page monat-content">
      <TabComponent tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab}>
        {activeTab === 'current' && renderCurrentMonthDetails()}
        {activeTab === 'all' && (
          <>
            <div className="all-months-header">
              {/* Search container and other elements */}
            </div>
            <div className="notion-blocks">
              {/* Month blocks */}
            </div>
          </>
        )}
      </TabComponent>

      <div className="app-tab-panel">
        {activeTab === 'current' && renderCurrentMonthDetails()}

        {activeTab === 'all' && (
          <>
            <div className="all-months-header">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="month-search-input"
                />
              </div>
            </div>

            <div className="notion-blocks">
              {filteredMonths.map((month) => {
                const details = monthDetails[month.id] || {
                  teacherCount: 0,
                  studentCount: 0,
                  courseCount: 0,
                  sessionCount: 0,
                  hours: 0,
                  teachers: [],
                  longSessions: 0
                };

                return (
                  <div className="notion-block-group" key={month.id}>
                    {renderMonthHeader(month, details)}

                    {expandedMonth === month.id && (
                      <div className="notion-block-children">
                        {renderMonthSummary(details)}

                        <div className="notion-h2">Lehrer diesen Monat</div>

                        {details.teachers.length === 0 ? (
                          <div className="notion-empty-message">Keine Lehrer in diesem Monat.</div>
                        ) : (
                          renderTeacherCards(details.teachers)
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MonatContent;