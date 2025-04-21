// src/components/Dashboard/ImportContent.jsx
import { useState, useRef } from 'react';
import * as XLSX from 'xlsx'; // Add this import for the XLSX library
import ExcelJS from 'exceljs';
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
          const arrayBuffer = e.target.result;

          // Process the file if it's a B1.1 course file
          if (file.name.includes('B1.1_ONLINE_VN')) {
            // Process as a course file using ExcelJS for color detection
            const courseData = await processB1CourseFileWithColors(arrayBuffer, file.name);
            await createRecord('courses', courseData);
          }

          setResult({
            success: true,
            message: `File "${file.name}" successfully imported!`
          });
        } catch (error) {
          console.error("Error details:", error);
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
    console.log('Raw data from Excel:', data.slice(0, 15)); // Show first 15 rows for debugging

    // Extract course level properly from filename
    const levelMatch = filename.match(/B[0-9]\.[0-9]/i);
    const level = levelMatch ? levelMatch[0] : 'unknown';

    // Extract group from filename
    const groupMatch = filename.match(/G(\d+)/i);
    const group = groupMatch ? `G${groupMatch[1]}` : '';

    console.log('Extracted level:', level, 'group:', group);

    const courseName = `${group} ${level}`;

    // Student names are in row 4 (index 3) starting from column K (index 10)
    const studentsRowIndex = 3; // Row 4 (0-based index)
    const studentsStartColumn = 10; // Column K (0-based index)

    // Make sure we have enough rows of data
    if (data.length <= studentsRowIndex) {
      throw new Error(`Excel file doesn't have row 4 (index ${studentsRowIndex}) where student names should be`);
    }

    console.log('Looking for students in row 4 (index 3):', data[studentsRowIndex].slice(studentsStartColumn));

    // Extract student names
    const students = [];
    for (let j = studentsStartColumn; j < data[studentsRowIndex].length; j++) {
      const studentName = data[studentsRowIndex][j];
      if (studentName && studentName.trim() !== '') {
        // Skip any column headers that might be in this row
        if (studentName === "Anwesenheitsliste" ||
          studentName === "Nachrichten von/ für NaNu NaNa" ||
          studentName === "Folien" ||
          studentName === "Inhalt") {
          continue;
        }

        students.push({
          id: `student_${j}`,
          name: studentName,
          group: group
        });

        console.log(`Found student in column ${j}: ${studentName}`);
      }
    }

    console.log('Extracted students:', students);

    // Find the row with column headers (Folien, Inhalt, etc.)
    let headerRowIndex = -1;
    for (let i = 0; i < data.length && i < 30; i++) { // Check first 30 rows
      // Looking for the row containing "Folien" as first column
      if (data[i][0] === "Folien") {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      throw new Error("Could not find header row with 'Folien' in the Excel file");
    }

    console.log('Found header row at index:', headerRowIndex);

    // Find sessions data - starts after the header row
    const sessionsStartRow = headerRowIndex + 1;

    // Process sessions
    const sessions = [];
    let currentSession = null;

    for (let i = sessionsStartRow; i < data.length; i++) {
      const row = data[i];

      // Skip empty rows
      if (!row || row.every(cell => !cell || cell.trim() === '')) {
        continue;
      }

      // If we have a value in the Folien column (column 0), this is a new session
      if (row[0] && row[0].trim() !== '') {
        // If we already have a current session, add it to our sessions array
        if (currentSession) {
          sessions.push(currentSession);
        }

        // Start a new session
        currentSession = {
          title: row[0],
          content: row[1] || '',
          notes: row[2] || '',
          checked: row[3] === 'TRUE',
          completed: row[4] === 'TRUE',
          date: row[5] || '',
          startTime: row[6] || '',
          endTime: row[7] || '',
          teacher: row[8] || '',
          message: row[9] || '',
          attendance: {}
        };
      } else if (currentSession && row[1]) {
        // This is a content row for the current session
        currentSession.additionalContent = currentSession.additionalContent || [];
        currentSession.additionalContent.push({
          content: row[1],
          notes: row[2] || '',
          checked: row[3] === 'TRUE'
        });
      }

      // Add attendance data if this is a session row
      if (currentSession && students.length > 0) {
        for (let s = 0; s < students.length; s++) {
          const student = students[s];
          const studentColumn = parseInt(student.id.split('_')[1]); // Get the column index from student id

          if (row[studentColumn]) {
            // Process attendance value
            let attendanceValue = row[studentColumn];

            // Convert common attendance values
            if (attendanceValue === 'TRUE' || attendanceValue.toLowerCase() === 'anwesend') {
              attendanceValue = 'present';
            } else if (attendanceValue === 'FALSE' || attendanceValue.toLowerCase().includes('abwesend')) {
              attendanceValue = 'absent';
            }

            currentSession.attendance[student.id] = attendanceValue;
          }
        }
      }
    }

    // Add the last session if we have one
    if (currentSession) {
      sessions.push(currentSession);
    }

    console.log('Extracted sessions:', sessions);

    return {
      name: courseName,
      level: level,
      group: group,
      students: students,
      sessions: sessions
    };
  };

  // Add these helper functions at the top of your ImportContent.jsx file or in a separate utils file
  const excelDateToJSDate = (excelDate) => {
    // Excel dates are number of days since 1900-01-01
    // Excel has a leap year bug where it thinks 1900 was a leap year, so we need to adjust for dates after Feb 28, 1900
    if (!excelDate) return '';

    const date = new Date((excelDate - 1) * 24 * 60 * 60 * 1000 + new Date(1900, 0, 1).getTime());
    return date;
  };

  const formatDate = (jsDate) => {
    if (!jsDate || !(jsDate instanceof Date) || isNaN(jsDate)) return '';

    const day = jsDate.getDate().toString().padStart(2, '0');
    const month = (jsDate.getMonth() + 1).toString().padStart(2, '0');
    const year = jsDate.getFullYear();

    return `${day}.${month}.${year}`;
  };

  const formatTime = (jsDate) => {
    if (!jsDate || !(jsDate instanceof Date) || isNaN(jsDate)) return '';

    const hours = jsDate.getHours().toString().padStart(2, '0');
    const minutes = jsDate.getMinutes().toString().padStart(2, '0');

    return `${hours}:${minutes}`;
  };

  // Function to convert Excel time (decimal fraction of day) to formatted time
  const excelTimeToFormatted = (excelTime) => {
    if (excelTime === undefined || excelTime === null || excelTime === '') return '';

    // Convert decimal time to hours and minutes
    const totalMinutes = Math.round(excelTime * 24 * 60);
    const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
    const minutes = (totalMinutes % 60).toString().padStart(2, '0');

    return `${hours}:${minutes}`;
  };

  // New function to process Excel file with color detection
  // New function to process Excel file with color detection
  const processB1CourseFileWithColors = async (arrayBuffer, filename) => {
    console.log('Starting Excel file processing with color detection...');

    // Extract course level and group from filename
    const levelMatch = filename.match(/B[0-9]\.[0-9]/i);
    const level = levelMatch ? levelMatch[0] : 'unknown';

    const groupMatch = filename.match(/G(\d+)/i);
    const group = groupMatch ? `G${groupMatch[1]}` : '';

    const courseName = `${group} ${level}`;

    // Use XLSX for basic structure extraction
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Use ExcelJS for color information
    const excelWorkbook = new ExcelJS.Workbook();
    await excelWorkbook.xlsx.load(arrayBuffer);
    const excelWorksheet = excelWorkbook.worksheets[0];

    // Log the first few rows to debug
    console.log('First 10 rows:', jsonData.slice(0, 10));

    // Find the header row with "Folien" as the first column
    let headerRowIndex = -1;
    for (let i = 0; i < jsonData.length; i++) {
      if (jsonData[i][0] === "Folien") {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      console.error("Could not find header row with 'Folien'");
      // Just use row 4 (index 3) as fallback
      headerRowIndex = 3;
    }

    console.log('Using header row index:', headerRowIndex);

    // Extract student names from the header row
    const students = [];
    const headerRow = jsonData[headerRowIndex];

    // Students typically start from column K (index 10)
    for (let j = 10; j < headerRow.length; j++) {
      const studentName = headerRow[j];
      if (studentName && typeof studentName === 'string' && studentName.trim() !== '') {
        // Skip any column headers
        if (studentName === "Anwesenheitsliste" ||
          studentName === "Nachrichten von/ für NaNu NaNa") {
          continue;
        }

        students.push({
          id: `student_${j}`,
          name: studentName,
          group: group
        });
      }
    }

    console.log(`Found ${students.length} students`);

    // Process sessions - start from the row after the header
    const sessions = [];
    let currentSessionTitle = null;
    let currentSession = null;

    for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
      const row = jsonData[i];

      // Skip empty rows
      if (!row || row.length === 0 || (row.length === 1 && !row[0])) {
        continue;
      }

      const folienTitle = row[0]; // Column A - Folien
      const contentValue = row[1]; // Column B - Inhalt

      // If we have a value in column A (Folien), this could be a new session
      if (folienTitle && folienTitle.toString().trim() !== '') {
        // If it's a new session title or different from current one, start a new session
        if (folienTitle !== currentSessionTitle) {
          // Save previous session if we have one
          if (currentSession) {
            console.log(`Pushing existing session: ${currentSession.title} on ${currentSession.date}`);
            sessions.push({ ...currentSession }); // Create a copy to avoid reference issues
          }

          // Extract date, time and teacher info
          const dateValue = row[5]; // Column F - Date
          const startTimeValue = row[6]; // Column G - Start time
          const endTimeValue = row[7]; // Column H - End time
          const teacherValue = row[8] || ''; // Column I - Teacher

          // Process date - Check if it's an Excel numeric date
          let formattedDate = '';
          if (dateValue) {
            // If it's already formatted as string like "18.02.2025", use it directly
            if (typeof dateValue === 'string' && dateValue.includes('.')) {
              formattedDate = dateValue;
            } else {
              // Otherwise, treat it as Excel numeric date
              try {
                const jsDate = excelDateToJSDate(dateValue);
                formattedDate = formatDate(jsDate);
              } catch (e) {
                console.warn('Error formatting date:', e);
                formattedDate = String(dateValue); // Fallback to original value
              }
            }
          }

          // Process times - Check if they're Excel decimal times
          let formattedStartTime = '';
          if (startTimeValue) {
            if (typeof startTimeValue === 'string' && startTimeValue.includes(':')) {
              formattedStartTime = startTimeValue;
            } else {
              // Treat as Excel time
              formattedStartTime = excelTimeToFormatted(startTimeValue);
            }
          }

          let formattedEndTime = '';
          if (endTimeValue) {
            if (typeof endTimeValue === 'string' && endTimeValue.includes(':')) {
              formattedEndTime = endTimeValue;
            } else {
              // Treat as Excel time
              formattedEndTime = excelTimeToFormatted(endTimeValue);
            }
          }

          // Create new session with properly formatted date and times
          currentSessionTitle = folienTitle;
          currentSession = {
            title: folienTitle,
            content: contentValue || '',
            notes: row[2] || '', // Column C - Notizen
            checked: row[3] === 'TRUE', // Column D - die Folien gecheckt
            completed: row[4] === 'TRUE', // Column E - gemacht
            date: formattedDate,
            startTime: formattedStartTime,
            endTime: formattedEndTime,
            teacher: teacherValue,
            message: row[9] || '', // Column J - Nachrichten
            contentItems: [],
            attendance: {}
          };

          console.log(`Created new session: ${folienTitle} on ${formattedDate} (total sessions: ${sessions.length})`);
        }
        // If it's the same title but a new row with content, we might need to update the current session
        else if (contentValue && contentValue.trim() !== '') {
          // Update current session with new content
          if (!currentSession.contentItems) {
            currentSession.contentItems = [];
          }
          currentSession.contentItems.push({
            content: contentValue,
            notes: row[2] || '',
            checked: row[3] === 'TRUE'
          });
        }
      } else if (currentSession && contentValue) {
        // This is additional content for the current session
        currentSession.contentItems.push({
          content: contentValue,
          notes: row[2] || '',
          checked: row[3] === 'TRUE'
        });
      }

      // Process attendance for this row if we have a current session
      if (currentSession && students.length > 0) {
        // Get the Excel row for color information
        const excelRow = excelWorksheet.getRow(i + 1); // +1 because ExcelJS is 1-based

        for (const student of students) {
          const columnIndex = parseInt(student.id.split('_')[1]);
          const cellValue = row[columnIndex];

          if (cellValue !== undefined && cellValue !== null) {
            let attendanceValue = 'unknown';

            // Try to get color information from ExcelJS
            const excelCell = excelRow.getCell(columnIndex + 1); // +1 because ExcelJS is 1-based

            if (excelCell.fill && excelCell.fill.type === 'pattern' && excelCell.fill.fgColor) {
              const color = excelCell.fill.fgColor.argb || '';

              // Green colors (present)
              if (color && (
                color.includes('FF00FF00') || // Pure green
                color.includes('FF92D050') || // Light green
                color.includes('FF00B050') || // Medium green
                color.includes('FF00B0') ||   // Another green variant
                color.includes('FF00B640'))) { // Another green variant
                attendanceValue = 'present';
              }
              // Red/Pink colors (absent)
              else if (color && (
                color.includes('FFFF0000') || // Pure red
                color.includes('FFFF00FF') || // Pure magenta/pink
                color.includes('FFFF66CC') || // Light pink
                color.includes('FFFF99CC'))) { // Very light pink
                attendanceValue = 'absent';
              }
            }

            // If we couldn't determine from color, try text values
            if (attendanceValue === 'unknown' && cellValue) {
              const cellText = cellValue.toString().toLowerCase();
              if (cellText === 'true' || cellText === 'anwesend' || cellText === 'present') {
                attendanceValue = 'present';
              } else if (cellText === 'false' || cellText === 'abwesend' || cellText === 'absent') {
                attendanceValue = 'absent';
              } else if (cellText.includes('krank') || cellText.includes('sick')) {
                attendanceValue = 'sick';
              } else if (cellText.includes('kamera aus') || cellText.includes('mic aus')) {
                attendanceValue = 'technical_issues';
              }
            }

            // Record attendance - use the first value we find for each student
            if (attendanceValue !== 'unknown' && !currentSession.attendance[student.id]) {
              currentSession.attendance[student.id] = attendanceValue;
            }
          }
        }
      }
    }

    // Add the last session if we have one
    if (currentSession) {
      console.log(`Pushing final session: ${currentSession.title} on ${currentSession.date}`);
      sessions.push({ ...currentSession }); // Create a copy to avoid reference issues
    }

    console.log('Returning course data with', sessions.length, 'sessions');
    sessions.forEach((session, index) => {
      console.log(`Session ${index + 1}: ${session.title} on ${session.date}`);
    });

    return {
      name: courseName,
      level: level,
      group: group,
      students: students,
      sessions: sessions
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