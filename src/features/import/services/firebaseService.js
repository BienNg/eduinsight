import { ref, push, set, get, update, remove, query, orderByChild, equalTo } from "firebase/database";
import { database } from "../../firebase/config";
import { createRecord, updateRecord, getAllRecords, getRecordById } from '../../firebase/database';

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

  export const createOrUpdateStudentRecord = async (studentName, studentInfo = '', courseId) => {
    try {
      // Get all students
      const students = await getAllRecords('students');
  
      // Normalize the incoming student name for comparison
      const normalizedName = studentName.trim();
      const nameParts = normalizedName.split(/[-|]/)[0].trim().toLowerCase();
  
      // Find existing student with similar name
      const existingStudent = students.find(s => {
        // Check for exact match first
        if (s.name === studentName) return true;
  
        // Then check for pattern matches
        const existingNameLower = s.name.toLowerCase();
        const existingNameParts = existingNameLower.split(/[-|]/)[0].trim();
  
        // Match case 1: Base name is the same (ignoring group suffix or additional info)
        return nameParts === existingNameParts ||
          existingNameLower.includes(nameParts) ||
          nameParts.includes(existingNameParts);
      });
  
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

  export const findExistingCourse = async (group, level) => {
    try {
      // Get the course first
      const courseRef = ref(database, 'courses');
      const coursesSnapshot = await get(courseRef);
      
      let existingCourse = null;
      let latestSessionDate = null;
      
      if (coursesSnapshot.exists()) {
        const courses = coursesSnapshot.val();
        
        for (const courseId in courses) {
          const course = courses[courseId];
          
          if (course.group === group && course.level === level) {
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
  