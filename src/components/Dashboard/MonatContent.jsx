// src/components/Dashboard/MonatContent.jsx
import { useState, useEffect } from 'react';
import { getAllRecords } from '../../firebase/database';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChalkboardTeacher, faUserGraduate, faClock, faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import './MonthDetail.css';
import { isLongSession, countLongSessions } from '../../utils/sessionUtils';
import { calculateTotalHours } from '../../utils/timeUtils';

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

        monthsData.forEach(month => {
          // Get sessions for this month
          const monthSessions = sessionsData.filter(session => session.monthId === month.id);

          // Calculate hours using the timeUtils function (with flat rate)
          const totalHours = calculateTotalHours(monthSessions);

          // Get unique course IDs
          const courseIds = [...new Set(monthSessions.map(session => session.courseId))];

          // Get courses for this month
          const monthCourses = coursesData.filter(course =>
            courseIds.includes(course.id)
          );

          // Get unique teacher IDs
          const teacherIds = [...new Set(monthCourses.flatMap(course =>
            course.teacherIds ? course.teacherIds : []
          ))];

          // Get teachers for this month
          const monthTeachers = teachersData.filter(teacher =>
            teacherIds.includes(teacher.id)
          );

          // Get all students from these courses
          const studentIds = new Set();
          monthCourses.forEach(course => {
            if (course.studentIds) {
              course.studentIds.forEach(id => studentIds.add(id));
            }
          });

          // Process teacher details
          const teacherDetails = teacherIds.map(teacherId => {
            const teacher = teachersData.find(t => t.id === teacherId);
            if (!teacher) return null;

            // Get ALL sessions for this month where this teacher is listed as the teacher
            const teacherSessions = monthSessions.filter(session => session.teacherId === teacherId);

            // Calculate hours using the timeUtils function (with flat rate)
            const teacherHours = calculateTotalHours(teacherSessions);

            // Get unique course IDs from the teacher's sessions
            const teacherCourseIds = [...new Set(teacherSessions.map(session => session.courseId))];
            const teacherCourses = coursesData.filter(course => teacherCourseIds.includes(course.id));

            // Get all students from these courses
            const teacherStudentIds = new Set();
            teacherCourses.forEach(course => {
              if (course.studentIds) {
                course.studentIds.forEach(id => teacherStudentIds.add(id));
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
          }).filter(t => t !== null);

          details[month.id] = {
            teacherCount: teacherIds.length,
            studentCount: studentIds.size,
            courseCount: courseIds.length,
            sessionCount: monthSessions.length,
            hours: totalHours,
            teachers: teacherDetails,
            longSessions: countLongSessions(monthSessions)
          };
        });

        setMonthDetails(details);
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

  return (
    <div className="monat-content">
      <h2>Monatsübersicht</h2>

      {loading && <div className="loading-indicator">Daten werden geladen...</div>}

      {error && <div className="error-message">{error}</div>}

      {!loading && !error && (
        <>
          {months.length === 0 ? (
            <div className="empty-state">
              <p>Keine Monatsdaten gefunden. Importieren Sie Kursdaten über den Excel Import.</p>
            </div>
          ) : (
            <div className="month-cards-container">
              {months
                .sort((a, b) => b.id.localeCompare(a.id)) // Sort by ID (YYYY-MM) in descending order
                .map(month => {
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
                    <div key={month.id} className="month-card">

                      <div
                        className="month-card-header"
                        onClick={() => toggleMonthExpansion(month.id)}
                      >
                        <h3>{month.name}</h3>
                        <div className="month-card-stats">
                          <div className="stat-item">
                            <FontAwesomeIcon icon={faChalkboardTeacher} />
                            <span>{details.teacherCount} Lehrer</span>
                          </div>
                          <div className="stat-item">
                            <FontAwesomeIcon icon={faUserGraduate} />
                            <span>{details.studentCount} Schüler</span>
                          </div>
                          <div className="stat-item">
                            <FontAwesomeIcon icon={faClock} />
                            <span>{details.hours.toFixed(1)} Stunden</span>
                          </div>
                          <div className="expand-toggle">
                            <FontAwesomeIcon
                              icon={expandedMonth === month.id ? faChevronDown : faChevronRight}
                            />
                          </div>
                        </div>
                      </div>

                      {expandedMonth === month.id && (
                        <div className="month-card-details">
                          <div className="month-summary">
                            <div className="summary-item">
                              <div className="summary-value">{details.courseCount}</div>
                              <div className="summary-label">Kurse</div>
                            </div>
                            <div className="summary-item">
                              <div className="summary-value">{details.sessionCount}</div>
                              <div className="summary-label">Lektionen</div>
                            </div>
                            <div className="summary-item">
                              <div className="summary-value">{details.studentCount}</div>
                              <div className="summary-label">Schüler</div>
                            </div>
                            <div className="summary-item">
                              <div className="summary-value">{details.hours.toFixed(1)}</div>
                              <div className="summary-label">Stunden</div>
                            </div>
                            <div className="summary-item">
                              <div className="summary-value">{details.longSessions}</div>
                              <div className="summary-label">2h-Lektionen</div>
                            </div>
                          </div>

                          <h4>Lehrer diesen Monat</h4>
                          <div className="teacher-cards-container">
                            {details.teachers.length === 0 ? (
                              <p className="no-data-message">Keine Lehrer in diesem Monat.</p>
                            ) : (
                              details.teachers.map(teacher => (
                                <div key={teacher.id} className="teacher-card">
                                  <div className="teacher-card-header">
                                    <h5>{teacher.name}</h5>
                                  </div>
                                  <div className="teacher-card-body">
                                    <div className="teacher-stat">
                                      <span className="label">Kurse:</span>
                                      <span className="value">{teacher.courseCount}</span>
                                    </div>
                                    <div className="teacher-stat">
                                      <span className="label">Lektionen:</span>
                                      <span className="value">{teacher.sessionCount}</span>
                                    </div>
                                    <div className="teacher-stat">
                                      <span className="label">Schüler:</span>
                                      <span className="value">{teacher.studentCount}</span>
                                    </div>
                                    <div className="teacher-stat">
                                      <span className="label">Stunden:</span>
                                      <span className="value">{teacher.hours.toFixed(1)}</span>
                                    </div>
                                    {teacher.longSessions > 0 && (
                                      <div className="teacher-stat">
                                        <span className="label">2h-Lektionen:</span>
                                        <span className="value">{teacher.longSessions}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MonatContent;