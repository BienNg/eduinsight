// src/components/Dashboard/ImportContent.jsx
import { useState, useRef, useEffect } from 'react';
import { useImport } from './ImportContext';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { createRecord, updateRecord, getAllRecords, getRecordById } from '../../firebase/database';
import { ref, push, set, get, update, remove, query, orderByChild, equalTo } from "firebase/database";
import { database } from "../../firebase/config";
import './Content.css';
import ErrorSummary from './ErrorSummary';
import { FOCUS_IMPORT_TAB_EVENT } from './ImportContext';

// Add at the top of the component, after imports
const findColumnIndex = (headerRow, columnNames) => {
  // Ensure columnNames is always an array
  const searchNames = Array.isArray(columnNames) ? columnNames : [columnNames];

  // Create strict mapping for date column
  const dateColumnVariations = [
    'Datum',
    'Date',
    'Unterrichtstag',
    'Tag',
    'Day'
  ];

  // Special handling for date column
  if (searchNames.some(name => ['Datum', 'Date', 'Unterrichtstag'].includes(name))) {
    for (let i = 0; i < headerRow.length; i++) {
      const cell = headerRow[i];
      if (cell && typeof cell === 'string') {
        const cellText = cell.toString().trim();
        // Use exact match for date column
        if (dateColumnVariations.includes(cellText)) {
          return i;
        }
      }
    }
    return -1;
  }

  // For other columns, use existing logic with variations
  const columnVariations = {
    'folien': ['folien', 'canva', 'Folien', 'Canva'],
    'von': ['von', 'from', 'start', 'Von'],
    'bis': ['bis', 'to', 'end', 'Bis'],
    'lehrer': ['lehrer', 'teacher', 'Lehrer'],
    'folien': ['folien', 'slides', 'Folien'],
    'inhalt': ['inhalt', 'content', 'Inhalt'],
    'notizen': ['notizen', 'notes', 'Notizen']
  };

  // Search for exact matches first
  for (let i = 0; i < headerRow.length; i++) {
    const cell = headerRow[i];
    if (!cell) continue;

    const cellText = cell.toString().trim().toLowerCase();
    for (const name of searchNames) {
      if (cellText === name.toLowerCase()) {
        return i;
      }
    }
  }

  // Then try variations
  for (let i = 0; i < headerRow.length; i++) {
    const cell = headerRow[i];
    if (!cell) continue;

    const cellText = cell.toString().trim().toLowerCase();
    for (const name of searchNames) {
      const variations = columnVariations[name.toLowerCase()] || [];
      if (variations.some(v => cellText.includes(v.toLowerCase()))) {
        return i;
      }
    }
  }

  console.log(`Could not find column for: ${searchNames.join(', ')}`);
  return -1;
};

// Helper to normalize teacher names (remove accents, lowercase, trim)
const normalizeTeacherName = (name) => {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/\s+/g, ' '); // Collapse multiple spaces
};

// Function to create a teacher record
const createTeacherRecord = async (teacherName) => {
  try {
    // Normalize the teacher name: trim whitespace and convert to title case
    const normalizedName = normalizeTeacherName(teacherName);


    // Check if teacher already exists (case-insensitive search)
    const teachers = await getAllRecords('teachers');
    const existingTeacher = teachers.find(t =>
      normalizeTeacherName(t.name) === normalizedName
    );

    if (existingTeacher) {
      return existingTeacher;
    }

    // Create new teacher with normalized name
    return await createRecord('teachers', {
      name: teacherName.trim(),
      country: '', // Default country
      courseIds: [] // Will be updated when courses are created
    });
  } catch (error) {
    console.error("Error creating teacher record:", error);
    throw error;
  }
};

