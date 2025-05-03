// src/features/firebase/changelog.js
import { ref, push, query, orderByChild, get, limitToLast } from "firebase/database";
import { database } from "./config";

export const logDatabaseChange = async (data) => {
    try {
        const changelogRef = ref(database, 'changelog');
        const timestamp = new Date().toISOString();
        const day = timestamp.split('T')[0]; // YYYY-MM-DD format

        // Ensure all required fields exist with defaults
        const logEntry = {
            timestamp,
            day,
            filename: data.filename || 'Unknown File',
            addedAt: timestamp,
            coursesAdded: data.coursesAdded || 0,
            sessionsAdded: data.sessionsAdded || 0,
            monthsAffected: Array.isArray(data.monthsAffected) ? data.monthsAffected : [],
            studentsAdded: data.studentsAdded || 0,
            teachersAdded: data.teachersAdded || 0,
            type: data.type || 'import'
        };

        // Log the entry being saved (helpful for debugging)
        console.log("Saving changelog entry:", logEntry);

        const newEntryRef = await push(changelogRef, logEntry);
        console.log("Changelog entry saved with ID:", newEntryRef.key);

        return { id: newEntryRef.key, ...logEntry };
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
        if (!snapshot.exists()) {
            console.log("No changelog entries found in database");
            return [];
        }

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
        // Special handling for missing index error
        if (error.message && error.message.includes("Index not defined")) {
            console.error(
                "Firebase index error: You need to add an index for 'timestamp' in your database rules.",
                "\nAdd this to your Firebase rules:",
                '\n{\n  "rules": {\n    "changelog": {\n      ".indexOn": ["timestamp"]\n    }\n  }\n}'
            );

            // Fallback implementation without ordering
            try {
                // Try to get data without ordering
                const unorderedRef = ref(database, 'changelog');
                const unorderedSnapshot = await get(unorderedRef);

                if (!unorderedSnapshot.exists()) return [];

                const unorderedLogs = [];
                unorderedSnapshot.forEach((childSnapshot) => {
                    unorderedLogs.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });

                // Sort manually using the timestamp field
                return unorderedLogs.sort((a, b) => {
                    // Defensive coding in case timestamp is missing
                    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                    return timeB - timeA; // Descending order (newest first)
                });
            } catch (fallbackError) {
                console.error("Fallback retrieval also failed:", fallbackError);
                return [];
            }
        } else {
            console.error("Error fetching changelog:", error);
            return [];
        }
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