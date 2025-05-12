// src/features/teachers/components/TeacherGroupsChart.jsx
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const TeacherGroupsChart = ({ teachers, coursesData, activeCoursesIds }) => {
  // Prepare data for the chart
  const chartData = teachers.slice(0, 5).map(teacher => {
    // Calculate unique groups this teacher teaches
    const teacherGroups = new Set(
      coursesData
        .filter(course =>
          course.teacherIds &&
          course.teacherIds.includes(teacher.id) &&
          activeCoursesIds.has(course.id)
        )
        .map(course => course.groupId)
    );

    return {
      name: teacher.name,
      groups: teacherGroups.size
    };
  });

  return (
    <div className="overview-panel">
      <div className="panel-header">
        <h2 className="panel-title">Groups Per Teacher</h2>
      </div>
      <div className="panel-content">
        {teachers.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              barSize={12} // Thin bars
              barGap={2} // Reduced gap between bars
            >
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }} // Smaller font for names
              />
              <Tooltip cursor={{ fill: 'transparent' }} />
              <Bar
                dataKey="groups"
                fill="#0088FE"
                radius={[6, 6, 6, 6]}
                activeBar={{ fill: "#0088FE" }}
                animationBegin={300}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-message">No teacher data available</div>
        )}
      </div>
    </div>
  );
};

export default TeacherGroupsChart;