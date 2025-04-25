// src/components/Dashboard/SessionDetailModal.jsx
import React from 'react';
import { useState, useEffect } from 'react';
import { getRecordById, updateRecord, getAllRecords } from '../firebase/database';
import TeacherSelect from '../../features/common/TeacherSelect'; //
import '../styles/SessionDetailModal.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock } from '@fortawesome/free-solid-svg-icons';
import { isLongSession } from '../utils/sessionUtils';

const SessionDetailModal = ({ session, students, teacher, onClose, groupName }) => {

    const [sessionData, setSessionData] = useState(session);
    const [savingTeacher, setSavingTeacher] = useState(false);
    const [editedFields, setEditedFields] = useState({});
    const [editMode, setEditMode] = useState(false);
    const [savingChanges, setSavingChanges] = useState(false);
    const [newStudents, setNewStudents] = useState({});
    const [loadingNewStudents, setLoadingNewStudents] = useState(true);

    const parseGermanDate = (dateStr) => {
        if (!dateStr) return null;

        const parts = dateStr.split('.');
        if (parts.length !== 3) return null;

        // Note: JS months are 0-indexed
        return new Date(parts[2], parts[1] - 1, parts[0]);
    };

    useEffect(() => {
        const detectNewStudents = async () => {
            if (!students || students.length === 0) {
                setLoadingNewStudents(false);
                return;
            }

            setLoadingNewStudents(true);

            try {
                // 1. Get all sessions in a single query
                const allSessions = await getAllRecords('sessions');

                // 2. Create a lookup of student IDs and their first session dates
                const studentFirstSessions = {};

                // 3. Process all sessions to find the earliest session for each student
                allSessions.forEach(s => {
                    if (!s.attendance) return;

                    const sessionDate = parseGermanDate(s.date);
                    if (!sessionDate) return;

                    // Check attendance for each student
                    Object.keys(s.attendance).forEach(studentId => {
                        // If we haven't seen this student yet, or if this session is earlier
                        if (!studentFirstSessions[studentId] ||
                            sessionDate < studentFirstSessions[studentId].date) {
                            studentFirstSessions[studentId] = {
                                date: sessionDate,
                                sessionId: s.id
                            };
                        }
                    });
                });

                // 4. Now determine which students are new in this session
                const result = {};
                const currentSessionDate = parseGermanDate(session.date);

                // Only proceed if we have a valid date for the current session
                if (currentSessionDate) {
                    students.forEach(student => {
                        // If student doesn't have any sessions or their first session is this one,
                        // they are considered new
                        const firstSession = studentFirstSessions[student.id];

                        // A student is new if:
                        // 1. This is their first session ever, or
                        // 2. Their first session is this current session
                        result[student.id] = !firstSession ||
                            (firstSession.sessionId === session.id) ||
                            (firstSession.date.getTime() === currentSessionDate.getTime());
                    });
                }

                setNewStudents(result);
            } catch (error) {
                console.error("Error detecting new students:", error);
            } finally {
                setLoadingNewStudents(false);
            }
        };

        detectNewStudents();
    }, [session, students]);

    const handleTeacherChange = async (teacherId) => {
        try {
            if (teacherId === sessionData.teacherId) return;

            setSavingTeacher(true);

            // Update local state
            setSessionData(prev => ({
                ...prev,
                teacherId
            }));

            // Update in database
            await updateRecord('sessions', session.id, { teacherId });

            // Get course data
            const courseData = await getRecordById('courses', session.courseId);

            // Check if this is the only session with the new teacher
            const shouldUpdateCourseTeacher = courseData &&
                (!courseData.teacherId || courseData.teacherId === session.teacherId);

            if (shouldUpdateCourseTeacher) {
                await updateRecord('courses', session.courseId, {
                    teacherId: teacherId
                });
            }

            // Update teacher records
            if (session.teacherId) {
                const oldTeacher = await getRecordById('teachers', session.teacherId);
                if (oldTeacher && oldTeacher.courseIds) {
                    // For simplicity, we're not implementing full cleanup here
                    // In a real app, you might want to check if the teacher is still used in other sessions
                }
            }

            if (teacherId) {
                const newTeacher = await getRecordById('teachers', teacherId);
                if (newTeacher) {
                    const courseIds = newTeacher.courseIds || [];
                    if (!courseIds.includes(session.courseId)) {
                        courseIds.push(session.courseId);
                        await updateRecord('teachers', teacherId, { courseIds });
                    }
                }
            }

            // Mark as edited
            setEditedFields({
                ...editedFields,
                teacherId: true
            });

        } catch (err) {
            console.error("Error updating teacher:", err);
            // Revert to original state on error
            setSessionData(prev => ({
                ...prev,
                teacherId: session.teacherId
            }));
        } finally {
            setSavingTeacher(false);
        }
    };

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
        <div className="modal-backdrop" onClick={onClose}>
            <div className="session-detail-modal" onClick={(e) => e.stopPropagation()}>
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
                                <div className={`teacher-select-wrapper ${savingTeacher ? 'saving' : ''} ${editedFields.teacherId ? 'edited' : ''}`}>
                                    <TeacherSelect
                                        currentTeacherId={sessionData.teacherId}
                                        onTeacherChange={handleTeacherChange}
                                        courseName={groupName}
                                    />
                                    {savingTeacher && <span className="saving-indicator">Saving...</span>}
                                    {editedFields.teacherId && !savingTeacher &&
                                        <span className="edited-indicator">✓ Saved</span>}
                                </div>
                            </div>
                            <div className="info-item">
                                <span className="label">Notes:</span>
                                <span className="value">{safelyRenderValue(session.notes)}</span>
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
                                    </tr>
                                </thead>
                                <tbody>
                                    {session.contentItems.map((item, index) => (
                                        <tr key={index}>
                                            <td>{safelyRenderValue(item.content)}</td>
                                            <td>{safelyRenderValue(item.notes)}</td>
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

                                        // Check if new student (show loading indicator if still loading)
                                        const isNewStudent = newStudents[student.id];

                                        return (
                                            <tr key={student.id}>
                                                <td>
                                                    {student.name}
                                                    {loadingNewStudents ? (
                                                        <span className="badge-loading"></span>
                                                    ) : isNewStudent && (
                                                        <span className="new-student-badge">New</span>
                                                    )}
                                                </td>
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