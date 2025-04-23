// src/components/Dashboard/ImportContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import TimeColumnsModal from './TimeColumnsModal';
import ErrorSummary from './ErrorSummary';

const ImportContext = createContext(null);

export const ImportProvider = ({ children }) => {
  const [files, setFiles] = useState([]);
  const [processingQueue, setProcessingQueue] = useState([]);
  const [completedFiles, setCompletedFiles] = useState([]);
  const [failedFiles, setFailedFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Add new state for modal
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);

  // Process files sequentially when the queue changes
  useEffect(() => {
    const processNextFile = async () => {
      if (processingQueue.length > 0 && !loading) {
        setLoading(true);
        const currentFile = processingQueue[0];

        try {
          // Update the current file's status to "processing"
          setProcessingQueue(prev => [
            { ...prev[0], status: 'processing', progress: 0 },
            ...prev.slice(1)
          ]);

          // Process the file
          await processFile(currentFile.file);

          // Add to completed files
          setCompletedFiles(prev => [...prev, {
            ...currentFile,
            status: 'completed',
            progress: 100
          }]);
        } catch (error) {
          // Add to failed files
          setFailedFiles(prev => [...prev, {
            ...currentFile,
            status: 'failed',
            error: error.message
          }]);
        } finally {
          // Remove from queue
          setProcessingQueue(prev => prev.slice(1));
          setLoading(false);
        }
      }
    };

    processNextFile();
  }, [processingQueue, loading]);

  const updateProgress = (progress) => {
    setProcessingQueue(prev => [
      { ...prev[0], progress },
      ...prev.slice(1)
    ]);
  };

  const addFilesToQueue = (newFiles) => {
    // Filter only Excel files
    const validFileTypes = ['xlsx', 'xls', 'csv'];
    const filteredFiles = newFiles.filter(file => {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      return validFileTypes.includes(fileExtension);
    });

    // Add filtered files to the processing queue
    const filesWithMeta = filteredFiles.map(file => ({
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      status: 'queued',
      progress: 0,
      error: null
    }));

    setProcessingQueue(prev => [...prev, ...filesWithMeta]);

    // Show error for invalid files
    const invalidFiles = newFiles.filter(file => {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      return !validFileTypes.includes(fileExtension);
    });

    if (invalidFiles.length > 0) {
      setFailedFiles(prev => [
        ...prev,
        ...invalidFiles.map(file => ({
          id: Date.now() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          status: 'failed',
          error: 'Invalid file format. Only Excel files (.xlsx, .xls, .csv) are supported.'
        }))
      ]);
    }
  };
  //f
  const clearCompletedFiles = () => {
    setCompletedFiles([]);
  };

  const clearFailedFiles = () => {
    setFailedFiles([]);
  };

  // Process file with improved time column handling
  const processFile = async (file) => {
    return new Promise(async (resolve, reject) => {
      try {
        const reader = new FileReader();
  
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target.result;
  
            // Simulating progress updates during validation
            updateProgress(10);
  
            // Import these functions from your ImportContent file
            const { validateExcelFile, processB1CourseFileWithColors } = await import('./ImportContent');
  
            // Validate the file
            const validationResult = await validateExcelFile(arrayBuffer, file.name);
  
            console.log('Validation result:', validationResult); // Debug log
            updateProgress(30);
  
            // Simplified check for time-only errors using the new flag
            if (validationResult.missingTimeColumns && validationResult.hasOnlyTimeErrors) {
              console.log('Showing time columns modal for file:', file.name); // Debug log
  
              // Make sure we don't already have this file pending
              if (!pendingFile || pendingFile.name !== file.name) {
                // Set pending file and show modal
                setPendingFile({
                  file,
                  arrayBuffer,
                  name: file.name
                });
                setShowTimeModal(true);
              }
              
              // Remove from processing queue as we'll handle it separately
              setProcessingQueue(prev => prev.slice(1));
              setLoading(false);
              resolve();
              return;
            }
  
            // Handle other validation errors
            if (validationResult.errors && validationResult.errors.length > 0) {
              throw new Error(
                `Validation failed: ${validationResult.errors.join(', ')}`
              );
            }
  
            updateProgress(50);
  
            // Process the file with the existing function
            await processB1CourseFileWithColors(arrayBuffer, file.name, {});
  
            updateProgress(90);
  
            resolve();
          } catch (error) {
            console.error('Error in file processing:', error); // Debug log
            reject(error);
          }
        };
  
        reader.onerror = (error) => {
          reject(new Error(`Error reading file: ${error}`));
        };
  
        reader.readAsArrayBuffer(file);
      } catch (error) {
        reject(error);
      }
    });
  };

  // Add handlers for modal actions
  const handleCancelImport = () => {
    if (!pendingFile) return;

    // Store name before clearing state
    const pendingFileName = pendingFile.name;

    // Close modal and reset pending file
    setShowTimeModal(false);
    setPendingFile(null);

    // Add to failed files
    setFailedFiles(prev => [
      ...prev,
      {
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        name: pendingFileName,
        status: 'failed',
        error: 'Import cancelled due to missing time columns.'
      }
    ]);

    // Allow the next file to be processed
    setLoading(false);
  };

  const handleConfirmImport = async () => {
    if (!pendingFile) return;

    // Store the pending file info locally to use after clearing state
    const currentPendingFile = { ...pendingFile };

    // Close modal and reset pending file immediately
    setShowTimeModal(false);
    setPendingFile(null);

    try {
      // Import necessary function
      const { processB1CourseFileWithColors } = await import('./ImportContent');

      // Process the file with missing time columns
      await processB1CourseFileWithColors(
        currentPendingFile.arrayBuffer,
        currentPendingFile.name,
        { ignoreMissingTimeColumns: true }
      );

      // Add to completed files
      setCompletedFiles(prev => [
        ...prev,
        {
          id: Date.now() + Math.random().toString(36).substr(2, 9),
          name: currentPendingFile.name,
          status: 'completed',
          progress: 100
        }
      ]);

      // Allow the next file to be processed by resetting loading
      setLoading(false);

    } catch (error) {
      // Add to failed files
      setFailedFiles(prev => [
        ...prev,
        {
          id: Date.now() + Math.random().toString(36).substr(2, 9),
          name: currentPendingFile.name,
          status: 'failed',
          error: `Error processing file: ${error.message}`
        }
      ]);

      // Allow the next file to be processed
      setLoading(false);
    }
  };

  return (
    <ImportContext.Provider
      value={{
        files,
        processingQueue,
        completedFiles,
        failedFiles,
        loading,
        addFilesToQueue,
        clearCompletedFiles,
        clearFailedFiles
      }}
    >
      {children}
      <TimeColumnsModal
        isOpen={showTimeModal}
        onClose={handleCancelImport}
        onConfirm={handleConfirmImport}
        filename={pendingFile?.name || ''}
      />
    </ImportContext.Provider>
  );
};

export const useImport = () => {
  const context = useContext(ImportContext);
  if (!context) {
    throw new Error('useImport must be used within an ImportProvider');
  }
  return context;
};