// src/features/firebase/__tests__/database.test.js

// 1. First, import the jest testing framework
import { jest } from '@jest/globals';

// 2. Declare mock functions BEFORE mocking modules
const mockPush = jest.fn().mockReturnValue({ key: 'mock-id' });
const mockSet = jest.fn().mockResolvedValue(undefined);
const mockGet = jest.fn().mockImplementation(() => ({
  exists: () => true,
  val: () => ({ id: 'mock-id', name: 'Test Record' })
}));
const mockUpdate = jest.fn().mockResolvedValue(undefined);
const mockRemove = jest.fn().mockResolvedValue(undefined);
const mockRef = jest.fn().mockReturnValue({});

// 3. Mock modules BEFORE importing the code that uses them
jest.mock('firebase/database', () => ({
  ref: mockRef,
  push: mockPush,
  set: mockSet,
  get: mockGet,
  update: mockUpdate,
  remove: mockRemove
}));

jest.mock('../../firebase/config', () => ({
  database: {}
}));

// 4. NOW import the functions to test - AFTER mocking their dependencies
import {
  createRecord,
  updateRecord,
  getRecordById,
  getAllRecords,
  deleteRecord,
  cleanupEmptyGroups 
} from '../database';

describe('Database Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock implementations for each test
    mockGet.mockImplementation(() => ({
      exists: () => true,
      val: () => ({ id: 'mock-id', name: 'Test Record' })
    }));
  });

  describe('createRecord', () => {
    test('creates a new record with provided data', async () => {
      // Arrange
      const data = { name: 'Test Course' };
      
      // Act
      const result = await createRecord('courses', data);
      
      // Assert
      expect(mockPush).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({ 
        id: 'mock-id', 
        name: 'Test Course' 
      }));
    });
  });

  describe('updateRecord', () => {
    test('updates an existing record', async () => {
      // Arrange
      const id = 'existing-id';
      const data = { name: 'Updated Name' };
      
      // Act
      const result = await updateRecord('courses', id, data);
      
      // Assert
      expect(mockRef).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({ 
        id, 
        name: 'Updated Name' 
      }));
    });
  });

  describe('getRecordById', () => {
    test('retrieves a record by its id', async () => {
      // Act
      const result = await getRecordById('courses', 'mock-id');
      
      // Assert
      expect(mockRef).toHaveBeenCalled();
      expect(mockGet).toHaveBeenCalled();
      expect(result).toEqual({ id: 'mock-id', name: 'Test Record' });
    });
    
    test('returns null for non-existent record', async () => {
      // Arrange
      mockGet.mockImplementationOnce(() => ({
        exists: () => false,
        val: () => null
      }));
      
      // Act
      const result = await getRecordById('courses', 'non-existent-id');
      
      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getAllRecords', () => {
    test('retrieves all records of a specific type', async () => {
      // Arrange
      mockGet.mockImplementationOnce(() => ({
        exists: () => true,
        val: () => ({
          'id1': { id: 'id1', name: 'Course 1' },
          'id2': { id: 'id2', name: 'Course 2' }
        })
      }));
      
      // Act
      const result = await getAllRecords('courses');
      
      // Assert
      expect(result).toHaveLength(2);
      expect(result).toEqual([
        { id: 'id1', name: 'Course 1' },
        { id: 'id2', name: 'Course 2' }
      ]);
    });
    
    test('returns empty array when no records exist', async () => {
      // Arrange
      mockGet.mockImplementationOnce(() => ({
        exists: () => false,
        val: () => null
      }));
      
      // Act
      const result = await getAllRecords('emptyCollection');
      
      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('deleteRecord', () => {
    test('deletes a record by its id', async () => {
      // Arrange
      const id = 'record-to-delete';
      
      // Act
      const result = await deleteRecord('courses', id);
      
      // Assert
      expect(mockRef).toHaveBeenCalled();
      expect(mockRemove).toHaveBeenCalled();
      expect(result).toBe(true);
    });
    
    test('handles deletion of non-existent record', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';
      mockGet.mockImplementationOnce(() => ({
        exists: () => false,
        val: () => null
      }));
      
      // Act & Assert - should not throw an error
      await expect(deleteRecord('courses', nonExistentId)).resolves.toBe(true);
    });
  });

  describe('cleanupEmptyGroups', () => {
    test('removes groups with no courses', async () => {
      // Arrange
      mockGet.mockImplementationOnce(() => ({
        exists: () => true,
        val: () => ({
          'group1': { id: 'group1', name: 'Empty Group', courseIds: [] },
          'group2': { id: 'group2', name: 'Group with courses', courseIds: ['course1'] }
        })
      }));
      
      // Act
      await cleanupEmptyGroups();
      
      // Assert
      expect(mockRemove).toHaveBeenCalled();
    });
  });
});