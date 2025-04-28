// src/features/teachers/tabs/TeacherOverviewTab.jsx - Import section update
// JSX imports
import GroupBadge from '../../common/GroupBadge';
import { getAllRecords } from '../../firebase/database';

// Library imports
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserTie, faLayerGroup, faCalendarDay, faUserGraduate, faChalkboardTeacher } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';

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
  const [monthlySessions, setMonthlySessions] = useState([]);
  const [groupsData, setGroupsData] = useState([]);

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
      const [teachersData, sessionsData, coursesData, studentsData, groupsData] = await Promise.all([
        getAllRecords('teachers'),
        getAllRecords('sessions'),
        getAllRecords('courses'),
        getAllRecords('students'),
        getAllRecords('groups')
      ]);

      // Get the last 12 months data for line chart
      const last12Months = getLastTwelveMonths();
      const monthlySessionCounts = calculateMonthlySessionCounts(sessionsData, last12Months);

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
      setMonthlySessions(monthlySessionCounts);
      setGroupsData(groupsData);


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

  const getLastTwelveMonths = () => {
    const months = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
      // Just use the month name without the year
      const label = monthNames[month.getMonth()];
      months.push({ monthKey, label });
    }

    return months;
  };

  // Helper function to calculate session counts per month
  const calculateMonthlySessionCounts = (sessionsData, months) => {
    return months.map(({ monthKey, label }) => {
      const count = sessionsData.filter(session =>
        session.monthId && session.monthId.startsWith(monthKey)
      ).length;

      return {
        month: label,
        sessions: count
      };
    });
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
                      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                      barSize={12} // Thin bars
                      barGap={2} // Reduced gap between bars (default is 4)
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
          </div>

          {/* Third Row: Teacher List */}
          <div className="overview-panel animate-card">
            <div className="panel-header">
              <h2 className="panel-title">Active Teachers Last Month</h2>
            </div>
            <div className="panel-content">
              {teachers.length > 0 ? (
                <div className="compact-teacher-list">
                  {teachers.map((teacher, index) => {
                    // Get courses this teacher teaches that are active
                    const teacherActiveCourses = coursesData.filter(course =>
                      course.teacherIds &&
                      course.teacherIds.includes(teacher.id) &&
                      activeCoursesIds.has(course.id)
                    );

                    // Get unique group IDs
                    const teacherGroupIds = new Set(
                      teacherActiveCourses.map(course => course.groupId)
                    );

                    // Get group objects
                    const teacherGroups = Array.from(teacherGroupIds)
                      .map(groupId => {
                        // Find the actual group from the groups collection
                        const group = groupsData.find(g => g.id === groupId);

                        // If we found the group, use its data
                        if (group) {
                          return {
                            id: groupId,
                            name: group.name || 'Unknown Group',
                            color: group.color || '#e0e0e0'
                          };
                        }

                        // Fallback to using course data if group not found
                        const representativeCourse = teacherActiveCourses.find(
                          course => course.groupId === groupId
                        );

                        if (representativeCourse) {
                          return {
                            id: groupId,
                            name: `Group ${groupId.substring(0, 5)}...` || 'Unknown Group',
                            color: representativeCourse.color || '#e0e0e0'
                          };
                        }

                        return null;
                      })
                      .filter(Boolean);

                    return (
                      <div
                        className="compact-teacher-item"
                        key={teacher.id}
                        style={{ animationDelay: `${0.1 * index}s` }}
                      >
                        <div className="teacher-profile">
                          <FontAwesomeIcon icon={faUserTie} className="teacher-icon" />
                          <div className="teacher-info">
                            <div className="teacher-name"><strong>{teacher.name}</strong></div>
                            <div className="teacher-subtitle">{teacherGroups.length} groups last month</div>
                          </div>
                        </div>
                        <div className="teacher-meta">
                          <span>{teacher.country || 'No Location'}</span>
                          <span>{teacher.sessionCount} sessions</span>
                        </div>
                        <div className="teacher-group-badges">
                          {teacherGroups.map(group => (
                            <GroupBadge key={group.id} group={group} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
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