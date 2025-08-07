using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using TimeSheetAPI.Models;
using TimeSheetAPI.Services;

namespace TimeSheetAPI.Data
{
    public class DbSeeder
    {
        private readonly TimeFlowDbContext _context;
        private readonly IUserService _userService;

        public DbSeeder(TimeFlowDbContext context, IUserService userService)
        {
            _context = context;
            _userService = userService;
        }

        public async Task SeedAsync()
        {
            // Apply migrations
            await _context.Database.MigrateAsync();

            // Seed admin user if not exists
            await SeedAdminUserAsync();

            // Seed departments if not exists
            await SeedDepartmentsAsync();

            // Seed projects if not exists
            await SeedProjectsAsync();
        }

        private async Task SeedAdminUserAsync()
        {
            if (!await _context.Users.AnyAsync())
            {
                var adminUser = new User
                {
                    Email = "admin@timeflow.com",
                    FirstName = "Admin",
                    LastName = "User",
                    Role = "Admin",
                    JobTitle = "System Administrator",
                    BillableRate = 0,
                    AvailableHours = 40,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await _userService.CreateUserAsync(adminUser, "Admin123!");

                // Create a regular employee
                var employee = new User
                {
                    Email = "employee@timeflow.com",
                    FirstName = "Test",
                    LastName = "Employee",
                    Role = "Employee",
                    JobTitle = "Software Developer",
                    BillableRate = 75.00m,
                    AvailableHours = 40,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await _userService.CreateUserAsync(employee, "Employee123!");

                // Create a manager
                var manager = new User
                {
                    Email = "manager@timeflow.com",
                    FirstName = "Test",
                    LastName = "Manager",
                    Role = "Manager",
                    JobTitle = "Project Manager",
                    BillableRate = 100.00m,
                    AvailableHours = 40,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await _userService.CreateUserAsync(manager, "Manager123!");
            }
        }

        private async Task SeedDepartmentsAsync()
        {
            if (!await _context.Departments.AnyAsync())
            {
                var manager = await _context.Users.FirstOrDefaultAsync(u => u.Role == "Manager");

                var departments = new[]
                {
                    new Department
                    {
                        Name = "Engineering",
                        Description = "Software development and engineering",
                        ManagerId = manager?.Id,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Department
                    {
                        Name = "Design",
                        Description = "UI/UX and graphic design",
                        ManagerId = manager?.Id,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Department
                    {
                        Name = "Marketing",
                        Description = "Marketing and sales",
                        ManagerId = manager?.Id,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    }
                };

                await _context.Departments.AddRangeAsync(departments);
                await _context.SaveChangesAsync();

                // Create a team for the Engineering department
                var engineeringDept = await _context.Departments.FirstOrDefaultAsync(d => d.Name == "Engineering");
                var employee = await _context.Users.FirstOrDefaultAsync(u => u.Role == "Employee");

                if (engineeringDept != null)
                {
                    var team = new Team
                    {
                        Name = "Development Team",
                        Description = "Core development team",
                        DepartmentId = engineeringDept.Id,
                        LeaderId = manager?.Id,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    await _context.Teams.AddAsync(team);
                    await _context.SaveChangesAsync();

                    // Add employee to the team
                    if (employee != null)
                    {
                        var teamMember = new TeamMember
                        {
                            TeamId = team.Id,
                            UserId = employee.Id,
                            JoinedAt = DateTime.UtcNow
                        };

                        await _context.TeamMembers.AddAsync(teamMember);
                        await _context.SaveChangesAsync();
                    }
                }
            }
        }

        private async Task SeedProjectsAsync()
        {
            if (!await _context.Projects.AnyAsync())
            {
                var projects = new[]
                {
                    new Project
                    {
                        Name = "TimeFlow Web Application",
                        Description = "Development of the TimeFlow web application",
                        ClientName = "Internal",
                        StartDate = DateTime.UtcNow.AddDays(-30),
                        EndDate = DateTime.UtcNow.AddDays(60),
                        Status = "Active",
                        BudgetHours = 500,
                        BillableHours = 0,
                        ActualHours = 0,
                        BillingRate = 150.00m,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Project
                    {
                        Name = "Client Portal Redesign",
                        Description = "Redesign of the client portal interface",
                        ClientName = "ABC Corp",
                        StartDate = DateTime.UtcNow.AddDays(-15),
                        EndDate = DateTime.UtcNow.AddDays(45),
                        Status = "Active",
                        BudgetHours = 200,
                        BillableHours = 0,
                        ActualHours = 0,
                        BillingRate = 125.00m,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    }
                };

                await _context.Projects.AddRangeAsync(projects);
                await _context.SaveChangesAsync();

                // Assign project to team
                var team = await _context.Teams.FirstOrDefaultAsync();
                var project = await _context.Projects.FirstOrDefaultAsync(p => p.Name == "TimeFlow Web Application");

                if (team != null && project != null)
                {
                    var teamProject = new TeamProject
                    {
                        TeamId = team.Id,
                        ProjectId = project.Id,
                        AssignedAt = DateTime.UtcNow
                    };

                    await _context.TeamProjects.AddAsync(teamProject);
                    await _context.SaveChangesAsync();

                    // Create project levels, tasks, and subtasks
                    var level = new ProjectLevel
                    {
                        ProjectId = project.Id,
                        Name = "Phase 1",
                        Description = "Initial development phase",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    await _context.ProjectLevels.AddAsync(level);
                    await _context.SaveChangesAsync();

                    var task = new ProjectTask
                    {
                        ProjectLevelId = level.Id,
                        Name = "Backend Development",
                        Description = "Develop API endpoints and services",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    await _context.ProjectTasks.AddAsync(task);
                    await _context.SaveChangesAsync();

                    var subtask = new ProjectSubtask
                    {
                        ProjectTaskId = task.Id,
                        Name = "User Authentication",
                        Description = "Implement JWT authentication",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    await _context.ProjectSubtasks.AddAsync(subtask);
                    await _context.SaveChangesAsync();
                }
            }
        }
    }
}