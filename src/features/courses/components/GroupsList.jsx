// src/features/courses/components/GroupsList.jsx
import React from 'react';
import ProgressBar from '../../common/ProgressBar';

const GroupsList = ({
  groups,
  loading,
  error,
  searchQuery,
  selectedGroupName,
  onSelectGroup
}) => {
  // Sort groups by name in descending order
  const sortedGroups = [...groups].sort((a, b) =>
    b.name.localeCompare(a.name)
  );

  return (
    <div className="groups-list-container">
      {loading && (
        <div className="groups-list-loading">
          <div className="skeleton-item"></div>
          <div className="skeleton-item"></div>
          <div className="skeleton-item"></div>
        </div>
      )}

      {error && (
        <div className="groups-list-error">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && sortedGroups.length === 0 && (
        <div className="groups-list-empty">
          {searchQuery ? (
            <p>Keine Ergebnisse für "{searchQuery}" gefunden.</p>
          ) : (
            <p>Keine Kursgruppen gefunden.</p>
          )}
        </div>
      )}

      {!loading && !error && sortedGroups.length > 0 && (
        <div className="groups-list">
          {sortedGroups.map(group => (
            <div
              key={group.id || group.name}
              className={`group-list-item ${selectedGroupName === group.name ? 'selected' : ''}`}
              onClick={() => onSelectGroup(group)}
            >
              <div
                className="group-color-indicator"
                style={{ backgroundColor: group.color || '#0088FE' }}
              />
              <div className="group-list-content">
                <div className="group-list-header">
                  <h3>{group.name}</h3>
                  <span className="course-count">{group.coursesCount}</span>
                </div>
                <div className="group-list-stats">
                  <span>{group.totalStudents} Schüler</span>
                  <span>{group.totalSessions} Lektionen</span>
                </div>
                <ProgressBar
                  progress={group.progress}
                  color={group.color || '#0088FE'}
                  height="4px"
                  showLabel={false}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupsList;