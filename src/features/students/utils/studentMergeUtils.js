// src/features/students/utils/studentMergeUtils.js
import { mergeStudents } from '../../firebase/database';

export const handleMergeStudents = async (currentStudentId, selectedStudentId, onSuccess, onError) => {
  if (!selectedStudentId) return;

  try {
    await mergeStudents(currentStudentId, selectedStudentId);
    
    if (onSuccess) {
      onSuccess();
    }
    
    return true;
  } catch (error) {
    console.error("Error merging students:", error);
    
    if (onError) {
      onError(error.message);
    }
    
    return false;
  }
};