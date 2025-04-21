// src/components/Dashboard/KlassenContent.jsx
import { useState, useEffect } from 'react';
import { getAllRecords, deleteRecord, getRecordById, updateRecord } from '../../firebase/database';
import CourseDetail from './CourseDetail';
import './Content.css';

const KlassenContent = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [deletingCourseId, setDeletingCourseId] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const coursesData = await getAllRecords('courses');

      // Enrich course data with teacher and student info
      const enrichedCourses = await Promise.all(coursesData.map(async (course) => {
        // Get teacher if available
        let teacher = null;
        if (course.teacherId) {
          teacher = await getRecordById('teachers', course.teacherId);
        }

        // Get students count (we'll fetch full student data in CourseDetail)
        const studentCount = course.studentIds ? course.studentIds.length : 0;

        // Get sessions count (we'll fetch full session data in CourseDetail)
        const sessionCount = course.sessionIds ? course.sessionIds.length : 0;

        return {
          ...course,
          teacherName: teacher ? teacher.name : 'Not assigned',
          studentCount: studentCount,
          sessionCount: sessionCount
        };
      }));

      setCourses(enrichedCourses);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError("Failed to load courses. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (courseId) => {
    setSelectedCourseId(courseId);
  };

  const handleCloseDetails = () => {
    setSelectedCourseId(null);
    // Refresh course list when returning from details
    fetchCourses();
  };

  const handleDeleteCourse = async (courseId, courseName, event) => {
    // Prevent click from propagating to parent elements
    event.stopPropagation();

    // Confirm deletion with the user
    const confirmDelete = window.confirm(`Sind Sie sicher, dass Sie "${courseName}" löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.`);

    if (confirmDelete) {
      try {
        setDeletingCourseId(courseId);

        // Get course data to clean up related records
        const course = await getRecordById('courses', courseId);

        if (course) {
          // Track entities that need to be checked for cleanup
          const affectedStudentIds = [...(course.studentIds || [])];
          const affectedTeacherIds = course.teacherId ? [course.teacherId] : [];
          const affectedMonthIds = new Set();

          // Delete related sessions and collect affected months
          if (course.sessionIds && course.sessionIds.length > 0) {
            for (const sessionId of course.sessionIds) {
              const session = await getRecordById('sessions', sessionId);
              if (session && session.monthId) {
                affectedMonthIds.add(session.monthId);
              }
              await deleteRecord('sessions', sessionId);
            }
          }

          // Remove course from student records and check for cleanup
          if (affectedStudentIds.length > 0) {
            for (const studentId of affectedStudentIds) {
              const student = await getRecordById('students', studentId);
              if (student && student.courseIds) {
                const updatedCourseIds = student.courseIds.filter(id => id !== courseId);

                if (updatedCourseIds.length === 0) {
                  // Student is no longer associated with any courses, delete it
                  await deleteRecord('students', studentId);
                  console.log(`Deleted orphaned student: ${studentId}`);
                } else {
                  // Update student with remaining courses
                  await updateRecord('students', studentId, { courseIds: updatedCourseIds });
                }
              }
            }
          }

          // Remove course from teacher record and check for cleanup
          if (affectedTeacherIds.length > 0) {
            for (const teacherId of affectedTeacherIds) {
              const teacher = await getRecordById('teachers', teacherId);
              if (teacher && teacher.courseIds) {
                const updatedCourseIds = teacher.courseIds.filter(id => id !== courseId);

                if (updatedCourseIds.length === 0) {
                  // Teacher is no longer associated with any courses, delete it
                  await deleteRecord('teachers', teacherId);
                  console.log(`Deleted orphaned teacher: ${teacherId}`);
                } else {
                  // Update teacher with remaining courses
                  await updateRecord('teachers', teacherId, { courseIds: updatedCourseIds });
                }
              }
            }
          }

          // Clean up affected months
          if (affectedMonthIds.size > 0) {
            for (const monthId of affectedMonthIds) {
              const month = await getRecordById('months', monthId);
              if (month) {
                // Remove this course from the month's courseIds
                const updatedCourseIds = month.courseIds
                  ? month.courseIds.filter(id => id !== courseId)
                  : [];

                // Recalculate sessionCount by querying remaining sessions for this month
                const remainingSessions = await getAllRecords('sessions');
                const remainingSessionCount = remainingSessions.filter(
                  session => session.monthId === monthId
                ).length;

                if (updatedCourseIds.length === 0 && remainingSessionCount === 0) {
                  // Month has no more courses or sessions, delete it
                  await deleteRecord('months', monthId);
                  console.log(`Deleted orphaned month: ${monthId}`);
                } else {
                  // Update month's course list and session count
                  const updatedMonth = {
                    courseIds: updatedCourseIds,
                    sessionCount: remainingSessionCount,
                  };

                  await updateRecord('months', monthId, updatedMonth);
                }
              }
            }
          }

          // Delete the course itself
          await deleteRecord('courses', courseId);

          // Update the courses list
          setCourses(prevCourses => prevCourses.filter(course => course.id !== courseId));
        }
      } catch (err) {
        console.error("Error deleting course:", err);
        setError(`Failed to delete course: ${err.message}`);
      } finally {
        setDeletingCourseId(null);
      }
    }
  };

  if (selectedCourseId) {
    return <CourseDetail courseId={selectedCourseId} onClose={handleCloseDetails} />;
  }

  return (
    <div className="klassen-content">
      <h2>Klassenübersicht</h2>

      {loading && <div className="loading-indicator">Daten werden geladen...</div>}

      {error && <div className="error-message">{error}</div>}

      {!loading && !error && courses.length === 0 && (
        <div className="empty-state">
          <p>Keine Klassen gefunden. Importieren Sie Klassendaten über den Excel Import.</p>
        </div>
      )}

      {!loading && !error && courses.length > 0 && (
        <div className="courses-grid">
          {courses.map((course) => (
            <div className="course-card" key={course.id} onClick={() => handleViewDetails(course.id)}>
              <div className="course-header">
                <h3>{course.name}</h3>
                <span className="course-level">{course.level}</span>
              </div>
              <div className="course-info">
                <div className="info-item">
                  <span className="label">Schüler:</span>
                  <span className="value">{course.studentCount}</span>
                </div>
                <div className="info-item">
                  <span className="label">Lektionen:</span>
                  <span className="value">{course.sessionCount}</span>
                </div>
                <div className="info-item">
                  <span className="label">Lehrer:</span>
                  <span className="value">{course.teacherName}</span>
                </div>
                {course.startDate && (
                  <div className="info-item">
                    <span className="label">Zeitraum:</span>
                    <span className="value">
                      {course.startDate} - {course.endDate || 'heute'}
                    </span>
                  </div>
                )}
              </div>
              <div className="course-actions">
                <button
                  className="btn-delete"
                  onClick={(e) => handleDeleteCourse(course.id, course.name, e)}
                  disabled={deletingCourseId === course.id}
                >
                  {deletingCourseId === course.id ? 'Löschen...' : 'Löschen'}
                </button>
                <button
                  className="btn-details"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(course.id);
                  }}
                >
                  Details ansehen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default KlassenContent;