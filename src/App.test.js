// src/App.test.js
import React from 'react';
import { render } from '@testing-library/react';

// Mock the dependencies
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => <div data-testid="router">{children}</div>,
  Routes: ({ children }) => <div data-testid="routes">{children}</div>,
  Route: () => null,
}));

// Import App after mocking its dependencies
import App from './App';

test('renders without crashing', () => {
  const { getByTestId } = render(<App />);
  expect(getByTestId('router')).toBeInTheDocument();
});