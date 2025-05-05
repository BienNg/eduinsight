// src/utils/dateUtils.js

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
      // Create date at noon to avoid timezone issues
      return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    }
  
    // Handle Excel serial date numbers
    if (typeof excelDate === 'number') {
      // Excel's date system has a leap year bug from 1900
      const excelEpoch = new Date(Date.UTC(1899, 11, 30, 12, 0, 0));
      const millisecondsPerDay = 24 * 60 * 60 * 1000;
  
      // Create date at UTC noon to avoid timezone shifts
      const date = new Date(excelEpoch.getTime() + (excelDate * millisecondsPerDay));
  
      // Validate the converted date
      if (date.getUTCFullYear() === 1900 && date.getUTCMonth() === 0 && date.getUTCDate() === 1) {
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
    const year = jsDate.getUTCFullYear();
    if (year < 2020 || year > 2030) {
      console.warn('Suspicious year detected:', year);
      return '';
    }
  
    const day = jsDate.getUTCDate().toString().padStart(2, '0');
    const month = (jsDate.getUTCMonth() + 1).toString().padStart(2, '0');
    return `${day}.${month}.${year}`;
  };
  
  /**
   * Format a time value (string, Date, or Excel time) to HH:MM format
   * @param {string|Date|number} value - Time value to format
   * @returns {string} Formatted time string
   */
  export const formatTime = (value) => {
    if (!value) return '';
  
    // If it's already a string in HH:MM format
    if (typeof value === 'string' && value.includes(':')) {
      return value;
    }
  
    // If it's a JS Date object
    if (value instanceof Date) {
      const hours = value.getUTCHours().toString().padStart(2, '0');
      const minutes = value.getUTCMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  
    // If it's an Excel time (decimal fraction of day)
    if (typeof value === 'number') {
      const totalMinutes = Math.round(value * 24 * 60);
      const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
      const minutes = (totalMinutes % 60).toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  
    return '';
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
      return jsDate && jsDate.getUTCFullYear() < 2020;
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
    today.setUTCHours(0, 0, 0, 0);
  
    if (typeof dateValue === 'string' && dateValue.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
      const [day, month, year] = dateValue.split('.').map(Number);
      const sessionDate = new Date(Date.UTC(year, month - 1, day));
      return sessionDate > today;
    }
  
    if (typeof dateValue === 'number') {
      const jsDate = excelDateToJSDate(dateValue);
      return jsDate ? jsDate > today : false;
    }
  
    return false;
  };
  
  /**
   * Parse a date string into a Date object
   * @param {string} dateString - Date string in DD.MM.YYYY format
   * @returns {Date|null} JavaScript Date object or null if invalid
   */
  export const parseDate = (dateString) => {
    if (!dateString) return null;
    
    if (dateString.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
      const [day, month, year] = dateString.split('.').map(Number);
      return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    }
    
    return null;
  };
  
  export default {
    excelDateToJSDate,
    formatDate,
    formatTime,
    isDateBefore2020,
    isFutureDate,
    parseDate
  };