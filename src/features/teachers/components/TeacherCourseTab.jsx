// src/features/teachers/components/TeacherCourseTab.jsx
import TabCard from '../../common/TabCard';
import CourseItem from './CourseItem';
import MonthSummary from './MonthSummary';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';

const TeacherCourseTab = ({
  currentMonthData,
  previousMonthData,
  courses,
  groupsData,
  courseCompletionMap,
  monthNow,
  prevMonthName,
  onCourseHover,
  onCourseLeave
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('currentMonth');
  
  // Sort data in descending order by course name using useMemo to avoid unnecessary re-sorting
  const sortedCurrentMonthData = useMemo(() => {
    return [...currentMonthData].sort((a, b) => 
      b.course.name.localeCompare(a.course.name)
    );
  }, [currentMonthData]);

  const sortedPreviousMonthData = useMemo(() => {
    return [...previousMonthData].sort((a, b) => 
      b.course.name.localeCompare(a.course.name)
    );
  }, [previousMonthData]);

  const sortedCourses = useMemo(() => {
    return [...courses].sort((a, b) => 
      b.name.localeCompare(a.name)
    );
  }, [courses]);

  const totalMonthHours = currentMonthData.reduce((sum, data) => sum + data.totalHours, 0);
  const totalMonthSessions = currentMonthData.reduce((sum, data) => sum + data.sessions.length, 0);
  const totalLongSessions = currentMonthData.reduce((sum, data) => sum + data.longSessionsCount, 0);

  const totalPrevMonthHours = previousMonthData.reduce((sum, data) => sum + data.totalHours, 0);
  const totalPrevMonthSessions = previousMonthData.reduce((sum, data) => sum + data.sessions.length, 0);
  const totalPrevLongSessions = previousMonthData.reduce((sum, data) => sum + data.longSessionsCount, 0);

  const renderCurrentMonth = () => (
    <>
      {sortedCurrentMonthData.length > 0 ? (
        <>
          <div className="compact-course-list">
            {sortedCurrentMonthData.map(data => (
              <CourseItem 
                key={data.course.id}
                data={data}
                courseCompletionMap={courseCompletionMap}
                groupsData={groupsData}
                onHover={(e, courseId) => onCourseHover(e, courseId, currentMonthData)}
                onLeave={onCourseLeave}
              />
            ))}
          </div>
          <MonthSummary 
            totalSessions={totalMonthSessions} 
            totalHours={totalMonthHours} 
            totalLongSessions={totalLongSessions} 
          />
        </>
      ) : (
        <div className="empty-message">Keine Kurse in diesem Monat.</div>
      )}
    </>
  );

  const renderPreviousMonth = () => (
    <>
      {sortedPreviousMonthData.length > 0 ? (
        <>
          <div className="compact-course-list">
            {sortedPreviousMonthData.map(data => (
              <CourseItem 
                key={data.course.id}
                data={data}
                courseCompletionMap={courseCompletionMap}
                groupsData={groupsData}
                onHover={(e, courseId) => onCourseHover(e, courseId, previousMonthData)}
                onLeave={onCourseLeave}
              />
            ))}
          </div>
          <MonthSummary 
            totalSessions={totalPrevMonthSessions} 
            totalHours={totalPrevMonthHours} 
            totalLongSessions={totalPrevLongSessions} 
          />
        </>
      ) : (
        <div className="empty-message">Keine Kurse im vorherigen Monat ({prevMonthName}).</div>
      )}
    </>
  );

  const renderAllCourses = () => (
    <div className="compact-course-list">
      {sortedCourses.length > 0 ? (
        sortedCourses.map(course => (
          <div
            key={course.id}
            className="compact-course-item clickable"
            onClick={() => navigate(`/courses/${course.id}`)}
          >
            <div className="course-info-container">
              <div className="course-name-wrapper">
                <span
                  className="course-color-circle"
                  style={{
                    backgroundColor: course.groupId &&
                      groupsData.find(g => g.id === course.groupId)?.color || '#cccccc'
                  }}
                ></span>
                <span className="course-name">{course.name}</span>
              </div>
              <div className="course-meta">
                <span>{course.level || 'Kein Level'}</span>
                <span>{course.sessionIds?.length || 0} Lektionen</span>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="empty-message">Keine Kurse vorhanden.</div>
      )}
    </div>
  );

  const tabs = [
    {
      id: 'currentMonth',
      label: 'Aktueller Monat',
      content: renderCurrentMonth()
    },
    {
      id: 'previousMonth',
      label: 'Vormonat',
      content: renderPreviousMonth()
    },
    {
      id: 'allCourses',
      label: 'Alle Kurse',
      content: renderAllCourses()
    }
  ];

  // Get the correct title based on active tab
  const getTabTitle = () => {
    switch(activeTab) {
      case 'currentMonth':
        return `Kurse (${monthNow})`;
      case 'previousMonth':
        return `Kurse (${prevMonthName})`;
      case 'allCourses':
        return 'Alle Kurse';
      default:
        return `Kurse (${monthNow})`;
    }
  };

  return (
    <TabCard
      className="animate-card"
      title={getTabTitle()}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      tabs={tabs}
    />
  );
};

export default TeacherCourseTab;