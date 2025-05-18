// src/features/months/components/SessionsList.jsx
import React, { useEffect, useState } from 'react';
import { calculateTotalHours } from '../../utils/timeUtils';
import { syncIncompleteCourses } from '../../utils/syncUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import '../../styles/SessionsList.css';

const SessionsList = ({ sessions, courses, teachers }) => {
  const [animating, setAnimating] = useState(false);
  const [prevSessions, setPrevSessions] = useState(sessions);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Detect when sessions change to trigger animation
  useEffect(() => {
    if (JSON.stringify(sessions.map(s => s.id)) !== JSON.stringify(prevSessions.map(s => s.id))) {
      setAnimating(true);
      
      // After a short delay, update the previous sessions
      const timer = setTimeout(() => {
        setPrevSessions(sessions);
        setAnimating(false);
      }, 300); // This should match the CSS transition duration
      
      return () => clearTimeout(timer);
    }
  }, [sessions, prevSessions]);

  // Handle sync button click
  const handleSyncAllCourses = async () => {
    if (isSyncing) return;
    
    try {
      setIsSyncing(true);
      // Filter courses to only include those with sessions in this list
      const relevantCourses = courses.filter(course => 
        sessions.some(session => session.courseId === course.id)
      );
      
      await syncIncompleteCourses(relevantCourses, setIsSyncing);
      toast.success('Kurse erfolgreich synchronisiert');
    } catch (error) {
      console.error('Error syncing courses:', error);
      toast.error(`Fehler beim Synchronisieren: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!sessions.length) {
    return <div className="empty-message">Keine Lektionen in diesem Monat.</div>;
  }

  // Group sessions by course
  const sessionsByCourse = {};
  sessions.forEach(session => {
    const course = courses.find(c => c.id === session.courseId);
    if (course) {
      const courseName = course.name || 'Unbekannter Kurs';
      if (!sessionsByCourse[courseName]) {
        sessionsByCourse[courseName] = [];
      }
      sessionsByCourse[courseName].push(session);
    }
  });

  // Sort course names alphabetically
  const sortedCourses = Object.keys(sessionsByCourse).sort();

  return (
    <div className={`sessions-list-container ${animating ? 'animating' : ''}`}>
      <div className="sessions-list-header">
        <div className="sessions-list-title">Sessions</div>
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
      
      {sortedCourses.map(courseName => {
        const courseSessions = sessionsByCourse[courseName];
        const sessionCount = courseSessions.length;
        const totalHours = calculateTotalHours(courseSessions);
        
        return (
          <div key={courseName} className="sessions-group">
            <div className="group-name">{courseName}</div>
            <div className="group-sessions">
              {courseSessions.map((session, index) => {
                const teacher = teachers.find(t => t.id === session.teacherId) || {};
                return (
                  <div 
                    key={session.id} 
                    className="session-item"
                    style={{ '--index': index }} // Add index for staggered animation
                  >
                    <span className="session-date">{session.date}</span>
                    <span className="session-title">{session.title}</span>
                    <span className="session-course">{teacher.name || 'Unbekannter Lehrer'}</span>
                    <span className="session-duration">
                      {session.duration ? `${session.duration}h` : '-'}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="group-summary">
              {sessionCount} Lektionen ({totalHours.toFixed(1)}h)
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Calculate total hours across all sessions
export const getTotalSessionHours = (sessions) => {
  return calculateTotalHours(sessions);
};

export default SessionsList;