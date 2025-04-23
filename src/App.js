// src/App.js
import './styles/global.css';
import './App.css';

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ToastProvider from './components/ToastProvider';
import Dashboard from './components/Dashboard/Dashboard';
import ImportContent from './components/Dashboard/ImportContent';
import { ImportProvider } from './components/Dashboard/ImportContext';

// Create a layout component that wraps both Dashboard and ImportContent
const DashboardLayout = () => {
  return (
    <ImportProvider>
      <div className="app">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/import" element={<ImportContent />} />
          {/* Other routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </ImportProvider>
  );
};

function App() {
  return (
    <Router>
      <ToastProvider />
      <Routes>
        <Route path="/*" element={<DashboardLayout />} />
      </Routes>
    </Router>
  );
}

export default App;