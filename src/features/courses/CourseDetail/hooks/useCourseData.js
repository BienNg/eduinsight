// src/features/courses/CourseDetail/hooks/useCourseData.js
import { useState, useEffect } from 'react';
import { getRecordById } from '../../../firebase/database';

export const useCourseData = (courseId) => {
  const [course, setCourse] = useState(null);
  const [group, setGroup] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setLoading(true);

        // Fetch course data
        const courseData = await getRecordById('courses', courseId);
        if (!courseData) {
          throw new Error("Course not found");
        }
        setCourse(courseData);
        
        // Fetch group data if available
        if (courseData.groupId) {
          const groupData = await getRecordById('groups', courseData.groupId);
          setGroup(groupData);
        }
        
        // Fetch teacher data
        await fetchTeacherData(courseData);
        
        // Fetch student data
        await fetchStudentData(courseData);
        
        // Fetch session data
        await fetchSessionData(courseData);
      } catch (err) {
        console.error("Error fetching course details:", err);
        setError("Failed to load course details.");
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourseDetails();
    }
  }, [courseId]);

  const fetchTeacherData = async (courseData) => {
    try {
      if (courseData.teacherIds && Array.isArray(courseData.teacherIds)) {
        const teacherPromises = courseData.teacherIds.map(tid => 
          getRecordById('teachers', tid));
        const teacherDataArr = await Promise.all(teacherPromises);
        setTeachers(teacherDataArr.filter(t => t));
      } else if (courseData.teacherId) {
        const teacherData = await getRecordById('teachers', courseData.teacherId);
        setTeachers(teacherData ? [teacherData] : []);
      } else {
        setTeachers([]);
      }
    } catch (err) {
      console.error("Error fetching teacher data:", err);
    }
  };

  const fetchStudentData = async (courseData) => {
    try {
      const studentPromises = (courseData.studentIds || []).map(studentId =>
        getRecordById('students', studentId)
      );
      const studentData = await Promise.all(studentPromises);
      setStudents(studentData.filter(s => s !== null));
    } catch (err) {
      console.error("Error fetching student data:", err);
    }
  };

  const fetchSessionData = async (courseData) => {
    try {
      const sessionPromises = (courseData.sessionIds || []).map(sessionId =>
        getRecordById('sessions', sessionId)
      );
      const sessionData = await Promise.all(sessionPromises);
      
      // Sort sessions by sessionOrder by default
      const sortedSessions = sessionData
        .filter(s => s !== null)
        .sort((a, b) => {
          // Sort by sessionOrder by default
          const orderA = a.sessionOrder || 0;
          const orderB = b.sessionOrder || 0;
          if (orderA !== orderB) {
            return orderA - orderB;
          }

          // Fall back to date if sessionOrder is the same
          const dateA = parseGermanDate(a.date);
          const dateB = parseGermanDate(b.date);
          if (dateA && dateB) {
            return dateA - dateB;
          }
          // Further fallback to string comparison
          return a.date.localeCompare(b.date);
        });

      setSessions(sortedSessions);
    } catch (err) {
      console.error("Error fetching session data:", err);
    }
  };

  // Helper function to parse German date format (DD.MM.YYYY)
  const parseGermanDate = (dateStr) => {
    if (!dateStr) return null;

    const parts = dateStr.split('.');
    if (parts.length !== 3) return null;

    // Note: JS months are 0-indexed
    return new Date(parts[2], parts[1] - 1, parts[0]);
  };

  return {
    course, 
    group,
    teachers,
    students,
    sessions,
    loading,
    error
  };
};