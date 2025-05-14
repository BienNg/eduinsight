// src/features/courses/CourseDetail/components/CourseCalendar/CourseCalendar.jsx
import * as React from 'react';
import { ref, update } from 'firebase/database';
import { database } from '../../../../firebase/config';
import CalendarHeader from './CalendarHeader';
import CalendarSummary from './CalendarSummary';
import CalendarTabNavigation from './CalendarTabNavigation';
import CalendarGrid from './CalendarGrid';
import { useCalendarData } from './hooks/useCalendarData';
import '../../../../styles/CourseCalendar.css';

const { useState, useEffect } = React;

const CourseCalendar = ({ course, sessions = [] }) => {
  // State to track the weekday pattern locally
  const [localWeekdayPattern, setLocalWeekdayPattern] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Initialize the local state from course data
  useEffect(() => {
    if (course?.weekdays?.pattern) {
      setLocalWeekdayPattern(Object.values(course.weekdays.pattern));
    }
  }, [course]);

  // Function to toggle a weekday in the pattern
  const handleToggleWeekday = async (weekday) => {
    console.log(`Toggling weekday ${weekday}`, { 
      currentPattern: localWeekdayPattern,
      isUpdating,
      courseId: course?.id
    });
    
    // Prevent multiple rapid updates
    if (isUpdating) {
      console.log('Update already in progress, ignoring click');
      return;
    }
    
    try {
      setIsUpdating(true);
      
      // Create a new array to avoid mutating state directly
      let newPattern;
      
      if (localWeekdayPattern.includes(weekday)) {
        // Remove the weekday if it's already in the pattern
        console.log(`Removing ${weekday} from pattern`);
        newPattern = localWeekdayPattern.filter(day => day !== weekday);
      } else {
        // Add the weekday if it's not in the pattern
        console.log(`Adding ${weekday} to pattern`);
        newPattern = [...localWeekdayPattern, weekday];
      }
      
      console.log('New pattern:', newPattern);
      
      // Update local state immediately for UI responsiveness
      setLocalWeekdayPattern(newPattern);
      
      // Convert array to object format for Firebase
      const patternObject = {};
      newPattern.forEach((day, index) => {
        patternObject[index] = day;
      });
      
      console.log('Updating Firebase with pattern:', patternObject);
      
      // Update Firebase - Use the correct Realtime Database reference
      if (course?.id) {
        // Create a reference to the course in the Realtime Database
        const courseRef = ref(database, `courses/${course.id}`);
        
        // Create an update object that only updates the weekdays.pattern field
        const updates = {
          'weekdays/pattern': patternObject
        };
        
        // Update the database
        await update(courseRef, updates);
        console.log('Weekday pattern updated successfully');
      } else {
        console.error('Course ID not found, cannot update Firebase');
      }
    } catch (error) {
      console.error('Error updating weekday pattern:', error);
      console.error('Error details:', error.message, error.code, error.stack);
      // Revert to original pattern if update fails
      if (course?.weekdays?.pattern) {
        setLocalWeekdayPattern(Object.values(course.weekdays.pattern));
      }
    } finally {
      setIsUpdating(false);
    }
  };

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
          weekdayPattern={localWeekdayPattern}
          onToggleWeekday={handleToggleWeekday}
          isUpdating={isUpdating}
        />
      </div>
    </div>
  );
};

export default CourseCalendar;