import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { updateRecord } from '../../../firebase/database';

const EditableDate = ({ session, currentDate, onDateUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  // Convert German date format (DD.MM.YYYY) to input format (YYYY-MM-DD)
  const germanToInputDate = (germanDate) => {
    if (!germanDate) return '';
    const parts = germanDate.split('.');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return '';
  };

  // Convert input format (YYYY-MM-DD) to German date format (DD.MM.YYYY)
  const inputToGermanDate = (inputDate) => {
    if (!inputDate) return '';
    const [year, month, day] = inputDate.split('-');
    return `${day}.${month}.${year}`;
  };

  // Validate German date format
  const isValidGermanDate = (dateStr) => {
    const parts = dateStr.split('.');
    if (parts.length !== 3) return false;
    
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const year = parseInt(parts[2]);
    
    if (day < 1 || day > 31) return false;
    if (month < 1 || month > 12) return false;
    if (year < 1900 || year > 2100) return false;
    
    // Check if the date is valid
    const date = new Date(year, month - 1, day);
    return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year;
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleEdit = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(germanToInputDate(currentDate));
    setError('');
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setIsEditing(false);
    setEditValue('');
    setError('');
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    
    if (!editValue) {
      setError('Date is required');
      return;
    }

    const germanDate = inputToGermanDate(editValue);
    
    if (!isValidGermanDate(germanDate)) {
      setError('Invalid date');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await updateRecord('sessions', session.id, { date: germanDate });
      
      // Call the callback to update the parent component
      if (onDateUpdate) {
        onDateUpdate(session.id, germanDate);
      }
      
      setIsEditing(false);
      setEditValue('');
    } catch (error) {
      console.error('Error updating session date:', error);
      setError('Failed to update date');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave(e);
    } else if (e.key === 'Escape') {
      handleCancel(e);
    }
  };

  const safelyRenderValue = (value) => {
    if (value === null || value === undefined) {
      return '-';
    }
    return String(value);
  };

  if (isEditing) {
    return (
      <div className="editable-date-container editing" onClick={(e) => e.stopPropagation()}>
        <div className="date-input-wrapper">
          <input
            ref={inputRef}
            type="date"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="date-input"
          />
          <div className="edit-actions">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="save-btn"
              title="Save"
            >
              <FontAwesomeIcon icon={faCheck} />
            </button>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="cancel-btn"
              title="Cancel"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>
        {error && <div className="edit-error">{error}</div>}
      </div>
    );
  }

  return (
    <div className="editable-date-container" onClick={(e) => e.stopPropagation()}>
      <span className="date-value">{safelyRenderValue(currentDate)}</span>
      <button
        onClick={handleEdit}
        className="edit-date-btn"
        title="Edit date"
      >
        <FontAwesomeIcon icon={faEdit} />
      </button>
    </div>
  );
};

export default EditableDate; 