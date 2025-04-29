// src/features/courses/CourseRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CourseContent from './CourseContent';
import CourseDetail from '../dashboard/CourseDetail';

const CourseRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<CourseContent />} />
      <Route path="/group/:groupName" element={<CourseContent />} />
      <Route path="/group/:groupName/course/:courseId" element={<CourseContent />} />
      <Route path="/:id" element={<CourseDetail />} /> {/* Keep for backward compatibility */}
      <Route path="*" element={<Navigate to="/courses" replace />} />
    </Routes>
  );
};

export default CourseRoutes;