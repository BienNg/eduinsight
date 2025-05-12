// src/features/courses/CourseDetail/components/CourseStats.jsx
import React from 'react';
import StatsGrid from '../../../common/components/StatsGrid';
import TeacherBadge from '../../../common/TeacherBadge';
import {
  faUsers,
  faCalendarDay,
  faChalkboardTeacher,
  faLayerGroup,
  faStar,
  faCalendarAlt,
  faCalendarCheck,
  faChartLine
} from '@fortawesome/free-solid-svg-icons';

const CourseStats = ({ course, group, teachers, students, sessions, calculateAverageAttendance }) => {
  return (
    <StatsGrid
      columns={8}
      stats={[
        {
          icon: faUsers,
          value: students.length,
          label: 'Students',
          color: 'blue'
        },
        {
          icon: faCalendarDay,
          value: sessions.length,
          label: 'Sessions',
          color: 'green'
        },
        {
          icon: faChalkboardTeacher,
          renderValue: () => (
            <div className="stat-teacher-badges">
              {teachers.length > 0 ? (
                teachers.map((teacher) => (
                  <TeacherBadge key={teacher.id} teacher={teacher} />
                ))
              ) : (
                <span className="no-teachers">No teachers</span>
              )}
            </div>
          ),
          label: `Teacher${teachers.length !== 1 ? 's' : ''}`,
          color: 'purple'
        },
        {
          icon: faLayerGroup,
          value: group ? group.name : (course.group || '-'),
          label: 'Group',
          color: 'yellow'
        },
        {
          icon: faStar,
          value: course.level || '-',
          label: 'Level',
          color: 'orange'
        },
        {
          icon: faCalendarAlt,
          value: course.startDate || '-',
          label: 'Start Date',
          color: 'blue'
        },
        {
          icon: faCalendarCheck,
          value: course.endDate || '-',
          label: 'End Date',
          color: 'green'
        },
        {
          icon: faChartLine,
          value: calculateAverageAttendance(),
          label: 'Avg Attendance',
          color: 'purple'
        }
      ]}
    />
  );
};

export default CourseStats;