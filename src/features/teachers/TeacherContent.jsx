// src/features/dashboard/LehrerContent.jsx
import '../styles/Content.css';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  getAllRecords 
} from '../firebase/database';

// Component Imports
import StatsGrid from '../common/components/StatsGrid';
import GroupBadge from '../common/GroupBadge';
import MonthlySessionsChart from './components/MonthlySessionsChart';
import TeacherGroupsChart from './components/TeacherGroupsChart';
import ActiveTeachersList from './components/ActiveTeachersList';

// Icon Imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserTie, 
  faLayerGroup, 
  faCalendarDay, 
  faUserGraduate, 
  faChalkboardTeacher 
} from '@fortawesome/free-solid-svg-icons';

const LehrerContent = () => {
  const navigate = useNavigate();
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

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const handleTeacherClick = (teacherId) => {
    navigate(`/teachers/${teacherId}`);
  };

  // Helper functions
  const getLastTwelveMonths = () => {
    const months = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
      const label = monthNames[month.getMonth()];
      months.push({ monthKey, label });
    }

    return months;
  };

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
      setTeachers(teachersData);

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

  return (
    <div className="lehrer-content">
      {loading && <div className="loading-indicator">Loading overview data...</div>}

      {error && <div className="error-message">{error}</div>}

      {!loading && !error && (
        <>
          {/* Stats Cards */}
          <StatsGrid stats={statsData} columns={5} />

          {/* Charts Section */}
          <div className="three-column-overview-grid animate-card">
            {/* Monthly Sessions Chart */}
            <MonthlySessionsChart monthlySessions={monthlySessions} />

            {/* Groups Per Teacher Chart */}
            <TeacherGroupsChart 
              teachers={teachers} 
              coursesData={coursesData} 
              activeCoursesIds={activeCoursesIds} 
            />
          </div>

          {/* Active Teachers List */}
          <ActiveTeachersList
            teachersLastMonth={teachersLastMonth}
            teachersThisMonth={teachersThisMonth}
            monthlyView={monthlyView}
            setMonthlyView={setMonthlyView}
            handleTeacherClick={handleTeacherClick}
            coursesData={coursesData}
            activeCoursesIds={activeCoursesIds}
            groupsData={groupsData}
          />
        </>
      )}
    </div>
  );
};

export default LehrerContent;