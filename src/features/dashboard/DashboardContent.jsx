// src/features/dashboard/DashboardContent.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllRecords } from '../firebase/database';
import { isCourseCompleted } from '../utils/courseCompletionUtils';
import CourseCalendar from '../courses/CourseDetail/components/CourseCalendar/CourseCalendar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync } from '@fortawesome/free-solid-svg-icons';
import '../styles/HorizontalCourseCalendars.css';
import { toast } from 'sonner';

// Import the sync utility function
import { syncIncompleteCourses } from '../utils/syncUtils';

const HorizontalCourseCalendars = () => {
  const navigate = useNavigate(); // Use the hook at this level
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all courses and sessions
      const coursesData = await getAllRecords('courses');
      const sessionsData = await getAllRecords('sessions');
      
      // Store sessions
      setSessions(sessionsData);
      
      // Filter courses to only include incomplete ones
      const incompleteCourses = coursesData.filter(course => {
        const courseSessions = sessionsData.filter(session => 
          session.courseId === course.id
        );
        return !isCourseCompleted(courseSessions);
      });
      
      // Sort courses by start date (if available) or name
      const sortedCourses = [...incompleteCourses].sort((a, b) => {
        // If dates available, sort by date
        if (a.startDate && b.startDate) {
          return new Date(a.startDate) - new Date(b.startDate);
        }
        // Otherwise sort by name
        return (a.name || '').localeCompare(b.name || '');
      });
      
      setCourses(sortedCourses);
    } catch (error) {
      console.error('Error fetching course data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter sessions for a specific course
  const getCourseSessions = (courseId) => {
    return sessions.filter(session => session.courseId === courseId);
  };
  
  // Handle sync button click
  const handleSyncAllCourses = async () => {
    if (isSyncing) return;
    
    try {
      setIsSyncing(true);
      await syncIncompleteCourses(courses, setIsSyncing);
      // Refresh data after sync
      await fetchData();
    } catch (error) {
      console.error('Error syncing courses:', error);
      toast.error(`Error syncing courses: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Create a navigation handler function
  const handleCourseClick = (courseId) => {
    navigate(`/courses/${courseId}`);
  };
  
  if (isLoading) {
    return (
      <div className="horizontal-courses-loading">
        <p>Lade Kurse...</p>
      </div>
    );
  }
  
  if (courses.length === 0) {
    return (
      <div className="horizontal-courses-empty">
        <p>Keine laufenden Kurse gefunden.</p>
      </div>
    );
  }
  
  return (
    <div className="horizontal-courses-container">
      <div className="horizontal-courses-header">
        <h2>Laufende Kurse</h2>
        <div className="horizontal-courses-actions">
          <span className="courses-count">{courses.length} Kurse</span>
          <button 
            className="sync-all-button"
            onClick={handleSyncAllCourses}
            disabled={isSyncing}
            title="Sync all courses with Google Sheets"
          >
            <FontAwesomeIcon 
              icon={faSync} 
              className={isSyncing ? "spinning" : ""} 
            />
            {isSyncing ? ' Syncing...' : ' Sync All'}
          </button>
        </div>
      </div>
      
      <div className="horizontal-courses-scrollable">
        {[...courses].sort((a,b) => b.name.localeCompare(a.name)).map(course => (
          <div key={course.id} className="horizontal-course-card">
            <CourseCalendar 
              course={course}
              sessions={getCourseSessions(course.id)}
              customTitle={course.name || `Kurs ${course.id}`}
              isDetailPage={false}
              onCourseClick={handleCourseClick} // Pass the callback function
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default HorizontalCourseCalendars;