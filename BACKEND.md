# TimeFlow Backend Implementation Guide
*Last Updated: August 7, 2025*

## ASP.NET Core Web API Structure

### Project Structure
```
TimeFlow.API/
├── Controllers/
│   ├── AuthController.cs
│   ├── TimeEntriesController.cs
│   ├── ProjectsController.cs
│   ├── DepartmentsController.cs
│   ├── TeamsController.cs
│   └── UsersController.cs
├── Models/
│   ├── Entities/
│   └── DTOs/
├── Services/
│   ├── Interfaces/
│   └── Implementations/
├── Data/
│   └── TimeFlowDbContext.cs
└── Program.cs
```

## SQL Database Schemas

### Users Table
```sql
CREATE TABLE Users (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Email NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(MAX) NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    Role NVARCHAR(20) NOT NULL,
    JobTitle NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
```

### TimeEntries Table
```sql
CREATE TABLE TimeEntries (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    ProjectId UNIQUEIDENTIFIER NOT NULL,
    Date DATE NOT NULL,
    ActualHours DECIMAL(5,2) NOT NULL,
    BillableHours DECIMAL(5,2) NOT NULL,
    TotalHours DECIMAL(5,2) NOT NULL,
    AvailableHours DECIMAL(5,2) NOT NULL,
    Task NVARCHAR(MAX) NOT NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'pending',
    IsBillable BIT NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    FOREIGN KEY (ProjectId) REFERENCES Projects(Id)
);

CREATE INDEX IX_TimeEntries_UserId ON TimeEntries(UserId);
CREATE INDEX IX_TimeEntries_Date ON TimeEntries(Date);
CREATE INDEX IX_TimeEntries_Status ON TimeEntries(Status);
```

### Projects Table
```sql
CREATE TABLE Projects (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX),
    IsBillable BIT NOT NULL DEFAULT 0,
    Status NVARCHAR(20) NOT NULL DEFAULT 'active',
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
```

### Departments Table
```sql
CREATE TABLE Departments (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX),
    ManagerId UNIQUEIDENTIFIER,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (ManagerId) REFERENCES Users(Id)
);
```

### Teams Table
```sql
CREATE TABLE Teams (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(100) NOT NULL,
    DepartmentId UNIQUEIDENTIFIER NOT NULL,
    LeaderId UNIQUEIDENTIFIER,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (DepartmentId) REFERENCES Departments(Id),
    FOREIGN KEY (LeaderId) REFERENCES Users(Id)
);
```

### Junction Tables

```sql
CREATE TABLE UserDepartments (
    UserId UNIQUEIDENTIFIER NOT NULL,
    DepartmentId UNIQUEIDENTIFIER NOT NULL,
    PRIMARY KEY (UserId, DepartmentId),
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    FOREIGN KEY (DepartmentId) REFERENCES Departments(Id)
);

CREATE TABLE UserTeams (
    UserId UNIQUEIDENTIFIER NOT NULL,
    TeamId UNIQUEIDENTIFIER NOT NULL,
    PRIMARY KEY (UserId, TeamId),
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    FOREIGN KEY (TeamId) REFERENCES Teams(Id)
);

CREATE TABLE ProjectDepartments (
    ProjectId UNIQUEIDENTIFIER NOT NULL,
    DepartmentId UNIQUEIDENTIFIER NOT NULL,
    PRIMARY KEY (ProjectId, DepartmentId),
    FOREIGN KEY (ProjectId) REFERENCES Projects(Id),
    FOREIGN KEY (DepartmentId) REFERENCES Departments(Id)
);

CREATE TABLE ProjectTeams (
    ProjectId UNIQUEIDENTIFIER NOT NULL,
    TeamId UNIQUEIDENTIFIER NOT NULL,
    PRIMARY KEY (ProjectId, TeamId),
    FOREIGN KEY (ProjectId) REFERENCES Projects(Id),
    FOREIGN KEY (TeamId) REFERENCES Teams(Id)
);
```

## Complete API Endpoints List

