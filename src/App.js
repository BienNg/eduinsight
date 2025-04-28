// src/App.js
import './features/styles/global.css';
import './App.css';
import './styles/theme/variables.css';
import '@fontsource/montserrat/300.css';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';

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