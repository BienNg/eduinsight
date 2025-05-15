// src/features/utils/syncUtils.js
import { fetchGoogleSheet, extractSheetFromWorkbook } from '../import/services/googleSheetsService';
import { processB1CourseFileWithColors } from '../import/services/dataProcessing';
import { toast } from 'sonner';
import { getRecordById } from '../firebase/database';

/**
 * Sync all incomplete courses that have a sourceUrl
 * @param {Array} courses - Array of course objects
 * @param {Function} setIsLoading - Function to update loading state
 * @returns {Promise<Object>} - Results of the sync operation
 */
export const syncIncompleteCourses = async (courses, setIsLoading) => {
  if (!courses || courses.length === 0) {
    return { success: false, message: 'No courses to sync' };
  }

  // Filter courses with sourceUrl
  const coursesWithUrl = courses.filter(course => course.sourceUrl);
  
  if (coursesWithUrl.length === 0) {
    return { success: false, message: 'No courses with source URLs to sync' };
  }

  // Create a unique toast ID
  const toastId = `sync-all-${Date.now()}`;
  
  // Show initial toast
  toast.loading(`Syncing ${coursesWithUrl.length} courses...`, {
    id: toastId,
    duration: Infinity
  });

  setIsLoading(true);
  
  const results = {
    success: 0,
    failed: 0,
    details: []
  };

  try {
    // Process each course with URL
    for (const course of coursesWithUrl) {
      try {
        // Update toast with current course
        toast.loading(`Syncing course: ${course.name}...`, {
          id: toastId,
          duration: Infinity
        });
        
        // Get the group for the course
        const group = course.groupId ? await getRecordById('groups', course.groupId) : null;
        
        // Fetch the Google Sheet
        const sheetData = await fetchGoogleSheet(course.sourceUrl);
        
        // Use the specific sheet associated with this course if available
        let courseSheetData = sheetData.arrayBuffer;
        
        if (course.sheetName && sheetData.isMultiSheet) {
          try {
            courseSheetData = extractSheetFromWorkbook(sheetData.rawWorkbook, course.sheetName);
          } catch (sheetError) {
            console.error(`Sheet "${course.sheetName}" not found, using first sheet instead:`, sheetError);
          }
        }
        
        // Get metadata from course
        const metadata = {
          groupName: group?.name,
          mode: group?.mode,
          level: course.level,
          language: group?.language || '',
          sourceUrl: course.sourceUrl,
          sheetName: course.sheetName,
          sheetIndex: course.sheetIndex
        };
        
        // Process the file with the existing course data
        await processB1CourseFileWithColors(
          courseSheetData,
          `${course.name} (Sync)`,
          {
            metadata: metadata
          }
        );
        
        // Record success
        results.success++;
        results.details.push({
          id: course.id,
          name: course.name,
          status: 'success'
        });
      } catch (error) {
        console.error(`Error syncing course ${course.name}:`, error);
        
        // Record failure
        results.failed++;
        results.details.push({
          id: course.id,
          name: course.name,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    // Show final toast
    const message = results.failed > 0 
      ? `Synced ${results.success} courses, ${results.failed} failed` 
      : `Successfully synced ${results.success} courses`;
      
    if (results.failed > 0) {
      toast.error(message, {
        id: toastId,
        duration: 5000
      });
    } else {
      toast.success(message, {
        id: toastId,
        duration: 5000
      });
    }
    
    return {
      success: true,
      ...results
    };
  } catch (error) {
    console.error('Error in sync process:', error);
    
    toast.error(`Failed to sync courses: ${error.message}`, {
      id: toastId,
      duration: 5000
    });
    
    return {
      success: false,
      message: error.message,
      details: results.details
    };
  } finally {
    setIsLoading(false);
  }
};