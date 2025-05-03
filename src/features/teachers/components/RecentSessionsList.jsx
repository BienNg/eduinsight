// src/features/teachers/components/RecentSessionsList.jsx
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock } from '@fortawesome/free-solid-svg-icons';

const RecentSessionsList = ({ sessions, courses }) => {
  return (
    <div className="overview-panel animate-card">
      <div className="panel-header">
        <h3 className="panel-title">Letzte Lektionen</h3>
      </div>
      <div className="panel-content">
        {sessions.length > 0 ? (
          <div className="compact-session-list">
            {sessions.slice(0, 10).map(session => {
              const course = courses.find(c => c.id === session.courseId) || {};
              return (
                <div
                  className="compact-session-item"
                  key={session.id}
                >
                  <div className="session-main-info">
                    <div className="session-date">{session.date}</div>
                    <div className="session-title">{session.title}</div>
                  </div>
                  <div className="session-meta">
                    <span>{course.name || 'Unknown Course'}</span>
                    <span>
                      {session.startTime} - {session.endTime}
                      {session.isLongSession === true && (
                        <FontAwesomeIcon
                          icon={faClock}
                          style={{ marginLeft: '5px' }}
                        />
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
            {sessions.length > 10 && (
              <div className="more-items-hint">
                +{sessions.length - 10} weitere Lektionen
              </div>
            )}
          </div>
        ) : (
          <div className="empty-message">Keine Lektionen vorhanden.</div>
        )}
      </div>
    </div>
  );
};

export default RecentSessionsList;