// src/features/database/tabs/CoursesTab.jsx
import React from 'react';

const CoursesTab = ({ courses, groups }) => {
  // Sort courses by name for better readability
  const sortedCourses = [...courses].sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  return (
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
          {sortedCourses.map((course) => {
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
      {courses.length === 0 && <div className="empty-state">No courses found</div>}
      {courses.length > 100 && (
        <div className="more-items-hint">
          Showing first 100 courses. There are {courses.length - 100} more.
        </div>
      )}
    </div>
  );
};

export default CoursesTab;