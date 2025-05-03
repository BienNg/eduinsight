// src/features/dashboard/ImportContent.jsx
import { useRef, useEffect } from 'react';
import { useImport } from './ImportContext';
import '../styles/Content.css';
import { FOCUS_IMPORT_TAB_EVENT } from './ImportContext';
import ImportDropZone from '../import/components/ImportDropZone';
import GoogleSheetsImport from '../import/components/GoogleSheetsImport';
import ProcessingQueue from '../import/components/ProcessingQueue';
import CompletedFiles from '../import/components/CompletedFiles';
import FailedFiles from '../import/components/FailedFiles';
import ChangelogPanel from '../import/components/ChangelogPanel'; // Add this import
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

  useEffect(() => {
    // Function to handle focusing the import tab
    const handleFocusImportTab = () => {
      if (importTabRef.current) {
        importTabRef.current.scrollIntoView({ behavior: 'smooth' });
        importTabRef.current.focus();
      }
    };

    // Listen for the custom event
    window.addEventListener(FOCUS_IMPORT_TAB_EVENT, handleFocusImportTab);

    // Cleanup
    return () => {
      window.removeEventListener(FOCUS_IMPORT_TAB_EVENT, handleFocusImportTab);
    };
  }, []);

  return (
    <div className="import-content" ref={importTabRef} tabIndex="-1">
      <div className="import-container" style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {/* Left Column - Import Section */}
          <div className="import-card" style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            flex: '1',
            minWidth: '300px'
          }}>
            <h3>Import Excel Files</h3>
            <p>Upload Excel files containing student data, class information, or attendance records.</p>

            <ImportDropZone onFilesAdded={addFilesToQueue} />
            
            {/* Add the Google Sheets import component */}
            <GoogleSheetsImport onSheetSubmitted={addGoogleSheetToQueue} />
            
            <ProcessingQueue queue={processingQueue} />
            <CompletedFiles files={completedFiles} onClear={clearCompletedFiles} />
            <FailedFiles files={failedFiles} onClear={clearFailedFiles} />
          </div>
          
          {/* Right Column - Changelog */}
          <div style={{
            flex: '1',
            minWidth: '300px'
          }}>
            <ChangelogPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportContent;