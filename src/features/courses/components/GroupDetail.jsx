// src/features/courses/components/GroupDetail.jsx
import React from 'react';
import ProgressBar from '../../common/ProgressBar';
import CourseBadge from '../../common/CourseBadge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faUsers, faCalendarAlt, faChalkboardTeacher } from '@fortawesome/free-solid-svg-icons';
import '../../styles/GroupDetail.css';

const GroupDetail = ({ groupName, selectedGroup, selectedGroupCourses, loading, onSelectCourse, selectedCourseId }) => {
    if (!groupName) {
        return (
            <div className="course-detail-panel">
                <div className="course-detail-panel-empty-state">
                    <FontAwesomeIcon icon={faBook} size="2x" style={{ color: '#cccccc', marginBottom: '16px' }} />
                    <h3>Kurs auswählen</h3>
                    <p>Wählen Sie einen Gruppe aus, um Details anzuzeigen</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="group-detail-loading">
                <div className="group-detail-skeleton-header"></div>
                <div className="group-detail-skeleton-content"></div>
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
        <div>
            <div>
                <div className="group-detail-panel-header">
                    <h2 className="group-detail-panel-title">{selectedGroup.name}</h2>
                    <div
                        className="group-detail-group-badge"
                        style={{ backgroundColor: selectedGroup.color || '#0088FE' }}
                    >
                        {selectedGroup.coursesCount} Kurse
                    </div>
                </div>

                <div className="group-detail-panel-content">

                    <div className="group-detail-stats-row">
                        <div className="group-detail-stat-box">
                            <FontAwesomeIcon icon={faBook} style={{ color: '#0088FE', marginBottom: '4px', fontSize: '15px' }} />
                            <div className="group-detail-stat-value">{selectedGroup.coursesCount}</div>
                            <h3>Kurse</h3>
                        </div>
                        <div className="group-detail-stat-box">
                            <FontAwesomeIcon icon={faUsers} style={{ color: '#00C49F', marginBottom: '4px', fontSize: '15px' }} />
                            <div className="group-detail-stat-value">{selectedGroup.totalStudents}</div>
                            <h3>Schüler</h3>
                        </div>
                        <div className="group-detail-stat-box">
                            <FontAwesomeIcon icon={faCalendarAlt} style={{ color: '#FFBB28', marginBottom: '4px', fontSize: '15px' }} />
                            <div className="group-detail-stat-value">{selectedGroup.totalSessions}</div>
                            <h3>Lektionen</h3>
                        </div>
                        <div className="group-detail-stat-box">
                            <FontAwesomeIcon icon={faChalkboardTeacher} style={{ color: '#FF8042', marginBottom: '4px', fontSize: '15px' }} />
                            <div className="group-detail-stat-value">{selectedGroup.teachers.length}</div>
                            <h3>Lehrer</h3>
                        </div>
                    </div>

                    <div className="group-detail-course-info-card">
                        <h3>Kurse in dieser Gruppe</h3>
                        {selectedGroupCourses && selectedGroupCourses.length > 0 ? (
                            <div className="group-detail-course-badges-container">
                                {selectedGroupCourses.map(course => (
                                    <div key={course.id}>
                                        <CourseBadge
                                            course={course}
                                            groupName={selectedGroup.name}
                                            onClick={() => onSelectCourse(course)}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="group-detail-no-courses-hint">Keine Kurse in dieser Gruppe gefunden</p>
                        )}
                    </div>

                    <div className="group-detail-course-info-card">
                        <h3>Lehrkräfte</h3>
                        <div className="group-detail-teacher-badges-container">
                            {selectedGroup.teachers.length > 0 ? (
                                selectedGroup.teachers.map(teacher => (
                                    <span key={teacher} className="group-detail-teacher-badge">
                                        {teacher}
                                    </span>
                                ))
                            ) : (
                                <span className="group-detail-no-teachers-hint">Keine Lehrkräfte gefunden</span>
                            )}
                        </div>
                    </div>

                    <div className="group-detail-course-info-card">
                        <h3>Lernfortschritt</h3>
                        <ProgressBar
                            progress={selectedGroup.progress}
                            color={selectedGroup.color || '#0088FE'}
                            showLabel={true}
                        />
                    </div>

                </div>
            </div>
        </div>
    );
};

export default GroupDetail;