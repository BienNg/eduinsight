// src/App.js
import './styles/global.css';
import './App.css';

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ToastProvider from './components/ToastProvider';
import Dashboard from './components/Dashboard/Dashboard';
import ImportContent from './components/Dashboard/ImportContent';
import { ImportProvider } from './components/Dashboard/ImportContext';


function App() {
  return (
    <Router>
      <ToastProvider />
      <ImportProvider>
        <div className="app">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/import" element={<ImportContent />} />
            {/* Other routes */}
          </Routes>
        </div>
      </ImportProvider>
    </Router>
  );
}

export default App;