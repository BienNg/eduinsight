// src/features/courses/CourseDetail/components/CourseStats.jsx
import React from 'react';
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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import TeacherBadge from '../../../common/TeacherBadge';

// Define font size as a constant for easy modification
const STAT_FONT_SIZE = '1rem';

// Custom styles for the component
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '10px',
    flex: 1,
    minWidth: 0, // Allow cards to shrink below content size if needed
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    margin: '0 4px' // Add a small gap between cards
  },
  icon: {
    fontSize: '18px',
    marginBottom: '4px'
  },
  value: {
    fontSize: STAT_FONT_SIZE,
    fontWeight: '600',
    margin: '4px 0',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    width: '100%'
  },
  label: {
    fontSize: '0.7rem',
    color: '#666',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    width: '100%'
  }
};

// Color mapping for icons
const colorMap = {
  blue: '#0088FE',
  green: '#00C49F',
  purple: '#9370DB',
  yellow: '#FFBB28',
  orange: '#FF8042'
};

const CourseStats = ({ course, group, teachers, students, sessions, calculateAverageAttendance }) => {
  // Define the stats data
  const statsData = [
    {
      icon: faChalkboardTeacher,
      value: teachers.length > 0 
        ? teachers.map(teacher => teacher.name).join(', ') 
        : 'No teachers',
      label: `Teacher${teachers.length !== 1 ? 's' : ''}`,
      color: 'purple',
      isTeachers: true
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
  ];

  return (
    <div style={styles.container}>
      {statsData.map((stat, index) => (
        <div key={index} style={styles.statCard}>
          <FontAwesomeIcon 
            icon={stat.icon} 
            style={{...styles.icon, color: colorMap[stat.color]}} 
          />
          
          {stat.isTeachers && teachers.length > 0 ? (
            <div style={styles.value}>
              {teachers.map((teacher) => (
                <TeacherBadge key={teacher.id} teacher={teacher} />
              ))}
            </div>
          ) : (
            <div style={styles.value}>{stat.value}</div>
          )}
          
          <div style={styles.label}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
};

export default CourseStats;