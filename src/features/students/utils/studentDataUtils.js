// src/features/students/utils/studentDataUtils.js

// Function to safely render values (reused from other components)
export const safelyRenderValue = (value) => {
    if (value === null || value === undefined) {
      return '-';
    }
  
    if (typeof value === 'string' || typeof value === 'number') {
      return value;
    }
  
    if (value && typeof value === 'object') {
      if (value.hyperlink && value.text) {
        return value.text;
      }
      if (value.richText) {
        return value.richText.map(rt => rt.text).join('');
      }
      if (value.text) {
        return value.text;
      }
      if (value.formula) {
        return value.result || '';
      }
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      try {
        return JSON.stringify(value);
      } catch (e) {
        return 'Complex value';
      }
    }
  
    if (Array.isArray(value)) {
      return value.map(item => safelyRenderValue(item)).join(', ');
    }
  
    return String(value);
  };
  
  // Calculate attendance stats for a student
  export const calculateAttendanceStats = (sessions, studentId) => {
    if (!sessions || sessions.length === 0) {
      return {
        present: 0,
        absent: 0,
        sick: 0,
        technical: 0,
        unknown: 0,
        rate: 0,
        total: 0
      };
    }
  
    let present = 0;
    let absent = 0;
    let sick = 0;
    let technical = 0;
    let unknown = 0;
    let total = 0;
  
    sessions.forEach(session => {
      if (session.attendance && session.attendance[studentId]) {
        total++;
        const attendanceData = session.attendance[studentId];
        const status = typeof attendanceData === 'object' ? attendanceData.status : attendanceData;
  
        if (status === 'present') present++;
        else if (status === 'absent') absent++;
        else if (status === 'sick') sick++;
        else if (status === 'technical_issues') technical++;
        else unknown++;
      }
    });
  
    return {
      present,
      absent,
      sick,
      technical,
      unknown,
      total,
      rate: total > 0 ? Math.round((present / total) * 100) : 0
    };
  };