// Function to create or update a student record with improved name matching
const createOrUpdateStudentRecord = async (studentName, studentInfo = '', courseId) => {
  try {
    // Get all students
    const students = await getAllRecords('students');

    // Normalize the incoming student name for comparison
    const normalizedName = studentName.trim();
    const nameParts = normalizedName.split(/[-|]/)[0].trim().toLowerCase();

    // Find existing student with similar name
    const existingStudent = students.find(s => {
      // Check for exact match first
      if (s.name === studentName) return true;

      // Then check for pattern matches
      const existingNameLower = s.name.toLowerCase();
      const existingNameParts = existingNameLower.split(/[-|]/)[0].trim();

      // Match case 1: Base name is the same (ignoring group suffix or additional info)
      return nameParts === existingNameParts ||
        existingNameLower.includes(nameParts) ||
        nameParts.includes(existingNameParts);
    });

    if (existingStudent) {

      // Update the student's courseIds to include the new course if it doesn't already
      let courseIds = existingStudent.courseIds || [];
      if (!courseIds.includes(courseId)) {
        courseIds.push(courseId);

        // Update the student record with the new course
        await updateRecord('students', existingStudent.id, {
          courseIds: courseIds,
          // Preserve existing info or use new info if existing is empty
          info: existingStudent.info || studentInfo
        });
      }

      return existingStudent;
    }

    // Create new student if not found
    return await createRecord('students', {
      name: studentName,
      info: studentInfo,
      courseIds: [courseId],
      notes: '',
      joinDates: {}
    });
  } catch (error) {
    console.error("Error creating/updating student record:", error);
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
      return monthRecord;
    }

    // Create new month record
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const monthName = `${monthNames[parseInt(month) - 1]} ${year}`;


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

// Modify the validateExcelFile function in ImportContent.jsx
const validateExcelFile = async (arrayBuffer, filename) => {
  const errors = [];
  let missingTimeColumns = false;

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
      if (jsonData[i][0] === "Folien" || jsonData[i][0] === "Canva") {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      errors.push("Could not find header row with 'Folien' column. The Excel file structure appears to be invalid.");
      // If we can't find the header row, many other validations will fail, so return early
      return errors;
    }

    // 2. Modify validation of columns to be more flexible
    const headerRow = jsonData[headerRowIndex];

    // Define required columns with more variations
    const requiredColumns = [
      ["Folien", "folien"],
      ["Unterrichtstag", "Datum", "Tag", "Date", "Day"], // Allow either of these for the date column
      ["Lehrer", "lehrer", "Teacher"]
    ];

    const startTimeIndex = findColumnIndex(headerRow, ["von", "Von", "from"]);
    const endTimeIndex = findColumnIndex(headerRow, ["bis", "Bis", "to"]);

    // Set the missingTimeColumns flag if either column is missing
    if (startTimeIndex === -1 || endTimeIndex === -1) {
      missingTimeColumns = true;

      // Add a specific error message for missing time columns
      if (startTimeIndex === -1) {
        errors.push("Missing time column: von/from not found in the header row.");
      }

      if (endTimeIndex === -1) {
        errors.push("Missing time column: bis/to not found in the header row.");
      }
    }
    // Only add as regular error if just one is missing
    else if (startTimeIndex === -1) {
      errors.push("Required column 'von/from' not found in the header row.");
    }
    else if (endTimeIndex === -1) {
      errors.push("Required column 'bis/to' not found in the header row.");
    }

    // Check only the crucial columns
    for (const column of requiredColumns) {
      const columnIndex = findColumnIndex(headerRow, column);
      if (columnIndex === -1) {
        // Handle array of possible column names in the error message
        const columnName = Array.isArray(column) ? column.join(" or ") : column;
        errors.push(`Required column '${columnName}' not found in the header row.`);
      }
    }

    // 3. Check for student names in header row (typically starting from column K/index 10)
    let studentCount = 0;
    for (let j = 10; j < headerRow.length; j++) {
      if (headerRow[j] &&
        headerRow[j] !== "Anwesenheitsliste" &&
        !headerRow[j].includes("Nachrichten von/ für")) {
        studentCount++;
      }
    }

    if (studentCount === 0) {
      errors.push("No student names found in the header row (columns K and beyond).");
    }

    // 4. Validate session data with a more flexible approach
    // Get the indices of crucial columns
    const folienIndex = findColumnIndex(headerRow, "Folien");
    const dateIndex = findColumnIndex(headerRow, ["Unterrichtstag", "Datum", "Tag", "Date", "Day"]);
    const teacherIndex = findColumnIndex(headerRow, "Lehrer");

    // Start from row after header
    const sessionsStartRow = headerRowIndex + 1;
    let currentSessionTitle = null;
    let sessionCount = 0;
    let lastKnownDate = null;

    // Get current date for comparison with session dates
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
    const currentYear = currentDate.getFullYear();


    for (let i = sessionsStartRow; i < jsonData.length; i++) {
      const row = jsonData[i];

      // Skip completely empty rows
      if (!row || row.length === 0 || (row.length === 1 && !row[0])) {
        continue;
      }

      const folienValue = folienIndex !== -1 ? row[folienIndex] : null;

      // If there's a value in Folien column, this should be a new session
      if (folienValue && folienValue.toString().trim() !== '') {
        currentSessionTitle = folienValue;
        sessionCount++;

        // Validate date if column exists
        if (dateIndex !== -1) {
          const dateValue = row[dateIndex];

          if (dateValue) {
            // Store as last known date if valid
            if (typeof dateValue === 'string' && dateValue.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
              lastKnownDate = dateValue;

              // Check if this session is in the current month
              const [day, month, year] = dateValue.split('.').map(Number);
              const isCurrentMonth = month === currentMonth && year === currentYear;

              // Skip validation of incomplete data for current month sessions
              if (isCurrentMonth) {
                continue;
              }
            }
            // Handle Excel numeric dates
            else if (typeof dateValue === 'number') {
              // This is an Excel numeric date, it's valid but needs conversion
              // We'll handle the conversion during processing, for validation we just accept it
              try {
                const jsDate = excelDateToJSDate(dateValue);
                const formattedDate = formatDate(jsDate);
                lastKnownDate = formattedDate;

                if (jsDate) {
                  const month = jsDate.getMonth() + 1;
                  const year = jsDate.getFullYear();
                  const isCurrentMonth = month === currentMonth && year === currentYear;

                  if (isCurrentMonth) {
                    continue;
                  }
                }
              } catch (e) {
                errors.push(`Row ${i + 1}: Session "${folienValue}" has an invalid numeric date value "${dateValue}".`);
              }
            }
            else if (!(typeof dateValue === 'string' && dateValue.match(/^\d{2}\.\d{2}\.\d{4}$/))) {
              errors.push(`Row ${i + 1}: Session "${folienValue}" has an invalid date format "${dateValue}". Expected format: DD.MM.YYYY in the "Datum/Unterrichtstag" column`);
            }
          } else {
            // If date is missing but we have a previous date, this is likely a continuation
            // No error for this case, as we'll use the last known date during processing
            if (!lastKnownDate) {
              errors.push(`Row ${i + 1}: Session "${folienValue}" is missing a date and no previous date is available.`);
            }
          }
        }

        // Validate time values for sessions not in current month
        const dateValue = row[dateIndex];
        if (dateValue) {
          let isCurrentMonth = false;

          if (typeof dateValue === 'string' && dateValue.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
            const [day, month, year] = dateValue.split('.').map(Number);
            isCurrentMonth = month === currentMonth && year === currentYear;
          }
          else if (typeof dateValue === 'number') {
            try {
              const jsDate = excelDateToJSDate(dateValue);
              if (jsDate) {
                const month = jsDate.getMonth() + 1;
                const year = jsDate.getFullYear();
                isCurrentMonth = month === currentMonth && year === currentYear;
              }
            } catch (e) {
              // Error handling for invalid numeric date is already done above
            }
          }

          if (!isCurrentMonth) {
            // Leave the rest of your validation code for times and teacher unchanged
            if (startTimeIndex !== -1) {
              const startTimeValue = row[startTimeIndex];
              if (!startTimeValue) {
                errors.push(`Row ${i + 1}: Session "${folienValue}" is missing a start time in the "von" column.`);
              }
            }

            if (endTimeIndex !== -1) {
              const endTimeValue = row[endTimeIndex];
              if (!endTimeValue) {
                errors.push(`Row ${i + 1}: Session "${folienValue}" is missing an end time in the "bis" column.`);
              }
            }

            if (teacherIndex !== -1) {
              const teacherValue = row[teacherIndex];
              if (!teacherValue) {
                errors.push(`Row ${i + 1}: Session "${folienValue}" is missing teacher information in the "Lehrer" column.`);
              }
            }
          }
        }
      }
    }

    if (sessionCount === 0) {
      errors.push("No sessions found in the Excel file. The Folien column should contain session titles.");
    }

    return {
      errors,
      missingTimeColumns,
      hasOnlyTimeErrors: missingTimeColumns && errors.every(error =>
        error.includes('Missing time column:') ||
        error.includes('missing a start time') ||
        error.includes('missing an end time')
      )
    };

  } catch (error) {
    errors.push(`Error processing Excel file: ${error.message}`);
    return { errors, missingTimeColumns, hasOnlyTimeErrors: false };
  }
};

