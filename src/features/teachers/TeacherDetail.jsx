// src/features/teachers/TeacherDetail.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getRecordById } from '../firebase/database';
import { isLongSession } from '../utils/sessionUtils';
import '../styles/Content.css';
import '../styles/cards/Cards.css';
import '../styles/TeacherDetail.css';


const TeacherDetail = () => {
    const [teacher, setTeacher] = useState(null);
    const [courses, setCourses] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { id } = useParams();
    const navigate = useNavigate();

    const handleBack = () => {
        navigate('/teachers');
    };

    // Prepare chart data for monthly hours
    const prepareChartData = (sessions) => {
        const monthlyHours = {};
        const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

        sessions.forEach(session => {
            if (session.date) {
                const dateParts = session.date.split('.');
                if (dateParts.length === 3) {
                    const monthNum = parseInt(dateParts[1]) - 1;
                    const fullYear = dateParts[2];
                    const shortYear = fullYear.slice(2);
                    const monthKey = `${dateParts[1]}.${fullYear}`;
                    const displayMonth = `${monthNames[monthNum]} ${shortYear}`;

                    const sessionHours = isLongSession(session.startTime, session.endTime) ? 2 : 1.5;

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

        return Object.values(monthlyHours)
            .sort((a, b) => {
                const [monthA, yearA] = a.sortKey.split('.');
                const [monthB, yearB] = b.sortKey.split('.');
                return (yearA - yearB) || (monthA - monthB);
            });
    };

    // Calculate unique group IDs
    const uniqueGroupIds = useMemo(() => {
        // Extract unique group IDs from all courses this teacher teaches
        const groupIds = new Set();
        courses.forEach(course => {
            if (course && course.groupId) {
                groupIds.add(course.groupId);
            }
        });
        return groupIds.size;
    }, [courses]);

    const chartData = useMemo(() => prepareChartData(sessions), [sessions]);

    // Get current month sessions and courses
    const getCurrentMonthData = () => {
        const now = new Date();
        const currentMonth = now.getMonth(); // 0-indexed
        const currentYear = now.getFullYear();

        const monthSessions = sessions.filter(session => {
            if (!session.date) return false;
            const dateParts = session.date.split('.');
            if (dateParts.length !== 3) return false;
            const sessionMonth = parseInt(dateParts[1]) - 1; // Convert to 0-indexed
            const sessionYear = parseInt(dateParts[2]);
            return sessionMonth === currentMonth && sessionYear === currentYear;
        });

        const courseSessionMap = {};
        monthSessions.forEach(session => {
            if (!courseSessionMap[session.courseId]) {
                const course = courses.find(c => c.id === session.courseId);
                courseSessionMap[session.courseId] = {
                    course,
                    sessions: [],
                    totalHours: 0,
                    longSessionsCount: 0
                };
            }
            courseSessionMap[session.courseId].sessions.push(session);
            const isLong = isLongSession(session.startTime, session.endTime);
            courseSessionMap[session.courseId].totalHours += isLong ? 2 : 1.5;
            if (isLong) {
                courseSessionMap[session.courseId].longSessionsCount++;
            }
        });

        return Object.values(courseSessionMap);
    };

    useEffect(() => {
        const fetchTeacherDetails = async () => {
            try {
                setLoading(true);

                const teacherData = await getRecordById('teachers', id);
                if (!teacherData) {
                    throw new Error("Teacher not found");
                }
                setTeacher(teacherData);

                const coursesData = await Promise.all(
                    (teacherData.courseIds || []).map(courseId => getRecordById('courses', courseId))
                );
                setCourses(coursesData.filter(c => c !== null));

                const allSessionIds = [];
                coursesData.forEach(course => {
                    if (course && course.sessionIds) {
                        allSessionIds.push(...course.sessionIds);
                    }
                });

                const sessionsData = await Promise.all(
                    allSessionIds.map(sessionId => getRecordById('sessions', sessionId))
                );

                const validSessions = sessionsData
                    .filter(s => s !== null)
                    .filter(s => s.teacherId === id);

                const sortedSessions = validSessions.sort((a, b) => {
                    if (!a.date || !b.date) return 0;
                    const partsA = a.date.split('.');
                    const partsB = b.date.split('.');
                    if (partsA.length === 3 && partsB.length === 3) {
                        const dateA = new Date(partsA[2], partsA[1] - 1, partsA[0]);
                        const dateB = new Date(partsB[2], partsB[1] - 1, partsB[0]);
                        return dateB - dateA; // Sort descending
                    }
                    return 0;
                });

                setSessions(sortedSessions);
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

    if (loading) return <div className="loading-indicator">Loading teacher details...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!teacher) return <div className="error-message">Teacher not found</div>;

    const currentMonthData = getCurrentMonthData();
    const totalMonthHours = currentMonthData.reduce((sum, data) => sum + data.totalHours, 0);
    const totalMonthSessions = currentMonthData.reduce((sum, data) => sum + data.sessions.length, 0);
    const totalLongSessions = currentMonthData.reduce((sum, data) => sum + data.longSessionsCount, 0);

    const monthNow = new Date().toLocaleString('de-DE', { month: 'long', year: 'numeric' });

    return (
        <div className="teacher-detail-page">
            {/* Teacher Header */}
            <div className="breadcrumb">
                <span className="breadcrumb-link" onClick={handleBack}>Lehrer</span>
                <span className="breadcrumb-separator">›</span>
                <span className="breadcrumb-current">{teacher.name}</span>
            </div>

            <div className="teacher-header">
                <div className="teacher-title-section">
                    <div className="teacher-header-row">
                        <h1 className="teacher-name">{teacher.name}</h1>
                        <div className="teacher-meta-info">
                            <span className="teacher-country">{teacher.country || 'No Country'}</span>
                            <span className="teacher-separator">•</span>
                            <span className="teacher-stats">{courses.length} Kurse</span>
                            <span className="teacher-separator">•</span>
                            <span className="teacher-stats">{sessions.length} Lektionen</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Three Column Layout */}
            <div className="three-column-overview-grid">
                {/* First Column: Courses from current month */}
                <div className="overview-panel animate-card">
                    <div className="panel-header">
                        <h3 className="panel-title">Kurse ({monthNow})</h3>
                    </div>
                    <div className="panel-content">
                        {currentMonthData.length > 0 ? (
                            <>
                                <div className="compact-course-list">
                                    {currentMonthData.map(data => (
                                        <div
                                            key={data.course.id}
                                            className="compact-course-item clickable"
                                            onClick={() => navigate(`/courses/${data.course.id}`)}
                                        >
                                            <div className="course-name-wrapper">
                                                <span className="course-name">{data.course.name}</span>
                                                <span className="course-level">{data.course.level}</span>
                                            </div>
                                            <div className="course-meta">
                                                <span>{data.sessions.length} Lektionen</span>
                                                <span>{data.totalHours.toFixed(1)}h</span>
                                                {data.longSessionsCount > 0 && (
                                                    <span className="long-session-count">
                                                        <FontAwesomeIcon icon={faClock} />
                                                        {data.longSessionsCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="month-summary">
                                    <div className="summary-item">
                                        <span className="summary-label">Gesamt Lektionen:</span>
                                        <span className="summary-value">{totalMonthSessions}</span>
                                    </div>
                                    <div className="summary-item">
                                        <span className="summary-label">Gesamt Stunden:</span>
                                        <span className="summary-value">{totalMonthHours.toFixed(1)}h</span>
                                    </div>
                                    <div className="summary-item">
                                        <span className="summary-label">2h-Lektionen:</span>
                                        <span className="summary-value">{totalLongSessions}</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="empty-message">Keine Kurse in diesem Monat.</div>
                        )}
                    </div>
                </div>

                {/* Second Column: Monthly hours chart */}
                <div className="overview-panel animate-card">
                    <div className="panel-header">
                        <h3 className="panel-title">Unterrichtsstunden pro Monat</h3>
                    </div>
                    <div className="panel-content">
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <LineChart
                                    data={chartData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        tick={{ fontSize: 12 }}
                                        tickMargin={10}
                                    />
                                    <YAxis
                                        tickFormatter={(value) => `${value}h`}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        formatter={(value) => [`${value.toFixed(1)} Stunden`]}
                                        contentStyle={{
                                            borderRadius: '4px',
                                            padding: '8px',
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="hours"
                                        stroke="#0088FE"
                                        strokeWidth={2}
                                        dot={{ r: 4, strokeWidth: 2 }}
                                        activeDot={{ r: 6, strokeWidth: 0, fill: '#0088FE' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Third Column: Teacher info and recent sessions */}
                <div className="overview-column">
                    {/* Teacher info card */}
                    <div className="overview-panel animate-card">
                        <div className="panel-header">
                            <h3 className="panel-title">Lehrer Information</h3>
                        </div>
                        <div className="panel-content">
                            <div className="info-grid two-column">
                                <div className="info-item">
                                    <span className="label">Name:</span>
                                    <span className="value">{teacher.name}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Land:</span>
                                    <span className="value">{teacher.country || 'No Country'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Gesamt Kurse:</span>
                                    <span className="value">{courses.length}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Gesamt Gruppen:</span>
                                    <span className="value">{uniqueGroupIds}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Gesamt Lektionen:</span>
                                    <span className="value">{sessions.length}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Gesamt Stunden:</span>
                                    <span className="value">{(sessions.length * 1.5).toFixed(1)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent sessions list */}
                    <div className="overview-panel animate-card">
                        <div className="panel-header">
                            <h3 className="panel-title">Letzte Lektionen</h3>
                        </div>
                        <div className="panel-content">
                            {sessions.length > 0 ? (
                                <div className="compact-session-list">
                                    {sessions.slice(0, 10).map(session => {
                                        const course = courses.find(c => c.id === session.courseId) || {};
                                        return (
                                            <div
                                                className="compact-session-item"
                                                key={session.id}
                                            >
                                                <div className="session-main-info">
                                                    <div className="session-date">{session.date}</div>
                                                    <div className="session-title">{session.title}</div>
                                                </div>
                                                <div className="session-meta">
                                                    <span>{course.name || 'Unknown Course'}</span>
                                                    <span>
                                                        {session.startTime} - {session.endTime}
                                                        {isLongSession(session.startTime, session.endTime) && (
                                                            <FontAwesomeIcon
                                                                icon={faClock}
                                                                style={{ marginLeft: '5px' }}
                                                            />
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {sessions.length > 10 && (
                                        <div className="more-items-hint">
                                            +{sessions.length - 10} weitere Lektionen
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="empty-message">Keine Lektionen vorhanden.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherDetail;