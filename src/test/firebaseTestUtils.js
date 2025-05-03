// src/features/test/firebaseTestUtils.js
// Simple mock implementations of test utilities

export const resetDatabase = () => {
  // Reset any mock state
  jest.clearAllMocks();
};

export const seedDatabase = (testData) => {
  // Mock seeding the database
  return Promise.resolve(testData);
};

export const createTestDatabase = () => {
  // Return test data structure
  return {
    groups: {
      group1: { id: 'group1', name: 'G1', courseIds: ['course1'], color: '#911DD2' }
    },
    courses: {
      course1: { id: 'course1', name: 'G1 B1.2', level: 'B1.2', groupId: 'group1' }
    },
    teachers: {
      teacher1: { id: 'teacher1', name: 'John Smith', courseIds: ['course1'] }
    },
    students: {
      student1: { id: 'student1', name: 'Test Student', courseIds: ['course1'] }
    },
    months: {
      '2025-01': { id: '2025-01', name: 'January 2025', sessionCount: 0, courseIds: [] }
    }
  };
};