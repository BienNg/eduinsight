// src/App.js
import './features/styles/global.css';
import './App.css';

import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import ToastProvider from './features/dashboard/ToastProvider';
import DashboardLayout from './features/dashboard/DashboardLayout';
import { ImportProvider } from './features/dashboard/ImportContext';

function App() {
  return (
    <Router>
      <ImportProvider>
        <ToastProvider />
        <DashboardLayout />
      </ImportProvider>
    </Router>
  );
}

export default App;