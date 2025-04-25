// src/features/courses/CourseRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import KlassenContent from '../dashboard/KlassenContent';
import CourseDetail from '../dashboard/CourseDetail';

const CourseRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<KlassenContent />} />
      <Route path="/:id" element={<CourseDetail />} />
      <Route path="/group/:groupName" element={<KlassenContent />} />
      <Route path="*" element={<Navigate to="/courses" replace />} />
    </Routes>
  );
};

export default CourseRoutes;