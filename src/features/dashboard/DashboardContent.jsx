// src/features/dashboard/components/HorizontalCourseCalendars.jsx
import { useState, useEffect } from 'react';
import { getAllRecords } from '../firebase/database';
import { isCourseCompleted } from '../utils/courseCompletionUtils';
import CourseCalendar from '../courses/CourseDetail/components/CourseCalendar/CourseCalendar';
import '../styles/HorizontalCourseCalendars.css';

const HorizontalCourseCalendars = () => {
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
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
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching course data:', error);
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Filter sessions for a specific course
  const getCourseSessions = (courseId) => {
    return sessions.filter(session => session.courseId === courseId);
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
        <span className="courses-count">{courses.length} Kurse</span>
      </div>
      
      <div className="horizontal-courses-scrollable">
        {[...courses].sort((a,b) => b.name.localeCompare(a.name)).map(course => (
          <div key={course.id} className="horizontal-course-card">
            <CourseCalendar 
              course={course}
              sessions={getCourseSessions(course.id)}
              customTitle={course.name || `Kurs ${course.id}`} // Pass course name as custom title
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default HorizontalCourseCalendars;