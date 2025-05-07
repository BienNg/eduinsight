// src/features/import/services/dataProcessing.js
import { validateExcelFile } from './validators/excelValidator';
import { processCourseData } from './processors/courseProcessor';
import { logDatabaseChange } from '../../firebase/changelog';

// Make sure to export validateExcelFile
export { validateExcelFile };

export const processB1CourseFileWithColors = async (arrayBuffer, filename, options) => {
  const { ignoreMissingTimeColumns = false, metadata } = options || {};

  try {
    // Process the course data - pass metadata to processCourseData
    const courseRecord = await processCourseData(arrayBuffer, filename, {
      ignoreMissingTimeColumns,
      filename,
      metadata  // Pass metadata through
    });

    // Check if this was an update (presence of updateMessage indicates an update)
    const isUpdate = !!courseRecord.updateMessage;

    // Now handle changelog logging based on whether it was an update or a new course
    await logDatabaseChange({
      filename,
      coursesAdded: isUpdate ? 0 : 1,
      sessionsAdded: isUpdate ? courseRecord.updatedSessionsCount || 0 : (courseRecord.sessionIds ? courseRecord.sessionIds.length : 0),
      monthsAffected: courseRecord.monthIds ? Array.from(courseRecord.monthIds) : [],
      studentsAdded: isUpdate ? 0 : (courseRecord.studentIds ? courseRecord.studentIds.length : 0),
      teachersAdded: isUpdate ? 0 : (courseRecord.teacherIds ? courseRecord.teacherIds.length : 0),
      type: isUpdate ? 'update' : 'import'
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