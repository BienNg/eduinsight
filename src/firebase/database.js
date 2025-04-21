// src/firebase/database.js
import { ref, push, set, get, update, remove, query, orderByChild, equalTo } from "firebase/database";
import { database } from "./config";

// Create a new record in any collection
export const createRecord = async (path, data) => {
  try {
    const newRecordRef = push(ref(database, path));
    await set(newRecordRef, { id: newRecordRef.key, ...data });
    return { id: newRecordRef.key, ...data };
  } catch (error) {
    console.error(`Error creating record in ${path}:`, error);
    throw error;
  }
};

// Get a record by ID from any collection
export const getRecordById = async (path, id) => {
  try {
    const snapshot = await get(ref(database, `${path}/${id}`));
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error(`Error getting record from ${path}:`, error);
    throw error;
  }
};

// Get all records from a collection
export const getAllRecords = async (path) => {
  try {
    const snapshot = await get(ref(database, path));
    return snapshot.exists() ? Object.values(snapshot.val()) : [];
  } catch (error) {
    console.error(`Error getting all records from ${path}:`, error);
    throw error;
  }
};

// Update a record in any collection
export const updateRecord = async (path, id, data) => {
  try {
    await update(ref(database, `${path}/${id}`), data);
    return { id, ...data };
  } catch (error) {
    console.error(`Error updating record in ${path}:`, error);
    throw error;
  }
};

// Delete a record from any collection
export const deleteRecord = async (path, id) => {
  try {
    await remove(ref(database, `${path}/${id}`));
    return true;
  } catch (error) {
    console.error(`Error deleting record from ${path}:`, error);
    throw error;
  }
};

// Query records by field in any collection
export const queryRecordsByField = async (path, field, value) => {
  try {
    const recordsQuery = query(
      ref(database, path),
      orderByChild(field),
      equalTo(value)
    );
    const snapshot = await get(recordsQuery);
    return snapshot.exists() ? Object.values(snapshot.val()) : [];
  } catch (error) {
    console.error(`Error querying records in ${path}:`, error);
    throw error;
  }
};