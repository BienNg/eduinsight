import { useState, useEffect } from 'react';

const SmartProcessingQueue = ({ 
  queue, 
  completedFiles, 
  failedFiles, 
  onClearCompleted, 
  onClearFailed 
}) => {
  const [expandedSections, setExpandedSections] = useState({
    processing: true,
    completed: false,
    failed: false
  });

  // Auto-expand sections based on content
  useEffect(() => {
    setExpandedSections(prev => ({
      ...prev,
      completed: completedFiles.length > 0,
      failed: failedFiles.length > 0
    }));
  }, [completedFiles.length, failedFiles.length]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processing':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
            <circle cx="12" cy="12" r="10"/>
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              from="0 12 12"
              to="360 12 12"
              dur="1s"
              repeatCount="indefinite"
            />
          </svg>
        );
      case 'completed':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
            <circle cx="12" cy="12" r="10"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
        );
      case 'skipped':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4"/>
            <path d="M12 16h.01"/>
          </svg>
        );
      case 'no-updates':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4"/>
            <path d="M12 16h.01"/>
          </svg>
        );
      case 'failed':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
        );
    }
  };

  const ProcessingItem = ({ item, index }) => {
    const isActive = index === 0;
    const status = isActive ? 'processing' : 'queued';
    
    return (
      <div className={`processing-item ${isActive ? 'active' : ''}`}>
        <div className="processing-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {getStatusIcon(status)}
            <span className="file-name">{item.name}</span>
          </div>
          <span className={`status-badge ${status}`}>
            {isActive ? 'Processing' : 'Queued'}
          </span>
        </div>
        
        {isActive && (
          <div className="smart-progress">
            <div 
              className="progress-fill" 
              style={{ width: `${item.progress || 0}%` }}
            />
          </div>
        )}
        
        {item.error && (
          <div style={{ 
            marginTop: '0.5rem', 
            padding: '0.5rem', 
            background: 'rgba(239, 68, 68, 0.1)', 
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            color: '#dc2626'
          }}>
            {item.error}
          </div>
        )}
      </div>
    );
  };

  const CompletedItem = ({ file }) => {
    const isSkipped = file.status === 'skipped';
    const isNoUpdates = file.status === 'no-updates';
    const isSpecialStatus = isSkipped || isNoUpdates;
    
    const getDisplayStatus = () => {
      if (isSkipped) return 'Skipped';
      if (isNoUpdates) return 'No Updates';
      return 'Completed';
    };

    const getStatusClass = () => {
      if (isSkipped) return 'skipped';
      if (isNoUpdates) return 'no-updates';
      return 'completed';
    };
    
    return (
      <div className={`processing-item ${getStatusClass()}`}>
        <div className="processing-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {getStatusIcon(isSkipped ? 'skipped' : isNoUpdates ? 'no-updates' : 'completed')}
            <span className="file-name">{file.name}</span>
          </div>
          <span className={`status-badge ${getStatusClass()}`}>
            {getDisplayStatus()}
          </span>
        </div>
        
        {/* Warning/info message for special status files */}
        {isSpecialStatus && file.warning && (
          <div style={{ 
            marginTop: '0.5rem', 
            padding: '0.75rem', 
            background: 'rgba(245, 158, 11, 0.1)', 
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            color: '#d97706',
            lineHeight: '1.4'
          }}>
            💡 {file.warning}
          </div>
        )}
        
        {/* Success metrics for completed files */}
        {!isSkipped && (
          <div style={{ 
            marginTop: '0.75rem', 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', 
            gap: '0.5rem',
            fontSize: '0.875rem'
          }}>
            {file.sessionsAdded > 0 && (
              <div style={{ color: '#059669' }}>
                +{file.sessionsAdded} sessions
              </div>
            )}
            {file.studentsAdded > 0 && (
              <div style={{ color: '#059669' }}>
                +{file.studentsAdded} students
              </div>
            )}
            {file.coursesAdded > 0 && (
              <div style={{ color: '#059669' }}>
                +{file.coursesAdded} courses
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const FailedItem = ({ file }) => (
    <div className="processing-item failed">
      <div className="processing-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {getStatusIcon('failed')}
          <span className="file-name">{file.name}</span>
        </div>
        <span className="status-badge failed">Failed</span>
      </div>
      
      {file.error && (
        <div style={{ 
          marginTop: '0.5rem', 
          padding: '0.75rem', 
          background: 'rgba(239, 68, 68, 0.1)', 
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          color: '#dc2626',
          lineHeight: '1.4'
        }}>
          {file.error}
        </div>
      )}
    </div>
  );

  const SectionHeader = ({ title, count, type, onToggle, expanded }) => (
    <div 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '1rem',
        background: 'var(--import-hover)',
        borderRadius: '0.75rem',
        cursor: 'pointer',
        marginBottom: expanded ? '1rem' : '0',
        transition: 'all 0.3s ease'
      }}
      onClick={onToggle}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <h3 style={{ margin: 0, color: 'var(--import-text)' }}>{title}</h3>
        {count > 0 && (
          <span style={{
            background: type === 'failed' ? 'var(--import-error)' : 
                       type === 'completed' ? 'var(--import-success)' : 'var(--import-primary)',
            color: 'white',
            padding: '0.25rem 0.5rem',
            borderRadius: '1rem',
            fontSize: '0.75rem',
            fontWeight: '600'
          }}>
            {count}
          </span>
        )}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Clear button for completed/failed */}
        {(type === 'completed' && onClearCompleted && count > 0) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClearCompleted();
            }}
            style={{
              background: 'transparent',
              border: '1px solid var(--import-border)',
              color: 'var(--import-text-light)',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            Clear
          </button>
        )}
        
        {(type === 'failed' && onClearFailed && count > 0) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClearFailed();
            }}
            style={{
              background: 'transparent',
              border: '1px solid var(--import-border)',
              color: 'var(--import-text-light)',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            Clear
          </button>
        )}
        
        {/* Expand/collapse arrow */}
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          style={{ 
            width: '20px', 
            height: '20px',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease'
          }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
    </div>
  );

  // Don't render if no content
  const hasContent = queue.length > 0 || completedFiles.length > 0 || failedFiles.length > 0;
  if (!hasContent) return null;

  return (
    <div style={{ marginTop: '2rem' }}>
      {/* Processing Queue */}
      {queue.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <SectionHeader
            title="Processing Queue"
            count={queue.length}
            type="processing"
            onToggle={() => toggleSection('processing')}
            expanded={expandedSections.processing}
          />
          
          {expandedSections.processing && (
            <div>
              {queue.map((item, index) => (
                <ProcessingItem key={item.id} item={item} index={index} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Completed Files */}
      {completedFiles.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <SectionHeader
            title="Completed Imports"
            count={completedFiles.length}
            type="completed"
            onToggle={() => toggleSection('completed')}
            expanded={expandedSections.completed}
            onClearCompleted={onClearCompleted}
          />
          
          {expandedSections.completed && (
            <div>
              {completedFiles.map((file) => (
                <CompletedItem key={file.id} file={file} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Failed Files */}
      {failedFiles.length > 0 && (
        <div>
          <SectionHeader
            title="Failed Imports"
            count={failedFiles.length}
            type="failed"
            onToggle={() => toggleSection('failed')}
            expanded={expandedSections.failed}
            onClearFailed={onClearFailed}
          />
          
          {expandedSections.failed && (
            <div>
              {failedFiles.map((file) => (
                <FailedItem key={file.id} file={file} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartProcessingQueue; 