// src/features/firebase/changelog.js
import { ref, push, query, orderByChild, get, limitToLast } from "firebase/database";
import { database } from "./config";

export const logDatabaseChange = async (data) => {
  try {
    const changelogRef = ref(database, 'changelog');
    const timestamp = new Date().toISOString();
    const day = timestamp.split('T')[0]; // YYYY-MM-DD format
    
    const logEntry = {
      timestamp,
      day,
      filename: data.filename || '',
      addedAt: timestamp,
      coursesAdded: data.coursesAdded || 0,
      sessionsAdded: data.sessionsAdded || 0,
      monthsAffected: data.monthsAffected || [],
      studentsAdded: data.studentsAdded || 0,
      teachersAdded: data.teachersAdded || 0,
      type: data.type || 'import'
    };
    
    await push(changelogRef, logEntry);
    return logEntry;
  } catch (error) {
    console.error("Error logging change:", error);
    throw error;
  }
};

export const getChangelog = async (limit = 50) => {
  try {
    const changelogRef = query(
      ref(database, 'changelog'),
      orderByChild('timestamp'),
      limitToLast(limit)
    );
    
    const snapshot = await get(changelogRef);
    if (!snapshot.exists()) return [];
    
    const logs = [];
    snapshot.forEach((childSnapshot) => {
      logs.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    
    // Return in reverse chronological order
    return logs.reverse();
  } catch (error) {
    console.error("Error fetching changelog:", error);
    return [];
  }
};

export const searchChangelog = async (query) => {
  try {
    // Get all logs first (could be optimized with proper indexing)
    const allLogs = await getChangelog(500);
    
    // Perform client-side search
    return allLogs.filter(log => {
      const searchableText = `${log.filename} ${log.type} ${log.monthsAffected.join(' ')}`.toLowerCase();
      return searchableText.includes(query.toLowerCase());
    });
  } catch (error) {
    console.error("Error searching changelog:", error);
    return [];
  }
};