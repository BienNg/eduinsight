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

    console.log("Extracting from title:", googleSheetTitle); // Debug log

    // Improved group extraction - handle spacing and dashes
    // This will match patterns like G42, G 42, etc.
    const groupMatch = googleSheetTitle.match(/([GAMP]\s*\d+)/i);
    if (groupMatch) {
        // Remove any spaces in the group name (e.g., "G 42" -> "G42")
        groupName = groupMatch[1].replace(/\s+/g, '');
    }

    // Extract mode (Online/Offline) - more flexible matching
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

    console.log("Extracted group name:", groupName); // Debug log

    return {
        groupName,
        mode,
        language,
        title: googleSheetTitle
    };
};

/**
 * Extract course level from sheet name or Google Sheet title
 * @param {string} sheetName - Name of the worksheet
 * @param {string} googleSheetTitle - Title of the Google Sheet
 * @returns {string} Extracted level (e.g., A1.1, B2)
 */
export const extractLevelFromSheetName = (sheetName, googleSheetTitle = '') => {
    console.log("Extracting level from sheet name:", sheetName);
    console.log("Extracting level from Google Sheet title:", googleSheetTitle);

    // First try to find detailed level patterns in sheet name
    let levelMatch = sheetName.match(/([AB][1-2](\.[1-2])?)/i);

    // If not found in sheet name, try Google Sheet title
    if (!levelMatch && googleSheetTitle) {
        // Look for patterns with separators like in "G42 - A1.2_Online_VN"
        levelMatch = googleSheetTitle.match(/[- _]([AB][1-2](\.[1-2])?)/i);

        // If not found with separators, try standard pattern
        if (!levelMatch) {
            levelMatch = googleSheetTitle.match(/([AB][1-2](\.[1-2])?)/i);
        }
    }

    if (levelMatch) {
        const extractedLevel = levelMatch[1].toUpperCase();
        console.log("Found level:", extractedLevel);
        return extractedLevel;
    }

    console.log("No level found");
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