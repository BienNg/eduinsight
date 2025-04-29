// src/features/courses/components/CourseDetailPanel.jsx
import React, { useState } from 'react';
import TabComponent from '../../common/TabComponent';
import '../../styles/CourseDetailPanel.css';

const CourseDetailPanel = ({ course, students, sessions, loading }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'students', label: 'Students' },
    { id: 'sessions', label: 'Sessions' }
  ];

  if (loading) {
    return <div className="loading">Loading course details...</div>;
  }

  if (!course) {
    return <div className="no-course-data">Course data not available</div>;
  }

  // Calculate attendance for a session
  const calculateSessionAttendance = (session) => {
    if (!session.attendance || !students || students.length === 0) return "0/0";

    let presentCount = 0;
    let totalStudents = 0;

    students.forEach(student => {
      if (session.attendance[student.id]) {
        totalStudents++;
        const attendanceData = session.attendance[student.id];
        const status = typeof attendanceData === 'object' ? attendanceData.status : attendanceData;
        if (status === 'present') {
          presentCount++;
        }
      }
    });

    return `${presentCount}/${totalStudents}`;
  };

  // Calculate attendance for a student
  const calculateStudentAttendance = (studentId) => {
    if (!sessions || sessions.length === 0) return "0/0";

    let absentCount = 0;
    let totalSessions = 0;

    sessions.forEach(session => {
      if (session.attendance && session.attendance[studentId]) {
        totalSessions++;
        const attendanceData = session.attendance[studentId];
        const status = typeof attendanceData === 'object' ? attendanceData.status : attendanceData;
        if (status !== 'present') {
          absentCount++;
        }
      }
    });

    return `${absentCount}/${totalSessions}`;
  };

  return (
    <div className="course-detail-panel">
      <div className="panel-header">
        <h2>{course.name}</h2>
        {course.level && <span className="level-badge">{course.level}</span>}
      </div>

      <TabComponent tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab}>
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="stats-row">
              <div className="stat-box">
                <h3>Students</h3>
                <div className="stat-value">{students.length}</div>
              </div>
              <div className="stat-box">
                <h3>Sessions</h3>
                <div className="stat-value">{sessions.length}</div>
              </div>
            </div>
            
            <div className="course-info-card">
              <h3>Course Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Group:</span>
                  <span className="value">{course.group || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Level:</span>
                  <span className="value">{course.level || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Start Date:</span>
                  <span className="value">{course.startDate || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="label">End Date:</span>
                  <span className="value">{course.endDate || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Status:</span>
                  <span className="value">{course.status || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="students-tab">
            <table className="students-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Absence</th>
                  <th>Info</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.name}</td>
                    <td>{calculateStudentAttendance(student.id)}</td>
                    <td>{student.info || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="sessions-tab">
            <table className="sessions-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Attendance</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id}>
                    <td>{session.title}</td>
                    <td>{session.date}</td>
                    <td>
                      {session.startTime} - {session.endTime}
                    </td>
                    <td>{calculateSessionAttendance(session)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TabComponent>
    </div>
  );
};

export default CourseDetailPanel;