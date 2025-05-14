// src/features/common/components/SortableTable.jsx
import { useState } from 'react';
import styles from '../../styles/modules/Table.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';

const SortableTable = ({ 
  columns, 
  data, 
  defaultSortColumn, 
  defaultSortDirection = 'ascending',
  onRowClick,
  rowKeyField = 'id',
  title = null,
  animationDelay = 1 // Add a prop for animation delay
}) => {
  const [sortConfig, setSortConfig] = useState({
    key: defaultSortColumn,
    direction: defaultSortDirection
  });
  
  // Modify columns to include title in first column if provided
  const modifiedColumns = [...columns];
  if (title && modifiedColumns.length > 0) {
    modifiedColumns[0] = {
      ...modifiedColumns[0],
      label: title
    };
  }
  
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key) {
      direction = sortConfig.direction === 'ascending' ? 'descending' : 'ascending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortedData = () => {
    if (!sortConfig.key) return data;
    
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      // Handle undefined or null values
      if (aValue == null) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (bValue == null) return sortConfig.direction === 'ascending' ? 1 : -1;
      
      // Handle numbers
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
      }
      
      // Handle dates (assumes strings in date format)
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortConfig.direction === 'ascending' 
          ? aValue.getTime() - bValue.getTime() 
          : bValue.getTime() - aValue.getTime();
      }
      
      // Default to string comparison
      return sortConfig.direction === 'ascending'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  };
  
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? '↑' : '↓';
  };

  const renderStatusBadge = (status) => {
    const statusLower = String(status).toLowerCase();
    let badgeClass = styles.statusBadge;
    
    if (statusLower === 'paid') {
      badgeClass += ` ${styles.statusCompleted}`;
    } else if (statusLower === 'unpaid') {
      badgeClass += ` ${styles.statusOngoing}`;
    }
    
    return <span className={badgeClass}>{status}</span>;
  };
  
  // Add animation class based on the delay - moved here to fix scope issue
  const animationClass = `${styles.animatedTable} ${styles[`tableAnimationDelay${animationDelay}`]}`;
  
  return (
    <div className={`${styles.tableContainer} ${animationClass}`}>
      <table className={styles.table}>
        <thead>
          <tr>
            {modifiedColumns.map((column, index) => (
              <th 
                key={column.key}
                onClick={() => column.sortable ? requestSort(column.key) : null}
                className={`
                  ${column.sortable ? styles.sortableHeader : ''}
                  ${sortConfig.key === column.key ? 
                    (sortConfig.direction === 'ascending' ? styles.sortedAscending : styles.sortedDescending) : ''}
                `}
              >
                {column.label} {getSortIcon(column.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {getSortedData().map((row) => (
            <tr 
              key={row[rowKeyField]}
              className={onRowClick ? styles.selectableRow : ''}
            >
              {columns.map((column, index) => {
                // Only make the first column clickable
                const isFirstColumn = index === 0;
                const cellContent = column.key === 'status' 
                  ? renderStatusBadge(row[column.key]) 
                  : (column.render ? column.render(row) : row[column.key]);
                
                return (
                  <td 
                    key={`${row[rowKeyField]}-${column.key}`}
                    onClick={isFirstColumn && onRowClick ? () => onRowClick(row) : undefined}
                    className={isFirstColumn && onRowClick ? styles.clickableCell : ''}
                  >
                    {isFirstColumn && onRowClick ? (
                      <div className={styles.clickableCellContent}>
                        <span>{cellContent}</span>
                        <FontAwesomeIcon icon={faChevronRight} className={styles.clickableIcon} />
                      </div>
                    ) : (
                      cellContent
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SortableTable;