// src/features/teachers/tabs/TeacherOverviewTab.jsx
// JSX imports
import GroupBadge from '../../common/GroupBadge';
import { getAllRecords } from '../../firebase/database';
import StatsGrid from '../../common/components/StatsGrid';

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
import { useNavigate } from 'react-router-dom';

const TeacherOverview = () => {
  const [stats, setStats] = useState({
    activeTeachersLastMonth: 0,
    activeTeachersThisMonth: 0,
    activeGroupsLastMonth: 0,
    activeGroupsThisMonth: 0,
    totalSessionsLastMonth: 0,
    totalSessionsThisMonth: 0,
    enrolledStudents: 0,
    avgSessionsPerTeacher: 0
  });

  const [teachersLastMonth, setTeachersLastMonth] = useState([]);
  const [teachersThisMonth, setTeachersThisMonth] = useState([]);
  const [monthlyView, setMonthlyView] = useState('last');
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coursesData, setCoursesData] = useState([]);
  const [activeCoursesIds, setActiveCoursesIds] = useState(new Set());
  const [monthlySessions, setMonthlySessions] = useState([]);
  const [groupsData, setGroupsData] = useState([]);
  const navigate = useNavigate();


  useEffect(() => {
    fetchOverviewData();
  }, []);

  const handleTeacherClick = (teacherId) => {
    navigate(`/teachers/${teacherId}`);
  };
  const processMonthData = (sessions, teachersData, coursesData, groupsData) => {
    // Calculate active teachers
    const activeTeacherIds = new Set(sessions.map(session => session.teacherId));

    // Calculate active courses and groups
    const activeCoursesIds = new Set(sessions.map(session => session.courseId));
    const activeCourses = coursesData.filter(course => activeCoursesIds.has(course.id));
    const activeGroupIds = new Set(activeCourses.map(course => course.groupId));

    // Get active teachers with their session counts
    const teachersWithSessionCounts = teachersData
      .filter(teacher => activeTeacherIds.has(teacher.id))
      .map(teacher => {
        const sessionCount = sessions.filter(
          session => session.teacherId === teacher.id
        ).length;
        return {
          ...teacher,
          sessionCount
        };
      })
      .sort((a, b) => b.sessionCount - a.sessionCount);

    return {
      activeTeacherIds,
      activeCoursesIds,
      activeGroupIds,
      activeCourses,
      teachersWithSessionCounts
    };
  };
  const fetchOverviewData = async () => {
    try {
      setLoading(true);

      // Get current date info
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const thisMonthStr = `${thisMonth.getFullYear()}-${String(thisMonth.getMonth() + 1).padStart(2, '0')}`;
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

      // Filter sessions for both months
      const lastMonthSessions = sessionsData.filter(session =>
        session.monthId && session.monthId.startsWith(lastMonthStr)
      );
      const thisMonthSessions = sessionsData.filter(session =>
        session.monthId && session.monthId.startsWith(thisMonthStr)
      );

      // Process last month data
      const lastMonthData = processMonthData(lastMonthSessions, teachersData, coursesData, groupsData);

      // Process this month data
      const thisMonthData = processMonthData(thisMonthSessions, teachersData, coursesData, groupsData);

      setCoursesData(coursesData);
      setActiveCoursesIds(new Set([...lastMonthData.activeCoursesIds, ...thisMonthData.activeCoursesIds]));
      setTeachersLastMonth(lastMonthData.teachersWithSessionCounts);
      setTeachersThisMonth(thisMonthData.teachersWithSessionCounts);
      setMonthlySessions(monthlySessionCounts);
      setGroupsData(groupsData);

      // Calculate enrolled students across both months
      const enrolledStudentIds = new Set();
      [...lastMonthData.activeCourses, ...thisMonthData.activeCourses].forEach(course => {
        if (course.studentIds && Array.isArray(course.studentIds)) {
          course.studentIds.forEach(id => enrolledStudentIds.add(id));
        }
      });

      setStats({
        activeTeachersLastMonth: lastMonthData.activeTeacherIds.size,
        activeTeachersThisMonth: thisMonthData.activeTeacherIds.size,
        activeGroupsLastMonth: lastMonthData.activeGroupIds.size,
        activeGroupsThisMonth: thisMonthData.activeGroupIds.size,
        totalSessionsLastMonth: lastMonthSessions.length,
        totalSessionsThisMonth: thisMonthSessions.length,
        enrolledStudents: enrolledStudentIds.size,
        avgSessionsPerTeacher: lastMonthData.activeTeacherIds.size ?
          Math.round((lastMonthSessions.length / lastMonthData.activeTeacherIds.size) * 10) / 10 : 0
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

  // Create the stats data for the StatsGrid component
  const statsData = [
    {
      icon: faUserTie,
      value: stats.activeTeachersLastMonth,
      secondValue: stats.activeTeachersThisMonth,
      label: "Active Teachers",
      subLabel: "Last Month / This Month",
      color: "blue"
    },
    {
      icon: faLayerGroup,
      value: stats.activeGroupsLastMonth,
      secondValue: stats.activeGroupsThisMonth,
      label: "Active Groups",
      subLabel: "Last Month / This Month",
      color: "green"
    },
    {
      icon: faCalendarDay,
      value: stats.totalSessionsLastMonth,
      secondValue: stats.totalSessionsThisMonth,
      label: "Total Sessions",
      subLabel: "Last Month / This Month",
      color: "yellow"
    },
    {
      icon: faChalkboardTeacher,
      value: stats.avgSessionsPerTeacher,
      label: "Avg Sessions/Teacher",
      subLabel: "Last Month",
      color: "purple"
    },
    {
      icon: faUserGraduate,
      value: stats.enrolledStudents,
      label: "Enrolled Students",
      subLabel: "Both Months",
      color: "orange"
    }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="teacher-overview-content">
      {loading && <div className="loading-indicator">Loading overview data...</div>}

      {error && <div className="error-message">{error}</div>}

      {!loading && !error && (
        <>
          {/* First Row: Stat Cards - Using the new StatsGrid component */}
          <StatsGrid stats={statsData} columns={5} />

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
              <h2 className="panel-title">
                Active Teachers {monthlyView === 'last' ? 'Last' : 'This'} Month
              </h2>
              <div className="month-toggle">
                <button
                  className={`toggle-btn ${monthlyView === 'last' ? 'active' : ''}`}
                  onClick={() => setMonthlyView('last')}
                >
                  Last Month
                </button>
                <button
                  className={`toggle-btn ${monthlyView === 'current' ? 'active' : ''}`}
                  onClick={() => setMonthlyView('current')}
                >
                  This Month
                </button>
              </div>
            </div>
            <div className="panel-content">
              {(monthlyView === 'last' ? teachersLastMonth : teachersThisMonth).length > 0 ? (
                <div className="compact-teacher-list">
                  {(monthlyView === 'last' ? teachersLastMonth : teachersThisMonth).map((teacher, index) => {
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
                        onClick={() => handleTeacherClick(teacher.id)}
                        role="button"
                        tabIndex={0}
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
                          {teacherGroups
                            .sort((a, b) => b.name.localeCompare(a.name)) // Sort group names in descending order
                            .map(group => (
                              <GroupBadge key={group.id} group={group} />
                            ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-message">No active teachers {monthlyView === 'last' ? 'last' : 'this'} month</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TeacherOverview;