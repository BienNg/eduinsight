// src/features/dashboard/tabs/OverviewTab.jsx
import ProgressBar from '../../common/ProgressBar';

import '../../styles/cards/Cards.css';
import '../../styles/Content.css';

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { calculateTotalHours } from '../../utils/timeUtils';

const OverviewTab = ({ currentMonthId, monthDetails, sessions, courses, teachers, groups }) => {
    const navigate = useNavigate();

    const handleCourseClick = (course) => {
        navigate(`/courses/${course.id}`);
    };

    const getMonthName = (monthId) => {
        const [year, month] = monthId.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        const monthNames = [
            'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
            'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
        ];
        return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    };

    // Helper function to get group name by groupId
    const getGroupName = (groupId) => {
        const group = groups.find(g => g.id === groupId);
        return group ? group.name : 'Ungrouped';
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

    // Group courses by groupId and create mapping
    const courseGroups = {};
    currentMonthCourses.forEach(course => {
        const groupName = getGroupName(course.groupId);
        if (!courseGroups[groupName]) {
            courseGroups[groupName] = [];
        }
        courseGroups[groupName].push(course);
    });

    return (
        <div className="overview-tab-content">
            <div className="three-column-overview-grid">
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
                                        // Order of courses for progression
                                        const courseOrder = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2'];

                                        // Return group progress components
                                        return Object.entries(courseGroups)
                                            .map(([groupName, groupCourses]) => {
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

                                                // Calculate progress based on your updated logic
                                                let currentCourse = null;
                                                let currentProgress = 0;
                                                let isGroupComplete = false;
                                                let overallProgress = 0;

                                                // Define the course structure with expected sessions
                                                const courseLevels = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2'];
                                                const sessionsPerLevel = {
                                                    'A1.1': 18,
                                                    'A1.2': 18,
                                                    'A2.1': 20,
                                                    'A2.2': 20,
                                                    'B1.1': 20,
                                                    'B1.2': 20
                                                };

                                                // Calculate total expected sessions across all levels
                                                const totalExpectedSessions = Object.values(sessionsPerLevel).reduce((sum, sessions) => sum + sessions, 0);

                                                if (latestActiveIndex >= 0) {
                                                    // Current course is the one that has the most recent completed sessions
                                                    currentCourse = groupCourses[latestActiveIndex];

                                                    // Get the latest level this group has
                                                    const latestLevel = currentCourse ? currentCourse.level : null;
                                                    const latestLevelIndex = latestLevel ? courseLevels.indexOf(latestLevel) : -1;

                                                    if (latestLevelIndex >= 0) {
                                                        // Calculate completed sessions for the current level
                                                        const currentLevelSessions = sessions.filter(s => s.courseId === currentCourse.id);
                                                        const completedCurrentSessions = currentLevelSessions.filter(s => s.status === 'completed').length;

                                                        // Calculate current level progress
                                                        const currentLevelExpectedSessions = sessionsPerLevel[latestLevel];
                                                        currentProgress = (completedCurrentSessions / currentLevelExpectedSessions) * 100;

                                                        // Calculate sessions for completed previous levels
                                                        let completedPreviousSessions = 0;
                                                        for (let i = 0; i < latestLevelIndex; i++) {
                                                            completedPreviousSessions += sessionsPerLevel[courseLevels[i]];
                                                        }

                                                        // Total completed sessions (previous levels + current level progress)
                                                        const totalCompletedSessions = completedPreviousSessions + completedCurrentSessions;

                                                        // Calculate overall progress
                                                        overallProgress = (totalCompletedSessions / totalExpectedSessions) * 100;

                                                        // Check if the group is complete (B1.2 is complete)
                                                        if (latestLevel === 'B1.2' && completedCurrentSessions === currentLevelExpectedSessions) {
                                                            isGroupComplete = true;
                                                        }
                                                    }
                                                }

                                                // Cap at 100%
                                                overallProgress = Math.min(overallProgress, 100);

                                                return {
                                                    groupName,
                                                    currentCourse,
                                                    currentProgress,
                                                    isGroupComplete,
                                                    overallProgress,
                                                    jsx: (
                                                        <div className="progress-card" key={groupName}>
                                                            <div className="progress-card-header">
                                                                <div className="progress-title">{groupName}</div>
                                                                <div className="progress-stats">
                                                                    <span>{Math.round(overallProgress)}%</span>
                                                                    {currentCourse && !isGroupComplete && (
                                                                        <>
                                                                            <span className="progress-divider"></span>
                                                                            <span className="current-level">{currentCourse.level}</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <ProgressBar
                                                                progress={Math.max(0, overallProgress)}
                                                                color="#4285f4"
                                                                showLabel={false}
                                                                height="10px"
                                                            />

                                                            {currentCourse && !isGroupComplete && (
                                                                <div className="current-course-info">
                                                                    <span>Current course progress:</span>
                                                                    <span>{Math.round(currentProgress)}%</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                };
                                            })
                                            // Sort groups by overall progress in descending order
                                            .sort((a, b) => b.overallProgress - a.overallProgress)
                                            // Return the JSX for each group
                                            .map(group => group.jsx);
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
            </div>
        </div>
    );
};

export default OverviewTab;