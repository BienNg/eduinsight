// src/features/database/tabs/SessionsTab.jsx
import React, { useState, useMemo } from 'react';
import SessionFilters from '../components/SessionFilters';
import '../../styles/Filters.css';
import '../../styles/Content.css';


const SessionsTab = ({ sessions, teachers, courses, months, groups }) => {
  const [filters, setFilters] = useState({
    teacherId: null,
    courseId: null,
    monthId: null,
    groupId: null,
    status: null
  });
  const [filterLogic, setFilterLogic] = useState('AND');

  const handleFilterChange = (filterName, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [filterName]: value
    }));
  };

  const filteredSessions = useMemo(() => {
    if (!filters.teacherId && !filters.courseId && !filters.monthId && !filters.groupId && !filters.status) {
      return sessions;
    }

    return sessions.filter((session) => {
      // Teacher match logic
      let teacherMatch = true;
      if (filters.teacherId) {
        if (filters.teacherId === 'empty') {
          teacherMatch = !session.teacherId;
        } else {
          teacherMatch = session.teacherId === filters.teacherId;
        }
      }

      // Course match logic
      let courseMatch = true;
      if (filters.courseId) {
        if (filters.courseId === 'empty') {
          courseMatch = !session.courseId;
        } else {
          courseMatch = session.courseId === filters.courseId;
        }
      }

      // Month match logic
      let monthMatch = true;
      if (filters.monthId) {
        if (filters.monthId === 'empty') {
          monthMatch = !session.monthId;
        } else {
          monthMatch = session.monthId === filters.monthId;
        }
      }
      
      // Group match logic
      let groupMatch = true;
      if (filters.groupId) {
        if (filters.groupId === 'empty') {
          // Match if either the course doesn't exist or the course has no groupId
          const course = courses.find((c) => c.id === session.courseId);
          groupMatch = !course || !course.groupId;
        } else {
          // Find the course for this session
          const course = courses.find((c) => c.id === session.courseId);
          // Then check if the course's groupId matches the filter
          groupMatch = course && course.groupId === filters.groupId;
        }
      }
      
      // Status match logic
      let statusMatch = true;
      if (filters.status) {
        statusMatch = session.status === filters.status;
      }

      if (filterLogic === 'AND') {
        return teacherMatch && courseMatch && monthMatch && groupMatch && statusMatch;
      } else {
        return teacherMatch || courseMatch || monthMatch || groupMatch || statusMatch;
      }
    });
  }, [sessions, filters, filterLogic, courses]);

  return (
    <div className="sessions-tab-container">
      <SessionFilters
        teachers={teachers}
        courses={courses}
        months={months}
        groups={groups}
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
              <th>Group</th>
              <th className="status-column">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredSessions.slice(0, 100).map((session) => {
              const course = session.courseId ? courses.find((c) => c.id === session.courseId) : null;
              const groupId = course ? course.groupId : null;
              const group = groupId ? groups.find((g) => g.id === groupId) : null;
              
              return (
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
                    {course ? course.name || 'Unknown' : 'N/A'}
                  </td>
                  <td>
                    {group ? group.name : 'N/A'}
                  </td>
                  <td className={`status-${session.status || 'unknown'} status-column`}>
                    {session.status || 'Unknown'}
                  </td>
                </tr>
              );
            })}
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