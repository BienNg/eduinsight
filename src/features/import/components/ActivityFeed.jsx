import { useState, useEffect } from 'react';
import { getChangelog } from '../../firebase/changelog';

const ActivityFeed = ({ processingQueue, completedFiles, failedFiles }) => {
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveActivity, setLiveActivity] = useState([]);

  // Fetch recent activity from changelog
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const logs = await getChangelog(10);
        setRecentActivity(logs);
      } catch (error) {
        console.error('Error fetching activity:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, []);

  // Create live activity feed from current session
  useEffect(() => {
    const sessionActivity = [];
    
    // Add completed files as activity (excluding skipped and no-updates)
    completedFiles.forEach(file => {
      // Skip files that were skipped or had no updates
      if (file.status === 'skipped' || file.status === 'no-updates') {
        return;
      }
      
      sessionActivity.push({
        id: `completed-${file.id}`,
        type: 'import',
        filename: file.name,
        timestamp: new Date().toISOString(),
        metrics: {
          sessions: file.sessionsAdded || 0,
          students: file.studentsAdded || 0,
          courses: file.coursesAdded || 0
        },
        status: 'completed'
      });
    });

    // Add processing files as activity
    processingQueue.forEach((file, index) => {
      if (index === 0) { // Only the actively processing file
        sessionActivity.push({
          id: `processing-${file.id}`,
          type: 'processing',
          filename: file.name,
          timestamp: new Date().toISOString(),
          progress: file.progress || 0,
          status: 'processing'
        });
      }
    });

    setLiveActivity(sessionActivity);
  }, [completedFiles, processingQueue]);

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const ActivityItem = ({ activity, isLive = false }) => {
    const getActivityIcon = () => {
      if (activity.status === 'processing') {
        return (
          <div style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '50%', 
            background: 'var(--import-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '16px', height: '16px' }}>
              <circle cx="12" cy="12" r="3"/>
              <animateTransform
                attributeName="transform"
                attributeType="XML"
                type="rotate"
                from="0 12 12"
                to="360 12 12"
                dur="1s"
                repeatCount="indefinite"
              />
            </svg>
          </div>
        );
      }
      
      return (
        <div style={{ 
          width: '32px', 
          height: '32px', 
          borderRadius: '50%', 
          background: 'var(--import-success)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white'
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
            <path d="m9 12 2 2 4-4"/>
          </svg>
        </div>
      );
    };

    return (
      <div style={{ 
        display: 'flex', 
        gap: '0.75rem', 
        padding: '1rem',
        borderRadius: '0.75rem',
        background: isLive ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
        border: isLive ? '1px solid rgba(99, 102, 241, 0.2)' : 'none',
        transition: 'all 0.3s ease'
      }}>
        {getActivityIcon()}
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ 
            fontWeight: '600', 
            color: 'var(--import-text)',
            fontSize: '0.875rem',
            marginBottom: '0.25rem'
          }}>
            {activity.filename}
          </div>
          
          {activity.status === 'processing' ? (
            <div style={{ color: 'var(--import-text-light)', fontSize: '0.75rem' }}>
              Processing... {activity.progress}%
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              fontSize: '0.75rem',
              color: 'var(--import-text-light)'
            }}>
              {activity.metrics?.sessions > 0 && (
                <span>+{activity.metrics.sessions} sessions</span>
              )}
              {activity.metrics?.students > 0 && (
                <span>+{activity.metrics.students} students</span>
              )}
              {activity.metrics?.courses > 0 && (
                <span>+{activity.metrics.courses} courses</span>
              )}
            </div>
          )}
          
          <div style={{ 
            color: 'var(--import-text-light)', 
            fontSize: '0.75rem',
            marginTop: '0.25rem'
          }}>
            {formatTimeAgo(activity.timestamp)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="activity-feed">
      {/* Activity header with pulse */}
      <div className="activity-header">
        <div className="activity-pulse" />
        <h3 className="activity-title">Live Activity</h3>
        <div className="activity-counter">
          {liveActivity.length + recentActivity.length}
        </div>
      </div>

      {/* Activity feed */}
      <div style={{ 
        maxHeight: '500px', 
        overflowY: 'auto',
        paddingRight: '0.5rem'
      }}>
        {/* Live session activity */}
        {liveActivity.map(activity => (
          <ActivityItem key={activity.id} activity={activity} isLive={true} />
        ))}

        {/* Recent activity from database */}
        {!loading && recentActivity.slice(0, 8).map(log => (
          <ActivityItem 
            key={log.id} 
            activity={{
              filename: log.filename || 'System Update',
              timestamp: log.timestamp,
              metrics: {
                sessions: log.sessionsAdded || 0,
                students: log.studentsAdded || 0,
                courses: log.coursesAdded || 0
              },
              status: 'completed'
            }} 
          />
        ))}

        {loading && (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem',
            color: 'var(--import-text-light)'
          }}>
            Loading activity...
          </div>
        )}

        {!loading && liveActivity.length === 0 && recentActivity.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem',
            color: 'var(--import-text-light)'
          }}>
            No recent activity. Start importing to see live updates!
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed; 