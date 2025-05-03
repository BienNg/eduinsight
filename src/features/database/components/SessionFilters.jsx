// src/features/database/components/SessionFilters.jsx
import React from 'react';

const SessionFilters = ({ 
  teachers, 
  courses, 
  months, 
  groups,
  filters, 
  onFilterChange, 
  filterLogic, 
  onFilterLogicChange 
}) => {
  return (
    <div className="session-filters">
      <div className="filter-container">
        <div className="filter-row">
          <div className="filter-item">
            <label htmlFor="teacherFilter">Teacher:</label>
            <select
              id="teacherFilter"
              value={filters.teacherId || ''}
              onChange={(e) => onFilterChange('teacherId', e.target.value || null)}
            >
              <option value="">All Teachers</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="courseFilter">Course:</label>
            <select
              id="courseFilter"
              value={filters.courseId || ''}
              onChange={(e) => onFilterChange('courseId', e.target.value || null)}
            >
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="groupFilter">Group:</label>
            <select
              id="groupFilter"
              value={filters.groupId || ''}
              onChange={(e) => onFilterChange('groupId', e.target.value || null)}
            >
              <option value="">All Groups</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="monthFilter">Month:</label>
            <select
              id="monthFilter"
              value={filters.monthId || ''}
              onChange={(e) => onFilterChange('monthId', e.target.value || null)}
            >
              <option value="">All Months</option>
              {months.map((month) => (
                <option key={month.id} value={month.id}>
                  {month.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="filterLogic">Filter Logic:</label>
            <select
              id="filterLogic"
              value={filterLogic}
              onChange={(e) => onFilterLogicChange(e.target.value)}
            >
              <option value="AND">AND</option>
              <option value="OR">OR</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionFilters;