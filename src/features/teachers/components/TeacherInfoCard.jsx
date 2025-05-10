// src/features/teachers/components/TeacherInfoCard.jsx
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

const TeacherInfoCard = ({
  teacher,
  courses,
  uniqueGroupIds,
  sessionsTotalHours,
  sessionsLength,
  longSessionsCount,
  updateTeacherData
}) => {
  const [isEditingCountry, setIsEditingCountry] = useState(false);
  const [countryValue, setCountryValue] = useState(teacher.country || '');
  const [updateStatus, setUpdateStatus] = useState(null);

  // Available countries for selection
  const availableCountries = ['Deutschland', 'Vietnam'];

  const handleUpdateCountry = async () => {
    try {
      setUpdateStatus(null);
      const success = await updateTeacherData('country', countryValue);

      if (success) {
        setUpdateStatus('success');
      } else {
        setUpdateStatus('error');
      }

      // Clear success message after 3 seconds
      setTimeout(() => {
        setUpdateStatus(null);
      }, 3000);
    } catch (err) {
      console.error("Error updating teacher country:", err);
      setUpdateStatus('error');
    } finally {
      setIsEditingCountry(false);
    }
  };

  return (
    <div className="overview-panel animate-card">
      <div className="panel-header">
        <h3 className="panel-title">Lehrer Information</h3>
      </div>
      <div className="panel-content">
        <div className="info-grid two-column">
          <div className="info-item">
            <span className="label">Name:</span>
            <span className="value">{teacher.name}</span>
          </div>
          <div className="info-item">
            <span className="label">Land:</span>
            {isEditingCountry ? (
              <div className="edit-country-container">
                <select
                  value={countryValue}
                  onChange={(e) => setCountryValue(e.target.value)}
                  className="country-select"
                  autoFocus
                >
                  <option value="">-- Select Country --</option>
                  {availableCountries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
                <div className="edit-actions">
                  <button
                    onClick={handleUpdateCountry}
                    className="btn-icon success"
                    title="Save"
                    disabled={!countryValue}
                  >
                    <FontAwesomeIcon icon={faCheck} />
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingCountry(false);
                      setCountryValue(teacher.country || '');
                    }}
                    className="btn-icon cancel"
                    title="Cancel"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="value-with-edit">
                <span className="value">{teacher.country || 'No Country'}</span>
                <button
                  onClick={() => setIsEditingCountry(true)}
                  className="btn-edit"
                  title="Edit country"
                >
                  <FontAwesomeIcon icon={faEdit} />
                </button>
              </div>
            )}
          </div>
          <div className="info-item">
            <span className="label">Gesamt Kurse:</span>
            <span className="value">{courses.length}</span>
          </div>
          <div className="info-item">
            <span className="label">Gesamt Gruppen:</span>
            <span className="value">{uniqueGroupIds}</span>
          </div>
          <div className="info-item">
            <span className="label">Gesamt Lektionen:</span>
            <span className="value">{sessionsLength}</span>
          </div>
          <div className="info-item">
            <span className="label">2h-Lektionen:</span>
            <span className="value">{longSessionsCount}</span>
          </div>
          <div className="info-item">
            <span className="label">Gesamt Stunden:</span>
            <span className="value">{sessionsTotalHours.toFixed(1)}</span>
          </div>
        </div>

        {updateStatus && (
          <div className={`update-status ${updateStatus}`}>
            {updateStatus === 'success' ? 'Country updated successfully!' : 'Failed to update country.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherInfoCard;