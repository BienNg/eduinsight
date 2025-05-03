// src/features/import/services/googleSheetsService.js
import axios from 'axios';

// Extract the sheet ID from a Google Sheets URL
export const extractSheetId = (url) => {
  const regex = /\/d\/([a-zA-Z0-9-_]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

// Fetch Google Sheets data and convert to a format we can process
export const fetchGoogleSheet = async (sheetsUrl) => {
  try {
    const sheetId = extractSheetId(sheetsUrl);
    
    if (!sheetId) {
      throw new Error('Invalid Google Sheets URL format');
    }
    
    // Get sheet data using Google Sheets API
    // For publicly accessible sheets, we can use the export feature
    const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
    
    // Fetch the sheet as an Excel file
    const response = await axios.get(exportUrl, {
      responseType: 'arraybuffer'
    });
    
    if (!response.data) {
      throw new Error('Failed to fetch Google Sheet data');
    }
    
    // Extract filename from the URL or use a default name
    const filename = `GoogleSheet_${sheetId}.xlsx`;
    
    // Return the arraybuffer and filename
    return {
      arrayBuffer: response.data,
      filename
    };
  } catch (error) {
    if (error.response && error.response.status === 403) {
      throw new Error('Cannot access this Google Sheet. Make sure it\'s shared publicly or with view access.');
    }
    throw error;
  }
};