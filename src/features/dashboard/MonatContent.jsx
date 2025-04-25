// src/components/Dashboard/MonatContent.jsx
import './MonatContent.css';
import '../styles/MonthDetail.css';
import '../styles/MonthTabs.css';
import '../common/Tabs.css';
import TabComponent from '../common/TabComponent';
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { getAllRecords } from '../firebase/database';
import { isLongSession, countLongSessions } from '../utils/sessionUtils';
import { calculateTotalHours } from '../utils/timeUtils';
import CourseDetail from './CourseDetail';
import { useParams, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Area } from 'recharts';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


const MonatContent = () => {
  const navigate = useNavigate();
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
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const tabsContainerRef = useRef(null);
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'current', label: 'Aktueller Monat' },
    { id: 'all', label: 'Alle Monate' }
  ];

  const prepareLevelData = (courses) => {
    const levelCounts = {};
    courses.forEach(course => {
      const level = course.level || 'Unbekannt';
      levelCounts[level] = (levelCounts[level] || 0) + 1;
    });

    return Object.entries(levelCounts).map(([level, count]) => ({
      name: level,
      value: count
    }));
  };

  const prepareChartData = () => {
    // Get current month and previous 3 months
    const currentDate = new Date();
    const last4Months = Array.from({length: 4}, (_, i) => {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - (3-i), 1);
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1
      };
    });

    const monthNames = [
      'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
      'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'
    ];

    return last4Months.map(({year, month}) => {
      const monthId = `${year}-${month.toString().padStart(2, '0')}`;
      const details = monthDetails[monthId];
      return {
        month: monthNames[month - 1].substring(0, 3),
        courses: details ? details.courseCount : 0
      };
    });
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];


  // Add this useEffect to handle the underline animation
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
              longSessions: countLongSessions(teacherSessions),
              courses: teacherCourses
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
            courses: monthCourses
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

  // Handler for opening the course detail modal
  const handleCourseClick = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  // Handler for closing the course detail modal
  const handleCloseModal = () => {
    setSelectedCourse(null);
  };

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
            <div className="notion-stat-value">{details.teacherCount}</div>
            <div className="notion-stat-label">Lehrer aktiv</div>
          </div>
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
              {teacher.courses && teacher.courses.length > 0 && (
                <div className="teacher-stat-row">
                  <div className="teacher-stat">
                    <div className="stat-label">Unterrichtete Kurse</div>
                    <div className="course-badges">
                      {teacher.courses.map((course) => (
                        <div
                          key={course.id}
                          className="level-badge clickable"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCourseClick(course.id);
                          }}
                        >
                          {course.name || 'Unbenannter Kurs'}
                        </div>
                      ))}
                    </div>
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
  // Updated renderCurrentMonthDetails function in MonatContent.jsx
  const renderCurrentMonthDetails = () => {
    if (!currentMonthId || !monthDetails[currentMonthId]) {
      return <div className="notion-empty">Keine Daten für den aktuellen Monat verfügbar.</div>;
    }

    const month = months.find(m => m.id === currentMonthId);
    const details = monthDetails[currentMonthId];

    return (
      <div className="current-month-details">
        <h2 className="notion-h2">{month ? month.name : 'Aktueller Monat'}</h2>

        {/* Compact Summary Stats Card */}
        <div className="compact-stats-grid">
          <div className="stat-card compact">
            <div className="stat-value">{details.courseCount}</div>
            <div className="stat-label">Kurse</div>
          </div>
          <div className="stat-card compact">
            <div className="stat-value">{details.sessionCount}</div>
            <div className="stat-label">Lektionen</div>
          </div>
          <div className="stat-card compact">
            <div className="stat-value">{details.studentCount}</div>
            <div className="stat-label">Schüler</div>
          </div>
          <div className="stat-card compact">
            <div className="stat-value">{details.hours.toFixed(1)}</div>
            <div className="stat-label">Stunden</div>
          </div>
          <div className="stat-card compact">
            <div className="stat-value">{details.longSessions}</div>
            <div className="stat-label">2h-Lektionen</div>
          </div>
        </div>

        {/* Compact Teacher and Course Overview */}
        <div className="compact-overview-grid">
          {/* Teachers Overview Panel */}
          <div className="overview-panel">
            <div className="panel-header">
              <h3 className="panel-title">Lehrer ({details.teachers.length})</h3>
            </div>
            <div className="panel-content">
              <div className="compact-teacher-list">
                {details.teachers.length > 0 ? (
                  details.teachers.map((teacher) => (
                    <div className="compact-teacher-item" key={teacher.id}>
                      <div className="teacher-name">{teacher.name}</div>
                      <div className="teacher-meta">
                        <span>{teacher.sessionCount} Lektionen</span>
                        <span>{teacher.hours.toFixed(1)}h</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-message">Keine Lehrer in diesem Monat.</div>
                )}
              </div>
            </div>
          </div>

          {/* Courses Overview Panel */}
          <div className="overview-panel">
            <div className="panel-header">
              <h3 className="panel-title">Kurse ({details.courses.length})</h3>
            </div>
            <div className="panel-content">
              <div className="compact-course-list">
                {details.courses.length > 0 ? (
                  details.courses.map((course) => (
                    <div
                      className="compact-course-item clickable"
                      key={course.id}
                      onClick={() => handleCourseClick(course)}
                    >
                      <div className="course-name-wrapper">
                        <div className="course-name">{course.name || 'Unbenannter Kurs'}</div>
                        <div className="course-level">{course.level || 'N/A'}</div>
                      </div>
                      <div className="course-meta">
                        <span>{sessions.filter(s => s.courseId === course.id && s.monthId === currentMonthId).length} Lektionen</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-message">Keine Kurse in diesem Monat.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Function to render all months view with search
  const renderAllMonthsDetails = () => {
    const filteredMonths = filterMonths(months).sort((a, b) => b.id.localeCompare(a.id));

    return (
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
    );
  };

  // New function to render the overview tab
  const renderOverviewTab = () => {
    if (!currentMonthId || !monthDetails[currentMonthId]) {
      return <div className="notion-empty">Keine Daten für den aktuellen Monat verfügbar.</div>;
    }

    const details = monthDetails[currentMonthId];
    const month = months.find(m => m.id === currentMonthId);

    // Get current month's sessions sorted by date (newest first)
    const currentMonthSessions = sessions
      .filter(session => session.monthId === currentMonthId)
      .sort((a, b) => {
        if (!a.date || !b.date) return 0;
        const partsA = a.date.split('.');
        const partsB = b.date.split('.');
        if (partsA.length === 3 && partsB.length === 3) {
          const dateA = new Date(partsA[2], partsA[1] - 1, partsA[0]);
          const dateB = new Date(partsB[2], partsB[1] - 1, partsB[0]);
          return dateB - dateA; // Descending order
        }
        return 0;
      });

    // Get current month's courses
    const currentMonthCourses = courses.filter(course =>
      currentMonthSessions.some(session => session.courseId === course.id)
    );

    // Get current month's teachers
    const currentMonthTeachers = teachers.filter(teacher =>
      currentMonthSessions.some(session => session.teacherId === teacher.id)
    );

    const chartData = prepareChartData();
    return (
      <div className="overview-tab-content">

        {/* Three-column Overview Grid */}
        <div className="three-column-overview-grid">
          {/* Sessions Panel - First Column */}
          <div className="overview-panel">
            <div className="panel-header">
              <h3 className="panel-title">Lektionen ({currentMonthSessions.length})</h3>
            </div>
            <div className="panel-content">
              {currentMonthSessions.length > 0 ? (
                <div className="compact-session-list">
                  {currentMonthSessions.slice(0, 10).map(session => {
                    const course = courses.find(c => c.id === session.courseId) || {};
                    const teacher = teachers.find(t => t.id === session.teacherId) || {};
                    return (
                      <div className="compact-session-item" key={session.id}>
                        <div className="session-main-info">
                          <div className="session-date">{session.date}</div>
                          <div className="session-title">{session.title}</div>
                        </div>
                        <div className="session-meta">
                          <span className="meta-course">{course.name || 'Unbekannter Kurs'}</span>
                          <span className="meta-teacher">{teacher.name || 'Unbekannter Lehrer'}</span>
                        </div>
                      </div>
                    );
                  })}
                  {currentMonthSessions.length > 10 && (
                    <div className="more-items-hint">
                      +{currentMonthSessions.length - 10} weitere Lektionen
                    </div>
                  )}
                </div>
              ) : (
                <div className="empty-message">Keine Lektionen in diesem Monat.</div>
              )}
            </div>
          </div>

          {/* Courses Panel - Second Column */}
          <div className="overview-column">
            {/* Analytics Cards Row */}
            <div className="analytics-row">
              <div className="analytics-card animate-card">
                <h3>Kurse nach Niveau</h3>
                <div style={{ width: '100%', height: '200px' }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={prepareLevelData(currentMonthCourses)}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                        label={false}
                        labelLine={false}
                        animationBegin={0}
                        animationDuration={1500}
                        animationEasing="ease-out"
                      >
                        {prepareLevelData(currentMonthCourses).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}>
                            <animate
                              attributeName="opacity"
                              from="0"
                              to="1"
                              dur="1s"
                              begin={`${index * 200}ms`}
                            />
                          </Cell>
                        ))}
                      </Pie>
                      <Tooltip 
                        animationDuration={200}
                        animationEasing="ease-in-out"
                      />
                      <Legend
                        wrapperStyle={{
                          paddingTop: '20px',
                          opacity: 1,
                          transition: 'opacity 0.5s ease-in'
                        }}
                        layout="horizontal"
                        align="center"
                        verticalAlign="bottom"
                        iconType="circle"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="analytics-card animate-card">
                <h3>Anzahl Kurse pro Monat</h3>
                <div style={{ width: '100%', height: '200px' }}>
                  <ResponsiveContainer>
                    <LineChart 
                      data={chartData}
                      margin={{ top: 5, right: 20, bottom: 5, left: 20 }}
                    >
                      <XAxis 
                        dataKey="month" 
                        interval={0}
                        tickMargin={5}
                        height={40}
                        tick={{ fill: '#666', fontSize: 12 }}
                      >
                        <animate
                          attributeName="opacity"
                          from="0"
                          to="1"
                          dur="1s"
                          begin="1.2s"
                          fill="freeze"
                        />
                      </XAxis>
                      <YAxis hide={true} />
                      <Tooltip 
                        animationDuration={200}
                        animationEasing="ease-in-out"
                      />
                      <Line
                        type="monotone"
                        dataKey="courses"
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={{ fill: '#8884d8', r: 4 }}
                        activeDot={{ r: 6 }}
                        animationBegin={600}
                        animationDuration={1500}
                        animationEasing="ease-out"
                      >
                        <animate
                          attributeName="stroke-dashoffset"
                          from="500"
                          to="0"
                          dur="1.5s"
                          begin="0.5s"
                          fill="freeze"
                        />
                      </Line>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Courses Overview Card */}
            <div className="overview-panel">
              <div className="panel-header">
                <h3 className="panel-title">Kurse ({currentMonthCourses.length})</h3>
              </div>
              <div className="panel-content">
                {currentMonthCourses.length > 0 ? (
                  <div className="compact-course-list">
                    {currentMonthCourses.map(course => (
                      <div
                        className="compact-course-item clickable"
                        key={course.id}
                        onClick={() => handleCourseClick(course)}
                      >
                        <div className="course-name-wrapper">
                          <div className="course-name">{course.name || 'Unbenannter Kurs'}</div>
                          <div className="course-level">{course.level || 'N/A'}</div>
                        </div>
                        <div className="course-meta">
                          <span>{sessions.filter(s => s.courseId === course.id && s.monthId === currentMonthId).length} Lektionen</span>
                          <span>{course.studentIds ? course.studentIds.length : 0} Schüler</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-message">Keine Kurse in diesem Monat.</div>
                )}
              </div>
            </div>
          </div>

          {/* Teachers Panel - Third Column */}
          <div className="overview-panel">
            <div className="panel-header">
              <h3 className="panel-title">Lehrer ({currentMonthTeachers.length})</h3>
            </div>
            <div className="panel-content">
              {currentMonthTeachers.length > 0 ? (
                <div className="compact-teacher-list">
                  {currentMonthTeachers.map(teacher => {
                    const teacherSessions = currentMonthSessions.filter(s => s.teacherId === teacher.id);
                    const teacherHours = calculateTotalHours(teacherSessions);
                    return (
                      <div className="compact-teacher-item" key={teacher.id}>
                        <div className="teacher-name">{teacher.name}</div>
                        <div className="teacher-meta">
                          <span>{teacherSessions.length} Lektionen</span>
                          <span>{teacherHours.toFixed(1)}h</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-message">Keine Lehrer in diesem Monat.</div>
              )}
            </div>
          </div>
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

  return (
    <div className="notion-page monat-content">
      <TabComponent
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        ref={tabsContainerRef}
      >
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'current' && renderCurrentMonthDetails()}
        {activeTab === 'all' && renderAllMonthsDetails()}
      </TabComponent>
      {selectedCourse && (
        <div
          className="modal-backdrop"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={handleCloseModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '90%',
              maxWidth: '1000px',
              height: '90%',
              maxHeight: '800px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
              overflow: 'auto'
            }}
          >
            <CourseDetail
              courseId={selectedCourse.id}
              onClose={handleCloseModal}
              groupName={selectedCourse.group}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MonatContent;