// src/features/import/services/__tests__/dataProcessing.test.js
import { jest } from '@jest/globals';
import * as XLSX from 'xlsx';
import {
    validateExcelFile,
    processB1CourseFileWithColors
} from '../dataProcessing';
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

// Mock the firebase service functions
const mockGetNextGroupColor = jest.fn(() => Promise.resolve('#911DD2'));
const mockGetOrCreateGroupRecord = jest.fn(() => Promise.resolve({
    id: 'group1',
    name: 'G1',
    courseIds: [],
    color: '#911DD2',
    mode: 'Online',
    type: 'G'
}));
const mockCreateTeacherRecord = jest.fn(() => Promise.resolve({
    id: 'teacher1',
    name: 'Test Teacher',
    courseIds: []
}));
const mockCreateOrUpdateStudentRecord = jest.fn(() => Promise.resolve({
    id: 'student1',
    name: 'Test Student',
    courseIds: ['course1']
}));
const mockGetOrCreateMonthRecord = jest.fn(() => Promise.resolve({
    id: '2025-01',
    name: 'January 2025',
    sessionCount: 0,
    courseIds: []
}));
const mockFindExistingCourse = jest.fn(() => Promise.resolve(null));

jest.mock('../firebaseService', () => ({
    getNextGroupColor: mockGetNextGroupColor,
    getOrCreateGroupRecord: mockGetOrCreateGroupRecord,
    normalizeTeacherName: (name) => name.trim().toLowerCase(), // Mock implementation  
    createTeacherRecord: mockCreateTeacherRecord,
    createOrUpdateStudentRecord: mockCreateOrUpdateStudentRecord,
    getOrCreateMonthRecord: mockGetOrCreateMonthRecord,
    findExistingCourse: mockFindExistingCourse
}));

// Mock the database functions
jest.mock('../../../firebase/database', () => ({
    createRecord: jest.fn((collection, data) => {
        return Promise.resolve({ id: `mock-${collection}-id`, ...data });
    }),
    updateRecord: jest.fn(() => Promise.resolve()),
    getRecordById: jest.fn(() => Promise.resolve(null)),
    getAllRecords: jest.fn(() => Promise.resolve([]))
}));

// Create a simple Excel file mock
const createMockExcelFile = () => {
    const wb = XLSX.utils.book_new();
    const ws_data = [
        [], [], [],
        ['Folien', 'Inhalt', 'Notizen', 'Datum', 'von', 'bis', 'Lehrer', 'Nachrichten', '', '', 'Student 1', 'Student 2'],
        ['Session 1', 'Content 1', 'Notes 1', '01.01.2025', '14:00', '15:30', 'Teacher 1', '', '', '', 'present', 'absent'],
        ['Session 2', 'Content 2', 'Notes 2', '08.01.2025', '14:00', '15:30', 'Teacher 1', '', '', '', 'present', 'present']
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    // Convert to ArrayBuffer
    return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
};

describe('Excel Data Processing', () => {
    beforeEach(async () => {
        resetDatabase();
        await seedDatabase(createTestDatabase());
        jest.clearAllMocks();
    });

    describe('validateExcelFile', () => {
        test('validates a correctly formatted file', async () => {
            // Arrange
            const excelFile = createMockExcelFile();

            // Act
            const result = await validateExcelFile(excelFile, 'G1 B1.2.xlsx');

            // Assert
            expect(result.errors).toHaveLength(0);
            expect(result.missingTimeColumns).toBe(false);
        });

        // Add more validation tests here
    });

    describe('processB1CourseFileWithColors', () => {
        test('processes a valid Excel file', async () => {
            // Arrange
            const excelFile = createMockExcelFile();
            const filename = 'G1 B1.2 Online.xlsx';
            const options = { ignoreMissingTimeColumns: false };

            // Act
            const result = await processB1CourseFileWithColors(excelFile, filename, options);

            // Assert
            expect(result).toHaveProperty('id');
            expect(result.name).toContain('G1 B1.2');
            expect(result.sessionCount).toBeGreaterThan(0);

            // Verify that createRecord was called for sessions
            const { createRecord } = require('../../../firebase/database');
            expect(createRecord).toHaveBeenCalledWith('sessions', expect.anything());
        });

        // Add more processing tests here
    });
});