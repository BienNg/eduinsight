// src/features/teachers/TeacherList.jsx
import { useState, useEffect } from 'react';
import { getAllRecords } from '../../firebase/database';

const TeacherList = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const teachersData = await getAllRecords('teachers');
      setTeachers(teachersData);
    } catch (err) {
      console.error("Error fetching teachers:", err);
      setError("Failed to load teachers. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="all-teachers-content">
      {loading && <div className="loading-indicator">Loading teachers data...</div>}
      
      {error && <div className="error-message">{error}</div>}
      
      {!loading && !error && teachers.length === 0 && (
        <div className="empty-state">
          <p>No teachers found. Import teacher data using Excel Import.</p>
        </div>
      )}
      
      {!loading && !error && teachers.length > 0 && (
        <div className="teachers-container">
          {/* Your teachers display layout will go here */}
          <p>Teacher count: {teachers.length}</p>
        </div>
      )}
    </div>
  );
};

export default TeacherList;