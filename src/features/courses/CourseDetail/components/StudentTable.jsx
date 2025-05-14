// src/features/courses/CourseDetail/components/StudentTable.jsx
import React from 'react';
import SortableTable from '../../../common/components/SortableTable';

const StudentTable = ({ students, studentColumns, openStudentDetail }) => {
  return (
    students.length > 0 ? (
      <SortableTable
        columns={studentColumns}
        data={students}
        defaultSortColumn="name"
        onRowClick={openStudentDetail}
        rowKeyField="id"
        title={`Students (${students.length})`}
        animationDelay={1} // First animation

      />
    ) : (
      <div className="empty-message">No students found for this course.</div>
    )
  );
};

export default StudentTable;