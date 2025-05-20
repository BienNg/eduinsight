// src/features/courses/CourseDetail/components/CourseCalendar/CourseCalendar.jsx
import * as React from 'react';
import { ref, update } from 'firebase/database';
import { database } from '../../../../firebase/config';
import { getRecordById, getAllRecords } from '../../../../firebase/database';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import CalendarHeader from './CalendarHeader';
import CalendarSummary from './CalendarSummary';
import CalendarTabNavigation from './CalendarTabNavigation';
import CalendarGrid from './CalendarGrid';
import { useCalendarData } from './hooks/useCalendarData';
import { getTeachersByIds } from '../../../../utils/teacherFetchUtils';
import { isCourseCompletedSync } from '../../../../utils/courseCompletionUtils';

import '../../../../styles/CourseCalendar.css';

const { useState, useEffect } = React;

const CourseCalendar = ({
  course,
  sessions = [],
  customTitle,
  isDetailPage = false,
  onCourseClick = null
}) => {
  const [localWeekdayPattern, setLocalWeekdayPattern] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [groupMode, setGroupMode] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [allSessions, setAllSessions] = useState([]);

  // Initialize the local state from course data
  useEffect(() => {
    if (course?.weekdays?.pattern) {
      setLocalWeekdayPattern(Object.values(course.weekdays.pattern));
    }

    // Fetch group data to get mode if not available
    const fetchGroupData = async () => {
      if (course?.groupId && !groupMode) {
        try {
          const groupData = await getRecordById('groups', course.groupId);
          if (groupData && groupData.mode) {
            setGroupMode(groupData.mode);
          }
        } catch (error) {
          console.error('Error fetching group data:', error);
        }
      }
    };

    fetchGroupData();
  }, [course, groupMode]);

  // Fetch all sessions and determine course completion status
  useEffect(() => {
    const fetchAllSessions = async () => {
      if (course?.id) {
        try {
          // Check if we already have sessions for this course
          if (sessions.length > 0) {
            // Just update completion status without fetching sessions again
            const courseCompleted = isCourseCompletedSync(course.id, sessions);
            setIsCompleted(courseCompleted);

            console.log('Course completion check (from provided sessions):', {
              courseId: course.id,
              courseName: course.name,
              isCompleted: courseCompleted
            });
            return;
          }

          const allSessionsData = await getAllRecords('sessions');
          setAllSessions(allSessionsData);

          // Check completion status using all sessions
          const courseCompleted = isCourseCompletedSync(course.id, allSessionsData);
          setIsCompleted(courseCompleted);

          console.log('Course completion check (from fetched sessions):', {
            courseId: course.id,
            courseName: course.name,
            isCompleted: courseCompleted
          });
        } catch (error) {
          console.error('Error fetching all sessions:', error);
        }
      }
    };

    fetchAllSessions();
  }, [course?.id, sessions]);

  // Add effect to fetch teachers for the course
  useEffect(() => {
    const fetchTeachers = async () => {
      if (!course) {
        setTeachers([]);
        setIsLoadingTeachers(false);
        return;
      }

      setIsLoadingTeachers(true);

      try {
        let teacherIds = [];

        // Collect all teacher IDs from both arrays and single IDs
        if (course.teacherIds && Array.isArray(course.teacherIds)) {
          teacherIds = [...course.teacherIds];
        }
        if (course.teacherId && !teacherIds.includes(course.teacherId)) {
          teacherIds.push(course.teacherId);
        }

        // If no teachers, return empty array
        if (teacherIds.length === 0) {
          setTeachers([]);
          setIsLoadingTeachers(false);
          return;
        }

        // Use the batch utility to get teachers
        const teachersData = await getTeachersByIds(teacherIds);
        setTeachers(teachersData);
      } catch (error) {
        console.error('Error fetching teachers:', error);
        setTeachers([]);
      } finally {
        setIsLoadingTeachers(false);
      }
    };

    fetchTeachers();
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

  // Use the callback prop for navigation
  const handleNavigateToDetail = () => {
    if (course && course.id && onCourseClick) {
      onCourseClick(course.id);
    }
  };

  const {
    monthTabs,
    activeTab,
    previousTab,
    direction,
    isAnimating,
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
      {/* Only show if not on detail page and we have a callback */}
      {!isDetailPage && course && course.id && onCourseClick && (
        <button
          className="course-detail-navigate-button"
          onClick={handleNavigateToDetail}
          title="Go to course details"
        >
          <FontAwesomeIcon icon={faArrowRight} />
        </button>
      )}

      <CalendarHeader
        startDateStr={startDateStr}
        endDateStr={endDateStr}
        formatShortDate={formatShortDate}
        startDate={startDate}
        customTitle={customTitle}
        sourceUrl={course?.sourceUrl}
        mode={groupMode}
        teachers={teachers}
        isLoadingTeachers={isLoadingTeachers}
      />

      <CalendarSummary
        startDateStr={startDateStr}
        lastCompletedDate={lastCompletedDate}
        completedSessions={completedSessions}
        totalSessions={totalSessions}
        formatShortDate={formatShortDate}
        isCompleted={isCompleted}
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