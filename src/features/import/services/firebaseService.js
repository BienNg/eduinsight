import { ref, push, set, get, update, remove, query, orderByChild, equalTo } from "firebase/database";
import { database } from "../../firebase/config";
import { createRecord, updateRecord, getAllRecords, getRecordById } from '../../firebase/database';

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
      console.error("Group name is empty or null");
      // Create a default group instead of returning null
      return await createRecord('groups', {
        name: "Unknown Group",
        courseIds: [],
        color: await getNextGroupColor(),
        mode: mode,
        type: 'G', // Default type
        createdAt: new Date().toISOString()
      });
    }

    // Rest of your function remains the same...
    // Clean up and normalize the group name
    const normalizedGroupName = groupName.trim();

    // Check if group record exists
    const groups = await getAllRecords('groups');
    const existingGroup = groups.find(g => g.name === normalizedGroupName);

    if (existingGroup) {
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
    const newGroup = await createRecord('groups', {
      name: normalizedGroupName,
      courseIds: [],
      color: groupColor,
      mode: mode,
      type: groupType, // Add the new type property
      createdAt: new Date().toISOString()
    });

    return newGroup;
  } catch (error) {
    console.error("Error creating group record:", error);
    // Even if there's an error, try to return a valid group object
    console.log("Creating fallback group due to error");
    return await createRecord('groups', {
      name: "Error Group",
      courseIds: [],
      color: COURSE_COLORS[0], // Use the first color as fallback
      mode: mode,
      type: 'G', // Default type
      createdAt: new Date().toISOString()
    });
  }
};

export const normalizeTeacherName = (name) => {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/\s+/g, ' '); // Collapse multiple spaces
};

export const createTeacherRecord = async (teacherName) => {
  try {
    // Normalize the teacher name: trim whitespace and convert to title case
    const normalizedName = normalizeTeacherName(teacherName);


    // Check if teacher already exists (case-insensitive search)
    const teachers = await getAllRecords('teachers');
    const existingTeacher = teachers.find(t =>
      normalizeTeacherName(t.name) === normalizedName
    );

    if (existingTeacher) {
      return existingTeacher;
    }

    // Create new teacher with normalized name
    return await createRecord('teachers', {
      name: teacherName.trim(),
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
          existingCourse = { id: courseId, ...course };

          // Find the latest session date
          if (course.sessionIds && course.sessionIds.length > 0) {
            // Get all sessions for this course
            const sessionPromises = course.sessionIds.map(sessionId =>
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
