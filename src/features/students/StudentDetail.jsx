// src/features/students/StudentDetail.jsx
import React, { useState, useEffect } from 'react';
import './StudentDetail.css';
import '../common/Tabs.css';
import ConfirmationModal from '../common/ConfirmationModal';
import DetailLayout from '../common/DetailLayout';
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
    <DetailLayout
      title={safelyRenderValue(student.name)}
      tabs={tabs}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onClose={onClose}
    >
      {loading ? (
        <div className="loading-indicator">Daten werden geladen...</div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <StudentOverview 
              student={student} 
              sessions={sessions} 
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

      {/* Modals stay at the bottom of the DetailLayout */}
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={modalConfig.onCancel}
      />
    </DetailLayout>
  );
};

export default StudentDetail;