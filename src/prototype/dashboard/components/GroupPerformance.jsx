// src/prototype/dashboard/components/GroupPerformance.jsx
import React from 'react';
import './components.css'; 

const GroupPerformance = ({ groups, courses, filters }) => {
    return (
        <div className="group-performance-card">
            <h3>Group Performance</h3>
            <div className="group-comparison">
                {groups.map(group => (
                    <div key={group.id} className="group-item">
                        <div className="group-header">
                            <div className="group-name">{group.name}</div>
                            <div className="group-courses">{group.courses} courses</div>
                        </div>
                        <div className="metrics-container">
                            <div className="metric">
                                <div className="metric-label">Attendance</div>
                                <div className="metric-bar">
                                    <div
                                        className="metric-fill"
                                        style={{
                                            width: `${group.avgAttendance}%`,
                                            backgroundColor: getAttendanceColor(group.avgAttendance)
                                        }}
                                    ></div>
                                </div>
                                <div className="metric-value">{group.avgAttendance}%</div>
                            </div>
                            <div className="metric">
                                <div className="metric-label">Progress</div>
                                <div className="metric-bar">
                                    <div
                                        className="metric-fill"
                                        style={{
                                            width: `${group.avgProgress}%`,
                                            backgroundColor: getProgressColor(group.avgProgress)
                                        }}
                                    ></div>
                                </div>
                                <div className="metric-value">{group.avgProgress}%</div>
                            </div>
                        </div>
                        <div className="group-students">
                            <div className="students-label">Students:</div>
                            <div className="students-count">{group.students}</div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="level-distribution">
                <h4>Course Level Distribution</h4>
                <div className="level-chart">
                    {['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2'].map(level => {
                        const count = courses.filter(c => c.level === level).length;
                        return (
                            <div key={level} className="level-bar-container">
                                <div className="level-label">{level}</div>
                                <div className="level-bar">
                                    <div
                                        className="level-fill"
                                        style={{
                                            height: `${(count / courses.length) * 100}%`,
                                            backgroundColor: getLevelColor(level)
                                        }}
                                    ></div>
                                </div>
                                <div className="level-count">{count}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// Helper functions for colors
const getAttendanceColor = (rate) => {
    if (rate >= 90) return '#4CAF50'; // Green
    if (rate >= 80) return '#FFC107'; // Yellow
    return '#F44336'; // Red
};

const getProgressColor = (progress) => {
    if (progress >= 80) return '#4CAF50'; // Green
    if (progress >= 40) return '#2196F3'; // Blue
    if (progress >= 20) return '#FFC107'; // Yellow
    return '#F44336'; // Red
};

// src/prototype/dashboard/components/GroupPerformance.jsx (continued)
const getLevelColor = (level) => {
    const colors = {
        'A1.1': '#0088FE',
        'A1.2': '#00C49F',
        'A2.1': '#FFBB28',
        'A2.2': '#FF8042',
        'B1.1': '#8884d8',
        'B1.2': '#82ca9d'
    };
    return colors[level] || '#ccc';
};

export default GroupPerformance;