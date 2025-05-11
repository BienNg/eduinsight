// src/features/common/components/StatsGrid.jsx
import styles from '../../styles/modules/StatsGrid.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const colorClasses = {
  blue: styles.blue,
  green: styles.green,
  yellow: styles.yellow,
  purple: styles.purple,
  orange: styles.orange
};

const StatsGrid = ({ stats, columns = 5 }) => {
  // Determine the column class based on the number of columns
  const columnsClass = styles[`columns${columns}`] || styles.columns5;

  return (
    <div className={`${styles.statsGrid} ${columnsClass}`}>
      {stats.map((stat, index) => (
        <div key={index} className={styles.statCard}>
          {stat.icon && (
            <FontAwesomeIcon 
              icon={stat.icon} 
              size="lg" 
              className={colorClasses[stat.color] || colorClasses.blue} 
            />
          )}
          {stat.renderValue ? (
            stat.renderValue()
          ) : (
            <div className={styles.statValue}>{stat.value}</div>
          )}
          <div className={styles.statLabel}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
};

export default StatsGrid;