// src/features/courses/CourseDetail/hooks/useAttendance.js
export const useAttendance = (students, sessions) => {

  // Calculate attendance for a student across all sessions
  const calculateStudentAttendance = (studentId) => {
    if (!sessions || sessions.length === 0) return "0/0";

    let presentCount = 0;
    let totalSessions = 0;

    sessions.forEach(session => {
      if (session.attendance && session.attendance[studentId]) {
        totalSessions++;

        // Handle both string and object formats for attendance
        const attendanceData = session.attendance[studentId];
        const status = typeof attendanceData === 'object'
          ? attendanceData.status
          : attendanceData;

        // Count as present if present (instead of counting absences)
        if (status === 'present') {
          presentCount++;
        }
      }
    });

    return `${presentCount}/${totalSessions}`;
  };

  // Calculate attendance for a session across all students
  const calculateSessionAttendance = (session) => {
    if (!session.attendance || !students || students.length === 0) return "0/0";

    let presentCount = 0;
    let totalStudents = 0;

    students.forEach(student => {
      if (session.attendance[student.id]) {
        totalStudents++;

        // Handle both string and object formats for attendance
        const attendanceData = session.attendance[student.id];
        const status = typeof attendanceData === 'object'
          ? attendanceData.status
          : attendanceData;

        if (status === 'present') {
          presentCount++;
        }
      }
    });

    return `${presentCount}/${totalStudents}`;
  };

  // Calculate average attendance percentage
  const calculateAverageAttendance = () => {
    if (students.length === 0 || sessions.length === 0) return '-';

    const averagePercentage = Math.round(
      sessions.reduce((sum, session) => {
        const [present, total] = calculateSessionAttendance(session).split('/');
        return sum + (parseInt(present) / parseInt(total) * 100 || 0);
      }, 0) / sessions.length
    );

    return `${averagePercentage}%`;
  };

  return {
    calculateStudentAttendance,
    calculateSessionAttendance,
    calculateAverageAttendance
  };
};