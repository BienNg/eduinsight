// src/features/import/services/helpers/columnFinder.js

/**
 * Find the index of a column in an Excel header row
 * @param {Array} headerRow - The Excel header row array
 * @param {string|Array} columnNames - Name(s) to search for
 * @returns {number} The index of the found column or -1 if not found
 */
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
  
  export default {
    findColumnIndex
  };