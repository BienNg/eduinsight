// src/components/Dashboard/ReassignModal.jsx
import React from 'react';

const ReassignModal = ({ 
  isOpen, 
  onClose, 
  course, 
  students, 
  searchQuery, 
  onSearchChange, 
  onReassign,
  onCreateNew,
  safelyRenderValue
}) => {
  if (!isOpen) return null;
  
  const hasNoResults = students.length === 0 && searchQuery.trim() !== '';
  
  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div className="modal-content" style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        width: '500px',
        maxWidth: '90%',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div className="modal-header" style={{
          padding: '16px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0 }}>
            Reassign Course: {course ? course.name : ''}
          </h3>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>
        
        <div className="modal-search" style={{
          padding: '16px',
          borderBottom: '1px solid #e0e0e0'
        }}>
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>
        
        <div className="modal-body" style={{
          padding: '0',
          overflowY: 'auto',
          flex: 1
        }}>
          {students.length > 0 ? (
            <ul className="student-items" style={{
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              {students.map((s) => (
                <li
                  key={s.id}
                  className="student-item"
                  onClick={() => onReassign(s.id)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #eee',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f7fa';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '';
                  }}
                >
                  <div className="student-info">
                    <span className="student-name" style={{
                      fontWeight: '500'
                    }}>
                      {safelyRenderValue(s.name)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ padding: '16px', textAlign: 'center' }}>
              {searchQuery ? (
                <p>No students found matching "{searchQuery}"</p>
              ) : (
                <p>No students available</p>
              )}
            </div>
          )}
          
          {/* "Create Student" button when no results */}
          {hasNoResults && (
            <div style={{
              padding: '16px',
              borderTop: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => onCreateNew(searchQuery)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 16px',
                  background: 'transparent',
                  border: '1px dashed #2196f3',
                  borderRadius: '4px',
                  color: '#2196f3',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(33, 150, 243, 0.05)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ marginRight: '6px', fontSize: '16px' }}>+</span>
                Create Student "{searchQuery}"
              </button>
            </div>
          )}
        </div>
        
        <div className="modal-footer" style={{
          padding: '16px',
          borderTop: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReassignModal;