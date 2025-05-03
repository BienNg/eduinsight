// src/features/teachers/components/TeacherHeader.jsx
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate } from 'react-router-dom';

const TeacherHeader = ({ teacher, courses, sessions }) => {
  const navigate = useNavigate();
  
  const handleBack = () => {
    navigate('/teachers');
  };

  return (
    <>
      <div className="breadcrumb">
        <span className="breadcrumb-link" onClick={handleBack}>Lehrer</span>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">{teacher.name}</span>
      </div>

      <div className="teacher-header">
        <div className="teacher-title-section">
          <div className="teacher-header-row">
            <h1 className="teacher-name">{teacher.name}</h1>
            <div className="teacher-meta-info">
              <span className="teacher-country">{teacher.country || 'No Country'}</span>
              <span className="teacher-separator">•</span>
              <span className="teacher-stats">{courses.length} Kurse</span>
              <span className="teacher-separator">•</span>
              <span className="teacher-stats">{sessions.length} Lektionen</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TeacherHeader;