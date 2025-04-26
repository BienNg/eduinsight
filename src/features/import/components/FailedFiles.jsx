// src/features/import/components/FailedFiles.jsx
import ErrorSummary from './ErrorSummary';

const FailedFiles = ({ files, onClear }) => {
  if (files.length === 0) return null;
  
  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4>Fix These Files ({files.length})</h4>
        <button
          onClick={onClear}
          style={{
            background: 'none',
            border: 'none',
            color: '#1e88e5',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Clear
        </button>
      </div>

      {files.map((item) => (
        <div key={item.id} style={{
          padding: '10px',
          marginBottom: '10px',
          backgroundColor: '#ffebee',
          borderRadius: '4px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span><strong>{item.name}</strong></span>
            <span style={{ color: '#c62828' }}>✗ Failed</span>
          </div>
          {item.error && item.error.includes('Validation failed:') ? (
            <ErrorSummary errors={item.error} filename={item.name} />
          ) : (
            <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#c62828' }}>
              {item.error}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default FailedFiles;