import React from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { prepareLevelData, prepareChartData, CHART_COLORS } from '../utils/monthUtils';

const CourseAnalytics = ({ courses, monthDetails }) => {
  const chartData = prepareChartData(new Date(), monthDetails);
  const levelData = prepareLevelData(courses);

  return (
    <div className="analytics-row">
      <div className="analytics-card animate-card">
        <h3>Kurse nach Niveau</h3>
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
  );
};

export default CourseAnalytics;