// src/components/common/SearchBar.jsx
import React from 'react';
import '../styles/SearchBar.css';

const SearchBar = ({ placeholder, value, onChange, className = '' }) => {
  return (
    <div className={`search-bar-pillar ${className}`}>
      <input
        type="text"
        placeholder={placeholder || "Search..."}
        value={value}
        onChange={onChange}
        className="search-input"
      />
      <span className="search-icon">
        <svg width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.5 15.5l-4-4m-4 2a6 6 0 100-12 6 6 0 000 12z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );
};

export default SearchBar;