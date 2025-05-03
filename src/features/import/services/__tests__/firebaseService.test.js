// src/features/import/services/__tests__/firebaseService.test.js
import { jest } from '@jest/globals';
import { 
  getNextGroupColor, 
  getOrCreateGroupRecord, 
  normalizeTeacherName, 
  createTeacherRecord,
  createOrUpdateStudentRecord,
  getOrCreateMonthRecord,
  findExistingCourse
} from '../firebaseService';
import { 
  resetDatabase, 
  seedDatabase, 
  createTestDatabase 
} from '../../../test/firebaseTestUtils';

// Mock Firebase
jest.mock('../../../firebase/config', () => {
  const { database } = require('../../../../__mocks__/firebase');
  return { database };
});

// Define mocks before jest.mock
const mockCreateRecord = jest.fn();
const mockUpdateRecord = jest.fn();
const mockGetAllRecords = jest.fn();
const mockGetRecordById = jest.fn();

// Mock database functions
jest.mock('../../../firebase/database', () => ({
  createRecord: mockCreateRecord,
  updateRecord: mockUpdateRecord,
  getAllRecords: mockGetAllRecords,
  getRecordById: mockGetRecordById
}));

describe('Firebase Service Functions', () => {
  beforeEach(async () => {
    resetDatabase();
    await seedDatabase(createTestDatabase());
    jest.clearAllMocks();
    
    // Set up mock implementations for each test
    mockCreateRecord.mockImplementation((collection, data) => {
      return Promise.resolve({ id: `${collection}-123`, ...data });
    });
    
    mockUpdateRecord.mockImplementation(() => Promise.resolve());
    
    mockGetAllRecords.mockImplementation((collection) => {
      if (collection === 'groups') {
        return Promise.resolve([
          { id: 'group1', name: 'G1', courseIds: [], color: '#911DD2' }
        ]);
      }
      if (collection === 'teachers') {
        return Promise.resolve([
          { id: 'teacher1', name: 'John Smith', courseIds: ['course1'] }
        ]);
      }
      return Promise.resolve([]);
    });
    
    mockGetRecordById.mockImplementation((collection, id) => {
      if (collection === 'groups' && id === 'group1') {
        return Promise.resolve({ id: 'group1', name: 'G1', courseIds: ['course1'] });
      }
      if (collection === 'courses' && id === 'course1') {
        return Promise.resolve({ id: 'course1', name: 'G1 B1.2', level: 'B1.2', groupId: 'group1' });
      }
      if (collection === 'students' && id === 'student1') {
        return Promise.resolve({ id: 'student1', name: 'Test Student', courseIds: ['course1'] });
      }
      return Promise.resolve(null);
    });
  });

  describe('getNextGroupColor', () => {
    test('returns a color from the predefined list', async () => {
      // Act
      const color = await getNextGroupColor();

      // Assert
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });

    test('prioritizes less used colors', async () => {
      // Arrange - Create groups with the same color
      const commonColor = '#911DD2';
      await createRecord('groups', {
        name: 'Group A',
        courseIds: [],
        color: commonColor
      });
      await createRecord('groups', {
        name: 'Group B',
        courseIds: [],
        color: commonColor
      });

      // Act
      const nextColor = await getNextGroupColor();

      // Assert - Should not choose the most common color
      expect(nextColor).not.toBe(commonColor);
    });
  });

  describe('getOrCreateGroupRecord', () => {
    test('creates a new group if it does not exist', async () => {
      // Arrange
      const groupName = 'G10';
      const mode = 'Online';

      // Act
      const group = await getOrCreateGroupRecord(groupName, mode);

      // Assert
      expect(group.name).toBe(groupName);
      expect(group.mode).toBe(mode);
      expect(group.type).toBe('G');
      expect(group).toHaveProperty('id');
      expect(group).toHaveProperty('color');
      expect(group.courseIds).toEqual([]);
    });

    test('returns existing group if it already exists', async () => {
      // Arrange
      const existingGroup = await createRecord('groups', {
        name: 'A5',
        courseIds: ['existingCourse'],
        mode: 'Offline',
        type: 'A'
      });

      // Act
      const group = await getOrCreateGroupRecord('A5', 'Online');

      // Assert
      expect(group.id).toBe(existingGroup.id);
      expect(group.courseIds).toEqual(['existingCourse']);
      // Mode should NOT be updated to maintain existing data
      expect(group.mode).toBe('Offline');
    });

    test('detects group type from naming pattern', async () => {
      // Test different naming patterns
      const groupA = await getOrCreateGroupRecord('A3', 'Online');
      expect(groupA.type).toBe('A');

      const groupM = await getOrCreateGroupRecord('M7', 'Online');
      expect(groupM.type).toBe('M');

      const groupP = await getOrCreateGroupRecord('P2', 'Online');
      expect(groupP.type).toBe('P');

      const groupG = await getOrCreateGroupRecord('G5', 'Online');
      expect(groupG.type).toBe('G');

      // Default for unknown patterns
      const groupUnknown = await getOrCreateGroupRecord('Unknown', 'Online');
      expect(groupUnknown.type).toBe('G');
    });
  });

  describe('normalizeTeacherName', () => {
    test('normalizes teacher names correctly', () => {
      expect(normalizeTeacherName(' John Doe ')).toBe('john doe');
      expect(normalizeTeacherName('MARÍA GARCÍA')).toBe('maria garcia');
      expect(normalizeTeacherName('François   Dupont')).toBe('francois dupont');
    });
  });

  describe('createTeacherRecord', () => {
    test('creates a new teacher record', async () => {
      // Act
      const teacher = await createTeacherRecord('New Teacher');

      // Assert
      expect(teacher.name).toBe('New Teacher');
      expect(teacher.courseIds).toEqual([]);
      expect(teacher).toHaveProperty('id');
    });

    test('returns existing teacher with normalized name match', async () => {
      // Arrange
      const existingTeacher = await createRecord('teachers', {
        name: 'John Smith',
        country: 'US',
        courseIds: ['course1']
      });

      // Act - Use a differently formatted name
      const teacher = await createTeacherRecord('john SMITH');

      // Assert - Should return the existing teacher
      expect(teacher.id).toBe(existingTeacher.id);
      expect(teacher.name).toBe('John Smith');
    });
  });

  describe('createOrUpdateStudentRecord', () => {
    test('creates a new student record', async () => {
      // Act
      const student = await createOrUpdateStudentRecord(
        'New Student', 
        'Student info', 
        'course2',
        'group1'
      );

      // Assert
      expect(student.name).toBe('New Student');
      expect(student.info).toBe('Student info');
      expect(student.courseIds).toContain('course2');
      expect(student).toHaveProperty('id');
    });

    test('updates existing student record with new course', async () => {
      // Arrange - We already have student1 in our test database
      
      // Act - Add a new course
      const student = await createOrUpdateStudentRecord(
        'Test Student', 
        '', 
        'newCourse',
        'group1'
      );

      // Assert
      expect(student.id).toBe('student1');
      expect(student.courseIds).toContain('course1');
      expect(student.courseIds).toContain('newCourse');
      
      // Check that database was updated
      expect(mockUpdateRecord).toHaveBeenCalled();
    });
  });

  describe('getOrCreateMonthRecord', () => {
    test('creates a new month record from valid date', async () => {
      // Act
      const month = await getOrCreateMonthRecord('15.05.2025');

      // Assert
      expect(month.id).toBe('2025-05');
      expect(month.name).toBe('May 2025');
      expect(month.year).toBe('2025');
      expect(month.month).toBe('05');
    });

    test('returns null for invalid date format', async () => {
      // Act
      const result = await getOrCreateMonthRecord('invalid-date');

      // Assert
      expect(result).toBeNull();
    });

    test('returns existing month record if it exists', async () => {
      // Arrange - Already have 2025-01 in test database
      
      // Act
      const month = await getOrCreateMonthRecord('05.01.2025');

      // Assert
      expect(month.id).toBe('2025-01');
      expect(month.name).toBe('January 2025');
    });
  });

  describe('findExistingCourse', () => {
    test('finds a course with matching group and level', async () => {
      // Arrange
      const groupName = 'G1'; // Already exists in test DB
      const level = 'B1.2'; // Already exists in test DB
      
      // Act
      const course = await findExistingCourse(groupName, level);
      
      // Assert
      expect(course).not.toBeNull();
      expect(course.id).toBe('course1');
      expect(course.level).toBe('B1.2');
    });
    
    test('returns null if no matching course exists', async () => {
      // Act
      const course = await findExistingCourse('G99', 'C2');
      
      // Assert
      expect(course).toBeNull();
    });
  });
});