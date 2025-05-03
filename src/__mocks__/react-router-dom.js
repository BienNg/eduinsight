// src/__mocks__/react-router-dom.js
const reactRouterDom = {
    BrowserRouter: ({ children }) => children,
    Routes: ({ children }) => children,
    Route: () => null,
    Link: ({ children }) => children,
    useNavigate: () => jest.fn(),
    useLocation: () => ({ pathname: '/' }),
    useParams: () => ({}),
    Outlet: () => null
};

module.exports = reactRouterDom;