// src/components/Dashboard/MonatContent.jsx
import './MonatContent.css';
import '../styles/MonthDetail.css';
import '../styles/MonthTabs.css';
import '../common/Tabs.css';
import TabComponent from '../common/TabComponent';
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { getAllRecords } from '../firebase/database';
import { countLongSessions } from '../utils/sessionUtils';
import { calculateTotalHours } from '../utils/timeUtils';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell } from 'recharts';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
    const currentDate = new Date();
    const last4Months = Array.from({ length: 4 }, (_, i) => {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - (3 - i), 1);
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1
      };
    });
    const monthNames = [
      'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
      'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'
    ];
    return last4Months.map(({ year, month }) => {
      const monthId = `${year}-${month.toString().padStart(2, '0')}`;
      const details = monthDetails[monthId];
      return {
        month: monthNames[month - 1].substring(0, 3),
        courses: details ? details.courseCount : 0
      };
    });
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  useLayoutEffect(() => {
    const updateTabIndicator = () => {
      if (tabsContainerRef.current) {
        const tabContainer = tabsContainerRef.current;
        const activeTabElement = tabContainer.querySelector('.app-tab.active');
        if (activeTabElement) {
          const tabRect = activeTabElement.getBoundingClientRect();
          const containerRect = tabContainer.getBoundingClientRect();
          const left = tabRect.left - containerRect.left;
          tabContainer.style.setProperty('--slider-width', `${tabRect.width}px`);
          tabContainer.style.setProperty('--slider-left', `${left}px`);
        }
      }
    };
    updateTabIndicator();
    const timer = setTimeout(updateTabIndicator, 50);
    window.addEventListener('resize', updateTabIndicator);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateTabIndicator);
    };
  }, [activeTab]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const monthsData = await getAllRecords('months');
        const teachersData = await getAllRecords('teachers');
        const coursesData = await getAllRecords('courses');
        const sessionsData = await getAllRecords('sessions');
        const studentsData = await getAllRecords('students');
        setMonths(monthsData);
        setTeachers(teachersData);
        setCourses(coursesData);
        setSessions(sessionsData);
        setStudents(studentsData);
        const details = {};
        monthsData.forEach((month) => {
          const monthSessions = sessionsData.filter((session) => session.monthId === month.id);
          const totalHours = calculateTotalHours(monthSessions);
          const courseIds = [...new Set(monthSessions.map((session) => session.courseId))];
          const monthCourses = coursesData.filter((course) =>
            courseIds.includes(course.id)
          );
          const teacherIds = [...new Set(monthCourses.flatMap((course) =>
            course.teacherIds ? course.teacherIds : []
          ))];
          const studentIds = new Set();
          monthCourses.forEach((course) => {
            if (course.studentIds) {
              course.studentIds.forEach((id) => studentIds.add(id));
            }
          });
          const teacherDetails = teacherIds.map((teacherId) => {
            const teacher = teachersData.find((t) => t.id === teacherId);
            if (!teacher) return null;
            const teacherSessions = monthSessions.filter((session) => session.teacherId === teacherId);
            const teacherHours = calculateTotalHours(teacherSessions);
            const teacherCourseIds = [...new Set(teacherSessions.map((session) => session.courseId))];
            const teacherCourses = coursesData.filter((course) => teacherCourseIds.includes(course.id));
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
        const now = new Date();
        const currentMonth = now.toISOString().substring(0, 7);
        const currentMonthObj = monthsData.find(month => month.id.startsWith(currentMonth));
        if (currentMonthObj) {
          setCurrentMonthId(currentMonthObj.id);
          setExpandedMonth(currentMonthObj.id);
        } else {
          const sortedMonths = [...monthsData].sort((a, b) => b.id.localeCompare(a.id));
          if (sortedMonths.length > 0) {
            setCurrentMonthId(sortedMonths[0].id);
            setExpandedMonth(sortedMonths[0].id);
          }
        }
      } catch (err) {
        setError("Failed to load month data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCourseClick = (course) => {
    navigate(`/courses/${course.id}`);
  };

  const renderCurrentMonthDetails = () => {
    if (!currentMonthId || !monthDetails[currentMonthId]) {
      return <div className="notion-empty">Keine Daten für den aktuellen Monat verfügbar.</div>;
    }
    const month = months.find(m => m.id === currentMonthId);
    const details = monthDetails[currentMonthId];
    return (
      <div className="current-month-details">
        <h2 className="notion-h2">{month ? month.name : 'Aktueller Monat'}</h2>
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
        <div className="compact-overview-grid">
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

  const renderAllMonthsDetails = () => {
    const filteredMonths = filterMonths(months).sort((a, b) => b.id.localeCompare(a.id));
    return (
      <>
        {/* ...implementation for all months view... */}
      </>
    );
  };

  const renderOverviewTab = () => {
    if (!currentMonthId || !monthDetails[currentMonthId]) {
      return <div className="notion-empty">Keine Daten für den aktuellen Monat verfügbar.</div>;
    }
    const details = monthDetails[currentMonthId];
    const currentMonthSessions = sessions
      .filter(session => session.monthId === currentMonthId)
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
    const currentMonthCourses = courses.filter(course =>
      currentMonthSessions.some(session => session.courseId === course.id)
    );
    const currentMonthTeachers = teachers.filter(teacher =>
      currentMonthSessions.some(session => session.teacherId === teacher.id)
    );
    const chartData = prepareChartData();
    return (
      <div className="overview-tab-content">
        <p className="overview-description">Alle wichtigen Daten auf einem Blick</p>
        <h1 className="overview-heading">Übersicht über diesen Monat</h1>
        <div className="three-column-overview-grid">
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
          <div className="overview-column">
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
                        outerRadius={70}
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
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip animationDuration={200} animationEasing="ease-in-out" />
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
                      />
                      <YAxis hide={true} />
                      <Tooltip animationDuration={200} animationEasing="ease-in-out" />
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
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
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

  const filterMonths = (months) => {
    if (!searchQuery) return months;
    return months.filter(month => {
      if (month.name && month.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return true;
      }
      const details = monthDetails[month.id];
      if (!details) return false;
      const teacherMatch = details.teachers.some(teacher =>
        teacher.name && teacher.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (teacherMatch) return true;
      const courseMatch = details.courses && details.courses.some(course =>
        course.name && course.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (courseMatch) return true;
      const groupMatch = details.courses && details.courses.some(course =>
        course.group && course.group.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return groupMatch;
    });
  };

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
    </div>
  );
};

export default MonatContent;