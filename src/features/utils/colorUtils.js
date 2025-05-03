// src/features/utils/colorUtils.js
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