// src/prototype/dashboard/mockData.js
// Mock data for dashboard prototype

// Mock Courses
export const mockCourses = [
  {
    id: 'c1',
    name: 'German A1.1 - Morning Group',
    level: 'A1.1',
    startDate: '10.01.2025',
    endDate: '15.03.2025',
    teacherId: 't1',
    groupId: 'g1',
    studentIds: ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'],
    totalSessions: 18,
    completedSessions: 8,
    mode: 'Online',
    progress: 44,
    attendance: 92
  },
  {
    id: 'c2',
    name: 'German A1.2 - Evening Group',
    level: 'A1.2',
    startDate: '05.01.2025',
    endDate: '20.03.2025',
    teacherId: 't2',
    groupId: 'g1',
    studentIds: ['s9', 's10', 's11', 's12', 's13', 's14'],
    totalSessions: 18,
    completedSessions: 9,
    mode: 'Online',
    progress: 50,
    attendance: 88
  },
  {
    id: 'c3',
    name: 'German A2.1 - Weekend Group',
    level: 'A2.1',
    startDate: '15.01.2025',
    endDate: '30.03.2025',
    teacherId: 't1',
    groupId: 'g1',
    studentIds: ['s15', 's16', 's17', 's18', 's19'],
    totalSessions: 20,
    completedSessions: 6,
    mode: 'Offline',
    progress: 30,
    attendance: 95
  },
  {
    id: 'c4',
    name: 'English B1.1 - Morning Group',
    level: 'B1.1',
    startDate: '08.01.2025',
    endDate: '25.03.2025',
    teacherId: 't3',
    groupId: 'g2',
    studentIds: ['s20', 's21', 's22', 's23', 's24', 's25'],
    totalSessions: 20,
    completedSessions: 10,
    mode: 'Hybrid',
    progress: 50,
    attendance: 76
  },
  {
    id: 'c5',
    name: 'English B1.2 - Evening Group',
    level: 'B1.2',
    startDate: '12.01.2025',
    endDate: '28.03.2025',
    teacherId: 't4',
    groupId: 'g2',
    studentIds: ['s26', 's27', 's28', 's29', 's30'],
    totalSessions: 20,
    completedSessions: 8,
    mode: 'Online',
    progress: 40,
    attendance: 80
  },
  {
    id: 'c6',
    name: 'Vietnamese A1.1 - Weekend Group',
    level: 'A1.1',
    startDate: '20.01.2025',
    endDate: '05.04.2025',
    teacherId: 't5',
    groupId: 'g3',
    studentIds: ['s31', 's32', 's33', 's34', 's35', 's36', 's37'],
    totalSessions: 18,
    completedSessions: 5,
    mode: 'Online',
    progress: 28,
    attendance: 85
  }
];

// Mock Students (minimal data for dashboard)
export const mockStudents = Array.from({ length: 37 }, (_, i) => ({
  id: `s${i + 1}`,
  name: `Student ${i + 1}`,
  courseIds: i < 8 ? ['c1'] : 
             i < 14 ? ['c2'] : 
             i < 19 ? ['c3'] : 
             i < 25 ? ['c4'] : 
             i < 30 ? ['c5'] : ['c6'],
  status: Math.random() > 0.1 ? 'active' : 'at-risk'
}));

// Mock Teachers
export const mockTeachers = [
  { id: 't1', name: 'Anna Schmidt', country: 'Germany', courses: 2 },
  { id: 't2', name: 'Thomas Müller', country: 'Germany', courses: 1 },
  { id: 't3', name: 'Sarah Johnson', country: 'UK', courses: 1 },
  { id: 't4', name: 'Michael Brown', country: 'USA', courses: 1 },
  { id: 't5', name: 'Nguyen Minh', country: 'Vietnam', courses: 1 }
];

// Mock Groups
export const mockGroups = [
  { 
    id: 'g1', 
    name: 'German Courses', 
    courses: 3,
    students: 19,
    avgAttendance: 91,
    avgProgress: 41,
    color: '#0088FE'
  },
  { 
    id: 'g2', 
    name: 'English Courses', 
    courses: 2,
    students: 11,
    avgAttendance: 78,
    avgProgress: 45,
    color: '#00C49F'
  },
  { 
    id: 'g3', 
    name: 'Vietnamese Courses', 
    courses: 1,
    students: 7,
    avgAttendance: 85,
    avgProgress: 28,
    color: '#FFBB28'
  }
];

// Mock Attendance Data with weekly breakdown
export const mockAttendance = {
  overall: 85,
  trend: [
    { week: 'Week 1', rate: 91 },
    { week: 'Week 2', rate: 88 },
    { week: 'Week 3', rate: 85 },
    { week: 'Week 4', rate: 82 },
    { week: 'Week 5', rate: 84 },
    { week: 'Week 6', rate: 83 },
    { week: 'Week 7', rate: 86 },
    { week: 'Week 8', rate: 85 }
  ],
  byLevel: [
    { level: 'A1.1', rate: 89 },
    { level: 'A1.2', rate: 88 },
    { level: 'A2.1', rate: 95 },
    { level: 'B1.1', rate: 76 },
    { level: 'B1.2', rate: 80 }
  ],
  byGroup: [
    { group: 'German Courses', rate: 91 },
    { group: 'English Courses', rate: 78 },
    { group: 'Vietnamese Courses', rate: 85 }
  ]
};

// Mock alerts and exceptions
export const mockAlerts = {
  attendance: [
    { 
      id: 'a1', 
      type: 'attendance', 
      severity: 'high', 
      message: 'English B1.1 course attendance below 80%',
      courseId: 'c4',
      value: 76
    },
    { 
      id: 'a2', 
      type: 'attendance', 
      severity: 'medium', 
      message: 'Student S23 missed 3 consecutive sessions',
      studentId: 's23',
      courseId: 'c4'
    }
  ],
  scheduling: [
    { 
      id: 's1', 
      type: 'scheduling', 
      severity: 'medium', 
      message: 'Teacher Anna Schmidt has conflicting schedule on 28.02.2025',
      teacherId: 't1'
    }
  ],
  dataQuality: [
    { 
      id: 'd1', 
      type: 'dataQuality', 
      severity: 'low', 
      message: 'Vietnamese A1.1 course missing session details for 18.02.2025',
      courseId: 'c6'
    }
  ],
  progress: [
    { 
      id: 'p1', 
      type: 'progress', 
      severity: 'medium', 
      message: 'Vietnamese A1.1 course progress 12% behind schedule',
      courseId: 'c6',
      expected: 40,
      actual: 28
    }
  ]
};