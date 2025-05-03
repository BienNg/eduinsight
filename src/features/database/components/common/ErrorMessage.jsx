// src/features/database/components/common/ErrorMessage.jsx
import React from 'react';

const ErrorMessage = ({ message }) => (
  <div className="error-message">
    <p>{message}</p>
  </div>
);

export default ErrorMessage;