// src/features/courses/GroupDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAllRecords } from '../../firebase/database';
import { sortLanguageLevels } from '../../utils/levelSorting';
import { handleDeleteCourse } from '../../utils/courseDeletionUtils';
import '../styles/CourseDetail.css';
import '../styles/Content.css';

const GroupDetail = () => {
    const { groupName } = useParams();
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [deletingCourseId, setDeletingCourseId] = useState(null);

    useEffect(() => {
        const fetchGroupCourses = async () => {
            try {
                setLoading(true);
                
                // Get all courses and filter by group name
                const allCourses = await getAllRecords('courses');
                const groupCourses = allCourses.filter(course => course.group === groupName);
                
                // Get additional data needed for each course
                const sessionsPromise = getAllRecords('sessions');
                const teachersPromise = getAllRecords('teachers');
                
                const [allSessions, allTeachers] = await Promise.all([
                    sessionsPromise,
                    teachersPromise
                ]);
                
                // Enrich course data
                const enrichedCourses = groupCourses.map(course => {
                    // Count students
                    const studentCount = course.studentIds ? course.studentIds.length : 0;
                    
                    // Get sessions for this course
                    const courseSessions = allSessions.filter(s => s.courseId === course.id);
                    const sessionCount = courseSessions.length;
                    
                    // Find teacher info
                    let teacherName = 'Unbekannt';
                    if (course.teacherId) {
                        const teacher = allTeachers.find(t => t.id === course.teacherId);
                        teacherName = teacher ? teacher.name : 'Unbekannt';
                    }
                    
                    return {
                        ...course,
                        studentCount,
                        sessionCount,
                        teacherName
                    };
                });
                
                setCourses(enrichedCourses);
            } catch (err) {
                console.error("Error fetching group courses:", err);
                setError("Failed to load group data.");
            } finally {
                setLoading(false);
            }
        };
        
        if (groupName) {
            fetchGroupCourses();
        }
    }, [groupName]);

    const onClose = () => {
        navigate('/courses');
    };

    const onViewCourse = (courseId) => {
        navigate(`/courses/${courseId}`, { state: { groupName } });
    };

    const onDeleteCourse = async (courseId, courseName, event) => {
        await handleDeleteCourse(
            courseId,
            courseName,
            setDeletingCourseId,
            setCourses,
            setError,
            event
        );
    };

    // Get unique course levels for this group
    const levels = sortLanguageLevels(Array.from(new Set(courses.map(course => course.level))));

    // Total statistics
    const totalStudents = courses.reduce((total, course) => total + course.studentCount, 0);
    const totalSessions = courses.reduce((total, course) => total + course.sessionCount, 0);
    const totalTeachers = new Set(courses.map(course => course.teacherId).filter(id => id)).size;

    if (loading) return <div className="loading">Loading group details...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <>
            <nav className="breadcrumb">
                <span className="breadcrumb-link" onClick={onClose}>Courses</span>
                <span className="breadcrumb-separator">
                    <svg width="16" height="16" fill="none">
                        <path d="M6 4l4 4-4 4" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
                <span className="breadcrumb-current">{groupName}</span>
            </nav>
            <div className="course-detail-container">
                <div className="course-detail-header">
                    <h2>Kursgruppe: {groupName}</h2>
                    <div className="course-level-badge">{courses.length} Kurse</div>
                </div>

                <div className="course-detail-tabs">
                    <button
                        className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        Übersicht
                    </button>
                    <button
                        className={`tab ${activeTab === 'courses' ? 'active' : ''}`}
                        onClick={() => setActiveTab('courses')}
                    >
                        Kurse
                    </button>
                    <button
                        className={`tab ${activeTab === 'levels' ? 'active' : ''}`}
                        onClick={() => setActiveTab('levels')}
                    >
                        Kursstufen
                    </button>
                </div>

                <div className="course-detail-content">
                    {activeTab === 'overview' && (
                        <div className="overview-tab">
                            <div className="stats-row">
                                <div className="stat-box">
                                    <h3>Kurse</h3>
                                    <div className="stat-value">{courses.length}</div>
                                </div>
                                <div className="stat-box">
                                    <h3>Schüler</h3>
                                    <div className="stat-value">{totalStudents}</div>
                                </div>
                                <div className="stat-box">
                                    <h3>Lektionen</h3>
                                    <div className="stat-value">{totalSessions}</div>
                                </div>
                                <div className="stat-box">
                                    <h3>Lehrer</h3>
                                    <div className="stat-value">{totalTeachers}</div>
                                </div>
                            </div>

                            <div className="course-info-card">
                                <h3>Kursstufen in dieser Gruppe</h3>
                                <div className="level-badges-container">
                                    {levels.map(level => (
                                        <div className="level-badge-large" key={level}>
                                            {level}
                                            <span className="count">
                                                {courses.filter(course => course.level === level).length} Kurse
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'courses' && (
                        <div className="courses-tab">
                            <h3>Alle Kurse in {groupName}</h3>
                            <table className="sessions-table">
                                <thead>
                                    <tr>
                                        <th>Kursname</th>
                                        <th>Level</th>
                                        <th>Schüler</th>
                                        <th>Lektionen</th>
                                        <th>Lehrer</th>
                                        <th>Zeitraum</th>
                                        <th>Aktionen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...courses].sort((a, b) => {
                                        const levelOrder = sortLanguageLevels([a.level, b.level]);
                                        return levelOrder[0] === a.level ? -1 : 1;
                                    }).map(course => (
                                        <tr key={course.id} className="clickable-row" onClick={() => onViewCourse(course.id)}>
                                            <td>{course.name}</td>
                                            <td>{course.level}</td>
                                            <td>{course.studentCount}</td>
                                            <td>{course.sessionCount}</td>
                                            <td>{course.teacherName}</td>
                                            <td>
                                                {course.startDate && (
                                                    <>{course.startDate} - {course.endDate || 'heute'}</>
                                                )}
                                            </td>
                                            <td>
                                                <button
                                                    className="btn-delete"
                                                    onClick={(e) => onDeleteCourse(course.id, course.name, e)}
                                                    disabled={deletingCourseId === course.id}
                                                >
                                                    {deletingCourseId === course.id ? 'Löschen...' : 'Löschen'}
                                                </button>
                                                <button
                                                    className="btn-details"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onViewCourse(course.id);
                                                    }}
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

                    {activeTab === 'levels' && (
                        <div className="levels-tab">
                            {levels.map(level => (
                                <div className="level-section" key={level}>
                                    <h3>{level}</h3>
                                    <div className="courses-grid">
                                        {courses
                                            .filter(course => course.level === level)
                                            .map(course => (
                                                <div className="course-card" key={course.id} onClick={() => onViewCourse(course.id)}>
                                                    <div className="course-header">
                                                        <h3>{course.name}</h3>
                                                        <span className="course-level">{course.level}</span>
                                                    </div>
                                                    <div className="course-info">
                                                        <div className="info-item">
                                                            <span className="label">Schüler:</span>
                                                            <span className="value">{course.studentCount}</span>
                                                        </div>
                                                        <div className="info-item">
                                                            <span className="label">Lektionen:</span>
                                                            <span className="value">{course.sessionCount}</span>
                                                        </div>
                                                        <div className="info-item">
                                                            <span className="label">Lehrer:</span>
                                                            <span className="value">{course.teacherName}</span>
                                                        </div>
                                                        {course.startDate && (
                                                            <div className="info-item">
                                                                <span className="label">Zeitraum:</span>
                                                                <span className="value">
                                                                    {course.startDate} - {course.endDate || 'heute'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="course-actions">
                                                        <button
                                                            className="btn-delete"
                                                            onClick={(e) => onDeleteCourse(course.id, course.name, e)}
                                                            disabled={deletingCourseId === course.id}
                                                        >
                                                            {deletingCourseId === course.id ? 'Löschen...' : 'Löschen'}
                                                        </button>
                                                        <button
                                                            className="btn-details"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onViewCourse(course.id);
                                                            }}
                                                        >
                                                            Details ansehen
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default GroupDetail;