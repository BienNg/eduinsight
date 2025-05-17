// src/prototype/dashboard/components/FilterSidebar.jsx
import React from 'react';
import './components.css'; 

const FilterSidebar = ({ filters, updateFilters, courseTypes, teachers, groups }) => {
  return (
    <div className="filter-sidebar-container">
      <div className="filter-header">
        <h3>Dashboard Filters</h3>
        <button 
          className="reset-button"
          onClick={() => updateFilters({
            timePeriod: 'term',
            courseType: 'all',
            teacherId: null,
            groupId: null
          })}
        >
          Reset
        </button>
      </div>
      
      <div className="filter-section">
        <h4>Time Period</h4>
        <div className="radio-group">
          <label className="radio-option">
            <input 
              type="radio" 
              name="timePeriod" 
              value="week"
              checked={filters.timePeriod === 'week'}
              onChange={() => updateFilters({ timePeriod: 'week' })}
            />
            <span>Current Week</span>
          </label>
          <label className="radio-option">
            <input 
              type="radio" 
              name="timePeriod" 
              value="month"
              checked={filters.timePeriod === 'month'}
              onChange={() => updateFilters({ timePeriod: 'month' })}
            />
            <span>Current Month</span>
          </label>
          <label className="radio-option">
            <input 
              type="radio" 
              name="timePeriod" 
              value="term"
              checked={filters.timePeriod === 'term'}
              onChange={() => updateFilters({ timePeriod: 'term' })}
            />
            <span>Full Term</span>
          </label>
        </div>
      </div>
      
      <div className="filter-section">
        <h4>Course Type</h4>
        <div className="select-container">
          <select
            value={filters.courseType}
            onChange={(e) => updateFilters({ courseType: e.target.value })}
            className="filter-select"
          >
            <option value="all">All Course Types</option>
            {courseTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="filter-section">
        <h4>Teacher</h4>
        <div className="select-container">
          <select
            value={filters.teacherId || ''}
            onChange={(e) => updateFilters({ teacherId: e.target.value || null })}
            className="filter-select"
          >
            <option value="">All Teachers</option>
            {teachers.map(teacher => (
              <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="filter-section">
        <h4>Group</h4>
        <div className="select-container">
          <select
            value={filters.groupId || ''}
            onChange={(e) => updateFilters({ groupId: e.target.value || null })}
            className="filter-select"
          >
            <option value="">All Groups</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="filter-section">
        <h4>Alert Settings</h4>
        <div className="threshold-control">
          <label>Attendance Alert Threshold</label>
          <div className="threshold-slider">
            <input 
              type="range" 
              min="70" 
              max="95" 
              defaultValue="80"
              className="slider"
            />
            <div className="slider-value">80%</div>
          </div>
        </div>
        <div className="threshold-control">
          <label>Progress Alert Threshold</label>
          <div className="threshold-slider">
            <input 
              type="range" 
              min="5" 
              max="30" 
              defaultValue="15"
              className="slider"
            />
            <div className="slider-value">15%</div>
          </div>
        </div>
      </div>
      
      <div className="filter-section">
        <h4>Dashboard Presets</h4>
        <div className="preset-buttons">
          <button className="preset-button">Overview</button>
          <button className="preset-button">Teacher Focus</button>
          <button className="preset-button">Attendance</button>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;