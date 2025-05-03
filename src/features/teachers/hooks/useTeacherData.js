// src/features/teachers/hooks/useTeacherData.js
import { useState, useEffect, useMemo } from 'react';
import { getRecordById, getAllRecords } from '../../firebase/database';
import {
  getCurrentMonthSessions,
  getPreviousMonthSessions,
  formatMonthId,
  getCurrentMonthRange,
  getPreviousMonthRange,
  getTeacherCurrentMonthData,
  getTeacherPreviousMonthData
} from '../../utils/dateQueryUtils';
import { prepareChartData } from '../utils/teacherDetailUtils';

export const useTeacherData = (teacherId) => {
  const [teacher, setTeacher] = useState(null);
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupsData, setGroupsData] = useState([]);
  const [currentMonthData, setCurrentMonthData] = useState([]);
  const [previousMonthData, setPreviousMonthData] = useState([]);
  const [monthNow, setMonthNow] = useState('');
  const [prevMonthName, setPrevMonthName] = useState('');
  const [courseCompletionMap, setCourseCompletionMap] = useState({});

  useEffect(() => {
    const fetchTeacherDetails = async () => {
      try {
        setLoading(true);

        const teacherData = await getRecordById('teachers', teacherId);
        if (!teacherData) {
          throw new Error("Teacher not found");
        }
        setTeacher(teacherData);

        const coursesData = await Promise.all(
          (teacherData.courseIds || []).map(courseId => getRecordById('courses', courseId))
        );
        setCourses(coursesData.filter(c => c !== null));

        const groupsData = await getAllRecords('groups');
        setGroupsData(groupsData);

        // Fetch all sessions related to this teacher's courses
        const allSessionIds = [];
        coursesData.forEach(course => {
          if (course && course.sessionIds) {
            allSessionIds.push(...course.sessionIds);
          }
        });

        const sessionsData = await Promise.all(
          allSessionIds.map(sessionId => getRecordById('sessions', sessionId))
        );

        const validSessions = sessionsData
          .filter(s => s !== null)
          .filter(s => s.teacherId === teacherId);

        // Calculate course completion
        const completionMap = {};
        validSessions.forEach(session => {
          if (!completionMap[session.courseId]) {
            completionMap[session.courseId] = {
              total: 0,
              completed: 0
            };
          }

          completionMap[session.courseId].total++;
          if (session.status === 'completed') {
            completionMap[session.courseId].completed++;
          }
        });

        setCourseCompletionMap(completionMap);

        const sortedSessions = validSessions.sort((a, b) => {
          if (!a.date || !b.date) return 0;
          const partsA = a.date.split('.');
          const partsB = b.date.split('.');
          if (partsA.length === 3 && partsB.length === 3) {
            const dateA = new Date(partsA[2], partsA[1] - 1, partsA[0]);
            const dateB = new Date(partsB[2], partsB[1] - 1, partsB[0]);
            return dateB - dateA; // Sort descending
          }
          return 0;
        });

        setSessions(sortedSessions);

        const { firstDay: currentFirst } = getCurrentMonthRange();
        const { firstDay: prevFirst } = getPreviousMonthRange();
        setMonthNow(currentFirst.toLocaleString('de-DE', { month: 'long', year: 'numeric' }));
        setPrevMonthName(prevFirst.toLocaleString('de-DE', { month: 'long', year: 'numeric' }));

        // Get current and previous month data
        const currentData = await getTeacherCurrentMonthData(teacherId);
        setCurrentMonthData(currentData);

        const prevData = await getTeacherPreviousMonthData(teacherId);
        setPreviousMonthData(prevData);

      } catch (err) {
        console.error("Error fetching teacher details:", err);
        setError("Failed to load teacher details.");
      } finally {
        setLoading(false);
      }
    };

    if (teacherId) {
      fetchTeacherDetails();
    }
  }, [teacherId]);

  // Calculate unique group IDs
  const uniqueGroupIds = useMemo(() => {
    const groupIds = new Set();
    courses.forEach(course => {
      if (course && course.groupId) {
        groupIds.add(course.groupId);
      }
    });
    return groupIds.size;
  }, [courses]);

  const chartData = useMemo(() => prepareChartData(sessions), [sessions]);
  const sessionsTotalHours = useMemo(() => sessions.length * 1.5, [sessions.length]);

  return {
    teacher,
    courses,
    sessions,
    loading,
    error,
    groupsData,
    currentMonthData,
    previousMonthData,
    monthNow,
    prevMonthName,
    courseCompletionMap,
    uniqueGroupIds,
    chartData,
    sessionsTotalHours
  };
};