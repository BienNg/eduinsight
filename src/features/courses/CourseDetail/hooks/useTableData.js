// src/features/courses/CourseDetail/hooks/useTableData.js
import styles from '../../../styles/modules/Table.module.css';

export const useTableData = (teachers, calculateStudentAttendance, calculateSessionAttendance) => {
  // Helper function to safely render any type of value
  const safelyRenderValue = (value) => {
    if (value === null || value === undefined) {
      return '-';
    }

    if (typeof value === 'string' || typeof value === 'number') {
      return value;
    }

    // Handle objects with hyperlink & text properties (ExcelJS rich text)
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
      // Handle date objects
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      // Last resort - convert to string
      try {
        return JSON.stringify(value);
      } catch (e) {
        return 'Complex value';
      }
    }

    // Convert arrays to comma-separated strings
    if (Array.isArray(value)) {
      return value.map(item => safelyRenderValue(item)).join(', ');
    }

    // Last resort for any other type
    return String(value);
  };

  // Define student table columns
  const studentColumns = [
    { key: 'name', label: 'Name', sortable: true },
    {
      key: 'attendance',
      label: 'Absence',
      sortable: true,
      render: (student) => calculateStudentAttendance(student.id)
    },
    { key: 'info', label: 'Info', sortable: true },
    { key: 'notes', label: 'Notes', sortable: true }
  ];

  // Define session table columns
  const sessionColumns = [
    { key: 'title', label: 'Title', sortable: true },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (session) => safelyRenderValue(session.date)
    },
    {
      key: 'teacherId',
      label: 'Teacher',
      sortable: true,
      render: (session) => {
        return session.teacherId
          ? (
            teachers.length > 0
              ? (
                teachers.find(t => String(t.id) === String(session.teacherId))?.name
                || 'Different Teacher'
              )
              : 'Different Teacher'
          )
          : '-';
      }
    },
    {
      key: 'time',
      label: 'Time',
      sortable: true,
      render: (session) => `${safelyRenderValue(session.startTime)} - ${safelyRenderValue(session.endTime)}`
    },
    {
      key: 'attendance',
      label: 'Attendance',
      sortable: true,
      render: (session) => calculateSessionAttendance(session)
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (session) => session.status && (
        <span className={`${styles.statusBadge} ${styles[`status${session.status.charAt(0).toUpperCase() + session.status.slice(1)}`]}`}>
          {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
        </span>
      )
    }
  ];

  return {
    studentColumns,
    sessionColumns,
    safelyRenderValue
  };
};