// src/features/components/Chip.jsx
import React from 'react';

const Chip = ({ label, type }) => {
  // Define colors based on type
  const getChipStyle = () => {
    switch (type) {
      case 'Online':
        return {
          backgroundColor: '#E3F2FD',
          color: '#0277BD',
          border: '1px solid #90CAF9'
        };
      case 'Offline':
        return {
          backgroundColor: '#FFEBEE',
          color: '#C62828',
          border: '1px solid #FFCDD2'
        };
      default:
        return {
          backgroundColor: '#F5F5F5',
          color: '#616161',
          border: '1px solid #E0E0E0'
        };
    }
  };

  return (
    <span
      style={{
        ...getChipStyle(),
        borderRadius: '16px',
        padding: '2px 8px',
        fontSize: '12px',
        fontWeight: '500',
        display: 'inline-flex',
        alignItems: 'center',
        height: '20px',
        marginLeft: '8px'
      }}
    >
      {label}
    </span>
  );
};

export default Chip;