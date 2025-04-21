// src/components/Dashboard/TeacherDetail.jsx
import { useState, useEffect } from 'react';
import { getRecordById, getAllRecords } from '../../firebase/database';
import './CourseDetail.css'; // Reuse existing styles

const TeacherDetail = ({ teacherId, onClose }) => {
  const [teacher, setTeacher] = useState(null);
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchTeacherDetails = async () => {
      try {
        setLoading(true);

        // Fetch teacher data
        const teacherData = await getRecordById('teachers', teacherId);
        if (!teacherData) {
          throw new Error("Teacher not found");
        }
        setTeacher(teacherData);

        // Fetch course data
        const coursesData = await Promise.all(
          (teacherData.courseIds || []).map(courseId => getRecordById('courses', courseId))
        );
        setCourses(coursesData.filter(c => c !== null));
        
        // Collect all session IDs from all courses
        const allSessionIds = [];
        coursesData.forEach(course => {
          if (course && course.sessionIds) {
            allSessionIds.push(...course.sessionIds);
          }
        });
        
        // Fetch all sessions
        const sessionsData = await Promise.all(
          allSessionIds.map(sessionId => getRecordById('sessions', sessionId))
        );
        const validSessions = sessionsData.filter(s => s !== null);
        
        // Sort sessions by date
        const sortedSessions = validSessions.sort((a, b) => {
          if (!a.date || !b.date) return 0;
          
          const partsA = a.date.split('.');
          const partsB = b.date.split('.');
          
          if (partsA.length === 3 && partsB.length === 3) {
            const dateA = new Date(partsA[2], partsA[1] - 1, partsA[0]);
            const dateB = new Date(partsB[2], partsB[1] - 1, partsB[0]);
            return dateA - dateB;
          }
          
          return 0;
        });
        
        setSessions(sortedSessions);
        
        // Fetch month data and group sessions by month
        const monthIds = new Set(validSessions.map(session => session.monthId).filter(id => id));
        const monthsData = await Promise.all(
          Array.from(monthIds).map(monthId => getRecordById('months', monthId))
        );
        setMonths(monthsData.filter(m => m !== null));
        
      } catch (err) {
        console.error("Error fetching teacher details:", err);
        setError("Failed to load teacher details.");
      } finally {
        setLoading(false);
      }
    };

    if (teacherId) {
      fetchTeacherDetails();
    }
  }, [teacherId]);

  // Function to safely render any type of value
  const safelyRenderValue = (value) => {
    if (value === null || value === undefined) {
      return '-';
    }

    if (typeof value === 'string' || typeof value === 'number') {
      return value;
    }

    if (value && typeof value === 'object') {
      if (value.hyperlink && value.text) {
        return value.text;
      }
      if (value.richText) {
        return value.richText.map(rt => rt.text).join('');
      }
      if (value.text) {
        return value.text;
      }
      if (value.formula) {
        return value.result || '';
      }
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      try {
        return JSON.stringify(value);
      } catch (e) {
        return 'Complex value';
      }
    }

    if (Array.isArray(value)) {
      return value.map(item => safelyRenderValue(item)).join(', ');
    }

    return String(value);
  };

  // Calculate hours for a specific month
  const calculateMonthlyHours = (monthId) => {
    const monthSessions = sessions.filter(session => session.monthId === monthId);
    let totalHours = 0;
    
    monthSessions.forEach(session => {
      if (session.startTime && session.endTime) {
        // Basic calculation (can be improved)
        totalHours += 1.5; // Assuming average session length
      }
    });
    
    return totalHours.toFixed(1);
  };

  // Get course name by ID
  const getCourseNameById = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.name : 'Unknown Course';
  };

  // Group sessions by month
  const groupSessionsByMonth = () => {
    const grouped = {};
    
    months.forEach(month => {
      grouped[month.id] = {
        month: month,
        sessions: sessions.filter(session => session.monthId === month.id)
      };
    });
    
    // Sort the month entries by id in descending order (newest first)
    return Object.fromEntries(
      Object.entries(grouped).sort((a, b) => {
        // Month IDs are in format 'YYYY-MM'
        return b[0].localeCompare(a[0]); // Reverse sort
      })
    );
  };

  if (loading) return <div className="loading">Loading teacher details...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!teacher) return <div className="error">Teacher not found</div>;

  const groupedSessions = groupSessionsByMonth();
  const totalHours = sessions.length * 1.5; // Simple calculation, can be improved

  return (
    <div className="course-detail-container">
      <div className="course-detail-header">
        <button className="back-button" onClick={onClose}>← Back</button>
        <h2>{teacher.name}</h2>
        <div className="course-level-badge">{teacher.email || 'No Email'}</div>
      </div>

      <div className="course-detail-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Übersicht
        </button>
        <button
          className={`tab ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          Kurse
        </button>
        <button
          className={`tab ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          Lektionen
        </button>
        <button
          className={`tab ${activeTab === 'monthly' ? 'active' : ''}`}
          onClick={() => setActiveTab('monthly')}
        >
          Monatlich
        </button>
      </div>

      <div className="course-detail-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="stats-row">
              <div className="stat-box">
                <h3>Kurse</h3>
                <div className="stat-value">{courses.length}</div>
              </div>
              <div className="stat-box">
                <h3>Lektionen</h3>
                <div className="stat-value">{sessions.length}</div>
              </div>
              <div className="stat-box">
                <h3>Unterrichtsstunden</h3>
                <div className="stat-value">{totalHours.toFixed(1)}</div>
              </div>
            </div>
            <div className="course-info-card">
              <h3>Lehrer Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Name:</span>
                  <span className="value">{teacher.name}</span>
                </div>
                <div className="info-item">
                  <span className="label">Email:</span>
                  <span className="value">{teacher.email || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Anzahl Monate aktiv:</span>
                  <span className="value">{months.length}</span>
                </div>
                <div className="info-item">
                  <span className="label">Durchschnittliche Stunden pro Monat:</span>
                  <span className="value">
                    {months.length > 0 ? (totalHours / months.length).toFixed(1) : '0'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="courses-tab">
            <h3>Unterrichtete Kurse</h3>
            {courses.length > 0 ? (
              <table className="sessions-table">
                <thead>
                  <tr>
                    <th>Kurs</th>
                    <th>Level</th>
                    <th>Lektionen</th>
                    <th>Zeitraum</th>
                    <th>Anzahl Schüler</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.id}>
                      <td>{course.name}</td>
                      <td>{course.level}</td>
                      <td>{course.sessionIds ? course.sessionIds.length : 0}</td>
                      <td>
                        {course.startDate} - {course.endDate || 'heute'}
                      </td>
                      <td>{course.studentIds ? course.studentIds.length : 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <p>Keine Kurse gefunden.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="sessions-tab">
            <h3>Lektionen</h3>
            {sessions.length > 0 ? (
              <table className="sessions-table">
                <thead>
                  <tr>
                    <th>Datum</th>
                    <th>Kurs</th>
                    <th>Titel</th>
                    <th>Zeit</th>
                    <th>Monat</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => {
                    const month = months.find(m => m.id === session.monthId);
                    return (
                      <tr key={session.id}>
                        <td>{safelyRenderValue(session.date)}</td>
                        <td>{getCourseNameById(session.courseId)}</td>
                        <td>{safelyRenderValue(session.title)}</td>
                        <td>
                          {safelyRenderValue(session.startTime)} - {safelyRenderValue(session.endTime)}
                        </td>
                        <td>{month ? month.name : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <p>Keine Lektionen gefunden.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'monthly' && (
          <div className="monthly-tab">
            <h3>Monatliche Übersicht</h3>
            {months.length > 0 ? (
              <>
                {Object.entries(groupedSessions).map(([monthId, data]) => (
                  <div className="month-section" key={monthId}>
                    <div className="month-header">
                      <h4>{data.month.name}</h4>
                      <div className="month-stats">
                        <span>Lektionen: {data.sessions.length}</span>
                        <span>Stunden: {calculateMonthlyHours(monthId)}</span>
                      </div>
                    </div>
                    <table className="sessions-table">
                      <thead>
                        <tr>
                          <th>Datum</th>
                          <th>Kurs</th>
                          <th>Titel</th>
                          <th>Zeit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.sessions.map(session => (
                          <tr key={session.id}>
                            <td>{safelyRenderValue(session.date)}</td>
                            <td>{getCourseNameById(session.courseId)}</td>
                            <td>{safelyRenderValue(session.title)}</td>
                            <td>
                              {safelyRenderValue(session.startTime)} - {safelyRenderValue(session.endTime)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </>
            ) : (
              <div className="empty-state">
                <p>Keine monatlichen Daten gefunden.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDetail;