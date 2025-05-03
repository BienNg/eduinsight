// src/features/utils/__tests__/sessionUtils.test.js
import { 
    isLongSession, 
    countLongSessions,
    detectWeekdayPatternWithOutliers,
    calculateSessionDuration
  } from '../sessionUtils';
  
  describe('isLongSession', () => {
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
  
  describe('countLongSessions', () => {
    test('counts long sessions correctly', () => {
      const sessions = [
        { startTime: '14:00', endTime: '16:00' }, // Long (2h)
        { startTime: '10:00', endTime: '11:30' }, // Not long (1h30m)
        { startTime: '18:00', endTime: '20:00' }  // Long (2h)
      ];
      
      expect(countLongSessions(sessions)).toBe(2);
    });
    
    test('returns 0 for empty or invalid input', () => {
      expect(countLongSessions([])).toBe(0);
      expect(countLongSessions(null)).toBe(0);
      expect(countLongSessions(undefined)).toBe(0);
    });
  });
  
  describe('detectWeekdayPatternWithOutliers', () => {
    test('detects weekly pattern correctly', () => {
      const sessions = [
        { id: '1', date: '01.01.2025' }, // Wednesday
        { id: '2', date: '08.01.2025' }, // Wednesday
        { id: '3', date: '15.01.2025' }, // Wednesday
        { id: '4', date: '22.01.2025' }, // Wednesday
        { id: '5', date: '10.01.2025' }  // Friday (outlier)
      ];
      
      const result = detectWeekdayPatternWithOutliers(sessions);
      
      expect(result.pattern).toContain('Wednesday');
      expect(result.outliers).toHaveLength(1);
      expect(result.outliers[0].weekday).toBe('Friday');
    });
    
    test('returns empty results for empty input', () => {
      const result = detectWeekdayPatternWithOutliers([]);
      
      expect(result.pattern).toHaveLength(0);
      expect(result.outliers).toHaveLength(0);
    });
  });
  
  describe('calculateSessionDuration', () => {
    test('calculates G-Online duration correctly', () => {
      // Standard G-Online session
      expect(calculateSessionDuration('G', 'Online', false, '14:00', '15:30')).toBe(1.5);
      
      // First G-Online session which is long
      expect(calculateSessionDuration('G', 'Online', true, '14:00', '16:00')).toBe(2.0);
      
      // First G-Online session which is NOT long
      expect(calculateSessionDuration('G', 'Online', true, '14:00', '15:30')).toBe(1.5);
    });
    
    test('calculates other group types duration correctly', () => {
      expect(calculateSessionDuration('G', 'Offline', false, '14:00', '16:30')).toBe(2.5);
      expect(calculateSessionDuration('A', 'Online', false, '14:00', '15:30')).toBe(1.5);
      expect(calculateSessionDuration('P', 'Offline', false, '14:00', '15:30')).toBe(1.5);
      expect(calculateSessionDuration('M', 'Online', false, '14:00', '15:15')).toBe(1.25);
    });
  });