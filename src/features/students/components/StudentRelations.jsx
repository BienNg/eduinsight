// src/features/students/components/StudentRelations.jsx
import React, { useState } from 'react';
import StudentPreviewCard from './StudentPreviewCard';
import { safelyRenderValue } from '../utils/studentDataUtils';
import { handleMergeStudents } from '../utils/studentMergeUtils';

const StudentRelations = ({ student, allStudents, courses, onRefreshData }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRelatedStudent, setSelectedRelatedStudent] = useState(null);
  const [showMergeConfirmation, setShowMergeConfirmation] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeError, setMergeError] = useState(null);

  // Function to filter students based on search query
  const filteredStudents = allStudents.filter(s =>
    s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMergeClick = () => {
    setShowMergeConfirmation(true);
  };

  const executeMerge = async () => {
    if (!selectedRelatedStudent) return;
    
    setIsMerging(true);
    setMergeError(null);
    
    const success = await handleMergeStudents(
      student.id, 
      selectedRelatedStudent.id,
      () => {
        // Success handler
        setShowMergeConfirmation(false);
        setSelectedRelatedStudent(null);
        onRefreshData();
      },
      (errorMessage) => {
        // Error handler
        setMergeError(errorMessage);
      }
    );
    
    if (!success) {
      setIsMerging(false);
    }
  };

  return (
    <div className="relations-section">
      <h3>Schülerbeziehungen</h3>
      <div className="relations-container">
        <div className="relations-list-container">
          <div className="search-container">
            <input
              type="text"
              placeholder="Schüler suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="students-list">
            {filteredStudents.length > 0 ? (
              <ul className="student-items">
                {filteredStudents.map((s) => (
                  <li
                    key={s.id}
                    className={`student-item ${selectedRelatedStudent?.id === s.id ? 'selected' : ''}`}
                    onClick={() => setSelectedRelatedStudent(s)}
                  >
                    <div className="student-info">
                      <span className="student-name">{safelyRenderValue(s.name)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state">
                {searchQuery ?
                  <p>Keine Schüler mit diesem Namen gefunden.</p> :
                  <p>Keine anderen Schüler verfügbar.</p>
                }
              </div>
            )}
          </div>
        </div>

        <div className="preview-cards">
          {/* Current student card */}
          <StudentPreviewCard 
            student={student}
            courses={courses}
            isCurrentStudent={true}
          />

          {/* Selected student card */}
          <StudentPreviewCard 
            student={selectedRelatedStudent}
            courses={courses}
            onMergeClick={handleMergeClick}
            isMerging={isMerging}
            mergeError={mergeError}
            showMergeButton={!!selectedRelatedStudent}
          />
        </div>
      </div>

      {/* Confirmation Modal content (passing only what's needed for the main component) */}
      {showMergeConfirmation && (
        <>
          {/* This is just the data needed by the main component to show the modal */}
          {/* The actual modal stays in the main component */}
          <input 
            type="hidden" 
            id="merge-confirmation-data" 
            data-title="Confirm Student Merge" 
            data-message={`Are you sure you want to merge ${selectedRelatedStudent ? safelyRenderValue(selectedRelatedStudent.name) : ''} into ${safelyRenderValue(student.name)}? This will combine all courses and attendance records, and delete the merged student record. This action cannot be undone.`}
            data-is-open={showMergeConfirmation}
            data-on-confirm={executeMerge}
            data-on-cancel={() => setShowMergeConfirmation(false)}
          />
        </>
      )}
    </div>
  );
};

export default StudentRelations;