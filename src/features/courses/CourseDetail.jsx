// JSX Imports
import { useState, useEffect } from 'react';
import { getRecordById, deleteRecord, getAllRecords, cleanupEmptyMonths } from '../firebase/database';
import { handleDeleteCourse } from '../utils/courseDeletionUtils';
import SessionDetailModal from '../sessions/SessionDetailModal';
import StudentDetailModal from '../students/StudentDetailModal';
import TabComponent from '../common/TabComponent';


// CSS Imports
import '../styles/CourseDetail.css';
import '../styles/Content.css'
import '../common/Tabs.css';

// Library Imports
import { useParams, useNavigate, useLocation } from 'react-router-dom';



const CourseDetail = ({ onClose, initialActiveTab = 'overview' }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { state } = location;
    const groupName = state?.groupName;
    const [group, setGroup] = useState(null);
    const [course, setCourse] = useState(null);
    const [teacher, setTeacher] = useState(null);
    const [teachers, setTeachers] = useState([]);
    const [students, setStudents] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(initialActiveTab);
    const [selectedSession, setSelectedSession] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'sessionOrder', direction: 'ascending' });
    const [showOptions, setShowOptions] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'students', label: 'Students' },
        { id: 'sessions', label: 'Sessions' }
    ];
    const handleClose = () => {
        if (groupName) {
            navigate(`/courses/group/${groupName}`);
        } else {
            navigate('/courses');
        }
    };

    const onDeleteCourse = async (id, courseName, event) => {
        setDeleting(true);
        await handleDeleteCourse(
            id,
            courseName,
            setDeleting, // Pass setDeleting to show loading state
            null,        // setCourses not needed here
            setError,
            event
        );
        setDeleting(false);
        handleClose();
    };

    // Add this function to handle column header clicks
    const requestSort = (key) => {
        if (sortConfig.key === key) {
            if (sortConfig.direction === 'ascending') {
                // Second click: change to descending
                setSortConfig({ key, direction: 'descending' });
            } else {
                // Third click: reset to default (sessionOrder ascending)
                setSortConfig({ key: 'sessionOrder', direction: 'ascending' });
            }
        } else {
            // First click on a new column: set to ascending
            setSortConfig({ key, direction: 'ascending' });
        }
    };

    // Add this function to get sorted sessions
    const getSortedSessions = () => {
        const sortableItems = [...sessions];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                // Handle attendance separately
                if (sortConfig.key === 'attendance') {
                    const attendanceA = calculateSessionAttendance(a);
                    const attendanceB = calculateSessionAttendance(b);
                    const [presentA, totalA] = attendanceA.split('/').map(Number);
                    const [presentB, totalB] = attendanceB.split('/').map(Number);

                    // Calculate percentage
                    const percentA = totalA === 0 ? 0 : (presentA / totalA) * 100;
                    const percentB = totalB === 0 ? 0 : (presentB / totalB) * 100;

                    return sortConfig.direction === 'ascending'
                        ? percentA - percentB
                        : percentB - percentA;
                }

                // Handle date separately
                if (sortConfig.key === 'date') {
                    const dateA = parseGermanDate(a.date) || new Date(0);
                    const dateB = parseGermanDate(b.date) || new Date(0);
                    return sortConfig.direction === 'ascending'
                        ? dateA - dateB
                        : dateB - dateA;
                }

                // Handle time separately
                if (sortConfig.key === 'time') {
                    const timeA = a.startTime || '';
                    const timeB = b.startTime || '';
                    return sortConfig.direction === 'ascending'
                        ? timeA.localeCompare(timeB)
                        : timeB.localeCompare(timeA);
                }

                // Handle teacher separately
                if (sortConfig.key === 'teacher') {
                    const teacherIdA = a.teacherId || '';
                    const teacherIdB = b.teacherId || '';
                    return sortConfig.direction === 'ascending'
                        ? teacherIdA.localeCompare(teacherIdB)
                        : teacherIdB.localeCompare(teacherIdA);
                }
                if (sortConfig.key === 'sessionOrder') {
                    const orderA = a.sessionOrder || 0;
                    const orderB = b.sessionOrder || 0;
                    return sortConfig.direction === 'ascending'
                        ? orderA - orderB
                        : orderB - orderA;
                }

                // Default case - compare by value
                const valueA = a[sortConfig.key] || '';
                const valueB = b[sortConfig.key] || '';

                if (typeof valueA === 'string' && typeof valueB === 'string') {
                    return sortConfig.direction === 'ascending'
                        ? valueA.localeCompare(valueB)
                        : valueB.localeCompare(valueA);
                }

                return sortConfig.direction === 'ascending'
                    ? (valueA > valueB ? 1 : -1)
                    : (valueB > valueA ? 1 : -1);
            });
        }
        return sortableItems;
    };

    useEffect(() => {
        const fetchCourseDetails = async () => {
            try {
                setLoading(true);

                // Fetch course data
                const courseData = await getRecordById('courses', id);
                if (!courseData) {
                    throw new Error("Course not found");
                }
                setCourse(courseData);
                if (courseData.groupId) {
                    const groupData = await getRecordById('groups', courseData.groupId);
                    setGroup(groupData);
                }
                // Fetch teacher data if available
                if (courseData.teacherIds && Array.isArray(courseData.teacherIds)) {
                    const teacherPromises = courseData.teacherIds.map(tid => getRecordById('teachers', tid));
                    const teacherDataArr = await Promise.all(teacherPromises);
                    setTeachers(teacherDataArr.filter(t => t));
                } else if (courseData.teacherId) {
                    const teacherData = await getRecordById('teachers', courseData.teacherId);
                    setTeachers(teacherData ? [teacherData] : []);
                } else {
                    setTeachers([]);
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
                        // Sort by sessionOrder by default
                        const orderA = a.sessionOrder || 0;
                        const orderB = b.sessionOrder || 0;
                        if (orderA !== orderB) {
                            return orderA - orderB;
                        }

                        // Fall back to date if sessionOrder is the same
                        const dateA = parseGermanDate(a.date);
                        const dateB = parseGermanDate(b.date);
                        if (dateA && dateB) {
                            return dateA - dateB;
                        }
                        // Further fallback to string comparison
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

        if (id) {
            fetchCourseDetails();
        }
    }, [id]);


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

    // Add new functions to handle student details
    const openStudentDetail = (student) => {
        setSelectedStudent(student);
    };

    const closeStudentDetail = () => {
        setSelectedStudent(null);
    };

    // Calculate attendance for a student across all sessions - now returns absences/total format
    const calculateStudentAttendance = (studentId) => {
        if (!sessions || sessions.length === 0) return "0/0";

        let absentCount = 0;
        let totalSessions = 0;

        sessions.forEach(session => {
            if (session.attendance && session.attendance[studentId]) {
                totalSessions++;

                // Handle both string and object formats for attendance
                const attendanceData = session.attendance[studentId];
                const status = typeof attendanceData === 'object' ? attendanceData.status : attendanceData;

                // Count as absent if not present (includes absent, sick, technical_issues, unknown)
                if (status !== 'present') {
                    absentCount++;
                }
            }
        });

        return `${absentCount}/${totalSessions}`;
    };

    // Calculate attendance for a session across all students
    const calculateSessionAttendance = (session) => {
        if (!session.attendance || !students || students.length === 0) return "0/0";

        let presentCount = 0;
        let totalStudents = 0;

        students.forEach(student => {
            if (session.attendance[student.id]) {
                totalStudents++;

                // Handle both string and object formats for attendance
                const attendanceData = session.attendance[student.id];
                const status = typeof attendanceData === 'object' ? attendanceData.status : attendanceData;

                if (status === 'present') {
                    presentCount++;
                }
            }
        });

        return `${presentCount}/${totalStudents}`;
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
        <>{/* Minimalistic Modern Breadcrumb */}
            <nav className="breadcrumb">
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
                <span className="breadcrumb-current">{course.name}</span>
            </nav>


            <div className="course-detail-container">

                <div className="course-detail-header">
                    <h2>{course.name}</h2>
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
                                    className="option-item"
                                    onClick={e => onDeleteCourse(course.id, course.name, e)}
                                    disabled={deleting}
                                >
                                    {deleting ? 'Deleting...' : 'Delete Course'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <TabComponent tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab}>
                    {activeTab === 'overview' && (
                        <div className="overview-tab">
                            {/* Overview tab content */}
                        </div>
                    )}
                    {activeTab === 'students' && (
                        <div className="students-tab">
                            {/* Students tab content */}
                        </div>
                    )}
                    {activeTab === 'sessions' && (
                        <div className="sessions-tab">
                            {/* Sessions tab content */}
                        </div>
                    )}
                </TabComponent>

                <div className="app-tab-panel">
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
                                    <h3>Teacher{teachers.length !== 1 ? 's' : ''}</h3>
                                    <div className="stat-value">
                                        {teachers.length > 0
                                            ? teachers.map(t => t.name).join(', ')
                                            : 'Not assigned'}
                                    </div>
                                </div>
                            </div>
                            <div className="course-info-card">
                                <h3>Course Information</h3>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <span className="label">Group:</span>
                                        <span className="value">
                                            {group ? group.name : (course.group || '-')}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="label">Level:</span>
                                        <span className="value">{course.level}</span>
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
                                                    sum + calculateStudentAttendance(student.id), 0) / students.length)
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
                                        <th>Absence</th>
                                        <th>Info</th>
                                        <th>Notes</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student) => (
                                        <tr key={student.id}>
                                            <td>{student.name}</td>
                                            <td>
                                                {calculateStudentAttendance(student.id)}
                                            </td>
                                            <td>{student.info || '-'}</td>
                                            <td>{student.notes || '-'}</td>
                                            <td>
                                                <button
                                                    className="btn-details"
                                                    onClick={() => openStudentDetail(student)}
                                                >
                                                    Details
                                                </button>
                                            </td>

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
                                        <th
                                            onClick={() => requestSort('sessionOrder')}
                                            className={sortConfig.key === 'title' ? `sorted-${sortConfig.direction}` : ''}
                                        >
                                            Title {sortConfig.key === 'sessionOrder' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                                        </th>
                                        <th
                                            onClick={() => requestSort('date')}
                                            className={sortConfig.key === 'date' ? `sorted-${sortConfig.direction}` : ''}
                                        >
                                            Date {sortConfig.key === 'date' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                                        </th>
                                        <th
                                            onClick={() => requestSort('teacher')}
                                            className={sortConfig.key === 'teacher' ? `sorted-${sortConfig.direction}` : ''}
                                        >
                                            Teacher {sortConfig.key === 'teacher' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                                        </th>
                                        <th
                                            onClick={() => requestSort('time')}
                                            className={sortConfig.key === 'time' ? `sorted-${sortConfig.direction}` : ''}
                                        >
                                            Time {sortConfig.key === 'time' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                                        </th>
                                        <th
                                            onClick={() => requestSort('attendance')}
                                            className={sortConfig.key === 'attendance' ? `sorted-${sortConfig.direction}` : ''}
                                        >
                                            Attendance {sortConfig.key === 'attendance' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                                        </th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getSortedSessions().map((session) => (
                                        <tr key={session.id}>
                                            <td>{safelyRenderValue(session.title)}</td>
                                            <td>{safelyRenderValue(session.date)}</td>
                                            <td>
                                                {session.teacherId
                                                    ? (
                                                        teachers.length > 0
                                                            ? (
                                                                teachers.find(t => String(t.id) === String(session.teacherId))?.name
                                                                || 'Different Teacher'
                                                            )
                                                            : 'Different Teacher'
                                                    )
                                                    : '-'}
                                            </td>
                                            <td>
                                                {safelyRenderValue(session.startTime)} - {safelyRenderValue(session.endTime)}
                                            </td>
                                            <td>
                                                {calculateSessionAttendance(session)}
                                            </td>
                                            <td>
                                                {session.status && (
                                                    <span className={`status-badge ${session.status}`}>
                                                        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <button
                                                    className="btn-details"
                                                    onClick={() => openSessionDetail(session)}
                                                >
                                                    Details
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
                        groupName={course ? course.group : null}
                    />
                )}
                {selectedStudent && (
                    <StudentDetailModal
                        student={selectedStudent}
                        sessions={sessions}
                        onClose={closeStudentDetail}
                    />
                )}
            </div>
        </>
    );
};

export default CourseDetail;