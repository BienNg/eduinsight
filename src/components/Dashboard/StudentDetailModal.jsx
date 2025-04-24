// src/components/Dashboard/StudentDetailModal.jsx
import React, { useState, useEffect } from 'react';
import { getRecordById, getAllRecords } from '../../firebase/database';
import './SessionDetailModal.css';
import './StudentDetailModal.css';

import { mergeStudents } from '../../firebase/database';
import ConfirmationModal from './ConfirmationModal';

const StudentDetailModal = ({ student, onClose }) => {
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRelatedStudent, setSelectedRelatedStudent] = useState(null);
  const [showMergeConfirmation, setShowMergeConfirmation] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeError, setMergeError] = useState(null);

  // Add the merge functionality
  const handleMergeStudents = async () => {
    if (!selectedRelatedStudent) return;

    try {
      setIsMerging(true);
      setMergeError(null);

      await mergeStudents(student.id, selectedRelatedStudent.id);

      // Close confirmation modal
      setShowMergeConfirmation(false);

      // Reset selected student since it's now deleted
      setSelectedRelatedStudent(null);

      // Reload student data
      fetchStudentData();

    } catch (error) {
      console.error("Error merging students:", error);
      setMergeError(error.message);
    } finally {
      setIsMerging(false);
    }
  };
  const fetchStudentData = async () => {
    setLoading(true);
    try {
      // Fetch all sessions for this student
      const allSessions = await getAllRecords('sessions');
      const studentSessions = allSessions.filter(session =>
        session.attendance && session.attendance[student.id]
      );

      // Fetch course details for each session
      const courseIds = [...new Set(studentSessions.map(s => s.courseId))];

      // Fetch all students for relations tab
      const students = await getAllRecords('students');
      // Filter out the current student
      const otherStudents = students.filter(s => s.id !== student.id);

      // Collect all unique course IDs that need to be fetched
      const allCourseIds = new Set([
        ...courseIds,
        ...(student.courseIds || []),
        ...otherStudents.flatMap(s => s.courseIds || [])
      ]);

      // Fetch all needed courses at once
      const coursesData = await Promise.all(
        [...allCourseIds].map(id => getRecordById('courses', id))
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
      setCourses(coursesData.filter(Boolean));
      setAllStudents(otherStudents);
    } catch (error) {
      console.error("Error fetching student data:", error);
    } finally {
      setLoading(false);
      setIsMerging(false);
    }
  };
  useEffect(() => {
    fetchStudentData();
  }, [student.id]);


  // Function to handle student selection in relations tab
  const handleStudentSelect = (selectedStudent) => {
    setSelectedRelatedStudent(selectedStudent);
  };

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

  // Function to filter students based on search query
  const filteredStudents = allStudents.filter(s =>
    s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="modal-backdrop">
      <div className="session-detail-modal student-detail-modal fixed-size-modal">
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
          <button
            className={activeTab === 'relations' ? 'active' : ''}
            onClick={() => setActiveTab('relations')}
          >
            Relations
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
                                  style={{ width: `${(courseStats.present / courseStats.total) * 100}%` }}
                                  title={`Anwesend: ${courseStats.present}`}
                                ></div>
                                <div
                                  className="progress-segment absent"
                                  style={{ width: `${(courseStats.absent / courseStats.total) * 100}%` }}
                                  title={`Abwesend: ${courseStats.absent}`}
                                ></div>
                                <div
                                  className="progress-segment sick"
                                  style={{ width: `${(courseStats.sick / courseStats.total) * 100}%` }}
                                  title={`Krank: ${courseStats.sick}`}
                                ></div>
                                <div
                                  className="progress-segment technical"
                                  style={{ width: `${(courseStats.technical / courseStats.total) * 100}%` }}
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
              {activeTab === 'relations' && (
                <div className="relations-section">
                  <h3>Schülerbeziehungen</h3>
                  <div className="relations-container">
                    <div className="relations-list-container">
                      <div className="search-container">
                        <input
                          type="text"
                          placeholder="Schüler suchen..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="search-input"
                        />
                      </div>

                      <div className="students-list">
                        {filteredStudents.length > 0 ? (
                          <ul className="student-items">
                            {filteredStudents.map((s) => (
                              <li
                                key={s.id}
                                className={`student-item ${selectedRelatedStudent?.id === s.id ? 'selected' : ''}`}
                                onClick={() => handleStudentSelect(s)}
                              >
                                <div className="student-info">
                                  <span className="student-name">{safelyRenderValue(s.name)}</span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="empty-state">
                            {searchQuery ?
                              <p>Keine Schüler mit diesem Namen gefunden.</p> :
                              <p>Keine anderen Schüler verfügbar.</p>
                            }
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="preview-cards">
                      {/* Current student card */}
                      <div className="student-preview-card">
                        <div className="preview-header">
                          <h4>{safelyRenderValue(student.name)} (Aktueller Schüler)</h4>
                        </div>
                        <div className="preview-content">
                          <div className="preview-section">
                            <h5>Kurse</h5>
                            {student.courseIds && student.courseIds.length > 0 ? (
                              <div className="course-badges">
                                {student.courseIds.map((courseId) => {
                                  const course = courses.find((c) => c.id === courseId);
                                  return (
                                    <div key={courseId} className="course-badge">
                                      {course ? safelyRenderValue(course.name) : `Kurs ${courseId}`}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="empty-courses">Keine Kurse gefunden</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Selected student card */}
                      <div className="student-preview-card">
                        {selectedRelatedStudent ? (
                          <>
                            <div className="preview-header">
                              <h4>{safelyRenderValue(selectedRelatedStudent.name)}</h4>
                            </div>
                            <div className="preview-content">
                              <div className="preview-section">
                                <h5>Kurse</h5>
                                {selectedRelatedStudent.courseIds && selectedRelatedStudent.courseIds.length > 0 ? (
                                  <div className="course-badges">
                                    {selectedRelatedStudent.courseIds.map((courseId) => {
                                      const course = courses.find((c) => c.id === courseId);
                                      return (
                                        <div key={courseId} className="course-badge">
                                          {course ? safelyRenderValue(course.name) : `Kurs ${courseId}`}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="empty-courses">Keine Kurse gefunden</p>
                                )}
                              </div>
                              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                                <button
                                  className="confirm-button"
                                  onClick={() => setShowMergeConfirmation(true)}
                                  disabled={isMerging}
                                >
                                  {isMerging ? 'Merging...' : 'Merge with Current Student'}
                                </button>
                              </div>
                              {mergeError && (
                                <div style={{
                                  marginTop: '10px',
                                  color: '#c62828',
                                  backgroundColor: '#ffebee',
                                  padding: '8px',
                                  borderRadius: '4px',
                                  fontSize: '14px'
                                }}>
                                  Error: {mergeError}
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="empty-preview">
                            <p>Wählen Sie einen Schüler aus, um die Details anzuzeigen</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <ConfirmationModal
        isOpen={showMergeConfirmation}
        title="Confirm Student Merge"
        message={`Are you sure you want to merge ${selectedRelatedStudent ? safelyRenderValue(selectedRelatedStudent.name) : ''} into ${safelyRenderValue(student.name)}? This will combine all courses and attendance records, and delete the merged student record. This action cannot be undone.`}
        onConfirm={handleMergeStudents}
        onCancel={() => setShowMergeConfirmation(false)}
      />
    </div>
  );
};

export default StudentDetailModal;
