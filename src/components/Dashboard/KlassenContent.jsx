// Updated src/components/Dashboard/KlassenContent.jsx
import { useState, useEffect } from 'react';
import { getAllRecords } from '../../firebase/database';
import CourseDetail from './CourseDetail';
import './Content.css';

const KlassenContent = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const coursesData = await getAllRecords('courses');
        setCourses(coursesData);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError("Failed to load courses. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleViewDetails = (courseId) => {
    setSelectedCourseId(courseId);
  };

  const handleCloseDetails = () => {
    setSelectedCourseId(null);
  };

  if (selectedCourseId) {
    return <CourseDetail courseId={selectedCourseId} onClose={handleCloseDetails} />;
  }

  return (
    <div className="klassen-content">
      <h2>Klassenübersicht</h2>
      
      {loading && <div className="loading-indicator">Daten werden geladen...</div>}
      
      {error && <div className="error-message">{error}</div>}
      
      {!loading && !error && courses.length === 0 && (
        <div className="empty-state">
          <p>Keine Klassen gefunden. Importieren Sie Klassendaten über den Excel Import.</p>
        </div>
      )}
      
      {!loading && !error && courses.length > 0 && (
        <div className="courses-grid">
          {courses.map((course) => (
            <div className="course-card" key={course.id}>
              <div className="course-header">
                <h3>{course.name}</h3>
                <span className="course-level">{course.level}</span>
              </div>
              <div className="course-info">
                <div className="info-item">
                  <span className="label">Schüler:</span>
                  <span className="value">{course.students ? course.students.length : 0}</span>
                </div>
                <div className="info-item">
                  <span className="label">Lektionen:</span>
                  <span className="value">{course.sessions ? course.sessions.length : 0}</span>
                </div>
                <div className="info-item">
                  <span className="label">Lehrer:</span>
                  <span className="value">
                    {course.sessions && course.sessions.length > 0 
                      ? course.sessions[course.sessions.length - 1].teacher || 'Nicht zugewiesen'
                      : 'Nicht zugewiesen'}
                  </span>
                </div>
              </div>
              <div className="course-actions">
                <button 
                  className="btn-details"
                  onClick={() => handleViewDetails(course.id)}
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

export default KlassenContent;