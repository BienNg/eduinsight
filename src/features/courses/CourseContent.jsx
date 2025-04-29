// src/features/courses/CourseContent.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAllRecords } from '../firebase/database';
import { sortLanguageLevels } from '../utils/levelSorting';
import SearchBar from '../common/SearchBar';
import ProgressBar from '../common/ProgressBar';
import TabComponent from '../common/TabComponent';
import '../styles/Content.css';
import '../styles/CourseContent.css';

const CourseContent = () => {
  const navigate = useNavigate();
  const { groupName } = useParams();
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

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

  // Process groups with additional data
  const processedGroups = useMemo(() => {
    const result = [];
    
    // Create a map for quick lookup of courses by group
    const coursesByGroup = {};
    
    // First pass: organize courses by group
    courses.forEach(course => {
      const groupName = course.group || 'Ungrouped';
      if (!coursesByGroup[groupName]) {
        coursesByGroup[groupName] = [];
      }
      coursesByGroup[groupName].push(course);
    });
    
    // Second pass: process group data
    groups.forEach(group => {
      const groupCourses = coursesByGroup[group.name] || [];
      
      // Calculate statistics
      let totalStudents = 0;
      let totalSessions = 0;
      const levels = new Set();
      const teacherIds = new Set();
      
      groupCourses.forEach(course => {
        // Count students
        totalStudents += course.studentIds?.length || 0;
        
        // Add course level
        if (course.level) levels.add(course.level);
        
        // Add teacher IDs
        if (course.teacherId) teacherIds.add(course.teacherId);
        if (course.teacherIds && Array.isArray(course.teacherIds)) {
          course.teacherIds.forEach(id => teacherIds.add(id));
        }
        
        // Count sessions
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
      
      // Add processed group data
      result.push({
        ...group,
        coursesCount: groupCourses.length,
        totalStudents,
        totalSessions,
        levels: Array.from(levels),
        teachers: teacherNames,
        progress: calculateGroupProgress(Array.from(levels))
      });
    });
    
    // Handle Ungrouped courses
    const ungroupedCourses = coursesByGroup['Ungrouped'] || [];
    if (ungroupedCourses.length > 0) {
      // Create a synthetic group for ungrouped courses
      const ungroupedLevels = new Set();
      let ungroupedStudents = 0;
      let ungroupedSessions = 0;
      const ungroupedTeacherIds = new Set();
      
      ungroupedCourses.forEach(course => {
        if (course.level) ungroupedLevels.add(course.level);
        ungroupedStudents += course.studentIds?.length || 0;
        
        if (course.teacherId) ungroupedTeacherIds.add(course.teacherId);
        if (course.teacherIds && Array.isArray(course.teacherIds)) {
          course.teacherIds.forEach(id => ungroupedTeacherIds.add(id));
        }
        
        const courseSessions = sessions.filter(s => s.courseId === course.id);
        ungroupedSessions += courseSessions.length;
      });
      
      const ungroupedTeacherNames = Array.from(ungroupedTeacherIds)
        .map(id => {
          const teacher = teachers.find(t => t.id === id);
          return teacher ? teacher.name : null;
        })
        .filter(Boolean);
      
      result.push({
        id: 'ungrouped',
        name: 'Ungrouped',
        color: '#999999',
        coursesCount: ungroupedCourses.length,
        totalStudents: ungroupedStudents,
        totalSessions: ungroupedSessions,
        levels: Array.from(ungroupedLevels),
        teachers: ungroupedTeacherNames,
        progress: calculateGroupProgress(Array.from(ungroupedLevels))
      });
    }
    
    return result;
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
    if (!groupName) return [];
    return courses.filter(course => course.group === groupName);
  }, [groupName, courses]);

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

  // Handle search change
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  // Define tabs for group detail view
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'courses', label: 'Courses' },
    { id: 'levels', label: 'Levels' }
  ];

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
      
      <div className="course-content-layout">
        {/* Left column: Groups list */}
        <div className="groups-list-container">
          {loading && (
            <div className="groups-list-loading">
              <div className="skeleton-item"></div>
              <div className="skeleton-item"></div>
              <div className="skeleton-item"></div>
            </div>
          )}
          
          {error && (
            <div className="groups-list-error">
              <p>{error}</p>
            </div>
          )}
          
          {!loading && !error && filteredGroups.length === 0 && (
            <div className="groups-list-empty">
              {searchQuery ? (
                <p>Keine Ergebnisse für "{searchQuery}" gefunden.</p>
              ) : (
                <p>Keine Kursgruppen gefunden.</p>
              )}
            </div>
          )}
          
          {!loading && !error && filteredGroups.length > 0 && (
            <div className="groups-list">
              {filteredGroups.map(group => (
                <div
                  key={group.id || group.name}
                  className={`group-list-item ${groupName === group.name ? 'selected' : ''}`}
                  onClick={() => handleSelectGroup(group)}
                >
                  <div 
                    className="group-color-indicator" 
                    style={{ backgroundColor: group.color || '#0088FE' }}
                  />
                  <div className="group-list-content">
                    <div className="group-list-header">
                      <h3>{group.name}</h3>
                      <span className="course-count">{group.coursesCount}</span>
                    </div>
                    <div className="group-list-stats">
                      <span>{group.totalStudents} Schüler</span>
                      <span>{group.totalSessions} Lektionen</span>
                    </div>
                    <ProgressBar
                      progress={group.progress}
                      color={group.color || '#0088FE'}
                      height="4px"
                      showLabel={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Right column: Group detail */}
        <div className="group-detail-container">
          {!groupName && (
            <div className="no-group-selected">
              <p>Wählen Sie eine Gruppe aus der Liste, um Details anzuzeigen</p>
            </div>
          )}
          
          {loading && groupName && (
            <div className="group-detail-loading">
              <div className="skeleton-header"></div>
              <div className="skeleton-tabs"></div>
              <div className="skeleton-content"></div>
            </div>
          )}
          
          {!loading && groupName && selectedGroup && (
            <div className="group-detail-view">
              <div className="group-detail-header">
                <h2>{selectedGroup.name}</h2>
                <div 
                  className="group-badge" 
                  style={{ backgroundColor: selectedGroup.color || '#0088FE' }}
                >
                  {selectedGroup.coursesCount} Kurse
                </div>
              </div>
              
              <TabComponent tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab}>
                {activeTab === 'overview' && (
                  <div className="overview-tab">
                    <div className="stats-row">
                      <div className="stat-box">
                        <h3>Kurse</h3>
                        <div className="stat-value">{selectedGroup.coursesCount}</div>
                      </div>
                      <div className="stat-box">
                        <h3>Schüler</h3>
                        <div className="stat-value">{selectedGroup.totalStudents}</div>
                      </div>
                      <div className="stat-box">
                        <h3>Lektionen</h3>
                        <div className="stat-value">{selectedGroup.totalSessions}</div>
                      </div>
                      <div className="stat-box">
                        <h3>Lehrer</h3>
                        <div className="stat-value">{selectedGroup.teachers.length}</div>
                      </div>
                    </div>
                    
                    <div className="course-info-card">
                      <h3>Kursstufen</h3>
                      <div className="level-badges-container">
                        {sortLanguageLevels(selectedGroup.levels).map(level => (
                          <div key={level} className="level-badge">
                            {level}
                            <span className="count">
                              {selectedGroupCourses.filter(c => c.level === level).length} Kurse
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="course-info-card">
                      <h3>Lehrkräfte</h3>
                      <div className="teacher-badges-container">
                        {selectedGroup.teachers.length > 0 ? (
                          selectedGroup.teachers.map(teacher => (
                            <span key={teacher} className="teacher-badge">
                              {teacher}
                            </span>
                          ))
                        ) : (
                          <span className="no-teachers-hint">Keine Lehrkräfte gefunden</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="course-info-card">
                      <h3>Lernfortschritt</h3>
                      <ProgressBar
                        progress={selectedGroup.progress}
                        color={selectedGroup.color || '#0088FE'}
                        showLabel={true}
                      />
                    </div>
                  </div>
                )}
                
                {activeTab === 'courses' && (
                  <div className="courses-tab">
                    <h3>Alle Kurse in {selectedGroup.name}</h3>
                    {/* Implement your courses table or grid here */}
                    <p className="placeholder-text">Kursübersicht wird implementiert...</p>
                  </div>
                )}
                
                {activeTab === 'levels' && (
                  <div className="levels-tab">
                    <h3>Kursstufen in {selectedGroup.name}</h3>
                    {/* Implement your levels view here */}
                    <p className="placeholder-text">Stufenübersicht wird implementiert...</p>
                  </div>
                )}
              </TabComponent>
            </div>
          )}
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