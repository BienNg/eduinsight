// src/features/teachers/components/MonthlySessionsChart.jsx
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

const MonthlySessionsChart = ({ monthlySessions }) => {
  return (
    <div className="overview-panel" style={{ gridColumn: "span 2", overflow: "hidden" }}>
      <div className="panel-header">
        <h2 className="panel-title">Monthly Sessions</h2>
      </div>
      <div className="panel-content" style={{ overflow: "hidden" }}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={monthlySessions}
            margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              tickMargin={10}
              axisLine={{ stroke: '#E0E0E0' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value) => [`${value} sessions`, 'Sessions']}
              labelStyle={{ fontSize: 14 }}
              contentStyle={{
                borderRadius: '4px',
                padding: '8px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
              }}
            />
            <Line
              type="monotone"
              dataKey="sessions"
              stroke="#0088FE"
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#0088FE' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MonthlySessionsChart;