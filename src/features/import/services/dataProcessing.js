// src/features/import/services/dataProcessing.js
import { validateExcelFile } from './validators/excelValidator';
import { processCourseData } from './processors/courseProcessor';
import { logDatabaseChange } from '../../firebase/changelog';

// Re-export the validator for direct imports
export { validateExcelFile };

export const processB1CourseFileWithColors = async (arrayBuffer, filename, options) => {
  const { ignoreMissingTimeColumns = false } = options || {};
  
  try {
    // Process the course data using the modular processors
    const courseRecord = await processCourseData(arrayBuffer, filename, {
      ignoreMissingTimeColumns
    });
    
    // Log the database change
    await logDatabaseChange({
      filename,
      coursesAdded: 1,
      sessionsAdded: courseRecord.sessionIds ? courseRecord.sessionIds.length : 0,
      monthsAffected: courseRecord.monthIds ? Array.from(courseRecord.monthIds) : [],
      studentsAdded: courseRecord.studentIds ? courseRecord.studentIds.length : 0,
      teachersAdded: courseRecord.teacherIds ? courseRecord.teacherIds.length : 0,
      type: 'import'
    });

    return {
      ...courseRecord,
      sessionCount: courseRecord.sessionIds ? courseRecord.sessionIds.length : 0
    };
  } catch (error) {
    console.error("Error processing course file:", error);
    throw error;
  }
};