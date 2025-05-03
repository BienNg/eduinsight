// src/features/utils/__tests__/timeUtils.test.js
import { calculateTotalHours } from '../timeUtils';
import { isLongSession } from '../sessionUtils';

describe('calculateTotalHours', () => {
  test('calculates total hours based on session durations', () => {
    // Create a date string for today in DD.MM.YYYY format
    const today = new Date();
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear();
    const dateString = `${day}.${month}.${year}`;
    
    const sessions = [
      { id: '1', title: 'Session 1', date: dateString, duration: 1.5 },
      { id: '2', title: 'Session 2', date: dateString, duration: 1.5 },
      { id: '3', title: 'Session 3', date: dateString, duration: 1.5 }
    ];
    
    expect(calculateTotalHours(sessions)).toBe(4.5);
  });
  
  test('returns 0 for empty array', () => {
    expect(calculateTotalHours([])).toBe(0);
  });
  
  test('returns 0 for null or undefined input', () => {
    expect(calculateTotalHours(null)).toBe(0);
    expect(calculateTotalHours(undefined)).toBe(0);
  });
});

describe('isLongSession', () => {
  // Tests for isLongSession remain unchanged
  test('returns true when session is at least 1h50m long', () => {
    expect(isLongSession('14:00', '15:50')).toBe(true);
    expect(isLongSession('14:00', '16:00')).toBe(true);
  });
  
  test('returns false when session is less than 1h50m long', () => {
    expect(isLongSession('14:00', '15:49')).toBe(false);
    expect(isLongSession('14:00', '15:30')).toBe(false);
  });
  
  test('handles midnight crossing correctly', () => {
    // Session from 23:00 to 01:00 next day (2 hours)
    expect(isLongSession('23:00', '01:00')).toBe(true);
  });
  
  test('returns false for invalid or missing time inputs', () => {
    expect(isLongSession(null, '15:00')).toBe(false);
    expect(isLongSession('14:00', null)).toBe(false);
    expect(isLongSession('', '')).toBe(false);
  });
});