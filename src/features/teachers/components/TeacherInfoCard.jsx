// src/features/teachers/components/TeacherInfoCard.jsx
const TeacherInfoCard = ({ teacher, courses, uniqueGroupIds, sessionsTotalHours, sessionsLength }) => {
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
              <span className="value">{teacher.country || 'No Country'}</span>
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
              <span className="label">Gesamt Stunden:</span>
              <span className="value">{sessionsTotalHours.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default TeacherInfoCard;