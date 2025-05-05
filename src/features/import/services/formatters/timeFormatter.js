// src/features/import/services/formatters/timeFormatter.js

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
      const hours = value.getHours().toString().padStart(2, '0');
      const minutes = value.getMinutes().toString().padStart(2, '0');
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
  
  export default {
    formatTime
  };