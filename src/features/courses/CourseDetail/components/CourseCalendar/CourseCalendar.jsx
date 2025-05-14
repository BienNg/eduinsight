// src/features/courses/CourseDetail/components/CourseCalendar/CourseCalendar.jsx
import React from 'react';
import CalendarHeader from './CalendarHeader';
import CalendarSummary from './CalendarSummary';
import CalendarTabNavigation from './CalendarTabNavigation';
import CalendarGrid from './CalendarGrid';
import { useCalendarData } from './hooks/useCalendarData';
import '../../../../styles/CourseCalendar.css';

const CourseCalendar = ({ course, sessions = [] }) => {
  const {
    monthTabs,
    activeTab,
    previousTab,
    direction,
    isAnimating,
    setActiveTab,
    handlePrevTab,
    handleNextTab,
    handleTabClick,
    handleAnimationEnd,
    startDateStr,
    endDateStr,
    lastCompletedDate,
    completedSessions,
    totalSessions,
    generateCalendarData,
    formatShortDate,
    startDate
  } = useCalendarData(sessions);

  return (
    <div className="course-calendar overview-panel animate-card">
      <CalendarHeader 
        startDateStr={startDateStr} 
        endDateStr={endDateStr} 
        formatShortDate={formatShortDate}
        startDate={startDate}
      />
      
      <CalendarSummary 
        startDateStr={startDateStr}
        lastCompletedDate={lastCompletedDate}
        completedSessions={completedSessions}
        totalSessions={totalSessions}
        formatShortDate={formatShortDate}
      />
      
      <CalendarTabNavigation 
        monthTabs={monthTabs}
        activeTab={activeTab}
        isAnimating={isAnimating}
        handlePrevTab={handlePrevTab}
        handleNextTab={handleNextTab}
        handleTabClick={handleTabClick}
      />
      
      <div className="calendar-content">
        <CalendarGrid 
          activeTab={activeTab}
          previousTab={previousTab}
          isAnimating={isAnimating}
          direction={direction}
          monthTabs={monthTabs}
          generateCalendarData={generateCalendarData}
          handleAnimationEnd={handleAnimationEnd}
        />
      </div>
    </div>
  );
};

export default CourseCalendar;