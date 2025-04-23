// src/components/Dashboard/KlassenContent.jsx
import { useState, useEffect } from 'react';
import { getAllRecords, deleteRecord, getRecordById, updateRecord } from '../../firebase/database';
import { sortLanguageLevels } from '../../utils/levelSorting';
import CourseDetail from './CourseDetail';
import GroupDetail from './GroupDetail'; // We'll create this component
import './Content.css';

const KlassenContent = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGroupName, setSelectedGroupName] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [deletingCourseId, setDeletingCourseId] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  // Add a function to handle level badge clicks
  const handleLevelBadgeClick = (groupName, level) => {
    // Find the first course that matches both group and level
    const matchingCourse = courses.find(
      course => course.group === groupName && course.level === level
    );

    if (matchingCourse) {
      setSelectedCourseId(matchingCourse.id);
    } else {
      // Handle case where no matching course is found
      alert(`No course found for ${level} in group ${groupName}`);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const coursesData = await getAllRecords('courses');
      const allSessions = await getAllRecords('sessions');
      const allTeachers = await getAllRecords('teachers');

      // Helper: get teacher name by id
      const teacherNameById = {};
      allTeachers.forEach(t => { teacherNameById[t.id] = t.name; });

      // Enrich course data
      const enrichedCourses = await Promise.all(coursesData.map(async (course) => {
        // Get teacher if available
        let teacher = null;
        if (course.teacherId) {
          teacher = allTeachers.find(t => t.id === course.teacherId);
        }

        // Get students count
        const studentCount = course.studentIds ? course.studentIds.length : 0;

        // Get sessions for this course
        const courseSessions = allSessions.filter(s => s.courseId === course.id);

        // Count sessions per teacher
        const teacherSessionMap = {};
        courseSessions.forEach(session => {
          if (session.teacherId) {
            teacherSessionMap[session.teacherId] = (teacherSessionMap[session.teacherId] || 0) + 1;
          }
        });

        // Build teacher session info array
        const teacherSessions = Object.entries(teacherSessionMap).map(([teacherId, count]) => ({
          teacherId,
          name: teacherNameById[teacherId] || 'Unbekannt',
          count,
        }));

        // Get sessions count
        const sessionCount = courseSessions.length;

        return {
          ...course,
          teacherName: teacher ? teacher.name : 'Not assigned',
          studentCount,
          sessionCount,
          teacherSessions, // <-- add this
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

  const handleViewGroupDetails = (groupName) => {
    setSelectedGroupName(groupName);
  };

  const handleCloseGroupDetails = () => {
    setSelectedGroupName(null);
    // Refresh course list when returning from details
    fetchCourses();
  };

  const handleViewCourseDetails = (courseId) => {
    setSelectedCourseId(courseId);
  };

  const handleCloseCourseDetails = () => {
    setSelectedCourseId(null);
    // Keep the group view open but refresh data
    fetchCourses();
  };

  const handleDeleteCourse = async (courseId, courseName, event) => {
    // Prevent click from propagating to parent elements
    event.stopPropagation();

    // Confirm deletion with the user
    const confirmDelete = window.confirm(`Sind Sie sicher, dass Sie "${courseName}" löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.`);

    // If user confirms, proceed with deletion
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
    return <CourseDetail courseId={selectedCourseId} onClose={handleCloseCourseDetails} />;
  }

  // If a group is selected, show the GroupDetail component
  if (selectedGroupName) {
    return (
      <GroupDetail
        groupName={selectedGroupName}
        courses={courses.filter(course => course.group === selectedGroupName)}
        onClose={handleCloseGroupDetails}
        onViewCourse={handleViewCourseDetails}
        onDeleteCourse={handleDeleteCourse}
        deletingCourseId={deletingCourseId}
      />
    );
  }

  // Group courses by group name
  const groupCourses = () => {
    const groups = {};

    courses.forEach(course => {
      const groupName = course.group || 'Ungrouped';
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(course);
    });

    return groups;
  };

  const courseGroups = groupCourses();
  return (
    <div className="klassen-content">
      <h2>Klassenübersicht</h2>

      {loading && <div className="loading-indicator">Daten werden geladen...</div>}

      {error && <div className="error-message">{error}</div>}

      {!loading && !error && Object.keys(courseGroups).length === 0 && (
        <div className="empty-state">
          <p>Keine Klassen gefunden. Importieren Sie Klassendaten über den Excel Import.</p>
        </div>
      )}

      {!loading && !error && Object.keys(courseGroups).length > 0 && (
        <div className="course-groups-grid">
          {Object.entries(courseGroups).map(([groupName, groupCourses]) => (
            <div className="group-card" key={groupName}>
              <div className="group-header">
                <h3>{groupName}</h3>
                <div className="type-badges-container">
                  {(() => {
                    // Get unique course types in this group
                    const courseTypes = Array.from(new Set(groupCourses.map(course => course.courseType)));
                    return courseTypes.map(type => (
                      <span
                        key={type}
                        className={`type-badge ${type.toLowerCase()}`}
                      >
                        {type || 'Unknown'}
                      </span>
                    ));
                  })()}
                </div>
              </div>
              <div className="group-info">
                <div className="info-item">
                  <span className="label">Kursstufen</span>
                  <div className="level-badges-container">
                    {sortLanguageLevels(Array.from(new Set(groupCourses.map(course => course.level)))).map(level => (
                      <div
                        className="level-badge clickable"
                        key={level}
                        onClick={() => handleLevelBadgeClick(groupName, level)}
                      >
                        {level}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="info-item">
                  <span className="label">Lehrkräfte</span>
                  <div className="teacher-badges-container">
                    {(() => {
                      const allTeacherSessions = groupCourses.flatMap(course => course.teacherSessions || []);
                      if (allTeacherSessions.length === 0) {
                        return <span className="no-teachers-hint">Keine Lehrkräfte gefunden</span>;
                      }
                      return allTeacherSessions.map(ts => (
                        <span key={ts.teacherId + ts.name + Math.random()} className="teacher-badge">
                          {ts.name}
                          <span className="session-count-badge">{ts.count}</span>
                        </span>
                      ));
                    })()}
                  </div>
                </div>
                <div className="info-item">
                  <span className="label">Schüler insgesamt</span>
                  <span className="value">
                    {groupCourses.reduce((total, course) => total + course.studentCount, 0)}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">Lektionen insgesamt</span>
                  <span className="value">
                    {groupCourses.reduce((total, course) => total + course.sessionCount, 0)}
                  </span>
                </div>
              </div>

              <div className="group-actions">
                <button
                  className="btn-details"
                  onClick={() => handleViewGroupDetails(groupName)}
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