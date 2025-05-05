// src/features/import/services/validators/excelValidator.js
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { findColumnIndex } from '../helpers/columnFinder';
import { excelDateToJSDate, isDateBefore2020, isFutureDate } from '../formatters/dateFormatter';

/**
 * Validate sessions before processing
 * @param {Array} jsonData - The Excel data as JSON
 * @param {number} headerRowIndex - Index of the header row
 * @param {Object} columnIndices - Mapping of column types to indices
 * @returns {Array} List of validation errors
 */
const validateSessionsBeforeProcessing = (jsonData, headerRowIndex, columnIndices) => {
  const errors = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Process each row to pre-validate sessions
  for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
    const row = jsonData[i];

    // Skip empty rows
    if (!row || row.length === 0 || (row.length === 1 && !row[0])) {
      continue;
    }

    // Extract values using our column mapping
    const getValue = (index) => index !== -1 && index < row.length ? row[index] : null;

    const folienTitle = getValue(columnIndices.folien);
    const dateValue = getValue(columnIndices.date);
    const teacherValue = getValue(columnIndices.teacher);

    // Only check rows that appear to be session rows
    if (folienTitle && folienTitle.toString().trim() !== '') {
      // Check for completed sessions without teachers
      if (dateValue) {
        let formattedDate = '';
        let isFuture = false;

        // Format date and check if it's in the future
        if (typeof dateValue === 'string' && dateValue.includes('.')) {
          formattedDate = dateValue;
          const [day, month, year] = dateValue.split('.').map(Number);
          const sessionDate = new Date(year, month - 1, day);
          isFuture = sessionDate > today;
        } else if (typeof dateValue === 'number') {
          const jsDate = excelDateToJSDate(dateValue);
          if (jsDate) {
            isFuture = jsDate > today;
            const day = jsDate.getDate().toString().padStart(2, '0');
            const month = (jsDate.getMonth() + 1).toString().padStart(2, '0');
            const year = jsDate.getFullYear();
            formattedDate = `${day}.${month}.${year}`;
          }
        }

        // If it's a completed session (not in the future) and has no teacher, that's an error
        if (!isFuture && (!teacherValue || teacherValue.toString().trim() === '')) {
          errors.push(`Session "${folienTitle}" on ${formattedDate || 'unknown date'} is completed but has no teacher assigned. All completed sessions must have a teacher.`);
        }
      }
    }
  }

  return errors;
};

/**
 * Validate an Excel file for course import
 * @param {ArrayBuffer} arrayBuffer - Excel file as array buffer
 * @param {string} filename - Name of the file
 * @returns {Object} Validation results including errors and flags
 */
export const validateExcelFile = async (arrayBuffer, filename) => {
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
      return { errors, missingTimeColumns, hasOnlyTimeErrors: false };
    }

    // Get the header row
    const headerRow = jsonData[headerRowIndex];
    
    // Map column indices for crucial data
    const columnIndices = {
      folien: findColumnIndex(headerRow, ["Folien", "Canva"]),
      date: findColumnIndex(headerRow, ["Unterrichtstag", "Datum", "Tag", "Date", "Day"]),
      teacher: findColumnIndex(headerRow, "Lehrer"),
      startTime: findColumnIndex(headerRow, ["von"]),
      endTime: findColumnIndex(headerRow, ["bis"])
    };

    // Check for missing time columns
    if (columnIndices.startTime === -1 || columnIndices.endTime === -1) {
      missingTimeColumns = true;

      if (columnIndices.startTime === -1) {
        errors.push("Missing time column: von/from not found in the header row.");
      }

      if (columnIndices.endTime === -1) {
        errors.push("Missing time column: bis/to not found in the header row.");
      }
    }

    // Check required columns
    const requiredColumns = [
      ["Folien", "folien"],
      ["Unterrichtstag", "Datum", "Tag", "Date", "Day"],
      ["Lehrer", "lehrer", "Teacher"]
    ];

    for (const column of requiredColumns) {
      const columnIndex = findColumnIndex(headerRow, column);
      if (columnIndex === -1) {
        const columnName = Array.isArray(column) ? column.join(" or ") : column;
        errors.push(`Required column '${columnName}' not found in the header row.`);
      }
    }

    // Validate empty folien cells
    if (columnIndices.folien !== -1) {
      let emptyFolienCells = [];

      for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0) continue;

        const hasOtherData = row.some((cell, index) => index !== columnIndices.folien && cell);
        if (hasOtherData) {
          const folienCell = excelWorksheet.getRow(i + 1).getCell(columnIndices.folien + 1);
          
          if (!folienCell.value || folienCell.value.toString().trim() === '') {
            emptyFolienCells.push(i + 1);
          }
        }
      }

      emptyFolienCells.forEach(rowNum => {
        errors.push(`Row ${rowNum}: Empty cell in Folien column. All session rows must have a title.`);
      });
    }

    // Check for student names in header
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

    // Validate dates before 2020
    if (columnIndices.date !== -1) {
      for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0) continue;
        
        const dateValue = row[columnIndices.date];
        if (dateValue && isDateBefore2020(dateValue)) {
          const sessionTitle = row[columnIndices.folien] || `Row ${i + 1}`;
          errors.push(`Row ${i + 1}: Session "${sessionTitle}" has a date before 2020. All dates must be 2020 or later.`);
        }
      }
    }

    // Check session data consistency
    const sessionErrors = validateSessionsBeforeProcessing(jsonData, headerRowIndex, columnIndices);
    errors.push(...sessionErrors);

    // Check if all errors are related to time columns
    const hasOnlyTimeErrors = missingTimeColumns && errors.every(error =>
      error.includes('Missing time column:') ||
      error.includes('missing a start time') ||
      error.includes('missing an end time')
    );

    return { errors, missingTimeColumns, hasOnlyTimeErrors };

  } catch (error) {
    errors.push(`Error processing Excel file: ${error.message}`);
    return { errors, missingTimeColumns, hasOnlyTimeErrors: false };
  }
};

export default {
  validateExcelFile
};