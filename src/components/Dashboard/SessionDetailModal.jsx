// src/components/Dashboard/SessionDetailModal.jsx
import React from 'react';
import './SessionDetailModal.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock } from '@fortawesome/free-solid-svg-icons';
import { isLongSession } from '../../utils/sessionUtils';

const SessionDetailModal = ({ session, students, teacher, onClose, groupName }) => {
    // Function to safely render any type of value (reusing from CourseDetail)
    const safelyRenderValue = (value) => {
        if (value === null || value === undefined) {
            return '-';
        }

        if (typeof value === 'string' || typeof value === 'number') {
            return value;
        }

        if (value && typeof value === 'object') {
            if (value.hyperlink && value.text) {
                return value.text;
            }
            if (value.richText) {
                return value.richText.map(rt => rt.text).join('');
            }
            if (value.text) {
                return value.text;
            }
            if (value.formula) {
                return value.result || '';
            }
            if (value instanceof Date) {
                return value.toLocaleDateString();
            }
            try {
                return JSON.stringify(value);
            } catch (e) {
                return 'Complex value';
            }
        }

        if (Array.isArray(value)) {
            return value.map(item => safelyRenderValue(item)).join(', ');
        }

        return String(value);
    };

    // Map attendance status to more readable format
    const getAttendanceStatus = (status) => {
        // If status is an object, extract the status property
        if (typeof status === 'object' && status !== null) {
            status = status.status;
        }

        const statusMap = {
            'present': 'Present',
            'absent': 'Absent',
            'sick': 'Sick',
            'technical_issues': 'Technical Issues',
            'unknown': 'Unknown'
        };
        return statusMap[status] || status;
    };

    return (
        <div className="modal-backdrop">
            <div className="session-detail-modal">
                <div className="modal-header">
                    <div>
                        <h2>{groupName && `${groupName} | `}{session.title || 'Session Details'}</h2>
                        {isLongSession(session.startTime, session.endTime) && (
                            <div className="session-duration-badge long">
                                <FontAwesomeIcon icon={faClock} />
                                <span>2-Stunden Lektion</span>
                            </div>
                        )}
                    </div>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                <div className="modal-content">
                    <div className="session-info-section">
                        <h3>Session Information</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="label">Date:</span>
                                <span className="value">{safelyRenderValue(session.date)}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Time:</span>
                                <span className="value">{safelyRenderValue(session.startTime)} - {safelyRenderValue(session.endTime)}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Teacher:</span>
                                <span className="value">
                                    {teacher ? teacher.name : (session.teacherId ? 'Unknown Teacher' : '-')}
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="label">Notes:</span>
                                <span className="value">{safelyRenderValue(session.notes)}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Preparation:</span>
                                <span className="value">{session.checked ? 'Checked' : 'Not Checked'}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Status:</span>
                                <span className="value">{session.completed ? 'Completed' : 'Not Completed'}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Dauer:</span>
                                <span className="value">
                                    {isLongSession(session.startTime, session.endTime) ? (
                                        <span className="long-session-indicator">
                                            <FontAwesomeIcon icon={faClock} className="long-session-icon" />
                                            <span>Ungefähr 2 Stunden</span>
                                        </span>
                                    ) : (
                                        'Standard Lektion'
                                    )}
                                </span>
                            </div>
                            {session.message && (
                                <div className="info-item full-width">
                                    <span className="label">Message:</span>
                                    <span className="value">{safelyRenderValue(session.message)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {session.content && (
                        <div className="session-content-section">
                            <h3>Main Content</h3>
                            <p>{safelyRenderValue(session.content)}</p>
                        </div>
                    )}

                    {session.contentItems && session.contentItems.length > 0 && (
                        <div className="content-items-section">
                            <h3>Additional Content Items</h3>
                            <table className="content-items-table">
                                <thead>
                                    <tr>
                                        <th>Content</th>
                                        <th>Notes</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {session.contentItems.map((item, index) => (
                                        <tr key={index}>
                                            <td>{safelyRenderValue(item.content)}</td>
                                            <td>{safelyRenderValue(item.notes)}</td>
                                            <td>{item.checked ? 'Checked' : 'Not Checked'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {students && students.length > 0 && (
                        <div className="attendance-section">
                            <h3>Attendance</h3>
                            <table className="attendance-table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Status</th>
                                        <th>Comment</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student) => {
                                        // Get the attendance data for this student
                                        const attendanceData = session.attendance && session.attendance[student.id]
                                            ? session.attendance[student.id]
                                            : 'unknown';

                                        // Determine the status - handle both string and object formats
                                        const status = typeof attendanceData === 'object'
                                            ? attendanceData.status
                                            : attendanceData;

                                        // Get the comment if available
                                        const comment = typeof attendanceData === 'object' && attendanceData.comment
                                            ? attendanceData.comment
                                            : '';

                                        return (
                                            <tr key={student.id}>
                                                <td>{student.name}</td>
                                                <td className={`status-${status}`}>
                                                    {getAttendanceStatus(status)}
                                                </td>
                                                <td>{comment}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>

                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SessionDetailModal;