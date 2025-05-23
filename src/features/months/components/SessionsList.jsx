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
  
  // Filter out future sessions
  const filteredSessions = sessions.filter(session => {
    if (!session.date) return false;
    
    // Parse date from DD.MM.YYYY format
    const [day, month, year] = session.date.split('.').map(Number);
    const sessionDate = new Date(year, month - 1, day);
    const today = new Date();
    
    // Only include sessions that have already occurred
    return sessionDate <= today;
  });
  
  // Detect when sessions change to trigger animation
  useEffect(() => {
    if (JSON.stringify(filteredSessions.map(s => s.id)) !== JSON.stringify(prevSessions.map(s => s.id))) {
      setAnimating(true);
      
      // After a short delay, update the previous sessions
      const timer = setTimeout(() => {
        setPrevSessions(filteredSessions);
        setAnimating(false);
      }, 300); // This should match the CSS transition duration
      
      return () => clearTimeout(timer);
    }
  }, [filteredSessions, prevSessions]);

  // Handle sync button click
  const handleSyncAllCourses = async () => {
    if (isSyncing) return;
    
    try {
      setIsSyncing(true);
      // Filter courses to only include those with sessions in this list
      const relevantCourses = courses.filter(course => 
        filteredSessions.some(session => session.courseId === course.id)
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

  if (!filteredSessions.length) {
    return <div className="empty-message">Keine abgeschlossenen Lektionen in diesem Monat.</div>;
  }

  // Group sessions by course
  const sessionsByCourse = {};
  filteredSessions.forEach(session => {
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
        <div className="sessions-list-title">Abgeschlossene Sessions</div>
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