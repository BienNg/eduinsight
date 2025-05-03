// src/features/database/components/tabs/StudentsTab.jsx
import React from 'react';

const StudentsTab = ({ students, courses }) => (
  <div className="students-table-container">
    <table className="students-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Courses</th>
          <th>Join Date</th>
          <th>Info</th>
        </tr>
      </thead>
      <tbody>
        {students.map((student) => (
          <tr key={student.id}>
            <td className="truncate">{student.name}</td>
            <td>
              {student.courseIds?.length > 0 ? (
                <div className="level-badges-container">
                  {student.courseIds.slice(0, 3).map((courseId) => {
                    const course = courses.find((c) => c.id === courseId);
                    return course ? (
                      <span className="level-badge" key={courseId}>
                        {course.name}
                      </span>
                    ) : null;
                  })}
                  {student.courseIds.length > 3 && (
                    <span className="level-badge">+{student.courseIds.length - 3} more</span>
                  )}
                </div>
              ) : (
                'None'
              )}
            </td>
            <td>
              {student.joinDates ? Object.values(student.joinDates)[0] || 'N/A' : 'N/A'}
            </td>
            <td className="truncate">{student.info || 'N/A'}</td>
          </tr>
        ))}
      </tbody>
    </table>
    {students.length === 0 && <div className="empty-state">No students found</div>}
  </div>
);

export default StudentsTab;