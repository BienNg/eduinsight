// src/components/Dashboard/LehrerContent.jsx
import { useState, useEffect } from 'react';
import { getAllRecords } from '../../firebase/database';
import TeacherDetail from './TeacherDetail';
import './Content.css';

const LehrerContent = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const teachersData = await getAllRecords('teachers');

      // Enrich teacher data with course and session info
      const enrichedTeachers = await Promise.all(teachersData.map(async (teacher) => {
        // Get courses taught by this teacher
        const allCourses = await getAllRecords('courses');
        const teacherCourses = allCourses.filter(course => course.teacherId === teacher.id);
        
        // Get total sessions
        let totalSessions = 0;
        let totalHours = 0;
        const sessionsByMonth = {};
        
        for (const course of teacherCourses) {
          if (course.sessionIds && course.sessionIds.length > 0) {
            totalSessions += course.sessionIds.length;
            
            // Get detailed session data for hours calculation
            const sessions = await Promise.all(
              course.sessionIds.map(id => getAllRecords(`sessions/${id}`))
            );
            
            // Calculate hours and group by month
            sessions.forEach(session => {
              if (session) {
                // Add to total hours if start and end time are available
                if (session.startTime && session.endTime) {
                  // Basic hours calculation (can be improved to actually calculate time difference)
                  totalHours += 1.5; // Assuming average session length for now
                }
                
                // Group by month
                if (session.monthId) {
                  if (!sessionsByMonth[session.monthId]) {
                    sessionsByMonth[session.monthId] = 0;
                  }
                  sessionsByMonth[session.monthId]++;
                }
              }
            });
          }
        }

        return {
          ...teacher,
          courseCount: teacherCourses.length,
          courses: teacherCourses,
          sessionCount: totalSessions,
          totalHours: totalHours,
          sessionsByMonth: sessionsByMonth
        };
      }));

      setTeachers(enrichedTeachers);
    } catch (err) {
      console.error("Error fetching teachers:", err);
      setError("Failed to load teachers. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (teacherId) => {
    setSelectedTeacherId(teacherId);
  };

  const handleCloseDetails = () => {
    setSelectedTeacherId(null);
    // Refresh teacher list when returning from details
    fetchTeachers();
  };

  if (selectedTeacherId) {
    return <TeacherDetail teacherId={selectedTeacherId} onClose={handleCloseDetails} />;
  }

  return (
    <div className="lehrer-content">
      <h2>Lehrerübersicht</h2>

      {loading && <div className="loading-indicator">Daten werden geladen...</div>}

      {error && <div className="error-message">{error}</div>}

      {!loading && !error && teachers.length === 0 && (
        <div className="empty-state">
          <p>Keine Lehrer gefunden. Importieren Sie Lehrerdaten über den Excel Import.</p>
        </div>
      )}

      {!loading && !error && teachers.length > 0 && (
        <div className="courses-grid">
          {teachers.map((teacher) => (
            <div className="course-card" key={teacher.id} onClick={() => handleViewDetails(teacher.id)}>
              <div className="course-header">
                <h3>{teacher.name}</h3>
                <span className="course-level">{teacher.email ? 'Active' : 'No Email'}</span>
              </div>
              <div className="course-info">
                <div className="info-item">
                  <span className="label">Kurse:</span>
                  <span className="value">{teacher.courseCount}</span>
                </div>
                <div className="info-item">
                  <span className="label">Lektionen:</span>
                  <span className="value">{teacher.sessionCount}</span>
                </div>
                <div className="info-item">
                  <span className="label">Unterrichtsstunden:</span>
                  <span className="value">{teacher.totalHours.toFixed(1)}</span>
                </div>
              </div>
              <div className="course-actions">
                <button
                  className="btn-details"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(teacher.id);
                  }}
                >
                  Details ansehen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LehrerContent;