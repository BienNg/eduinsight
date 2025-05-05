// src/features/import/services/index.js
// Export all service functions from a central location

import {
    excelDateToJSDate,
    formatDate,
    isDateBefore2020,
    isFutureDate,
    formatTime,
    parseDate
} from '../../../utils/dateUtils';

// Re-export for backward compatibility
export {
    excelDateToJSDate,
    formatDate,
    isDateBefore2020,
    isFutureDate,
    formatTime,
    parseDate
};

// Validators
export { validateExcelFile } from './validators/excelValidator';

// Parsers
export { parseExcelData, extractCourseInfo } from './parsers/excelParser';

// Formatters
export {
    excelDateToJSDate,
    formatDate,
    isDateBefore2020,
    isFutureDate
} from './formatters/dateFormatter';
export { formatTime } from './formatters/timeFormatter';

// Helpers
export { findColumnIndex } from './helpers/columnFinder';
export { isGreenColor, isRedColor, isLightColor } from './helpers/colorUtils';

// Keep the processor modules separate as they use these utility functions