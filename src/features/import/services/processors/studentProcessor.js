// src/features/import/services/processors/studentProcessor.js
import { createOrUpdateStudentRecord } from '../firebaseService';

export const extractStudentData = async (headerRow, courseId, groupId) => {
  const students = [];
  const studentNames = [];
  
  // Students typically start from column K (index 10)
  for (let j = 10; j < headerRow.length; j++) {
    const studentName = headerRow[j];
    if (studentName && typeof studentName === 'string' && studentName.trim() !== '') {
      // Skip column headers
      if (studentName === "Anwesenheitsliste" ||
          studentName.includes("Nachrichten von/ für")) {
        continue;
      }

      // Collect the names and column indices
      studentNames.push({
        name: studentName,
        columnIndex: j
      });
    }
  }
  
  // Create/update student records with the course ID available
  for (const studentInfo of studentNames) {
    const studentRecord = await createOrUpdateStudentRecord(
      studentInfo.name, 
      '', 
      courseId, 
      groupId
    );
    
    students.push({
      id: studentRecord.id,
      name: studentRecord.name,
      columnIndex: studentInfo.columnIndex
    });
  }
  
  return students;
};