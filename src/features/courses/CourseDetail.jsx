// src/features/courses/CourseDetail.jsx
import { useState, useEffect } from 'react';
import { getRecordById, deleteRecord, getAllRecords, cleanupEmptyMonths } from '../firebase/database';
import { handleDeleteCourse } from '../utils/courseDeletionUtils';
import SessionDetailModal from '../sessions/SessionDetailModal';
import StudentDetailModal from '../students/StudentDetailModal';
import SortableTable from '../common/components/SortableTable'; // Add this import
import StatsGrid from '../common/components/StatsGrid';
import TeacherBadge from '../common/TeacherBadge';

import {
    faUsers,
    faCalendarDay,
    faChalkboardTeacher,
    faLayerGroup,
    faStar,
    faCalendarAlt,
    faCalendarCheck,
    faChartLine
} from '@fortawesome/free-solid-svg-icons';

// CSS Imports
import '../styles/CourseDetail.css';
import '../styles/Content.css';
import styles from '../styles/modules/Table.module.css'; // Add this import

// Library Imports
import { useParams, useNavigate, useLocation } from 'react-router-dom';

const CourseDetail = ({ onClose }) => {
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
    const [selectedSession, setSelectedSession] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showOptions, setShowOptions] = useState(false);
    const [deleting, setDeleting] = useState(false);

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
            setDeleting,
            null,
            setError,
            event
        );
        setDeleting(false);
        handleClose();
    };

    // Helper function to parse German date format (DD.MM.YYYY)
    const parseGermanDate = (dateStr) => {
        if (!dateStr) return null;

        const parts = dateStr.split('.');
        if (parts.length !== 3) return null;

        // Note: JS months are 0-indexed
        return new Date(parts[2], parts[1] - 1, parts[0]);
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

                // Sort sessions by sessionOrder by default
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

    const openSessionDetail = (session) => {
        setSelectedSession(session);
    };

    const closeSessionDetail = () => {
        setSelectedSession(null);
    };

    const openStudentDetail = (student) => {
        setSelectedStudent(student);
    };

    const closeStudentDetail = () => {
        setSelectedStudent(null);
    };

    // Calculate attendance for a student across all sessions - returns absences/total format
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

    // Define student table columns
    const studentColumns = [
        { key: 'name', label: 'Name', sortable: true },
        {
            key: 'attendance',
            label: 'Absence',
            sortable: true,
            render: (student) => calculateStudentAttendance(student.id)
        },
        { key: 'info', label: 'Info', sortable: true },
        { key: 'notes', label: 'Notes', sortable: true }
    ];

    // Define session table columns
    const sessionColumns = [
        { key: 'title', label: 'Title', sortable: true },
        {
            key: 'date',
            label: 'Date',
            sortable: true,
            render: (session) => safelyRenderValue(session.date)
        },
        {
            key: 'teacherId',
            label: 'Teacher',
            sortable: true,
            render: (session) => {
                return session.teacherId
                    ? (
                        teachers.length > 0
                            ? (
                                teachers.find(t => String(t.id) === String(session.teacherId))?.name
                                || 'Different Teacher'
                            )
                            : 'Different Teacher'
                    )
                    : '-';
            }
        },
        {
            key: 'time',
            label: 'Time',
            sortable: true,
            render: (session) => `${safelyRenderValue(session.startTime)} - ${safelyRenderValue(session.endTime)}`
        },
        {
            key: 'attendance',
            label: 'Attendance',
            sortable: true,
            render: (session) => calculateSessionAttendance(session)
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (session) => session.status && (
                <span className={`${styles.statusBadge} ${styles[`status${session.status.charAt(0).toUpperCase() + session.status.slice(1)}`]}`}>
                    {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                </span>
            )
        }
    ];

    // Student actions
    const renderStudentActions = (student) => (
        <button
            className={styles.detailsButton}
            onClick={() => openStudentDetail(student)}
        >
            Details
        </button>
    );

    // Session actions
    const renderSessionActions = (session) => (
        <button
            className={styles.detailsButton}
            onClick={() => openSessionDetail(session)}
        >
            Details
        </button>
    );

    if (loading) return <div className="loading">Loading course details...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!course) return <div className="error">Course not found</div>;

    return (
        <div className="course-detail-page">
            {/* Minimalistic Modern Breadcrumb */}
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

                <div className="course-detail-unified-content">
                    {/* Course Overview Section */}
                    <section className="course-section course-overview-section">
                        <h3 className="section-title">Course Overview</h3>
                        <StatsGrid
                            columns={4}
                            stats={[
                                {
                                    icon: faUsers,
                                    value: students.length,
                                    label: 'Students',
                                    color: 'blue'
                                },
                                {
                                    icon: faCalendarDay,
                                    value: sessions.length,
                                    label: 'Sessions',
                                    color: 'green'
                                },
                                {
                                    icon: faChalkboardTeacher,
                                    renderValue: () => (
                                        <div className="stat-teacher-badges">
                                            {teachers.length > 0 ? (
                                                teachers.map((teacher) => (
                                                    <TeacherBadge key={teacher.id} teacher={teacher} />
                                                ))
                                            ) : (
                                                <span className="no-teachers">No teachers</span>
                                            )}
                                        </div>
                                    ),
                                    label: `Teacher${teachers.length !== 1 ? 's' : ''}`,
                                    color: 'purple'
                                },
                                {
                                    icon: faLayerGroup,
                                    value: group ? group.name : (course.group || '-'),
                                    label: 'Group',
                                    color: 'yellow'
                                },
                                {
                                    icon: faStar,
                                    value: course.level || '-',
                                    label: 'Level',
                                    color: 'orange'
                                },
                                {
                                    icon: faCalendarAlt,
                                    value: course.startDate || '-',
                                    label: 'Start Date',
                                    color: 'blue'
                                },
                                {
                                    icon: faCalendarCheck,
                                    value: course.endDate || '-',
                                    label: 'End Date',
                                    color: 'green'
                                },
                                {
                                    icon: faChartLine,
                                    value: students.length > 0 ?
                                        Math.round(
                                            sessions.reduce((sum, session) => {
                                                const [present, total] = calculateSessionAttendance(session).split('/');
                                                return sum + (parseInt(present) / parseInt(total) * 100 || 0);
                                            }, 0) / sessions.length
                                        ) + '%' : '-',
                                    label: 'Avg Attendance',
                                    color: 'purple'
                                }
                            ]}
                        />
                    </section>

                    {/* Students Section - Using SortableTable */}
                    <section className="course-section students-section">
                        <h3 className="section-title">Students ({students.length})</h3>
                        <SortableTable
                            columns={studentColumns}
                            data={students}
                            defaultSortColumn="name"
                            actions={renderStudentActions}
                        />
                    </section>

                    {/* Sessions Section - Using SortableTable */}
                    <section className="course-section sessions-section">
                        <h3 className="section-title">Sessions ({sessions.length})</h3>
                        <SortableTable
                            columns={sessionColumns}
                            data={sessions}
                            defaultSortColumn="sessionOrder"
                            actions={renderSessionActions}
                        />
                    </section>
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
        </div>
    );
};

export default CourseDetail;