// src/features/teachers/tabs/TeacherOverview.jsx
import { useState, useEffect } from 'react';
import { getAllRecords } from '../../firebase/database';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserTie, faLayerGroup, faCalendarDay, faUserGraduate, faChalkboardTeacher } from '@fortawesome/free-solid-svg-icons';

const TeacherOverview = () => {
  const [stats, setStats] = useState({
    activeTeachers: 0,
    activeGroups: 0,
    totalSessions: 0,
    enrolledStudents: 0,
    avgSessionsPerTeacher: 0
  });
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coursesData, setCoursesData] = useState([]);
  const [activeCoursesIds, setActiveCoursesIds] = useState(new Set());

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);

      // Get current date for calculating "last month"
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

      // Fetch all necessary data
      const [teachersData, sessionsData, coursesData, studentsData] = await Promise.all([
        getAllRecords('teachers'),
        getAllRecords('sessions'),
        getAllRecords('courses'),
        getAllRecords('students')
      ]);

      // Filter sessions from last month
      const lastMonthSessions = sessionsData.filter(session =>
        session.monthId && session.monthId.startsWith(lastMonthStr)
      );

      // Calculate active teachers (teachers who had sessions last month)
      const activeTeacherIds = new Set(lastMonthSessions.map(session => session.teacherId));

      // Calculate active groups (courses that had sessions last month)
      const activeCoursesIds = new Set(lastMonthSessions.map(session => session.courseId));
      const activeCourses = coursesData.filter(course => activeCoursesIds.has(course.id));
      const activeGroupIds = new Set(activeCourses.map(course => course.groupId));

      // Calculate enrolled students
      const enrolledStudentIds = new Set();
      activeCourses.forEach(course => {
        if (course.studentIds && Array.isArray(course.studentIds)) {
          course.studentIds.forEach(id => enrolledStudentIds.add(id));
        }
      });

      // Get active teachers with their session counts
      const teachersWithSessionCounts = teachersData
        .filter(teacher => activeTeacherIds.has(teacher.id))
        .map(teacher => {
          const sessionCount = lastMonthSessions.filter(
            session => session.teacherId === teacher.id
          ).length;
          return {
            ...teacher,
            sessionCount
          };
        })
        .sort((a, b) => b.sessionCount - a.sessionCount);

      setCoursesData(coursesData);
      setActiveCoursesIds(activeCoursesIds);
      setTeachers(teachersWithSessionCounts);
      
      setStats({
        activeTeachers: activeTeacherIds.size,
        activeGroups: activeGroupIds.size,
        totalSessions: lastMonthSessions.length,
        enrolledStudents: enrolledStudentIds.size,
        avgSessionsPerTeacher: activeTeacherIds.size ?
          Math.round((lastMonthSessions.length / activeTeacherIds.size) * 10) / 10 : 0
      });
    } catch (err) {
      console.error("Error fetching overview data:", err);
      setError("Failed to load teacher overview data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="teacher-overview-content">
      {loading && <div className="loading-indicator">Loading overview data...</div>}

      {error && <div className="error-message">{error}</div>}

      {!loading && !error && (
        <>
          {/* First Row: Stat Cards */}
          <div className="compact-stats-grid animate-card">
            <div className="stat-card compact">
              <FontAwesomeIcon icon={faUserTie} size="lg" color="#0088FE" />
              <div className="stat-value">{stats.activeTeachers}</div>
              <div className="stat-label">Active Teachers</div>
            </div>

            <div className="stat-card compact">
              <FontAwesomeIcon icon={faLayerGroup} size="lg" color="#00C49F" />
              <div className="stat-value">{stats.activeGroups}</div>
              <div className="stat-label">Active Groups</div>
            </div>

            <div className="stat-card compact">
              <FontAwesomeIcon icon={faCalendarDay} size="lg" color="#FFBB28" />
              <div className="stat-value">{stats.totalSessions}</div>
              <div className="stat-label">Total Sessions</div>
            </div>
            <div className="stat-card compact">
              <FontAwesomeIcon icon={faChalkboardTeacher} size="lg" color="#8884d8" />
              <div className="stat-value">{stats.avgSessionsPerTeacher}</div>
              <div className="stat-label">Avg Sessions/Teacher</div>
            </div>
            <div className="stat-card compact">
              <FontAwesomeIcon icon={faUserGraduate} size="lg" color="#FF8042" />
              <div className="stat-value">{stats.enrolledStudents}</div>
              <div className="stat-label">Enrolled Students</div>
            </div>
          </div>

          {/* Second Row: Two cards (2/3 and 1/3 split) */}
          <div className="three-column-overview-grid animate-card">
            <div className="overview-panel" style={{ gridColumn: "span 2" }}>
              <div className="panel-header">
                <h2 className="panel-title">Teacher Performance</h2>
              </div>
              <div className="panel-content">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={teachers.slice(0, 7)} // Top 7 teachers
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sessionCount" fill="#8884d8">
                      {teachers.slice(0, 7).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="overview-panel">
              <div className="panel-header">
                <h2 className="panel-title">Groups Per Teacher</h2>
              </div>
              <div className="panel-content">
                {teachers.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={teachers.slice(0, 5).map(teacher => {
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
                      })}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="groups" fill="#00C49F">
                        {teachers.slice(0, 5).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-message">No teacher data available</div>
                )}
              </div>
            </div>
          </div>

          {/* Third Row: Teacher List */}
          <div className="overview-panel animate-card">
            <div className="panel-header">
              <h2 className="panel-title">Active Teachers Last Month</h2>
            </div>
            <div className="panel-content">
              {teachers.length > 0 ? (
                <div className="compact-teacher-list">
                  {teachers.map((teacher, index) => (
                    <div
                      className="compact-teacher-item"
                      key={teacher.id}
                      style={{ animationDelay: `${0.1 * index}s` }}
                    >
                      <div className="teacher-name">{teacher.name}</div>
                      <div className="teacher-meta">
                        <span>{teacher.country || 'Unknown'}</span>
                        <span>{teacher.sessionCount} sessions</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-message">No active teachers last month</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TeacherOverview;