const excelDateToJSDate = (excelDate) => {
  if (!excelDate) return null;

  // If it's already a string in DD.MM.YYYY format, parse it directly
  if (typeof excelDate === 'string' && excelDate.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
    const [day, month, year] = excelDate.split('.').map(Number);
    // Create date in UTC to avoid timezone offset issues
    return new Date(Date.UTC(year, month - 1, day));
  }

  // Handle Excel serial date numbers
  if (typeof excelDate === 'number') {
    // Excel's date system has a leap year bug from 1900
    // Adding the timezone offset and using UTC to prevent date shifting
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const timezoneOffset = new Date().getTimezoneOffset() * 60 * 1000;

    const date = new Date(excelEpoch.getTime() + (excelDate * millisecondsPerDay) + timezoneOffset);

    // Validate the converted date
    if (date.getUTCFullYear() === 1900 && date.getUTCMonth() === 0 && date.getUTCDate() === 1) {
      console.warn('Invalid Excel date detected:', excelDate);
      return null;
    }

    return date;
  }

  return null;
};

// Also update the formatDate function to use UTC
const formatDate = (jsDate) => {
  if (!jsDate || !(jsDate instanceof Date) || isNaN(jsDate)) {
    console.warn('Invalid date object:', jsDate);
    return '';
  }

  // Validate the year is reasonable (e.g., between 2020 and 2030)
  const year = jsDate.getUTCFullYear();
  if (year < 2020 || year > 2030) {
    console.warn('Suspicious year detected:', year);
    return '';
  }

  const day = jsDate.getUTCDate().toString().padStart(2, '0');
  const month = (jsDate.getUTCMonth() + 1).toString().padStart(2, '0');
  return `${day}.${month}.${year}`;
};

