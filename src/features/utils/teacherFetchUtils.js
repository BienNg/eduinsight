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