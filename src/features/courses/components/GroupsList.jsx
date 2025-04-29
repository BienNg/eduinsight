// src/features/courses/components/GroupsList.jsx
import { memo } from 'react';
import ProgressBar from '../../common/ProgressBar';
import '../../styles/GroupsList.css';

const GroupsList = ({ 
  groups, 
  selectedGroupName, 
  onSelectGroup, 
  loading, 
  error,
  searchQuery
}) => {
  if (loading) {
    return (
      <div className="groups-list loading">
        <div className="skeleton-item"></div>
        <div className="skeleton-item"></div>
        <div className="skeleton-item"></div>
        <div className="skeleton-item"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="groups-list error">
        <p>{error}</p>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="groups-list empty">
        {searchQuery ? (
          <p>No results for "{searchQuery}"</p>
        ) : (
          <p>No course groups found</p>
        )}
      </div>
    );
  }

  return (
    <div className="groups-list">
      {groups.map(group => (
        <div 
          key={group.id} 
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
              <span className="course-count">{group.coursesCount} courses</span>
            </div>
            <div className="group-list-stats">
              <span>{group.totalStudents} students</span>
              <span>{group.totalSessions} sessions</span>
            </div>
            <ProgressBar 
              progress={calculateGroupProgress(group.levels)}
              color={group.color || '#0088FE'}
              height="4px"
              showLabel={false}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// Helper function to calculate progress based on course levels
const calculateGroupProgress = (levels) => {
  if (!levels || levels.length === 0) return 0;

  // Define the course structure with expected levels
  const courseLevels = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2'];

  // Find the highest level
  let highestLevelIndex = -1;
  levels.forEach(level => {
    const levelIndex = courseLevels.indexOf(level);
    if (levelIndex > highestLevelIndex) {
      highestLevelIndex = levelIndex;
    }
  });

  // Calculate progress percentage
  if (highestLevelIndex === -1) return 0;
  return ((highestLevelIndex + 1) / courseLevels.length) * 100;
};

export default memo(GroupsList);