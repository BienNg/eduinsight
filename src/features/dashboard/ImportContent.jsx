// src/features/dashboard/ImportContent.jsx
import { useRef, useEffect, useState } from 'react';
import { useImport } from './ImportContext';
import '../styles/ImportPage.css';
import { FOCUS_IMPORT_TAB_EVENT } from './ImportContext';
import ModernDropZone from '../import/components/ModernDropZone';
import GoogleSheetsImport from '../import/components/GoogleSheetsImport';
import SmartProcessingQueue from '../import/components/SmartProcessingQueue';
import ActivityFeed from '../import/components/ActivityFeed';
import { validateExcelFile, processB1CourseFileWithColors } from '../import/services/dataProcessing';

// Export these functions for use in the context
export { validateExcelFile, processB1CourseFileWithColors };

const ImportContent = () => {
  const {
    processingQueue,
    completedFiles,
    failedFiles,
    addFilesToQueue,
    addGoogleSheetToQueue,
    clearCompletedFiles,
    clearFailedFiles
  } = useImport();

  const importTabRef = useRef(null);
  const [isStarted, setIsStarted] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);

  // Celebration effect for completed imports
  useEffect(() => {
    if (completedFiles.length > 0) {
      const latestFile = completedFiles[completedFiles.length - 1];
      if (latestFile.isNew) {
        createCelebration();
        // Mark as not new to prevent repeated celebrations
        latestFile.isNew = false;
      }
    }
  }, [completedFiles]);

  const createCelebration = () => {
    const celebration = document.createElement('div');
    celebration.className = 'celebration';
    document.body.appendChild(celebration);

    // Create particles
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'celebration-particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 2 + 's';
      celebration.appendChild(particle);
    }

    // Remove after animation
    setTimeout(() => {
      document.body.removeChild(celebration);
    }, 3000);
  };

  useEffect(() => {
    const handleFocusImportTab = () => {
      if (importTabRef.current) {
        importTabRef.current.scrollIntoView({ behavior: 'smooth' });
        importTabRef.current.focus();
      }
    };

    window.addEventListener(FOCUS_IMPORT_TAB_EVENT, handleFocusImportTab);

    return () => {
      window.removeEventListener(FOCUS_IMPORT_TAB_EVENT, handleFocusImportTab);
    };
  }, []);

  const handleGetStarted = () => {
    setIsStarted(true);
    // Scroll to the main action area
    const mainContent = document.querySelector('.import-content-grid');
    if (mainContent) {
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleFilesAdded = (files) => {
    if (!isStarted) {
      setIsStarted(true);
    }
    addFilesToQueue(files);
  };

  const handleGoogleSheetAdded = (url) => {
    if (!isStarted) {
      setIsStarted(true);
    }
    return addGoogleSheetToQueue(url);
  };

  return (
    <div className="import-page" ref={importTabRef} tabIndex="-1">
      <div className="import-focus-container">
        {/* Hero Section - Emotional Anchoring */}
        <div className="import-hero">
          <h1>Import Your Course Data</h1>
          <p>
            Connect your Google Sheets for real-time updates, or upload Excel files for one-time imports.
            Google Sheets is recommended for ongoing course management.
          </p>
          
          {/* Single Clear Action - Hick's Law */}
          {!isStarted && (
            <button 
              className="import-primary-action"
              onClick={handleGetStarted}
            >
              Start Importing Now
            </button>
          )}
        </div>

        {/* Main Content - Only show after getting started */}
        {isStarted && (
          <div className="import-content-grid">
            {/* Left Column - Activity Feed */}
            <ActivityFeed 
              processingQueue={processingQueue}
              completedFiles={completedFiles}
              failedFiles={failedFiles}
            />

            {/* Center Column - Main Import Area */}
            <div className="import-main-area">
              {/* Primary: Google Sheets Import - Prominent and always visible */}
              <div className="primary-import-section">
                <div className="primary-import-header">
                  <div className="primary-import-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '24px', height: '24px' }}>
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-.4-1.67 2.7 2.7 0 0 0-1.06-1.1 3.2 3.2 0 0 0-1.53-.36 2.69 2.69 0 0 0-1.52.4 2.54 2.54 0 0 0-1 1.1v-1.3H10v7.33h1.94v-4.15a1.4 1.4 0 0 1 .4-.8 1.25 1.25 0 0 1 .94-.34 1.3 1.3 0 0 1 1 .31 1.19 1.19 0 0 1 .33.87v4.11h1.89M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68 1.69 1.69 0 0 0-1.68-1.69 1.7 1.7 0 0 0-1.69 1.69 1.69 1.69 0 0 0 1.69 1.68M6 18.5h1.94v-7.33H6v7.33Z"/>
                    </svg>
                  </div>
                  <div className="primary-import-text">
                    <h3>Google Sheets Import</h3>
                    <p>Recommended • Real-time sync • Automatic updates</p>
                  </div>
                  <div className="primary-import-badge">
                    Preferred
                  </div>
                </div>
                <GoogleSheetsImport onSheetSubmitted={handleGoogleSheetAdded} />
              </div>

              {/* Secondary: File Upload - Minimized and expandable */}
              <div className="secondary-import-section">
                <button 
                  className="secondary-import-toggle"
                  onClick={() => setShowFileUpload(!showFileUpload)}
                >
                  <div className="secondary-import-header">
                    <div className="secondary-import-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                    </div>
                    <div className="secondary-import-text">
                      <span>Upload Excel Files</span>
                      <small>One-time import • Local files</small>
                    </div>
                    <div className="secondary-import-chevron">
                      <svg 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                        style={{ 
                          width: '16px', 
                          height: '16px',
                          transform: showFileUpload ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s ease'
                        }}
                      >
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                  </div>
                </button>
                
                {showFileUpload && (
                  <div className="secondary-import-content">
                    <ModernDropZone onFilesAdded={handleFilesAdded} />
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Processing Queue Status */}
            <SmartProcessingQueue 
              queue={processingQueue}
              completedFiles={completedFiles}
              failedFiles={failedFiles}
              onClearCompleted={clearCompletedFiles}
              onClearFailed={clearFailedFiles}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportContent;