// Update src/components/Dashboard/StudentDetailModal.jsx
import React, { useState, useEffect } from 'react';
import { getRecordById, getAllRecords } from '../../firebase/database';
import './SessionDetailModal.css'; // Reuse the modal styling

const StudentDetailModal = ({ student, onClose }) => {
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        // Fetch all sessions for this student
        const allSessions = await getAllRecords('sessions');
        const studentSessions = allSessions.filter(session => 
          session.attendance && session.attendance[student.id]
        );
        
        // Fetch course details for each session
        const courseIds = [...new Set(studentSessions.map(s => s.courseId))];
        const coursesData = await Promise.all(
          courseIds.map(id => getRecordById('courses', id))
        );
        
        // Sort sessions by date
        const sortedSessions = studentSessions.sort((a, b) => {
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
        setCourses(coursesData);
      } catch (error) {
        console.error("Error fetching student data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudentData();
  }, [student.id]);

  // Function to safely render values (reused from other components)
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

  // Calculate attendance stats 
  const calculateAttendanceStats = () => {
    if (!sessions || sessions.length === 0) {
      return {
        present: 0,
        absent: 0,
        sick: 0,
        technical: 0,
        unknown: 0,
        rate: 0
      };
    }

    let present = 0;
    let absent = 0;
    let sick = 0;
    let technical = 0;
    let unknown = 0;
    let total = 0;

    sessions.forEach(session => {
      if (session.attendance && session.attendance[student.id]) {
        total++;
        const attendanceData = session.attendance[student.id];
        const status = typeof attendanceData === 'object' ? attendanceData.status : attendanceData;

        if (status === 'present') present++;
        else if (status === 'absent') absent++;
        else if (status === 'sick') sick++;
        else if (status === 'technical_issues') technical++;
        else unknown++;
      }
    });

    return {
      present,
      absent,
      sick,
      technical,
      unknown,
      total,
      rate: total > 0 ? Math.round((present / total) * 100) : 0
    };
  };

  const stats = calculateAttendanceStats();

  // Map attendance status to readable format
  const getAttendanceStatus = (status) => {
    const statusMap = {
      'present': 'Anwesend',
      'absent': 'Abwesend',
      'sick': 'Krank',
      'technical_issues': 'Technische Probleme',
      'unknown': 'Unbekannt'
    };
    return statusMap[status] || status;
  };

  // Calculate course-specific stats
  const getCourseStats = () => {
    const courseStats = {};
    
    sessions.forEach(session => {
      if (!session.courseId || !session.attendance || !session.attendance[student.id]) return;
      
      if (!courseStats[session.courseId]) {
        courseStats[session.courseId] = {
          present: 0,
          absent: 0,
          sick: 0,
          technical: 0,
          unknown: 0,
          total: 0
        };
      }
      
      const stats = courseStats[session.courseId];
      stats.total++;
      
      const attendanceData = session.attendance[student.id];
      const status = typeof attendanceData === 'object' ? attendanceData.status : attendanceData;
      
      if (status === 'present') stats.present++;
      else if (status === 'absent') stats.absent++;
      else if (status === 'sick') stats.sick++;
      else if (status === 'technical_issues') stats.technical++;
      else stats.unknown++;
    });
    
    return courseStats;
  };

  return (
    <div className="modal-backdrop">
      <div className="session-detail-modal student-detail-modal">
        <div className="modal-header">
          <h2>{safelyRenderValue(student.name)}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-tabs">
          <button 
            className={activeTab === 'overview' ? 'active' : ''} 
            onClick={() => setActiveTab('overview')}
          >
            Übersicht
          </button>
          <button 
            className={activeTab === 'attendance' ? 'active' : ''} 
            onClick={() => setActiveTab('attendance')}
          >
            Anwesenheit
          </button>
          <button 
            className={activeTab === 'courses' ? 'active' : ''} 
            onClick={() => setActiveTab('courses')}
          >
            Kurse
          </button>
        </div>

        <div className="modal-content">
          {loading ? (
            <div className="loading-indicator">Daten werden geladen...</div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <>
                  <div className="session-info-section">
                    <h3>Schülerinformation</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="label">Name:</span>
                        <span className="value">{safelyRenderValue(student.name)}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Info:</span>
                        <span className="value">{safelyRenderValue(student.info)}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Anwesenheitsquote:</span>
                        <span className="value">{stats.rate}%</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Anzahl Kurse:</span>
                        <span className="value">{student.courses ? student.courses.length : 0}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Gesamte Lektionen:</span>
                        <span className="value">{stats.total}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Notizen:</span>
                        <span className="value">{safelyRenderValue(student.notes)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="session-info-section">
                    <h3>Anwesenheitsstatistik</h3>
                    <div className="stats-row">
                      <div className="stat-box">
                        <h3>Anwesend</h3>
                        <div className="stat-value">{stats.present}</div>
                      </div>
                      <div className="stat-box">
                        <h3>Abwesend</h3>
                        <div className="stat-value">{stats.absent}</div>
                      </div>
                      <div className="stat-box">
                        <h3>Krank</h3>
                        <div className="stat-value">{stats.sick}</div>
                      </div>
                      <div className="stat-box">
                        <h3>Technische Probleme</h3>
                        <div className="stat-value">{stats.technical}</div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'attendance' && (
                <div className="attendance-section">
                  <h3>Anwesenheitsverlauf</h3>
                  {sessions.length > 0 ? (
                    <table className="attendance-table">
                      <thead>
                        <tr>
                          <th>Datum</th>
                          <th>Kurs</th>
                          <th>Lektion</th>
                          <th>Status</th>
                          <th>Kommentar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.map((session) => {
                          // Get course name
                          const course = courses.find(c => c.id === session.courseId);
                          const courseName = course ? course.name : '-';
                          
                          // Get attendance data
                          const attendanceData = session.attendance[student.id];
                          const status = typeof attendanceData === 'object' ?
                            attendanceData.status : attendanceData;
                          const comment = typeof attendanceData === 'object' && attendanceData.comment ?
                            attendanceData.comment : '';

                          return (
                            <tr key={session.id}>
                              <td>{safelyRenderValue(session.date)}</td>
                              <td>{courseName}</td>
                              <td>{safelyRenderValue(session.title)}</td>
                              <td className={`status-${status}`}>
                                {getAttendanceStatus(status)}
                              </td>
                              <td>{comment}</td>
                            </tr>
                          );return (
                            <tr key={session.id}>
                              <td>{safelyRenderValue(session.date)}</td>
                              <td>{courseName}</td>
                              <td>{safelyRenderValue(session.title)}</td>
                              <td className={`status-${status}`}>
                                {getAttendanceStatus(status)}
                              </td>
                              <td>{comment}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="empty-state">
                      <p>Keine Anwesenheitsdaten gefunden.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'courses' && (
                <div className="courses-section">
                  <h3>Kursbeteiligung</h3>
                  
                  {courses.length > 0 ? (
                    <>
                      {courses.map(course => {
                        // Get course-specific attendance statistics
                        const courseStats = getCourseStats()[course.id] || {
                          total: 0, present: 0, absent: 0, sick: 0, technical: 0
                        };
                        
                        const attendanceRate = courseStats.total > 0 
                          ? Math.round((courseStats.present / courseStats.total) * 100) 
                          : 0;
                        
                        return (
                          <div key={course.id} className="course-card">
                            <div className="course-header">
                              <h4>{course.name}</h4>
                              <span className="level-badge">{course.level}</span>
                            </div>
                            
                            <div className="course-stats">
                              <div className="course-stat">
                                <span className="label">Anwesenheitsquote:</span>
                                <span className="value">{attendanceRate}%</span>
                              </div>
                              <div className="course-stat">
                                <span className="label">Lektionen:</span>
                                <span className="value">{courseStats.total}</span>
                              </div>
                              <div className="course-stat">
                                <span className="label">Abwesend:</span>
                                <span className="value">
                                  {courseStats.absent + courseStats.sick + courseStats.technical}
                                </span>
                              </div>
                              <div className="course-stat">
                                <span className="label">Zeitraum:</span>
                                <span className="value">
                                  {course.startDate} - {course.endDate || 'heute'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="attendance-breakdown">
                              <div className="progress-bar">
                                <div 
                                  className="progress-segment present" 
                                  style={{width: `${(courseStats.present / courseStats.total) * 100}%`}}
                                  title={`Anwesend: ${courseStats.present}`}
                                ></div>
                                <div 
                                  className="progress-segment absent" 
                                  style={{width: `${(courseStats.absent / courseStats.total) * 100}%`}}
                                  title={`Abwesend: ${courseStats.absent}`}
                                ></div>
                                <div 
                                  className="progress-segment sick" 
                                  style={{width: `${(courseStats.sick / courseStats.total) * 100}%`}}
                                  title={`Krank: ${courseStats.sick}`}
                                ></div>
                                <div 
                                  className="progress-segment technical" 
                                  style={{width: `${(courseStats.technical / courseStats.total) * 100}%`}}
                                  title={`Technische Probleme: ${courseStats.technical}`}
                                ></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <div className="empty-state">
                      <p>Keine Kurse gefunden.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDetailModal;