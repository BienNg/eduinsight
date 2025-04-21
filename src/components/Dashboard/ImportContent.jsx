// src/components/Dashboard/ImportContent.jsx
import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { createRecord, updateRecord, getAllRecords, getRecordById } from '../../firebase/database';
import { ref, push, set, get, update, remove, query, orderByChild, equalTo } from "firebase/database";
import { database } from "../../firebase/config";
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
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target.result;

          // Validate the file before processing
          const validationErrors = await validateExcelFile(arrayBuffer, file.name);

          if (validationErrors.length > 0) {
            // Show validation errors
            setResult({
              success: false,
              message: "Excel file validation failed. Please fix the following issues:",
              errors: validationErrors
            });
            setLoading(false);
            return;
          }

          // If validation passes, process the file with new structure
          if (file.name.includes('B1.1_ONLINE_VN')) {
            // Process the course file using our new function
            const courseData = await processB1CourseFileWithColors(arrayBuffer, file.name);

            setResult({
              success: true,
              message: `File "${file.name}" successfully imported into new database structure!`,
              details: `Created course ${courseData.name} with ${courseData.sessionIds.length} sessions`
            });
          } else {
            setResult({
              success: false,
              message: "Unsupported file format. Please use a compatible course template."
            });
          }
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

  // Function to create a teacher record
  const createTeacherRecord = async (teacherName) => {
    try {
      // Check if teacher already exists
      const teachers = await getAllRecords('teachers');
      const existingTeacher = teachers.find(t => t.name === teacherName);

      if (existingTeacher) {
        return existingTeacher;
      }

      // Create new teacher
      return await createRecord('teachers', {
        name: teacherName,
        email: '', // Default empty, can be updated later
        courseIds: [] // Will be updated when courses are created
      });
    } catch (error) {
      console.error("Error creating teacher record:", error);
      throw error;
    }
  };

  // Function to create a student record
  const createStudentRecord = async (studentName, studentInfo = '') => {
    try {
      // Check if student already exists
      const students = await getAllRecords('students');
      const existingStudent = students.find(s => s.name === studentName);

      if (existingStudent) {
        return existingStudent;
      }

      // Create new student
      return await createRecord('students', {
        name: studentName,
        info: studentInfo,
        courseIds: [], // Will be updated when courses are created
        notes: ''
      });
    } catch (error) {
      console.error("Error creating student record:", error);
      throw error;
    }
  };

  // Function to create a month record if it doesn't exist
  // Update the getOrCreateMonthRecord function in ImportContent.jsx
  const getOrCreateMonthRecord = async (date) => {
    try {
      if (!date) return null;

      // Extract year and month from date string (format: DD.MM.YYYY)
      const parts = date.split('.');
      if (parts.length !== 3) return null;

      const year = parts[2];
      const month = parts[1];
      const monthId = `${year}-${month}`;

      // Check if month record exists
      const monthRecord = await getRecordById('months', monthId);

      if (monthRecord) {
        console.log(`Found existing month record: ${monthId}`);
        return monthRecord;
      }

      // Create new month record
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];

      const monthName = `${monthNames[parseInt(month) - 1]} ${year}`;

      console.log(`Creating new month record: ${monthId} (${monthName})`);

      const newMonth = {
        id: monthId,
        name: monthName,
        year: year,
        month: month, // Store the month number for easier sorting
        sessionCount: 0,
        courseIds: [],
        teacherIds: [],
        statistics: {
          attendanceRate: 0,
          sessionCount: 0
        }
      };

      // Instead of createRecord which generates a random ID, use set with the custom ID
      await set(ref(database, `months/${monthId}`), newMonth);
      return newMonth;
    } catch (error) {
      console.error("Error creating month record:", error);
      throw error;
    }
  };

  const validateExcelFile = async (arrayBuffer, filename) => {
    const errors = [];

    try {
      // Use both XLSX for structure and ExcelJS for colors/formatting
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Use ExcelJS for additional formatting info
      const excelWorkbook = new ExcelJS.Workbook();
      await excelWorkbook.xlsx.load(arrayBuffer);
      const excelWorksheet = excelWorkbook.worksheets[0];

      // 1. Validate file structure - find header row with "Folien"
      let headerRowIndex = -1;
      for (let i = 0; i < jsonData.length && i < 30; i++) {
        if (jsonData[i][0] === "Folien") {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex === -1) {
        errors.push("Could not find header row with 'Folien' column. The Excel file structure appears to be invalid.");
        // If we can't find the header row, many other validations will fail, so return early
        return errors;
      }

      // 2. Validate required columns exist in header row
      const headerRow = jsonData[headerRowIndex];
      const requiredColumns = ["Folien", "Inhalt", "Notizen", "die Folien gecheckt", "gemacht", "Unterrichtstag", "von", "bis", "Lehrer"];

      for (let i = 0; i < requiredColumns.length; i++) {
        if (headerRow[i] !== requiredColumns[i]) {
          errors.push(`Required column '${requiredColumns[i]}' not found at expected position ${i + 1}. Found '${headerRow[i] || "empty"}' instead.`);
        }
      }

      // 3. Check for student names in header row (typically starting from column K/index 10)
      let studentCount = 0;
      for (let j = 10; j < headerRow.length; j++) {
        if (headerRow[j] &&
          headerRow[j] !== "Anwesenheitsliste" &&
          headerRow[j] !== "Nachrichten von/ für NaNu NaNa") {
          studentCount++;
        }
      }

      if (studentCount === 0) {
        errors.push("No student names found in the header row (columns K and beyond).");
      }

      // 4. Validate session data - check for empty cells in Folien column where needed
      // Start from row after header
      const sessionsStartRow = headerRowIndex + 1;
      let currentSessionTitle = null;
      let sessionCount = 0;

      for (let i = sessionsStartRow; i < jsonData.length; i++) {
        const row = jsonData[i];

        // Skip completely empty rows
        if (!row || row.length === 0 || (row.length === 1 && !row[0])) {
          continue;
        }

        const folienValue = row[0]; // Column A - Folien
        const contentValue = row[1]; // Column B - Inhalt

        // Check if this is a content row that should be part of a session but has no parent session
        if (!folienValue && contentValue && currentSessionTitle === null) {
          errors.push(`Row ${i + 1}: Content "${contentValue}" has no associated session (missing value in Folien column).`);
        }

        // If there's a value in Folien column, this should be a new session
        if (folienValue && folienValue.toString().trim() !== '') {
          currentSessionTitle = folienValue;
          sessionCount++;

          // 5. Validate date format in column F (index 5)
          const dateValue = row[5];
          if (!dateValue) {
            errors.push(`Row ${i + 1}: Session "${folienValue}" is missing a date in column F.`);
          } else if (typeof dateValue === 'string' && !dateValue.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
            errors.push(`Row ${i + 1}: Session "${folienValue}" has an invalid date format "${dateValue}". Expected format: DD.MM.YYYY`);
          }

          // 6. Validate time format in columns G and H (indices 6 and 7)
          const startTimeValue = row[6];
          const endTimeValue = row[7];

          if (!startTimeValue) {
            errors.push(`Row ${i + 1}: Session "${folienValue}" is missing a start time in column G.`);
          }

          if (!endTimeValue) {
            errors.push(`Row ${i + 1}: Session "${folienValue}" is missing an end time in column H.`);
          }

          // 7. Validate teacher information
          const teacherValue = row[8];
          if (!teacherValue) {
            errors.push(`Row ${i + 1}: Session "${folienValue}" is missing teacher information in column I.`);
          }
        }
      }

      if (sessionCount === 0) {
        errors.push("No sessions found in the Excel file. The Folien column should contain session titles.");
      }

      return errors;

    } catch (error) {
      errors.push(`Error processing Excel file: ${error.message}`);
      return errors;
    }
  };

  // Helper functions
  const excelDateToJSDate = (excelDate) => {
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

  const formatTime = (value) => {
    if (!value) return '';

    // If it's already a string in HH:MM format
    if (typeof value === 'string' && value.includes(':')) {
      return value;
    }

    // If it's a JS Date object
    if (value instanceof Date) {
      const hours = value.getHours().toString().padStart(2, '0');
      const minutes = value.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }

    // If it's an Excel time (decimal fraction of day)
    if (typeof value === 'number') {
      const totalMinutes = Math.round(value * 24 * 60);
      const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
      const minutes = (totalMinutes % 60).toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }

    return '';
  };

  // Color detection helpers
  const isGreenColor = (argb) => {
    // Common green color codes in Excel
    const greenCodes = [
      'FF00FF00', // Pure green
      'FF92D050', // Light green
      'FF00B050', // Medium green
      'FF00B640', // Another green variant
      'FFD9EAD3', // Light green (from your spreadsheet)
      'FF9BBB59', // Olive green
      'FF00B800', // Bright green
      'FF70AD47'  // Dark green
    ];

    return greenCodes.some(code => argb.includes(code));
  };

  const isRedColor = (argb) => {
    // Common red/pink color codes in Excel
    const redCodes = [
      'FFFF0000', // Pure red
      'FFFF00FF', // Pure magenta/pink
      'FFFF66CC', // Light pink
      'FFFF99CC', // Very light pink
      'FFF4B084', // Light red/orange
      'FFFF9999', // Light red
      'FFFF8080', // Light red
      'FFFFCCCC'  // Very light red
    ];

    return redCodes.some(code => argb.includes(code));
  };

  // New function to process Excel file with the new database structure
  const processB1CourseFileWithColors = async (arrayBuffer, filename) => {
    console.log('Starting Excel file processing with new database structure...');

    // Use XLSX and ExcelJS to parse the file
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const excelWorkbook = new ExcelJS.Workbook();
    await excelWorkbook.xlsx.load(arrayBuffer);
    const excelWorksheet = excelWorkbook.worksheets[0];

    // Extract course level and group from filename
    const levelMatch = filename.match(/B[0-9]\.[0-9]/i);
    const level = levelMatch ? levelMatch[0] : 'unknown';

    const groupMatch = filename.match(/G(\d+)/i);
    const group = groupMatch ? `G${groupMatch[1]}` : '';

    const courseName = `${group} ${level}`;

    // Find the header row with "Folien"
    let headerRowIndex = -1;
    for (let i = 0; i < jsonData.length; i++) {
      if (jsonData[i][0] === "Folien") {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      console.error("Could not find header row with 'Folien'");
      headerRowIndex = 3; // Fallback
    }

    // Extract student information
    const students = [];
    const headerRow = jsonData[headerRowIndex];

    // Students typically start from column K (index 10)
    for (let j = 10; j < headerRow.length; j++) {
      const studentName = headerRow[j];
      if (studentName && typeof studentName === 'string' && studentName.trim() !== '') {
        // Skip column headers
        if (studentName === "Anwesenheitsliste" ||
          studentName === "Nachrichten von/ für NaNu NaNa") {
          continue;
        }

        // Create student record in Firebase
        const studentRecord = await createStudentRecord(studentName);
        students.push({
          id: studentRecord.id,
          name: studentRecord.name,
          columnIndex: j
        });
      }
    }

    console.log(`Created ${students.length} student records`);

    // Create the course record
    const courseRecord = await createRecord('courses', {
      name: courseName,
      level: level,
      group: group,
      startDate: '', // Will be updated with the first session date
      endDate: '', // Will be updated with the last session date
      sessionIds: [],
      studentIds: students.map(s => s.id),
      teacherId: '' // Will be updated when we process sessions
    });

    console.log(`Created course record: ${courseRecord.id}`);

    // Update student records with this course
    for (const student of students) {
      await updateRecord('students', student.id, {
        courseIds: [courseRecord.id]
      });
    }

    // Process sessions - start from the row after the header
    const sessions = [];
    let currentSessionTitle = null;
    let currentSession = null;
    let teacherIds = new Set();
    let monthIds = new Set();
    let firstSessionDate = null;
    let lastSessionDate = null;

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
            console.log(`Creating session record: ${currentSession.title}`);
            const sessionRecord = await createRecord('sessions', currentSession);

            // Add to course's sessionIds
            courseRecord.sessionIds.push(sessionRecord.id);

            // After creating a session record, update the month's statistics
            if (currentSession.monthId) {
              const monthRef = ref(database, `months/${currentSession.monthId}`);
              const monthSnapshot = await get(monthRef);

              if (monthSnapshot.exists()) {
                const monthData = monthSnapshot.val();

                // Initialize courseIds array if it doesn't exist
                if (!monthData.courseIds) {
                  monthData.courseIds = [];
                }

                // Update month course IDs if not already there
                if (!monthData.courseIds.includes(courseRecord.id)) {
                  monthData.courseIds.push(courseRecord.id);
                }

                // Increment session count
                monthData.sessionCount = (monthData.sessionCount || 0) + 1;

                // Update the month record
                await update(monthRef, {
                  courseIds: monthData.courseIds,
                  sessionCount: monthData.sessionCount
                });
              }
            }

            sessions.push(sessionRecord);
          }

          // Extract date, time and teacher info
          const dateValue = row[5]; // Column F - Date
          const startTimeValue = row[6]; // Column G - Start time
          const endTimeValue = row[7]; // Column H - End time
          const teacherValue = row[8] || ''; // Column I - Teacher

          // Format date and times
          let formattedDate = '';
          if (dateValue) {
            if (typeof dateValue === 'string' && dateValue.includes('.')) {
              formattedDate = dateValue;
            } else {
              try {
                const jsDate = excelDateToJSDate(dateValue);
                formattedDate = formatDate(jsDate);
              } catch (e) {
                formattedDate = String(dateValue);
              }
            }

            // Update first and last session dates
            if (!firstSessionDate || formattedDate < firstSessionDate) {
              firstSessionDate = formattedDate;
            }
            if (!lastSessionDate || formattedDate > lastSessionDate) {
              lastSessionDate = formattedDate;
            }
          }

          // Format times
          let formattedStartTime = formatTime(startTimeValue);
          let formattedEndTime = formatTime(endTimeValue);

          // Create or get teacher record
          let teacherId = '';
          if (teacherValue) {
            const teacherRecord = await createTeacherRecord(teacherValue);
            teacherId = teacherRecord.id;
            teacherIds.add(teacherId);

            // If this is the first teacher we've found, set it as the course's teacher
            if (!courseRecord.teacherId) {
              courseRecord.teacherId = teacherId;
            }
          }

          // Get or create month record
          let monthId = null;
          if (formattedDate) {
            try {
              const monthRecord = await getOrCreateMonthRecord(formattedDate);
              if (monthRecord) {
                monthId = monthRecord.id;
                // Track the month in our set of months used in this course
                monthIds.add(monthId);
              }
            } catch (error) {
              console.error(`Error associating session with month for date ${formattedDate}:`, error);
            }
          }

          // Create new session object
          currentSessionTitle = folienTitle;
          currentSession = {
            courseId: courseRecord.id,
            title: folienTitle,
            content: contentValue || '',
            notes: row[2] || '', // Column C - Notizen
            checked: row[3] === 'TRUE', // Column D - die Folien gecheckt
            completed: row[4] === 'TRUE', // Column E - gemacht
            date: formattedDate,
            startTime: formattedStartTime,
            endTime: formattedEndTime,
            teacherId: teacherId,
            message: row[9] || '', // Column J - Nachrichten
            contentItems: [],
            attendance: {},
            monthId: monthId
          };

          console.log(`Created new session: ${folienTitle} on ${formattedDate}`);
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
          const columnIndex = student.columnIndex;
          const cellValue = row[columnIndex];

          if (cellValue !== undefined && cellValue !== null) {
            let attendanceValue = 'unknown';

            // Try to get color information from ExcelJS
            const excelCell = excelRow.getCell(columnIndex + 1); // +1 because ExcelJS is 1-based

            // Color-based detection
            if (excelCell.fill && excelCell.fill.type === 'pattern' && excelCell.fill.fgColor) {
              const color = excelCell.fill.fgColor.argb || '';

              // Green -> present, Red/Pink -> absent
              if (isGreenColor(color)) {
                attendanceValue = 'present';
              }
              else if (isRedColor(color)) {
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

            // Record attendance
            if (attendanceValue !== 'unknown') {
              currentSession.attendance[student.id] = attendanceValue;
            }
          }
        }
      }
    }

    // Add the last session if we have one
    if (currentSession) {
      console.log(`Creating final session record: ${currentSession.title}`);
      const sessionRecord = await createRecord('sessions', currentSession);
      courseRecord.sessionIds.push(sessionRecord.id);

      // After creating a session record, update the month's statistics
      if (currentSession.monthId) {
        const monthRef = ref(database, `months/${currentSession.monthId}`);
        const monthSnapshot = await get(monthRef);

        if (monthSnapshot.exists()) {
          const monthData = monthSnapshot.val();

          // Initialize courseIds array if it doesn't exist
          if (!monthData.courseIds) {
            monthData.courseIds = [];
          }

          // Update month course IDs if not already there
          if (!monthData.courseIds.includes(courseRecord.id)) {
            monthData.courseIds.push(courseRecord.id);
          }

          // Increment session count
          monthData.sessionCount = (monthData.sessionCount || 0) + 1;

          // Update the month record
          await update(monthRef, {
            courseIds: monthData.courseIds,
            sessionCount: monthData.sessionCount
          });
        }
      }

      sessions.push(sessionRecord);
    }

    // Update course with session dates and teacher
    await updateRecord('courses', courseRecord.id, {
      startDate: firstSessionDate || '',
      endDate: lastSessionDate || '',
      sessionIds: courseRecord.sessionIds,
      teacherId: courseRecord.teacherId
    });

    // Update teacher records with this course
    for (const teacherId of teacherIds) {
      const teacher = await getRecordById('teachers', teacherId);
      if (teacher) {
        const courseIds = teacher.courseIds || [];
        if (!courseIds.includes(courseRecord.id)) {
          courseIds.push(courseRecord.id);
          await updateRecord('teachers', teacherId, { courseIds });
        }
      }
    }

    // Update month records with teachers
    for (const monthId of monthIds) {
      const monthRecord = await getRecordById('months', monthId);
      if (monthRecord) {
        const teacherIdsArray = Array.from(teacherIds);
        const updatedTeacherIds = [...new Set([...(monthRecord.teacherIds || []), ...teacherIdsArray])];
        await updateRecord('months', monthId, {
          teacherIds: updatedTeacherIds
        });
      }
    }

    console.log('Completed database import with new structure');
    return {
      ...courseRecord,
      sessionCount: sessions.length
    };
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
              <p><strong>{result.message}</strong></p>

              {result.details && (
                <p>{result.details}</p>
              )}

              {result.errors && result.errors.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <ul style={{
                    listStyleType: 'disc',
                    paddingLeft: '20px',
                    marginTop: '5px',
                    fontSize: '14px'
                  }}>
                    {result.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportContent;