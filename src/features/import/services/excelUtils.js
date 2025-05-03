import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';

const findValueInMergedRange = (worksheet, masterAddress) => {
  if (!masterAddress) return null;

  const masterCell = worksheet.getCell(masterAddress);
  const mergeCellId = masterCell.master ? masterCell.master.address : masterAddress;

  // Get all merge ranges from worksheet
  const mergeRanges = worksheet.mergeCells;
  if (!mergeRanges) return masterCell.value;

  // Find the merge range that contains our cell
  const mergeRange = Object.keys(mergeRanges).find(range => {
    const [start, end] = range.split(':');
    return start === mergeCellId || end === mergeCellId;
  });

  if (!mergeRange) return masterCell.value;

  // Parse the range (e.g., 'A1:A3')
  const [start, end] = mergeRange.split(':');
  const startCell = worksheet.getCell(start);
  const endCell = worksheet.getCell(end);

  // Get the boundaries
  const top = Math.min(startCell.row, endCell.row);
  const bottom = Math.max(startCell.row, endCell.row);
  const left = Math.min(startCell.column, endCell.column);
  const right = Math.max(startCell.column, endCell.column);

  // Check every cell in the merge range for a value
  for (let row = top; row <= bottom; row++) {
    for (let col = left; col <= right; col++) {
      const cell = worksheet.getCell(row, col);
      if (cell.value && cell.value.toString().trim() !== '') {
        return cell.value;
      }
    }
  }

  return null;
};

export const isFutureDate = (dateValue) => {
  if (!dateValue) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (typeof dateValue === 'string' && dateValue.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
    const [day, month, year] = dateValue.split('.').map(Number);
    const sessionDate = new Date(year, month - 1, day);
    return sessionDate > today;
  }

  if (typeof dateValue === 'number') {
    const jsDate = excelDateToJSDate(dateValue);
    return jsDate ? jsDate > today : false;
  }

  return false;
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

export const parseDate = (dateString) => {
  if (!dateString) return null;
  const [day, month, year] = dateString.split('.').map(Number);
  return new Date(year, month - 1, day);
};

export const validateExcelFile = async (arrayBuffer, filename) => {
  const errors = [];
  let missingTimeColumns = false;

  const checkIsFutureDate = (dateValue) => {
    if (!dateValue) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (typeof dateValue === 'string' && dateValue.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
      const [day, month, year] = dateValue.split('.').map(Number);
      const sessionDate = new Date(year, month - 1, day);
      return sessionDate > today;
    }

    if (typeof dateValue === 'number') {
      const jsDate = excelDateToJSDate(dateValue);
      return jsDate ? jsDate > today : false;
    }

    return false;
  };

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
      return { errors, missingTimeColumns, hasOnlyTimeErrors: false };
    }

    // Get the header row first before checking the folien index
    const headerRow = jsonData[headerRowIndex];
    const dateIndex = findColumnIndex(headerRow, ["Unterrichtstag", "Datum", "Tag", "Date", "Day"]);
    const teacherIndex = findColumnIndex(headerRow, "Lehrer");

    // Now add the empty Folien cells check
    const folienIndex = findColumnIndex(headerRow, ["Folien", "Canva"]);
    if (folienIndex !== -1) {
      let emptyFolienCells = [];

      for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
        const row = jsonData[i];

        // Skip completely empty rows
        if (!row || row.length === 0 || (row.length === 1 && !row[0])) {
          continue;
        }

        // Check if other cells in this row have data
        const hasOtherData = row.some((cell, index) => index !== folienIndex && cell);

        if (hasOtherData) {
          // Check if this is a future date
          const dateValue = dateIndex !== -1 ? row[dateIndex] : null;
          if (checkIsFutureDate(dateValue)) {
            continue; // Skip validation for future dates
          }

          // Get the Excel row and cell
          const excelRow = excelWorksheet.getRow(i + 1);
          const folienCell = excelRow.getCell(folienIndex + 1);

          // Check if the cell is part of a merged range
          const isMerged = folienCell.isMerged;

          if (isMerged) {
            const masterCellAddress = folienCell.master ? folienCell.master.address : null;
            if (masterCellAddress) {
              const mergedValue = findValueInMergedRange(excelWorksheet, masterCellAddress);
              if (!mergedValue || mergedValue.toString().trim() === '') {
                emptyFolienCells.push(i + 1);
              }
            }
          } else {
            if (!folienCell.value || folienCell.value.toString().trim() === '') {
              emptyFolienCells.push(i + 1);
            }
          }
        }
      }

      // Add errors for empty Folien cells
      if (emptyFolienCells.length > 0) {
        emptyFolienCells.forEach(rowNum => {
          errors.push(`Row ${rowNum}: Empty cell in Folien column. All session rows must have a title.`);
        });
      }
    }


    // 2. Modify validation of columns to be more flexible

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

    // Start from row after header
    const sessionsStartRow = headerRowIndex + 1;
    let currentSessionTitle = null;
    let sessionCount = 0;
    let lastKnownDate = null;
    let hasFoundFilledSession = false;
    let hasEmptyCellsAfterFilled = false;
    let lastFilledSessionRow = -1;

    // Get current date for comparison with session dates
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // First pass - find the pattern of filled/empty sessions
    for (let i = sessionsStartRow; i < jsonData.length; i++) {
      const row = jsonData[i];

      // Skip completely empty rows
      if (!row || row.length === 0 || (row.length === 1 && !row[0])) {
        continue;
      }

      const folienValue = folienIndex !== -1 ? row[folienIndex] : null;

      // Only check rows that appear to be session rows
      if (folienValue && folienValue.toString().trim() !== '') {
        const dateValue = dateIndex !== -1 ? row[dateIndex] : null;
        const teacherValue = teacherIndex !== -1 ? row[teacherIndex] : null;
        const startTimeValue = startTimeIndex !== -1 ? row[startTimeIndex] : null;
        const endTimeValue = endTimeIndex !== -1 ? row[endTimeIndex] : null;

        // Consider a row "filled" if it has at least date and teacher
        const isRowFilled = dateValue && teacherValue;

        if (isRowFilled) {
          hasFoundFilledSession = true;
          lastFilledSessionRow = i;
        } else if (hasFoundFilledSession) {
          // If we find empty cells after having found filled ones,
          // this indicates we might be in the "future sessions" section
          hasEmptyCellsAfterFilled = true;
        }
      }
    }

    // Main validation loop
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

        // Calculate if this might be a future session based on pattern detection
        // If this row comes after the last filled row and we've found the empty-after-filled pattern
        const mightBeFutureSession = hasEmptyCellsAfterFilled && i > lastFilledSessionRow;

        // Validate date if column exists
        if (dateIndex !== -1) {
          const dateValue = row[dateIndex];

          if (dateValue) {
            // First check if it's a future date - if so, skip validation
            let isDateInFuture = false;
            let formattedDate = '';

            // Parse and check if date is in future
            if (typeof dateValue === 'string' && dateValue.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
              formattedDate = dateValue;
              const [day, month, year] = dateValue.split('.').map(Number);
              const sessionDate = new Date(year, month - 1, day);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              isDateInFuture = sessionDate > today;
            } else if (typeof dateValue === 'number') {
              // Handle Excel numeric dates
              try {
                const jsDate = excelDateToJSDate(dateValue);
                if (jsDate) {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  isDateInFuture = jsDate > today;
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
            if (!lastKnownDate && !mightBeFutureSession) {
              errors.push(`Row ${i + 1}: Session "${folienValue}" is missing a date and no previous date is available.`);
            }
          }
        }
        if (mightBeFutureSession) {
          continue;
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

          // Check if date is in the future
          let isFutureDate = false;

          if (typeof dateValue === 'string' && dateValue.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
            const [day, month, year] = dateValue.split('.').map(Number);
            const sessionDate = new Date(year, month - 1, day);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            isFutureDate = sessionDate > today;
          } else if (typeof dateValue === 'number') {
            try {
              const jsDate = excelDateToJSDate(dateValue);
              if (jsDate) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                isFutureDate = jsDate > today;
              }
            } catch (e) {
              // Already handled above
            }
          }

          // Skip validation for future dates completely
          if (!isFutureDate && !isCurrentMonth) {
            // Only validate non-future dates that aren't in current month
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
              const dateValue = dateIndex !== -1 ? row[dateIndex] : null;

              // Skip validation for future dates only
              let isFutureSession = false;
              if (dateValue) {
                isFutureSession = checkIsFutureDate(dateValue);
              }

              // Add special error for completed sessions (not future ones) without teacher
              if (!teacherValue && !isFutureSession) {
                errors.push(`Row ${i + 1}: Session "${folienValue}" is missing teacher information in the "Lehrer" column. All completed sessions must have a teacher assigned.`);
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