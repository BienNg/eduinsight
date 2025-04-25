// src/features/students/StudentRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SchulerContent from '../dashboard/SchulerContent';
import StudentDetail from './StudentDetail';

const StudentRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<SchulerContent />} />
      <Route path="/:id" element={<StudentDetail />} />
      <Route path="*" element={<Navigate to="/students" replace />} />
    </Routes>
  );
};

export default StudentRoutes;