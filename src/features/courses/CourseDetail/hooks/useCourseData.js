// src/features/courses/CourseDetail/hooks/useCourseData.js
import { useState, useEffect } from 'react';
import { getRecordById, getSessionsByCourseId, getBulkStudentsByIds, getBulkTeachersByIds } from '../../../firebase/database';

// Simple cache for course data to avoid unnecessary re-fetches
const courseCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useCourseData = (courseId) => {
  const [course, setCourse] = useState(null);
  const [group, setGroup] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(!!courseId); // Only start loading if courseId exists
  const [error, setError] = useState(null);

  console.log(`🔄 useCourseData hook called with courseId: ${courseId}, initial loading: ${!!courseId}`);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        console.log(`🔄 useCourseData: Setting loading to true for courseId ${courseId}`);
        setLoading(true);
        console.time(`CourseData:fetchCourseDetails:${courseId}`);

        // Check cache first
        const cacheKey = `course_${courseId}`;
        const cachedData = courseCache.get(cacheKey);
        const now = Date.now();
        
        if (cachedData && (now - cachedData.timestamp) < CACHE_DURATION) {
          console.log(`Using cached data for course ${courseId}`);
          setCourse(cachedData.course);
          setGroup(cachedData.group);
          setTeachers(cachedData.teachers);
          setStudents(cachedData.students);
          setSessions(cachedData.sessions);
          console.timeEnd(`CourseData:fetchCourseDetails:${courseId}`);
          setLoading(false);
          return;
        }

        // Fetch course data first
        console.time(`CourseData:fetchCourse:${courseId}`);
        const courseData = await getRecordById('courses', courseId);
        console.timeEnd(`CourseData:fetchCourse:${courseId}`);
        
        if (!courseData) {
          throw new Error("Course not found");
        }
        setCourse(courseData);

        // Fetch all data in parallel for maximum performance
        const fetchPromises = [];

        // 1. Fetch group data if available
        if (courseData.groupId) {
          fetchPromises.push(
            getRecordById('groups', courseData.groupId).then(groupData => {
              setGroup(groupData);
              return groupData;
            })
          );
        } else {
          fetchPromises.push(Promise.resolve(null));
        }

        // 2. Fetch teachers using cached approach
        fetchPromises.push(
          fetchTeacherDataOptimized(courseData).then(teachersData => {
            setTeachers(teachersData);
            return teachersData;
          })
        );

        // 3. Fetch students in optimized batches
        fetchPromises.push(
          fetchStudentDataOptimized(courseData).then(studentsData => {
            setStudents(studentsData);
            return studentsData;
          })
        );

        // 4. Fetch sessions using optimized query
        fetchPromises.push(
          fetchSessionDataOptimized(courseData).then(sessionsData => {
            setSessions(sessionsData);
            return sessionsData;
          })
        );

        // Wait for all data to be fetched in parallel
        const [groupData, teachersData, studentsData, sessionsData] = await Promise.all(fetchPromises);
        
        // Cache the results
        courseCache.set(cacheKey, {
          course: courseData,
          group: groupData,
          teachers: teachersData,
          students: studentsData,
          sessions: sessionsData,
          timestamp: now
        });
        
        console.timeEnd(`CourseData:fetchCourseDetails:${courseId}`);
      } catch (err) {
        console.error("Error fetching course details:", err);
        setError("Failed to load course details.");
      } finally {
        console.log(`✅ useCourseData: Setting loading to false for courseId ${courseId}`);
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourseDetails();
    } else {
      // Clear data and set loading to false when no courseId is provided
      console.log('🧹 useCourseData: No courseId provided, clearing data');
      setCourse(null);
      setGroup(null);
      setTeachers([]);
      setStudents([]);
      setSessions([]);
      setLoading(false);
      setError(null);
    }
  }, [courseId]);

  const fetchTeacherDataOptimized = async (courseData) => {
    try {
      console.time(`CourseData:fetchTeachers:${courseId}`);
      
      // Collect teacher IDs
      let teacherIds = [];
      if (courseData.teacherIds && Array.isArray(courseData.teacherIds)) {
        teacherIds = courseData.teacherIds;
      } else if (courseData.teacherId) {
        teacherIds = [courseData.teacherId];
      }

      // Use bulk fetch with caching
      const teacherData = await getBulkTeachersByIds(teacherIds);

      console.timeEnd(`CourseData:fetchTeachers:${courseId}`);
      return teacherData;
    } catch (err) {
      console.error("Error fetching teacher data:", err);
      return [];
    }
  };

  const fetchStudentDataOptimized = async (courseData) => {
    try {
      if (!courseData.studentIds || courseData.studentIds.length === 0) {
        return [];
      }

      console.time(`CourseData:fetchStudents:${courseId}`);
      
      // Use the new bulk fetch function
      const allStudents = await getBulkStudentsByIds(courseData.studentIds);
      
      console.timeEnd(`CourseData:fetchStudents:${courseId}`);
      console.log(`Fetched ${allStudents.length} students for course ${courseId}`);
      
      return allStudents;
    } catch (err) {
      console.error("Error fetching student data:", err);
      return [];
    }
  };

  const fetchSessionDataOptimized = async (courseData) => {
    try {
      console.time(`CourseData:fetchSessions:${courseId}`);
      
      // Use the optimized getSessionsByCourseId instead of individual fetches
      const sessionData = await getSessionsByCourseId(courseId);
      
      // Sort sessions by sessionOrder and date
      const sortedSessions = sessionData
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
          return (a.date || '').localeCompare(b.date || '');
        });

      console.timeEnd(`CourseData:fetchSessions:${courseId}`);
      console.log(`Fetched ${sortedSessions.length} sessions for course ${courseId}`);
      
      return sortedSessions;
    } catch (err) {
      console.error("Error fetching session data:", err);
      return [];
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

  // Function to refetch sessions data
  const refetchSessions = async () => {
    if (!course) return;
    
    try {
      console.log(`Refetching sessions for course ${courseId}`);
      const sessionData = await fetchSessionDataOptimized(course);
      setSessions(sessionData);
      
      // Clear cache to ensure fresh data on next full fetch
      clearCourseCache(courseId);
    } catch (err) {
      console.error("Error refetching sessions:", err);
    }
  };

  // Function to update a session locally for immediate UI feedback
  const updateSessionLocally = (sessionId, updates) => {
    setSessions(prevSessions => 
      prevSessions.map(session => 
        session.id === sessionId 
          ? { ...session, ...updates }
          : session
      )
    );
  };

  return {
    course, 
    group,
    teachers,
    students,
    sessions,
    loading,
    error,
    refetchSessions,
    updateSessionLocally
  };
};

// Export cache management functions for external use
export const clearCourseCache = (courseId) => {
  if (courseId) {
    courseCache.delete(`course_${courseId}`);
  } else {
    courseCache.clear();
  }
};

export const getCacheStats = () => {
  return {
    size: courseCache.size,
    keys: Array.from(courseCache.keys())
  };
};