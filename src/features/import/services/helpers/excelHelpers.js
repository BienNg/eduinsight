// src/features/import/services/helpers/excelHelpers.js
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';

export const parseExcelData = async (arrayBuffer) => {
  // Use XLSX and ExcelJS to parse the file
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  const excelWorkbook = new ExcelJS.Workbook();
  await excelWorkbook.xlsx.load(arrayBuffer);
  const excelWorksheet = excelWorkbook.worksheets[0];
  
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
  
  return {
    workbook,
    jsonData,
    excelWorksheet,
    headerRowIndex
  };
};

export const extractCourseInfo = (filename, jsonData, sheetName) => {
  let groupName = '';
  let level = '';
  let mode = 'Unknown';
  
  // 1. Try to get group from filename first (standard approach)
  const filenameGroupMatch = filename.match(/([GAMP]\d+)/i);
  if (filenameGroupMatch) {
    groupName = filenameGroupMatch[1];
  }
  
  // If no group found, check sheet name as last resort
  if (!groupName && sheetName) {
    const sheetNameGroupMatch = sheetName.match(/([GAMP]\d+)/i);
    if (sheetNameGroupMatch) {
      groupName = sheetNameGroupMatch[1];
    }
  }
  
  // If still no group found, throw error
  if (!groupName) {
    throw new Error("Group name (e.g., G1, A2, M3, P4) not found in the filename or sheet. Please rename your file to include a valid group code.");
  }
  
  // Extract the group type
  const courseType = groupName.charAt(0).toUpperCase();
  
  // Level detection
  if (courseType === 'A') {
    // Leave level empty for type A courses
    level = '';
  } else if (courseType === 'M') {
    // For M-type courses, detect simple levels (A1, A2, B1)
    const simpleLevelMatch = filename.match(/[AB][0-9]/i);
    level = simpleLevelMatch ? simpleLevelMatch[0] : '';
  } else {
    // For other course types, detect detailed levels (A1.1, A2.2, etc.)
    const detailedLevelMatch = filename.match(/[AB][0-9]\.[0-9]/i);
    level = detailedLevelMatch ? detailedLevelMatch[0] : '';
    
    // If detailed level not found, fall back to simple level
    if (!level) {
      const fallbackLevel = filename.match(/[AB][0-9]/i);
      level = fallbackLevel ? fallbackLevel[0] : '';
    }
  }
  
  // Validate level for non-A course types
  if (courseType !== 'A' && !level) {
    throw new Error(`Level information (e.g., A1, B2.1) not found for ${groupName}. Please include level information in the filename.`);
  }
  
  // Extract online/offline status
  const onlineMatch = filename.match(/online/i) || sheetName.match(/online/i);
  const offlineMatch = filename.match(/offline/i) || sheetName.match(/offline/i);
  mode = onlineMatch ? 'Online' : (offlineMatch ? 'Offline' : 'Unknown');
  
  // Validate mode
  if (mode === 'Unknown') {
    throw new Error(`Course mode (Online/Offline) not specified for ${groupName}. Please include 'Online' or 'Offline' in the filename.`);
  }
  
  return {
    groupName,
    level,
    mode,
    courseType
  };
};

export const findColumnIndex = (headerRow, columnNames) => {
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

  return -1;
};

export const excelDateToJSDate = (excelDate) => {
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

export const formatDate = (jsDate) => {
  if (!jsDate || !(jsDate instanceof Date) || isNaN(jsDate)) {
    console.warn('Invalid date object:', jsDate);
    return '';
  }

  // Validate the year is reasonable
  const year = jsDate.getUTCFullYear();
  if (year < 2020 || year > 2030) {
    console.warn('Suspicious year detected:', year);
    return '';
  }

  const day = jsDate.getUTCDate().toString().padStart(2, '0');
  const month = (jsDate.getUTCMonth() + 1).toString().padStart(2, '0');
  return `${day}.${month}.${year}`;
};

export const formatTime = (value) => {
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

export const isGreenColor = (argb) => {
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

export const isRedColor = (argb) => {
  if (!argb) return false;

  // Extract RGB components
  const r = parseInt(argb.substr(2, 2), 16) || 0;
  const g = parseInt(argb.substr(4, 2), 16) || 0;
  const b = parseInt(argb.substr(6, 2), 16) || 0;

  // Check if it's predominantly red or pink
  return (r > (g + 20) && r > (b + 20)) ||
    (r > (g - 20) && r > 200 && b > 200); // For pinks (high red and blue)
};

export const isDateBefore2020 = (dateValue) => {
  if (!dateValue) return false;

  if (typeof dateValue === 'string' && dateValue.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
    const [day, month, year] = dateValue.split('.').map(Number);
    return year < 2020;
  }

  if (typeof dateValue === 'number') {
    const jsDate = excelDateToJSDate(dateValue);
    return jsDate && jsDate.getFullYear() < 2020;
  }

  return false;
};