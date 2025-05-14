// src/features/common/components/SortableTable.jsx
import { useState } from 'react';
import styles from '../../styles/modules/Table.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faPen, faTrash } from '@fortawesome/free-solid-svg-icons';

const SortableTable = ({ 
  columns, 
  data, 
  defaultSortColumn, 
  defaultSortDirection = 'ascending',
  onRowClick,
  rowKeyField = 'id',
  actions
}) => {
  const [sortConfig, setSortConfig] = useState({
    key: defaultSortColumn,
    direction: defaultSortDirection
  });
  
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

  const renderDefaultActions = (row) => {
    return (
      <div className={styles.actionButtons}>
        <button className={styles.iconButton}>
          <FontAwesomeIcon icon={faEye} />
        </button>
        <button className={styles.iconButton}>
          <FontAwesomeIcon icon={faPen} />
        </button>
        <button className={styles.iconButton}>
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </div>
    );
  };
  
  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
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
            {actions && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {getSortedData().map((row) => (
            <tr 
              key={row[rowKeyField]} 
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? styles.selectableRow : ''}
            >
              {columns.map((column) => (
                <td key={`${row[rowKeyField]}-${column.key}`}>
                  {column.key === 'status' ? 
                    renderStatusBadge(row[column.key]) : 
                    (column.render ? column.render(row) : row[column.key])}
                </td>
              ))}
              {actions && (
                <td>
                  {typeof actions === 'function' ? actions(row) : renderDefaultActions(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SortableTable;