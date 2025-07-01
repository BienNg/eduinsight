// src/features/utils/teacherFetchUtils.js
import { getAllRecords } from '../firebase/database';

// Cache for teachers - this should persist between renders
let teacherCache = {};
let lastFetchTime = 0;
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
let fetchPromise = null; // Add a promise to track ongoing fetches

/**
 * Gets all teachers, with caching to improve performance
 * @returns {Promise<Object>} Object mapping teacher IDs to teacher data
 */
export const getTeachersMap = async (forceRefresh = false) => {
  const now = Date.now();
  
  // If there's an ongoing fetch, wait for it instead of starting a new one
  if (fetchPromise) {
    await fetchPromise;
    return teacherCache;
  }
  
  // If the cache has expired or a refresh is forced, fetch new data
  if (forceRefresh || Object.keys(teacherCache).length === 0 || now - lastFetchTime > CACHE_EXPIRY) {
    try {
      // Store the fetch promise to prevent duplicate requests
      fetchPromise = (async () => {
        console.log('Starting teacher cache refresh');
        // Fetch all teachers in a single request
        const teachers = await getAllRecords('teachers');
        
        // Build the cache as a map of id -> teacher
        const newCache = {};
        teachers.forEach(teacher => {
          if (teacher && teacher.id) {
            newCache[teacher.id] = teacher;
          }
        });
        
        // Update the cache and last fetch time
        teacherCache = newCache;
        lastFetchTime = now;
        
        console.log('Teacher cache refreshed with', Object.keys(teacherCache).length, 'teachers');
      })();
      
      await fetchPromise;
      fetchPromise = null; // Clear the promise when done
    } catch (error) {
      console.error('Error refreshing teacher cache:', error);
      fetchPromise = null; // Clear the promise on error
      
      // If this is the first fetch and it failed, return an empty object
      if (Object.keys(teacherCache).length === 0) {
        return {};
      }
      // Otherwise, continue using the existing cache
    }
  }
  
  return teacherCache;
};

/**
 * Get teachers by their IDs, using the cached data when possible
 * @param {Array} teacherIds - Array of teacher IDs
 * @returns {Promise<Array>} Array of teacher objects
 */
export const getTeachersByIds = async (teacherIds) => {
  if (!teacherIds || !Array.isArray(teacherIds) || teacherIds.length === 0) {
    return [];
  }
  
  try {
    // Get the teacher map, which will fetch data if needed
    const teachersMap = await getTeachersMap();
    
    // Return teachers in the same order as the IDs
    return teacherIds.map(id => teachersMap[id]).filter(Boolean);
  } catch (error) {
    console.error('Error fetching teachers by IDs:', error);
    return [];
  }
};

/**
 * Identifies duplicate teachers by name
 * @returns {Promise<Object>} Object mapping teacher names to arrays of teacher records
 */
export const findDuplicateTeachers = async () => {
  try {
    const teachersMap = await getTeachersMap();
    const teachers = Object.values(teachersMap);
    
    // Group teachers by normalized name
    const teachersByName = {};
    
    teachers.forEach(teacher => {
      const normalizedName = teacher.name.trim().toLowerCase();
      if (!teachersByName[normalizedName]) {
        teachersByName[normalizedName] = [];
      }
      teachersByName[normalizedName].push(teacher);
    });
    
    // Filter to only return groups with duplicates
    const duplicates = {};
    Object.entries(teachersByName).forEach(([name, teacherList]) => {
      if (teacherList.length > 1) {
        duplicates[name] = teacherList;
      }
    });
    
    return duplicates;
  } catch (error) {
    console.error('Error finding duplicate teachers:', error);
    return {};
  }
};

/**
 * Logs duplicate teachers to console for debugging
 */
