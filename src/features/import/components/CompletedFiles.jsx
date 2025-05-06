// src/features/import/components/CompletedFiles.jsx

const CompletedFiles = ({ files, onClear }) => {
  if (files.length === 0) return null;
  
  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4>Completed ({files.length})</h4>
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
          backgroundColor: '#e8f5e9',
          borderRadius: '4px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span><strong>{item.name}</strong></span>
            <span style={{ color: '#2e7d32' }}>✓ Completed</span>
          </div>
          {item.message && (
            <p style={{ 
              margin: '5px 0 0 0', 
              fontSize: '14px', 
              color: '#2e7d32' 
            }}>
              {item.message}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default CompletedFiles;