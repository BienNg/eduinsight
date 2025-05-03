// src/features/teachers/components/CourseItem.jsx
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import ProgressBar from '../../common/ProgressBar';
import { getTotalSessionsByLevel } from '../utils/teacherDetailUtils';

const CourseItem = ({ data, courseCompletionMap, groupsData, onHover, onLeave }) => {
  const navigate = useNavigate();
  
  const courseProgress = courseCompletionMap[data.course.id] || { total: 0, completed: 0 };
  const totalSessionCount = getTotalSessionsByLevel(data.course.level);
  const completedSessionCount = courseProgress.completed;
  
  // Calculate progress percentage
  const progress = totalSessionCount > 0
    ? (completedSessionCount / totalSessionCount) * 100
    : 0;
    
  return (
    <div
      className="compact-course-item clickable"
      onClick={() => navigate(`/courses/${data.course.id}`)}
      onMouseEnter={(e) => onHover(e, data.course.id)}
      onMouseLeave={onLeave}
    >
      <div className="course-info-container">
        <div className="course-name-wrapper">
          <span
            className="course-color-circle"
            style={{
              backgroundColor: data.course.groupId &&
                groupsData.find(g => g.id === data.course.groupId)?.color || '#cccccc'
            }}
          ></span>
          <span className="course-name">{data.course.name}</span>
        </div>

        <div className="course-meta">
          <span>{data.sessions.length} Lektionen</span>
          <span>{data.totalHours.toFixed(1)}h</span>
          {data.longSessionsCount > 0 && (
            <span className="long-session-count">
              <FontAwesomeIcon icon={faClock} />
              {data.longSessionsCount}
            </span>
          )}
        </div>
      </div>

      <div className="course-progress-container">
        <ProgressBar
          progress={progress}
          color={data.course.color || '#0088FE'}
          height="6px"
          showLabel={true}
          labelPosition="right"
          customLabel={`${completedSessionCount}/${totalSessionCount}`}
        />
      </div>
    </div>
  );
};

export default CourseItem;