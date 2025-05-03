// src/features/database/DatabaseView.jsx
import { useState, useEffect } from 'react';
import { getAllRecords } from '../firebase/database';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import '../styles/Content.css';
import '../styles/MonthTabs.css'; // Reusing existing tab styles

const DatabaseView = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [data, setData] = useState({
    courses: [],
    groups: [],
    months: [],
    sessions: [],
    teachers: [],
    students: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // Fetch data from all collections
        const [courses, groups, months, sessions, teachers, students] = await Promise.all([
          getAllRecords('courses'),
          getAllRecords('groups'),
          getAllRecords('months'),
          getAllRecords('sessions'),
          getAllRecords('teachers'),
          getAllRecords('students')
        ]);
        
        setData({
          courses,
          groups,
          months,
          sessions,
          teachers,
          students
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching database data:', err);
        setError('Failed to load database data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchAllData();
  }, []);
  
  if (loading) {
    return <div className="loading-indicator"><p>Loading database data...</p></div>;
  }
  
  if (error) {
    return <div className="error-message"><p>{error}</p></div>;
  }

  return (
    <div className="database-content">
      <h2>Database Overview</h2>
      
      <Tabs 
        selectedIndex={selectedIndex} 
        onSelect={index => setSelectedIndex(index)}
        className="month-tabs"
      >
        <TabList className="month-tab-list">
          <Tab className={`month-tab ${selectedIndex === 0 ? 'active' : ''}`}>Courses ({data.courses.length})</Tab>
          <Tab className={`month-tab ${selectedIndex === 1 ? 'active' : ''}`}>Groups ({data.groups.length})</Tab>
          <Tab className={`month-tab ${selectedIndex === 2 ? 'active' : ''}`}>Months ({data.months.length})</Tab>
          <Tab className={`month-tab ${selectedIndex === 3 ? 'active' : ''}`}>Sessions ({data.sessions.length})</Tab>
          <Tab className={`month-tab ${selectedIndex === 4 ? 'active' : ''}`}>Teachers ({data.teachers.length})</Tab>
          <Tab className={`month-tab ${selectedIndex === 5 ? 'active' : ''}`}>Students ({data.students.length})</Tab>
        </TabList>

        {/* Courses Tab */}
        <TabPanel className="month-tab-panel">
          <div className="courses-grid">
            {data.courses.map(course => (
              <div className="course-card" key={course.id}>
                <div className="course-header">
                  <h3>{course.name}</h3>
                  {course.level && <span className="course-level">{course.level}</span>}
                </div>
                <div className="course-info">
                  <div className="info-item">
                    <span className="label">Status:</span>
                    <span className="value">{course.status || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Sessions:</span>
                    <span className="value">{course.sessionIds?.length || 0}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Students:</span>
                    <span className="value">{course.studentIds?.length || 0}</span>
                  </div>
                </div>
              </div>
            ))}
            {data.courses.length === 0 && (
              <div className="empty-state">No courses found</div>
            )}
          </div>
        </TabPanel>

        {/* Groups Tab */}
        <TabPanel className="month-tab-panel">
          <div className="course-groups-grid">
            {data.groups.map(group => (
              <div className="group-card" key={group.id}>
                <div className="group-header" style={{ backgroundColor: group.color || '#0066cc' }}>
                  <h3>{group.name}</h3>
                  <span className="group-count">{group.courseIds?.length || 0} course(s)</span>
                </div>
                <div className="group-info">
                  <div className="info-item">
                    <span className="label">Type:</span>
                    <span className="value">{group.type || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Mode:</span>
                    <span className="value">{group.mode || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ))}
            {data.groups.length === 0 && (
              <div className="empty-state">No groups found</div>
            )}
          </div>
        </TabPanel>

        {/* Months Tab */}
        <TabPanel className="month-tab-panel">
          <div className="course-groups-grid">
            {data.months.map(month => (
              <div className="group-card" key={month.id}>
                <div className="group-header" style={{ backgroundColor: '#0066cc' }}>
                  <h3>{month.name}</h3>
                  <span className="group-count">{month.sessionCount || 0} session(s)</span>
                </div>
                <div className="group-info">
                  <div className="info-item">
                    <span className="label">Courses:</span>
                    <span className="value">{month.courseIds?.length || 0}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Teachers:</span>
                    <span className="value">{month.teacherIds?.length || 0}</span>
                  </div>
                </div>
              </div>
            ))}
            {data.months.length === 0 && (
              <div className="empty-state">No months found</div>
            )}
          </div>
        </TabPanel>

        {/* Sessions Tab - Table View */}
        <TabPanel className="month-tab-panel">
          <div className="sessions-table-container">
            <table className="students-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Teacher</th>
                  <th>Course</th>
                </tr>
              </thead>
              <tbody>
                {data.sessions.slice(0, 100).map(session => (
                  <tr key={session.id}>
                    <td className="truncate">{session.title}</td>
                    <td>{session.date || 'N/A'}</td>
                    <td>{session.startTime && session.endTime ? 
                         `${session.startTime} - ${session.endTime}` : 'N/A'}</td>
                    <td>{session.teacherId ? 
                         (data.teachers.find(t => t.id === session.teacherId)?.name || 'Unknown') 
                         : 'N/A'}</td>
                    <td>{session.courseId ? 
                         (data.courses.find(c => c.id === session.courseId)?.name || 'Unknown') 
                         : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.sessions.length === 0 && (
              <div className="empty-state">No sessions found</div>
            )}
            {data.sessions.length > 100 && (
              <div className="more-items-hint">
                Showing first 100 sessions. There are {data.sessions.length - 100} more.
              </div>
            )}
          </div>
        </TabPanel>

        {/* Teachers Tab */}
        <TabPanel className="month-tab-panel">
          <div className="teacher-cards-grid">
            {data.teachers.map(teacher => (
              <div className="teacher-card" key={teacher.id}>
                <div className="teacher-card-header">
                  <h3>{teacher.name}</h3>
                </div>
                <div className="teacher-card-body">
                  <div className="info-item">
                    <span className="label">Country:</span>
                    <span className="value">{teacher.country || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Courses:</span>
                    <span className="value">{teacher.courseIds?.length || 0}</span>
                  </div>
                </div>
              </div>
            ))}
            {data.teachers.length === 0 && (
              <div className="empty-state">No teachers found</div>
            )}
          </div>
        </TabPanel>

        {/* Students Tab - Table View */}
        <TabPanel className="month-tab-panel">
          <div className="students-table-container">
            <table className="students-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Courses</th>
                  <th>Join Date</th>
                  <th>Info</th>
                </tr>
              </thead>
              <tbody>
                {data.students.map(student => (
                  <tr key={student.id}>
                    <td className="truncate">{student.name}</td>
                    <td>
                      {student.courseIds?.length > 0 ? (
                        <div className="level-badges-container">
                          {student.courseIds.slice(0, 3).map(courseId => {
                            const course = data.courses.find(c => c.id === courseId);
                            return course ? (
                              <span className="level-badge" key={courseId}>
                                {course.name}
                              </span>
                            ) : null;
                          })}
                          {student.courseIds.length > 3 && (
                            <span className="level-badge">+{student.courseIds.length - 3} more</span>
                          )}
                        </div>
                      ) : 'None'}
                    </td>
                    <td>
                      {student.joinDates ? 
                        Object.values(student.joinDates)[0] || 'N/A' 
                        : 'N/A'}
                    </td>
                    <td className="truncate">{student.info || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.students.length === 0 && (
              <div className="empty-state">No students found</div>
            )}
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
};

export default DatabaseView;