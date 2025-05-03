// src/App.test.js
import React from 'react';
import { render } from '@testing-library/react';

// Explicitly mock react-router-dom
jest.mock('react-router-dom', () => {
  const navigateMock = jest.fn();
  return {
    BrowserRouter: ({ children }) => <div data-testid="router">{children}</div>,
    Routes: ({ children }) => <div data-testid="routes">{children}</div>,
    Route: () => null,
    useNavigate: () => navigateMock,
    useLocation: () => ({ pathname: '/' }),
    useParams: () => ({}),
  };
});

// Import App after mocking its dependencies
import App from './App';

test('renders without crashing', () => {
  const { getByTestId } = render(<App />);
  expect(getByTestId('router')).toBeInTheDocument();
});