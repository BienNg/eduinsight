// src/features/courses/CoursesPage.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAllRecords } from '../firebase/database';
import GroupsList from './components/GroupsList';
import GroupDetailView from './components/GroupDetailView';
import SearchBar from '../common/SearchBar';
import '../styles/CoursesPage.css';

const CoursesPage = () => {
  const navigate = useNavigate();
  const { groupName } = useParams();
  const [groups, setGroups] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all required data
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

  // Process group data with their associated courses
  const processedGroups = useMemo(() => {
    const result = [];

    // Create a map of courses by group
    const coursesByGroup = {};
    courses.forEach(course => {
      const groupName = course.group || 'Ungrouped';
      if (!coursesByGroup[groupName]) {
        coursesByGroup[groupName] = [];
      }
      coursesByGroup[groupName].push(course);
    });

    // Process each group
    groups.forEach(group => {
      const groupCourses = coursesByGroup[group.name] || [];
      
      // Count students and sessions
      let totalStudents = 0;
      let totalSessions = 0;
      const levels = new Set();
      const teacherIds = new Set();

      groupCourses.forEach(course => {
        totalStudents += (course.studentIds?.length || 0);
        levels.add(course.level);
        
        // Get sessions for this course
        const courseSessions = sessions.filter(s => s.courseId === course.id);
        totalSessions += courseSessions.length;
        
        // Add teacher IDs
        if (course.teacherId) teacherIds.add(course.teacherId);
        if (course.teacherIds) {
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

      // Add processed group to results
      result.push({
        ...group,
        coursesCount: groupCourses.length,
        totalStudents,
        totalSessions,
        levels: Array.from(levels),
        teachers: teacherNames,
      });
    });

    return result;
  }, [groups, courses, teachers, sessions]);

  // Filter groups based on search
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

  // Get the selected group
  const selectedGroup = useMemo(() => {
    if (!groupName) return null;
    return processedGroups.find(g => g.name === groupName);
  }, [groupName, processedGroups]);

  // Get courses for the selected group
  const selectedGroupCourses = useMemo(() => {
    if (!groupName) return [];
    return courses.filter(course => course.group === groupName);
  }, [groupName, courses]);

  // Handle group selection
  const handleSelectGroup = useCallback((group) => {
    navigate(`/courses/group/${group.name}`);
  }, [navigate]);

  // Handle search change
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  return (
    <div className="courses-page">
      <div className="courses-header">
        <h2>Course Groups</h2>
        <SearchBar 
          placeholder="Search groups or teachers..." 
          value={searchQuery} 
          onChange={handleSearchChange}
        />
      </div>
      
      <div className="courses-content">
        <div className="groups-list-container">
          <GroupsList 
            groups={filteredGroups}
            selectedGroupName={groupName}
            onSelectGroup={handleSelectGroup}
            loading={loading}
            error={error}
            searchQuery={searchQuery}
          />
        </div>
        
        <div className="group-detail-container">
          {groupName ? (
            <GroupDetailView 
              group={selectedGroup}
              courses={selectedGroupCourses}
              teachers={teachers}
              sessions={sessions}
              loading={loading}
            />
          ) : (
            <div className="no-group-selected">
              <p>Select a group from the list to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoursesPage;