import './styles/global.css';import Dashboard from './components/Dashboard/Dashboard';
import { ImportProvider } from './components/Dashboard/ImportContext';
import './App.css';

function App() {
  return (
    <div className="App">
      <ImportProvider>
        <Dashboard />
      </ImportProvider>
    </div>
  );
}

export default App;