// src/features/import/services/helpers/multiSheetCourseExtractor.js

/**
 * Extract group info from Google Sheet title
 * @param {string} googleSheetTitle - Title of the Google Sheet document
 * @returns {Object} Extracted group information
 */
export const extractGroupInfoFromTitle = (googleSheetTitle) => {
    // Initialize default values
    let groupName = '';
    let mode = 'Unknown';
    let language = 'DE'; // Default to German
    
    // Extract group name (e.g., G1, A2, M3, P4)
    const groupMatch = googleSheetTitle.match(/([GAMP]\d+)/i);
    if (groupMatch) {
      groupName = groupMatch[1];
    }
    
    // Extract mode (Online/Offline)
    if (googleSheetTitle.toLowerCase().includes('online')) {
      mode = 'Online';
    } else if (googleSheetTitle.toLowerCase().includes('offline')) {
      mode = 'Offline';
    }
    
    // Extract language (VN/DE)
    if (googleSheetTitle.toLowerCase().includes('vn') || 
        googleSheetTitle.toLowerCase().includes('vietnam')) {
      language = 'VN';
    }
    
    return {
      groupName,
      mode,
      language,
      title: googleSheetTitle
    };
  };
  
  /**
   * Extract course level from sheet name
   * @param {string} sheetName - Name of the worksheet
   * @returns {string} Extracted level (e.g., A1.1, B2)
   */
  export const extractLevelFromSheetName = (sheetName) => {
    // Look for standard level patterns like A1, A1.1, B2.2, etc.
    const levelMatch = sheetName.match(/([AB][1-2](\.[1-2])?)/i);
    
    if (levelMatch) {
      return levelMatch[1].toUpperCase();
    }
    
    return '';
  };
  
  /**
   * Create course name from group and sheet
   * @param {string} groupName - Name of the group (e.g., G1)
   * @param {string} sheetName - Name of the worksheet
   * @param {string} level - Extracted level (can be empty)
   * @returns {string} Formatted course name
   */
  export const createCourseName = (groupName, sheetName, level) => {
    if (!groupName) return sheetName;
    
    // Add level if available
    const levelPart = level ? ` ${level}` : '';
    
    return `${groupName}${levelPart} - ${sheetName}`;
  };