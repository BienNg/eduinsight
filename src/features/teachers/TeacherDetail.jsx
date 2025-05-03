// src/features/teachers/TeacherDetail.jsx
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTeacherData } from './hooks/useTeacherData';
import TeacherHeader from './components/TeacherHeader';
import TeacherCourseTab from './components/TeacherCourseTab';
import MonthlyHoursChart from './components/MonthlyHoursChart';
import TeacherInfoCard from './components/TeacherInfoCard';
import RecentSessionsList from './components/RecentSessionsList';
import SessionsTooltip from './components/SessionsTooltip';

// CSS imports
import '../styles/Content.css';
import '../styles/cards/Cards.css';
import '../styles/TeacherDetail.css';

const TeacherDetail = () => {
    const [forceRefresh, setForceRefresh] = useState(0);
    const { id } = useParams();
    const {
        teacher,
        courses,
        sessions,
        loading,
        error,
        groupsData,
        currentMonthData,
        previousMonthData,
        monthNow,
        prevMonthName,
        courseCompletionMap,
        uniqueGroupIds,
        chartData,
        sessionsTotalHours,
        updateTeacherData
    } = useTeacherData(id);

    // State for hovering tooltip
    const [hoverTooltip, setHoverTooltip] = useState({
        visible: false,
        courseId: null,
        position: { x: 0, y: 0 },
        sessions: []
    });

    // Handler for course hover
    const handleCourseHover = (e, courseId, monthData) => {
        const courseData = monthData.find(data => data.course.id === courseId);

        if (courseData) {
            const completedSessions = courseData.sessions.filter(session =>
                session.status === 'completed'
            );

            setHoverTooltip({
                visible: true,
                courseId,
                position: {
                    x: e.currentTarget.getBoundingClientRect().right + 10,
                    y: e.currentTarget.getBoundingClientRect().top
                },
                sessions: completedSessions
            });
        }
    };

    // Handler for course leave
    const handleCourseLeave = () => {
        setHoverTooltip(prev => ({ ...prev, visible: false }));
    };

    if (loading) return <div className="loading-indicator">Loading teacher details...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!teacher) return <div className="error-message">Teacher not found</div>;

    return (
        <div className="teacher-detail-page">
            {/* Teacher Header */}
            <TeacherHeader
                teacher={teacher}
                courses={courses}
                sessions={sessions}
            />

            {/* Three Column Layout */}
            <div className="three-column-overview-grid">
                {/* First Column: Course Tabs */}
                <TeacherCourseTab
                    currentMonthData={currentMonthData}
                    previousMonthData={previousMonthData}
                    courses={courses}
                    groupsData={groupsData}
                    courseCompletionMap={courseCompletionMap}
                    monthNow={monthNow}
                    prevMonthName={prevMonthName}
                    onCourseHover={handleCourseHover}
                    onCourseLeave={handleCourseLeave}
                />

                {/* Second Column: Monthly Hours Chart */}
                <MonthlyHoursChart chartData={chartData} />

                {/* Third Column: Teacher Info and Recent Sessions */}
                <div className="overview-column">
                    {/* Teacher Info Card */}
                    <TeacherInfoCard
                        teacher={teacher}
                        courses={courses}
                        uniqueGroupIds={uniqueGroupIds}
                        sessionsTotalHours={sessionsTotalHours}
                        sessionsLength={sessions.length}
                        updateTeacherData={updateTeacherData}
                    />

                    {/* Recent Sessions List */}
                    <RecentSessionsList
                        sessions={sessions}
                        courses={courses}
                    />
                </div>
            </div>

            {/* Sessions Tooltip */}
            <SessionsTooltip hoverTooltip={hoverTooltip} />
        </div>
    );
};

export default TeacherDetail;