// First add the helper functions at the top level
const isValidDate = (dateString) => {
  if (!dateString) return false;

  // Handle string dates in DD.MM.YYYY format
  if (typeof dateString === 'string') {
    const [day, month, year] = dateString.split('.').map(Number);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const date = new Date(year, month - 1, day);
      return date.getFullYear() >= 2020 && date.getFullYear() <= 2030;
    }
  }
  return false;
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
  if (!argb) return false;

  // Extract RGB components
  const r = parseInt(argb.substr(2, 2), 16) || 0;
  const g = parseInt(argb.substr(4, 2), 16) || 0;
  const b = parseInt(argb.substr(6, 2), 16) || 0;

  // Check if it's predominantly red or pink
  return (r > (g + 20) && r > (b + 20)) ||
    (r > (g - 20) && r > 200 && b > 200); // For pinks (high red and blue)
};

// Helper function to parse date strings in DD.MM.YYYY format
const parseDate = (dateString) => {
  if (!dateString) return null;
  const [day, month, year] = dateString.split('.').map(Number);
  return new Date(year, month - 1, day);
};

const processB1CourseFileWithColors = async (arrayBuffer, filename, options) => {

  const { ignoreMissingTimeColumns } = options;

  // Use XLSX and ExcelJS to parse the file
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  const excelWorkbook = new ExcelJS.Workbook();
  await excelWorkbook.xlsx.load(arrayBuffer);
  const excelWorksheet = excelWorkbook.worksheets[0];
  // Extract course level and group from filename
  const levelMatch = filename.match(/[AB][0-9]\.[0-9]/i);
  const level = levelMatch ? levelMatch[0] : 'unknown';
  const groupMatch = filename.match(/G(\d+)/i);
  const group = groupMatch ? `G${groupMatch[1]}` : '';
  const courseName = `${group} ${level}`;

  // Extract online/offline status
  const onlineMatch = filename.match(/_online/i);
  const offlineMatch = filename.match(/_offline/i);
  const courseType = onlineMatch ? 'Online' : (offlineMatch ? 'Offline' : 'Unknown');


  const findExistingCourse = async (group, level) => {
    try {
      const coursesRef = ref(database, 'courses');
      const coursesQuery = query(
        coursesRef,
        orderByChild('level'),
        equalTo(level)
      );

      const snapshot = await get(coursesQuery);

      if (snapshot.exists()) {
        const courses = Object.values(snapshot.val());
        // Find a course with matching group and level
        return courses.find(course => course.group === group);
      }

      return null;
    } catch (error) {
      console.error("Error checking for existing course:", error);
      throw error;
    }
  };

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

  // Get the header row
  const headerRow = jsonData[headerRowIndex];

  // Map column indices for crucial data
  const columnIndices = {
    folien: findColumnIndex(headerRow, ["Folien", "Canva"]),
    inhalt: findColumnIndex(headerRow, ["Inhalt"]),
    notizen: findColumnIndex(headerRow, ["Notizen"]),
    checked: findColumnIndex(headerRow, ["die Folien gecheckt"]),
    gemacht: findColumnIndex(headerRow, ["gemacht"]),
    date: findColumnIndex(headerRow, ["Datum", "Date", "Unterrichtstag"]), // More specific date column detection
    startTime: findColumnIndex(headerRow, ["von"]),
    endTime: findColumnIndex(headerRow, ["bis"]),
    teacher: findColumnIndex(headerRow, ["Lehrer"]),
    message: findColumnIndex(headerRow, ["Nachrichten"])
  };

  // Extract student information
  const students = [];
  const studentNames = []; // Add this to collect student names first

  // Students typically start from column K (index 10)
  for (let j = 10; j < headerRow.length; j++) {
    const studentName = headerRow[j];
    if (studentName && typeof studentName === 'string' && studentName.trim() !== '') {
      // Skip column headers
      if (studentName === "Anwesenheitsliste" ||
        studentName === "Nachrichten von/ für NaNu NaNa") {
        continue;
      }

      // Just collect the names and column indices for now
      studentNames.push({
        name: studentName,
        columnIndex: j
      });
    }
  }

  // Create the course record first
  const existingCourse = await findExistingCourse(group, level);

  if (existingCourse) {
    throw new Error(
      `Import Failed: Duplicate Course Detected\n\n` +
      `A course with Group "${group}" and Level "${level}" already exists in the database.\n\n` +
      `Course name: ${existingCourse.name}\n` +
      `Created: ${existingCourse.startDate || 'Unknown date'}\n\n` +
      `Please use a different file or delete the existing course before importing.`
    );
  }


  // Create the course record first
  const courseRecord = await createRecord('courses', {
    name: courseName,
    level: level,
    group: group,
    courseType: courseType, // Add the new field
    startDate: '', // Will be updated with the first session date
    endDate: '', // Will be updated with the last session date
    sessionIds: [],
    studentIds: [], // We'll update this after creating/getting students
    teacherIds: [], // <-- Use only teacherIds array
    status: 'ongoing' // Default status is ongoing
  });

  console.log(`Created course record: ${courseRecord.id}`);

  // Now create/update student records with the course ID available
  for (const studentInfo of studentNames) {
    // Create student record in Firebase now that we have courseRecord.id
    const studentRecord = await createOrUpdateStudentRecord(studentInfo.name, '', courseRecord.id);
    students.push({
      id: studentRecord.id,
      name: studentRecord.name,
      columnIndex: studentInfo.columnIndex
    });
  }

  // Update the course with the student IDs
  await updateRecord('courses', courseRecord.id, {
    studentIds: students.map(s => s.id)
  });

  // Process sessions - start from the row after the header
  const sessions = [];
  let currentSessionTitle = null;
  let currentSession = null;
  let teacherIds = new Set();
  let monthIds = new Set();
  let firstSessionDate = null;
  let lastSessionDate = null;
  let lastKnownDate = null;

  // Get current date for comparison with session dates
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
  const currentYear = currentDate.getFullYear();

  for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
    const row = jsonData[i];

    // Skip empty rows
    if (!row || row.length === 0 || (row.length === 1 && !row[0])) {
      continue;
    }

    // Extract values using our column mapping
    const getValue = (index) => index !== -1 && index < row.length ? row[index] : null;

    const folienTitle = getValue(columnIndices.folien);
    const contentValue = getValue(columnIndices.inhalt);
    const notesValue = getValue(columnIndices.notizen);
    const checkedValue = getValue(columnIndices.checked);
    const completedValue = getValue(columnIndices.gemacht);
    const dateValue = getValue(columnIndices.date);
    const startTimeValue = getValue(columnIndices.startTime);
    const endTimeValue = getValue(columnIndices.endTime);
    const teacherValue = getValue(columnIndices.teacher);
    const messageValue = getValue(columnIndices.message);

    // If we have a value in column A (Folien), this could be a new session
    // If we have a value in folien column, this could be a new session
    if (folienTitle && folienTitle.toString().trim() !== '') {
      // If it's a new session title or different from current one, start a new session
      if (folienTitle !== currentSessionTitle) {
        // Save previous session if we have one
        if (currentSession) {
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

        // Format date and times
        let formattedDate = '';
        let isOngoingSession = false;
        const dateValue = getValue(columnIndices.date);

        if (dateValue) {
          if (typeof dateValue === 'string' && dateValue.includes('.')) {
            // Handle string dates in DD.MM.YYYY format
            formattedDate = dateValue;
          } else if (typeof dateValue === 'number') {
            // Handle Excel serial date
            const jsDate = excelDateToJSDate(dateValue);
            if (jsDate) {
              const day = jsDate.getDate().toString().padStart(2, '0');
              const month = (jsDate.getMonth() + 1).toString().padStart(2, '0');
              const year = jsDate.getFullYear();
              formattedDate = `${day}.${month}.${year}`;
            }
          }

          // Get or create month record first
          let monthId = null;
          if (formattedDate) {
            try {
              const monthRecord = await getOrCreateMonthRecord(formattedDate);
              if (monthRecord) {
                monthId = monthRecord.id;
                monthIds.add(monthId);
              }
            } catch (error) {
              console.error(`Error getting/creating month record for date ${formattedDate}:`, error);
            }
          }
        }

        // Only mark as ongoing if the date is in the current month or future
        if (formattedDate) {
          const [day, month, year] = formattedDate.split('.').map(Number);
          const sessionDate = new Date(year, month - 1, day);
          const today = new Date();

          // Set to beginning of the day for accurate comparison
          today.setHours(0, 0, 0, 0);

          // Only ongoing if it's today or in the future
          isOngoingSession = sessionDate >= today;
        }

        // Format times
        let formattedStartTime = formatTime(startTimeValue);
        let formattedEndTime = formatTime(endTimeValue);

        // Create or get teacher record
        let teacherId = '';
        if (teacherValue) {
          const teacherRecord = await createTeacherRecord(teacherValue);
          teacherId = teacherRecord.id;
          teacherIds.add(teacherRecord.id);

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
          notes: notesValue || '',
          checked: checkedValue === 'TRUE',
          completed: completedValue === 'TRUE',
          date: formattedDate || '', // Remove lastKnownDate fallback
          // Allow empty time values if columns are missing
          startTime: columnIndices.startTime !== -1 ? formatTime(startTimeValue) : '',
          endTime: columnIndices.endTime !== -1 ? formatTime(endTimeValue) : '',
          teacherId: teacherId || '',
          message: messageValue || '',
          contentItems: [],
          attendance: {},
          monthId: monthId,
          // Set status to 'ongoing' if date is empty or in current/future month
          status: !formattedDate ? 'ongoing' : (() => {
            if (formattedDate) {
              const [day, month, year] = formattedDate.split('.').map(Number);
              const sessionDate = new Date(year, month - 1, day);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return sessionDate >= today ? 'ongoing' : 'completed';
            }
            return 'ongoing';
          })()
        };

        // Update lastKnownDate if we have a valid date
        if (formattedDate) {
          lastKnownDate = formattedDate;

          // Update first/last session dates for the course
          if (!firstSessionDate || formattedDate < firstSessionDate) {
            firstSessionDate = formattedDate;
          }
          if (!lastSessionDate || formattedDate > lastSessionDate) {
            lastSessionDate = formattedDate;
          }
        }
      }
      // If it's the same title but a new row with content, we might need to update the current session
      else if (contentValue && contentValue.trim() !== '') {
        // Update current session with new content
        if (!currentSession.contentItems) {
          currentSession.contentItems = [];
        }
        currentSession.contentItems.push({
          content: contentValue,
          notes: notesValue || '',
          checked: checkedValue === 'TRUE'
        });
      }
    } else if (currentSession && contentValue) {
      // This is additional content for the current session
      currentSession.contentItems.push({
        content: contentValue,
        notes: notesValue || '',
        checked: checkedValue === 'TRUE'
      });
    }

    // Process attendance for this row if we have a current session
    if (currentSession && students.length > 0) {
      // Get the Excel row for color information
      const excelRow = excelWorksheet.getRow(i + 1); // +1 because ExcelJS is 1-based

      for (const student of students) {
        const columnIndex = student.columnIndex;
        const cellValue = row[columnIndex];
        const excelCell = excelRow.getCell(columnIndex + 1); // +1 because ExcelJS is 1-based

        if (cellValue !== undefined && cellValue !== null || excelCell.fill) {
          let attendanceValue = 'unknown';
          let comment = '';

          // Try to get cell comment if any
          if (excelCell.note) {
            comment = excelCell.note.texts.map(t => t.text).join('');
          } else if (typeof cellValue === 'string' && cellValue.trim() !== '') {
            comment = cellValue;
          }

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

          // Non-empty cell means student has joined by this session date
          if (attendanceValue !== 'unknown' || comment) {
            // Record attendance with comment
            currentSession.attendance[student.id] = {
              status: attendanceValue,
              comment: comment || ''
            };

            // Mark this session's date as the student's join date if we haven't recorded one yet
            // or if this date is earlier than the previously recorded one
            if (currentSession.date) {
              // Update student join date if this is the first record of them in this course
              await get(ref(database, `students/${student.id}`)).then(snapshot => {
                if (snapshot.exists()) {
                  const studentData = snapshot.val();
                  const joinDates = studentData.joinDates || {};

                  // If no join date for this course yet, or if this date is earlier
                  if (!joinDates[courseRecord.id] ||
                    parseDate(currentSession.date) < parseDate(joinDates[courseRecord.id])) {
                    joinDates[courseRecord.id] = currentSession.date;
                    update(ref(database, `students/${student.id}`), { joinDates });
                  }
                }
              });
            }
          }
        }
      }
    }
  }

  // Add the last session if we have one
  if (currentSession) {
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
  // Determine course status based on last session date
  let courseStatus = 'ongoing';
  if (lastSessionDate) {
    const [day, month, year] = lastSessionDate.split('.').map(Number);
    const lastDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // If the last session date is in the past, mark course as completed
    if (lastDate < today) {
      courseStatus = 'completed';
    }
  }

  // Update course with session dates and teacher
  await updateRecord('courses', courseRecord.id, {
    startDate: firstSessionDate || '',
    endDate: lastSessionDate || '',
    sessionIds: courseRecord.sessionIds,
    teacherIds: Array.from(teacherIds),
    status: courseStatus
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

  return {
    ...courseRecord,
    sessionCount: sessions.length
  };
};

// Export these functions for use in the context
export { validateExcelFile, processB1CourseFileWithColors };

const ImportContent = () => {
  const {
    processingQueue,
    completedFiles,
    failedFiles,
    addFilesToQueue,
    clearCompletedFiles,
    clearFailedFiles
  } = useImport();

  const importTabRef = useRef(null);

  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Function to handle focusing the import tab
    const handleFocusImportTab = () => {
      if (importTabRef.current) {
        // Focus the tab element
        importTabRef.current.scrollIntoView({ behavior: 'smooth' });
        importTabRef.current.focus();

        // You might also need to programmatically select the tab if using a tab component
        // For example:
        // setActiveTab('import');
      }
    };

    // Listen for the custom event
    window.addEventListener(FOCUS_IMPORT_TAB_EVENT, handleFocusImportTab);

    // Cleanup
    return () => {
      window.removeEventListener(FOCUS_IMPORT_TAB_EVENT, handleFocusImportTab);
    };
  }, []);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      addFilesToQueue(selectedFiles);
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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      addFilesToQueue(droppedFiles);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="import-content" ref={importTabRef} tabIndex="-1">
      <div className="import-container" style={{ marginTop: '24px' }}>
        <div className="import-card" style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          <h3>Import Excel Files</h3>
          <p>Upload Excel files containing student data, class information, or attendance records.</p>

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
              multiple
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

            <p><strong>Drag and drop</strong> your Excel files here</p>
            <p>or click to browse files</p>
          </div>

          {/* Processing Queue */}
          {processingQueue.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h4>Processing Queue</h4>
              {processingQueue.map((item, index) => (
                <div key={item.id} style={{
                  padding: '10px',
                  marginBottom: '10px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span><strong>{item.name}</strong></span>
                    <span>{index === 0 ? 'Processing...' : 'Queued'}</span>
                  </div>

                  {index === 0 && (
                    <div style={{
                      height: '4px',
                      backgroundColor: '#e0e0e0',
                      borderRadius: '2px',
                      marginTop: '8px'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${item.progress}%`,
                        backgroundColor: '#1e88e5',
                        borderRadius: '2px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Completed Files */}
          {completedFiles.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4>Completed ({completedFiles.length})</h4>
                <button
                  onClick={clearCompletedFiles}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#1e88e5',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Clear
                </button>
              </div>

              {completedFiles.map((item) => (
                <div key={item.id} style={{
                  padding: '10px',
                  marginBottom: '10px',
                  backgroundColor: '#e8f5e9',
                  borderRadius: '4px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span><strong>{item.name}</strong></span>
                    <span style={{ color: '#2e7d32' }}>✓ Completed</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Failed Files */}
          {failedFiles.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4>Fix These Files ({failedFiles.length})</h4>
                <button
                  onClick={clearFailedFiles}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#1e88e5',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Clear
                </button>
              </div>

              {failedFiles.map((item) => (
                <div key={item.id} style={{
                  padding: '10px',
                  marginBottom: '10px',
                  backgroundColor: '#ffebee',
                  borderRadius: '4px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span><strong>{item.name}</strong></span>
                    <span style={{ color: '#c62828' }}>✗ Failed</span>
                  </div>
                  {item.error && item.error.includes('Validation failed:') ? (
                    <ErrorSummary errors={item.error} filename={item.name} />
                  ) : (
                    <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#c62828' }}>
                      {item.error}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportContent;