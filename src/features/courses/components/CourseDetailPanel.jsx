import React from 'react';

const CourseDetailPanel = ({ course, students, sessions, loading }) => {
  console.log('CourseDetailPanel props:', { course, students, sessions, loading });

  if (loading) {
    return (
      <div className="course-detail-panel">
        <h2>Loading course details...</h2>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-detail-panel">
        <h2>Select a course to view details</h2>
      </div>
    );
  }

  return (
    <div className="course-detail-panel">
      <h2>{course.name || 'Course Details'}</h2>
      <div className="course-info">
        <p>ID: {course.id}</p>
        <p>Level: {course.level}</p>
        <p>Students: {students?.length || 0}</p>
        <p>Sessions: {sessions?.length || 0}</p>
      </div>
    </div>
  );
};

export default CourseDetailPanel;