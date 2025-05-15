// src/features/courses/components/GroupsList.jsx
import React, { useEffect } from 'react';
import ProgressBar from '../../common/ProgressBar';
import { isGroupCompleted, getGroupColor } from '../../utils/groupCompletionUtils';

const GroupsList = ({
  groups,
  courses = [], // Add courses with default empty array
  sessions = [], // Add sessions with default empty array
  loading,
  error,
  searchQuery,
  selectedGroupName,
  onSelectGroup
}) => {
  // Debug logging to verify data
  useEffect(() => {
    console.log('GroupsList received:', {
      groupsCount: groups.length,
      coursesCount: courses.length,
      sessionsCount: sessions.length
    });
  }, [groups, courses, sessions]);

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
          {sortedGroups.map(group => {
            // Determine if the group is completed
            const isCompleted = isGroupCompleted(group, courses, sessions);
            
            // Get the appropriate color based on completion status and group type
            const groupColor = group.name?.startsWith('G') 
              ? getGroupColor(isCompleted) 
              : (group.color || '#0088FE');
            
            return (
              <div
                key={group.id || group.name}
                className={`group-list-item ${selectedGroupName === group.name ? 'selected' : ''}`}
                onClick={() => onSelectGroup(group)}
              >
                <div
                  className="group-color-indicator"
                  style={{ backgroundColor: groupColor }}
                />
                <div className="group-list-content">
                  <div className="group-list-header">
                    <h3>{group.name}</h3>
                    <span className="course-count">{group.coursesCount}</span>
                  </div>
                  
                  {/* Teacher badges */}
                  {group.teachers && group.teachers.length > 0 && (
                    <div className="group-list-teachers">
                      {group.teachers.map((teacherName, index) => (
                        <div 
                          key={`${group.id}-teacher-${index}`} 
                          className="group-teacher-badge"
                        >
                          {teacherName}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="group-list-stats">
                    <span>{group.totalStudents} Schüler</span>
                    <span>{group.totalSessions} Lektionen</span>
                  </div>
                  <ProgressBar
                    progress={group.progress}
                    color={groupColor}
                    height="4px"
                    showLabel={false}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GroupsList;