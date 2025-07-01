// src/features/courses/CourseDetail.jsx (updated)
import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { handleDeleteCourse } from '../utils/courseDeletionUtils';
import SessionDetailModal from '../sessions/SessionDetailModal';
import StudentDetailModal from '../students/StudentDetailModal';

// Importing custom hooks
import { useCourseData } from './CourseDetail/hooks/useCourseData';
import { useAttendance } from './CourseDetail/hooks/useAttendance';
import { useTableData } from './CourseDetail/hooks/useTableData';

// Importing UI components
import CourseHeader from './CourseDetail/components/CourseHeader';
import CourseStats from './CourseDetail/components/CourseStats';
import StudentTable from './CourseDetail/components/StudentTable';
import SessionTable from './CourseDetail/components/SessionTable';
import CourseCalendar from './CourseDetail/components/CourseCalendar/CourseCalendar'; // Add the new component

// CSS Imports
import '../styles/CourseDetail.css';
import '../styles/Content.css';

const CourseDetail = ({ onClose }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;
  const groupName = state?.groupName;

  // State for UI interactions
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  // Use custom hooks for data fetching and logic
  const {
    course,
    group,
    teachers,
    students,
    sessions,
    loading
  } = useCourseData(id);

  const {
    calculateStudentAttendance,
    calculateSessionAttendance,
    calculateAverageAttendance
  } = useAttendance(students, sessions);

  const {
    studentColumns,
    sessionColumns
  } = useTableData(
    teachers,
    calculateStudentAttendance,
    calculateSessionAttendance,
    calculateAverageAttendance // Pass this function as well
  );
  const handleClose = () => {
    if (groupName) {
      navigate(`/courses/group/${groupName}`);
    } else {
      navigate('/courses');
    }
  };

  const onDeleteCourse = async (id, courseName, event) => {
    setDeleting(true);
    await handleDeleteCourse(
      id,
      courseName,
      setDeleting,
      null,
      setError,
      event
    );
    setDeleting(false);
    handleClose();
  };

  const openSessionDetail = (session) => {
    setSelectedSession(session);
  };

  const closeSessionDetail = () => {
    setSelectedSession(null);
  };

  const openStudentDetail = (student) => {
    setSelectedStudent(student);
  };

  const closeStudentDetail = () => {
    setSelectedStudent(null);
  };

  if (loading) {
    return (
      <div className="course-detail-loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h3>Loading Course Details</h3>
          <p>Fetching course information, students, and sessions...</p>
          <div className="loading-progress-bar">
            <div className="loading-progress-fill"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="course-detail-error">
        <h3>Error Loading Course</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }
  
  if (!course) {
    return (
      <div className="course-detail-error">
        <h3>Course Not Found</h3>
        <p>The course you're looking for doesn't exist or has been removed.</p>
        <button onClick={handleClose} className="back-button">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="course-detail-page">
      <CourseHeader
        course={course}
        groupName={groupName}
        handleClose={handleClose}
        showOptions={showOptions}
        setShowOptions={setShowOptions}
        onDeleteCourse={onDeleteCourse}
        deleting={deleting}
      />

      {/* Error message if present */}
      {error && (
        <div className="course-detail-error-alert panel-content">
          {error}
        </div>
      )}

      {/* Course Overview Section */}
      <CourseStats
        course={course}
        group={group}
        teachers={teachers}
        students={students}
        sessions={sessions}
        calculateAverageAttendance={calculateAverageAttendance}
      />

      {/* Add a flex container for the tables and calendar */}
      <div className="course-detail-content-row">
        {/* Students Section */}
        <div className="course-detail-column">
          <StudentTable
            students={students}
            studentColumns={studentColumns}
            openStudentDetail={openStudentDetail}
          />
        </div>

        {/* Calendar Section */}
        <div className="course-detail-column">
          <CourseCalendar
            course={course}
            sessions={sessions}
            customTitle={course.name}
            isDetailPage={true} // This IS the detail page
          />        </div>
      </div>

      {/* Sessions Section */}
      <SessionTable
        sessions={sessions}
        sessionColumns={sessionColumns}
        openSessionDetail={openSessionDetail}
      />

      {/* Modal Dialogs */}
      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          students={students}
          teacher={teachers[0]} // Assuming first teacher is the primary one
          onClose={closeSessionDetail}
          groupName={course ? course.group : null}
        />
      )}
      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          sessions={sessions}
          onClose={closeStudentDetail}
        />
      )}
    </div>
  );
};

export default CourseDetail;