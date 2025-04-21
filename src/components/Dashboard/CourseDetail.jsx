// src/components/Dashboard/CourseDetail.jsx
import { useState, useEffect } from 'react';
import { getRecordById } from '../../firebase/database';
import './CourseDetail.css';

const CourseDetail = ({ courseId, onClose }) => {
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const courseData = await getRecordById('courses', courseId);
                setCourse(courseData);
            } catch (err) {
                setError("Failed to load course details.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (courseId) {
            fetchCourse();
        }
    }, [courseId]);

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
                                <div className="stat-value">{course.students ? course.students.length : 0}</div>
                            </div>
                            <div className="stat-box">
                                <h3>Sessions</h3>
                                <div className="stat-value">{course.sessions ? course.sessions.length : 0}</div>
                            </div>
                            <div className="stat-box">
                                <h3>Current Teacher</h3>
                                <div className="stat-value">
                                    {course.sessions && course.sessions.length > 0
                                        ? course.sessions[course.sessions.length - 1].teacher || 'Not assigned'
                                        : 'Not assigned'}
                                </div>
                            </div>
                        </div>

                        {/* Add more overview information as needed */}
                    </div>
                )}

                {activeTab === 'students' && (
                    <div className="students-tab">
                        <table className="students-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Attendance</th>
                                    <th>Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {course.students && course.students.map((student) => (
                                    <tr key={student.id}>
                                        <td>{student.name}</td>
                                        <td>
                                            {/* Calculate attendance percentage */}
                                            {calculateAttendance(course.sessions, student.id)}%
                                        </td>
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
                                    <th>Title</th> {/* Switched position */}
                                    <th>Date</th>  {/* Switched position */}
                                    <th>Teacher</th>
                                    <th>Time</th>
                                    <th>Attendance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {course.sessions && course.sessions.map((session, index) => (
                                    <tr key={index}>
                                        <td>{safelyRenderValue(session.title)}</td> {/* Switched position */}
                                        <td>{safelyRenderValue(session.date)}</td>  {/* Switched position */}
                                        <td>{safelyRenderValue(session.teacher)}</td>
                                        <td>
                                            {safelyRenderValue(session.startTime)} - {safelyRenderValue(session.endTime)}
                                        </td>
                                        <td>
                                            {course.students &&
                                                `${calculateSessionAttendance(session, course.students)}%`}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper function to calculate attendance percentage for a student
const calculateAttendance = (sessions, studentId) => {
    if (!sessions || sessions.length === 0) return 0;

    let presentCount = 0;
    let totalSessions = 0;
    
    console.log(`Calculating attendance for student ID: ${studentId}`);
    console.log(`Total sessions: ${sessions.length}`);

    sessions.forEach((session, idx) => {
        console.log(`Session ${idx}: ${session.title}, Attendance:`, session.attendance);
        
        // Check if attendance exists and has data for this student
        if (session.attendance && Object.keys(session.attendance).length > 0) {
            console.log(`Student attendance value: ${session.attendance[studentId]}`);
            
            // Only count sessions where attendance was tracked for this student
            if (session.attendance[studentId]) {
                totalSessions++;
                
                // Check for both 'present' and 'Present' to handle case sensitivity
                if (session.attendance[studentId].toLowerCase() === 'present') {
                    presentCount++;
                }
            }
        } else {
            console.log(`No attendance data for this session`);
        }
    });

    console.log(`Present count: ${presentCount}, Total sessions: ${totalSessions}`);
    
    if (totalSessions === 0) return 0;
    return Math.round((presentCount / totalSessions) * 100);
};

// Helper function to calculate attendance percentage for a session
const calculateSessionAttendance = (session, students) => {
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

export default CourseDetail;