import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressBar from '../../common/ProgressBar';

const calculateGroupProgress = (groupCourses, sessions) => {
  // Define the course structure with expected sessions
  const courseLevels = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2'];
  const sessionsPerLevel = {
    'A1.1': 18,
    'A1.2': 18,
    'A2.1': 20,
    'A2.2': 20,
    'B1.1': 20,
    'B1.2': 20
  };

  // Calculate total expected sessions across all levels
  const totalExpectedSessions = Object.values(sessionsPerLevel).reduce((sum, sessions) => sum + sessions, 0);

  // Sort courses by level following the specified order
  groupCourses.sort((a, b) => {
    return courseLevels.indexOf(a.level) - courseLevels.indexOf(b.level);
  });

  // Find the latest course with completed sessions
  let latestActiveIndex = -1;
  for (let i = 0; i < groupCourses.length; i++) {
    const course = groupCourses[i];
    const courseSessions = sessions.filter(s => s.courseId === course.id);
    const completedSessions = courseSessions.filter(s => s.status === 'completed');

    if (completedSessions.length > 0) {
      latestActiveIndex = i;
    }
  }

  // Set defaults
  let currentCourse = null;
  let currentProgress = 0;
  let isGroupComplete = false;
  let overallProgress = 0;

  if (latestActiveIndex >= 0) {
    // Current course is the one that has the most recent completed sessions
    currentCourse = groupCourses[latestActiveIndex];
    
    // Get the latest level this group has
    const latestLevel = currentCourse ? currentCourse.level : null;
    const latestLevelIndex = latestLevel ? courseLevels.indexOf(latestLevel) : -1;

    if (latestLevelIndex >= 0) {
      // Calculate completed sessions for the current level
      const currentLevelSessions = sessions.filter(s => s.courseId === currentCourse.id);
      const completedCurrentSessions = currentLevelSessions.filter(s => s.status === 'completed').length;

      // Calculate current level progress
      const currentLevelExpectedSessions = sessionsPerLevel[latestLevel];
      currentProgress = (completedCurrentSessions / currentLevelExpectedSessions) * 100;

      // Calculate sessions for completed previous levels
      let completedPreviousSessions = 0;
      for (let i = 0; i < latestLevelIndex; i++) {
        completedPreviousSessions += sessionsPerLevel[courseLevels[i]];
      }

      // Total completed sessions (previous levels + current level progress)
      const totalCompletedSessions = completedPreviousSessions + completedCurrentSessions;

      // Calculate overall progress
      overallProgress = (totalCompletedSessions / totalExpectedSessions) * 100;

      // Check if the group is complete (B1.2 is complete)
      if (latestLevel === 'B1.2' && completedCurrentSessions === currentLevelExpectedSessions) {
        isGroupComplete = true;
      }
    }
  }

  // Cap at 100%
  overallProgress = Math.min(overallProgress, 100);

  return {
    currentCourse,
    currentProgress,
    isGroupComplete,
    overallProgress
  };
};

const GroupProgressList = ({ courseGroups, sessions }) => {
  const navigate = useNavigate(); // Add this to get the navigate function

  if (Object.keys(courseGroups).length === 0) {
    return <div className="empty-message">Keine Kurse im letzten Monat.</div>;
  }

  // Calculate progress for each group
  const groupsWithProgress = Object.entries(courseGroups).map(([groupName, groupCourses]) => {
    const progress = calculateGroupProgress(groupCourses, sessions);
    return {
      groupName,
      ...progress
    };
  }).sort((a, b) => b.overallProgress - a.overallProgress);

  // Handle click on a group progress card
  const handleGroupClick = (groupName) => {
    navigate(`/courses/group/${groupName}`);
  };

  return (
    <div className="group-progress-list">
      {groupsWithProgress.map(group => (
        <div 
          className="progress-card clickable" // Add clickable class for styling
          key={group.groupName}
          onClick={() => handleGroupClick(group.groupName)} // Add click handler
          style={{ cursor: 'pointer' }} // Add cursor style
        >
          <div className="progress-card-header">
            <div className="progress-title">{group.groupName}</div>
            <div className="progress-stats">
              <span>{Math.round(group.overallProgress)}%</span>
              {group.currentCourse && !group.isGroupComplete && (
                <>
                  <span className="progress-divider"></span>
                  <span className="current-level">{group.currentCourse.level}</span>
                </>
              )}
            </div>
          </div>

          <ProgressBar
            progress={Math.max(0, group.overallProgress)}
            color="#4285f4"
            showLabel={false}
            height="10px"
          />

          {group.currentCourse && !group.isGroupComplete && (
            <div className="current-course-info">
              <span>Current course progress:</span>
              <span>{Math.round(group.currentProgress)}%</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default GroupProgressList;