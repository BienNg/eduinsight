// src/components/Dashboard/CourseDetail.jsx
import { useState, useEffect } from 'react';
import { getRecordById } from '../../firebase/database';
import SessionDetailModal from './SessionDetailModal';
import './CourseDetail.css';

const CourseDetail = ({ courseId, onClose }) => {
    const [course, setCourse] = useState(null);
    const [teacher, setTeacher] = useState(null);
    const [students, setStudents] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedSession, setSelectedSession] = useState(null);

    useEffect(() => {
        const fetchCourseDetails = async () => {
            try {
                setLoading(true);
                
                // Fetch course data
                const courseData = await getRecordById('courses', courseId);
                if (!courseData) {
                    throw new Error("Course not found");
                }
                setCourse(courseData);
                
                // Fetch teacher data if available
                if (courseData.teacherId) {
                    const teacherData = await getRecordById('teachers', courseData.teacherId);
                    setTeacher(teacherData);
                }
                
                // Fetch student data
                const studentPromises = (courseData.studentIds || []).map(studentId => 
                    getRecordById('students', studentId)
                );
                const studentData = await Promise.all(studentPromises);
                setStudents(studentData.filter(s => s !== null)); // Filter out any null results
                
                // Fetch session data
                const sessionPromises = (courseData.sessionIds || []).map(sessionId => 
                    getRecordById('sessions', sessionId)
                );
                const sessionData = await Promise.all(sessionPromises);
                
                // Sort sessions by date
                const sortedSessions = sessionData
                    .filter(s => s !== null)
                    .sort((a, b) => {
                        // Try to parse dates and compare them
                        const dateA = parseGermanDate(a.date);
                        const dateB = parseGermanDate(b.date);
                        
                        if (dateA && dateB) {
                            return dateA - dateB;
                        }
                        // Fallback to string comparison
                        return a.date.localeCompare(b.date);
                    });
                    
                setSessions(sortedSessions);
            } catch (err) {
                console.error("Error fetching course details:", err);
                setError("Failed to load course details.");
            } finally {
                setLoading(false);
            }
        };

        if (courseId) {
            fetchCourseDetails();
        }
    }, [courseId]);

    // Helper function to parse German date format (DD.MM.YYYY)
    const parseGermanDate = (dateStr) => {
        if (!dateStr) return null;
        
        const parts = dateStr.split('.');
        if (parts.length !== 3) return null;
        
        // Note: JS months are 0-indexed
        return new Date(parts[2], parts[1] - 1, parts[0]);
    };

    const openSessionDetail = (session) => {
        setSelectedSession(session);
    };

    const closeSessionDetail = () => {
        setSelectedSession(null);
    };

    // Calculate attendance for a student across all sessions
    const calculateStudentAttendance = (studentId) => {
        if (!sessions || sessions.length === 0) return 0;
        
        let presentCount = 0;
        let totalSessions = 0;
        
        sessions.forEach(session => {
            if (session.attendance && session.attendance[studentId]) {
                totalSessions++;
                
                if (session.attendance[studentId] === 'present') {
                    presentCount++;
                }
            }
        });
        
        if (totalSessions === 0) return 0;
        return Math.round((presentCount / totalSessions) * 100);
    };

    // Calculate attendance for a session across all students
    const calculateSessionAttendance = (session) => {
        if (!session.attendance || !students || students.length === 0) return 0;
        
        let presentCount = 0;
        let totalStudents = 0;
        
        students.forEach(student => {
            if (session.attendance[student.id]) {
                totalStudents++;
                
                if (session.attendance[student.id] === 'present') {
                    presentCount++;
                }
            }
        });
        
        if (totalStudents === 0) return 0;
        return Math.round((presentCount / totalStudents) * 100);
    };

    // Helper function to safely render any type of value
    const safelyRenderValue = (value) => {
        if (value === null || value === undefined) {
            return '-';
        }

        if (typeof value === 'string' || typeof value === 'number') {
            return value;
        }

        // Handle objects with hyperlink & text properties (ExcelJS rich text)
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
            // Handle date objects
            if (value instanceof Date) {
                return value.toLocaleDateString();
            }
            // Last resort - convert to string
            try {
                return JSON.stringify(value);
            } catch (e) {
                return 'Complex value';
            }
        }

        // Convert arrays to comma-separated strings
        if (Array.isArray(value)) {
            return value.map(item => safelyRenderValue(item)).join(', ');
        }

        // Last resort for any other type
        return String(value);
    };

    if (loading) return <div className="loading">Loading course details...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!course) return <div className="error">Course not found</div>;

    return (
        <div className="course-detail-container">
            <div className="course-detail-header">
                <button className="back-button" onClick={onClose}>← Back</button>
                <h2>{course.name}</h2>
                <div className="course-level-badge">{course.level}</div>
            </div>

            <div className="course-detail-tabs">
                <button
                    className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button
                    className={`tab ${activeTab === 'students' ? 'active' : ''}`}
                    onClick={() => setActiveTab('students')}
                >
                    Students
                </button>
                <button
                    className={`tab ${activeTab === 'sessions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sessions')}
                >
                    Sessions
                </button>
            </div>

            <div className="course-detail-content">
                {activeTab === 'overview' && (
                    <div className="overview-tab">
                        <div className="stats-row">
                            <div className="stat-box">
                                <h3>Students</h3>
                                <div className="stat-value">{students.length}</div>
                            </div>
                            <div className="stat-box">
                                <h3>Sessions</h3>
                                <div className="stat-value">{sessions.length}</div>
                            </div>
                            <div className="stat-box">
                                <h3>Teacher</h3>
                                <div className="stat-value">
                                    {teacher ? teacher.name : 'Not assigned'}
                                </div>
                            </div>
                        </div>
                        <div className="course-info-card">
                            <h3>Course Information</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="label">Level:</span>
                                    <span className="value">{course.level}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Group:</span>
                                    <span className="value">{course.group || '-'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Start Date:</span>
                                    <span className="value">{course.startDate || '-'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">End Date:</span>
                                    <span className="value">{course.endDate || '-'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Average Attendance:</span>
                                    <span className="value">
                                        {students.length > 0 ? 
                                            Math.round(students.reduce((sum, student) => 
                                                sum + calculateStudentAttendance(student.id), 0) / students.length) + '%' 
                                            : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'students' && (
                    <div className="students-tab">
                        <table className="students-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Attendance</th>
                                    <th>Info</th>
                                    <th>Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student) => (
                                    <tr key={student.id}>
                                        <td>{student.name}</td>
                                        <td>
                                            {calculateStudentAttendance(student.id)}%
                                        </td>
                                        <td>{student.info || '-'}</td>
                                        <td>{student.notes || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'sessions' && (
                    <div className="sessions-tab">
                        <table className="sessions-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Date</th>
                                    <th>Teacher</th>
                                    <th>Time</th>
                                    <th>Attendance</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sessions.map((session) => (
                                    <tr key={session.id}>
                                        <td>{safelyRenderValue(session.title)}</td>
                                        <td>{safelyRenderValue(session.date)}</td>
                                        <td>
                                            {teacher && session.teacherId === teacher.id ? 
                                                teacher.name : 
                                                (session.teacherId ? 'Different Teacher' : '-')}
                                        </td>
                                        <td>
                                            {safelyRenderValue(session.startTime)} - {safelyRenderValue(session.endTime)}
                                        </td>
                                        <td>
                                            {calculateSessionAttendance(session)}%
                                        </td>
                                        <td>
                                            <button
                                                className="btn-details"
                                                onClick={() => openSessionDetail(session)}
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            {selectedSession && (
                <SessionDetailModal
                    session={selectedSession}
                    students={students}
                    teacher={teacher}
                    onClose={closeSessionDetail}
                />
            )}
        </div>
    );
};

export default CourseDetail;