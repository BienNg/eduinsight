// src/features/courses/components/CourseDetailPanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBook,
  faUsers,
  faCalendarAlt,
  faChalkboardTeacher,
  faGraduationCap,
  faInfoCircle,
  faMapMarkerAlt,
  faClock,
  faEllipsisV,
  faTrash,
  faLink,
  faSync,
  faExternalLinkAlt
} from '@fortawesome/free-solid-svg-icons';
import { handleDeleteCourse } from '../../utils/courseDeletionUtils';
import { calculateTotalHours } from '../../utils/timeUtils';
import { getRecordById } from '../../firebase/database';
import {
  fetchGoogleSheet, fetchGoogleSheetTitle,
  extractSheetFromWorkbook
} from '../../import/services/googleSheetsService';
import { processB1CourseFileWithColors } from '../../import/services/dataProcessing';
import { toast } from 'sonner'; // Assuming you're using sonner for toast notifications
import '../../styles/CourseDetailPanel.css';

const CourseDetailPanel = ({ course, students, sessions, loading, setCourses, group }) => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [deletingCourseId, setDeletingCourseId] = useState(null);
  const [error, setError] = useState(null);
  const [teacherName, setTeacherName] = useState('Nicht zugewiesen');
  const [sessionTeachers, setSessionTeachers] = useState({});
  const [isSyncing, setIsSyncing] = useState(false);
  // Track the current course ID to detect changes
  const currentCourseId = useRef(course?.id);
  // Track active toast ID
  const toastId = useRef(null);
  const [teachersLoading, setTeachersLoading] = useState(false);


  const handleOpenCourseDetail = (e) => {
    e.stopPropagation();
    if (course && course.id) {
      // Navigate to the course detail page with the group name in state if available
      navigate(`/courses/${course.id}`, {
        state: { groupName: group?.name }
      });
    }
  };

  // Cleanup toast when component unmounts or course changes
  useEffect(() => {
    // If course ID changed and we have an active toast, dismiss it
    if (currentCourseId.current !== course?.id && toastId.current) {
      toast.dismiss(toastId.current);
      toastId.current = null;
      // Also reset syncing state if we switch courses during sync
      setIsSyncing(false);
    }

    // Update ref with current course ID
    currentCourseId.current = course?.id;

    // Cleanup on unmount
    return () => {
      if (toastId.current) {
        toast.dismiss(toastId.current);
      }
    };
  }, [course?.id]);

  useEffect(() => {
    const fetchTeachersData = async () => {
      if (!sessions || sessions.length === 0) return;

      try {
        setTeachersLoading(true);

        // Collect all unique teacher IDs from course and sessions
        const uniqueTeacherIds = new Set();

        // Add course teacher if available
        if (course && course.teacherIds && course.teacherIds.length > 0) {
          course.teacherIds.forEach(id => uniqueTeacherIds.add(id));
        } else if (course && course.teacherId) {
          uniqueTeacherIds.add(course.teacherId);
        }

        // Add session teachers
        sessions.forEach(session => {
          if (session.teacherId) {
            uniqueTeacherIds.add(session.teacherId);
          }
        });

        if (uniqueTeacherIds.size === 0) {
          setTeacherName('Nicht zugewiesen');
          setSessionTeachers({});
          return;
        }

        // Fetch all teachers in a single batch
        const teacherPromises = Array.from(uniqueTeacherIds).map(teacherId =>
          getRecordById('teachers', teacherId)
        );

        const teachersData = await Promise.all(teacherPromises);
        const teachersMap = {};

        // Map teacher data by ID
        teachersData.forEach(teacher => {
          if (teacher && teacher.id) {
            teachersMap[teacher.id] = teacher.name || 'Nicht zugewiesen';
          }
        });

        // Set the course's main teacher name
        if (course && course.teacherIds && course.teacherIds.length > 0) {
          setTeacherName(teachersMap[course.teacherIds[0]] || 'Nicht zugewiesen');
        } else if (course && course.teacherId) {
          setTeacherName(teachersMap[course.teacherId] || 'Nicht zugewiesen');
        } else {
          setTeacherName('Nicht zugewiesen');
        }

        // Create a mapping for session teachers
        const sessionTeachersMapping = {};
        sessions.forEach(session => {
          if (session.teacherId) {
            sessionTeachersMapping[session.teacherId] = teachersMap[session.teacherId] || 'Nicht zugewiesen';
          }
        });

        setSessionTeachers(sessionTeachersMapping);
      } catch (error) {
        console.error("Error fetching teachers data:", error);
      } finally {
        setTeachersLoading(false);
      }
    };

    fetchTeachersData();
  }, [course, sessions]);

  // In the CourseDetailPanel component, before the return statement
  const sortedAndGroupedSessions = React.useMemo(() => {
    if (!sessions || sessions.length === 0) return [];

    // Sort sessions by date (assuming EU format DD.MM.YYYY)
    const sortedSessions = [...sessions].sort((a, b) => {
      const [dayA, monthA, yearA] = a.date.split('.');
      const [dayB, monthB, yearB] = b.date.split('.');
      return new Date(`${yearA}-${monthA}-${dayA}`) - new Date(`${yearB}-${monthB}-${dayB}`);
    });

    // Add month information for grouping
    const germanMonths = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];

    let currentMonth = null;
    let currentYear = null;

    return sortedSessions.map((session, index) => {
      const [day, month, year] = session.date.split('.');
      const monthIndex = parseInt(month, 10) - 1; // Convert to 0-indexed
      const sessionMonth = germanMonths[monthIndex];
      const sessionYear = year;

      const isNewMonth = currentMonth !== sessionMonth || currentYear !== sessionYear;

      if (isNewMonth) {
        currentMonth = sessionMonth;
        currentYear = sessionYear;
      }

      return {
        ...session,
        isNewMonth,
        monthDisplay: `${sessionMonth} ${sessionYear}`
      };
    });
  }, [sessions]);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  // Updated handleSync function
  const handleSync = async (e) => {
    e.stopPropagation();

    if (!course || !course.sourceUrl) return;

    try {
      setIsSyncing(true);

      // Create a unique toast ID and store it in ref
      toastId.current = `sync-${course.id}-${Date.now()}`;

      // Show syncing toast
      toast.loading(`Syncing ${course.name} with Google Sheet...`, {
        id: toastId.current,
        duration: Infinity
      });

      // Fetch the Google Sheet
      const sheetData = await fetchGoogleSheet(course.sourceUrl);

      // Use the specific sheet associated with this course if available
      let courseSheetData = sheetData.arrayBuffer;

      // If course has sheetName property and it's a multi-sheet workbook
      if (course.sheetName && sheetData.isMultiSheet) {
        try {
          // Try to extract the specific sheet
          courseSheetData = extractSheetFromWorkbook(sheetData.rawWorkbook, course.sheetName);
          console.log(`Using sheet "${course.sheetName}" for course "${course.name}"`);
        } catch (sheetError) {
          // If sheet not found, fall back to using the original workbook
          console.error(`Sheet "${course.sheetName}" not found, using first sheet instead:`, sheetError);
          // We'll continue with the full workbook - the processor will use the first sheet
        }
      } else if (sheetData.isMultiSheet) {
        // If it's multi-sheet but course doesn't have sheetName, log a warning
        console.warn(`Course "${course.name}" has no associated sheet name, using first sheet from workbook`);
      }

      // Get metadata from course
      const metadata = {
        groupName: group?.name,
        mode: group?.mode,
        level: course.level,
        language: group?.language || '',
        sourceUrl: course.sourceUrl,
        sheetName: course.sheetName, // Include the sheet name in metadata
        sheetIndex: course.sheetIndex // Include the sheet index in metadata
      };

      // Process the file with the existing course data
      await processB1CourseFileWithColors(
        courseSheetData,
        `${course.name} (Sync)`,
        {
          metadata: metadata
        }
      );

      // Only show success toast if we're still on the same course
      if (currentCourseId.current === course.id) {
        toast.success(`Successfully synced ${course.name}`, {
          id: toastId.current,
          duration: 5000
        });
      } else {
        // If we've switched courses, just dismiss the toast
        toast.dismiss(toastId.current);
      }

      // Clear the toast ID
      toastId.current = null;

    } catch (error) {
      // Only show error toast if we're still on the same course
      if (currentCourseId.current === course.id) {
        toast.error(`Failed to sync ${course.name}`, {
          id: toastId.current,
          duration: 5000,
          description: error.message.substring(0, 100) + (error.message.length > 100 ? '...' : '')
        });

        setError(`Failed to sync: ${error.message}`);
      } else {
        // If we've switched courses, just dismiss the toast
        toast.dismiss(toastId.current);
      }

      // Clear the toast ID
      toastId.current = null;
    } finally {
      // Only update state if we're still on the same course
      if (currentCourseId.current === course.id) {
        setIsSyncing(false);
      }
    }
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      if (showDropdown) setShowDropdown(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDropdown]);

  const handleDelete = (e) => {
    if (course) {
      handleDeleteCourse(
        course.id,
        course.name,
        setDeletingCourseId,
        setCourses,
        setError,
        e
      );
    }
    setShowDropdown(false);
  };

  if (loading) {
    return (
      <div className="course-detail-panel">
        <div className="course-detail-panel-loading">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading course details...</p>
          <div className="loading-progress">
            <div className="loading-step">Fetching course information</div>
            <div className="loading-step">Loading students and sessions</div>
            <div className="loading-step">Preparing analytics</div>
          </div>
          <div className="course-detail-panel-skeleton"></div>
          <div className="course-detail-panel-skeleton"></div>
          <div className="course-detail-panel-skeleton"></div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-detail-panel">
        <div className="course-detail-panel-empty-state">
          <FontAwesomeIcon icon={faBook} size="2x" style={{ color: '#cccccc', marginBottom: '16px' }} />
          <h3>Kurs auswählen</h3>
          <p>Wählen Sie einen Kurs aus, um Details anzuzeigen</p>
        </div>
      </div>
    );
  }

  return (
    <div className="course-detail-panel">
      {/* Course header section */}
      <div className="course-detail-panel-header">
        <h2 className="course-detail-panel-title">{course.name || 'Kursdetails'}</h2>
        <div className="course-detail-panel-actions">
          {course.lastUpdated && (
            <span className="course-detail-panel-last-updated">{course.lastUpdated}</span>
          )}
          {deletingCourseId === course.id ? (
            <span className="course-detail-panel-deleting">Löschen...</span>
          ) : (
            <>
              <button
                className="course-detail-panel-detail-button"
                onClick={handleOpenCourseDetail}
                title="Kursdetails anzeigen"
              >
                <FontAwesomeIcon icon={faExternalLinkAlt} />
              </button>
              {/* Sync button - only show if course has sourceUrl */}
              {course && course.sourceUrl && (
                <button
                  className="course-detail-panel-sync-button"
                  onClick={handleSync}
                  disabled={isSyncing}
                  title="Sync with Google Sheet"
                >
                  <FontAwesomeIcon
                    icon={faSync}
                    className={isSyncing ? "course-detail-panel-sync-icon spinning" : "course-detail-panel-sync-icon"}
                  />
                </button>
              )}

              <div className="course-detail-panel-settings" onClick={toggleDropdown}>
                <FontAwesomeIcon icon={faEllipsisV} />
                {showDropdown && (
                  <div className="course-detail-panel-dropdown">
                    <button className="course-detail-panel-dropdown-item" onClick={handleDelete}>
                      <FontAwesomeIcon icon={faTrash} className="course-detail-panel-dropdown-icon" />
                      Kurs löschen
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>


      {error && (
        <div className="course-detail-panel-error">{error}</div>
      )}

      <div className="course-detail-panel-section">
        <h3 className="course-detail-panel-section-title">
          <FontAwesomeIcon icon={faInfoCircle} className="course-detail-panel-icon" />
          Kursdetails
        </h3>
        <div className="course-detail-panel-info-grid">
          <div className="course-detail-panel-info-item">
            <span className="course-detail-panel-info-value">
              <FontAwesomeIcon icon={faGraduationCap} className="course-detail-panel-icon" />
              {course.level || 'N/A'}
            </span>
          </div>
          <div className="course-detail-panel-info-item">
            <span className="course-detail-panel-info-value">
              <FontAwesomeIcon icon={faBook} className="course-detail-panel-icon" />
              {group.type || 'Standard'}
            </span>
          </div>
          <div className="course-detail-panel-info-item">
            <span className="course-detail-panel-info-value">
              <FontAwesomeIcon icon={faChalkboardTeacher} className="course-detail-panel-icon" />
              {teacherName}
            </span>
          </div>
          <div className="course-detail-panel-info-item">
            <span className="course-detail-panel-info-value">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="course-detail-panel-icon" />
              {group.mode || 'Online'}
            </span>
          </div>
          <div className="course-detail-panel-info-item">
            <span className="course-detail-panel-info-value">
              <FontAwesomeIcon icon={faCalendarAlt} className="course-detail-panel-icon" />
              {course.startDate}
            </span>
          </div>
          <div className="course-detail-panel-info-item">
            <span className="course-detail-panel-info-value">
              <FontAwesomeIcon icon={faClock} className="course-detail-panel-icon" />
              {calculateTotalHours(sessions)} Stunden
            </span>
          </div>
          {course.sourceUrl && (
            <div className="course-detail-panel-info-item">
              <span className="course-detail-panel-info-value">
                <FontAwesomeIcon icon={faLink} className="course-detail-panel-icon" />
                <a
                  href={course.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="course-detail-panel-link"
                >
                  Google Sheet
                </a>
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="course-detail-panel-section">
        <h3 className="course-detail-panel-section-title">
          <FontAwesomeIcon icon={faUsers} className="course-detail-panel-icon" />
          Teilnehmer ({students?.length || 0})
        </h3>
        <div className="course-detail-panel-student-list">
          {students && students.length > 0 ? (
            students.map((student) => (
              <div key={student.id} className="course-detail-panel-student-item">
                <span className="course-detail-panel-student-name">{student.name}</span>
              </div>
            ))
          ) : (
            <div className="course-detail-panel-empty-state">
              Keine Teilnehmer gefunden
            </div>
          )}
        </div>
      </div>

      <div className="course-detail-panel-section">
        <h3 className="course-detail-panel-section-title">
          <FontAwesomeIcon icon={faCalendarAlt} className="course-detail-panel-icon" />
          Lektionen ({sessions?.length || 0})
        </h3>
        <div className="course-detail-panel-session-list">
          {sessions && sessions.length > 0 ? (
            sortedAndGroupedSessions.map((session, index) => (
              <React.Fragment key={session.id || index}>
                {session.isNewMonth && (
                  <div className="course-detail-panel-month-divider">
                    <span className="course-detail-panel-month-name">{session.monthDisplay}</span>
                  </div>
                )}
                <div className="course-detail-panel-session-item">
                  <span className="course-detail-panel-session-title">{session.title || 'Unbenannte Lektion'}</span>
                  <span className="course-detail-panel-session-date">{session.date}</span>
                  <span className="course-detail-panel-session-teacher">
                    {session.teacherId ? sessionTeachers[session.teacherId] : 'Nicht zugewiesen'}
                  </span>
                  <div className="course-detail-panel-session-badges">
                    <span className={`course-detail-panel-status-badge ${session.status === 'completed' ? 'status-completed' : 'status-planned'}`}>
                      {session.status === 'completed' ? 'Abgeschlossen' : 'Geplant'}
                    </span>
                    <span className="course-detail-panel-duration-badge">
                      {session.duration || course.duration || '60'} h.
                    </span>
                  </div>
                </div>
              </React.Fragment>
            ))
          ) : (
            <div className="course-detail-panel-empty-state">
              Keine Lektionen gefunden
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPanel;