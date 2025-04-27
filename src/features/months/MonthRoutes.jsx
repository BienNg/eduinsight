// src/features/months/MonthRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MonatContent from '../months/MonatContent';


const MonthRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MonatContent />} />
      <Route path="/:id" element={<MonatContent />} /> {/* For specific month view */}
      <Route path="*" element={<Navigate to="/months" replace />} />
    </Routes>
  );
};

export default MonthRoutes;