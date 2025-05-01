// src/features/courses/CourseContent.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAllRecords, getRecordById } from '../firebase/database';
import { sortLanguageLevels } from '../utils/levelSorting';

// Importing components
import SearchBar from '../common/SearchBar';
import GroupsList from './components/GroupsList';
import GroupDetail from './components/GroupDetail';
import CourseDetailPanel from './components/CourseDetailPanel'; // We'll create this

// Importing styles
import '../styles/Content.css';
import '../styles/CourseContent.css';

const CourseContent = () => {
  const navigate = useNavigate();
  const { groupName, courseId } = useParams(); // Add courseId parameter
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedCourseStudents, setSelectedCourseStudents] = useState([]);
  const [selectedCourseSessions, setSelectedCourseSessions] = useState([]);

  // Fetch all data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [groupsData, coursesData, teachersData, sessionsData] = await Promise.all([
          getAllRecords('groups'),
          getAllRecords('courses'),
          getAllRecords('teachers'),
          getAllRecords('sessions')
        ]);

        setGroups(groupsData);
        setCourses(coursesData);
        setTeachers(teachersData);
        setSessions(sessionsData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch course details when courseId changes
  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (courseId) {
        try {
          const courseData = await getRecordById('courses', courseId);
          if (courseData) {
            setSelectedCourse(courseData);

            // Fetch students for this course
            if (courseData.studentIds && courseData.studentIds.length > 0) {
              const studentPromises = courseData.studentIds.map(sid =>
                getRecordById('students', sid)
              );
              const students = await Promise.all(studentPromises);
              setSelectedCourseStudents(students.filter(s => s !== null));
            } else {
              setSelectedCourseStudents([]);
            }

            // Filter sessions for this course
            const courseSessions = sessions.filter(s => s.courseId === courseId);
            setSelectedCourseSessions(courseSessions);
          }
        } catch (err) {
          console.error("Error fetching course details:", err);
        }
      } else {
        setSelectedCourse(null);
        setSelectedCourseStudents([]);
        setSelectedCourseSessions([]);
      }
    };

    fetchCourseDetails();
  }, [courseId, sessions]);

  // Process groups with additional data
  const processedGroups = useMemo(() => {
    // Your existing group processing code
    return groups.map(group => {
      // Get courses for this group using groupId instead of name
      const groupCourses = courses.filter(course => {
        // Check both group name and groupId to ensure we catch all matches
        return (course.groupId === group.id) || (course.group === group.name);
      });

      // Calculate statistics
      let totalStudents = 0;
      const uniqueStudentIds = new Set();
      let totalSessions = 0;
      const levels = new Set();
      const teacherIds = new Set();

      groupCourses.forEach(course => {
        // Track unique students
        if (course.studentIds && Array.isArray(course.studentIds)) {
          course.studentIds.forEach(id => uniqueStudentIds.add(id));
        }

        if (course.level) levels.add(course.level);

        // Handle both single teacherId and teacherIds array
        if (course.teacherId) teacherIds.add(course.teacherId);
        if (course.teacherIds && Array.isArray(course.teacherIds)) {
          course.teacherIds.forEach(id => teacherIds.add(id));
        }

        // Count sessions associated with this course
        const courseSessions = sessions.filter(s => s.courseId === course.id);
        totalSessions += courseSessions.length;
      });

      // Get teacher names
      const teacherNames = Array.from(teacherIds)
        .map(id => {
          const teacher = teachers.find(t => t.id === id);
          return teacher ? teacher.name : null;
        })
        .filter(Boolean);

      return {
        ...group,
        coursesCount: groupCourses.length,
        totalStudents: uniqueStudentIds.size,
        totalSessions,
        levels: Array.from(levels),
        teachers: teacherNames,
        progress: calculateGroupProgress(Array.from(levels))
      };
    });
  }, [groups, courses, teachers, sessions]);

  // Filter groups based on search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return processedGroups;

    const query = searchQuery.toLowerCase();
    return processedGroups.filter(group => {
      return (
        group.name.toLowerCase().includes(query) ||
        group.teachers.some(teacher => teacher.toLowerCase().includes(query))
      );
    });
  }, [processedGroups, searchQuery]);

  // Get the selected group data
  const selectedGroup = useMemo(() => {
    if (!groupName) return null;
    return processedGroups.find(g => g.name === groupName);
  }, [groupName, processedGroups]);

  // Get courses for the selected group
  const selectedGroupCourses = useMemo(() => {
    if (!groupName || !selectedGroup) return [];

    return courses.filter(course =>
      // Match by groupId (primary method)
      course.groupId === selectedGroup.id ||
      // Fallback for legacy data that might use group name instead
      course.group === groupName
    );
  }, [groupName, selectedGroup, courses]);

  // Get sessions for the selected group's courses
  const selectedGroupSessions = useMemo(() => {
    if (!selectedGroupCourses.length) return [];
    const courseIds = selectedGroupCourses.map(c => c.id);
    return sessions.filter(session => courseIds.includes(session.courseId));
  }, [selectedGroupCourses, sessions]);

  // Handle group selection
  const handleSelectGroup = useCallback((group) => {
    navigate(`/courses/group/${group.name}`);
  }, [navigate]);

  // Handle course selection
  const handleSelectCourse = useCallback((course) => {
    navigate(`/courses/group/${groupName}/course/${course.id}`);
  }, [navigate, groupName]);

  // Handle search change
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  return (
    <div className="course-content">
      <div className="course-content-header">
        <h2>Kursgruppen</h2>
        <SearchBar
          placeholder="Suche nach Gruppe oder Lehrer..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      <div className="course-content-layout three-column">
        {/* Left column: Groups list */}
        <div className="column groups-column">
          <GroupsList
            groups={filteredGroups}
            loading={loading}
            error={error}
            searchQuery={searchQuery}
            selectedGroupName={groupName}
            onSelectGroup={handleSelectGroup}
          />
        </div>

        {/* Middle column: Group detail */}
        <div className="column group-detail-column">
          <GroupDetail
            groupName={groupName}
            selectedGroup={selectedGroup}
            selectedGroupCourses={selectedGroupCourses}
            loading={loading}
            onSelectCourse={handleSelectCourse}
            selectedCourseId={courseId}
          />
        </div>

        {/* Right column: Course detail */}
        <div className="column course-detail-column">
          <CourseDetailPanel
            course={selectedCourse}
            students={selectedCourseStudents}
            sessions={selectedCourseSessions}
            loading={loading && courseId && !selectedCourse}
            setCourses={setCourses}
            group={selectedGroup}
          />
        </div>

      </div>
    </div>
  );
};

// Helper function to calculate progress based on course levels
const calculateGroupProgress = (levels) => {
  // Your existing function
  if (!levels || levels.length === 0) return 0;

  // Define the course structure with expected levels
  const courseLevels = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2'];

  // Find the highest level
  let highestLevelIndex = -1;
  levels.forEach(level => {
    const levelIndex = courseLevels.indexOf(level);
    if (levelIndex > highestLevelIndex) {
      highestLevelIndex = levelIndex;
    }
  });

  // Calculate progress percentage
  if (highestLevelIndex === -1) return 0;
  return ((highestLevelIndex + 1) / courseLevels.length) * 100;
};

export default CourseContent;