export const logDuplicateTeachers = async () => {
  const duplicates = await findDuplicateTeachers();
  
  if (Object.keys(duplicates).length === 0) {
    console.log('✅ No duplicate teachers found');
    return;
  }
  
  console.log('⚠️ Duplicate teachers found:');
  Object.entries(duplicates).forEach(([name, teacherList]) => {
    console.log(`\n📚 Teachers named "${name}":`);
    teacherList.forEach(teacher => {
      console.log(`  - ID: ${teacher.id}, Name: "${teacher.name}", Courses: ${teacher.courseIds?.length || 0}`);
    });
  });
};

/**
 * Debug function to investigate a specific teacher name
 * Usage: debugTeacher('Đài Trang')
 */
export const debugTeacher = async (teacherName) => {
  try {
    const teachersMap = await getTeachersMap();
    const teachers = Object.values(teachersMap);
    
    const normalizedSearchName = teacherName.trim().toLowerCase();
    
    // Find all teachers with matching or similar names
    const matchingTeachers = teachers.filter(teacher => {
      const normalizedTeacherName = teacher.name.trim().toLowerCase();
      return normalizedTeacherName.includes(normalizedSearchName) || normalizedSearchName.includes(normalizedTeacherName);
    });
    
    console.log(`🔍 Debug results for teacher name: "${teacherName}"`);
    console.log(`📊 Found ${matchingTeachers.length} matching teacher(s):`);
    
    matchingTeachers.forEach((teacher, index) => {
      console.log(`\n${index + 1}. Teacher Details:`);
      console.log(`   - ID: ${teacher.id}`);
      console.log(`   - Name: "${teacher.name}"`);
      console.log(`   - Country: ${teacher.country || 'N/A'}`);
      console.log(`   - Course IDs: [${(teacher.courseIds || []).join(', ')}]`);
      console.log(`   - Number of Courses: ${teacher.courseIds?.length || 0}`);
    });
    
    // Also check courses that reference this teacher
    console.log(`\n🔗 Checking course references...`);
    const { getAllRecords } = await import('../firebase/database');
    const courses = await getAllRecords('courses');
    
    const coursesWithThisTeacher = courses.filter(course => {
      const hasInTeacherId = matchingTeachers.some(teacher => course.teacherId === teacher.id);
      const hasInTeacherIds = course.teacherIds && matchingTeachers.some(teacher => course.teacherIds.includes(teacher.id));
      return hasInTeacherId || hasInTeacherIds;
    });
    
    console.log(`📚 Found ${coursesWithThisTeacher.length} course(s) referencing these teachers:`);
    coursesWithThisTeacher.forEach(course => {
      console.log(`   - Course: ${course.name} (ID: ${course.id})`);
      console.log(`     • teacherId: ${course.teacherId || 'none'}`);
      console.log(`     • teacherIds: [${(course.teacherIds || []).join(', ')}]`);
    });
    
    return {
      searchName: teacherName,
      matchingTeachers,
      coursesWithThisTeacher
    };
  } catch (error) {
    console.error('Error debugging teacher:', error);
    return null;
  }
};

/**
 * Merge two teachers - moves all courses and sessions from secondary to primary teacher
 * @param {string} primaryTeacherId - The teacher to keep
 * @param {string} secondaryTeacherId - The teacher to merge and delete
 * @returns {Promise<boolean>} Success status
 */
