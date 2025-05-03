// src/features/firebase/__tests__/database.test.js
import { jest } from '@jest/globals';
import { 
  createRecord, 
  updateRecord, 
  getRecordById, 
  getAllRecords, 
  deleteRecord, 
  cleanupEmptyGroups 
} from '../database';
import { 
  resetDatabase, 
  seedDatabase, 
  createTestDatabase, 
  createTestCourse 
} from '../../test/firebaseTestUtils';

// Mock Firebase
jest.mock('../config', () => {
  const { database } = require('../../../__mocks__/firebase');
  return { database };
});

describe('Database Operations', () => {
  beforeEach(async () => {
    resetDatabase();
    await seedDatabase(createTestDatabase());
  });

  describe('createRecord', () => {
    test('creates a new record with provided data', async () => {
      // Arrange
      const newCourse = {
        name: 'New Course',
        level: 'A1',
        groupId: 'group1',
        startDate: '01.05.2025',
        endDate: '31.07.2025',
        status: 'ongoing'
      };

      // Act
      const createdCourse = await createRecord('courses', newCourse);

      // Assert
      expect(createdCourse).toHaveProperty('id');
      expect(createdCourse.name).toBe('New Course');
      
      // Verify it was stored in the database
      const storedCourse = await getRecordById('courses', createdCourse.id);
      expect(storedCourse).toEqual(createdCourse);
    });
  });

  describe('updateRecord', () => {
    test('updates an existing record', async () => {
      // Arrange
      const courseId = 'course1';
      const updateData = {
        name: 'Updated Course Name',
        status: 'completed'
      };

      // Act
      await updateRecord('courses', courseId, updateData);

      // Assert
      const updatedCourse = await getRecordById('courses', courseId);
      expect(updatedCourse.name).toBe('Updated Course Name');
      expect(updatedCourse.status).toBe('completed');
      expect(updatedCourse.level).toBe('B1.2'); // Original data should be preserved
    });

    test('handles update for non-existent record', async () => {
      // Arrange
      const nonExistentId = 'nonexistent';
      const updateData = { name: 'Nonexistent Course' };

      // Act & Assert
      await expect(updateRecord('courses', nonExistentId, updateData))
        .rejects.toThrow();
    });
  });

  describe('getRecordById', () => {
    test('retrieves a record by its id', async () => {
      // Arrange
      const courseId = 'course1';

      // Act
      const course = await getRecordById('courses', courseId);

      // Assert
      expect(course).toHaveProperty('id', courseId);
      expect(course.name).toBe('Test Course course1');
    });

    test('returns null for non-existent record', async () => {
      // Arrange
      const nonExistentId = 'nonexistent';

      // Act
      const result = await getRecordById('courses', nonExistentId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getAllRecords', () => {
    test('retrieves all records of a specific type', async () => {
      // Arrange
      await createRecord('courses', createTestCourse('course2'));
      await createRecord('courses', createTestCourse('course3'));

      // Act
      const courses = await getAllRecords('courses');

      // Assert
      expect(courses).toHaveLength(3);
      expect(courses.map(c => c.id)).toContain('course1');
      expect(courses.map(c => c.id)).toContain('course2');
      expect(courses.map(c => c.id)).toContain('course3');
    });

    test('returns empty array when no records exist', async () => {
      // Arrange
      await seedDatabase({ emptyCollection: {} });

      // Act
      const records = await getAllRecords('emptyCollection');

      // Assert
      expect(records).toEqual([]);
    });
  });

  describe('deleteRecord', () => {
    test('deletes a record by its id', async () => {
      // Arrange
      const courseId = 'course1';
      
      // Verify it exists before deletion
      const beforeDelete = await getRecordById('courses', courseId);
      expect(beforeDelete).not.toBeNull();

      // Act
      await deleteRecord('courses', courseId);

      // Assert
      const afterDelete = await getRecordById('courses', courseId);
      expect(afterDelete).toBeNull();
    });

    test('handles deletion of non-existent record', async () => {
      // Arrange
      const nonExistentId = 'nonexistent';

      // Act & Assert - should not throw an error
      await expect(deleteRecord('courses', nonExistentId)).resolves.not.toThrow();
    });
  });

  describe('cleanupEmptyGroups', () => {
    test('removes groups with no courses', async () => {
      // Arrange
      await createRecord('groups', {
        id: 'emptyGroup',
        name: 'Empty Group',
        courseIds: []
      });

      // Act
      await cleanupEmptyGroups();

      // Assert
      const emptyGroup = await getRecordById('groups', 'emptyGroup');
      expect(emptyGroup).toBeNull();
      
      // The non-empty group should still exist
      const nonEmptyGroup = await getRecordById('groups', 'group1');
      expect(nonEmptyGroup).not.toBeNull();
    });
  });
});