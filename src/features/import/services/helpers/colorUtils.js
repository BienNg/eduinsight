// src/features/import/services/helpers/colorUtils.js

/**
 * Check if an ARGB color value is a green color
 * @param {string} argb - ARGB color string
 * @returns {boolean} True if the color is green
 */
export const isGreenColor = (argb) => {
    if (!argb) return false;
    
    // Common green color codes in Excel
    const greenCodes = [
      'FF00FF00', // Pure green
      'FF92D050', // Light green
      'FF00B050', // Medium green
      'FF00B640', // Another green variant
      'FFD9EAD3', // Light green (from your spreadsheet)
      'FF9BBB59', // Olive green
      'FF00B800', // Bright green
      'FF70AD47'  // Dark green
    ];
  
    return greenCodes.some(code => argb.includes(code));
  };
  
  /**
   * Check if an ARGB color value is a red color
   * @param {string} argb - ARGB color string
   * @returns {boolean} True if the color is red
   */
  export const isRedColor = (argb) => {
    if (!argb) return false;
  
    // Extract RGB components
    const r = parseInt(argb.substr(2, 2), 16) || 0;
    const g = parseInt(argb.substr(4, 2), 16) || 0;
    const b = parseInt(argb.substr(6, 2), 16) || 0;
  
    // Check if it's predominantly red or pink
    return (r > (g + 20) && r > (b + 20)) ||
      (r > (g - 20) && r > 200 && b > 200); // For pinks (high red and blue)
  };
  
  /**
   * Check if a hex color is light or dark
   * @param {string} hexColor - Hex color string
   * @returns {boolean} True if the color is light
   */
  export const isLightColor = (hexColor) => {
    if (!hexColor || hexColor === '') return true;
    
    // Remove # if it exists
    hexColor = hexColor.replace('#', '');
    
    // Validate hex format (must be a valid 6-digit hex code)
    if (!/^[0-9A-F]{6}$/i.test(hexColor)) return true;
    
    // Convert to RGB
    const r = parseInt(hexColor.substr(0, 2), 16);
    const g = parseInt(hexColor.substr(2, 2), 16);
    const b = parseInt(hexColor.substr(4, 2), 16);
    
    // Calculate brightness
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Return true if color is light
    return brightness > 128;
  };
  
  export default {
    isGreenColor,
    isRedColor,
    isLightColor
  };