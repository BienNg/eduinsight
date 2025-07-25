// src/features/import/services/googleSheetsService.js

import axios from 'axios';
import * as XLSX from 'xlsx';

// Existing function to extract sheet ID
export const extractSheetId = (url) => {
  const regex = /\/d\/([a-zA-Z0-9-_]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

// Enhanced function to fetch Google Sheet with all worksheets
export const fetchGoogleSheet = async (sheetsUrl) => {
  try {
    const sheetId = extractSheetId(sheetsUrl);

    if (!sheetId) {
      throw new Error('Invalid Google Sheets URL format');
    }

    // Get sheet data using Google Sheets API
    const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;

    // Fetch the sheet as an Excel file
    const response = await axios.get(exportUrl, {
      responseType: 'arraybuffer'
    });

    if (!response.data) {
      throw new Error('Failed to fetch Google Sheet data');
    }

    // Parse workbook to get all sheet names
    const workbook = XLSX.read(response.data, { type: 'array' });
    const sheetNames = workbook.SheetNames;

    // Check if this is a multi-sheet workbook (more than one sheet)
    const isMultiSheet = sheetNames.length > 1;

    // Get Google Sheet title
    const sheetTitle = await fetchGoogleSheetTitle(sheetId);

    // Create filename based on whether it's single or multi-sheet
    let filename;
    if (!isMultiSheet && sheetTitle && sheetTitle.trim() !== '') {
      // For single sheets, use the actual Google Sheet title
      // Sanitize the title to make it safe for use as a filename
      const sanitizedTitle = sheetTitle.trim()
        .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid filename characters
        .replace(/\s+/g, ' ') // Normalize whitespace
        .substring(0, 100); // Limit length to prevent overly long filenames
      
      filename = `${sanitizedTitle}.xlsx`;
    } else {
      // For multi-sheet or when title is not available, use the sheet ID
      filename = `GoogleSheet_${sheetId}.xlsx`;
    }

    // Return the full workbook for better handling
    return {
      arrayBuffer: response.data,
      rawWorkbook: workbook, // Include the raw workbook object
      filename,
      isMultiSheet,
      sheetNames,
      sheetId,
      sheetTitle
    };
  } catch (error) {
    if (error.response && error.response.status === 403) {
      throw new Error('Cannot access this Google Sheet. Make sure it\'s shared publicly or with view access.');
    }
    throw error;
  }
};

// Add a new helper function to extract an individual sheet
export const extractSheetFromWorkbook = (workbook, sheetName) => {
  if (!workbook || !workbook.Sheets || !workbook.Sheets[sheetName]) {
    throw new Error(`Sheet "${sheetName}" not found in workbook`);
  }

  // Create a new workbook with just this sheet
  const singleSheetWorkbook = {
    SheetNames: [sheetName],
    Sheets: {
      [sheetName]: workbook.Sheets[sheetName]
    }
  };

  // Convert back to array buffer
  return XLSX.write(singleSheetWorkbook, {
    bookType: 'xlsx',
    type: 'array'
  });
};

// New function to fetch Google Sheet metadata (title)
export const fetchGoogleSheetTitle = async (sheetId) => {
  try {
    // Use public API endpoints that provide metadata
    const metadataUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/`;

    const response = await axios.get(metadataUrl);

    // Extract title using regex - more robust pattern
    const titleMatch = response.data.match(/<title>(.*?)( - Google Sheets)?<\/title>/i);
    let title = titleMatch ? titleMatch[1] : '';

    // Remove .xlsx extension if present in the title
    title = title.replace(/\.xlsx$/i, '');

    console.log("Retrieved Google Sheet title:", title); // Debug log

    return title;
  } catch (error) {
    console.error('Error fetching Google Sheet title:', error);
    return ''; // Return empty string if we can't get the title
  }
};