### 1. Authentication & User Management APIs
```csharp
[Route("api/auth")]
public class AuthController
{
    // Replace localStorage.getItem(CURRENT_USER_KEY)
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)

    // Replace localStorage.removeItem(CURRENT_USER_KEY)
    [HttpPost("logout")]
    public async Task<ActionResult> Logout()

    // Replace getCurrentUser()
    [HttpGet("user")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetCurrentUser()

    // Replace getAllUsers()
    [HttpGet("users")]
    [Authorize]
    public async Task<ActionResult<List<UserDto>>> GetUsers()

    // Password Reset & Management
    [HttpPost("forgot-password")]
    public async Task<ActionResult> ForgotPassword(string email)

    [HttpPost("reset-password")]
    public async Task<ActionResult> ResetPassword(ResetPasswordRequest request)

    [HttpPost("change-password")]
    [Authorize]
    public async Task<ActionResult> ChangePassword(ChangePasswordRequest request)
}

[Route("api/users")]
public class UsersController
{
    [HttpGet]
    [Authorize(Roles = "owner,manager")]
    public async Task<ActionResult<List<UserDto>>> GetAllUsers()

    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<UserDetailDto>> GetUserById(Guid id)

    [HttpPost]
    [Authorize(Roles = "owner")]
    public async Task<ActionResult<UserDto>> CreateUser(CreateUserRequest request)

    [HttpPut("{id}")]
    [Authorize]
    public async Task<ActionResult<UserDto>> UpdateUser(Guid id, UpdateUserRequest request)

    [HttpDelete("{id}")]
    [Authorize(Roles = "owner")]
    public async Task<ActionResult> DeleteUser(Guid id)

    [HttpGet("{id}/timesheet")]
    [Authorize]
    public async Task<ActionResult<TimesheetDto>> GetUserTimesheet(Guid id, DateTime startDate, DateTime endDate)
}

### 2. Time Entry Management APIs
```csharp
[Route("api/time-entries")]
public class TimeEntriesController
{
    // Replace getTimeEntries()
    [HttpGet]
    public async Task<ActionResult<List<TimeEntryDto>>> GetTimeEntries(
        [FromQuery] string? userId,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] string? status,
        [FromQuery] string? projectId)

    // Replace saveTimeEntry()
    [HttpPost]
    public async Task<ActionResult<TimeEntryDto>> CreateTimeEntry(CreateTimeEntryRequest request)

    // Replace bulk entry from WeeklyTimeTracker
    [HttpPost("bulk")]
    public async Task<ActionResult<List<TimeEntryDto>>> CreateBulkEntries(CreateBulkTimeEntriesRequest request)

    // Replace updateTimeEntry()
    [HttpPut("{id}")]
    public async Task<ActionResult<TimeEntryDto>> UpdateTimeEntry(Guid id, UpdateTimeEntryRequest request)

    // Replace deleteTimeEntry()
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteTimeEntry(Guid id)

    // Replace getTimeEntryStatusForDate()
    [HttpGet("status/{date}")]
    public async Task<ActionResult<TimeEntryStatusResponse>> GetTimeEntryStatus(DateTime date)

    // Approval workflow
    [HttpPost("{id}/approve")]
    [Authorize(Roles = "owner,manager")]
    public async Task<ActionResult> ApproveTimeEntry(Guid id, ApprovalRequest request)

    [HttpPost("{id}/reject")]
    [Authorize(Roles = "owner,manager")]
    public async Task<ActionResult> RejectTimeEntry(Guid id, RejectionRequest request)

    [HttpPost("bulk-approve")]
    [Authorize(Roles = "owner,manager")]
    public async Task<ActionResult> BulkApproveEntries(BulkApprovalRequest request)

    // Statistics and Reports
    [HttpGet("statistics")]
    public async Task<ActionResult<TimeEntryStatistics>> GetStatistics(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate,
        [FromQuery] string? userId)

    [HttpGet("export")]
    public async Task<FileResult> ExportTimeEntries(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate,
        [FromQuery] string format = "csv")
}

