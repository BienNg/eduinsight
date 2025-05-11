// src/features/students/components/StudentCoursesCard.jsx
import React from 'react';
import { safelyRenderValue } from '../utils/studentDataUtils';
import './StudentCoursesCard.css';

const StudentCoursesCard = ({ student, sessions, courses }) => {
  // Group sessions by courseId
  const sessionsByCourse = {};
  
  if (sessions && sessions.length > 0) {
    sessions.forEach(session => {
      if (session.courseId) {
        if (!sessionsByCourse[session.courseId]) {
          sessionsByCourse[session.courseId] = [];
        }
        sessionsByCourse[session.courseId].push(session);
      }
    });
  }

  // Get student's courses
  const studentCourses = courses.filter(course => 
    student.courseIds && student.courseIds.includes(course.id)
  );

  // Get attendance status and comment for this student in a session
  const getAttendanceInfo = (session) => {
    if (!session.attendance || !session.attendance[student.id]) {
      return { status: 'unknown', comment: '' };
    }

    const attendanceData = session.attendance[student.id];
    if (typeof attendanceData === 'object') {
      return {
        status: attendanceData.status || 'unknown',
        comment: attendanceData.comment || ''
      };
    }
    
    return { status: attendanceData, comment: '' };
  };

  // Map attendance status to more readable format
  const getAttendanceStatus = (status) => {
    const statusMap = {
      'present': 'Present',
      'absent': 'Absent',
      'sick': 'Sick',
      'technical_issues': 'Technical Issues',
      'unknown': 'Unknown'
    };
    return statusMap[status] || status;
  };

  return (
    <div className="overview-panel">
      <div className="panel-header">
        <h3 className="panel-title">Course Sessions</h3>
      </div>
      <div className="panel-content">
        <div className="course-sessions-grid">
          {studentCourses.length > 0 ? (
            studentCourses.map(course => (
              <div key={course.id} className="course-sessions-card">
                <div className="course-sessions-container">
                  <div className="course-sessions-column">
                    <h4 className="course-name">{safelyRenderValue(course.name)}</h4>
                    
                    {sessionsByCourse[course.id] && sessionsByCourse[course.id].length > 0 ? (
                      <div className="sessions-table-container">
                        <table className="sessions-table">
                          <thead>
                            <tr>
                              <th>Session Name</th>
                              <th>Date</th>
                              <th>Status</th>
                              <th>Comment</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sessionsByCourse[course.id].map(session => {
                              const { status, comment } = getAttendanceInfo(session);
                              return (
                                <tr key={session.id}>
                                  <td>{safelyRenderValue(session.title)}</td>
                                  <td>{safelyRenderValue(session.date)}</td>
                                  <td className={`status-${status}`}>
                                    {getAttendanceStatus(status)}
                                  </td>
                                  <td>{comment}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="empty-message">No sessions found for this course.</div>
                    )}
                  </div>
                  
                  <div className="course-notes-column">
                    <textarea 
                      className="course-notes-textarea" 
                      placeholder="Add your notes about the student's progress in this course..."
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-message">No courses found for this student.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentCoursesCard;