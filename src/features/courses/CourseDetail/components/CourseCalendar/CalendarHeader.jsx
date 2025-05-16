// src/features/courses/CourseDetail/components/CourseCalendar/CalendarHeader.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLink } from '@fortawesome/free-solid-svg-icons';
import Chip from '../../../components/Chip';
import TeacherBadge from '../../../../common/TeacherBadge'; // Import TeacherBadge

const CalendarHeader = ({
  customTitle = "Kurs Kalender",
  sourceUrl,
  mode,
  teachers = [],
  isLoadingTeachers = false // Add isLoadingTeachers prop
}) => {
  // Function to handle URL click
  const handleUrlClick = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    if (sourceUrl) {
      window.open(sourceUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="calendar-header">
      <div className="calendar-title-section">
        <div className="calendar-title-container">
          <h2 className="calendar-title">{customTitle}</h2>
          {mode && <Chip label={mode} type={mode} />}
          {sourceUrl && (
            <span
              className="calendar-source-url"
              onClick={handleUrlClick}
              title="Open Google Sheet"
            >
              <FontAwesomeIcon icon={faLink} />
            </span>
          )}
        </div>

        {/* Teachers section with loading indicator */}
        <div className="calendar-teachers">
          {isLoadingTeachers ? (
            <div className="teacher-loading">
              <span className="teacher-loading-dot"></span>
              <span className="teacher-loading-dot"></span>
              <span className="teacher-loading-dot"></span>
            </div>
          ) : teachers.length > 0 ? (
            teachers.map(teacher => (
              <TeacherBadge key={teacher.id} teacher={teacher} />
            ))
          ) : (
            <span className="no-teachers">No teachers assigned</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarHeader;