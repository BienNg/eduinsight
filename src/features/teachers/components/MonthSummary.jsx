// src/features/teachers/components/MonthSummary.jsx
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faHourglassHalf, faClock } from '@fortawesome/free-solid-svg-icons';

const MonthSummary = ({ totalSessions, totalHours, totalLongSessions }) => {
  return (
    <div className="month-summary horizontal-with-vertical-items">
      <div className="summary-item">
        <FontAwesomeIcon icon={faCalendarAlt} className="summary-icon" />
        <span className="summary-value">{totalSessions}</span>
        <span className="summary-label">Gesamt Lektionen</span>
      </div>
      <div className="summary-item">
        <FontAwesomeIcon icon={faHourglassHalf} className="summary-icon" />
        <span className="summary-value">{totalHours.toFixed(1)}h</span>
        <span className="summary-label">Gesamt Stunden</span>
      </div>
      <div className="summary-item">
        <FontAwesomeIcon icon={faClock} className="summary-icon" />
        <span className="summary-value">{totalLongSessions}</span>
        <span className="summary-label">2h-Lektionen</span>
      </div>
    </div>
  );
};

export default MonthSummary;