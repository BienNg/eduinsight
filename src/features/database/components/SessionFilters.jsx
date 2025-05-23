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
              <option value="empty">No Teacher</option>
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
              <option value="empty">No Course</option>
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
              <option value="empty">No Group</option>
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
              <option value="empty">No Month</option>
              {months.map((month) => (
                <option key={month.id} value={month.id}>
                  {month.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="statusFilter">Status:</label>
            <select
              id="statusFilter"
              value={filters.status || ''}
              onChange={(e) => onFilterChange('status', e.target.value || null)}
            >
              <option value="">All Statuses</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
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