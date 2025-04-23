// src/components/Dashboard/LehrerContent.jsx
import { useState, useEffect } from 'react';
import { getAllRecords, updateRecord } from '../../firebase/database';
import { calculateTotalHours } from '../../utils/timeUtils';
import TeacherDetail from './TeacherDetail';
import './Content.css';

const LehrerContent = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [countryFilter, setCountryFilter] = useState(''); // Add this state
  const [editingTeacher, setEditingTeacher] = useState(null); // Add this state

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const teachersData = await getAllRecords('teachers');
      const allCourses = await getAllRecords('courses');
      const allSessions = await getAllRecords('sessions');
  
      const enrichedTeachers = teachersData.map((teacher) => {
        // Get courses taught by this teacher
        const teacherCourses = allCourses.filter(course => 
          course.teacherIds && course.teacherIds.includes(teacher.id)
        );
  
        // Find sessions for this teacher
        const teacherSessions = allSessions.filter(session => 
          session.teacherId === teacher.id
        );
        
        // Use our utility function with the original calculation
        const totalHours = calculateTotalHours(teacherSessions);
        
        // Group sessions by month
        const sessionsByMonth = {};
        teacherSessions.forEach(session => {
          if (session.monthId) {
            if (!sessionsByMonth[session.monthId]) {
              sessionsByMonth[session.monthId] = 0;
            }
            sessionsByMonth[session.monthId]++;
          }
        });
  
        return {
          ...teacher,
          courseCount: teacherCourses.length,
          courses: teacherCourses,
          sessionCount: teacherSessions.length,
          totalHours: totalHours,
          sessionsByMonth: sessionsByMonth
        };
      });
  
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
                <span className="course-level">{teacher.country || 'No Country'}</span>
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