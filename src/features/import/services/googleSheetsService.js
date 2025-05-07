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
    
    // Extract filename from the URL or use a default name
    const filename = `GoogleSheet_${sheetId}.xlsx`;
    
    // Parse workbook to get all sheet names
    const workbook = XLSX.read(response.data, { type: 'array' });
    const sheetNames = workbook.SheetNames;
    
    // Check if this is a multi-sheet workbook (more than one sheet)
    const isMultiSheet = sheetNames.length > 1;
    
    // Extract Google Sheet title (for group naming)
    // We'll need to get this from the document title
    // This will be handled by a separate API call to get document metadata
    
    return {
      arrayBuffer: response.data,
      filename,
      isMultiSheet,
      sheetNames,
      sheetId
    };
  } catch (error) {
    if (error.response && error.response.status === 403) {
      throw new Error('Cannot access this Google Sheet. Make sure it\'s shared publicly or with view access.');
    }
    throw error;
  }
};

// New function to fetch Google Sheet metadata (title)
export const fetchGoogleSheetTitle = async (sheetId) => {
  try {
    // Using a public endpoint that returns metadata about the document
    // This is not an official API but works for public documents
    const metadataUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
    
    const response = await axios.get(metadataUrl);
    
    // Extract title from HTML response using regex
    const titleMatch = response.data.match(/<title>(.*?)<\/title>/);
    const title = titleMatch ? titleMatch[1].replace(' - Google Sheets', '') : '';
    
    return title;
  } catch (error) {
    console.error('Error fetching Google Sheet title:', error);
    return ''; // Return empty string if we can't get the title
  }
};