// src/__mocks__/react-router-dom.js
const navigateMock = jest.fn();

module.exports = {
    BrowserRouter: ({ children }) => children,
    Routes: ({ children }) => children,
    Route: () => null,
    Link: ({ children }) => children,
    useNavigate: () => navigateMock,
    useLocation: () => ({ pathname: '/' }),
    useParams: () => ({}),
    Outlet: () => null
};