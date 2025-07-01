# Teacher Management Features

## Overview
The database Teachers tab now includes comprehensive teacher management capabilities, including duplicate detection, merging, and deletion functionality.

## Features

### 🔍 Duplicate Detection
- Automatically identifies teachers with identical names
- Highlights duplicate teachers with red borders and "(DUPLICATE)" labels
- Shows duplicate count in alert banner
- Toggle between showing all teachers or only duplicates

### 🔗 Teacher Merging
1. **Activate Merge Mode**: Click "Lehrer zusammenführen" button
2. **Select Teachers**: Click on exactly 2 teachers to merge
3. **Choose Primary**: Confirm dialog asks which teacher to keep
4. **Automatic Cleanup**: 
   - Merges course assignments
   - Updates all sessions to reference the primary teacher
   - Updates course `teacherId` and `teacherIds` fields
   - Deletes the secondary teacher record
   - Refreshes teacher cache

### 🗑️ Teacher Deletion
- Individual delete buttons (trash icon) on each teacher card
- Confirmation dialog with warning if teacher has active courses
- **Complete Cleanup**:
  - Removes teacher from all course records
  - Clears teacher assignments from all sessions
  - Deletes teacher record
  - Refreshes teacher cache

## Usage Instructions

### For Duplicate Teachers
1. Navigate to Database → Teachers tab
2. Look for the duplicate alert banner
3. Optionally click "Nur Duplikate anzeigen" to filter
4. Use the merge functionality to consolidate duplicates

### Merging Process
```
1. Click "Lehrer zusammenführen"
2. Select exactly 2 teachers by clicking on their cards
3. Click "Zusammenführen (2/2)" button
4. Choose which teacher name/data to keep in the confirmation dialog
5. Wait for the merge to complete
```

### Safe Deletion
```
1. Hover over a teacher card
2. Click the trash icon (🗑️)
3. Confirm the deletion in the dialog
4. Teacher and all references are removed
```

## Technical Implementation

### Database Operations
- **Merge**: Updates courses, sessions, and teacher records atomically
- **Delete**: Removes all references before deleting the teacher record
- **Validation**: Checks for active courses and warns users

### Data Integrity
- Uses transactions where possible
- Refreshes cache after operations
- Validates teacher existence before operations
- Handles both `teacherId` (single) and `teacherIds` (array) fields

### Performance
- Leverages cached teacher data for fast duplicate detection
- Bulk operations for course and session updates
- Minimal UI re-renders during operations

## Debug Tools

### Console Functions
Available in browser console:
```javascript
// Debug specific teacher by name
debugTeacher('Teacher Name')

// Show all duplicate teachers
logDuplicateTeachers()
```

### Visual Indicators
- 🔴 Red border: Duplicate teachers
- 🔵 Blue border: Selected for merge
- ⚪ Loading overlay: Operation in progress
- 🏷️ Labels: "(DUPLICATE)", "(AUSGEWÄHLT)"

## Safety Features

### Confirmation Dialogs
- Delete confirmation with course count warning
- Merge confirmation with teacher selection choice
- Clear indication of irreversible actions

### Error Handling
- Try-catch blocks around all database operations
- User-friendly error messages
- Graceful fallback on operation failure

### Data Validation
- Checks for teacher existence before operations
- Validates course and session references
- Ensures cache consistency after changes

## Best Practices

### Before Merging
1. Review both teacher records carefully
2. Check course assignments and counts
3. Choose the teacher with the most complete/accurate data

### After Operations
1. Verify the operation completed successfully
2. Check that duplicate alerts are updated
3. Test related functionality (course views, etc.)

### Maintenance
- Regularly check for new duplicates after data imports
- Use debug tools to investigate data inconsistencies
- Monitor console for any operation errors

## Error Recovery

If an operation fails:
1. Check browser console for detailed error messages
2. Refresh the page to reset state
3. Try the operation again
4. Contact support if errors persist

## Related Files
- `src/features/utils/teacherFetchUtils.js` - Core merge/delete functions
- `src/features/database/tabs/TeachersTab.jsx` - UI implementation
- `src/features/database/hooks/useDataFetching.jsx` - Data management
- `src/features/courses/CourseContent.jsx` - Duplicate name display fix 