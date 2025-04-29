// src/features/courses/CourseRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CourseContent from '../dashboard/CourseContent';
import CourseDetail from '../dashboard/CourseDetail';
import GroupDetail from '../courses/GroupDetail';

const CourseRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<CourseContent />} />
      <Route path="/:id" element={<CourseDetail />} />
      <Route path="/group/:groupName" element={<GroupDetail />} />
      <Route path="*" element={<Navigate to="/courses" replace />} />
    </Routes>
  );
};

export default CourseRoutes;