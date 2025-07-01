// src/features/database/hooks/useDataFetching.jsx
import { useState, useEffect, useCallback } from 'react';
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

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
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
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Specific refresh function for teachers
  const refreshTeachers = useCallback(async () => {
    try {
      const teachers = await getAllRecords('teachers');
      setData(prevData => ({
        ...prevData,
        teachers
      }));
    } catch (err) {
      console.error('Error refreshing teachers:', err);
      throw err;
    }
  }, []);

  return { 
    data, 
    loading, 
    error, 
    refreshAll: fetchAllData,
    refreshTeachers 
  };
};

export default useDataFetching;