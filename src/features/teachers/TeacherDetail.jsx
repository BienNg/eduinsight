// src/components/Dashboard/TeacherDetail.jsx
import '../styles/CourseDetail.css';
import '../common/Tabs.css';
import "../common/SlidingPane.css";
import "react-sliding-pane/dist/react-sliding-pane.css";
import { getRecordById, getAllRecords, updateRecord } from '../firebase/database'
import CourseDetail from '../dashboard/CourseDetail';
import SessionDetailModal from '../sessions/SessionDetailModal';
import DetailLayout from '../common/DetailLayout';
import { isLongSession, countLongSessions } from '../utils/sessionUtils';
import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import SlidingPane from 'react-sliding-pane';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt, faClock, faEye } from '@fortawesome/free-solid-svg-icons';
import { useParams, useNavigate } from 'react-router-dom';

const TeacherDetail = () => {
    const [teacher, setTeacher] = useState(null);
    const [courses, setCourses] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [months, setMonths] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [expandedMonth, setExpandedMonth] = useState(null);
    const [selectedCourseId, setSelectedCourseId] = useState(null);
    const [selectedSession, setSelectedSession] = useState(null);
    const [editingCountry, setEditingCountry] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState('');
    // Add new state for side peek functionality
    const [isPaneOpen, setIsPaneOpen] = useState(false);
    const [peekCourse, setPeekCourse] = useState(null);
    const [courseSessions, setCourseSessions] = useState([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const { id } = useParams();
    const navigate = useNavigate();

    const handleClose = () => {
        navigate('/teachers');
      };

    const getCurrentMonthSessionsData = () => {
        // Get current month and year
        const now = new Date();
        const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
        const currentYear = now.getFullYear();

        // Filter sessions for current month
        const currentMonthSessions = sessions.filter(session => {
            if (!session.date) return false;

            const dateParts = session.date.split('.');
            if (dateParts.length !== 3) return false;

            const sessionMonth = parseInt(dateParts[1]);
            const sessionYear = parseInt(dateParts[2]);

            return sessionMonth === currentMonth && sessionYear === currentYear;
        });

        // Group sessions by course
        const courseSessionMap = {};

        currentMonthSessions.forEach(session => {
            if (!courseSessionMap[session.courseId]) {
                const course = courses.find(c => c.id === session.courseId);
                courseSessionMap[session.courseId] = {
                    course: course,
                    sessions: [],
                    totalHours: 0,
                    longSessionsCount: 0
                };
            }

            courseSessionMap[session.courseId].sessions.push(session);

            // Determine if it's a long session and calculate hours
            const isLong = isLongSession(session.startTime, session.endTime);
            courseSessionMap[session.courseId].totalHours += isLong ? 2 : 1.5;
            if (isLong) {
                courseSessionMap[session.courseId].longSessionsCount++;
            }
        });

        return Object.values(courseSessionMap);
    };

    // Define the prepareChartData function BEFORE using it in useMemo
    const prepareChartData = (sessions) => {
        // Create a map to store hours by month
        const monthlyHours = {};

        // Month names in German
        const monthNames = [
            'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
            'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'
        ];

        sessions.forEach(session => {
            if (session.date) {
                // Extract month from date (format: DD.MM.YYYY)
                const dateParts = session.date.split('.');
                if (dateParts.length === 3) {
                    const monthNum = parseInt(dateParts[1]) - 1; // Convert to 0-based index
                    const fullYear = dateParts[2];
                    const shortYear = fullYear.slice(2);
                    const monthKey = `${dateParts[1]}.${fullYear}`; // MM.YYYY format for sorting
                    const displayMonth = `${monthNames[monthNum]} ${shortYear}`; // "Month Year" format

                    // Calculate session duration using the same logic as in the courses table
                    const sessionHours = isLongSession(session.startTime, session.endTime) ? 2 : 1.5;

                    // Add to monthly total
                    if (!monthlyHours[monthKey]) {
                        monthlyHours[monthKey] = {
                            month: displayMonth,
                            hours: 0,
                            sortKey: monthKey
                        };
                    }
                    monthlyHours[monthKey].hours += sessionHours;
                }
            }
        });

        // Convert to array format needed by Recharts
        return Object.values(monthlyHours)
            .sort((a, b) => {
                // Sort by date (MM.YYYY format) using sortKey
                const [monthA, yearA] = a.sortKey.split('.');
                const [monthB, yearB] = b.sortKey.split('.');
                return (yearA - yearB) || (monthA - monthB);
            });
    };

    // Now use the function in useMemo
    const chartData = useMemo(() => prepareChartData(sessions), [sessions]);

    const tabs = [
        { id: 'overview', label: 'Übersicht' },
        { id: 'courses', label: 'Kurse' },
        { id: 'sessions', label: 'Lektionen' },
        { id: 'monthly', label: 'Monatlich' },
        { id: 'info', label: 'Info' },
    ];


    // Add this useEffect to initialize the selectedCountry
    useEffect(() => {
        const fetchTeacherDetails = async () => {
            try {
                setLoading(true);

                // Fetch teacher data
                const teacherData = await getRecordById('teachers', id);
                if (!teacherData) {
                    throw new Error("Teacher not found");
                }
                setTeacher(teacherData);

                // Fetch course data
                const coursesData = await Promise.all(
                    (teacherData.courseIds || []).map(courseId => getRecordById('courses', courseId))
                );
                setCourses(coursesData.filter(c => c !== null));

                // Collect all session IDs from all courses
                const allSessionIds = [];
                coursesData.forEach(course => {
                    if (course && course.sessionIds) {
                        allSessionIds.push(...course.sessionIds);
                    }
                });

                // Fetch all sessions
                const sessionsData = await Promise.all(
                    allSessionIds.map(sessionId => getRecordById('sessions', sessionId))
                );

                // Filter sessions where this teacher is the assigned teacher
                const validSessions = sessionsData
                    .filter(s => s !== null)
                    .filter(s => s.teacherId === id); // This is the key change

                // Sort sessions by date
                const sortedSessions = validSessions.sort((a, b) => {
                    if (!a.date || !b.date) return 0;

                    const partsA = a.date.split('.');
                    const partsB = b.date.split('.');

                    if (partsA.length === 3 && partsB.length === 3) {
                        const dateA = new Date(partsA[2], partsA[1] - 1, partsA[0]);
                        const dateB = new Date(partsB[2], partsB[1] - 1, partsB[0]);
                        return dateA - dateB;
                    }

                    return 0;
                });

                setSessions(sortedSessions);

                // Fetch month data and group sessions by month (using filtered sessions)
                const monthIds = new Set(validSessions.map(session => session.monthId).filter(id => id));
                const monthsData = await Promise.all(
                    Array.from(monthIds).map(monthId => getRecordById('months', monthId))
                );
                setMonths(monthsData.filter(m => m !== null));

            } catch (err) {
                console.error("Error fetching teacher details:", err);
                setError("Failed to load teacher details.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchTeacherDetails();
        }
    }, [id]);

    useEffect(() => {
        // Apply will-change property before animation starts
        if (isPaneOpen) {
            document.querySelector('.slide-pane_from_right')?.style.setProperty('will-change', 'transform');
        }

        // Clean up will-change after animation completes
        const cleanupTimer = setTimeout(() => {
            if (isPaneOpen) {
                document.querySelector('.slide-pane_from_right')?.style.removeProperty('will-change');
            }
        }, 300); // slightly longer than animation duration

        return () => clearTimeout(cleanupTimer);
    }, [isPaneOpen]);

    const openSessionDetail = (session) => {
        setSelectedSession(session);
    };

    const closeSessionDetail = () => {
        setSelectedSession(null);
    };

    // Add this new function for the side peek
    const handleCourseSidePeek = (course, e) => {
        e.stopPropagation(); // Prevent full course detail from opening
        setPeekCourse(course);
        setSessionsLoading(true);

        // Filter sessions for this course
        const courseSessionsList = sessions.filter(session =>
            session.courseId === course.id
        );

        // Sort by date
        const sortedSessions = [...courseSessionsList].sort((a, b) => {
            if (!a.date || !b.date) return 0;

            const partsA = a.date.split('.');
            const partsB = b.date.split('.');

            if (partsA.length === 3 && partsB.length === 3) {
                const dateA = new Date(partsA[2], partsA[1] - 1, partsA[0]);
                const dateB = new Date(partsB[2], partsB[1] - 1, partsB[0]);
                return dateA - dateB;
            }

            return 0;
        });

        setCourseSessions(sortedSessions);
        setSessionsLoading(false);
        setIsPaneOpen(true);
    };


    // Function to open full course detail with sessions tab focused
    const handleOpenCourseDetails = () => {
        if (peekCourse) {
            setIsPaneOpen(false);
            // We need to delay setting the selectedCourseId to ensure the pane closes first
            setTimeout(() => {
                setSelectedCourseId(peekCourse.id);
            }, 100);
        }
    };

    // Function to handle course selection
    const handleCourseSelect = (courseId) => {
        navigate(`/courses/${courseId}`);
    };

    // Function to go back from course detail to teacher detail
    const handleBackToTeacher = () => {
        setSelectedCourseId(null);
    };

    // Function to safely render any type of value
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

    // Calculate hours for a specific month
    const calculateMonthlyHours = (monthId) => {
        const monthSessions = sessions.filter(session => session.monthId === monthId);
        let totalHours = 0;

        monthSessions.forEach(session => {
            if (session.startTime && session.endTime) {
                // Basic calculation (can be improved)
                totalHours += 1.5; // Assuming average session length
            }
        });

        return totalHours.toFixed(1);
    };

    // Add a function to handle saving the country change
    const handleSaveCountry = async () => {
        try {
            await updateRecord('teachers', id, { country: selectedCountry });
            // Update the local teacher state
            setTeacher({ ...teacher, country: selectedCountry });
            setEditingCountry(false);
        } catch (error) {
            console.error("Error updating teacher country:", error);
            // Optionally add error handling UI here
        }
    };

    // Get course name by ID
    const getCourseNameById = (courseId) => {
        const course = courses.find(c => c.id === courseId);
        return course ? course.name : 'Unknown Course';
    };

    // Group sessions by month
    const groupSessionsByMonth = () => {
        const grouped = {};

        months.forEach(month => {
            const monthSessions = sessions.filter(session => session.monthId === month.id);
            const longSessionsCount = countLongSessions(monthSessions);

            grouped[month.id] = {
                month: month,
                sessions: monthSessions,
                longSessionsCount: longSessionsCount
            };
        });

        // Sort the month entries by id in descending order (newest first)
        return Object.fromEntries(
            Object.entries(grouped).sort((a, b) => {
                // Month IDs are in format 'YYYY-MM'
                return b[0].localeCompare(a[0]); // Reverse sort
            })
        );
    };

    if (loading) return <div className="loading">Loading teacher details...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!teacher) return <div className="error">Teacher not found</div>;

    const groupedSessions = groupSessionsByMonth();
    const totalHours = sessions.length * 1.5; // Simple calculation, can be improved


    const formatCourseDates = (course) => {
        // Default display
        let startDateDisplay = course.startDate || '-';
        let endDateDisplay = null;
        let isOngoing = false;

        // If we have sessions data available, calculate from actual sessions
        if (sessions.length > 0) {
            // Filter sessions for this specific course
            const courseSessions = sessions.filter(session => session.courseId === course.id);

            if (courseSessions.length > 0) {
                // Sort sessions by date
                const sortedSessions = [...courseSessions].sort((a, b) => {
                    if (!a.date || !b.date) return 0;

                    const partsA = a.date.split('.');
                    const partsB = b.date.split('.');

                    if (partsA.length === 3 && partsB.length === 3) {
                        const dateA = new Date(partsA[2], partsA[1] - 1, partsA[0]);
                        const dateB = new Date(partsB[2], partsB[1] - 1, partsB[0]);
                        return dateA - dateB;
                    }

                    return 0;
                });

                // Get first and last session dates
                const firstSession = sortedSessions[0];
                const lastSession = sortedSessions[sortedSessions.length - 1];

                // Update start date if available
                if (firstSession && firstSession.date) {
                    startDateDisplay = firstSession.date;
                }

                // Update end date if available
                if (lastSession && lastSession.date) {
                    // Check if the last session is in the future
                    const parts = lastSession.date.split('.');
                    if (parts.length === 3) {
                        const sessionDate = new Date(parts[2], parts[1] - 1, parts[0]);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);

                        if (sessionDate >= today) {
                            isOngoing = true;
                        } else {
                            endDateDisplay = lastSession.date;
                        }
                    } else {
                        endDateDisplay = lastSession.date;
                    }
                } else {
                    isOngoing = true;
                }
            }
        } else {
            // Fallback to course.endDate
            endDateDisplay = course.endDate;
            // If no end date, mark as ongoing
            if (!endDateDisplay) {
                isOngoing = true;
            }
        }

        return { startDateDisplay, endDateDisplay, isOngoing };
    };

    // Create the custom header right content for DetailLayout
    const headerRight = (
        <div className="teacher-country-badge">
            {teacher.country || 'No Country'}
        </div>
    );
    return (
        <DetailLayout
            title={teacher.name}
            onClose={handleClose}
            tabs={tabs}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            headerRight={headerRight}
            breadcrumbParent="Lehrer"
        >
            {activeTab === 'overview' && (
                <div className="overview-tab">
                    <div className="overview-flex-container">
                        <div className="stats-column">
                            <div className="stat-box">
                                <h3>Kurse</h3>
                                <div className="stat-value">{courses.length}</div>
                            </div>
                            <div className="stat-box">
                                <h3>Lektionen</h3>
                                <div className="stat-value">{sessions.length}</div>
                            </div>
                            <div className="stat-box">
                                <h3>Unterrichtsstunden</h3>
                                <div className="stat-value">{totalHours.toFixed(1)}</div>
                            </div>
                        </div>
    
                        <div className="graph-container">
                            <h3>Unterrichtsstunden pro Monat</h3>
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <LineChart
                                        data={chartData}
                                        margin={{ top: 20, right: 40, left: 0, bottom: 0 }}
                                    >
                                        <CartesianGrid stroke="#e0e0e0" strokeDasharray="0 0" vertical={false} horizontal={false} />
                                        <XAxis
                                            dataKey="month"
                                            tick={{ angle: 0, textAnchor: 'middle', dy: 10 }}
                                            axisLine={true}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tickFormatter={(value) => `${value}h`}
                                            axisLine={true}
                                            tickLine={false}
                                            dx={-10}
                                        />
                                        <Tooltip formatter={(value) => [`${value.toFixed(1)} Stunden`]} />
                                        <Line
                                            type="monotone"
                                            dataKey="hours"
                                            stroke="var(--primary-blue)"
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
    
                    <div className="course-info-card" style={{ backgroundColor: 'white', marginTop: '24px' }}>
                        <h3>Kurse im aktuellen Monat ({new Date().toLocaleString('de-DE', { month: 'long', year: 'numeric' })})</h3>
    
                        {getCurrentMonthSessionsData().length > 0 ? (
                            <table className="sessions-table">
                                <thead>
                                    <tr>
                                        <th>Kurs</th>
                                        <th>Level</th>
                                        <th>Lektionen</th>
                                        <th>Unterrichtsstunden</th>
                                        <th>2h-Lektionen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getCurrentMonthSessionsData().map(data => (
                                        <tr
                                            key={data.course.id}
                                            className="clickable-row"
                                            onClick={(e) => {
                                                handleCourseSidePeek(data.course, e);
                                            }}
                                        >
                                            <td>{data.course.name}</td>
                                            <td>{data.course.level}</td>
                                            <td>{data.sessions.length}</td>
                                            <td>{data.totalHours.toFixed(1)}</td>
                                            <td>
                                                {data.longSessionsCount > 0 && (
                                                    <span className="long-session-count">
                                                        <FontAwesomeIcon icon={faClock} className="long-session-icon" />
                                                        {data.longSessionsCount}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan="2"><strong>Gesamt</strong></td>
                                        <td><strong>{getCurrentMonthSessionsData().reduce((sum, data) => sum + data.sessions.length, 0)}</strong></td>
                                        <td><strong>{getCurrentMonthSessionsData().reduce((sum, data) => sum + data.totalHours, 0).toFixed(1)}</strong></td>
                                        <td><strong>{getCurrentMonthSessionsData().reduce((sum, data) => sum + data.longSessionsCount, 0)}</strong></td>
                                    </tr>
                                </tfoot>
                            </table>
                        ) : (
                            <div className="empty-state">
                                <p>Keine Kurse im aktuellen Monat.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
    
            {activeTab === 'courses' && (
                <div className="courses-tab">
                    {courses.length > 0 ? (
                        <table className="sessions-table">
                            <thead>
                                <tr>
                                    <th>Kurs</th>
                                    <th>Level</th>
                                    <th>Lektionen</th>
                                    <th>Zeitraum</th>
                                    <th>Anzahl Schüler</th>
                                    <th>Aktionen</th>
                                </tr>
                            </thead>
                            <tbody>
                                {courses.map((course) => {
                                    const { startDateDisplay, endDateDisplay, isOngoing } = formatCourseDates(course);
                                    return (
                                        <tr
                                            key={course.id}
                                            className="clickable-row"
                                            onClick={() => handleCourseSelect(course.id)}
                                        >
                                            <td>{course.name}</td>
                                            <td>{course.level}</td>
                                            <td>
                                                {
                                                    sessions.filter(
                                                        (session) => session.courseId === course.id && session.teacherId === teacher.id
                                                    ).length
                                                }
                                            </td>
                                            <td>
                                                {startDateDisplay} - {isOngoing ? (
                                                    <span className="status-badge ongoing">Ongoing</span>
                                                ) : (
                                                    endDateDisplay || '-'
                                                )}
                                            </td>
                                            <td>{course.studentIds ? course.studentIds.length : 0}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="btn-peek"
                                                        onClick={(e) => handleCourseSidePeek(course, e)}
                                                        title="Lektionen anzeigen"
                                                    >
                                                        <FontAwesomeIcon icon={faEye} />
                                                    </button>
                                                    <button
                                                        className="btn-details"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCourseSelect(course.id);
                                                        }}
                                                    >
                                                        Details
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state">
                            <p>Keine Kurse gefunden.</p>
                        </div>
                    )}
                </div>
            )}
    
            {activeTab === 'sessions' && (
                <div className="sessions-tab">
                    {sessions.length > 0 ? (
                        <table className="sessions-table">
                            <thead>
                                <tr>
                                    <th>Datum</th>
                                    <th>Kurs</th>
                                    <th>Titel</th>
                                    <th>Zeit</th>
                                    <th>Lehrer</th>
                                    <th>Monat</th>
                                    <th>Aktionen</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sessions.map((session) => {
                                    const month = months.find(m => m.id === session.monthId);
                                    return (
                                        <tr key={session.id}>
                                            <td>{safelyRenderValue(session.date)}</td>
                                            <td>{getCourseNameById(session.courseId)}</td>
                                            <td>{safelyRenderValue(session.title)}</td>
                                            <td>
                                                {safelyRenderValue(session.startTime)} - {safelyRenderValue(session.endTime)}
                                            </td>
                                            <td>{session.teacherId === teacher.id ? teacher.name : 'Unknown'}</td>
                                            <td>{month ? month.name : '-'}</td>
                                            <td>
                                                <button
                                                    className="btn-details"
                                                    onClick={() => openSessionDetail(session)}
                                                >
                                                    Details
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state">
                            <p>Keine Lektionen gefunden.</p>
                        </div>
                    )}
                </div>
            )}
    
            {activeTab === 'monthly' && (
                <div className="monthly-tab">
                    {months.length > 0 ? (
                        <div className="month-cards-container">
                            {Object.entries(groupSessionsByMonth()).map(([monthId, data]) => {
                                // Calculate total hours for this month
                                const totalHours = calculateMonthlyHours(monthId);
    
                                // Group sessions by course
                                const courseGroups = {};
                                data.sessions.forEach(session => {
                                    if (!courseGroups[session.courseId]) {
                                        courseGroups[session.courseId] = {
                                            courseName: getCourseNameById(session.courseId),
                                            sessions: [],
                                            hours: 0
                                        };
                                    }
                                    courseGroups[session.courseId].sessions.push(session);
                                    courseGroups[session.courseId].hours += 1.5; // Assuming average session length
                                });
    
                                return (
                                    <div
                                        className="month-card"
                                        key={monthId}
                                        onClick={() => setExpandedMonth(expandedMonth === monthId ? null : monthId)}
                                    >
                                        <div className="month-card-header">
                                            <h4>{data.month.name}</h4>
                                            <div className="month-card-actions">
                                                <div className="month-totals">
                                                    <span>Lektionen: {data.sessions.length}</span>
                                                    <span>Stunden: {totalHours}</span>
                                                    {/* Add this new indicator */}
                                                    {data.longSessionsCount > 0 && (
                                                        <span className="long-session-indicator">
                                                            <FontAwesomeIcon icon={faClock} className="long-session-icon" />
                                                            <span className="long-session-count">{data.longSessionsCount} 2h-Lektionen</span>
                                                        </span>
                                                    )}
                                                </div>
                                                <span className={`expand-indicator ${expandedMonth === monthId ? 'expanded' : ''}`}>
                                                    {expandedMonth === monthId ? '▼' : '▶'}
                                                </span>
                                            </div>
                                        </div>
    
                                        <div className="month-card-courses">
                                            {Object.entries(courseGroups).map(([courseId, courseData]) => (
                                                <div className="course-summary" key={courseId}>
                                                    <span className="course-name">{courseData.courseName}</span>
                                                    <span className="course-stats">
                                                        <span className="session-count">{courseData.sessions.length} Lektionen</span>
                                                        <span className="hour-count">{courseData.hours.toFixed(1)} Std</span>
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
    
                                        {expandedMonth === monthId && (
                                            <div className="month-details">
                                                <h5>Lektionen</h5>
                                                <table className="sessions-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Datum</th>
                                                            <th>Kurs</th>
                                                            <th>Titel</th>
                                                            <th>Zeit</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {data.sessions.map(session => {
                                                            const isLong = isLongSession(session.startTime, session.endTime);
                                                            return (
                                                                <tr key={session.id}>
                                                                    <td>{safelyRenderValue(session.date)}</td>
                                                                    <td>{getCourseNameById(session.courseId)}</td>
                                                                    <td>
                                                                        {safelyRenderValue(session.title)}
                                                                        {isLong && (
                                                                            <span className="long-session-indicator">
                                                                                <FontAwesomeIcon icon={faClock} className="long-session-icon" />
                                                                                <span>2h</span>
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td>
                                                                        {safelyRenderValue(session.startTime)} - {safelyRenderValue(session.endTime)}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>Keine monatlichen Daten gefunden.</p>
                        </div>
                    )}
                </div>
            )}
    
            {activeTab === 'info' && (
                <div className="info-tab">
                    <div className="course-info-card">
                        <h3>Lehrer Information</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="label">Name:</span>
                                <span className="value">{teacher.name}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Land:</span>
                                {editingCountry ? (
                                    <div className="country-selector-inline">
                                        <select
                                            value={selectedCountry}
                                            onChange={(e) => setSelectedCountry(e.target.value)}
                                            className="country-select"
                                        >
                                            <option value="Deutschland">Deutschland</option>
                                            <option value="Vietnam">Vietnam</option>
                                        </select>
                                        <button onClick={handleSaveCountry} className="save-btn">Speichern</button>
                                        <button onClick={() => setEditingCountry(false)} className="cancel-btn">Abbrechen</button>
                                    </div>
                                ) : (
                                    <span className="value editable" onClick={() => setEditingCountry(true)}>
                                        {teacher.country || 'No Country'} <FontAwesomeIcon icon={faPencilAlt} className="edit-icon" />
                                    </span>
                                )}
                            </div>
                            <div className="info-item">
                                <span className="label">Anzahl Monate aktiv:</span>
                                <span className="value">{months.length}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Durchschnittliche Stunden pro Monat:</span>
                                <span className="value">
                                    {months.length > 0 ? (totalHours / months.length).toFixed(1) : '0'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
    
            <SlidingPane
                isOpen={isPaneOpen}
                title={peekCourse ? `Lektionen: ${peekCourse.name}` : 'Lektionen'}
                subtitle={peekCourse ? `Level: ${peekCourse.level}` : ''}
                width="66%"
                onRequestClose={() => setIsPaneOpen(false)}
                hideHeader={false}
                closeIcon={<span className="sliding-pane-close-icon">×</span>}
                className="custom-sliding-pane"
            >
                <div className="side-peek-content">
                    <div className="side-peek-actions">
                        <button
                            className="btn-view-details"
                            onClick={handleOpenCourseDetails}
                        >
                            Kurs Details anzeigen
                        </button>
                    </div>
    
                    {sessionsLoading ? (
                        <div className="loading-indicator">Lektionen werden geladen...</div>
                    ) : courseSessions.length > 0 ? (
                        <table className="sessions-table">
                            <thead>
                                <tr>
                                    <th>Datum</th>
                                    <th>Titel</th>
                                    <th>Zeit</th>
                                    <th>Lehrer</th>
                                    <th>Aktionen</th>
                                </tr>
                            </thead>
                            <tbody>
                                {courseSessions.map(session => (
                                    <tr key={session.id}>
                                        <td>{safelyRenderValue(session.date)}</td>
                                        <td>{safelyRenderValue(session.title)}</td>
                                        <td>
                                            {safelyRenderValue(session.startTime)} - {safelyRenderValue(session.endTime)}
                                            {isLongSession(session.startTime, session.endTime) && (
                                                <span className="long-session-indicator">
                                                    <FontAwesomeIcon icon={faClock} className="long-session-icon" />
                                                </span>
                                            )}
                                        </td>
                                        <td>{session.teacherId === teacher.id ? teacher.name : 'Anderer Lehrer'}</td>
                                        <td>
                                            <button
                                                className="btn-details"
                                                onClick={() => {
                                                    setSelectedSession(session);
                                                    setIsPaneOpen(false);
                                                }}
                                            >
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state">
                            <p>Keine Lektionen für diesen Kurs gefunden.</p>
                        </div>
                    )}
                </div>
            </SlidingPane>
            
            {selectedSession && (
                <SessionDetailModal
                    session={selectedSession}
                    students={[]} // Pass relevant students if available
                    teacher={teacher}
                    onClose={closeSessionDetail}
                    groupName={courses.find(c => c.id === selectedSession.courseId)?.group || null}
                />
            )}
        </DetailLayout>
    );
};

export default TeacherDetail;