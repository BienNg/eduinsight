// src/features/utils/__tests__/colorUtils.test.js
import { isLightColor } from '../colorUtils';

describe('isLightColor', () => {
  test('identifies light colors correctly', () => {
    expect(isLightColor('#FFFFFF')).toBe(true); // White
    expect(isLightColor('#F0F0F0')).toBe(true); // Light gray
    expect(isLightColor('#FFD700')).toBe(true); // Gold
  });
  
  test('identifies dark colors correctly', () => {
    expect(isLightColor('#000000')).toBe(false); // Black
    expect(isLightColor('#0000FF')).toBe(false); // Blue
    expect(isLightColor('#800080')).toBe(false); // Purple
  });
  
  test('handles hex codes with or without #', () => {
    expect(isLightColor('FFFFFF')).toBe(true);
    expect(isLightColor('#FFFFFF')).toBe(true);
  });
  
  test('returns true for empty or invalid inputs', () => {
    expect(isLightColor('')).toBe(true);
    expect(isLightColor(null)).toBe(true);
    expect(isLightColor('invalid')).toBe(true);
  });
});