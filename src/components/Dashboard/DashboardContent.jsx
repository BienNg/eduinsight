// src/components/Dashboard/DashboardContent.jsx
import { useState, useEffect } from 'react';
import { getAllRecords } from '../../firebase/database';
import './Content.css';

const DashboardContent = () => {
  const [stats, setStats] = useState({
    activeClasses: 0,
    totalStudents: 0,
    averageAttendance: 0,
    isLoading: true
  });

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        // Fetch all required data
        const courses = await getAllRecords('courses');
        const students = await getAllRecords('students');
        const sessions = await getAllRecords('sessions');
        
        // Calculate active classes (ongoing courses)
        const activeClasses = courses.filter(course => course.status === 'ongoing').length;
        
        // Total unique students
        const totalStudents = students.length;
        
        // Calculate average attendance rate
        let attendanceRate = 0;
        
        if (sessions.length > 0) {
          let totalAttendances = 0;
          let totalPossibleAttendances = 0;
          
          sessions.forEach(session => {
            if (session.attendance) {
              const attendanceEntries = Object.values(session.attendance);
              const presentCount = attendanceEntries.filter(entry => 
                entry.status === 'present').length;
              
              totalAttendances += presentCount;
              totalPossibleAttendances += attendanceEntries.length;
            }
          });
          
          attendanceRate = totalPossibleAttendances > 0 
            ? Math.round((totalAttendances / totalPossibleAttendances) * 100) 
            : 0;
        }
        
        setStats({
          activeClasses,
          totalStudents,
          averageAttendance: attendanceRate,
          isLoading: false
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchDashboardStats();
  }, []);

  return (
    <div className="dashboard-content">
      <h2>Lehrer Dashboard</h2>
      {stats.isLoading ? (
        <div className="loading-indicator">
          <p>Lade Dashboard-Daten...</p>
        </div>
      ) : (
        <div className="stats-container">
          <div className="stat-card">
            <h3>Aktive Klassen</h3>
            <div className="stat-value">{stats.activeClasses}</div>
          </div>
          <div className="stat-card">
            <h3>Schüler insgesamt</h3>
            <div className="stat-value">{stats.totalStudents}</div>
          </div>
          <div className="stat-card">
            <h3>Durchschnittliche Anwesenheit</h3>
            <div className="stat-value">{stats.averageAttendance}%</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardContent;