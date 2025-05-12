// src/features/courses/CourseDetail/components/StudentTable.jsx
import React from 'react';
import SortableTable from '../../../common/components/SortableTable';

const StudentTable = ({ students, studentColumns, openStudentDetail }) => {
  const renderStudentActions = (student) => (
    <button
      className="details-button"
      onClick={() => openStudentDetail(student)}
    >
      Details
    </button>
  );

  return (
    <div className="analytics-card animate-card">
      <h3 className="section-title">Students ({students.length})</h3>
      <div className="panel-content">
        <SortableTable
          columns={studentColumns}
          data={students}
          defaultSortColumn="name"
          actions={renderStudentActions}
        />
      </div>
    </div>
  );
};

export default StudentTable;