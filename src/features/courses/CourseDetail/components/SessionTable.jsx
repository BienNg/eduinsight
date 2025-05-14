// src/features/courses/CourseDetail/components/SessionTable.jsx
import React from 'react';
import SortableTable from '../../../common/components/SortableTable';

const SessionTable = ({ sessions, sessionColumns, openSessionDetail }) => {
  return (
    sessions.length > 0 ? (
      <SortableTable
        columns={sessionColumns}
        data={sessions}
        defaultSortColumn="sessionOrder"
        onRowClick={openSessionDetail}
        rowKeyField="id"
        title={`Sessions (${sessions.length})`}
        animationDelay={2} // Second animation (delayed)

      />
    ) : (
      <div className="empty-message">No sessions found for this course.</div>
    )
  );
};

export default SessionTable;