// src/features/students/hooks/useStudentData.js
import { useState, useEffect } from 'react';
import { getRecordById, getAllRecords } from '../../firebase/database';

export const useStudentData = (studentId) => {
  const [data, setData] = useState({
    sessions: [],
    courses: [],
    allStudents: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!studentId) return;
      
      try {
        // Fetch all sessions for this student
        const allSessions = await getAllRecords('sessions');
        
        // Get the student record to access courseIds
        const student = await getRecordById('students', studentId);
        const studentCourseIds = student?.courseIds || [];

        const studentSessions = allSessions.filter(session =>
          session.attendance &&
          session.attendance[studentId] &&
          studentCourseIds.includes(session.courseId)
        );

        // Fetch all students for relations tab
        const students = await getAllRecords('students');
        // Filter out the current student
        const otherStudents = students.filter(s => s.id !== studentId);

        // Collect all unique course IDs that need to be fetched
        const allCourseIds = new Set([
          ...(student?.courseIds || []),
          ...otherStudents.flatMap(s => s.courseIds || [])
        ]);

        // Fetch all needed courses at once
        const coursesData = await Promise.all(
          [...allCourseIds].map(id => getRecordById('courses', id))
        );

        // Sort sessions by date
        const sortedSessions = studentSessions.sort((a, b) => {
          if (!a.date || !b.date) return 0;

          const partsA = a.date.split('.');
          const partsB = b.date.split('.');

          if (partsA.length === 3 && partsB.length === 3) {
            const dateA = new Date(partsA[2], partsA[1] - 1, partsA[0]);
            const dateB = new Date(partsB[2], partsB[1] - 1, partsB[0]);
            return dateA - dateB;
          }

          return 0;
        });

        setData({
          sessions: sortedSessions,
          courses: coursesData.filter(Boolean),
          allStudents: otherStudents,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error("Error fetching student data:", error);
        setData(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
    };

    setData(prev => ({ ...prev, loading: true }));
    fetchStudentData();
  }, [studentId]);

  const refreshData = () => {
    setData(prev => ({ ...prev, loading: true }));
  };

  return { ...data, refreshData };
};