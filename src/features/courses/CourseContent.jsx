// src/features/courses/CourseContent.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAllRecords, getRecordById } from '../firebase/database';
import { sortLanguageLevels } from '../utils/levelSorting';

// Importing components
import SearchBar from '../common/SearchBar';
import GroupsList from './components/GroupsList';
import GroupDetail from './components/GroupDetail';
import CourseDetailPanel from './components/CourseDetailPanel';

// Importing styles
import '../styles/Content.css';
import '../styles/CourseContent.css';

// New function to get sessions by courseId
const getSessionsByCourseId = async (courseId) => {
  if (!courseId) return [];
  
  try {
    console.time(`Firebase:getSessionsByCourseId:${courseId}`);
    
    // Import necessary functions directly here
    const { ref, query, orderByChild, equalTo, get } = require('firebase/database');
    const { database } = require('../firebase/config');
    
    // Create a query that only returns sessions for this course
    const sessionsQuery = query(
      ref(database, 'sessions'),
      orderByChild('courseId'),
      equalTo(courseId)
    );
    
    const snapshot = await get(sessionsQuery);
    const sessions = snapshot.exists() ? Object.values(snapshot.val()) : [];
    
    console.timeEnd(`Firebase:getSessionsByCourseId:${courseId}`);
    console.log(`Retrieved ${sessions.length} sessions for course ${courseId}`);
    
    return sessions;
  } catch (error) {
    console.error(`Error getting sessions for course ${courseId}:`, error);
    return [];
  }
};

const CourseContent = () => {
  const navigate = useNavigate();
  const { groupName, courseId } = useParams();
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [sessions, setSessions] = useState([]); // This will be used less now
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedCourseStudents, setSelectedCourseStudents] = useState([]);
  const [selectedCourseSessions, setSelectedCourseSessions] = useState([]);
  const [selectedGroupSessions, setSelectedGroupSessions] = useState([]);
  const [courseDetailsLoading, setCourseDetailsLoading] = useState(false);

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

  // Handle group session loading
  const loadGroupSessions = async (groupId, groupName) => {
    if (!groupId && !groupName) return;
    
    try {
      console.time('CourseContent:loadGroupSessions');
      
      // Find all courses in this group
      const groupCourses = courses.filter(course => 
        (course.groupId === groupId) || (course.group === groupName)
      );
      
      const courseIds = groupCourses.map(c => c.id);
      
      if (courseIds.length === 0) {
        setSelectedGroupSessions([]);
        return;
      }
      
      // Load sessions for each course in parallel
      const sessionPromises = courseIds.map(cid => getSessionsByCourseId(cid));
      const sessionsArrays = await Promise.all(sessionPromises);
      
      // Combine all the session arrays
      const allGroupSessions = sessionsArrays.flat();
      setSelectedGroupSessions(allGroupSessions);
      
      console.timeEnd('CourseContent:loadGroupSessions');
    } catch (error) {
      console.error("Error loading group sessions:", error);
    }
  };

  // Fetch course details when courseId changes
  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (courseId) {
        try {
          setCourseDetailsLoading(true);
          console.time('CourseContent:fetchCourseDetails');

          // Fetch course data
          console.time('CourseContent:fetchCourseById');
          const courseData = await getRecordById('courses', courseId);
          console.timeEnd('CourseContent:fetchCourseById');
          
          if (courseData) {
            console.time('CourseContent:setCourseData');
            setSelectedCourse(courseData);
            console.timeEnd('CourseContent:setCourseData');

            // Fetch students for this course
            if (courseData.studentIds && courseData.studentIds.length > 0) {
              console.time('CourseContent:fetchStudents');
              
              // Create batches for better performance
              const batchSize = 10;
              const studentBatches = [];
              
              for (let i = 0; i < courseData.studentIds.length; i += batchSize) {
                studentBatches.push(courseData.studentIds.slice(i, i + batchSize));
              }
              
              // Process batches sequentially
              const allStudents = [];
              
              for (const batch of studentBatches) {
                const batchPromises = batch.map(sid => getRecordById('students', sid));
                const batchResults = await Promise.all(batchPromises);
                allStudents.push(...batchResults.filter(s => s !== null));
              }
              
              setSelectedCourseStudents(allStudents);
              console.timeEnd('CourseContent:fetchStudents');
            } else {
              setSelectedCourseStudents([]);
            }

            // Directly fetch only sessions for this course
            console.time('CourseContent:filterSessions');
            const courseSessions = await getSessionsByCourseId(courseId);
            setSelectedCourseSessions(courseSessions);
            console.timeEnd('CourseContent:filterSessions');
          }
          
          console.timeEnd('CourseContent:fetchCourseDetails');
        } catch (err) {
          console.error("Error fetching course details:", err);
        } finally {
          setCourseDetailsLoading(false);
        }
      } else {
        setSelectedCourse(null);
        setSelectedCourseStudents([]);
        setSelectedCourseSessions([]);
      }
    };

    fetchCourseDetails();
  }, [courseId]);

  // Load sessions when group changes
  useEffect(() => {
    if (groupName && courses.length > 0) {
      const selectedGroup = processedGroups.find(g => g.name === groupName);
      if (selectedGroup) {
        loadGroupSessions(selectedGroup.id, groupName);
      }
    }
  }, [groupName, courses]);

  // Process groups with additional data
  const processedGroups = useMemo(() => {
    console.time('CourseContent:processGroups');
    // Your existing group processing code
    const processed = groups.map(group => {
      // Get courses for this group using groupId instead of name
      const groupCourses = courses.filter(course => {
        // Check both group name and groupId to ensure we catch all matches
        return (course.groupId === group.id) || (course.group === group.name);
      });

      // Calculate statistics
      let totalStudents = 0;
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

      // Calculate total sessions - this now uses the count of sessions from selectedGroupSessions
      // only if this is the currently selected group
      const totalSessions = group.name === groupName
        ? selectedGroupSessions.length
        : 0; // We'll only count sessions for the selected group

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
    console.timeEnd('CourseContent:processGroups');
    return processed;
  }, [groups, courses, teachers, groupName, selectedGroupSessions]);

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
            loading={loading || courseDetailsLoading || (!selectedCourse && courseId)}
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