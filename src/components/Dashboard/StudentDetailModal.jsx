// src/components/Dashboard/StudentDetailModal.jsx
import React from 'react';
import './SessionDetailModal.css'; // We'll reuse the modal styling

const StudentDetailModal = ({ student, sessions, onClose }) => {
    // Function to safely render values (reused from other components)
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

    // Calculate attendance stats for this student
    const calculateAttendanceStats = () => {
        if (!sessions || sessions.length === 0) {
            return {
                present: 0,
                absent: 0,
                sick: 0,
                technical: 0,
                unknown: 0,
                rate: 0
            };
        }

        let present = 0;
        let absent = 0;
        let sick = 0;
        let technical = 0;
        let unknown = 0;
        let total = 0;

        sessions.forEach(session => {
            if (session.attendance && session.attendance[student.id]) {
                total++;
                const status = session.attendance[student.id];

                if (status === 'present') present++;
                else if (status === 'absent') absent++;
                else if (status === 'sick') sick++;
                else if (status === 'technical_issues') technical++;
                else unknown++;
            }
        });

        return {
            present,
            absent,
            sick,
            technical,
            unknown,
            rate: total > 0 ? Math.round((present / total) * 100) : 0
        };
    };

    const stats = calculateAttendanceStats();

    // Get student's attendance for each session
    const getAttendanceHistory = () => {
        return sessions
            .filter(session => session.attendance && session.attendance[student.id])
            .sort((a, b) => {
                // Sort by date if available
                if (a.date && b.date) {
                    const partsA = a.date.split('.');
                    const partsB = b.date.split('.');
                    if (partsA.length === 3 && partsB.length === 3) {
                        const dateA = new Date(partsA[2], partsA[1] - 1, partsA[0]);
                        const dateB = new Date(partsB[2], partsB[1] - 1, partsB[0]);
                        return dateA - dateB;
                    }
                }
                return 0;
            });
    };

    const attendanceHistory = getAttendanceHistory();

    // Map attendance status to readable format
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
                    <h2>{safelyRenderValue(student.name)}</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                <div className="modal-content">
                    <div className="session-info-section">
                        <h3>Student Information</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="label">Name:</span>
                                <span className="value">{safelyRenderValue(student.name)}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Info:</span>
                                <span className="value">{safelyRenderValue(student.info)}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Attendance Rate:</span>
                                <span className="value">{stats.rate}%</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Notes:</span>
                                <span className="value">{safelyRenderValue(student.notes)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="session-info-section">
                        <h3>Attendance Statistics</h3>
                        <div className="stats-row">
                            <div className="stat-box">
                                <h3>Present</h3>
                                <div className="stat-value">{stats.present}</div>
                            </div>
                            <div className="stat-box">
                                <h3>Absent</h3>
                                <div className="stat-value">{stats.absent}</div>
                            </div>
                            <div className="stat-box">
                                <h3>Sick</h3>
                                <div className="stat-value">{stats.sick}</div>
                            </div>
                            <div className="stat-box">
                                <h3>Technical Issues</h3>
                                <div className="stat-value">{stats.technical}</div>
                            </div>
                        </div>
                    </div>

                    {attendanceHistory.length > 0 && (
                        <div className="attendance-section">
                            <h3>Attendance History</h3>
                            <table className="attendance-table">
                                <thead>
                                    <tr>
                                        <th>Session</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                        <th>Comment</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendanceHistory.map((session) => {
                                        // Get attendance data which could be a string or an object
                                        const attendanceData = session.attendance[student.id];

                                        // Determine status - could be a string or object.status
                                        const status = typeof attendanceData === 'object' ?
                                            attendanceData.status :
                                            attendanceData;

                                        // Get comment if available
                                        const comment = typeof attendanceData === 'object' && attendanceData.comment ?
                                            attendanceData.comment :
                                            '';

                                        return (
                                            <tr key={session.id}>
                                                <td>{safelyRenderValue(session.title)}</td>
                                                <td>{safelyRenderValue(session.date)}</td>
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

export default StudentDetailModal;