### 3. Project Management APIs
```csharp
[Route("api/projects")]
public class ProjectsController
{
    // Replace getProjects()
    [HttpGet]
    public async Task<ActionResult<List<ProjectDto>>> GetProjects(
        [FromQuery] Guid? departmentId,
        [FromQuery] Guid? teamId)

    // Replace getUserAssociatedProjects()
    [HttpGet("user/{userId}")]
    public async Task<ActionResult<List<ProjectDto>>> GetUserProjects(Guid userId)

    // Replace saveProject()
    [HttpPost]
    [Authorize(Roles = "owner,manager")]
    public async Task<ActionResult<ProjectDto>> CreateProject(CreateProjectRequest request)

    [HttpPut("{id}")]
    [Authorize(Roles = "owner,manager")]
    public async Task<ActionResult<ProjectDto>> UpdateProject(Guid id, UpdateProjectRequest request)

    [HttpDelete("{id}")]
    [Authorize(Roles = "owner")]
    public async Task<ActionResult> DeleteProject(Guid id)

    // Project Tasks Management
    [HttpGet("{id}/tasks")]
    public async Task<ActionResult<List<ProjectTaskDto>>> GetProjectTasks(Guid id)

    [HttpPost("{id}/tasks")]
    [Authorize(Roles = "owner,manager")]
    public async Task<ActionResult<ProjectTaskDto>> CreateProjectTask(Guid id, CreateProjectTaskRequest request)

    // Project Statistics
    [HttpGet("{id}/statistics")]
    public async Task<ActionResult<ProjectStatistics>> GetProjectStatistics(Guid id)
}

### 4. Department Management APIs
```csharp
[Route("api/departments")]
public class DepartmentsController
{
    [HttpGet]
    public async Task<ActionResult<List<DepartmentDto>>> GetDepartments()

    [HttpGet("{id}")]
    public async Task<ActionResult<DepartmentDetailDto>> GetDepartmentById(Guid id)

    [HttpPost]
    [Authorize(Roles = "owner")]
    public async Task<ActionResult<DepartmentDto>> CreateDepartment(CreateDepartmentRequest request)

    [HttpPut("{id}")]
    [Authorize(Roles = "owner")]
    public async Task<ActionResult<DepartmentDto>> UpdateDepartment(Guid id, UpdateDepartmentRequest request)

    [HttpDelete("{id}")]
    [Authorize(Roles = "owner")]
    public async Task<ActionResult> DeleteDepartment(Guid id)

    // Department Statistics
    [HttpGet("{id}/statistics")]
    public async Task<ActionResult<DepartmentStatistics>> GetDepartmentStatistics(Guid id)

    // Department Members
    [HttpGet("{id}/members")]
    public async Task<ActionResult<List<UserDto>>> GetDepartmentMembers(Guid id)
}

### 5. Team Management APIs
```csharp
[Route("api/teams")]
public class TeamsController
{
    [HttpGet]
    public async Task<ActionResult<List<TeamDto>>> GetTeams([FromQuery] Guid? departmentId)

    [HttpGet("{id}")]
    public async Task<ActionResult<TeamDetailDto>> GetTeamById(Guid id)

    [HttpPost]
    [Authorize(Roles = "owner,manager")]
    public async Task<ActionResult<TeamDto>> CreateTeam(CreateTeamRequest request)

    [HttpPut("{id}")]
    [Authorize(Roles = "owner,manager")]
    public async Task<ActionResult<TeamDto>> UpdateTeam(Guid id, UpdateTeamRequest request)

    [HttpDelete("{id}")]
    [Authorize(Roles = "owner")]
    public async Task<ActionResult> DeleteTeam(Guid id)

    // Team Members Management
    [HttpPost("{id}/members")]
    [Authorize(Roles = "owner,manager")]
    public async Task<ActionResult> AddTeamMember(Guid id, AddTeamMemberRequest request)

    [HttpDelete("{id}/members/{userId}")]
    [Authorize(Roles = "owner,manager")]
    public async Task<ActionResult> RemoveTeamMember(Guid id, Guid userId)

    // Team Statistics
    [HttpGet("{id}/statistics")]
    public async Task<ActionResult<TeamStatistics>> GetTeamStatistics(Guid id)
}

### 6. Notification APIs
```csharp
[Route("api/notifications")]
public class NotificationsController
{
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<List<NotificationDto>>> GetNotifications(
        [FromQuery] bool unreadOnly = false)

    [HttpPost("{id}/read")]
    [Authorize]
    public async Task<ActionResult> MarkAsRead(Guid id)

    [HttpPost("read-all")]
    [Authorize]
    public async Task<ActionResult> MarkAllAsRead()

    // Daily Reminders
    [HttpGet("reminders")]
    [Authorize]
    public async Task<ActionResult<List<ReminderDto>>> GetReminders()

    [HttpPost("reminders/settings")]
    [Authorize]
    public async Task<ActionResult> UpdateReminderSettings(UpdateReminderSettingsRequest request)
}

### 7. Reports APIs
```csharp
[Route("api/reports")]
public class ReportsController
{
    [HttpGet("timesheet")]
    [Authorize]
    public async Task<ActionResult<TimesheetReportDto>> GetTimesheetReport(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate,
        [FromQuery] string? userId,
        [FromQuery] string? projectId)

    [HttpGet("department")]
    [Authorize(Roles = "owner,manager")]
    public async Task<ActionResult<DepartmentReportDto>> GetDepartmentReport(
        [FromQuery] Guid departmentId,
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)

    [HttpGet("team")]
    [Authorize(Roles = "owner,manager")]
    public async Task<ActionResult<TeamReportDto>> GetTeamReport(
        [FromQuery] Guid teamId,
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)

    [HttpGet("project")]
    [Authorize(Roles = "owner,manager")]
    public async Task<ActionResult<ProjectReportDto>> GetProjectReport(
        [FromQuery] Guid projectId,
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)

    // Export Reports
    [HttpGet("export/timesheet")]
    public async Task<FileResult> ExportTimesheetReport(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate,
        [FromQuery] string format = "csv")

    [HttpGet("export/department")]
    [Authorize(Roles = "owner,manager")]
    public async Task<FileResult> ExportDepartmentReport(
        [FromQuery] Guid departmentId,
        [FromQuery] string format = "csv")
}

### 8. Settings APIs
```csharp
[Route("api/settings")]
public class SettingsController
{
    [HttpGet("user")]
    [Authorize]
    public async Task<ActionResult<UserSettingsDto>> GetUserSettings()

    [HttpPut("user")]
    [Authorize]
    public async Task<ActionResult<UserSettingsDto>> UpdateUserSettings(UpdateUserSettingsRequest request)

    [HttpGet("system")]
    [Authorize(Roles = "owner")]
    public async Task<ActionResult<SystemSettingsDto>> GetSystemSettings()

    [HttpPut("system")]
    [Authorize(Roles = "owner")]
    public async Task<ActionResult<SystemSettingsDto>> UpdateSystemSettings(UpdateSystemSettingsRequest request)
}

### Core Controller Implementation
```csharp
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)

    [HttpPost("logout")]
    public async Task<ActionResult> Logout()

    [HttpGet("user")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
}
```

### TimeEntriesController
```csharp
[Route("api/[controller]")]
[Authorize]
public class TimeEntriesController : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<TimeEntryDto>>> GetTimeEntries(
        [FromQuery] string? userId,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] string? status)

    [HttpPost]
    public async Task<ActionResult<TimeEntryDto>> CreateTimeEntry(CreateTimeEntryRequest request)

    [HttpPut("{id}")]
    public async Task<ActionResult<TimeEntryDto>> UpdateTimeEntry(Guid id, UpdateTimeEntryRequest request)

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteTimeEntry(Guid id)

    [HttpGet("status/{date}")]
    public async Task<ActionResult<TimeEntryStatusResponse>> GetTimeEntryStatus(DateTime date)
}
```

