# Teacher Management Features

## Overview
The database Teachers tab now includes comprehensive teacher management capabilities, including duplicate detection, merging, deletion, and **name editing** functionality.

## Features

### 🔍 Duplicate Detection
- Automatically identifies teachers with identical names
- Highlights duplicate teachers with red borders and "(DUPLICATE)" labels
- Shows duplicate count in alert banner
- Toggle between showing all teachers or only duplicates

### ✏️ Teacher Name Editing
1. **Start Editing**: Click the edit icon (✏️) on any teacher card
2. **Edit Name**: Type the new name in the inline input field
3. **Save/Cancel**: 
   - Press **Enter** or click **Save** (✓) to save changes
   - Press **Escape** or click **Cancel** (✗) to discard changes
4. **Validation**: Empty names are rejected with an error message
5. **Auto-refresh**: Teacher cache and duplicate detection update automatically

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

### Editing Teacher Names
```
1. Click the edit icon (✏️) on a teacher card
2. Type the corrected name in the input field
3. Press Enter or click the save button (✓)
4. Or press Escape or click cancel (✗) to abort
```

### For Duplicate Teachers
1. Navigate to Database → Teachers tab
2. Look for the duplicate alert banner
3. Optionally click "Nur Duplikate anzeigen" to filter
4. **Option 1**: Edit one of the duplicate names to make them unique
5. **Option 2**: Use the merge functionality to consolidate duplicates

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

### Name Editing
- **Input Validation**: Prevents empty names and trims whitespace
- **Keyboard Shortcuts**: Enter to save, Escape to cancel
- **Visual Feedback**: Green border and "(BEARBEITUNG)" indicator during editing
- **Cache Refresh**: Automatic teacher cache invalidation after updates
- **Conflict Prevention**: Disables other actions during editing

### Database Operations
- **Merge**: Updates courses, sessions, and teacher records atomically
- **Delete**: Removes all references before deleting the teacher record
- **Update**: Uses dedicated `updateTeacher()` function with cache refresh
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
- Immediate visual feedback during editing

## Debug Tools

### Console Functions
Available in browser console:
```javascript
// Debug specific teacher by name
debugTeacher('Teacher Name')

// Show all duplicate teachers
logDuplicateTeachers()

// Update teacher programmatically
updateTeacher('teacher-id', { name: 'New Name', country: 'Germany' })
```

### Visual Indicators
- 🔴 Red border: Duplicate teachers
- 🔵 Blue border: Selected for merge
- 🟢 Green border: Currently being edited
- ⚪ Loading overlay: Operation in progress
- 🏷️ Labels: "(DUPLICATE)", "(AUSGEWÄHLT)", "(BEARBEITUNG)"

## Safety Features

### Confirmation Dialogs
- Delete confirmation with course count warning
- Merge confirmation with teacher selection choice
- Clear indication of irreversible actions

### Edit Protection
- One teacher editable at a time
- Merge mode disabled during editing
- Input validation prevents empty names
- Easy cancel with Escape key or button

### Error Handling
- Try-catch blocks around all database operations
- User-friendly error messages
- Graceful fallback on operation failure

### Data Validation
- Checks for teacher existence before operations
- Validates course and session references
- Ensures cache consistency after changes

## Best Practices

### Name Editing
1. Use consistent naming conventions (e.g., "Firstname Lastname")
2. Avoid special characters that might cause issues
3. Check for duplicates after editing names
4. Use proper capitalization and spacing

### Before Merging
1. Review both teacher records carefully
2. Check course assignments and counts
3. Choose the teacher with the most complete/accurate data
4. Consider editing names first if they're just typos

### After Operations
1. Verify the operation completed successfully
2. Check that duplicate alerts are updated
3. Test related functionality (course views, etc.)
4. Look for any remaining inconsistencies

### Maintenance
- Regularly check for new duplicates after data imports
- Standardize teacher names during editing
- Use debug tools to investigate data inconsistencies
- Monitor console for any operation errors

## Common Workflows

### Fixing Duplicate Names
1. **Typo Fix**: If names are similar (e.g., "John Smith" vs "John Smth"), edit the incorrect one
2. **Same Person**: If both entries represent the same person, use merge functionality
3. **Different People**: If they're actually different people with the same name, add distinguishing information

### Bulk Name Cleanup
1. Filter to show only duplicates
2. Edit obvious typos first
3. Merge confirmed duplicates
4. Verify all changes took effect

## Error Recovery

If an operation fails:
1. Check browser console for detailed error messages
2. Refresh the page to reset state
3. Try the operation again
4. Contact support if errors persist

## Related Files
- `src/features/utils/teacherFetchUtils.js` - Core functions (merge/delete/update)
- `src/features/database/tabs/TeachersTab.jsx` - UI implementation with editing
- `src/features/database/hooks/useDataFetching.jsx` - Data management
- `src/features/courses/CourseContent.jsx` - Duplicate name display fix
- `src/features/styles/Content.css` - Styling for edit interface 