import { ref, push, set, get, update, remove, query, orderByChild, equalTo } from "firebase/database";
import { database } from "../../firebase/config";
import { createRecord, updateRecord, getAllRecords, getRecordById } from '../../firebase/database';

// src/features/import/services/firebaseService.js - add this function
export const getNextCourseColor = async () => {
  try {
    // Get all existing courses
    const coursesRef = ref(database, 'courses');
    const coursesSnapshot = await get(coursesRef);
    const courses = [];

    if (coursesSnapshot.exists()) {
      const coursesData = coursesSnapshot.val();
      Object.keys(coursesData).forEach(key => {
        courses.push({
          id: key,
          ...coursesData[key]
        });
      });
    }

    // Define available colors
    const COURSE_COLORS = [
      '#911DD2', // Purple Base
      '#7310A8', // Purple Dark
      '#FF5F68', // Coral Red Base
      '#D94D54', // Coral Dark
      '#4DBEFF', // Sky Blue Base
      '#3A9BD4', // Sky Dark
      '#18BF69', // Emerald Green Base
      '#139954', // Emerald Dark
      '#FBC14E', // Golden Yellow Base
      '#D9A53F', // Golden Dark
      '#D21D91', // Purple Complement
      '#5FFFC8', // Coral Complement
      '#FF944D', // Sky Complement
      '#BF181D', // Emerald Complement
      '#4E9CFB'  // Golden Complement
    ];

    // Count color usage
    const colorUsage = {};
    COURSE_COLORS.forEach(color => {
      colorUsage[color] = 0;
    });

    // Count how many times each color is used
    courses.forEach(course => {
      if (course.color && colorUsage[course.color] !== undefined) {
        colorUsage[course.color]++;
      }
    });

    // Find the minimum usage count
    let minUsage = Number.MAX_SAFE_INTEGER;
    Object.values(colorUsage).forEach(count => {
      if (count < minUsage) {
        minUsage = count;
      }
    });

    // Get all colors with minimum usage
    const candidateColors = COURSE_COLORS.filter(color =>
      colorUsage[color] === minUsage
    );

    // Select a random color from candidates
    const randomIndex = Math.floor(Math.random() * candidateColors.length);
    return candidateColors[randomIndex];
  } catch (error) {
    console.error("Error selecting course color:", error);
    // Fallback to a random color if there's an error
    const COURSE_COLORS = [
      '#911DD2', '#7310A8', '#FF5F68', '#D94D54', '#4DBEFF',
      '#3A9BD4', '#18BF69', '#139954', '#FBC14E', '#D9A53F',
      '#D21D91', '#5FFFC8', '#FF944D', '#BF181D', '#4E9CFB'
    ];
    const randomIndex = Math.floor(Math.random() * COURSE_COLORS.length);
    return COURSE_COLORS[randomIndex];
  }
};


const COURSE_COLORS = [
  '#911DD2', // Purple Base
  '#A94FE0', // Purple Light
  '#C283ED', // Purple Lighter
  '#D8B1F5', // Purple Pastel
  '#7310A8', // Purple Dark
  '#FF5F68', // Coral Red Base
  '#FF8389', // Coral Light
  '#FFA9AD', // Coral Lighter
  '#FFCBCD', // Coral Pastel
  '#D94D54', // Coral Dark
  '#4DBEFF', // Sky Blue Base
  '#80D2FF', // Sky Light
  '#B3E6FF', // Sky Lighter
  '#D6F2FF', // Sky Pastel
  '#3A9BD4', // Sky Dark
  '#18BF69', // Emerald Green Base
  '#46D28B', // Emerald Light
  '#7FE7B1', // Emerald Lighter
  '#B1F3D2', // Emerald Pastel
  '#139954', // Emerald Dark
  '#FBC14E', // Golden Yellow Base
  '#FDD278', // Golden Light
  '#FEE6A8', // Golden Lighter
  '#FFF4CE', // Golden Pastel
  '#D9A53F', // Golden Dark
  '#D21D91', // Purple Complement
  '#5FFFC8', // Coral Complement
  '#FF944D', // Sky Complement
  '#BF181D', // Emerald Complement
  '#4E9CFB'  // Golden Complement
];

