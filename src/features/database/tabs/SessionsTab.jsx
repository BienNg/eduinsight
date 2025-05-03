// src/features/database/components/tabs/SessionsTab.jsx
import React from 'react';

const SessionsTab = ({ sessions, teachers, courses }) => (
  <div className="sessions-table-container">
    <table className="students-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Date</th>
          <th>Time</th>
          <th>Teacher</th>
          <th>Course</th>
        </tr>
      </thead>
      <tbody>
        {sessions.slice(0, 100).map((session) => (
          <tr key={session.id}>
            <td className="truncate">{session.title}</td>
            <td>{session.date || 'N/A'}</td>
            <td>
              {session.startTime && session.endTime
                ? `${session.startTime} - ${session.endTime}`
                : 'N/A'}
            </td>
            <td>
              {session.teacherId
                ? teachers.find((t) => t.id === session.teacherId)?.name || 'Unknown'
                : 'N/A'}
            </td>
            <td>
              {session.courseId
                ? courses.find((c) => c.id === session.courseId)?.name || 'Unknown'
                : 'N/A'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    {sessions.length === 0 && <div className="empty-state">No sessions found</div>}
    {sessions.length > 100 && (
      <div className="more-items-hint">
        Showing first 100 sessions. There are {sessions.length - 100} more.
      </div>
    )}
  </div>
);

export default SessionsTab;