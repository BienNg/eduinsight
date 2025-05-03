// src/features/import/services/__tests__/firebaseService.test.js

// 1. Import jest
import { jest } from '@jest/globals';

// 2. Define mock functions before mocking modules
const mockPush = jest.fn().mockReturnValue({ key: 'mock-id' });
const mockSet = jest.fn().mockResolvedValue(undefined);
const mockGet = jest.fn().mockImplementation(() => ({
  exists: () => true,
  val: () => ({ id: 'mock-id', name: 'Test Record' })
}));
const mockUpdate = jest.fn().mockResolvedValue(undefined);
const mockRef = jest.fn().mockReturnValue({});

// 3. Mock database functions
const mockCreateRecord = jest.fn().mockImplementation((collection, data) => {
  return Promise.resolve({ id: 'mock-id', ...data });
});
const mockUpdateRecord = jest.fn().mockResolvedValue({});
const mockGetAllRecords = jest.fn().mockImplementation((collection) => {
  if (collection === 'groups') {
    return Promise.resolve([
      { id: 'group1', name: 'G1', courseIds: ['course1'] }
    ]);
  }
  if (collection === 'teachers') {
    return Promise.resolve([
      { id: 'teacher1', name: 'John Smith', courseIds: ['course1'] }
    ]);
  }
  return Promise.resolve([]);
});
const mockGetRecordById = jest.fn().mockImplementation((collection, id) => {
  if (collection === 'months' && id === '2025-01') {
    return Promise.resolve({
      id: '2025-01',
      name: 'January 2025',
      year: '2025',
      month: '01'
    });
  }
  return Promise.resolve(null);
});
const mockCleanupEmptyGroups = jest.fn().mockResolvedValue(undefined);

// 4. Mock modules
jest.mock('firebase/database', () => ({
  ref: mockRef,
  push: mockPush,
  set: mockSet,
  get: mockGet,
  update: mockUpdate
}));

jest.mock('../../../firebase/database', () => ({
  createRecord: mockCreateRecord,
  updateRecord: mockUpdateRecord,
  getAllRecords: mockGetAllRecords,
  getRecordById: mockGetRecordById,
  cleanupEmptyGroups: mockCleanupEmptyGroups
}));

jest.mock('../../../firebase/config', () => ({
  database: {}
}));

// 5. Import the functions to test
import { 
  getNextGroupColor, 
  getOrCreateGroupRecord, 
  normalizeTeacherName, 
  createTeacherRecord,
  createOrUpdateStudentRecord,
  getOrCreateMonthRecord,
  findExistingCourse
} from '../firebaseService';

describe('Firebase Service Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNextGroupColor', () => {
    test('returns a color from the predefined list', async () => {
      // Mock the Firebase methods for this specific test
      mockGet.mockImplementationOnce(() => ({
        exists: () => false,
        val: () => null
      }));
      
      // Act
      const color = await getNextGroupColor();
      
      // Assert
      expect(color).toMatch(/#[0-9A-F]{6}/i);
    });
  });

  describe('getOrCreateGroupRecord', () => {
    test('creates a new group if it does not exist', async () => {
      // Arrange
      mockGetAllRecords.mockResolvedValueOnce([]);
      mockCreateRecord.mockResolvedValueOnce({
        id: 'new-group-id',
        name: 'G10',
        mode: 'Online',
        type: 'G',
        courseIds: []
      });
      
      // Act
      const result = await getOrCreateGroupRecord('G10', 'Online');
      
      // Assert
      expect(result.name).toBe('G10');
      expect(result.mode).toBe('Online');
      expect(mockCreateRecord).toHaveBeenCalled();
    });
  });

  describe('normalizeTeacherName', () => {
    test('normalizes teacher names correctly', () => {
      expect(normalizeTeacherName(' John Doe ')).toBe('john doe');
      expect(normalizeTeacherName('MARÍA GARCÍA')).toBe('maría garcía');
    });
  });

  // Add more test cases for other functions
});