export const getNextGroupColor = async () => {
  try {
    // Get all existing groups
    const groupsRef = ref(database, 'groups');
    const groupsSnapshot = await get(groupsRef);
    const groups = [];

    if (groupsSnapshot.exists()) {
      const groupsData = groupsSnapshot.val();
      Object.keys(groupsData).forEach(key => {
        groups.push({
          id: key,
          ...groupsData[key]
        });
      });
    }

    // Count color usage
    const colorUsage = {};
    COURSE_COLORS.forEach(color => {
      colorUsage[color] = 0;
    });

    // Count how many times each color is used
    groups.forEach(group => {
      if (group.color && colorUsage[group.color] !== undefined) {
        colorUsage[group.color]++;
      }
    });

    // Find the minimum usage count
    let minUsage = Number.MAX_SAFE_INTEGER;
    Object.values(colorUsage).forEach(count => {
      if (count < minUsage) {
        minUsage = count;
      }
    });

    // Get all colors with minimum usage
    const candidateColors = COURSE_COLORS.filter(color =>
      colorUsage[color] === minUsage
    );

    // Select a random color from candidates
    const randomIndex = Math.floor(Math.random() * candidateColors.length);
    return candidateColors[randomIndex];

  } catch (error) {
    console.error("Error selecting group color:", error);
    // Fallback to a random color if there's an error
    const randomIndex = Math.floor(Math.random() * COURSE_COLORS.length);
    return COURSE_COLORS[randomIndex];
  }
};

export const getOrCreateGroupRecord = async (groupName, mode = 'Unknown') => {
  try {
    if (!groupName || groupName.trim() === '') {
      throw new Error("Group name is empty or null. Import cannot proceed without a valid group name (e.g., G1, A2, etc.)");
    }

    // Clean up and normalize the group name
    const normalizedGroupName = groupName.trim();

    // Log the input parameters for debugging
    console.log(`Creating/getting group: ${normalizedGroupName}, mode: ${mode}`);

    // Check if group record exists
    const groups = await getAllRecords('groups');
    const existingGroup = groups.find(g => g.name === normalizedGroupName);

    if (existingGroup) {
      console.log(`Found existing group: ${existingGroup.name} with ID ${existingGroup.id}`);
      return existingGroup;
    }

    // Detect group type based on the naming pattern
    let groupType = 'G'; // Default type

    // Type G: Starts with G followed by numbers (default)
    if (/^G\d+/i.test(normalizedGroupName)) {
      groupType = 'G'; // Gruppenunterricht
    }
    // Type A: Starts with A followed by numbers
    else if (/^A\d+/i.test(normalizedGroupName)) {
      groupType = 'A'; // Aussprachetraining
    }
    // Type M: Starts with M followed by numbers
    else if (/^M\d+/i.test(normalizedGroupName)) {
      groupType = 'M'; // 1 on 1 groups
    }
    // Type P: Starts with P followed by numbers
    else if (/^P\d+/i.test(normalizedGroupName)) {
      groupType = 'P'; // Prüfungsvorbereitung
    }

    // Get a color for the new group
    const groupColor = await getNextGroupColor();

    // Create new group record with color and type
    // IMPORTANT: Use the mode parameter that was passed in instead of hardcoding "Unknown"
    const newGroupData = {
      name: normalizedGroupName,
      courseIds: [],
      color: groupColor,
      mode: mode, // This should now correctly use the passed mode
      type: groupType,
      createdAt: new Date().toISOString()
    };

    console.log(`Creating new group with data:`, newGroupData);
    const newGroup = await createRecord('groups', newGroupData);
    console.log(`Created new group: ${newGroup.name} with ID ${newGroup.id}`);

    return newGroup;
  } catch (error) {
    console.error("Error creating group record:", error);
    throw error; // Instead of creating a fallback group, throw the error
  }
};



export const normalizeTeacherName = (name) => {
  // Check if name is a string, if not convert or provide default
  if (typeof name !== 'string') {
    console.warn(`Teacher name is not a string: ${name}. Converting to string.`);
    // Convert to string if possible, or use default value
    name = name ? String(name) : '';
  }

  return name
    .trim()
    .toLowerCase()
    // Normalize Unicode to handle different character encodings consistently
    .normalize('NFC')
    // Collapse multiple spaces into single spaces
    .replace(/\s+/g, ' ')
    // Remove leading/trailing spaces again after space normalization
    .trim();
};

// More aggressive normalization for finding similar names
const normalizeForComparison = (name) => {
  if (typeof name !== 'string') {
    name = name ? String(name) : '';
  }

  return name
    .trim()
    .toLowerCase()
    // Normalize Unicode
    .normalize('NFD')
    // Remove diacritics/accents for comparison only
    .replace(/[\u0300-\u036f]/g, '')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
};

export const createTeacherRecord = async (teacherName) => {
  try {
    // Handle Excel numeric values (dates, times, etc.)
    if (typeof teacherName === 'number') {
      // Check if it's a time value (between 0 and 1)
      if (teacherName > 0 && teacherName < 1) {
        console.warn(`Rejected Excel time value as teacher name: ${teacherName}`);
        return null;
      }

      // Check if it's likely a date value
      if (teacherName > 40000 && teacherName < 50000) {
        console.warn(`Rejected Excel date value as teacher name: ${teacherName}`);
        return null;
      }

      // For other numbers, convert to string
      teacherName = String(teacherName);
    }

    // Skip empty or invalid teacher names
    if (!teacherName || typeof teacherName !== 'string' || teacherName.trim() === '') {
      console.warn("Empty or invalid teacher name, skipping record creation");
      return null;
    }

    // Normalize the teacher name for storage (preserves Vietnamese characters)
    const normalizedName = normalizeTeacherName(teacherName);
    
    // Normalize for comparison (removes diacritics for matching)
    const normalizedForComparison = normalizeForComparison(teacherName);

    // Reject if after normalization it's empty or just digits
    if (normalizedName === '' || /^\d+(\.\d+)?$/.test(normalizedName)) {
      console.warn(`Rejected invalid teacher name after normalization: "${normalizedName}"`);
      return null;
    }

    // Check if teacher already exists using both exact and fuzzy matching
    const teachers = await getAllRecords('teachers');
    
    // First try exact match (preserving characters)
    let existingTeacher = teachers.find(t =>
      normalizeTeacherName(t.name) === normalizedName
    );

    // If no exact match, try fuzzy matching (without diacritics)
    if (!existingTeacher) {
      existingTeacher = teachers.find(t =>
        normalizeForComparison(t.name) === normalizedForComparison
      );
      
      if (existingTeacher) {
        console.log(`Found similar teacher: "${existingTeacher.name}" matches "${teacherName}" (fuzzy match)`);
      }
    }

    if (existingTeacher) {
      return existingTeacher;
    }

    // Create new teacher with normalized name (preserving original formatting)
    const cleanedName = teacherName.trim().replace(/\s+/g, ' ');
    
    return await createRecord('teachers', {
      name: cleanedName,
      country: '', // Default country
      courseIds: [] // Will be updated when courses are created
    });
  } catch (error) {
    console.error("Error creating teacher record:", error);
    throw error;
  }
};


export const createOrUpdateStudentRecord = async (studentName, studentInfo = '', courseId, courseGroupId) => {
  try {
    // Get the course group
    const groupRecord = courseGroupId ? await getRecordById('groups', courseGroupId) : null;
    const groupPrefix = groupRecord ? groupRecord.name : null;

    // Get all students
    const students = await getAllRecords('students');

    // Normalize the incoming student name for comparison
    const normalizedName = studentName.trim();
    const nameParts = normalizedName.split(/[-|]/)[0].trim().toLowerCase();

    // Find existing student with similar name but only if they're in a course with the same group
    const existingStudent = await findStudentInSameGroup(students, nameParts, groupPrefix, courseGroupId);

    if (existingStudent) {
      // Update the student's courseIds to include the new course if it doesn't already
      let courseIds = existingStudent.courseIds || [];
      if (!courseIds.includes(courseId)) {
        courseIds.push(courseId);

        // Update the student record with the new course
        await updateRecord('students', existingStudent.id, {
          courseIds: courseIds,
          // Preserve existing info or use new info if existing is empty
          info: existingStudent.info || studentInfo
        });
      }

      return existingStudent;
    }

    // Create new student if not found
    return await createRecord('students', {
      name: studentName,
      info: studentInfo,
      courseIds: [courseId],
      notes: '',
      joinDates: {}
    });
  } catch (error) {
    console.error("Error creating/updating student record:", error);
    throw error;
  }
};

// Helper function to find a student in the same group
const findStudentInSameGroup = async (students, nameParts, groupPrefix, groupId) => {
  if (!groupPrefix && !groupId) return null;

  // Get all courses to check for group matches
  const courses = await getAllRecords('courses');

  // Create a map of courseIds to their group prefixes/IDs
  const courseGroups = {};
  courses.forEach(course => {
    // Use groupId if available
    courseGroups[course.id] = course.groupId;
  });

  // Find students that have at least one course with the same group
  return students.find(student => {
    // Check if student has any courses with the same group
    const hasMatchingGroup = student.courseIds && student.courseIds.some(
      courseId => courseGroups[courseId] === groupId
    );

    if (!hasMatchingGroup) return false;

    // If student is in same group, then check name match
    const existingNameLower = student.name.toLowerCase();
    const existingNameParts = existingNameLower.split(/[-|]/)[0].trim();

    // Match case 1: Base name is the same (ignoring group suffix or additional info)
    return nameParts === existingNameParts ||
      existingNameLower.includes(nameParts) ||
      nameParts.includes(existingNameParts);
  });
};

export const getOrCreateMonthRecord = async (date) => {
  try {
    if (!date) return null;

    // Extract year and month from date string (format: DD.MM.YYYY)
    const parts = date.split('.');
    if (parts.length !== 3) return null;

    const year = parts[2];
    const month = parts[1];
    const monthId = `${year}-${month}`;

    // Check if month record exists
    const monthRecord = await getRecordById('months', monthId);

    if (monthRecord) {
      return monthRecord;
    }

    // Create new month record
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const monthName = `${monthNames[parseInt(month) - 1]} ${year}`;


    const newMonth = {
      id: monthId,
      name: monthName,
      year: year,
      month: month, // Store the month number for easier sorting
      sessionCount: 0,
      courseIds: [],
      teacherIds: [],
      statistics: {
        attendanceRate: 0,
        sessionCount: 0
      }
    };

    // Instead of createRecord which generates a random ID, use set with the custom ID
    await set(ref(database, `months/${monthId}`), newMonth);
    return newMonth;
  } catch (error) {
    console.error("Error creating month record:", error);
    throw error;
  }
};

export const findExistingCourse = async (groupName, level) => {
  try {
    // Get the group first
    const group = await getOrCreateGroupRecord(groupName);
    if (!group) return null;

    // Get the course
    const courseRef = ref(database, 'courses');
    const coursesSnapshot = await get(courseRef);

    let existingCourse = null;
    let latestSessionDate = null;

    if (coursesSnapshot.exists()) {
      const courses = coursesSnapshot.val();

      for (const courseId in courses) {
        const course = courses[courseId];

        if (course.groupId === group.id && course.level === level) {
          // Ensure course has all required properties with defaults
          existingCourse = {
            id: courseId,
            ...course,
            // Add defaults for potentially missing properties
            sessionIds: course.sessionIds || [],
            studentIds: course.studentIds || [],
            teacherIds: course.teacherIds || []
          };

          // Find the latest session date
          if (existingCourse.sessionIds && existingCourse.sessionIds.length > 0) {
            // Get all sessions for this course
            const sessionPromises = existingCourse.sessionIds.map(sessionId =>
              get(ref(database, `sessions/${sessionId}`))
            );

            const sessionSnapshots = await Promise.all(sessionPromises);

            // Find the latest date among all sessions
            sessionSnapshots.forEach(snapshot => {
              if (snapshot.exists()) {
                const session = snapshot.val();
                if (session.date) {
                  if (!latestSessionDate || new Date(session.date.split('.').reverse().join('-')) >
                    new Date(latestSessionDate.split('.').reverse().join('-'))) {
                    latestSessionDate = session.date;
                  }
                }
              }
            });
          }

          // Add the latest session date to the course object
          existingCourse.latestSessionDate = latestSessionDate || 'No sessions recorded';
          break;
        }
      }
    }

    return existingCourse;
  } catch (error) {
    console.error('Error finding existing course:', error);
    return null;
  }
};
