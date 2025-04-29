// src/features/courses/components/GroupDetail.jsx
import React from 'react';
import TabComponent from '../../common/TabComponent';
import ProgressBar from '../../common/ProgressBar';
import { sortLanguageLevels } from '../../utils/levelSorting';

const GroupDetail = ({ 
  groupName, 
  selectedGroup, 
  selectedGroupCourses, 
  loading, 
  activeTab, 
  setActiveTab 
}) => {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'courses', label: 'Courses' },
    { id: 'levels', label: 'Levels' }
  ];

  if (!groupName) {
    return (
      <div className="no-group-selected">
        <p>Wählen Sie eine Gruppe aus der Liste, um Details anzuzeigen</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="group-detail-loading">
        <div className="skeleton-header"></div>
        <div className="skeleton-tabs"></div>
        <div className="skeleton-content"></div>
      </div>
    );
  }

  if (!selectedGroup) {
    return (
      <div className="group-detail-error">
        <p>Gruppe nicht gefunden</p>
      </div>
    );
  }

  return (
    <div className="group-detail-view">
      <div className="group-detail-header">
        <h2>{selectedGroup.name}</h2>
        <div
          className="group-badge"
          style={{ backgroundColor: selectedGroup.color || '#0088FE' }}
        >
          {selectedGroup.coursesCount} Kurse
        </div>
      </div>

      <TabComponent tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab}>
        {activeTab === 'overview' && (
          <GroupOverviewTab selectedGroup={selectedGroup} selectedGroupCourses={selectedGroupCourses} />
        )}

        {activeTab === 'courses' && (
          <div className="courses-tab">
            <h3>Alle Kurse in {selectedGroup.name}</h3>
            <p className="placeholder-text">Kursübersicht wird implementiert...</p>
          </div>
        )}

        {activeTab === 'levels' && (
          <div className="levels-tab">
            <h3>Kursstufen in {selectedGroup.name}</h3>
            <p className="placeholder-text">Stufenübersicht wird implementiert...</p>
          </div>
        )}
      </TabComponent>
    </div>
  );
};

// Sub-component for the overview tab content
const GroupOverviewTab = ({ selectedGroup, selectedGroupCourses }) => {
  return (
    <div className="overview-tab">
      <div className="stats-row">
        <div className="stat-box">
          <h3>Kurse</h3>
          <div className="stat-value">{selectedGroup.coursesCount}</div>
        </div>
        <div className="stat-box">
          <h3>Schüler</h3>
          <div className="stat-value">{selectedGroup.totalStudents}</div>
        </div>
        <div className="stat-box">
          <h3>Lektionen</h3>
          <div className="stat-value">{selectedGroup.totalSessions}</div>
        </div>
        <div className="stat-box">
          <h3>Lehrer</h3>
          <div className="stat-value">{selectedGroup.teachers.length}</div>
        </div>
      </div>

      <div className="course-info-card">
        <h3>Kursstufen</h3>
        <div className="level-badges-container">
          {sortLanguageLevels(selectedGroup.levels).map(level => (
            <div key={level} className="level-badge">
              {level}
              <span className="count">
                {selectedGroupCourses.filter(c => c.level === level).length} Kurse
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="course-info-card">
        <h3>Lehrkräfte</h3>
        <div className="teacher-badges-container">
          {selectedGroup.teachers.length > 0 ? (
            selectedGroup.teachers.map(teacher => (
              <span key={teacher} className="teacher-badge">
                {teacher}
              </span>
            ))
          ) : (
            <span className="no-teachers-hint">Keine Lehrkräfte gefunden</span>
          )}
        </div>
      </div>

      <div className="course-info-card">
        <h3>Lernfortschritt</h3>
        <ProgressBar
          progress={selectedGroup.progress}
          color={selectedGroup.color || '#0088FE'}
          showLabel={true}
        />
      </div>
    </div>
  );
};

export default GroupDetail;