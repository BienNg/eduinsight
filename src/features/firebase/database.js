// src/firebase/database.js
import { ref, push, set, get, update, remove, query, orderByChild, equalTo } from "firebase/database";
import { database } from "./config";

// Create a new record in any collection
export const createRecord = async (path, data) => {
  try {
    const newRecordRef = push(ref(database, path));
    await set(newRecordRef, { id: newRecordRef.key, ...data });
    return { id: newRecordRef.key, ...data };
  } catch (error) {
    console.error(`Error creating record in ${path}:`, error);
    throw error;
  }
};

// Get a record by ID from any collection
export const getRecordById = async (path, id) => {
  try {
    const snapshot = await get(ref(database, `${path}/${id}`));
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error(`Error getting record from ${path}:`, error);
    throw error;
  }
};

// Get all records from a collection
export const getAllRecords = async (path) => {
  try {
    const snapshot = await get(ref(database, path));
    return snapshot.exists() ? Object.values(snapshot.val()) : [];
  } catch (error) {
    console.error(`Error getting all records from ${path}:`, error);
    throw error;
  }
};

// Update a record in any collection
export const updateRecord = async (path, id, data) => {
  try {
    await update(ref(database, `${path}/${id}`), data);
    return { id, ...data };
  } catch (error) {
    console.error(`Error updating record in ${path}:`, error);
    throw error;
  }
};

// Delete a record with cascade cleanup
export const deleteRecord = async (path, id) => {
  try {
    // Store the record before deletion to check relationships
    let recordToDelete = null;
    if (path === 'courses') {
      recordToDelete = await getRecordById(path, id);
    }
    
    // Perform the standard deletion
    await remove(ref(database, `${path}/${id}`));
    
    // If we deleted a course, update student relationships
    if (path === 'courses' && recordToDelete && recordToDelete.studentIds) {
      // Update each student's courseIds list
      for (const studentId of recordToDelete.studentIds) {
        const student = await getRecordById('students', studentId);
        if (student && student.courseIds) {
          const updatedCourseIds = student.courseIds.filter(cId => cId !== id);
          await updateRecord('students', studentId, { courseIds: updatedCourseIds });
        }
      }
      
      // After updating students, run the cleanup
      await cleanupOrphanedStudents();
    }

    // If we deleted a course, cleanup orphan teachers
    if (path === 'courses' && recordToDelete && recordToDelete.teacherIds) {
      await cleanupOrphanTeachers(recordToDelete.teacherIds);
    }
    
    // If we're deleting a session or course, check for empty months
    if (path === 'sessions' || path === 'courses') {
      await cleanupEmptyMonths();
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting record:", error);
    throw error;
  }
};

// Check and delete months with no sessions
export const cleanupEmptyMonths = async () => {
  try {
    const months = await getAllRecords('months');

    for (const month of months) {
      // Skip months without an ID
      if (!month.id) continue;

      // If sessionCount is 0 or courseIds is empty, delete the month
      if ((month.sessionCount === 0 || !month.sessionCount) ||
        (!month.courseIds || month.courseIds.length === 0)) {
        console.log(`Deleting empty month: ${month.id} (${month.name || 'Unnamed'})`);
        await remove(ref(database, `months/${month.id}`));
      }
    }
  } catch (error) {
    console.error("Error cleaning up empty months:", error);
  }
};

// Remove a session from a month and potentially delete the month if empty
export const removeSessionFromMonth = async (sessionId, monthId) => {
  try {
    // Get the month record
    const month = await getRecordById('months', monthId);
    if (!month) {
      throw new Error(`Month with ID ${monthId} not found`);
    }

    // Decrement the sessionCount
    const sessionCount = (month.sessionCount || 1) - 1;

    // Update the month record
    await updateRecord('months', monthId, { sessionCount });

    // If the month has no more sessions, delete it
    if (sessionCount <= 0) {
      console.log(`Month ${month.name} has no more sessions, deleting...`);
      await remove(ref(database, `months/${monthId}`));
    }

    return true;
  } catch (error) {
    console.error("Error removing session from month:", error);
    throw error;
  }
};

// Check and delete students with no courses
export const cleanupOrphanedStudents = async () => {
  try {
    console.log("Checking for orphaned students to clean up...");
    const studentsSnapshot = await get(ref(database, 'students'));

    if (!studentsSnapshot.exists()) {
      console.log("No students found in database");
      return;
    }

    const studentsData = studentsSnapshot.val();

    for (const studentId in studentsData) {
      const student = studentsData[studentId];

      // More robust check for empty courseIds
      const hasCourses = student.courseIds &&
        Array.isArray(student.courseIds) &&
        student.courseIds.filter(id => id).length > 0;

      if (!hasCourses) {
        console.log(`Deleting orphaned student: ${studentId} (${student.name || 'Unnamed'})`);
        await remove(ref(database, `students/${studentId}`));
      }
    }

    console.log("Completed orphaned student cleanup");
  } catch (error) {
    console.error("Error cleaning up orphaned students:", error);
  }
};

// Call this after deleting all sessions of the course
const cleanupOrphanTeachers = async (teacherIds) => {
  const sessions = await getAllRecords('sessions');
  for (const teacherId of teacherIds) {
    // Check if any session still references this teacher
    const hasSessions = sessions.some(session => session.teacherId === teacherId);
    if (!hasSessions) {
      // No sessions left, delete the teacher
      await remove(ref(database, `teachers/${teacherId}`));
      console.log(`Deleted teacher ${teacherId} as they have no sessions left.`);
    }
  }
};

export const cleanupEmptyGroups = async () => {
  try {
    console.log("Checking for empty groups to clean up...");
    const groups = await getAllRecords('groups');

    for (const group of groups) {
      // Skip groups without an ID
      if (!group.id) continue;

      // Check if courseIds is empty or undefined
      if (!group.courseIds || group.courseIds.length === 0) {
        console.log(`Deleting empty group: ${group.id} (${group.name || 'Unnamed'})`);
        await remove(ref(database, `groups/${group.id}`));
      }
    }
    
    console.log("Completed empty group cleanup");
  } catch (error) {
    console.error("Error cleaning up empty groups:", error);
  }
};

// Remove a student from a course
export const removeStudentFromCourse = async (studentId, courseId) => {
  try {
    // Get the student record
    const student = await getRecordById('students', studentId);
    if (!student) {
      throw new Error(`Student with ID ${studentId} not found`);
    }

    // Update the student's courseIds array
    const courseIds = student.courseIds || [];
    const updatedCourseIds = courseIds.filter(id => id !== courseId);

    // Update the student record
    await updateRecord('students', studentId, { courseIds: updatedCourseIds });

    // If the student has no more courses, delete the student
    if (updatedCourseIds.length === 0) {
      console.log(`Student ${student.name} has no more courses, deleting...`);
      await remove(ref(database, `students/${studentId}`));
    }

    // Also update the course's studentIds array
    const course = await getRecordById('courses', courseId);
    if (course) {
      const studentIds = course.studentIds || [];
      const updatedStudentIds = studentIds.filter(id => id !== studentId);
      await updateRecord('courses', courseId, { studentIds: updatedStudentIds });
    }

    return true;
  } catch (error) {
    console.error("Error removing student from course:", error);
    throw error;
  }
};

// Query records by field in any collection
export const queryRecordsByField = async (path, field, value) => {
  try {
    const recordsQuery = query(
      ref(database, path),
      orderByChild(field),
      equalTo(value)
    );
    const snapshot = await get(recordsQuery);
    return snapshot.exists() ? Object.values(snapshot.val()) : [];
  } catch (error) {
    console.error(`Error querying records in ${path}:`, error);
    throw error;
  }
};

// Add to src/firebase/database.js
export const mergeStudents = async (primaryStudentId, secondaryStudentId) => {
  try {
    console.log(`Starting merge of student ${secondaryStudentId} into ${primaryStudentId}`);
    
    // Get both student records
    const primaryStudent = await getRecordById('students', primaryStudentId);
    const secondaryStudent = await getRecordById('students', secondaryStudentId);
    
    if (!primaryStudent || !secondaryStudent) {
      throw new Error("One or both students not found");
    }
    
    // 1. Merge course IDs
    const primaryCourseIds = primaryStudent.courseIds || [];
    const secondaryCourseIds = secondaryStudent.courseIds || [];
    const mergedCourseIds = [...new Set([...primaryCourseIds, ...secondaryCourseIds])];
    
    // 2. Update primary student with merged data
    await updateRecord('students', primaryStudentId, {
      courseIds: mergedCourseIds,
      // Merge join dates
      joinDates: { ...(primaryStudent.joinDates || {}), ...(secondaryStudent.joinDates || {}) },
      // Keep notes from both students if they exist
      notes: primaryStudent.notes ? 
        (secondaryStudent.notes ? 
          `${primaryStudent.notes}\n\nMerged notes from ${secondaryStudent.name}:\n${secondaryStudent.notes}` : 
          primaryStudent.notes) : 
        (secondaryStudent.notes || '')
    });
    
    // 3. Update all sessions to replace secondaryStudentId with primaryStudentId in attendance
    const sessions = await getAllRecords('sessions');
    for (const session of sessions) {
      if (session.attendance && session.attendance[secondaryStudentId]) {
        // Copy attendance data from second student to primary student
        const updatedAttendance = { ...session.attendance };
        updatedAttendance[primaryStudentId] = updatedAttendance[secondaryStudentId];
        delete updatedAttendance[secondaryStudentId];
        
        // Update the session record
        await updateRecord('sessions', session.id, { attendance: updatedAttendance });
      }
    }
    
    // 4. Update all courses to replace secondaryStudentId with primaryStudentId
    for (const courseId of secondaryCourseIds) {
      const course = await getRecordById('courses', courseId);
      if (course && course.studentIds) {
        const studentIds = course.studentIds;
        // If primary student not already in this course, add them
        if (!studentIds.includes(primaryStudentId)) {
          studentIds.push(primaryStudentId);
        }
        // Remove secondary student
        const updatedStudentIds = studentIds.filter(id => id !== secondaryStudentId);
        
        // Update the course record
        await updateRecord('courses', courseId, { studentIds: updatedStudentIds });
      }
    }
    
    // 5. Delete the secondary student
    await deleteRecord('students', secondaryStudentId);
    
    console.log(`Successfully merged student ${secondaryStudentId} into ${primaryStudentId}`);
    return true;
  } catch (error) {
    console.error("Error merging students:", error);
    throw error;
  }
};