// src/features/courses/CourseDetail/components/SessionTable.jsx
import React from 'react';
import SortableTable from '../../../common/components/SortableTable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt } from '@fortawesome/free-solid-svg-icons';

const SessionTable = ({ sessions, sessionColumns, openSessionDetail }) => {
  const renderSessionActions = (session) => (
    <button
      className="table-action-button"
      onClick={() => openSessionDetail(session)}
    >
      Details
    </button>
  );

  return (
    <div className="overview-panel animate-card">
      <div className="panel-header">
        <h3 className="panel-title">
          <FontAwesomeIcon icon={faCalendarAlt} className="panel-icon" />
          Sessions ({sessions.length})
        </h3>
      </div>
      <div className="panel-content">
        {sessions.length > 0 ? (
          <SortableTable
            columns={sessionColumns}
            data={sessions}
            defaultSortColumn="sessionOrder"
            actions={renderSessionActions}
            rowKeyField="id"
          />
        ) : (
          <div className="empty-message">No sessions found for this course.</div>
        )}
      </div>
    </div>
  );
};

export default SessionTable;