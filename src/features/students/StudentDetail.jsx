// src/features/students/StudentDetail.jsx
import React, { useState, useEffect } from 'react';
import './StudentDetail.css';
import '../common/Tabs.css';
import ConfirmationModal from '../common/ConfirmationModal';
import { useStudentData } from './hooks/useStudentData';
import StudentOverview from './components/StudentOverview';
import StudentRelations from './components/StudentRelations';
import { safelyRenderValue } from './utils/studentDataUtils';

const StudentDetail = ({ student, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [modalConfig, setModalConfig] = useState({ isOpen: false });
  
  // Use the custom hook to fetch and manage student data
  const { 
    sessions, 
    courses, 
    allStudents, 
    loading, 
    refreshData 
  } = useStudentData(student.id);

  // Define tabs configuration - REMOVED Anwesenheit and Kurse tabs
  const tabs = [
    { id: 'overview', label: 'Übersicht' },
    { id: 'relations', label: 'Relations' }
  ];

  // Effect to check for merge confirmation data from the StudentRelations component
  useEffect(() => {
    const mergeDataElement = document.getElementById('merge-confirmation-data');
    if (mergeDataElement) {
      const isOpen = mergeDataElement.getAttribute('data-is-open') === 'true';
      if (isOpen) {
        setModalConfig({
          isOpen: true,
          title: mergeDataElement.getAttribute('data-title'),
          message: mergeDataElement.getAttribute('data-message'),
          onConfirm: () => {
            // This is just a trigger - the actual function is in StudentRelations
            const event = new CustomEvent('execute-merge');
            document.dispatchEvent(event);
            
            // Close the modal after dispatching
            setModalConfig(prev => ({ ...prev, isOpen: false }));
          },
          onCancel: () => {
            setModalConfig(prev => ({ ...prev, isOpen: false }));
            
            // Notify StudentRelations that cancel was clicked
            const event = new CustomEvent('cancel-merge');
            document.dispatchEvent(event);
          }
        });
      }
    }
  }, [activeTab]); // Re-check when active tab changes

  // Add event listener for executing merges
  useEffect(() => {
    const handleExecuteMerge = () => {
      const mergeDataElement = document.getElementById('merge-confirmation-data');
      if (mergeDataElement && typeof mergeDataElement.dataset.onConfirm === 'function') {
        mergeDataElement.dataset.onConfirm();
      }
    };
    
    const handleCancelMerge = () => {
      const mergeDataElement = document.getElementById('merge-confirmation-data');
      if (mergeDataElement && typeof mergeDataElement.dataset.onCancel === 'function') {
        mergeDataElement.dataset.onCancel();
      }
    };
    
    document.addEventListener('execute-merge', handleExecuteMerge);
    document.addEventListener('cancel-merge', handleCancelMerge);
    
    return () => {
      document.removeEventListener('execute-merge', handleExecuteMerge);
      document.removeEventListener('cancel-merge', handleCancelMerge);
    };
  }, []);

  return (
    <div className="student-detail-view">
      <div className="detail-header">
        <div className="header-content">
          <h2>{safelyRenderValue(student.name)}</h2>
          
          {/* Tabs in header */}
          <div className="header-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={activeTab === tab.id ? 'active' : ''}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          <button className="back-button" onClick={onClose}>
            ← Back
          </button>
        </div>
      </div>

      <div className="detail-content">
        {loading ? (
          <div className="loading-indicator">Daten werden geladen...</div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <StudentOverview 
                student={student} 
                sessions={sessions} 
                courses={courses} 
              />
            )}

            {activeTab === 'relations' && (
              <StudentRelations 
                student={student}
                allStudents={allStudents}
                courses={courses}
                onRefreshData={refreshData}
              />
            )}
          </>
        )}
      </div>

      {/* Modals stay at the bottom */}
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={modalConfig.onCancel}
      />
    </div>
  );
};

export default StudentDetail;