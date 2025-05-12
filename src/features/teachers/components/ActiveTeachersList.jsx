// src/features/teachers/components/ActiveTeachersList.jsx
import React from 'react';
import TabCard from '../../common/TabCard';
import GroupBadge from '../../common/GroupBadge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserTie } from '@fortawesome/free-solid-svg-icons';

const ActiveTeachersList = ({ 
  teachersLastMonth, 
  teachersThisMonth, 
  monthlyView, 
  setMonthlyView, 
  handleTeacherClick,
  coursesData,
  activeCoursesIds,
  groupsData
}) => {
  const renderTeacherList = (teachers, monthLabel) => {
    return teachers.length > 0 ? (
      <div className="compact-teacher-list">
        {teachers.map((teacher, index) => {
          // Get courses this teacher teaches that are active
          const teacherActiveCourses = coursesData.filter((course) =>
            course.teacherIds &&
            course.teacherIds.includes(teacher.id) &&
            activeCoursesIds.has(course.id)
          );

          // Get unique group IDs
          const teacherGroupIds = new Set(
            teacherActiveCourses.map((course) => course.groupId)
          );

          // Get group objects
          const teacherGroups = Array.from(teacherGroupIds)
            .map((groupId) => {
              // Find the actual group from the groups collection
              const group = groupsData.find((g) => g.id === groupId);

              // If we found the group, use its data
              if (group) {
                return {
                  id: groupId,
                  name: group.name || 'Unknown Group',
                  color: group.color || '#e0e0e0'
                };
              }

              // Fallback to using course data if group not found
              const representativeCourse = teacherActiveCourses.find(
                (course) => course.groupId === groupId
              );

              if (representativeCourse) {
                return {
                  id: groupId,
                  name: `Group ${groupId.substring(0, 5)}...` || 'Unknown Group',
                  color: representativeCourse.color || '#e0e0e0'
                };
              }

              return null;
            })
            .filter(Boolean);

          return (
            <div
              className="compact-teacher-item"
              key={teacher.id}
              style={{ animationDelay: `${0.1 * index}s` }}
              onClick={() => handleTeacherClick(teacher.id)}
              role="button"
              tabIndex={0}
            >
              <div className="teacher-profile">
                <FontAwesomeIcon icon={faUserTie} className="teacher-icon" />
                <div className="teacher-info">
                  <div className="teacher-name"><strong>{teacher.name}</strong></div>
                  <div className="teacher-subtitle">{teacherGroups.length} groups {monthLabel}</div>
                </div>
              </div>
              <div className="teacher-meta">
                <span>{teacher.country || 'No Location'}</span>
                <span>{teacher.sessionCount} sessions</span>
              </div>
              <div className="teacher-group-badges">
                {teacherGroups
                  .sort((a, b) => b.name.localeCompare(a.name))
                  .map((group) => (
                    <GroupBadge key={group.id} group={group} />
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    ) : (
      <div className="empty-message">No active teachers {monthLabel}</div>
    );
  };

  return (
    <TabCard
      title="Active Teachers"
      className="animate-card"
      tabs={[
        {
          id: 'last',
          content: (
            <div className="panel-content">
              {renderTeacherList(teachersLastMonth, 'last month')}
            </div>
          )
        },
        {
          id: 'current',
          content: (
            <div className="panel-content">
              {renderTeacherList(teachersThisMonth, 'this month')}
            </div>
          )
        }
      ]}
      activeTab={monthlyView}
      setActiveTab={setMonthlyView}
    />
  );
};

export default ActiveTeachersList;