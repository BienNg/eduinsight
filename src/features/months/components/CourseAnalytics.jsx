// src/features/months/components/CourseAnalytics.jsx
import React from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { prepareLevelData, prepareChartData, CHART_COLORS } from '../utils/monthUtils';

const CourseAnalytics = ({ courses, monthDetails, selectedTeacher, sessions, teacherMonthData }) => {
  // Filter courses if a teacher is selected
  const filteredCourses = selectedTeacher
    ? courses.filter(course =>
      sessions.some(session =>
        session.courseId === course.id &&
        session.teacherId === selectedTeacher.id
      )
    )
    : courses;

  // Create a set of course IDs that the selected teacher teaches
  const teacherCourseIds = selectedTeacher
    ? new Set(sessions
      .filter(session => session.teacherId === selectedTeacher.id)
      .map(session => session.courseId))
    : null;

  // Prepare chart data - filter by teacher if one is selected
  const chartData = prepareChartData(
    new Date(),
    monthDetails,
    teacherMonthData
  );


  const levelData = prepareLevelData(filteredCourses);

  // Custom tooltip formatter to show percentage
  const customTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const totalValue = levelData.reduce((sum, item) => sum + item.value, 0);
      const percentage = totalValue > 0 ? ((payload[0].value / totalValue) * 100).toFixed(1) : '0.0';

      return (
        <div className="custom-tooltip" style={{
          backgroundColor: '#fff',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}>
          <p><strong>{payload[0].name}</strong></p>
          <p>{`${payload[0].value} Kurse (${percentage}%)`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="analytics-row">
      <div className="analytics-card animate-card">
        <h3>
          {selectedTeacher
            ? `Kurse von ${selectedTeacher.name} nach Niveau`
            : 'Kurse nach Niveau'}
        </h3>
        <div style={{ width: '100%', height: '200px' }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={levelData}
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
                {levelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={customTooltip} animationDuration={200} animationEasing="ease-in-out" />
              <Legend
                wrapperStyle={{
                  paddingLeft: '10px',
                  opacity: 1,
                  transition: 'opacity 0.5s ease-in'
                }}
                layout="vertical"
                align="left"
                verticalAlign="middle"
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Line chart with filtered data */}
      <div className="analytics-card animate-card">
        <h3>
          {selectedTeacher
            ? `Anzahl Kurse pro Monat (${selectedTeacher.name})`
            : 'Anzahl Kurse pro Monat'}
        </h3>
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
  );
};

export default CourseAnalytics;