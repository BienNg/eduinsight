// src/features/courses/CourseDetail.jsx
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
  } = useTableData(teachers, calculateStudentAttendance, calculateSessionAttendance);

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

  if (loading) return <div className="loading">Loading course details...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!course) return <div className="error">Course not found</div>;

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

      {/* Students Section */}
      <StudentTable 
        students={students}
        studentColumns={studentColumns}
        openStudentDetail={openStudentDetail}
      />

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