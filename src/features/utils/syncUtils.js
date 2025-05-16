// src/features/utils/syncUtils.js
import { fetchGoogleSheet, extractSheetFromWorkbook } from '../import/services/googleSheetsService';
import { processB1CourseFileWithColors } from '../import/services/dataProcessing';
import { toast } from 'sonner';
import { getRecordById } from '../firebase/database';

/**
 * Sync all incomplete courses that have a sourceUrl
 * @param {Array} courses - Array of course objects
 * @param {Function} setIsSyncing - Function to update syncing state
 * @returns {Promise<Object>} - Results of the sync operation
 */
export const syncIncompleteCourses = async (courses, setIsSyncing) => {
  if (!courses || courses.length === 0) {
    toast.error('No courses to sync');
    return { success: false, message: 'No courses to sync' };
  }

  // Filter courses with sourceUrl
  const coursesWithUrl = courses.filter(course => course.sourceUrl);
  
  if (coursesWithUrl.length === 0) {
    toast.error('No courses with source URLs to sync');
    return { success: false, message: 'No courses with source URLs to sync' };
  }

  // Create a unique toast ID
  const toastId = `sync-all-${Date.now()}`;
  
  // Show initial toast
  toast.loading(`Syncing ${coursesWithUrl.length} courses...`, {
    id: toastId,
    duration: Infinity,
    description: 'Starting synchronization process'
  });

  const results = {
    success: 0,
    failed: 0,
    details: []
  };

  try {
    // Process each course with URL
    for (let i = 0; i < coursesWithUrl.length; i++) {
      const course = coursesWithUrl[i];
      const currentPosition = `${i + 1}/${coursesWithUrl.length}`;
      
      try {
        // Update toast with current course and progress
        toast.loading(`Syncing courses (${currentPosition})`, {
          id: toastId,
          duration: Infinity,
          description: `Processing "${course.name}": Preparing...`
        });
        
        // Step 1: Get the group
        toast.loading(`Syncing courses (${currentPosition})`, {
          id: toastId,
          duration: Infinity,
          description: `Processing "${course.name}": Getting group data...`
        });
        
        const group = course.groupId ? await getRecordById('groups', course.groupId) : null;
        
        // Step 2: Fetch Google Sheet
        toast.loading(`Syncing courses (${currentPosition})`, {
          id: toastId,
          duration: Infinity,
          description: `Processing "${course.name}": Fetching Google Sheet...`
        });
        
        const sheetData = await fetchGoogleSheet(course.sourceUrl);
        
        // Step 3: Extract sheet data
        toast.loading(`Syncing courses (${currentPosition})`, {
          id: toastId,
          duration: Infinity,
          description: `Processing "${course.name}": Extracting sheet data...`
        });
        
        // Use the specific sheet associated with this course if available
        let courseSheetData = sheetData.arrayBuffer;
        
        if (course.sheetName && sheetData.isMultiSheet) {
          try {
            courseSheetData = extractSheetFromWorkbook(sheetData.rawWorkbook, course.sheetName);
          } catch (sheetError) {
            console.error(`Sheet "${course.sheetName}" not found, using first sheet instead:`, sheetError);
            
            toast.loading(`Syncing courses (${currentPosition})`, {
              id: toastId,
              duration: Infinity,
              description: `Processing "${course.name}": Sheet "${course.sheetName}" not found, using first sheet...`
            });
          }
        }
        
        // Step 4: Prepare metadata
        toast.loading(`Syncing courses (${currentPosition})`, {
          id: toastId,
          duration: Infinity,
          description: `Processing "${course.name}": Preparing metadata...`
        });
        
        const metadata = {
          groupName: group?.name,
          mode: group?.mode,
          level: course.level,
          language: group?.language || '',
          sourceUrl: course.sourceUrl,
          sheetName: course.sheetName,
          sheetIndex: course.sheetIndex
        };
        
        // Step 5: Process the file with the existing course data
        toast.loading(`Syncing courses (${currentPosition})`, {
          id: toastId,
          duration: Infinity,
          description: `Processing "${course.name}": Importing sessions...`
        });
        
        await processB1CourseFileWithColors(
          courseSheetData,
          `${course.name} (Sync)`,
          {
            metadata: metadata
          }
        );
        
        // Record success
        toast.loading(`Syncing courses (${currentPosition})`, {
          id: toastId,
          duration: Infinity,
          description: `"${course.name}": Successfully updated`
        });
        
        results.success++;
        results.details.push({
          id: course.id,
          name: course.name,
          status: 'success'
        });
      } catch (error) {
        console.error(`Error syncing course ${course.name}:`, error);
        
        // Update toast with error
        toast.loading(`Syncing courses (${currentPosition})`, {
          id: toastId,
          duration: Infinity,
          description: `"${course.name}": Failed - ${error.message.substring(0, 50)}${error.message.length > 50 ? '...' : ''}`
        });
        
        // Record failure
        results.failed++;
        results.details.push({
          id: course.id,
          name: course.name,
          status: 'failed',
          error: error.message
        });
      }
      
      // Brief pause between courses to allow toast to be read
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Show final toast
    const message = results.failed > 0 
      ? `Synced ${results.success} courses, ${results.failed} failed` 
      : `Successfully synced ${results.success} courses`;
      
    if (results.failed > 0) {
      toast.error(message, {
        id: toastId,
        duration: 5000,
        description: results.details
          .filter(d => d.status === 'failed')
          .map(d => `${d.name}: Failed`)
          .join(', ')
      });
    } else {
      toast.success(message, {
        id: toastId,
        duration: 5000,
        description: 'All courses synced successfully'
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
      duration: 5000,
      description: 'An unexpected error occurred during the sync process'
    });
    
    return {
      success: false,
      message: error.message,
      details: results.details
    };
  }
};