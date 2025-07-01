// src/components/common/TeacherSelect.jsx
import { useState, useEffect } from 'react';
import { getAllRecords, createRecord, updateRecord } from '../firebase/database';
import { normalizeTeacherName } from '../import/services/firebaseService';
import './TeacherSelect.css';

// More aggressive normalization for finding similar names
const normalizeForComparison = (name) => {
  if (typeof name !== 'string') {
    name = name ? String(name) : '';
  }

  return name
    .trim()
    .toLowerCase()
    // Normalize Unicode
    .normalize('NFD')
    // Remove diacritics/accents for comparison only
    .replace(/[\u0300-\u036f]/g, '')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
};

const TeacherSelect = ({ currentTeacherId, onTeacherChange, courseName }) => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const teachersData = await getAllRecords('teachers');
      setTeachers(teachersData);
    } catch (err) {
      console.error("Error fetching teachers:", err);
      setError("Failed to load teachers.");
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherChange = (e) => {
    const value = e.target.value;
    
    if (value === 'create-new') {
      setShowCreateForm(true);
    } else {
      onTeacherChange(value);
    }
  };

  const handleCreateTeacher = async () => {
    if (!newTeacherName.trim()) {
      setError("Teacher name cannot be empty");
      return;
    }

    try {
      setLoading(true);
      
      // Clean the teacher name (preserve original formatting but clean spaces)
      const cleanedName = newTeacherName.trim().replace(/\s+/g, ' ');
      
      // Normalize for exact matching (preserves Vietnamese characters)
      const normalizedName = normalizeTeacherName(cleanedName);
      
      // Normalize for fuzzy matching (removes diacritics)
      const normalizedForComparison = normalizeForComparison(cleanedName);
      
      // Check if teacher already exists using both exact and fuzzy matching
      let existingTeacher = teachers.find(t =>
        normalizeTeacherName(t.name) === normalizedName
      );

      // If no exact match, try fuzzy matching
      if (!existingTeacher) {
        existingTeacher = teachers.find(t =>
          normalizeForComparison(t.name) === normalizedForComparison
        );
        
        if (existingTeacher) {
          console.log(`Found similar teacher: "${existingTeacher.name}" matches "${cleanedName}" (fuzzy match)`);
        }
      }
      
      if (existingTeacher) {
        onTeacherChange(existingTeacher.id);
        setShowCreateForm(false);
        setNewTeacherName('');
        return;
      }
      
      // Create new teacher
      const newTeacher = await createRecord('teachers', {
        name: cleanedName,
        country: 'Deutschland', // Default
        courseIds: [], // Will be updated by the parent component
      });
      
      // Add to state
      setTeachers(prev => [...prev, newTeacher]);
      
      // Pass to parent
      onTeacherChange(newTeacher.id);
      
      // Reset form
      setShowCreateForm(false);
      setNewTeacherName('');
      setError(null);
      
    } catch (err) {
      console.error("Error creating teacher:", err);
      setError("Failed to create teacher: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setNewTeacherName('');
    setError(null);
  };

  if (loading && teachers.length === 0) {
    return <div className="teacher-select-loading">Loading teachers...</div>;
  }

  return (
    <div className="teacher-select-container">
      {showCreateForm ? (
        <div className="teacher-create-form">
          <input
            type="text"
            value={newTeacherName}
            onChange={(e) => setNewTeacherName(e.target.value)}
            placeholder="Enter teacher name"
            className="teacher-input"
          />
          <div className="teacher-create-actions">
            <button 
              onClick={handleCreateTeacher} 
              disabled={loading || !newTeacherName.trim()}
              className="btn-create"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
            <button onClick={handleCancel} className="btn-cancel">
              Cancel
            </button>
          </div>
          {error && <div className="teacher-error">{error}</div>}
        </div>
      ) : (
        <select 
          value={currentTeacherId || ''} 
          onChange={handleTeacherChange}
          className="teacher-select"
          disabled={loading}
        >
          <option value="">-- Select Teacher --</option>
          {teachers.map(teacher => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.name}
            </option>
          ))}
          <option value="create-new">➕ Create New Teacher</option>
        </select>
      )}
    </div>
  );
};

export default TeacherSelect;