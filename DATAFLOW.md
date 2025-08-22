# Pro-TimeFlow Application Dataflow

This document describes the data flow within the Pro-TimeFlow application, explaining how data moves between components, services, and storage.

## Overview

Pro-TimeFlow uses a client-side architecture with local storage persistence. The application follows these key data flow patterns:

1. **User Authentication Flow**
2. **Time Entry Management Flow**
3. **Project Management Flow**
4. **Approval Workflow Flow**
5. **Reporting Data Flow**
6. **Context Provider Flow**
7. **React Query Data Flow**
8. **Error Handling Flow**
9. **Component Update Cycle**

## 1. User Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Login Page │◄───▶│  Auth Lib   │◄───▶│Local Storage│
└─────────────┘     └─────────────┘     └─────────────┘
      ▲                    │                   ▲
      │                    ▼                   │
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Logout      │◄───▶│ Protected   │◄───▶│ Current User│
│ Action      │     │   Routes    │     │    Data     │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Process:**
1. User enters credentials on the Login page
2. Auth library validates credentials against stored users
3. On successful login, user data is stored in local storage
4. Protected routes check for current user data
5. User session persists across page refreshes
6. Logout action clears user data from storage

## 2. Time Entry Management Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Time Tracker│◄───▶│ Time Entry  │◄───▶│   Storage   │
│    Page     │     │   Service   │     │   Service   │
└─────────────┘     └─────────────┘     └─────────────┘
      ▲                    │                   │
      │                    ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Timesheet  │◄───▶│ Time Entry  │◄───▶│Local Storage│
│    Page     │     │    Data     │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Reminder   │
                    │  Service    │
                    └─────────────┘
```

**Process:**
1. User creates/edits time entries on Time Tracker page
2. Time Entry Service processes the data (validation, calculations)
3. Storage Service persists data to local storage
4. Time entries are retrieved for display on Timesheet page
5. Reminder Service monitors time entries for notifications
6. Changes in time entries trigger UI updates bidirectionally

## 3. Project Management Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Projects   │◄───▶│   Project   │◄───▶│   Storage   │
│    Page     │     │   Service   │     │   Service   │
└─────────────┘     └─────────────┘     └─────────────┘
      │                    │                   │
      ▼                    ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Department/ │◄───▶│ Project/    │◄───▶│Local Storage│
│ Product Form│     │ Dept/Product│     │             │
└─────────────┘     │    Data     │     └─────────────┘
                    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ Time Entry  │
                    │ Project     │
                    │ Selection   │
                    └─────────────┘
```

**Process:**
1. User creates/edits projects, departments, or products
2. Project Service processes the data (validation, relationships)
3. Storage Service persists data to local storage
4. Projects, departments, and products are available for selection in time entries
5. Hierarchical data (levels, tasks, subtasks) is maintained
6. Changes in project data trigger UI updates bidirectionally

## 4. Approval Workflow Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Employee   │◄───▶│ Time Entry  │◄───▶│   Pending   │
│ Time Entry  │     │ Submission  │     │   Status    │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Manager    │◄───▶│  Approval   │◄───▶│Notification │
│  Review     │     │  Workflow   │     │  Service    │
└─────────────┘     └─────────────┘     └─────────────┘
      │                                        │
      ▼                                        ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Approve/    │────▶│ Updated     │────▶│ Real-time   │
│ Reject      │     │ Time Entry  │     │ Updates     │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Process:**
1. Employee submits time entries for approval
2. Time entries are marked with "pending" status
3. Notification Service alerts managers of pending approvals
4. Managers review time entries on Approval Workflow page
5. Managers approve or reject time entries
6. Time entry status is updated accordingly
7. Real-time updates notify employees of approval status changes

## 5. Reporting Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Reports    │◄───▶│  Reporting  │◄───▶│ Time Entry  │
│    Page     │     │   Service   │     │    Data     │
└─────────────┘     └─────────────┘     └─────────────┘
      │                    │                   │
      ▼                    ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Filtering  │◄───▶│ Aggregation │◄───▶│  Project    │
│  Options    │     │ & Analysis  │     │    Data     │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐     ┌─────────────┐
                    │  Report     │────▶│   Export    │
                    │Visualization│     │    (CSV)    │
                    └─────────────┘     └─────────────┘
```

**Process:**
1. User selects report type and filters on Reports page
2. Reporting Service retrieves time entry and project data
3. Data is aggregated and analyzed based on report type
4. Results are visualized using charts and tables
5. User can export reports to CSV format
6. Filter changes trigger data re-fetching and visualization updates

## 6. Context Provider Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    App      │────▶│ Theme       │────▶│   DOM       │
│  Component  │     │ Provider    │     │  Updates    │
└─────────────┘     └─────────────┘     └─────────────┘
      │                    │                   ▲
      ▼                    ▼                   │
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Settings   │────▶│ Font Size   │────▶│ Component   │
│  Provider   │     │ Settings    │     │ Re-renders  │
└─────────────┘     └─────────────┘     └─────────────┘
      │
      ▼
┌─────────────┐     ┌─────────────┐
│  Query      │────▶│ Global Data │
│  Provider   │     │   State     │
└─────────────┘     └─────────────┘
```

**Process:**
1. App component initializes with provider hierarchy
2. Theme Provider manages light/dark mode preferences
3. Settings Provider manages font size and other UI preferences
4. Query Provider sets up React Query for data fetching
5. Context changes trigger component re-renders
6. DOM updates reflect the new context values
7. User preferences are persisted to local storage

## 7. React Query Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Component  │────▶│ React Query │────▶│   Cache     │
│  Request    │     │   Client    │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
      ▲                    │                   │
      │                    ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Component  │◀────│   Data      │◀────│Local Storage│
│  Re-render  │     │  Updates    │     │   Service   │
└─────────────┘     └─────────────┘     └─────────────┘
      │                    ▲
      ▼                    │
┌─────────────┐     ┌─────────────┐
│  Optimistic │────▶│ Background  │
│  Updates    │     │   Refresh   │
└─────────────┘     └─────────────┘
```

**Process:**
1. Component requests data through React Query hooks
2. React Query checks cache for existing data
3. If data is not in cache or is stale, it fetches from storage service
4. Component renders with available data (cached or fresh)
5. Background refreshes update data without blocking UI
6. Optimistic updates provide immediate feedback
7. Data changes trigger component re-renders

## 8. Error Handling Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Operation  │────▶│   Error     │────▶│ Component   │
│  Failure    │     │  Detection  │     │ Error State │
└─────────────┘     └─────────────┘     └─────────────┘
      │                    │                   │
      ▼                    ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Error     │────▶│    Toast    │────▶│ Error       │
│  Boundary   │     │ Notification│     │ Recovery    │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Process:**
1. Operation fails (data fetch, form submission, etc.)
2. Error is detected at component or service level
3. Component enters error state with appropriate UI feedback
4. Error Boundary catches unhandled errors to prevent app crashes
5. Toast notifications inform users of errors
6. Error recovery mechanisms attempt to restore functionality

## 9. Component Update Cycle

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Data       │────▶│  State      │────▶│ Component   │
│  Change     │     │  Update     │     │ Re-render   │
└─────────────┘     └─────────────┘     └─────────────┘
      ▲                    │                   │
      │                    ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  User       │◀────│ Props       │◀────│ DOM         │
│  Interaction│     │ Propagation │     │ Update      │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ Memoization │
                    │ & Optimiz.  │
                    └─────────────┘
```

**Process:**
1. Data changes occur through user interaction or external updates
2. State updates trigger component re-renders
3. React's reconciliation process determines DOM updates
4. Props propagate changes to child components
5. Memoization prevents unnecessary re-renders
6. DOM updates reflect the new application state
7. User sees and interacts with updated UI

## Data Storage Architecture

Pro-TimeFlow uses a structured local storage approach:

```
LocalStorage
│
├── users                  # User accounts and profiles
├── timeEntries            # Time tracking records
├── projects               # Project definitions and hierarchy
├── departments            # Department definitions and functions
├── products               # Product definitions and stages
├── teams                  # Team definitions and members
├── settings               # Application settings
│   ├── theme              # UI theme preference (light/dark)
│   ├── fontSize           # Font size settings
│   └── notifications      # Notification preferences
└── notifications          # User notifications
```

## State Management

The application uses a combination of:

1. **React Context** for global state (user, settings, theme)
   - ThemeProvider for light/dark mode
   - SettingsProvider for font size and UI preferences
   - QueryClientProvider for React Query configuration

2. **React Query** for data fetching and caching
   - Automatic caching and background refreshes
   - Optimistic updates for better UX
   - Stale data management

3. **Local component state** for UI-specific state
   - Form input values
   - UI toggle states
   - Component-specific data

4. **URL parameters** for page-specific filters and views
   - Date ranges for reports
   - Filter criteria
   - View modes

## Service Layer

Services abstract the data operations:

1. **Storage Service**: Handles all local storage operations
   - CRUD operations for all data models
   - Data serialization and deserialization
   - Storage event handling for cross-tab synchronization

2. **API Service**: Provides a consistent interface for data operations
   - Abstraction over storage service
   - Business logic implementation
   - Data transformation and normalization

3. **Reminder Service**: Manages time-based notifications
   - Timer management for reminders
   - Notification generation
   - User preference-based filtering

4. **Auth Service**: Handles user authentication and session management
   - User authentication
   - Session persistence
   - Role-based access control

## Data Validation

Data validation occurs at multiple levels:

1. **Form validation**: Client-side validation using React Hook Form and Zod
   - Field-level validation rules
   - Form-level validation logic
   - Real-time validation feedback

2. **Service validation**: Business logic validation in service layer
   - Data integrity checks
   - Business rule enforcement
   - Relationship validation

3. **Storage validation**: Type checking before persistence
   - Schema validation
   - Type coercion
   - Default value handling

## Error Handling

Error handling follows this flow:

1. **Component-level errors**: Caught using try/catch or Error Boundaries
   - Prevents cascading failures
   - Provides fallback UI
   - Logs errors for debugging

2. **Service-level errors**: Propagated to UI with appropriate messages
   - Standardized error format
   - Error categorization
   - Recovery suggestions

3. **Form validation errors**: Displayed inline for immediate feedback
   - Field-specific error messages
   - Form submission blocking
   - Accessibility considerations

4. **Critical errors**: Logged and may trigger fallback UI
   - Application state preservation
   - Recovery mechanisms
   - User notification

This document provides a comprehensive overview of the data flow within the Pro-TimeFlow application, helping developers understand how data moves through the system and how the different components interact.