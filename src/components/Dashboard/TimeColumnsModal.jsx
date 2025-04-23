// src/components/Dashboard/TimeColumnsModal.jsx
import React from 'react';
import './Modal.css'; // Make sure to create this CSS file

const TimeColumnsModal = ({ isOpen, onClose, onConfirm, filename }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>Missing Time Columns</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p>
            The file <strong>{filename}</strong> is missing start time and/or end time columns 
            (von/bis, from/to).
          </p>
          <p>Sessions without time information will be imported with empty start/end times.</p>
          <p>Do you want to continue with the import?</p>
        </div>
        <div className="modal-footer">
          <button 
            className="cancel-button" 
            onClick={onClose}
          >
            Cancel Import
          </button>
          <button 
            className="confirm-button" 
            onClick={onConfirm}
          >
            Continue Import
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimeColumnsModal;