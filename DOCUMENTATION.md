# TimeFlow - Time Tracking System Documentation

## Overview
TimeFlow is a comprehensive time tracking and project management system designed for organizations to track employee work hours, manage projects, and handle approval workflows. The system supports multiple user roles with different permission levels and provides detailed reporting capabilities.

## Features & Functionalities

### 🔐 Authentication & User Management
- **Multi-role system**: Owner, Manager, Employee
- **User profiles** with job titles and billable rates
- **Available hours tracking** per user
- **Role-based permissions** controlling feature access

### ⏰ Time Tracking System

#### Time Entry Methods
1. **Simple Entry Form** (1st Approach)
   - Single time entry with project/product/department selection
   - Automatic billable status determination
   - Task description with available hours tracking

2. **Daily Tracker Form** (Advanced)
   - Multiple project entries per day
   - Real-time hour calculations
   - Hierarchical project structure (Levels → Tasks → Subtasks)
   - Break time management
   - Billable/non-billable hour tracking

3. **Weekly Time Tracker**
   - Week-view time entry interface
   - Bulk entry capabilities

4. **Monthly Time Tracker**
   - Month-view time tracking
   - Monthly summary reports

#### Time Entry Features
- **Project categorization**: Projects, Products, Departments
- **Hierarchical task structure**:
  - Projects: Levels → Tasks → Subtasks
  - Products: Stages → Tasks → Subtasks  
  - Departments: Functions → Duties → Tasks
- **Automatic billable calculation** based on project/product/department settings
- **Edit and delete** pending entries
- **Time validation** and hour limits

### 📊 Timesheet Management
- **View all time entries** with filtering and search
- **Status tracking**: Pending, Approved, Rejected
- **Summary statistics**:
  - Total actual hours vs billable hours
  - Daily averages
  - Overtime calculations
  - Days worked tracking
- **Export functionality** to CSV
- **Date range filtering**
- **Employee/project/billable filtering**

### 🏗️ Project & Task Management

#### Project Types
1. **Projects**
   - Multi-level task hierarchy
   - Billable/non-billable designation
   - Created by tracking

2. **Products**
   - Stage-based workflow
   - Task and subtask management
   - Product lifecycle tracking

3. **Departments**
   - Function-based organization
   - Duty and task assignments
   - Department-specific workflows

#### Management Features
- **Create, edit, delete** projects/products/departments
- **Search and filter** capabilities
- **Task hierarchy visualization**
- **Creator and creation date tracking**

### 👥 Team Management
- **Team creation and management**
- **Member assignment** to teams
- **Project/product/department association** with teams
- **Team member statistics**
- **Role-based team views**
- **Team deletion** with confirmation

### ✅ Approval Workflow
- **Pending entry review** for managers/owners
- **Approve/reject functionality** with comments
- **Approval history tracking**
- **Status change notifications**
- **Bulk approval capabilities**
- **Approval statistics dashboard**

### 📈 Reports & Analytics

#### Member Reports
- **Individual user statistics**:
  - Actual vs available hours
  - Billable hours tracking  
  - Entry counts (approved/pending)
  - Performance metrics

#### Team Reports
- **Team-specific analytics**
- **Project association tracking**
- **Team member performance**
- **Date range filtering**
- **Export capabilities**

#### System-Wide Metrics
- **Overtime calculations**
- **Department/project performance**
- **Billable vs non-billable ratios**
- **Approval workflow statistics**

### 🔔 Notification System

#### Daily Reminders
- **6 PM reminder** if no time entry logged for the day
- **Automatic reminder generation**
- **User-specific notifications**

#### Approval Notifications
- **Status change notifications** (approved/rejected)
- **Notification bell** with unread count
- **Mark as read functionality**
- **Notification history**

#### Notification Features
- **Real-time notification bell**
- **Unread notification tracking**
- **Notification categorization** (daily, approval, rejection)
- **Mark all as read** capability
- **Search and filter** notifications

### 🛡️ Role-Based Permissions

#### Employee Permissions
- Create and edit own time entries
- View own timesheet
- Receive notifications

#### Manager Permissions
- All employee permissions
- View all timesheets
- Approve/reject time entries
- Manage teams
- View billable rates

#### Owner Permissions
- All manager permissions
- Manage projects/products/departments
- Delete any entries
- Full system access
- User management

### 🔍 Search & Filtering
- **Global search** across projects, tasks, employees
- **Advanced filtering** by:
  - Date ranges
  - Project/product/department
  - Status (pending/approved/rejected)
  - Employee
  - Billable/non-billable
  - Team assignments

### 📤 Export & Data Management
- **CSV export** functionality
- **Date range exports**
- **Filtered data exports**
- **User-specific exports**
- **Team report exports**

### 🎨 User Interface Features
- **Responsive design** for desktop and mobile
- **Dark/light theme support**
- **Intuitive dashboard** with summary cards
- **Interactive tables** with sorting and pagination
- **Modal dialogs** for forms and confirmations
- **Toast notifications** for user feedback
- **Loading states** and error handling

## Technical Architecture

### Data Management
- **Local storage** for data persistence
- **JSON-based** data structures
- **Hierarchical data organization**
- **Data validation** and type safety

### Component Structure
- **Modular React components**
- **Reusable UI components**
- **Form validation** with error handling
- **State management** with React hooks

### Security Features
- **Role-based access control**
- **Data validation** on all inputs
- **Secure authentication** handling
- **Permission checking** on all operations

## Usage Workflows

### Daily Time Tracking Workflow
1. User logs in to system
2. Navigates to Time Tracker
3. Selects project/product/department
4. Chooses appropriate levels/stages/functions
5. Selects tasks and subtasks
6. Enters hours and descriptions
7. Submits for approval

### Manager Approval Workflow
1. Manager receives notification of pending entries
2. Reviews entries in Approval Workflow
3. Adds approval/rejection comments
4. Approves or rejects entries
5. Employees receive status notifications

### Reporting Workflow
1. Managers/owners access Reports section
2. Select date ranges and filters
3. Review team/individual performance
4. Export data for external analysis
5. Use insights for resource planning

### Project Management Workflow
1. Owners/managers create projects/products/departments
2. Define hierarchical task structures
3. Set billable/non-billable status
4. Assign to teams
5. Monitor usage through reports

This comprehensive system provides organizations with complete time tracking, project management, and workforce analytics capabilities while maintaining security and user-friendly interfaces across all user roles.
