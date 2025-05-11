// src/features/database/tabs/CoursesTab.jsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import CoursesFilters from '../components/CoursesFilters';
import '../../styles/Filters.css';

const CoursesTab = ({ courses, groups }) => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    level: null,
    status: null,
    groupId: null,
    hasSessions: null,
    hasStudents: null,
    hassourceUrl: null
  });
  const [filterLogic, setFilterLogic] = useState('AND');

  // Handle click on course row
  const handleCourseClick = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  const availableStatuses = useMemo(() => {
    const statusesSet = new Set();

    courses.forEach((course) => {
      // Only add non-empty statuses
      if (course.status) {
        statusesSet.add(course.status);
      }
    });

    // Convert Set to Array and sort alphabetically
    return [...statusesSet].sort();
  }, [courses]);

  const availableLevels = useMemo(() => {
    const levelsSet = new Set();

    courses.forEach((course) => {
      // Only add non-empty levels
      if (course.level) {
        levelsSet.add(course.level);
      }
    });

    // Convert Set to Array and sort alphabetically
    return [...levelsSet].sort();
  }, [courses]);

  const handleFilterChange = (filterName, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [filterName]: value
    }));
  };

  const filteredCourses = useMemo(() => {
    if (!filters.level && !filters.status && !filters.groupId && !filters.hasSessions &&
      !filters.hasStudents && !filters.hassourceUrl) {
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

      // sourceUrl match logic
      let sourceUrlMatch = true;
      if (filters.hassourceUrl) {
        const hassourceUrl = Boolean(course.sourceUrl);
        sourceUrlMatch = (filters.hassourceUrl === 'yes') ? hassourceUrl : !hassourceUrl;
      }

      if (filterLogic === 'AND') {
        return levelMatch && statusMatch && groupMatch && sessionsMatch &&
          studentsMatch && sourceUrlMatch;
      } else {
        return levelMatch || statusMatch || groupMatch || sessionsMatch ||
          studentsMatch || sourceUrlMatch;
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
        availableLevels={availableLevels}
        availableStatuses={availableStatuses}
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
              <th>Updated</th>
              <th>Source URL</th>
            </tr>
          </thead>
          <tbody>
            {sortedFilteredCourses.map((course) => {
              const group = course.groupId ? groups.find((g) => g.id === course.groupId) : null;

              return (
                <tr
                  key={course.id}
                  onClick={() => handleCourseClick(course.id)}
                  className="clickable-row"
                >
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
                  <td>{course.lastUpdated || 'N/A'}</td>
                  <td className="truncate">
                    {course.sourceUrl ? (
                      <a
                        href={course.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {course.sourceUrl}
                      </a>
                    ) : 'N/A'}
                  </td>
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