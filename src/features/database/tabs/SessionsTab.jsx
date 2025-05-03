// src/features/database/tabs/SessionsTab.jsx
import React, { useState, useMemo } from 'react';
import SessionFilters from '../components/SessionFilters';
import '../../styles/Filters.css';


const SessionsTab = ({ sessions, teachers, courses, months }) => {
  const [filters, setFilters] = useState({
    teacherId: null,
    courseId: null,
    monthId: null
  });
  const [filterLogic, setFilterLogic] = useState('AND');

  const handleFilterChange = (filterName, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [filterName]: value
    }));
  };

  const filteredSessions = useMemo(() => {
    if (!filters.teacherId && !filters.courseId && !filters.monthId) {
      return sessions;
    }

    return sessions.filter((session) => {
      const teacherMatch = !filters.teacherId || session.teacherId === filters.teacherId;
      const courseMatch = !filters.courseId || session.courseId === filters.courseId;
      const monthMatch = !filters.monthId || session.monthId === filters.monthId;

      if (filterLogic === 'AND') {
        return teacherMatch && courseMatch && monthMatch;
      } else {
        return teacherMatch || courseMatch || monthMatch;
      }
    });
  }, [sessions, filters, filterLogic]);

  return (
    <div className="sessions-tab-container">
      <SessionFilters
        teachers={teachers}
        courses={courses}
        months={months}
        filters={filters}
        onFilterChange={handleFilterChange}
        filterLogic={filterLogic}
        onFilterLogicChange={setFilterLogic}
      />
      
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
            {filteredSessions.slice(0, 100).map((session) => (
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
        {filteredSessions.length === 0 && <div className="empty-state">No sessions found</div>}
        {filteredSessions.length > 100 && (
          <div className="more-items-hint">
            Showing first 100 sessions. There are {filteredSessions.length - 100} more.
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionsTab;