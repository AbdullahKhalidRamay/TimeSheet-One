# Data Persistence Implementation

## Overview
The time tracker data is designed to persist across page refreshes and login sessions using localStorage. All time entries are saved to the browser's localStorage and will remain there until explicitly deleted.

## Storage Implementation

### 1. **localStorage Usage**
- **Storage Key**: `timeEntries`
- **Data Format**: JSON array of TimeEntry objects
- **Persistence**: Survives page refreshes, browser restarts, and login/logout cycles

### 2. **Key Functions**

#### **Saving Data**
```typescript
saveTimeEntry(entry: TimeEntry): void
```
- Saves or updates a time entry in localStorage
- Handles both new entries and updates to existing entries
- Includes error handling and logging

#### **Loading Data**
```typescript
getTimeEntries(): TimeEntry[]
```
- Retrieves all time entries from localStorage
- Returns empty array if no data exists
- Includes error handling and logging

#### **Deleting Data**
```typescript
deleteTimeEntry(entryId: string): void
```
- Removes a specific time entry by ID
- Updates localStorage immediately
- Includes error handling and logging

### 3. **Data Flow**

#### **When Saving Time Entries**
1. User enters hours in the time tracker
2. User clicks "Save Weekly Data" button
3. `saveWeeklyData()` function is called
4. For each entry with hours > 0:
   - Creates a `TimeEntry` object
   - Calls `saveTimeEntry()` to store in localStorage
   - Generates unique ID using `generateId()`

#### **When Loading Time Entries**
1. Component mounts or week changes
2. `loadExistingEntries()` function is called
3. `getTimeEntries()` retrieves all entries from localStorage
4. Filters entries for current user and selected week
5. Populates the time tracker interface with saved data

### 4. **Data Structure**

#### **TimeEntry Object**
```typescript
interface TimeEntry {
  id: string;                    // Unique identifier
  userId: string;                // User who created the entry
  userName: string;              // User's display name
  date: string;                  // Date in YYYY-MM-DD format
  actualHours: number;           // Actual hours worked
  billableHours: number;         // Billable hours
  totalHours: number;            // Total hours (actual + billable)
  availableHours: number;        // Available hours for the day
  task: string;                  // Task description
  projectDetails: ProjectDetail; // Project/product/department details
  isBillable: boolean;           // Whether the entry is billable
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
}
```

#### **ProjectDetail Object**
```typescript
interface ProjectDetail {
  category: 'project' | 'product' | 'department';
  name: string;                  // Project/product/department name
  level: string;                 // Level/stage/function
  task: string;                  // Task name
  subtask: string;               // Subtask name
  description: string;           // Detailed description
}
```

## Verification and Debugging

### 1. **Console Logging**
The implementation includes comprehensive logging to help debug data persistence:

- **Storage Operations**: Logs when entries are saved, loaded, or deleted
- **Data Loading**: Logs the number of entries loaded and processed
- **Save Operations**: Logs when save operations start and complete

### 2. **Debug Panel**
In development mode, a debug panel is shown that displays:
- Current user ID
- Number of projects, products, and departments
- Number of entries in weekly data
- Storage statistics button

### 3. **Storage Statistics**
```typescript
getStorageStats(): { totalEntries: number; entriesByUser: Record<string, number> }
```
- Returns total number of entries in localStorage
- Shows breakdown by user ID
- Useful for verifying data persistence

### 4. **Testing Data Persistence**

#### **Step 1: Save Some Data**
1. Enter hours for projects/products/departments
2. Click "Save Weekly Data"
3. Check console for save confirmation logs

#### **Step 2: Verify Data Persistence**
1. Refresh the page (F5 or Ctrl+R)
2. Check console for loading logs
3. Verify that your data is still visible in the time tracker

#### **Step 3: Test Login/Logout**
1. Log out of the application
2. Log back in
3. Navigate to the time tracker
4. Verify that your data is still there

#### **Step 4: Check localStorage**
1. Open browser developer tools (F12)
2. Go to Application/Storage tab
3. Look for "Local Storage" → your domain
4. Find the "timeEntries" key
5. Verify that your data is stored there

## Troubleshooting

### **Data Not Persisting**
1. Check browser console for error messages
2. Verify that localStorage is enabled in your browser
3. Check if the browser is in incognito/private mode (data won't persist)
4. Verify that the save operation completed successfully

### **Data Not Loading**
1. Check console for loading error messages
2. Verify that the user ID matches between save and load
3. Check if the date range includes the saved entries
4. Verify that projects/products/departments are loaded before entries

### **Performance Issues**
1. Large amounts of data in localStorage can cause performance issues
2. Consider implementing data cleanup for old entries
3. Monitor localStorage size in browser developer tools

## Data Cleanup

### **Clear All Data**
```typescript
clearAllTimeEntries(): void
```
- Removes all time entries from localStorage
- Useful for testing or resetting the application

### **Automatic Cleanup**
Consider implementing automatic cleanup for:
- Entries older than a certain date
- Duplicate entries
- Orphaned entries (projects/products/departments that no longer exist)

## Security Considerations

### **localStorage Limitations**
- Data is stored locally in the browser
- Data is not encrypted by default
- Data persists until explicitly cleared
- Data is shared across browser tabs/windows

### **Best Practices**
- Don't store sensitive information in localStorage
- Implement proper user authentication
- Consider data encryption for sensitive data
- Implement data validation before saving

## Future Enhancements

1. **Backup/Restore**: Add functionality to export/import time entries
2. **Data Sync**: Implement cloud storage for data synchronization
3. **Data Compression**: Compress data to reduce localStorage usage
4. **Data Validation**: Add more robust validation before saving
5. **Audit Trail**: Track changes to time entries over time
