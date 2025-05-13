// src/features/courses/CourseDetail/components/StudentTable.jsx
import React from 'react';
import SortableTable from '../../../common/components/SortableTable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';

const StudentTable = ({ students, studentColumns, openStudentDetail }) => {
  const renderStudentActions = (student) => (
    <button
      className="table-action-button"
      onClick={() => openStudentDetail(student)}
    >
      Details
    </button>
  );

  return (
    <div className="overview-panel animate-card">
      <div className="panel-header">
        <h3 className="panel-title">
          <FontAwesomeIcon icon={faUser} className="panel-icon" />
          Students ({students.length})
        </h3>
      </div>
      <div className="panel-content">
        {students.length > 0 ? (
          <SortableTable
            columns={studentColumns}
            data={students}
            defaultSortColumn="name"
            actions={renderStudentActions}
            rowKeyField="id"
          />
        ) : (
          <div className="empty-message">No students found for this course.</div>
        )}
      </div>
    </div>
  );
};

export default StudentTable;