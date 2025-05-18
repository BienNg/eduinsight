// src/features/months/components/GroupProgressList.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressBar from '../../common/ProgressBar';
import TeacherBadge from '../../common/TeacherBadge';
import '../../styles/GroupProgressList.css';

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
  let latestSessionNumber = 0;

  for (let i = 0; i < groupCourses.length; i++) {
    const course = groupCourses[i];
    const courseSessions = sessions.filter(s => s.courseId === course.id);
    const completedSessions = courseSessions.filter(s => s.status === 'completed');

    if (completedSessions.length > 0) {
      latestActiveIndex = i;

      // Find the latest session number
      // This assumes sessions have a sessionOrder or some property indicating their sequence
      latestSessionNumber = completedSessions.length;
    }
  }

  // Set defaults
  let currentCourse = null;
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
      if (latestLevel === 'B1.2' && completedCurrentSessions === sessionsPerLevel[latestLevel]) {
        isGroupComplete = true;
      }
    }
  }

  // Cap at 100%
  overallProgress = Math.min(overallProgress, 100);

  return {
    currentCourse,
    isGroupComplete,
    overallProgress,
    latestSessionNumber
  };
};

const GroupProgressList = ({ courseGroups, sessions, teachers, selectedTeacher }) => {
  const navigate = useNavigate();

  if (Object.keys(courseGroups).length === 0) {
    return (
      <div className="empty-message">
        {selectedTeacher
          ? `Keine Kurse für ${selectedTeacher.name} in diesem Monat.`
          : 'Keine Kurse im letzten Monat.'}
      </div>
    );
  }

  // Find teachers for each group based on course teachers
  const getGroupTeachers = (groupCourses) => {
    const teacherIds = new Set();

    groupCourses.forEach(course => {
      // Get teacher IDs from each course
      if (course.teacherId) teacherIds.add(course.teacherId);
      if (course.teacherIds && Array.isArray(course.teacherIds)) {
        course.teacherIds.forEach(id => teacherIds.add(id));
      }
    });

    // Map IDs to teacher objects
    return Array.from(teacherIds)
      .map(id => teachers.find(t => t.id === id))
      .filter(Boolean); // Remove any null/undefined entries
  };

  // Calculate progress for each group
  const groupsWithProgress = Object.entries(courseGroups).map(([groupName, groupCourses]) => {
    const progress = calculateGroupProgress(groupCourses, sessions);
    const groupTeachers = getGroupTeachers(groupCourses);

    return {
      groupName,
      teachers: groupTeachers,
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
          className="progress-card clickable"
          key={group.groupName}
          onClick={() => handleGroupClick(group.groupName)}
        >
          <div className="progress-card-header">
            <div className="progress-title-section">
              <div className="progress-title">{group.groupName}</div>

              {/* Teacher Badges in same row */}
              {group.teachers && group.teachers.length > 0 && (
                <div className="teacher-badge-container">
                  {group.teachers.slice(0, 2).map(teacher => (
                    <TeacherBadge key={teacher.id} teacher={teacher} />
                  ))}
                  {group.teachers.length > 2 && (
                    <span className="teacher-more-badge">
                      +{group.teachers.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="progress-stats">
              {group.currentCourse && !group.isGroupComplete && (
                <>
                  <span className="current-level">{group.currentCourse.level}</span>
                  <span className="progress-divider"></span>
                  <span className="session-tag">Tag {group.latestSessionNumber}</span>
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
        </div>
      ))}
    </div>
  );
};

export default GroupProgressList;