// src/features/database/tabs/CoursesTab.jsx
import React, { useState, useMemo } from 'react';
import CoursesFilters from '../components/CoursesFilters';
import '../../styles/Filters.css';

const CoursesTab = ({ courses, groups }) => {
  const [filters, setFilters] = useState({
    level: null,
    status: null,
    groupId: null,
    hasSessions: null,
    hasStudents: null
  });
  const [filterLogic, setFilterLogic] = useState('AND');

  const handleFilterChange = (filterName, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [filterName]: value
    }));
  };

  const filteredCourses = useMemo(() => {
    if (!filters.level && !filters.status && !filters.groupId && !filters.hasSessions && !filters.hasStudents) {
      return courses;
    }

    return courses.filter((course) => {
      // Level match logic
      let levelMatch = true;
      if (filters.level) {
        if (filters.level === 'empty') {
          levelMatch = !course.level;
        } else {
          levelMatch = course.level === filters.level;
        }
      }

      // Status match logic
      let statusMatch = true;
      if (filters.status) {
        if (filters.status === 'empty') {
          statusMatch = !course.status;
        } else {
          statusMatch = course.status === filters.status;
        }
      }

      // Group match logic
      let groupMatch = true;
      if (filters.groupId) {
        if (filters.groupId === 'empty') {
          groupMatch = !course.groupId;
        } else {
          groupMatch = course.groupId === filters.groupId;
        }
      }
      
      // Sessions match logic
      let sessionsMatch = true;
      if (filters.hasSessions) {
        const hasSessions = course.sessionIds && course.sessionIds.length > 0;
        sessionsMatch = (filters.hasSessions === 'yes') ? hasSessions : !hasSessions;
      }

      // Students match logic
      let studentsMatch = true;
      if (filters.hasStudents) {
        const hasStudents = course.studentIds && course.studentIds.length > 0;
        studentsMatch = (filters.hasStudents === 'yes') ? hasStudents : !hasStudents;
      }

      if (filterLogic === 'AND') {
        return levelMatch && statusMatch && groupMatch && sessionsMatch && studentsMatch;
      } else {
        return levelMatch || statusMatch || groupMatch || sessionsMatch || studentsMatch;
      }
    });
  }, [courses, filters, filterLogic]);

  // Sort courses by name for better readability
  const sortedFilteredCourses = [...filteredCourses].sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  return (
    <div className="courses-tab-container">
      <CoursesFilters
        groups={groups}
        filters={filters}
        onFilterChange={handleFilterChange}
        filterLogic={filterLogic}
        onFilterLogicChange={setFilterLogic}
      />
      
      <div className="courses-list-container">
        <table className="students-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Level</th>
              <th>Status</th>
              <th>Group</th>
              <th>Sessions</th>
              <th>Students</th>
              <th>Created</th>
              <th>Updated</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {sortedFilteredCourses.map((course) => {
              const group = course.groupId ? groups.find((g) => g.id === course.groupId) : null;
              
              return (
                <tr key={course.id}>
                  <td className="truncate">{course.name}</td>
                  <td>{course.level || 'N/A'}</td>
                  <td className={`status-${course.status?.toLowerCase() || 'unknown'}`}>
                    {course.status || 'N/A'}
                  </td>
                  <td>
                    {group ? (
                      <span 
                        className="group-indicator" 
                        style={{ backgroundColor: group.color || '#0066cc' }}
                      >
                        {group.name}
                      </span>
                    ) : 'None'}
                  </td>
                  <td>{course.sessionIds?.length || 0}</td>
                  <td>{course.studentIds?.length || 0}</td>
                  <td>{course.createdAt || 'N/A'}</td>
                  <td>{course.updatedAt || 'N/A'}</td>
                  <td className="truncate">{course.description || 'N/A'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredCourses.length === 0 && <div className="empty-state">No courses found</div>}
        {filteredCourses.length > 100 && (
          <div className="more-items-hint">
            Showing first 100 courses. There are {filteredCourses.length - 100} more.
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursesTab;