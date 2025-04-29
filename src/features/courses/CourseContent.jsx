//JSX Imports
import SearchBar from '../common/SearchBar';
import ProgressBar from '../common/ProgressBar';
import { getAllRecords } from '../firebase/database';
import { sortLanguageLevels } from '../utils/levelSorting';

//Css imports
import '../styles/Content.css';
import '../styles/KlassenContent.css';

// Library imports
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const KlassenContent = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingCourseId, setDeletingCourseId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all data
      const groupsData = await getAllRecords('groups');
      const coursesData = await getAllRecords('courses');
      const allSessions = await getAllRecords('sessions');
      const allTeachers = await getAllRecords('teachers');

      setGroups(groupsData);

      // Helper: get teacher name by id
      const teacherNameById = {};
      allTeachers.forEach(t => { teacherNameById[t.id] = t.name; });

      // Enrich course data
      const enrichedCourses = coursesData.map(course => {
        // Find group for this course
        let groupName = course.group || 'Ungrouped';
        let groupColor = '#0088FE'; // Default color

        // Find group by ID or name
        const group = groupsData.find(g =>
          g.id === course.groupId || g.name === groupName
        );

        if (group) {
          groupName = group.name;
          groupColor = group.color || '#0088FE';
        }

        // Get students count
        const studentCount = course.studentIds ? course.studentIds.length : 0;

        // Get sessions for this course
        const courseSessions = allSessions.filter(s => s.courseId === course.id);

        // Count sessions per teacher
        const teacherSessionMap = {};
        courseSessions.forEach(session => {
          if (session.teacherId) {
            teacherSessionMap[session.teacherId] = (teacherSessionMap[session.teacherId] || 0) + 1;
          }
        });

        // Build teacher session info array
        const teacherSessions = Object.entries(teacherSessionMap).map(([teacherId, count]) => ({
          teacherId,
          name: teacherNameById[teacherId] || 'Unbekannt',
          count,
        }));

        // Get sessions count
        const sessionCount = courseSessions.length;

        return {
          ...course,
          group: groupName,
          groupColor,
          studentCount,
          sessionCount,
          teacherSessions,
          teacherNames: teacherSessions.map(ts => ts.name)
        };
      });

      setCourses(enrichedCourses);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewGroupDetails = (groupName) => {
    console.log(`Navigating to group: ${groupName}`);
    navigate(`/courses/group/${groupName}`);
  };

  const handleLevelBadgeClick = (groupName, level) => {
    // Find the first course that matches both group and level
    const matchingCourse = courses.find(
      course => course.group === groupName && course.level === level
    );

    if (matchingCourse) {
      navigate(`/courses/${matchingCourse.id}`, { state: { groupName } });
    } else {
      // Handle case where no matching course is found
      alert(`No course found for ${level} in group ${groupName}`);
    }
  };

  // Group courses by group name
  const groupCourses = () => {
    const groupedCourses = {};

    courses.forEach(course => {
      const groupName = course.group || 'Ungrouped';
      if (!groupedCourses[groupName]) {
        groupedCourses[groupName] = {
          name: groupName,
          courses: [],
          color: course.groupColor || '#0088FE',
          teachers: new Set(),
          levels: new Set(),
          totalStudents: 0,
          totalSessions: 0,
          progress: 0, // Will calculate after collecting all courses
        };
      }
      groupedCourses[groupName].courses.push(course);
      groupedCourses[groupName].totalStudents += course.studentCount || 0;
      groupedCourses[groupName].totalSessions += course.sessionCount || 0;
      groupedCourses[groupName].levels.add(course.level);

      // Add teachers from this course
      if (course.teacherSessions) {
        course.teacherSessions.forEach(ts => {
          groupedCourses[groupName].teachers.add(ts.name);
        });
      }
    });

    // Calculate progress for each group
    Object.values(groupedCourses).forEach(group => {
      group.progress = calculateGroupProgress(group.courses);
    });

    return groupedCourses;
  };

  // Calculate progress for a group based on course levels
  const calculateGroupProgress = (groupCourses) => {
    if (!groupCourses || groupCourses.length === 0) return 0;

    // Define the course structure with expected levels
    const courseLevels = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2'];

    // Find the highest level course in this group
    let highestLevelIndex = -1;

    groupCourses.forEach(course => {
      const levelIndex = courseLevels.indexOf(course.level);
      if (levelIndex > highestLevelIndex) {
        highestLevelIndex = levelIndex;
      }
    });

    // Calculate progress percentage
    if (highestLevelIndex === -1) return 0;

    return ((highestLevelIndex + 1) / courseLevels.length) * 100;
  };

  // Filter groups based on search query
  const filterGroups = (groups) => {
    if (!searchQuery) return groups;

    const filteredGroups = {};
    const lowerQuery = searchQuery.toLowerCase();

    Object.entries(groups).forEach(([key, group]) => {
      // Check if group name matches
      const groupNameMatches = group.name.toLowerCase().includes(lowerQuery);

      // Check if any teacher name matches
      const teacherMatches = Array.from(group.teachers).some(
        teacherName => teacherName.toLowerCase().includes(lowerQuery)
      );

      if (groupNameMatches || teacherMatches) {
        filteredGroups[key] = group;
      }
    });

    return filteredGroups;
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const courseGroups = groupCourses();
  const filteredCourseGroups = filterGroups(courseGroups);

  return (
    <div className="klassen-content">
      {/* Fixed Search Bar */}
      <div className="klassen-header">
        <h2>Kursgruppen</h2>
        <SearchBar
          placeholder="Suche nach Gruppe oder Lehrer..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      {loading && <div className="loading-indicator">Daten werden geladen...</div>}

      {error && <div className="error-message">{error}</div>}

      {!loading && !error && Object.keys(filteredCourseGroups).length === 0 && (
        <div className="empty-state">
          {searchQuery ? (
            <p>Keine Ergebnisse für "{searchQuery}" gefunden.</p>
          ) : (
            <p>Keine Klassen gefunden. Importieren Sie Klassendaten über den Excel Import.</p>
          )}
        </div>
      )}

      {!loading && !error && Object.keys(filteredCourseGroups).length > 0 && (
        <div className="groups-dashboard">
          {Object.values(filteredCourseGroups).map((group) => {
            const lighterColor = adjustColor(group.color, 40); // Create lighter version for progress bar

            return (
              <div
                className="group-dashboard-card"
                key={group.name}
                onClick={() => handleViewGroupDetails(group.name)}
                style={{ cursor: 'pointer' }}
              >
                <div className="group-avatar-container">
                  <div
                    className="group-avatar"
                    style={{ backgroundColor: group.color }}
                    onClick={() => handleViewGroupDetails(group.name)}
                  >
                    {group.name}
                  </div>
                </div>

                <div className="group-details-card">
                  <div className="group-details-header">
                    <div className="group-levels-container">
                      {sortLanguageLevels(Array.from(group.levels)).map(level => (
                        <div
                          className="level-badge clickable"
                          key={level}
                          onClick={(e) => {
                            handleLevelBadgeClick(group.name, level)
                          }}                        >
                          {level}
                        </div>
                      ))}
                    </div>
                    <div className="group-stats">
                      <span>{group.courses.length} Kurse</span>
                      <span>{group.totalStudents} Schüler</span>
                      <span>{group.totalSessions} Lektionen</span>
                      <span className="arrow-icon">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                          <path
                            d="M5 19l14-14M5 5h14v14"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </div>
                  </div>


                  <div className="group-teachers-container">
                    <h4>Lehrkräfte</h4>
                    <div className="teacher-badges-container">
                      {Array.from(group.teachers).length > 0 ? (
                        Array.from(group.teachers).map(teacher => (
                          <span key={teacher} className="teacher-badge">
                            {teacher}
                          </span>
                        ))
                      ) : (
                        <span className="no-teachers-hint">Keine Lehrkräfte gefunden</span>
                      )}
                    </div>
                  </div>

                  <div className="group-progress-section">
                    <h4>Lernfortschritt</h4>
                    <ProgressBar
                      progress={group.progress}
                      color={group.color}
                      showLabel={true}
                      labelPosition="right"
                    />
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Helper function to create a lighter version of a color
function adjustColor(color, percent) {
  if (!color || typeof color !== 'string') return '#0088FE';

  // If it's not a hex color, return as is
  if (!color.startsWith('#')) return color;

  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = Math.floor(R + (255 - R) * (percent / 100));
  G = Math.floor(G + (255 - G) * (percent / 100));
  B = Math.floor(B + (255 - B) * (percent / 100));

  R = (R < 255) ? R : 255;
  G = (G < 255) ? G : 255;
  B = (B < 255) ? B : 255;

  const RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
  const GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
  const BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));

  return "#" + RR + GG + BB;
}

export default KlassenContent;