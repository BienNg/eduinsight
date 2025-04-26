// src/components/Dashboard/tabs/OverviewTab.jsx

import '../../styles/Content.css';

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { calculateTotalHours } from '../../utils/timeUtils';

const OverviewTab = ({ currentMonthId, monthDetails, sessions, courses, teachers }) => {
    const navigate = useNavigate();

    const handleCourseClick = (course) => {
        navigate(`/courses/${course.id}`);
    };

    const prepareLevelData = (courses) => {
        const levelCounts = {};
        courses.forEach(course => {
            const level = course.level || 'Unbekannt';
            levelCounts[level] = (levelCounts[level] || 0) + 1;
        });
        return Object.entries(levelCounts).map(([level, count]) => ({
            name: level,
            value: count
        }));
    };

    const prepareChartData = () => {
        const currentDate = new Date();
        const last4Months = Array.from({ length: 4 }, (_, i) => {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - (3 - i), 1);
            return {
                year: date.getFullYear(),
                month: date.getMonth() + 1
            };
        });
        const monthNames = [
            'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
            'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'
        ];
        return last4Months.map(({ year, month }) => {
            const monthId = `${year}-${month.toString().padStart(2, '0')}`;
            const details = monthDetails[monthId];
            return {
                month: monthNames[month - 1].substring(0, 3),
                courses: details ? details.courseCount : 0
            };
        });
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    if (!currentMonthId || !monthDetails[currentMonthId]) {
        return <div className="notion-empty">Keine Daten für den aktuellen Monat verfügbar.</div>;
    }

    const details = monthDetails[currentMonthId];
    const currentMonthSessions = sessions
        .filter(session => session.monthId === currentMonthId)
        .sort((a, b) => {
            if (!a.date || !b.date) return 0;
            const partsA = a.date.split('.');
            const partsB = b.date.split('.');
            if (partsA.length === 3 && partsB.length === 3) {
                const dateA = new Date(partsA[2], partsA[1] - 1, partsA[0]);
                const dateB = new Date(partsB[2], partsB[1] - 1, partsB[0]);
                return dateB - dateA;
            }
            return 0;
        });
    const currentMonthCourses = courses.filter(course =>
        currentMonthSessions.some(session => session.courseId === course.id)
    );
    const currentMonthTeachers = teachers.filter(teacher =>
        currentMonthSessions.some(session => session.teacherId === teacher.id)
    );
    const chartData = prepareChartData();

    return (
        <div className="overview-tab-content">
            <p className="overview-description">Alle wichtigen Daten auf einem Blick</p>
            <h1 className="overview-heading">Übersicht über diesen Monat</h1>
            <div className="three-column-overview-grid">
                <div className="overview-panel">
                    <div className="panel-header">
                        <h3 className="panel-title">Lektionen ({currentMonthSessions.length})</h3>
                    </div>
                    <div className="panel-content">
                        {currentMonthSessions.length > 0 ? (
                            <div className="compact-session-list">
                                {currentMonthSessions.slice(0, 10).map(session => {
                                    const course = courses.find(c => c.id === session.courseId) || {};
                                    const teacher = teachers.find(t => t.id === session.teacherId) || {};
                                    return (
                                        <div className="compact-session-item" key={session.id}>
                                            <div className="session-main-info">
                                                <div className="session-date">{session.date}</div>
                                                <div className="session-title">{session.title}</div>
                                            </div>
                                            <div className="session-meta">
                                                <span className="meta-course">{course.name || 'Unbekannter Kurs'}</span>
                                                <span className="meta-teacher">{teacher.name || 'Unbekannter Lehrer'}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                                {currentMonthSessions.length > 10 && (
                                    <div className="more-items-hint">
                                        +{currentMonthSessions.length - 10} weitere Lektionen
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="empty-message">Keine Lektionen in diesem Monat.</div>
                        )}
                    </div>
                </div>
                <div className="overview-column">
                    <div className="analytics-row">
                        <div className="analytics-card animate-card">
                            <h3>Kurse nach Niveau</h3>
                            <div style={{ width: '100%', height: '200px' }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={prepareLevelData(currentMonthCourses)}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={40}
                                            outerRadius={70}
                                            paddingAngle={5}
                                            dataKey="value"
                                            nameKey="name"
                                            label={false}
                                            labelLine={false}
                                            animationBegin={0}
                                            animationDuration={1500}
                                            animationEasing="ease-out"
                                        >
                                            {prepareLevelData(currentMonthCourses).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip animationDuration={200} animationEasing="ease-in-out" />
                                        <Legend
                                            wrapperStyle={{
                                                paddingTop: '20px',
                                                opacity: 1,
                                                transition: 'opacity 0.5s ease-in'
                                            }}
                                            layout="horizontal"
                                            align="center"
                                            verticalAlign="bottom"
                                            iconType="circle"
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="analytics-card animate-card">
                            <h3>Anzahl Kurse pro Monat</h3>
                            <div style={{ width: '100%', height: '200px' }}>
                                <ResponsiveContainer>
                                    <LineChart
                                        data={chartData}
                                        margin={{ top: 5, right: 20, bottom: 5, left: 20 }}
                                    >
                                        <XAxis
                                            dataKey="month"
                                            interval={0}
                                            tickMargin={5}
                                            height={40}
                                            tick={{ fill: '#666', fontSize: 12 }}
                                        />
                                        <YAxis hide={true} />
                                        <Tooltip animationDuration={200} animationEasing="ease-in-out" />
                                        <Line
                                            type="monotone"
                                            dataKey="courses"
                                            stroke="#8884d8"
                                            strokeWidth={2}
                                            dot={{ fill: '#8884d8', r: 4 }}
                                            activeDot={{ r: 6 }}
                                            animationBegin={600}
                                            animationDuration={1500}
                                            animationEasing="ease-out"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                    <div className="overview-panel">
                        <div className="panel-header">
                            <h3 className="panel-title">Kurse ({currentMonthCourses.length})</h3>
                        </div>
                        <div className="panel-content">
                            {currentMonthCourses.length > 0 ? (
                                <div className="group-progress-list">
                                    {(() => {
                                        // Group courses by group name
                                        const groups = {};
                                        currentMonthCourses.forEach(course => {
                                            const groupName = course.group || 'Ungrouped';
                                            if (!groups[groupName]) {
                                                groups[groupName] = [];
                                            }
                                            groups[groupName].push(course);
                                        });

                                        // Order of courses for progression
                                        const courseOrder = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2'];

                                        // Return group progress components
                                        return Object.entries(groups).map(([groupName, groupCourses]) => {
                                            // Sort courses by level following the specified order
                                            groupCourses.sort((a, b) => {
                                                return courseOrder.indexOf(a.level) - courseOrder.indexOf(b.level);
                                            });

                                            // Find the latest course with completed sessions
                                            let latestActiveIndex = -1;
                                            for (let i = 0; i < groupCourses.length; i++) {
                                                const course = groupCourses[i];
                                                const courseSessions = sessions.filter(s => s.courseId === course.id);
                                                const completedSessions = courseSessions.filter(s => s.status === 'completed');

                                                if (completedSessions.length > 0) {
                                                    latestActiveIndex = i;
                                                }
                                            }

                                            // Calculate progress for the current course
                                            let currentCourse = null;
                                            let currentProgress = 0;
                                            let isGroupComplete = false;

                                            if (latestActiveIndex >= 0) {
                                                // Current course is the one that has the most recent completed sessions
                                                currentCourse = groupCourses[latestActiveIndex];

                                                // Calculate progress for current course
                                                const courseSessions = sessions.filter(s => s.courseId === currentCourse.id);
                                                const completedSessions = courseSessions.filter(s => s.status === 'completed');
                                                const totalExpectedSessions = ['A1.1', 'A1.2'].includes(currentCourse.level) ? 18 : 20;

                                                currentProgress = (completedSessions.length / totalExpectedSessions) * 100;

                                                // Check if the group is complete (B1.2 is complete)
                                                if (currentCourse.level === 'B1.2' && completedSessions.length === totalExpectedSessions) {
                                                    isGroupComplete = true;
                                                }
                                            }

                                            // Calculate overall group progress
                                            let overallProgress = 0;

                                            // Calculate how many courses are complete before the current one
                                            const courseIndices = groupCourses.map(c => courseOrder.indexOf(c.level));
                                            const earlierCourseCount = latestActiveIndex; // Courses before current are complete

                                            if (earlierCourseCount > 0) {
                                                // Each earlier course contributes its portion to overall progress
                                                overallProgress += (earlierCourseCount / 6) * 100;
                                            }

                                            // Add current course contribution to overall progress
                                            if (currentCourse) {
                                                const courseWeight = 1 / 6; // Each course is 1/6 of total
                                                overallProgress += (currentProgress / 100) * courseWeight * 100;
                                            }

                                            // Cap at 100%
                                            overallProgress = Math.min(overallProgress, 100);

                                            return (
                                                <div className="group-progress-item" key={groupName}>
                                                    <div className="group-header">
                                                        <div className="group-name">{groupName}</div>
                                                        <div className="progress-percentage">
                                                            {isGroupComplete ? 'Complete' : `${Math.round(overallProgress)}%`}
                                                        </div>
                                                    </div>

                                                    <div className="progress-bar-container">
                                                        <div
                                                            className="progress-bar"
                                                            style={{ width: `${Math.max(0, overallProgress)}%` }}
                                                        ></div>
                                                    </div>

                                                    {currentCourse && !isGroupComplete && (
                                                        <div className="current-course">
                                                            <span className="course-level">{currentCourse.level}</span>
                                                            <span className="course-progress">{Math.round(currentProgress)}% complete</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            ) : (
                                <div className="empty-message">Keine Kurse in diesem Monat.</div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="overview-panel">
                    <div className="panel-header">
                        <h3 className="panel-title">Lehrer ({currentMonthTeachers.length})</h3>
                    </div>
                    <div className="panel-content">
                        {currentMonthTeachers.length > 0 ? (
                            <div className="compact-teacher-list">
                                {currentMonthTeachers.map(teacher => {
                                    const teacherSessions = currentMonthSessions.filter(s => s.teacherId === teacher.id);
                                    const teacherHours = calculateTotalHours(teacherSessions);
                                    return (
                                        <div className="compact-teacher-item" key={teacher.id}>
                                            <div className="teacher-name">{teacher.name}</div>
                                            <div className="teacher-meta">
                                                <span>{teacherSessions.length} Lektionen</span>
                                                <span>{teacherHours.toFixed(1)}h</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="empty-message">Keine Lehrer in diesem Monat.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OverviewTab;