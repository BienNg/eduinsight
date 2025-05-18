// Create a new file: src/features/months/components/MonthCourseCalendars.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync } from '@fortawesome/free-solid-svg-icons';
import CourseCalendar from '../../courses/CourseDetail/components/CourseCalendar/CourseCalendar';
import '../../styles/HorizontalCourseCalendars.css';

const MonthCourseCalendars = ({ courses, sessions, selectedTeacher }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  // Filter courses based on selected teacher
  const filteredCourses = selectedTeacher 
    ? courses.filter(course => 
        sessions.some(session => 
          session.courseId === course.id && 
          session.teacherId === selectedTeacher.id
        )
      )
    : courses;
    
  // Filter sessions for a specific course
  const getCourseSessions = (courseId) => {
    return sessions.filter(session => session.courseId === courseId);
  };
  
  // Handle course click
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
  
  if (filteredCourses.length === 0) {
    return (
      <div className="horizontal-courses-empty">
        <p>{selectedTeacher 
            ? `Keine Kurse für ${selectedTeacher.name} gefunden.` 
            : 'Keine Kurse gefunden.'}</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="horizontal-courses-header">
        <div className="horizontal-courses-actions">
          <span className="courses-count">{filteredCourses.length} Kurse</span>
        </div>
      </div>
      
      <div className="horizontal-courses-scrollable">
        {[...filteredCourses].sort((a,b) => a.name.localeCompare(b.name)).map(course => (
          <div key={course.id} className="horizontal-course-card">
            <CourseCalendar 
              course={course}
              sessions={getCourseSessions(course.id)}
              customTitle={course.name || `Kurs ${course.id}`}
              isDetailPage={false}
              onCourseClick={handleCourseClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonthCourseCalendars;