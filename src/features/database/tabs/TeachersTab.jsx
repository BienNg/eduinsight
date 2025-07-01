// src/features/database/components/tabs/TeachersTab.jsx
import React, { useState, useEffect } from 'react';
import { findDuplicateTeachers, mergeTeachers, deleteTeacher } from '../../utils/teacherFetchUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faCodeMerge, faCheck, faTimes, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

const TeachersTab = ({ teachers, onTeachersChange }) => {
  const [duplicates, setDuplicates] = useState({});
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);
  const [selectedTeachers, setSelectedTeachers] = useState(new Set());
  const [mergeMode, setMergeMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(null);

  useEffect(() => {
    const checkForDuplicates = async () => {
      const duplicateTeachers = await findDuplicateTeachers();
      setDuplicates(duplicateTeachers);
    };
    
    if (teachers.length > 0) {
      checkForDuplicates();
    }
  }, [teachers]);

  // Function to check if a teacher is a duplicate
  const isDuplicate = (teacher) => {
    const normalizedName = teacher.name.trim().toLowerCase();
    return duplicates[normalizedName] && duplicates[normalizedName].length > 1;
  };

  // Filter teachers based on duplicate view setting
  const displayedTeachers = showDuplicatesOnly 
    ? teachers.filter(teacher => isDuplicate(teacher))
    : teachers;

  const duplicateCount = Object.values(duplicates).reduce((sum, group) => sum + group.length, 0);

  // Handle teacher selection for merge
  const handleTeacherSelect = (teacherId) => {
    if (!mergeMode) return;
    
    const newSelected = new Set(selectedTeachers);
    if (newSelected.has(teacherId)) {
      newSelected.delete(teacherId);
    } else if (newSelected.size < 2) {
      newSelected.add(teacherId);
    }
    setSelectedTeachers(newSelected);
  };

  // Handle delete teacher
  const handleDeleteTeacher = async (teacher) => {
    const hasActiveCourses = teacher.courseIds && teacher.courseIds.length > 0;
    
    let confirmMessage = `Sind Sie sicher, dass Sie "${teacher.name}" löschen möchten?`;
    if (hasActiveCourses) {
      confirmMessage += `\n\nDieser Lehrer ist noch ${teacher.courseIds.length} Kurs(en) zugeordnet. Der Lehrer wird aus allen Kursen und Sitzungen entfernt.`;
    }
    confirmMessage += '\n\nDiese Aktion kann nicht rückgängig gemacht werden.';

    if (!window.confirm(confirmMessage)) return;

    try {
      setActionInProgress(`delete-${teacher.id}`);
      setIsLoading(true);
      
      await deleteTeacher(teacher.id);
      
      // Refresh the teachers list
      if (onTeachersChange) {
        await onTeachersChange();
      }
      
      // Refresh duplicates
      const duplicateTeachers = await findDuplicateTeachers();
      setDuplicates(duplicateTeachers);
      
    } catch (error) {
      alert(`Fehler beim Löschen des Lehrers: ${error.message}`);
    } finally {
      setActionInProgress(null);
      setIsLoading(false);
    }
  };

  // Handle merge teachers
  const handleMergeTeachers = async () => {
    if (selectedTeachers.size !== 2) {
      alert('Bitte wählen Sie genau 2 Lehrer zum Zusammenführen aus.');
      return;
    }

    const [primaryId, secondaryId] = Array.from(selectedTeachers);
    const primaryTeacher = teachers.find(t => t.id === primaryId);
    const secondaryTeacher = teachers.find(t => t.id === secondaryId);

    if (!primaryTeacher || !secondaryTeacher) {
      alert('Fehler: Ausgewählte Lehrer nicht gefunden.');
      return;
    }

    // Let user choose which teacher to keep
    const keepPrimary = window.confirm(
      `Welchen Lehrer möchten Sie behalten?\n\n` +
      `OK für: "${primaryTeacher.name}" (${primaryTeacher.courseIds?.length || 0} Kurse)\n` +
      `Abbrechen für: "${secondaryTeacher.name}" (${secondaryTeacher.courseIds?.length || 0} Kurse)\n\n` +
      `Der andere Lehrer wird gelöscht und alle seine Kurse/Sitzungen werden übertragen.`
    );

    const finalPrimaryId = keepPrimary ? primaryId : secondaryId;
    const finalSecondaryId = keepPrimary ? secondaryId : primaryId;
    const finalPrimaryTeacher = keepPrimary ? primaryTeacher : secondaryTeacher;
    const finalSecondaryTeacher = keepPrimary ? secondaryTeacher : primaryTeacher;

    try {
      setActionInProgress(`merge-${finalPrimaryId}-${finalSecondaryId}`);
      setIsLoading(true);
      
      await mergeTeachers(finalPrimaryId, finalSecondaryId);
      
      // Refresh the teachers list
      if (onTeachersChange) {
        await onTeachersChange();
      }
      
      // Refresh duplicates
      const duplicateTeachers = await findDuplicateTeachers();
      setDuplicates(duplicateTeachers);
      
      // Reset merge mode
      setMergeMode(false);
      setSelectedTeachers(new Set());
      
      alert(`Lehrer "${finalSecondaryTeacher.name}" wurde erfolgreich in "${finalPrimaryTeacher.name}" zusammengeführt.`);
      
    } catch (error) {
      alert(`Fehler beim Zusammenführen der Lehrer: ${error.message}`);
    } finally {
      setActionInProgress(null);
      setIsLoading(false);
    }
  };

  // Cancel merge mode
  const cancelMergeMode = () => {
    setMergeMode(false);
    setSelectedTeachers(new Set());
  };

  return (
    <div>
      {/* Action Bar */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '16px', 
        alignItems: 'center',
        padding: '12px',
        background: '#f8f9fa',
        borderRadius: '8px'
      }}>
        {!mergeMode ? (
          <>
            <button 
              onClick={() => setMergeMode(true)}
              disabled={isLoading}
              style={{ 
                padding: '8px 16px', 
                border: '1px solid #007bff', 
                background: '#007bff', 
                color: 'white',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1
              }}
            >
              <FontAwesomeIcon icon={faCodeMerge} style={{ marginRight: '8px' }} />
              Lehrer zusammenführen
            </button>
            <span style={{ color: '#6c757d', fontSize: '14px' }}>
              Wählen Sie "Zusammenführen" und dann 2 Lehrer aus, um Duplikate zu bereinigen
            </span>
          </>
        ) : (
          <>
            <button 
              onClick={handleMergeTeachers}
              disabled={selectedTeachers.size !== 2 || isLoading}
              style={{ 
                padding: '8px 16px', 
                border: '1px solid #28a745', 
                background: selectedTeachers.size === 2 ? '#28a745' : '#6c757d', 
                color: 'white',
                borderRadius: '4px',
                cursor: selectedTeachers.size === 2 && !isLoading ? 'pointer' : 'not-allowed'
              }}
            >
              <FontAwesomeIcon icon={faCheck} style={{ marginRight: '8px' }} />
              Zusammenführen ({selectedTeachers.size}/2)
            </button>
            <button 
              onClick={cancelMergeMode}
              disabled={isLoading}
              style={{ 
                padding: '8px 16px', 
                border: '1px solid #6c757d', 
                background: '#6c757d', 
                color: 'white',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              <FontAwesomeIcon icon={faTimes} style={{ marginRight: '8px' }} />
              Abbrechen
            </button>
            <span style={{ color: '#007bff', fontSize: '14px' }}>
              Klicken Sie auf 2 Lehrer, um sie zusammenzuführen
            </span>
          </>
        )}
      </div>

      {/* Duplicate Teachers Alert */}
      {duplicateCount > 0 && (
        <div className="duplicate-alert" style={{ 
          background: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          borderRadius: '8px', 
          padding: '12px', 
          marginBottom: '16px',
          color: '#856404'
        }}>
          <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: '8px' }} />
          <strong>Duplicate Teachers Found:</strong> {duplicateCount} Lehrer haben den gleichen Namen. 
          <button 
            onClick={() => setShowDuplicatesOnly(!showDuplicatesOnly)}
            style={{ 
              marginLeft: '12px', 
              padding: '4px 8px', 
              border: '1px solid #ffeaa7', 
              background: 'white', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showDuplicatesOnly ? 'Alle Lehrer anzeigen' : 'Nur Duplikate anzeigen'}
          </button>
        </div>
      )}

      <div className="teacher-cards-grid">
        {displayedTeachers.map((teacher) => {
          const isSelected = selectedTeachers.has(teacher.id);
          const isActioningOnThis = actionInProgress && (
            actionInProgress === `delete-${teacher.id}` ||
            actionInProgress.includes(teacher.id)
          );
          
          return (
            <div 
              className="teacher-card" 
              key={teacher.id}
              onClick={() => handleTeacherSelect(teacher.id)}
              style={{
                border: isDuplicate(teacher) ? '2px solid #ff6b6b' : 
                       isSelected ? '2px solid #007bff' : '1px solid #e0e0e0',
                background: isDuplicate(teacher) ? '#fff5f5' : 
                           isSelected ? '#e7f3ff' : 'white',
                cursor: mergeMode ? 'pointer' : 'default',
                opacity: isActioningOnThis ? 0.6 : 1,
                position: 'relative'
              }}
            >
              <div className="teacher-card-header">
                <h3>
                  {teacher.name}
                  {isDuplicate(teacher) && (
                    <span style={{ color: '#ff6b6b', fontSize: '12px', marginLeft: '8px' }}>
                      (DUPLICATE)
                    </span>
                  )}
                  {isSelected && (
                    <span style={{ color: '#007bff', fontSize: '12px', marginLeft: '8px' }}>
                      (AUSGEWÄHLT)
                    </span>
                  )}
                </h3>
              </div>
              <div className="teacher-card-body">
                <div className="info-item">
                  <span className="label">ID:</span>
                  <span className="value" style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                    {teacher.id}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">Land:</span>
                  <span className="value">{teacher.country || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Kurse:</span>
                  <span className="value">{teacher.courseIds?.length || 0}</span>
                </div>
              </div>
              
              {/* Action buttons */}
              {!mergeMode && (
                <div style={{ 
                  position: 'absolute', 
                  top: '8px', 
                  right: '8px',
                  display: 'flex',
                  gap: '4px'
                }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTeacher(teacher);
                    }}
                    disabled={isLoading}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #dc3545',
                      background: '#dc3545',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      opacity: isLoading ? 0.6 : 1
                    }}
                    title="Lehrer löschen"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              )}
              
              {/* Loading overlay */}
              {isActioningOnThis && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(255,255,255,0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>
                    Verarbeitung...
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {displayedTeachers.length === 0 && (
          <div className="empty-state">
            {showDuplicatesOnly ? 'Keine doppelten Lehrer gefunden' : 'Keine Lehrer gefunden'}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeachersTab;