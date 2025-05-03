// src/features/database/hooks/useDataFetching.jsx
import { useState, useEffect } from 'react';
import { getAllRecords } from '../../firebase/database';

const useDataFetching = () => {
  const [data, setData] = useState({
    courses: [],
    groups: [],
    months: [],
    sessions: [],
    teachers: [],
    students: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // Fetch data from all collections
        const [courses, groups, months, sessions, teachers, students] = await Promise.all([
          getAllRecords('courses'),
          getAllRecords('groups'),
          getAllRecords('months'),
          getAllRecords('sessions'),
          getAllRecords('teachers'),
          getAllRecords('students')
        ]);
        
        setData({
          courses,
          groups,
          months,
          sessions,
          teachers,
          students
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching database data:', err);
        setError('Failed to load database data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchAllData();
  }, []);

  return { data, loading, error };
};

export default useDataFetching;