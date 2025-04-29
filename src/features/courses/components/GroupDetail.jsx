// src/features/courses/components/GroupDetail.jsx
import React from 'react';
import ProgressBar from '../../common/ProgressBar';

const GroupDetail = ({
    groupName,
    selectedGroup,
    selectedGroupCourses,
    loading
}) => {
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
        <div className="group-detail-container">

            <div className="overview-panel animate-card">
                <div className="panel-header">
                    <h2 className="panel-title">{selectedGroup.name}</h2>
                    <div
                        className="group-badge"
                        style={{ backgroundColor: selectedGroup.color || '#0088FE' }}
                    >
                        {selectedGroup.coursesCount} Kurse
                    </div>
                </div>

                <div className="panel-content">
                    <div className="overview-content">
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
                            <h3>Kurse in dieser Gruppe</h3>
                            {selectedGroupCourses && selectedGroupCourses.length > 0 ? (
                                <div>
                                    {selectedGroupCourses.map(course => (
                                        <div
                                            key={course.id}
                                            onClick={() => window.location.href = `/courses/${course.id}`}
                                        >
                                            <div>
                                                <span>{course.name || 'Unnamed Course'}</span>
                                            </div>
                                            <div>
                                                <span>
                                                    {Array.isArray(course.studentIds)
                                                        ? `${course.studentIds.length} Schüler`
                                                        : "0 Schüler"}
                                                    {Array.isArray(course.sessionIds)
                                                        ? ` • ${course.sessionIds.length} Lektionen`
                                                        : ""}
                                                </span>
                                                <span>{course.status === 'ongoing' ? "Aktiv" : "Abgeschlossen"}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="no-courses-hint">Keine Kurse in dieser Gruppe gefunden</p>
                            )}
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
                </div>
            </div>
        </div>

    );
};

export default GroupDetail;