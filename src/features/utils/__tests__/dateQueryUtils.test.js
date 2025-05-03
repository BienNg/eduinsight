// src/features/utils/__tests__/dateQueryUtils.test.js
import { formatMonthId, getCurrentMonthRange, getPreviousMonthRange } from '../dateQueryUtils';

describe('formatMonthId', () => {
  test('formats date into month ID string', () => {
    const date = new Date(2025, 0, 15); // January 15, 2025
    expect(formatMonthId(date)).toBe('01.2025');
    
    const date2 = new Date(2025, 11, 31); // December 31, 2025
    expect(formatMonthId(date2)).toBe('12.2025');
  });
});

describe('getCurrentMonthRange', () => {
  // We need to mock the date to make tests deterministic
  const originalDate = global.Date;
  
  beforeEach(() => {
    // Mock the current date to May 3, 2025
    global.Date = class extends Date {
      constructor(...args) {
        if (args.length === 0) {
          return new originalDate(2025, 4, 3); // May 3, 2025
        }
        return new originalDate(...args);
      }
    };
  });
  
  afterEach(() => {
    global.Date = originalDate;
  });
  
  test('returns correct range for current month', () => {
    const { firstDay, lastDay } = getCurrentMonthRange();
    
    expect(firstDay.getFullYear()).toBe(2025);
    expect(firstDay.getMonth()).toBe(4); // May is 4 (0-indexed)
    expect(firstDay.getDate()).toBe(1);
    
    expect(lastDay.getFullYear()).toBe(2025);
    expect(lastDay.getMonth()).toBe(4); // May is 4 (0-indexed)
    expect(lastDay.getDate()).toBe(31); // May has 31 days
  });
});

describe('getPreviousMonthRange', () => {
  const originalDate = global.Date;
  
  beforeEach(() => {
    // Mock the current date to May 3, 2025
    global.Date = class extends Date {
      constructor(...args) {
        if (args.length === 0) {
          return new originalDate(2025, 4, 3); // May 3, 2025
        }
        return new originalDate(...args);
      }
    };
  });
  
  afterEach(() => {
    global.Date = originalDate;
  });
  
  test('returns correct range for previous month', () => {
    const { firstDay, lastDay } = getPreviousMonthRange();
    
    expect(firstDay.getFullYear()).toBe(2025);
    expect(firstDay.getMonth()).toBe(3); // April is 3 (0-indexed)
    expect(firstDay.getDate()).toBe(1);
    
    expect(lastDay.getFullYear()).toBe(2025);
    expect(lastDay.getMonth()).toBe(3); // April is 3 (0-indexed)
    expect(lastDay.getDate()).toBe(30); // April has 30 days
  });
});