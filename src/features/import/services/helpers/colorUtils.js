// src/features/import/services/helpers/colorUtils.js

export const isGreenColor = (argb) => {
  if (!argb) return false;

  // Common green color codes in Excel
  const greenCodes = [
    'FF00FF00', 'FF92D050', 'FF00B050', 'FF00B640',
    'FFD9EAD3', 'FF9BBB59', 'FF00B800', 'FF70AD47',
    // Add more common green codes
    '92D050', '00FF00', '00B050', 'CCFFCC'
  ];

  // First try direct matching
  for (const code of greenCodes) {
    if (argb.includes(code)) return true;
  }

  // If no direct match, try RGB analysis
  try {
    // Handle both ARGB (8 chars) and RGB (6 chars) formats
    let startPos = 0;
    if (argb.length === 8) startPos = 2;

    const r = parseInt(argb.substr(startPos, 2), 16) || 0;
    const g = parseInt(argb.substr(startPos + 2, 2), 16) || 0;
    const b = parseInt(argb.substr(startPos + 4, 2), 16) || 0;

    // Check if green is dominant
    return (g > r + 20) && (g > b + 20);
  } catch (error) {
    console.error(`Error analyzing color: ${argb}`, error);
    return false;
  }
};

export const isRedColor = (argb) => {
  if (!argb) return false;

  // Common red color codes in Excel
  const redCodes = [
    'FFFF0000', 'FFC00000', 'FFFF99CC', 'FFFFCCCC',
    'FFFF6666', 'FFC0504D', 'FFEA9999', 'FFFF0000',
    // Add more common red codes
    'FF0000', 'FFC7CE', 'C00000'
  ];

  // First try direct matching
  for (const code of redCodes) {
    if (argb.includes(code)) return true;
  }

  // If no direct match, try RGB analysis
  try {
    // Handle both ARGB (8 chars) and RGB (6 chars) formats
    let startPos = 0;
    if (argb.length === 8) startPos = 2;

    const r = parseInt(argb.substr(startPos, 2), 16) || 0;
    const g = parseInt(argb.substr(startPos + 2, 2), 16) || 0;
    const b = parseInt(argb.substr(startPos + 4, 2), 16) || 0;

    // Check if red is dominant or if it's pink (high red and blue)
    return (r > g + 20 && r > b + 20) ||
      (r > g - 20 && r > 200 && b > 200);
  } catch (error) {
    console.error(`Error analyzing color: ${argb}`, error);
    return false;
  }
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