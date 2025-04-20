// src/components/Dashboard/ImportContent.jsx
import { useState, useRef } from 'react';
import * as XLSX from 'xlsx'; // Add this import for the XLSX library
import { createRecord } from '../../firebase/database'; // Add this import for Firebase functions
import './Content.css';

const ImportContent = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const fileExtension = droppedFile.name.split('.').pop().toLowerCase();
      
      if (['xlsx', 'xls', 'csv'].includes(fileExtension)) {
        setFile(droppedFile);
        setResult(null);
      } else {
        setResult({
          success: false,
          message: 'Please upload only Excel or CSV files (.xlsx, .xls, .csv)'
        });
      }
    }
  };

  const handleImport = async () => {
    if (!file) return;
    
    setLoading(true);
    try {
      // Read the Excel file
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            raw: false,
            defval: ""
          });
          
          // Process and save the data
          if (file.name.includes('B1.1_ONLINE_VN')) {
            // Process as a course file
            const courseData = processB1CourseFile(jsonData, file.name);
            await createRecord('courses', courseData);
          }
          
          setResult({
            success: true,
            message: `File "${file.name}" successfully imported!`
          });
        } catch (error) {
          setResult({
            success: false,
            message: `Error processing file: ${error.message}`
          });
        } finally {
          setLoading(false);
        }
      };
      
      reader.onerror = (error) => {
        setResult({
          success: false,
          message: `Error reading file: ${error}`
        });
        setLoading(false);
      };
      
      reader.readAsArrayBuffer(file);
    } catch (error) {
      setResult({
        success: false,
        message: `Error importing file: ${error.message}`
      });
      setLoading(false);
    }
  };

  // Function to process B1.1 course file
  const processB1CourseFile = (data, filename) => {
    // Extract course name from filename
    const courseName = filename.replace(/\.(csv|xlsx)$/, '');
    
    // Find header row and student names
    let studentsStartColumn = 10; // Default value based on your Excel structure
    let studentsRowIndex = 1;
    
    const sessions = [];
    const students = [];
    
    // Process sessions (rows starting from index 5)
    for (let i = 5; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows
      if (!row[0] && !row[1]) continue;
      
      if (row[0] || row[1]) {
        // This is a session row
        const sessionData = {
          title: row[0] || row[1],
          notes: row[2] || '',
          checked: row[3] === 'TRUE',
          completed: row[4] === 'TRUE',
          date: row[5] || '',
          startTime: row[6] || '',
          endTime: row[7] || '',
          teacher: row[8] || '',
          attendance: {}
        };
        
        // Add attendance data
        for (let j = 0; j < students.length; j++) {
          const studentColumn = studentsStartColumn + j;
          if (row[studentColumn]) {
            sessionData.attendance[students[j].id] = row[studentColumn];
          }
        }
        
        sessions.push(sessionData);
      }
    }
    
    // Extract students from the header row
    for (let j = studentsStartColumn; j < data[studentsRowIndex].length; j++) {
      const studentName = data[studentsRowIndex][j];
      if (studentName) {
        students.push({
          id: `student_${j}`, // Temporary ID
          name: studentName,
          group: extractGroupFromFilename(filename),
        });
      }
    }
    
    return {
      name: courseName,
      level: extractLevelFromFilename(filename),
      group: extractGroupFromFilename(filename),
      students,
      sessions
    };
  };

  // Helper function to extract level from filename
  const extractLevelFromFilename = (filename) => {
    const levelMatch = filename.match(/([A-Z][0-9](\.[0-9])?)/i);
    return levelMatch ? levelMatch[1] : 'unknown';
  };

  // Helper function to extract group from filename
  const extractGroupFromFilename = (filename) => {
    const groupMatch = filename.match(/G(\d+)/i);
    return groupMatch ? `G${groupMatch[1]}` : '';
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="import-content">
      <h2>Excel Import</h2>
      <div className="import-container" style={{ marginTop: '24px' }}>
        <div className="import-card" style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          padding: '20px', 
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' 
        }}>
          <h3>Import Excel File</h3>
          <p>Upload an Excel file containing student data, class information, or attendance records.</p>
          
          <div 
            className="drag-drop-area"
            style={{
              border: `2px dashed ${dragActive ? '#1e88e5' : '#ccc'}`,
              borderRadius: '4px',
              padding: '40px 20px',
              textAlign: 'center',
              marginTop: '20px',
              backgroundColor: dragActive ? 'rgba(30, 136, 229, 0.05)' : '#f9f9f9',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onClick={triggerFileInput}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              accept=".xlsx, .xls, .csv" 
              onChange={handleFileChange} 
              style={{ display: 'none' }}
            />
            
            <div style={{ marginBottom: '10px' }}>
              <svg 
                width="50" 
                height="50" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke={dragActive ? '#1e88e5' : '#666'}
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            
            {file ? (
              <p><strong>{file.name}</strong></p>
            ) : (
              <>
                <p><strong>Drag and drop</strong> your Excel file here</p>
                <p>or click to browse files</p>
              </>
            )}
          </div>
          
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button 
              onClick={handleImport} 
              disabled={!file || loading}
              style={{
                backgroundColor: '#1e88e5',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: file && !loading ? 'pointer' : 'not-allowed',
                opacity: file && !loading ? 1 : 0.7,
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Importing...' : 'Import File'}
            </button>
          </div>
          
          {result && (
            <div style={{ 
              marginTop: '20px', 
              padding: '12px', 
              backgroundColor: result.success ? '#e8f5e9' : '#ffebee',
              borderRadius: '4px',
              color: result.success ? '#2e7d32' : '#c62828'
            }}>
              {result.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportContent;