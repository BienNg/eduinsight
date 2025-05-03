module.exports = {
    // Use jsdom for testing React components
    testEnvironment: 'jsdom',

    // Configure module paths
    moduleDirectories: ['node_modules', 'src'],

    // Mock CSS and other files
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': '<rootDir>/src/__mocks__/styleMock.js',
        '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/src/__mocks__/fileMock.js',
    },

    // Setup test framework
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],

    // Transform files
    transform: {
        '^.+\\.(js|jsx)$': 'babel-jest',
    },

    // Coverage reporting
    collectCoverageFrom: [
        'src/**/*.{js,jsx}',
        '!src/**/*.d.ts',
        '!src/index.js',
        '!src/serviceWorker.js',
    ],
};