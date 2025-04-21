// src/components/Dashboard/SessionDetailModal.jsx
import React from 'react';
import './SessionDetailModal.css'; // We'll create this next

const SessionDetailModal = ({ session, students, onClose }) => {
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
                    <h2>{safelyRenderValue(session.title)}</h2>
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
                                <span className="value">{safelyRenderValue(session.teacher)}</span>
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
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student) => (
                                        <tr key={student.id}>
                                            <td>{student.name}</td>
                                            <td className={`status-${session.attendance && session.attendance[student.id] ? session.attendance[student.id] : 'unknown'}`}>
                                                {getAttendanceStatus(session.attendance && session.attendance[student.id] ? session.attendance[student.id] : 'unknown')}
                                            </td>
                                        </tr>
                                    ))}
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