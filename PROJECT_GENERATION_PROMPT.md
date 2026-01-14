# Pro TimeFlow - Complete Project Generation Prompt

## Project Overview

Create a comprehensive time tracking and project management system called "Pro TimeFlow" using modern web technologies. This is a professional-grade application designed for teams to track time, manage projects, and handle approval workflows.

## Technology Stack

**Frontend:**
- React 18.3.1 with TypeScript
- Vite 5.4.1 as build tool
- React Router DOM 6.26.2 for routing
- TanStack React Query 5.56.2 for data fetching
- Tailwind CSS 3.4.11 for styling
- shadcn/ui components with Radix UI primitives
- Lucide React for icons
- React Hook Form 7.53.0 with Zod 3.23.8 validation
- Date-fns 3.6.0 for date manipulation
- React Day Picker 8.10.1 for date selection
- Sonner for toast notifications
- Recharts 2.12.7 for data visualization

**Development Tools:**
- ESLint 9.9.0 for code linting
- TypeScript 5.5.3
- PostCSS and Autoprefixer
- Tailwind CSS Animate plugin

## Core Features

### 1. Authentication & User Management
- Role-based access control with three roles: employee, manager, owner
- User profiles with job titles, billable rates, and available hours
- Local storage-based authentication system
- Protected routes based on user roles

### 2. Time Tracking System
- **Weekly Time Tracker**: Main component for logging time entries
- **Daily/Weekly/Monthly Views**: Multiple calendar views for time tracking
- **Clock In/Out functionality**: Track actual work hours
- **Break time tracking**: Monitor break durations
- **Billable vs Non-billable hours**: Separate tracking for billing purposes
- **Task descriptions**: Detailed task logging with project/product/department associations

### 3. Project Management
- **Projects**: Create and manage projects with client information
- **Project Levels**: Hierarchical project structure with levels, tasks, and subtasks
- **Products**: Product-based time tracking with stages and tasks
- **Departments**: Department-based organization with functions and duties
- **Project Types**: Fixed Cost, Time and Material, Full Time Employed

### 4. Team Management
- **Team Creation**: Create teams with members and leaders
- **Team Associations**: Link teams to projects, products, and departments
- **Member Management**: Add/remove team members with roles
- **Team Permissions**: Role-based access within teams

### 5. Approval Workflow
- **Time Entry Approval**: Managers can approve/reject time entries
- **Approval History**: Track all approval actions with timestamps
- **Status Management**: Pending, approved, rejected statuses
- **Notification System**: Automatic notifications for status changes

### 6. Reporting & Analytics
- **Time Reports**: Comprehensive time tracking reports
- **Project Analytics**: Project-based time analysis
- **Team Performance**: Team member productivity reports
- **Billable Hours Tracking**: Revenue tracking through billable hours
- **Data Visualization**: Charts and graphs using Recharts

### 7. Notification System
- **Real-time Notifications**: System notifications for important events
- **Reminder Service**: Daily and weekly time entry reminders
- **Notification Types**: Status changes, approvals, rejections, reminders
- **Read/Unread Status**: Track notification read status

## Data Models

### User
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'employee' | 'manager' | 'owner';
  jobTitle: JobTitle;
  billableRate?: number;
  availableHours: number;
  totalBillableHours: number;
}
```

### TimeEntry
```typescript
interface TimeEntry {
  id: string;
  userId: string;
  userName: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  breakTime?: number;
  actualHours: number;
  billableHours: number;
  task: string;
  projectDetails: ProjectDetail;
  isBillable: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}
