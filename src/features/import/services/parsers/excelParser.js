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

  // Level detection with improved patterns to handle your specific format
  console.log("Starting level detection for group type:", courseType);
  console.log("Filename for level detection:", filename);

  // Level detection based on course type
  if (courseType === 'A') {
    // Leave level empty for type A courses
    level = '';
    console.log("A-type course, level detection skipped");
  } else {
    // For your specific format: "G42 - A1.2_Online_VN"
    // Look for patterns with dashes or other separators

    // Pattern that matches level after a dash or space
    let detailedLevelMatch = filename.match(/[- _]([AB][12]\.[12])/i);
    if (detailedLevelMatch) {
      level = detailedLevelMatch[1].toUpperCase();
      console.log("Found detailed level after separator:", level);
    }
    // If not found with separator, try standard pattern
    else {
      detailedLevelMatch = filename.match(/([AB][12]\.[12])/i);
      if (detailedLevelMatch) {
        level = detailedLevelMatch[1].toUpperCase();
        console.log("Found detailed level with standard pattern:", level);
      }
    }

    // If detailed level not found, try simple level with separators
    if (!level) {
      let simpleLevelMatch = filename.match(/[- _]([AB][12])(?!\.[12])/i);
      if (simpleLevelMatch) {
        level = simpleLevelMatch[1].toUpperCase();
        console.log("Found simple level after separator:", level);
      }
      // If not found with separator, try standard pattern
      else {
        simpleLevelMatch = filename.match(/([AB][12])(?!\.[12])/i);
        if (simpleLevelMatch) {
          level = simpleLevelMatch[1].toUpperCase();
          console.log("Found simple level with standard pattern:", level);
        }
      }
    }

    // Check sheet name if level not found in filename
    if (!level && sheetName) {
      let sheetLevelMatch = sheetName.match(/([AB][12](?:\.[12])?)/i);
      if (sheetLevelMatch) {
        level = sheetLevelMatch[1].toUpperCase();
        console.log("Found level in sheet name:", level);
      }
    }

    // Log if no level found
    if (!level) {
      console.error("No level found for non-A type course:", courseType);
      throw new Error(`Level information (e.g., A1, B2.1) not found for ${groupName}. Please include level information in the filename or rename the file to include the level (e.g., ${groupName}_A1_Online.xlsx).`);
    }
  }

  // Extract online/offline status
  console.log("Starting mode detection");

  if (filename.toLowerCase().includes('online')) {
    mode = 'Online';
    console.log("Found 'Online' in filename");
  } else if (filename.toLowerCase().includes('offline')) {
    mode = 'Offline';
    console.log("Found 'Offline' in filename");
  } else if (sheetName && sheetName.toLowerCase().includes('online')) {
    mode = 'Online';
    console.log("Found 'Online' in sheet name");
  } else if (sheetName && sheetName.toLowerCase().includes('offline')) {
    mode = 'Offline';
    console.log("Found 'Offline' in sheet name");
  }

  // Validate mode
  if (mode === 'Unknown') {
    console.error("Mode not detected in filename or sheet name");
    throw new Error(`Course mode (Online/Offline) not specified for ${groupName}. Please include 'Online' or 'Offline' in the filename. For example: "${groupName}_${level}_Online.xlsx"`);
  }

  console.log("Final extracted course info:", { groupName, level, mode, courseType });

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