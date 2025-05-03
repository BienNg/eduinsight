// src/test/firebaseTestUtils.js
import { database } from '../__mocks__/firebase';

// Reset the database before each test
export const resetDatabase = () => {
  database.flush();
  database.autoFlush();
};

// Seed the database with test data
export const seedDatabase = async (data) => {
  const ref = database.ref('/');
  await ref.set(data);
};

// Test data factory functions
export const createTestCourse = (id = 'course1') => ({
  id,
  name: `Test Course ${id}`,
  level: 'B1.2',
  groupId: 'group1',
  startDate: '01.01.2025',
  endDate: '31.03.2025',
  sessionIds: ['session1', 'session2'],
  studentIds: ['student1', 'student2'],
  teacherIds: ['teacher1'],
  status: 'ongoing'
});

export const createTestSession = (id = 'session1', courseId = 'course1') => ({
  id,
  courseId,
  title: `Session ${id}`,
  content: 'Test content',
  notes: 'Test notes',
  date: '01.01.2025',
  startTime: '14:00',
  endTime: '15:30',
  teacherId: 'teacher1',
  attendance: {
    'student1': { status: 'present', comment: '' },
    'student2': { status: 'absent', comment: 'Sick' }
  },
  monthId: '2025-01',
  sessionOrder: 0,
  duration: 1.5,
  status: 'completed'
});

export const createTestTeacher = (id = 'teacher1') => ({
  id,
  name: 'Test Teacher',
  country: 'Germany',
  courseIds: ['course1']
});

export const createTestStudent = (id = 'student1') => ({
  id,
  name: 'Test Student',
  info: 'Student information',
  courseIds: ['course1'],
  notes: '',
  joinDates: {
    'course1': '01.01.2025'
  }
});

export const createTestGroup = (id = 'group1') => ({
  id,
  name: 'G1',
  courseIds: ['course1'],
  color: '#911DD2',
  mode: 'Online',
  type: 'G',
  createdAt: '2025-01-01T00:00:00.000Z'
});

export const createTestMonth = (id = '2025-01') => ({
  id,
  name: 'January 2025',
  year: '2025',
  month: '01',
  sessionCount: 1,
  courseIds: ['course1'],
  teacherIds: ['teacher1'],
  statistics: {
    attendanceRate: 0.5,
    sessionCount: 1
  }
});

// Complete test dataset
export const createTestDatabase = () => ({
  courses: {
    'course1': createTestCourse('course1')
  },
  sessions: {
    'session1': createTestSession('session1')
  },
  teachers: {
    'teacher1': createTestTeacher('teacher1')
  },
  students: {
    'student1': createTestStudent('student1')
  },
  groups: {
    'group1': createTestGroup('group1')
  },
  months: {
    '2025-01': createTestMonth('2025-01')
  }
});