// src/features/import/services/formatters/dateFormatter.js

/**
 * Convert Excel date serial number to JS Date object
 * @param {number|string} excelDate - Excel date value
 * @returns {Date|null} JavaScript Date object or null if invalid
 */
export const excelDateToJSDate = (excelDate) => {
    if (!excelDate) return null;

    // If it's already a string in DD.MM.YYYY format, parse it directly
    if (typeof excelDate === 'string' && excelDate.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
        const [day, month, year] = excelDate.split('.').map(Number);
        // Create date directly without using UTC to avoid timezone conversion
        return new Date(year, month - 1, day);
    }

    // Handle Excel serial date numbers
    if (typeof excelDate === 'number') {
        // Excel's date system has a leap year bug from 1900
        const excelEpoch = new Date(1899, 11, 30); // Local date instead of UTC
        const millisecondsPerDay = 24 * 60 * 60 * 1000;

        // Don't add timezone offset as we're using local dates
        const date = new Date(excelEpoch.getTime() + (excelDate * millisecondsPerDay));

        // Validate the converted date
        if (date.getFullYear() === 1900 && date.getMonth() === 0 && date.getDate() === 1) {
            console.warn('Invalid Excel date detected:', excelDate);
            return null;
        }

        return date;
    }

    return null;
};

/**
 * Format a JS Date object to DD.MM.YYYY string
 * @param {Date} jsDate - JavaScript Date object
 * @returns {string} Formatted date string
 */
export const formatDate = (jsDate) => {
    if (!jsDate || !(jsDate instanceof Date) || isNaN(jsDate)) {
        console.warn('Invalid date object:', jsDate);
        return '';
    }

    // Validate the year is reasonable
    const year = jsDate.getFullYear(); // Use getFullYear instead of getUTCFullYear
    if (year < 2020 || year > 2030) {
        console.warn('Suspicious year detected:', year);
        return '';
    }

    // Use local date values instead of UTC to avoid timezone conversion issues
    const day = jsDate.getDate().toString().padStart(2, '0');
    const month = (jsDate.getMonth() + 1).toString().padStart(2, '0');
    return `${day}.${month}.${year}`;
};

/**
 * Check if a date value is before 2020
 * @param {number|string} dateValue - Excel date value
 * @returns {boolean} True if date is before 2020
 */
export const isDateBefore2020 = (dateValue) => {
    if (!dateValue) return false;

    if (typeof dateValue === 'string' && dateValue.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
        const [day, month, year] = dateValue.split('.').map(Number);
        return year < 2020;
    }

    if (typeof dateValue === 'number') {
        const jsDate = excelDateToJSDate(dateValue);
        return jsDate && jsDate.getFullYear() < 2020;
    }

    return false;
};

/**
 * Check if a date is in the future
 * @param {number|string} dateValue - Excel date value
 * @returns {boolean} True if date is in the future
 */
export const isFutureDate = (dateValue) => {
    if (!dateValue) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (typeof dateValue === 'string' && dateValue.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
        const [day, month, year] = dateValue.split('.').map(Number);
        const sessionDate = new Date(year, month - 1, day);
        return sessionDate > today;
    }

    if (typeof dateValue === 'number') {
        const jsDate = excelDateToJSDate(dateValue);
        return jsDate ? jsDate > today : false;
    }

    return false;
};

export default {
    excelDateToJSDate,
    formatDate,
    isDateBefore2020,
    isFutureDate
};