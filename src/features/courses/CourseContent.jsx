// src/features/courses/CourseContent.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAllRecords, getSessionsByCourseId } from '../firebase/database';
import { sortLanguageLevels } from '../utils/levelSorting';
import { useCourseData } from './CourseDetail/hooks/useCourseData';

// Importing components
import SearchBar from '../common/SearchBar';
import GroupsList from './components/GroupsList';
import GroupDetail from './components/GroupDetail';
import CourseDetailPanel from './components/CourseDetailPanel';

// Importing styles
import '../styles/Content.css';
import '../styles/CourseContent.css';



// Simple cache for group sessions to avoid re-fetching
const groupSessionsCache = new Map();
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes

const CourseContent = () => {
  console.log('CourseContent component initializing...'); // Debug log to verify component loads
  
  const navigate = useNavigate();
  const { groupName, courseId } = useParams();
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [sessions, setSessions] = useState([]); // This will be used less now
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupSessions, setSelectedGroupSessions] = useState([]);
  
  // Use the optimized course data hook instead of manual fetching
  const {
    course: selectedCourse,
    students: selectedCourseStudents,
    sessions: selectedCourseSessions,
    loading: courseDetailsLoading,
    error: courseDetailsError
  } = useCourseData(courseId);

  // Fetch core data on component mount (groups, courses, teachers only - NOT sessions)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.time('CourseContent:fetchEssentialData');
        
        // Only fetch groups, courses, and teachers initially (NOT sessions)
        const [groupsData, coursesData, teachersData] = await Promise.all([
          getAllRecords('groups'),
          getAllRecords('courses'),
          getAllRecords('teachers')
        ]);
        
        console.log('Core data fetched:', {
          groupsCount: groupsData.length,
          coursesCount: coursesData.length,
          teachersCount: teachersData.length
        });
        
        setGroups(groupsData);
        setCourses(coursesData);
        setTeachers(teachersData);
        
        console.timeEnd('CourseContent:fetchEssentialData');
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle group session loading - OPTIMIZED WITH CACHING
  const loadGroupSessions = async (groupId, groupName) => {
    if (!groupId && !groupName) return;
    
    try {
      const cacheKey = `group_${groupId}_${groupName}`;
      const now = Date.now();
      
      // Check cache first
      const cachedData = groupSessionsCache.get(cacheKey);
      if (cachedData && (now - cachedData.timestamp) < CACHE_DURATION) {
        console.log(`Using cached group sessions for ${groupName}`);
        setSelectedGroupSessions(cachedData.sessions);
        return;
      }
      
      console.time(`CourseContent:loadGroupSessions:${groupName}`);
      
      // Find all courses in this group
      const groupCourses = courses.filter(course => 
        (course.groupId === groupId) || (course.group === groupName)
      );
      
      const courseIds = groupCourses.map(c => c.id);
      
      if (courseIds.length === 0) {
        setSelectedGroupSessions([]);
        console.timeEnd(`CourseContent:loadGroupSessions:${groupName}`);
        return;
      }
      
      // Load sessions for each course in parallel
      const sessionPromises = courseIds.map(cid => getSessionsByCourseId(cid));
      const sessionsArrays = await Promise.all(sessionPromises);
      
      // Combine all the session arrays
      const allGroupSessions = sessionsArrays.flat();
      setSelectedGroupSessions(allGroupSessions);
      
      // Cache the results
      groupSessionsCache.set(cacheKey, {
        sessions: allGroupSessions,
        timestamp: now
      });
      
      console.log(`Loaded ${allGroupSessions.length} sessions for group ${groupName} from ${courseIds.length} courses`);
      console.timeEnd(`CourseContent:loadGroupSessions:${groupName}`);
    } catch (error) {
      console.error("Error loading group sessions:", error);
    }
  };

  // Course details are now handled by the useCourseData hook above

  // Process groups with additional data - OPTIMIZED (removed selectedGroupSessions dependency)
  const baseProcessedGroups = useMemo(() => {
    console.time('CourseContent:processGroups');
    const processed = groups.map(group => {
      // Get courses for this group using groupId instead of name
      const groupCourses = courses.filter(course => {
        // Check both group name and groupId to ensure we catch all matches
        return (course.groupId === group.id) || (course.group === group.name);
      });

      // Calculate statistics
      const uniqueStudentIds = new Set();
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
        levels: Array.from(levels),
        teachers: teacherNames,
        progress: calculateGroupProgress(Array.from(levels))
      };
    });
    console.timeEnd('CourseContent:processGroups');
    return processed;
  }, [groups, courses, teachers]);

  // Add session counts separately to avoid recalculating everything
  const processedGroups = useMemo(() => {
    return baseProcessedGroups.map(group => ({
      ...group,
      // Only calculate session count for the currently selected group
      totalSessions: group.name === groupName ? selectedGroupSessions.length : 0
    }));
  }, [baseProcessedGroups, groupName, selectedGroupSessions]);

  // Load sessions when group changes - OPTIMIZED (using baseProcessedGroups to avoid circular dependency)
  useEffect(() => {
    if (groupName && courses.length > 0) {
      const selectedGroup = baseProcessedGroups.find(g => g.name === groupName);
      if (selectedGroup) {
        loadGroupSessions(selectedGroup.id, groupName);
      }
    }
  }, [groupName, courses, baseProcessedGroups]);

  // Filter groups based on search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return processedGroups;

    const query = searchQuery.toLowerCase();
    return processedGroups.filter(group => {
      return (
        (group.name && group.name.toLowerCase().includes(query)) ||
        (group.teachers && Array.isArray(group.teachers) &&
          group.teachers.some(teacher => teacher && teacher.toLowerCase().includes(query)))
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

  // Handle group selection
  const handleSelectGroup = useCallback((group) => {
    navigate(`/courses/group/${group.name}`);
  }, [navigate]);

  // Handle course selection
  const handleSelectCourse = useCallback((course) => {
    console.log(`🎯 Navigating to course ${course.id}`);
    // Navigate to the course - the useCourseData hook will handle loading
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
            courses={courses}
            sessions={selectedGroupSessions}
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
            sessions={selectedGroupSessions}
          />
        </div>

        {/* Right column: Course detail */}
        <div className="column course-detail-column">
          <CourseDetailPanel
            course={selectedCourse}
            students={selectedCourseStudents}
            sessions={selectedCourseSessions}
            loading={courseDetailsLoading}
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