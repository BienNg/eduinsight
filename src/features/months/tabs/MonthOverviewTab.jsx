import React from 'react';
import { useNavigate } from 'react-router-dom';
import useTooltip from '../../hooks/useTooltip';

// Components
import TeachersList from '../components/TeachersList';
import CourseAnalytics from '../components/CourseAnalytics';
import SessionsList from '../components/SessionsList';
import TeacherTooltip from '../components/TeacherTooltip';
import GroupProgressList from '../components/GroupProgressList';

// Styles
import '../../styles/cards/Cards.css';
import '../../styles/Content.css';

// Utilities
import { getMonthName, groupCoursesByGroup } from '../utils/monthUtils';

const OverviewTab = ({ currentMonthId, monthDetails, sessions, courses, teachers, groups }) => {
  const navigate = useNavigate();
  const {
    isTooltipVisible,
    tooltipPosition,
    tooltipData,
    showTooltip,
    hideTooltip,
    cancelHideTooltip
  } = useTooltip();

  // Helper function to get group name by groupId
  const getGroupName = (groupId) => {
    const group = groups.find(g => g.id === groupId);
    return group ? group.name : 'Ungrouped';
  };

  // Handle showing the teacher tooltip
  const handleTeacherHover = (teacher, event) => {
    const teacherSessions = currentMonthSessions.filter(s => s.teacherId === teacher.id);
    showTooltip({ teacher, sessions: teacherSessions }, event);
  };

  if (!currentMonthId || !monthDetails[currentMonthId]) {
    return <div className="notion-empty">Keine Daten für den aktuellen Monat verfügbar.</div>;
  }

  // Get month details and filter data
  const details = monthDetails[currentMonthId];
  const currentMonthSessions = sessions
    .filter(session => session.monthId === currentMonthId)
    .sort((a, b) => {
      if (!a.date || !b.date) return 0;
      const partsA = a.date.split('.');
      const partsB = b.date.split('.');
      if (partsA.length === 3 && partsB.length === 3) {
        const dateA = new Date(partsA[2], partsA[1] - 1, partsA[0]);
        const dateB = new Date(partsB[2], partsB[1] - 1, partsB[0]);
        return dateB - dateA;
      }
      return 0;
    });
    
  const currentMonthCourses = courses.filter(course =>
    currentMonthSessions.some(session => session.courseId === course.id)
  );
  
  const currentMonthTeachers = teachers.filter(teacher =>
    currentMonthSessions.some(session => session.teacherId === teacher.id)
  );

  // Group courses by groupId
  const courseGroups = groupCoursesByGroup(currentMonthCourses, getGroupName);

  return (
    <div className="overview-tab-content">
      <div className="three-column-overview-grid">
        {/* Teachers Column */}
        <div className="overview-panel">
          <div className="panel-header">
            <h3 className="panel-title">Lehrer ({currentMonthTeachers.length})</h3>
          </div>
          <div className="panel-content">
            <TeachersList 
              teachers={currentMonthTeachers} 
              sessions={currentMonthSessions} 
              onTeacherHover={handleTeacherHover} 
            />
          </div>
        </div>

        {/* Center Column - Analytics and Courses */}
        <div className="overview-column">
          <CourseAnalytics 
            courses={currentMonthCourses} 
            monthDetails={monthDetails} 
          />
          
          <div className="overview-panel">
            <div className="panel-header">
              <h3 className="panel-title">
                Kurse im {getMonthName(currentMonthId)} ({currentMonthCourses.length})
              </h3>
            </div>
            <div className="panel-content">
              <GroupProgressList 
                courseGroups={courseGroups} 
                sessions={sessions} 
              />
            </div>
          </div>
        </div>

        {/* Sessions Column */}
        <div className="overview-panel">
          <div className="panel-header">
            <h3 className="panel-title">Lektionen ({currentMonthSessions.length})</h3>
          </div>
          <div className="panel-content">
            <SessionsList 
              sessions={currentMonthSessions} 
              courses={courses} 
              teachers={teachers} 
            />
          </div>
        </div>
      </div>

      {/* Teacher Tooltip */}
      {isTooltipVisible && tooltipData && (
        <div
          className="tooltip-container"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`
          }}
          onMouseEnter={cancelHideTooltip}
          onMouseLeave={hideTooltip}
        >
          <TeacherTooltip
            teacher={tooltipData.teacher}
            sessions={tooltipData.sessions}
            courses={courses}
            groups={groups}
          />
        </div>
      )}
    </div>
  );
};

export default OverviewTab;