### ProjectsController
```csharp
[Route("api/[controller]")]
[Authorize]
public class ProjectsController : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ProjectDto>>> GetProjects(
        [FromQuery] Guid? departmentId,
        [FromQuery] Guid? teamId)

    [HttpPost]
    [Authorize(Roles = "owner,manager")]
    public async Task<ActionResult<ProjectDto>> CreateProject(CreateProjectRequest request)

    [HttpPut("{id}")]
    [Authorize(Roles = "owner,manager")]
    public async Task<ActionResult<ProjectDto>> UpdateProject(Guid id, UpdateProjectRequest request)

    [HttpDelete("{id}")]
    [Authorize(Roles = "owner")]
    public async Task<ActionResult> DeleteProject(Guid id)

    [HttpGet("user/{userId}")]
    public async Task<ActionResult<List<ProjectDto>>> GetUserProjects(Guid userId)
}
```

### DepartmentsController
```csharp
[Route("api/[controller]")]
[Authorize]
public class DepartmentsController : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<DepartmentDto>>> GetDepartments()

    [HttpPost]
    [Authorize(Roles = "owner")]
    public async Task<ActionResult<DepartmentDto>> CreateDepartment(CreateDepartmentRequest request)

    [HttpPut("{id}")]
    [Authorize(Roles = "owner")]
    public async Task<ActionResult<DepartmentDto>> UpdateDepartment(Guid id, UpdateDepartmentRequest request)

    [HttpDelete("{id}")]
    [Authorize(Roles = "owner")]
    public async Task<ActionResult> DeleteDepartment(Guid id)
}
```

### TeamsController
```csharp
[Route("api/[controller]")]
[Authorize]
public class TeamsController : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<TeamDto>>> GetTeams([FromQuery] Guid? departmentId)

    [HttpPost]
    [Authorize(Roles = "owner,manager")]
    public async Task<ActionResult<TeamDto>> CreateTeam(CreateTeamRequest request)

    [HttpPut("{id}")]
    [Authorize(Roles = "owner,manager")]
    public async Task<ActionResult<TeamDto>> UpdateTeam(Guid id, UpdateTeamRequest request)

    [HttpDelete("{id}")]
    [Authorize(Roles = "owner")]
    public async Task<ActionResult> DeleteTeam(Guid id)

    [HttpPost("{id}/members")]
    [Authorize(Roles = "owner,manager")]
    public async Task<ActionResult> AddTeamMember(Guid id, AddTeamMemberRequest request)

    [HttpDelete("{id}/members/{userId}")]
    [Authorize(Roles = "owner,manager")]
    public async Task<ActionResult> RemoveTeamMember(Guid id, Guid userId)
}
```

## Authentication Implementation

### JWT Configuration
```csharp
public class JwtSettings
{
    public string SecretKey { get; set; }
    public string Issuer { get; set; }
    public string Audience { get; set; }
    public int ExpiryInMinutes { get; set; }
}

// Program.cs
services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => {
        // Configure JWT options
    });
```

### Role-Based Authorization
```csharp
services.AddAuthorization(options =>
{
    options.AddPolicy("RequireOwnerRole", policy => 
        policy.RequireRole("owner"));
    
    options.AddPolicy("RequireManagerRole", policy => 
        policy.RequireRole("owner", "manager"));
});
```

## Additional Features to Implement

1. **Middleware**
   - Exception Handling
   - Request Logging
   - Performance Monitoring
   - API Versioning

2. **Caching**
   - Redis Implementation
   - In-Memory Caching
   - Cache Invalidation

3. **Background Jobs**
   - Daily Reminders
   - Report Generation
   - Data Cleanup

4. **Monitoring**
   - Health Checks
   - Performance Metrics
   - Error Logging

5. **Security**
   - API Rate Limiting
   - Input Validation
   - SQL Injection Prevention
   - XSS Protection

Would you like me to provide more details about any specific part of the backend implementation?
