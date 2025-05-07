// src/features/import/services/parsers/excelParser.js
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { findColumnIndex } from '../helpers/columnFinder';

/**
 * Parse an Excel file's buffer and return structured data
 * @param {ArrayBuffer} arrayBuffer - Excel file buffer
 * @returns {Object} Parsed data and worksheet information
 */
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
  for (let i = 0; i < jsonData.length && i < 30; i++) {
    if (jsonData[i][0] === "Folien" || jsonData[i][0] === "Canva") {
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

/**
 * Extract course information from filename and sheet data
 * @param {string} filename - Name of the file being processed
 * @param {Array} jsonData - Parsed JSON data from Excel
 * @param {string} sheetName - Name of the sheet being processed
 * @returns {Object} Extracted course information
 */
export const extractCourseInfo = (filename, jsonData, sheetName) => {
  console.log("Extracting course info from:", filename); // Debug log

  let groupName = '';
  let level = '';
  let mode = 'Unknown';

  console.log("Extracting course info from:", filename); // Debug log

  // 1. Try to get group from filename first (standard approach)
  const filenameGroupMatch = filename.match(/([GAMP]\d+)/i);
  if (filenameGroupMatch) {
    groupName = filenameGroupMatch[1];
    console.log("Found group in filename:", groupName); // Debug log
  }

  // If no group found, check sheet name as last resort
  if (!groupName && sheetName) {
    const sheetNameGroupMatch = sheetName.match(/([GAMP]\d+)/i);
    if (sheetNameGroupMatch) {
      groupName = sheetNameGroupMatch[1];
      console.log("Found group in sheet name:", groupName); // Debug log
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
  if (onlineMatch) {
    mode = 'Online';
  } else if (offlineMatch) {
    mode = 'Offline';
  } else {
    // If not specified, default to "Unknown" but log for debugging
    console.log(`Mode not detected in filename "${filename}" or sheet "${sheetName}"`);
    mode = 'Unknown';
  }


  // Validate mode
  if (mode === 'Unknown') {
    throw new Error(`Course mode (Online/Offline) not specified for ${groupName}. Please include 'Online' or 'Offline' in the filename. For example: "${groupName}_${level}_Online.xlsx"`);
  }
  console.log("Extracted mode:", mode, "from patterns:", {
    onlineMatch: !!onlineMatch,
    offlineMatch: !!offlineMatch
  });
  return {
    groupName,
    level,
    mode,
    courseType
  };
};

export default {
  parseExcelData,
  extractCourseInfo
};