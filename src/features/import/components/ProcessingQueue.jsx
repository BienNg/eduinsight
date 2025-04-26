// src/features/import/components/ProcessingQueue.jsx

const ProcessingQueue = ({ queue }) => {
    if (queue.length === 0) return null;
    
    return (
      <div style={{ marginTop: '20px' }}>
        <h4>Processing Queue</h4>
        {queue.map((item, index) => (
          <div key={item.id} style={{
            padding: '10px',
            marginBottom: '10px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span><strong>{item.name}</strong></span>
              <span>{index === 0 ? 'Processing...' : 'Queued'}</span>
            </div>
  
            {index === 0 && (
              <div style={{
                height: '4px',
                backgroundColor: '#e0e0e0',
                borderRadius: '2px',
                marginTop: '8px'
              }}>
                <div style={{
                  height: '100%',
                  width: `${item.progress}%`,
                  backgroundColor: '#1e88e5',
                  borderRadius: '2px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };
  
  export default ProcessingQueue;