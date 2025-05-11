// src/features/database/components/CoursesFilters.jsx
import React from 'react';

const CoursesFilters = ({
    groups,
    filters,
    onFilterChange,
    filterLogic,
    onFilterLogicChange,
    availableLevels,
    availableStatuses
}) => {
    return (
        <div className="courses-filters">
            <div className="filter-container">
                <div className="filter-row">
                    <div className="filter-item">
                        <label htmlFor="levelFilter">Level:</label>
                        <select
                            id="levelFilter"
                            value={filters.level || ''}
                            onChange={(e) => onFilterChange('level', e.target.value || null)}
                        >
                            <option value="">All Levels</option>
                            <option value="empty">No Level</option>
                            {availableLevels.map((level) => (
                                <option key={level} value={level}>
                                    {level}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-item">
                        <label htmlFor="statusFilter">Status:</label>
                        <select
                            id="statusFilter"
                            value={filters.status || ''}
                            onChange={(e) => onFilterChange('status', e.target.value || null)}
                        >
                            <option value="">All Statuses</option>
                            <option value="empty">No Status</option>
                            {availableStatuses.map((status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-item">
                        <label htmlFor="groupFilter">Group:</label>
                        <select
                            id="groupFilter"
                            value={filters.groupId || ''}
                            onChange={(e) => onFilterChange('groupId', e.target.value || null)}
                        >
                            <option value="">All Groups</option>
                            <option value="empty">No Group</option>
                            {groups.map((group) => (
                                <option key={group.id} value={group.id}>
                                    {group.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-item">
                        <label htmlFor="hasSessionsFilter">Sessions:</label>
                        <select
                            id="hasSessionsFilter"
                            value={filters.hasSessions || ''}
                            onChange={(e) => onFilterChange('hasSessions', e.target.value || null)}
                        >
                            <option value="">Any</option>
                            <option value="yes">Has Sessions</option>
                            <option value="no">No Sessions</option>
                        </select>
                    </div>

                    <div className="filter-item">
                        <label htmlFor="hasStudentsFilter">Students:</label>
                        <select
                            id="hasStudentsFilter"
                            value={filters.hasStudents || ''}
                            onChange={(e) => onFilterChange('hasStudents', e.target.value || null)}
                        >
                            <option value="">Any</option>
                            <option value="yes">Has Students</option>
                            <option value="no">No Students</option>
                        </select>
                    </div>

                    <div className="filter-item">
                        <label htmlFor="hassourceUrlFilter">Source URL:</label>
                        <select
                            id="hassourceUrlFilter"
                            value={filters.hassourceUrl || ''}
                            onChange={(e) => onFilterChange('hassourceUrl', e.target.value || null)}
                        >
                            <option value="">Any</option>
                            <option value="yes">Available</option>
                            <option value="no">Not Available</option>
                        </select>
                    </div>

                    <div className="filter-item">
                        <label htmlFor="filterLogic">Filter Logic:</label>
                        <select
                            id="filterLogic"
                            value={filterLogic}
                            onChange={(e) => onFilterLogicChange(e.target.value)}
                        >
                            <option value="AND">AND</option>
                            <option value="OR">OR</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoursesFilters;