// src/features/teachers/TeacherRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LehrerContent from '../dashboard/LehrerContent';
import TeacherDetail from './TeacherDetail';

const TeacherRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LehrerContent />} />
      <Route path="/:id" element={<TeacherDetail />} />
      <Route path="*" element={<Navigate to="/teachers" replace />} />
    </Routes>
  );
};

export default TeacherRoutes;