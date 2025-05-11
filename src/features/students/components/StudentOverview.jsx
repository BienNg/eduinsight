// src/features/students/components/StudentOverview.jsx
import React from 'react';
import StatsGrid from '../../common/components/StatsGrid';
import { faUser, faCheckCircle, faBookOpen, faCalendarAlt, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import styles from '../../styles/modules/StatsGrid.module.css';
import { safelyRenderValue, calculateAttendanceStats } from '../utils/studentDataUtils';

const StudentOverview = ({ student, sessions }) => {
  const stats = calculateAttendanceStats(sessions, student.id);

  return (
    <div className="session-info-section">
      <h3>Schülerinformation</h3>
      <StatsGrid
        stats={[
          {
            label: 'Name',
            renderValue: () => (
              <div className={styles.statValue} style={{ fontSize: '28px' }}>
                {safelyRenderValue(student.name)}
              </div>
            ),
            color: 'blue',
            icon: faUser
          },
          {
            label: 'Anwesenheitsquote',
            value: `${stats.rate}%`,
            color: 'orange',
            icon: faCheckCircle
          },
          {
            label: 'Anzahl Kurse',
            value: student.courseIds ? student.courseIds.length : 0,
            color: 'purple',
            icon: faBookOpen
          },
          {
            label: 'Gesamte Lektionen',
            value: stats.total,
            color: 'yellow',
            icon: faCalendarAlt
          },
          {
            label: 'Abwesend',
            value: stats.absent,
            color: 'orange',
            icon: faTimesCircle
          }
        ]}
        columns={5}
      />
    </div>
  );
};

export default StudentOverview;