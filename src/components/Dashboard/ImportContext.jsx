// src/components/Dashboard/ImportContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const ImportContext = createContext(null);

export const ImportProvider = ({ children }) => {
  const [files, setFiles] = useState([]);
  const [processingQueue, setProcessingQueue] = useState([]);
  const [completedFiles, setCompletedFiles] = useState([]);
  const [failedFiles, setFailedFiles] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const clearCompletedFiles = () => {
    setCompletedFiles([]);
  };

  const clearFailedFiles = () => {
    setFailedFiles([]);
  };

  // Move the processFile function here, importing any needed functions
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
            const validationErrors = await validateExcelFile(arrayBuffer, file.name);

            updateProgress(30);

            if (validationErrors.length > 0) {
              throw new Error(
                `Validation failed: ${validationErrors.join(', ')}`
              );
            }

            updateProgress(50);

            // Process the file with the existing function
            const courseData = await processB1CourseFileWithColors(arrayBuffer, file.name);

            updateProgress(90);

            resolve();
          } catch (error) {
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