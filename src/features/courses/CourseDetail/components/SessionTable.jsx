// src/features/courses/CourseDetail/components/SessionTable.jsx
import React from 'react';
import SortableTable from '../../../common/components/SortableTable';

const SessionTable = ({ sessions, sessionColumns, openSessionDetail }) => {
  const renderSessionActions = (session) => (
    <button
      className="details-button"
      onClick={() => openSessionDetail(session)}
    >
      Details
    </button>
  );

  return (
    <div className="analytics-card animate-card">
      <h3 className="section-title">Sessions ({sessions.length})</h3>
      <div className="panel-content">
        <SortableTable
          columns={sessionColumns}
          data={sessions}
          defaultSortColumn="sessionOrder"
          actions={renderSessionActions}
        />
      </div>
    </div>
  );
};

export default SessionTable;