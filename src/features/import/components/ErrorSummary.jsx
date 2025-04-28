import React, { useState, useEffect } from 'react';

const ErrorSummary = ({ errors, filename }) => {
  const [groupedErrors, setGroupedErrors] = useState({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});

  useEffect(() => {
    if (!errors || errors.length === 0) return;

    // Parse the error string into an array if it's not already
    const errorArray = typeof errors === 'string'
      ? errors.split(', ').filter(e => e)
      : Array.isArray(errors) ? errors : [errors];

    // Group errors by type
    const grouped = errorArray.reduce((acc, error) => {
      // Extract error type
      let errorType = 'Other Issues';

      if (error.includes('missing a start time')) {
        errorType = 'Missing Start Times';
      } else if (error.includes('missing an end time')) {
        errorType = 'Missing End Times';
      } else if (error.includes('missing teacher information')) {
        errorType = 'Missing Teacher Information';
      } else if (error.includes('missing a date')) {
        errorType = 'Missing Dates';
      } else if (error.includes('Empty cell in Folien column')) {
        errorType = 'Missing Session Titles';
      } else if (error.includes('invalid date format')) {
        errorType = 'Invalid Date Formats';
      } else if (error.includes('Could not find header row')) {
        errorType = 'File Structure Issues';
      } else if (error.includes('Required column')) {
        errorType = 'Missing Required Columns';
      }

      // Extract row numbers for better organization
      // Enhanced pattern to match "Row X:" format precisely
      const rowMatch = error.match(/Row (\d+):/);
      const rowNum = rowMatch ? parseInt(rowMatch[1]) : null;

      if (!acc[errorType]) acc[errorType] = [];
      acc[errorType].push({ text: error, row: rowNum });

      return acc;
    }, {});

    // Sort each error group by row number
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => (a.row || 0) - (b.row || 0));
    });

    setGroupedErrors(grouped);

    // Initialize all groups as collapsed
    const initialExpandState = {};
    Object.keys(grouped).forEach(key => {
      initialExpandState[key] = false;
    });
    setExpandedGroups(initialExpandState);
  }, [errors]);

  // Generate user-friendly guidance based on error types
  const getErrorGuidance = (errorType) => {
    switch (errorType) {
      case 'Missing Start Times':
        return 'Add start times in the "von" column for these sessions';
      case 'Missing End Times':
        return 'Add end times in the "bis" column for these sessions';
      case 'Missing Teacher Information':
        return 'Add teacher names in the "Lehrer" column for these sessions';
      case 'Missing Dates':
        return 'Add dates in the "Datum" or "Unterrichtstag" column for these sessions';
      case 'Missing Session Titles':  // Add this case
        return 'Add titles in the "Folien" column for these sessions';
      case 'Invalid Date Formats':
        return 'Ensure dates are in DD.MM.YYYY format';
      case 'File Structure Issues':
        return 'Check that your file has the correct structure with a "Folien" column header';
      case 'Missing Required Columns':
        return 'Make sure your file includes all required columns: Folien, Datum/Unterrichtstag, Lehrer, von, bis';
      default:
        return 'Review and fix these issues in your Excel file';
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleGroup = (errorType) => {
    setExpandedGroups(prev => ({
      ...prev,
      [errorType]: !prev[errorType]
    }));
  };

  // No errors to display
  if (Object.keys(groupedErrors).length === 0) return null;

  // Count total errors
  const totalErrors = Object.values(groupedErrors).reduce(
    (sum, errors) => sum + errors.length, 0
  );

  return (
    <div className="error-summary">
      <div className="error-summary-header" onClick={toggleExpand}>
        <div className="error-summary-title">
          <span className="error-icon">⚠️</span>
          <h4>{totalErrors} issues found in "{filename}"</h4>
          <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="error-summary-content">
          <p className="error-hint">Please fix the following issues in your Excel file:</p>

          {Object.keys(groupedErrors).map(errorType => (
            <div key={errorType} className="error-group">
              <div className="error-group-header" onClick={() => toggleGroup(errorType)}>
                <h5>{errorType} <span className="error-count">({groupedErrors[errorType].length})</span></h5>
                <span className="expand-icon">{expandedGroups[errorType] ? '▼' : '▶'}</span>
              </div>

              {expandedGroups[errorType] && (
                <div className="error-group-content">
                  <p className="error-guidance">{getErrorGuidance(errorType)}</p>

                  {errorType === 'File Structure Issues' || errorType === 'Missing Required Columns' ? (
                    <ul className="error-list">
                      {groupedErrors[errorType].map((error, idx) => (
                        <li key={idx}>{error.text}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="row-summary">
                      <p>Affected rows: {
                        groupedErrors[errorType]
                          .map(e => e.row)
                          .filter(r => r !== null && r !== undefined)
                          .length > 0
                          ? groupedErrors[errorType]
                            .map(e => e.row)
                            .filter(r => r !== null && r !== undefined)
                            .join(', ')
                          : 'None'
                      }</p>
                      {/* For debugging, print raw error text */}
                      {process.env.NODE_ENV === 'development' && (
                        <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
                          <p>Debug - Error messages:</p>
                          <ul>
                            {groupedErrors[errorType].map((error, idx) => (
                              <li key={idx}>{error.text} (row: {error.row || 'none'})</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}
            </div>
          ))}

          <div className="error-fixes">
            <h5>How to fix these issues:</h5>
            <ol>
              <li>Open your Excel file "{filename}"</li>
              <li>Check the rows mentioned above for missing information</li>
              <li>Ensure all sessions have a date, start time, end time, and teacher name</li>
              <li>Save your file and try importing again</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorSummary;