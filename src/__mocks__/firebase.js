// src/__mocks__/firebase.js
const firebasemock = require('firebase-mock');

// Create mock services
const mockAuth = new firebasemock.MockAuthentication();
const mockDatabase = new firebasemock.MockDatabase();
const mockFirestore = new firebasemock.MockFirestore();
const mockStorage = new firebasemock.MockStorage();

// Create a mock SDK with these services
const mockSdk = new firebasemock.MockFirebaseSdk(
  // RTDB
  (path) => {
    return path ? mockDatabase.child(path) : mockDatabase;
  },
  // Auth
  () => {
    return mockAuth;
  },
  // Firestore
  () => {
    return mockFirestore;
  },
  // Storage
  () => {
    return mockStorage;
  },
  // Messaging
  () => {
    return null;
  }
);

// Export the mocked Firebase modules
module.exports = {
  database: mockDatabase,
  auth: mockAuth,
  firestore: mockFirestore,
  storage: mockStorage,
  firebase: mockSdk
};