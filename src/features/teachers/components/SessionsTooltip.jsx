// src/features/teachers/components/SessionsTooltip.jsx
const SessionsTooltip = ({ hoverTooltip }) => {
    return (
      <div
        className={`sessions-tooltip ${hoverTooltip.visible ? 'visible' : ''}`}
        style={{
          left: hoverTooltip.position.x + 'px',
          top: hoverTooltip.position.y + 'px',
          display: hoverTooltip.visible ? 'block' : 'none'
        }}
      >
        {hoverTooltip.visible && (
          <>
            <div className="tooltip-header">Completed Sessions</div>
            {hoverTooltip.sessions.length > 0 ? (
              hoverTooltip.sessions.map(session => (
                <div key={session.id} className="tooltip-session-item">
                  <div className="tooltip-session-title">{session.title}</div>
                  <div className="tooltip-session-meta">
                    <span>{session.date}</span>
                    <span>{session.startTime} - {session.endTime}</span>
                  </div>
                </div>
              ))
            ) : (
              <div>No completed sessions for this course</div>
            )}
          </>
        )}
      </div>
    );
  };
  
  export default SessionsTooltip;