export const mergeTeachers = async (primaryTeacherId, secondaryTeacherId) => {
  try {
    console.log(`Starting merge of teacher ${secondaryTeacherId} into ${primaryTeacherId}`);

    const { getRecordById, getAllRecords, updateRecord, deleteRecord } = await import('../firebase/database');

    // Get both teacher records
    const primaryTeacher = await getRecordById('teachers', primaryTeacherId);
    const secondaryTeacher = await getRecordById('teachers', secondaryTeacherId);

    if (!primaryTeacher || !secondaryTeacher) {
      throw new Error("One or both teachers not found");
    }

    // 1. Merge course IDs
    const primaryCourseIds = primaryTeacher.courseIds || [];
    const secondaryCourseIds = secondaryTeacher.courseIds || [];
    const mergedCourseIds = [...new Set([...primaryCourseIds, ...secondaryCourseIds])];

    // 2. Update primary teacher with merged course IDs
    await updateRecord('teachers', primaryTeacherId, {
      courseIds: mergedCourseIds,
      // Preserve primary teacher's name and country, but merge course data
    });

    // 3. Update all courses to replace secondaryTeacherId with primaryTeacherId
    for (const courseId of secondaryCourseIds) {
      const course = await getRecordById('courses', courseId);
      if (course) {
        const updates = {};
        
        // Update teacherId field
        if (course.teacherId === secondaryTeacherId) {
          updates.teacherId = primaryTeacherId;
        }
        
        // Update teacherIds array
        if (course.teacherIds && Array.isArray(course.teacherIds)) {
          const updatedTeacherIds = course.teacherIds.map(id => 
            id === secondaryTeacherId ? primaryTeacherId : id
          );
          // Remove duplicates
          updates.teacherIds = [...new Set(updatedTeacherIds)];
        }
        
        // Apply updates if any
        if (Object.keys(updates).length > 0) {
          await updateRecord('courses', courseId, updates);
        }
      }
    }

    // 4. Update all sessions to replace secondaryTeacherId with primaryTeacherId
    const sessions = await getAllRecords('sessions');
    for (const session of sessions) {
      if (session.teacherId === secondaryTeacherId) {
        await updateRecord('sessions', session.id, { teacherId: primaryTeacherId });
      }
    }

    // 5. Delete the secondary teacher
    await deleteRecord('teachers', secondaryTeacherId);

    // 6. Force refresh teacher cache
    await getTeachersMap(true);

    console.log(`Successfully merged teacher ${secondaryTeacherId} into ${primaryTeacherId}`);
    return true;
  } catch (error) {
    console.error("Error merging teachers:", error);
    throw error;
  }
};

/**
 * Delete a teacher and clean up all references
 * @param {string} teacherId - The teacher ID to delete
 * @returns {Promise<boolean>} Success status
 */
export const deleteTeacher = async (teacherId) => {
  try {
    console.log(`Starting deletion of teacher ${teacherId}`);

    const { getRecordById, getAllRecords, updateRecord, deleteRecord } = await import('../firebase/database');

    // Get teacher record
    const teacher = await getRecordById('teachers', teacherId);
    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // 1. Remove teacher from all courses
    if (teacher.courseIds && teacher.courseIds.length > 0) {
      for (const courseId of teacher.courseIds) {
        const course = await getRecordById('courses', courseId);
        if (course) {
          const updates = {};
          
          // Clear teacherId field if it matches
          if (course.teacherId === teacherId) {
            updates.teacherId = null;
          }
          
          // Remove from teacherIds array
          if (course.teacherIds && Array.isArray(course.teacherIds)) {
            updates.teacherIds = course.teacherIds.filter(id => id !== teacherId);
          }
          
          // Apply updates if any
          if (Object.keys(updates).length > 0) {
            await updateRecord('courses', courseId, updates);
          }
        }
      }
    }

    // 2. Remove teacher from all sessions
    const sessions = await getAllRecords('sessions');
    for (const session of sessions) {
      if (session.teacherId === teacherId) {
        await updateRecord('sessions', session.id, { teacherId: null });
      }
    }

    // 3. Delete the teacher record
    await deleteRecord('teachers', teacherId);

    // 4. Force refresh teacher cache
    await getTeachersMap(true);

    console.log(`Successfully deleted teacher ${teacherId}`);
    return true;
  } catch (error) {
    console.error("Error deleting teacher:", error);
    throw error;
  }
};

// Make debug functions available globally for console debugging
if (typeof window !== 'undefined') {
  window.debugTeacher = debugTeacher;
  window.logDuplicateTeachers = logDuplicateTeachers;
  console.log('🛠️ Teacher debug functions available: debugTeacher("name"), logDuplicateTeachers()');
}