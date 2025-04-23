// In ImportContext.jsx - Updated toast implementation
import { createContext, useContext, useState, useEffect } from 'react';
import TimeColumnsModal from './TimeColumnsModal';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';


// Create a custom event for focusing the import tab
export const FOCUS_IMPORT_TAB_EVENT = 'focusImportTab';

const ImportContext = createContext(null);

export const ImportProvider = ({ children }) => {
  const [files, setFiles] = useState([]);
  const [processingQueue, setProcessingQueue] = useState([]);
  const [completedFiles, setCompletedFiles] = useState([]);
  const [failedFiles, setFailedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Add new state for modal
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);



  // Helper function for navigating to import tab
  const navigateToImport = () => {
    // If we're already on the import page, dispatch a custom event to focus the tab
    if (location.pathname === '/import') {
      window.dispatchEvent(new CustomEvent(FOCUS_IMPORT_TAB_EVENT));
    } else {
      // Otherwise navigate to the import page
      navigate('/import');

      // After navigation, dispatch the event after a small delay to ensure components are mounted
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent(FOCUS_IMPORT_TAB_EVENT));
      }, 100);
    }
  };

  // Process files sequentially when the queue changes
  useEffect(() => {
    const processNextFile = async () => {
      if (processingQueue.length > 0 && !loading) {
        setLoading(true);
        const currentFile = processingQueue[0];

        // Create a toast ID for this file
        const toastId = `import-${currentFile.id}`;

        // Show processing toast - entire toast clickable
        toast.loading(`Processing ${currentFile.name}...`, {
          id: toastId,
          duration: Infinity, // stays until dismissed or updated
          onClick: navigateToImport
        });

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
          // Update toast to success - entire toast clickable
          toast.success(`Successfully imported ${currentFile.name}`, {
            id: toastId,
            duration: 5000,
            onClick: () => navigateToImport()
          });
        } catch (error) {
          // Add to failed files
          setFailedFiles(prev => [...prev, {
            ...currentFile,
            status: 'failed',
            error: error.message
          }]);

          // Update toast to error - entire toast clickable
          toast.error(`Failed to import ${currentFile.name}`, {
            id: toastId,
            duration: 5000,
            description: error.message.substring(0, 100) + (error.message.length > 100 ? '...' : ''),
            onClick: navigateToImport
          });
        } finally {
          // Remove from queue
          setProcessingQueue(prev => prev.slice(1));
          setLoading(false);
        }
      }
    };

    processNextFile();
  }, [processingQueue, loading, navigate]);

  const updateProgress = (progress) => {
    if (processingQueue.length > 0) {
      const currentFile = processingQueue[0];
      const toastId = `import-${currentFile.id}`;

      // Update toast description with progress if needed
      if (progress % 20 === 0) { // Update less frequently to avoid performance issues
        toast.loading(`Processing ${currentFile.name}... ${progress}%`, {
          id: toastId,
          duration: Infinity,
          onClick: navigateToImport
        });
      }

      setProcessingQueue(prev => [
        { ...prev[0], progress },
        ...prev.slice(1)
      ]);
    }
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

    // Show toast notification for queued files - entire toast clickable
    if (filteredFiles.length > 0) {
      toast.info(`${filteredFiles.length} file(s) added to queue`, {
        description: filteredFiles.map(f => f.name).join(', ').substring(0, 60) +
          (filteredFiles.map(f => f.name).join(', ').length > 60 ? '...' : ''),
        onClick: navigateToImport
      });
    }

    setProcessingQueue(prev => [...prev, ...filesWithMeta]);

    // Show error for invalid files
    const invalidFiles = newFiles.filter(file => {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      return !validFileTypes.includes(fileExtension);
    });

    if (invalidFiles.length > 0) {
      const toastId = `invalid-files-${Date.now()}`;
      toast.error(`${invalidFiles.length} unsupported file(s)`, {
        id: toastId,
        description: 'Only Excel files (.xlsx, .xls, .csv) are supported.',
        onClick: navigateToImport
      });

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
    const toastId = `import-pending-${Date.now()}`;

    // Close modal and reset pending file
    setShowTimeModal(false);
    setPendingFile(null);

    // Show toast for cancelled import - entire toast clickable
    toast.error(`Import cancelled for ${pendingFileName}`, {
      id: toastId,
      duration: 5000,
      onClick: navigateToImport
    });

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