```

### Project
```typescript
interface Project {
  id: string;
  name: string;
  description: string;
  projectType: 'Fixed Cost' | 'Time and Material' | 'Full Time Employed';
  clientName: string;
  clientEmail: string;
  levels: ProjectLevel[];
  isBillable: boolean;
  department?: string;
  associatedProducts?: string[];
  createdBy: string;
  createdAt: string;
}
```

### Team
```typescript
interface Team {
  id: string;
  name: string;
  description?: string;
  memberIds: string[];
  leaderId?: string;
  associatedProjects: string[];
  associatedProducts: string[];
  associatedDepartments: string[];
  createdBy: string;
  createdAt: string;
}
```

## Application Structure

### File Organization
```
src/
├── components/
│   ├── ui/           # shadcn/ui components
│   ├── dashboard/    # Dashboard layout and sidebar
│   ├── users/        # User-related components
│   ├── notifications/ # Notification components
│   ├── auth/         # Authentication components
│   └── landing/      # Landing page components
├── pages/            # Main application pages
├── services/         # API and storage services
├── hooks/            # Custom React hooks
├── contexts/         # React contexts
├── validation/       # TypeScript interfaces and validation
├── lib/              # Utility libraries
├── utils/            # Helper functions
├── config/           # Configuration files
└── store/            # State management
```

### Key Components

1. **WeeklyTimeTracker**: Main time tracking component with calendar views
2. **DashboardLayout**: Application layout with collapsible sidebar
3. **Sidebar**: Navigation with role-based menu items
4. **TimeTracker**: Real-time clock in/out functionality
5. **Timesheet**: Time entry management and editing
6. **Projects**: Project management interface
7. **Teams**: Team management and member assignment
8. **ApprovalWorkflow**: Time entry approval system
9. **Reports**: Analytics and reporting dashboard
10. **Notifications**: Notification center

## UI/UX Design

### Design System
- **Theme**: Dark/light mode support with system preference detection
- **Color Palette**: Custom CSS variables for consistent theming
- **Typography**: Tailwind CSS typography plugin
- **Components**: shadcn/ui component library with Radix UI primitives
- **Animations**: Tailwind CSS animations and transitions
- **Responsive**: Mobile-first responsive design

### Key UI Features
- **Collapsible Sidebar**: Space-efficient navigation
- **Card-based Layout**: Clean, organized information display
- **Modal Dialogs**: Contextual actions and forms
- **Toast Notifications**: User feedback and alerts
- **Data Tables**: Sortable and filterable data display
- **Calendar Views**: Multiple time tracking perspectives
- **Form Validation**: Real-time form validation with error messages

## State Management

### Local Storage
- **Time Entries**: Persistent time entry data
- **Projects**: Project and task definitions
- **Teams**: Team configurations and memberships
- **Notifications**: User notification history
- **Approval History**: Time entry approval records

### React State
- **User Context**: Current user and authentication state
- **Settings Context**: Application settings and preferences
- **Query Client**: TanStack React Query for data fetching
- **Local State**: Component-specific state management

## Routing Structure

```typescript
/                    # Dashboard (redirects to /tracker)
/login              # Authentication page
/tracker            # Time tracking interface
/timesheet          # Time entry management
/projects           # Project management
/teams              # Team management
/approval           # Approval workflow
/reports            # Analytics and reports
/notifications      # Notification center
/settings           # User settings
```

## Role-Based Permissions

### Employee
- View and edit own time entries
- Submit time entries for approval
- View assigned projects and tasks
- Receive notifications

### Manager
- All employee permissions
- View team member time entries
- Approve/reject time entries
- Manage projects and teams
- View team reports

### Owner
- All manager permissions
- Edit others' time entries
- View billable rates
- Full system access
- Re-approve rejected entries

## Development Setup

### Package.json Scripts
```json
{
  "dev": "vite",
  "build": "vite build",
  "build:dev": "vite build --mode development",
  "lint": "eslint .",
  "preview": "vite preview"
}
```

### Configuration Files
- **vite.config.ts**: Vite configuration with path aliases
- **tailwind.config.ts**: Tailwind CSS with custom theme
- **tsconfig.json**: TypeScript configuration
- **eslint.config.js**: ESLint rules and configuration
- **postcss.config.js**: PostCSS plugins

## Key Implementation Details

### Authentication System
- Local storage-based user management
- Default users for testing (employee, manager, owner)
- Role-based route protection
- Automatic logout on session expiry

### Time Tracking Logic
- Weekly calendar view with daily breakdowns
- Project/product/department associations
- Billable vs non-billable hour calculations
- Break time tracking and deduction
- Status management (pending/approved/rejected)

### Data Persistence
- LocalStorage for all application data
- Automatic data initialization with sample data
- Data export/import capabilities
- Backup and restore functionality

### Performance Optimizations
- React Query for efficient data fetching
- Memoized components for performance
- Lazy loading for large datasets
- Optimized re-renders with proper dependencies

## Sample Data

Include default data for:
- 3 default users (employee, manager, owner)
- Sample projects with levels and tasks
- Sample products with stages
- Sample departments with functions
- Sample teams with members
- Sample time entries for testing

## Testing Considerations

- Role-based access testing
- Time entry validation
- Approval workflow testing
- Data persistence testing
- Responsive design testing
- Cross-browser compatibility

## Deployment

- Vite build optimization
- Static file hosting ready
- Environment variable configuration
- Production build optimization

This prompt should generate a complete, functional Pro TimeFlow application with all the specified features, proper TypeScript types, modern React patterns, and a professional UI/UX design.
