// src/components/Dashboard/SchulerContent.jsx
import { useState, useEffect, useMemo } from 'react';
import { getAllRecords, getRecordById } from '../firebase/database';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilter, faUserGraduate, faChalkboardTeacher, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';

import StudentDetail from '../students/StudentDetail';
import CourseDetail from '../courses/components/CourseDetail';
import '../styles/Content.css';
import '../styles/SchulerContent.css'; // We'll create this file
import { useParams, useNavigate } from 'react-router-dom';

const SchulerContent = () => {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const navigate = useNavigate();


  // Handle course badge click
  const handleCourseClick = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  // Handle closing course detail
  const handleCloseCourseDetail = () => {
    setSelectedCourseId(null);
  };

  // Fetch all data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch students, courses, and teachers data
        const studentsData = await getAllRecords('students');
        const coursesData = await getAllRecords('courses');
        const teachersData = await getAllRecords('teachers');

        // Fetch all sessions for attendance calculations
        const sessionsData = await getAllRecords('sessions');

        // Enrich student data with additional information
        const enrichedStudents = await Promise.all(
          studentsData.map(async (student) => {
            // Initialize student's courses, teachers, and attendance
            const studentCourses = [];
            const studentTeachers = new Set();
            let totalSessions = 0;
            let absentSessions = 0;

            // Process each course the student is enrolled in
            for (const courseId of (student.courseIds || [])) {
              const course = coursesData.find(c => c.id === courseId);
              if (course) {
                // Add course to student's courses
                studentCourses.push(course);

                // Add teacher to student's teachers
                if (course.teacherId) {
                  studentTeachers.add(course.teacherId);
                }

                // Calculate attendance for this course
                const courseSessions = sessionsData.filter(s => s.courseId === courseId);
                courseSessions.forEach(session => {
                  if (session.attendance && session.attendance[student.id]) {
                    totalSessions++;

                    // Check if student was absent
                    const status = typeof session.attendance[student.id] === 'object'
                      ? session.attendance[student.id].status
                      : session.attendance[student.id];

                    if (status !== 'present') {
                      absentSessions++;
                    }
                  }
                });
              }
            }

            // Get teachers' names
            const teacherNames = Array.from(studentTeachers).map(teacherId => {
              const teacher = teachersData.find(t => t.id === teacherId);
              return teacher ? teacher.name : 'Unknown';
            });

            // Calculate absence rate
            const absenceRate = totalSessions > 0
              ? ((absentSessions / totalSessions) * 100).toFixed(1)
              : 0;

            // Return enriched student data
            return {
              ...student,
              courses: studentCourses,
              courseNames: studentCourses.map(c => c.name).join(', '),
              levels: [...new Set(studentCourses.map(c => c.level))],
              levelNames: [...new Set(studentCourses.map(c => c.level))].join(', '),
              teacherIds: Array.from(studentTeachers),
              teacherNames: teacherNames.join(', '),
              totalSessions,
              absentSessions,
              absenceRate,
              absenceString: `${absentSessions}/${totalSessions}`,
              joinDate: student.joinDates
                ? Object.values(student.joinDates).sort()[0]
                : 'Unknown'
            };
          })
        );

        setStudents(enrichedStudents);
        setCourses(coursesData);
        setTeachers(teachersData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load student data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Extract available levels from courses
  const availableLevels = useMemo(() => {
    const levels = new Set();
    courses.forEach(course => {
      if (course.level) {
        levels.add(course.level);
      }
    });
    return Array.from(levels).sort();
  }, [courses]);

  // Handle sorting
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Add this normalize function at the top of your SchülerContent.jsx file
  const normalizeString = (str) => {
    if (!str) return '';

    // Convert to lowercase
    let normalized = str.toLowerCase();

    // Replace Vietnamese characters with non-accented equivalents
    const accentMap = {
      'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
      'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
      'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
      'đ': 'd',
      'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
      'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
      'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
      'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
      'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
      'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
      'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
      'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
      'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y'
    };

    for (const [accented, nonAccented] of Object.entries(accentMap)) {
      normalized = normalized.replace(new RegExp(accented, 'g'), nonAccented);
    }

    return normalized;
  };

  // Filter and sort students
  const filteredStudents = useMemo(() => {
    let result = [...students];

    // Apply search filter
    if (searchQuery) {
      const query = normalizeString(searchQuery);
      result = result.filter(student => {
        // Normalize all searchable fields
        const normalizedName = normalizeString(student.name);
        const normalizedInfo = normalizeString(student.info);
        const normalizedCourses = normalizeString(student.courseNames);
        const normalizedLevels = normalizeString(student.levelNames);
        const normalizedTeachers = normalizeString(student.teacherNames);

        // Check if any field contains the query
        return normalizedName.includes(query) ||
          normalizedInfo.includes(query) ||
          normalizedCourses.includes(query) ||
          normalizedLevels.includes(query) ||
          normalizedTeachers.includes(query);
      });
    }

    // The rest of your filter logic remains the same
    if (selectedCourse) {
      result = result.filter(student =>
        student.courseIds?.includes(selectedCourse)
      );
    }

    if (selectedLevel) {
      result = result.filter(student =>
        student.levels?.includes(selectedLevel)
      );
    }

    if (selectedTeacher) {
      result = result.filter(student =>
        student.teacherIds?.includes(selectedTeacher)
      );
    }

    if (attendanceFilter) {
      if (attendanceFilter === 'high') {
        result = result.filter(student => parseFloat(student.absenceRate) >= 20);
      } else if (attendanceFilter === 'perfect') {
        result = result.filter(student => parseFloat(student.absenceRate) === 0 && student.totalSessions > 0);
      }
    }

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [students, searchQuery, selectedCourse, selectedLevel, selectedTeacher, attendanceFilter, sortConfig]);

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCourse('');
    setSelectedLevel('');
    setSelectedTeacher('');
    setAttendanceFilter('');
  };

  // Open student detail modal
  const handleViewDetails = (student) => {
    setSelectedStudent(student);
  };

  // Close student detail modal
  const handleCloseDetails = () => {
    setSelectedStudent(null);
  };

  if (selectedStudent) {
    return <StudentDetail
      student={selectedStudent}
      onClose={handleCloseDetails}
    />;
  }
  

  return (
    <div className="schuler-content">
      {/* Search and Filter Bar */}
      <div className="search-filter-bar">
        <div className="search-container">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Suche nach Namen, Infos oder Kursen..."
            className="search-input"
          />
        </div>

        <div className="filters-container">
          <div className="filter-select">
            <label>
              <FontAwesomeIcon icon={faChalkboardTeacher} className="filter-icon" />
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                <option value="">Alle Kurse</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="filter-select">
            <label>
              <FontAwesomeIcon icon={faChalkboardTeacher} className="filter-icon" />
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
              >
                <option value="">Alle Stufen</option>
                {availableLevels.map(level => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="filter-select">
            <label>
              <FontAwesomeIcon icon={faUserGraduate} className="filter-icon" />
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
              >
                <option value="">Alle Lehrer</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="filter-select">
            <label>
              <FontAwesomeIcon icon={faCalendarAlt} className="filter-icon" />
              <select
                value={attendanceFilter}
                onChange={(e) => setAttendanceFilter(e.target.value)}
              >
                <option value="">Alle Anwesenheiten</option>
                <option value="perfect">Keine Abwesenheit</option>
                <option value="high">Hohe Abwesenheit (20%)</option>
              </select>
            </label>
          </div>

          <button className="reset-filters-btn" onClick={resetFilters}>
            Filter zurücksetzen
          </button>
        </div>
      </div>

      {/* Loading and Error States */}
      {loading && <div className="loading-indicator">Daten werden geladen...</div>}
      {error && <div className="error-message">{error}</div>}

      {/* Students Table */}
      {!loading && !error && (
        <>
          <div className="results-info">
            {filteredStudents.length} {filteredStudents.length === 1 ? 'Schüler' : 'Schüler'} gefunden
          </div>

          <div className="students-table-container">
            <table className="students-table">
              <thead>
                <tr>
                  <th onClick={() => requestSort('name')} className={sortConfig.key === 'name' ? `sorted-${sortConfig.direction}` : ''}>
                    Name
                  </th>
                  <th onClick={() => requestSort('courseNames')} className={sortConfig.key === 'courseNames' ? `sorted-${sortConfig.direction}` : ''}>
                    Kurse
                  </th>
                  <th onClick={() => requestSort('teacherNames')} className={sortConfig.key === 'teacherNames' ? `sorted-${sortConfig.direction}` : ''}>
                    Lehrer
                  </th>
                  <th onClick={() => requestSort('absenceRate')} className={sortConfig.key === 'absenceRate' ? `sorted-${sortConfig.direction}` : ''}>
                    Abwesenheit
                  </th>
                  <th onClick={() => requestSort('joinDate')} className={sortConfig.key === 'joinDate' ? `sorted-${sortConfig.direction}` : ''}>
                    Beitrittsdatum
                  </th>
                  <th>Aktionen</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <div className="name-cell">
                        <span className="name-text">{student.name}</span>
                        <button
                          className="hover-open-btn"
                          onClick={() => handleViewDetails(student)}
                        >
                          OPEN
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="level-badges-container">
                        {student.courses.map((course) => (
                          <div
                            key={course.id}
                            className="level-badge clickable"
                            onClick={() => handleCourseClick(course.id)}
                          >
                            {course.name}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td>{student.teacherNames || '-'}</td>
                    <td className={parseFloat(student.absenceRate) > 20 ? 'absence-high' : parseFloat(student.absenceRate) === 0 ? 'absence-perfect' : ''}>
                      {student.absenceString} ({student.absenceRate}%)
                    </td>
                    <td>{student.joinDate || '-'}</td>
                    <td>
                      <button
                        className="btn-details"
                        onClick={() => handleViewDetails(student)}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredStudents.length === 0 && !loading && (
            <div className="empty-state">
              <h3>Keine Schüler gefunden</h3>
              <p>Passen Sie Ihre Suchkriterien an oder setzen Sie die Filter zurück.</p>
            </div>
          )}
        </>
      )}

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="student-detail-wrapper">
          <StudentDetail
            student={selectedStudent}
            onClose={handleCloseDetails}
          />
        </div>
      )}
    </div>
  );
};

export default SchulerContent;