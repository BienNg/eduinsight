// src/components/Dashboard/hooks/useMonthData.js
import { useState, useEffect } from 'react';
import { getAllRecords } from '../../firebase/database';
import { calculateTotalHours } from '../../utils/timeUtils';

const useMonthData = () => {
  const [months, setMonths] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedMonth, setExpandedMonth] = useState(null);
  const [monthDetails, setMonthDetails] = useState({});
  const [currentMonthId, setCurrentMonthId] = useState(null);
  const [groups, setGroups] = useState([]);

  const countLongSessionsFromDB = (sessions) => {
    return sessions.filter(session => session.isLongSession).length;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const monthsData = await getAllRecords('months');
        const teachersData = await getAllRecords('teachers');
        const coursesData = await getAllRecords('courses');
        const sessionsData = await getAllRecords('sessions');
        const studentsData = await getAllRecords('students');
        const groupsData = await getAllRecords('groups');
        
        setMonths(monthsData);
        setTeachers(teachersData);
        setCourses(coursesData);
        setSessions(sessionsData);
        setStudents(studentsData);
        setGroups(groupsData);
        
        const details = {};
        monthsData.forEach((month) => {
          const monthSessions = sessionsData.filter((session) => session.monthId === month.id);
          const totalHours = calculateTotalHours(monthSessions);
          const courseIds = [...new Set(monthSessions.map((session) => session.courseId))];
          const monthCourses = coursesData.filter((course) =>
            courseIds.includes(course.id)
          );
          const teacherIds = [...new Set(monthCourses.flatMap((course) =>
            course.teacherIds ? course.teacherIds : []
          ))];
          const studentIds = new Set();
          monthCourses.forEach((course) => {
            if (course.studentIds) {
              course.studentIds.forEach((id) => studentIds.add(id));
            }
          });
          const teacherDetails = teacherIds.map((teacherId) => {
            const teacher = teachersData.find((t) => t.id === teacherId);
            if (!teacher) return null;
            const teacherSessions = monthSessions.filter((session) => session.teacherId === teacherId);
            const teacherHours = calculateTotalHours(teacherSessions);
            const teacherCourseIds = [...new Set(teacherSessions.map((session) => session.courseId))];
            const teacherCourses = coursesData.filter((course) => teacherCourseIds.includes(course.id));
            const teacherStudentIds = new Set();
            teacherCourses.forEach((course) => {
              if (course.studentIds) {
                course.studentIds.forEach((id) => teacherStudentIds.add(id));
              }
            });
            return {
              id: teacherId,
              name: teacher.name,
              courseCount: teacherCourses.length,
              sessionCount: teacherSessions.length,
              studentCount: teacherStudentIds.size,
              hours: teacherHours,
              longSessions: countLongSessionsFromDB(teacherSessions),
              courses: teacherCourses
            };
          }).filter((t) => t !== null);
          details[month.id] = {
            teacherCount: teacherIds.length,
            studentCount: studentIds.size,
            courseCount: courseIds.length,
            sessionCount: monthSessions.length,
            hours: totalHours,
            teachers: teacherDetails,
            longSessions: countLongSessionsFromDB(monthSessions),
            courses: monthCourses
          };
        });
        setMonthDetails(details);
        
        const now = new Date();
        const currentMonth = now.toISOString().substring(0, 7);
        const currentMonthObj = monthsData.find(month => month.id.startsWith(currentMonth));
        if (currentMonthObj) {
          setCurrentMonthId(currentMonthObj.id);
          setExpandedMonth(currentMonthObj.id);
        } else {
          const sortedMonths = [...monthsData].sort((a, b) => b.id.localeCompare(a.id));
          if (sortedMonths.length > 0) {
            setCurrentMonthId(sortedMonths[0].id);
            setExpandedMonth(sortedMonths[0].id);
          }
        }
      } catch (err) {
        setError("Failed to load month data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filterMonths = (searchQuery) => {
    if (!searchQuery) return months;
    return months.filter(month => {
      if (month.name && month.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return true;
      }
      const details = monthDetails[month.id];
      if (!details) return false;
      const teacherMatch = details.teachers.some(teacher =>
        teacher.name && teacher.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (teacherMatch) return true;
      const courseMatch = details.courses && details.courses.some(course =>
        course.name && course.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (courseMatch) return true;
      const groupMatch = details.courses && details.courses.some(course =>
        course.group && course.group.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return groupMatch;
    });
  };

  return {
    months,
    teachers,
    courses,
    sessions,
    students,
    groups,
    loading,
    error,
    expandedMonth,
    setExpandedMonth,
    monthDetails,
    currentMonthId, 
    setCurrentMonthId,
    filterMonths
  };
};

export default useMonthData;