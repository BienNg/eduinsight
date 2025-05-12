// src/features/courses/CourseDetail/components/CourseHeader.jsx
import React from 'react';

const CourseHeader = ({ course, groupName, handleClose, showOptions, setShowOptions, onDeleteCourse, deleting }) => {
  return (
    <nav>
      {/* Breadcrumb Navigation */}
      <div className="breadcrumb-navigation">
        <span className="breadcrumb-link" onClick={handleClose}>Courses</span>
        <span className="breadcrumb-separator">
          <svg width="16" height="16" fill="none">
            <path d="M6 4l4 4-4 4" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        {groupName && (
          <>
            <span className="breadcrumb-link" onClick={handleClose}>{groupName}</span>
            <span className="breadcrumb-separator">
              <svg width="16" height="16" fill="none">
                <path d="M6 4l4 4-4 4" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </>
        )}
        <span className="breadcrumb-current">{course?.name}</span>
      </div>

      {/* More Options Button */}
      <div className="more-options-wrapper">
        <button
          className="more-options-btn"
          aria-label="More options"
          onClick={() => setShowOptions(v => !v)}
        >
          <span className="more-options-icon">
            <span></span>
          </span>
        </button>
        {showOptions && (
          <div className="more-options-menu">
            <button
              className="course-detail-panel-dropdown-item"
              onClick={e => onDeleteCourse(course.id, course.name, e)}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Course'}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default CourseHeader;