// src/features/students/components/StudentPreviewCard.jsx
import React from 'react';
import { safelyRenderValue } from '../utils/studentDataUtils';

const StudentPreviewCard = ({ 
  student, 
  courses, 
  isCurrentStudent = false,
  onMergeClick,
  isMerging = false,
  mergeError = null,
  showMergeButton = false
}) => {
  if (!student) {
    return (
      <div className="student-preview-card">
        <div className="empty-preview">
          <p>Wählen Sie einen Schüler aus, um die Details anzuzeigen</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-preview-card">
      <div className="preview-header">
        <h4>
          {safelyRenderValue(student.name)}
          {isCurrentStudent && ' (Aktueller Schüler)'}
        </h4>
      </div>
      <div className="preview-content">
        <div className="preview-section">
          <h5>Kurse</h5>
          {student.courseIds && student.courseIds.length > 0 ? (
            <div className="course-badges">
              {student.courseIds.map((courseId) => {
                const course = courses.find((c) => c.id === courseId);
                return (
                  <div key={courseId} className="course-badge">
                    {course ? safelyRenderValue(course.name) : `Kurs ${courseId}`}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="empty-courses">Keine Kurse gefunden</p>
          )}
        </div>

        {showMergeButton && (
          <>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
              <button
                className="confirm-button"
                onClick={onMergeClick}
                disabled={isMerging}
              >
                {isMerging ? 'Merging...' : 'Merge with Current Student'}
              </button>
            </div>
            {mergeError && (
              <div style={{
                marginTop: '10px',
                color: '#c62828',
                backgroundColor: '#ffebee',
                padding: '8px',
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                Error: {mergeError}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StudentPreviewCard;