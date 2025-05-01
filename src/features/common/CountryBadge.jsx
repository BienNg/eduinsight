// src/features/common/CountryBadge.jsx
import React from 'react';
import './CountryBadge.css';

const countryShortForms = {
  'Vietnam': 'VN',
  'Deutschland': 'DE',
  // Add more country mappings as needed
};

const CountryBadge = ({ country }) => {
  let displayText = 'No Country';
  
  if (country && country.trim() !== '') {
    displayText = countryShortForms[country] || country;
  }
  
  return (
    <span className="country-badge">
      {displayText}
    </span>
  );
};

export default CountryBadge;