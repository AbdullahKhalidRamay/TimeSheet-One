using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TimeSheetAPI.Data;
using TimeSheetAPI.Models;

namespace TimeSheetAPI.Services
{
    public class ProjectService : IProjectService
    {
        private readonly TimeFlowDbContext _context;

        public ProjectService(TimeFlowDbContext context)
        {
            _context = context;
        }

        #region Project Methods
        public async Task<IEnumerable<Project>> GetAllProjectsAsync()
        {
            return await _context.Projects
                .Include(p => p.Creator)
                .ToListAsync();
        }

        public async Task<Project> GetProjectByIdAsync(Guid id)
        {
            return await _context.Projects
                .Include(p => p.Creator)
                .Include(p => p.ProjectLevels)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<Project> CreateProjectAsync(Project project)
        {
            // Set default values
            project.CreatedAt = DateTime.UtcNow;
            project.UpdatedAt = DateTime.UtcNow;

            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

            return project;
        }

        public async Task UpdateProjectAsync(Project project)
        {
            var existingProject = await _context.Projects.FindAsync(project.Id);
            if (existingProject == null)
            {
                throw new InvalidOperationException("Project not found");
            }

            // Update properties
            existingProject.Name = project.Name;
            existingProject.Description = project.Description;
            existingProject.IsBillable = project.IsBillable;
            existingProject.Status = project.Status;
            existingProject.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        public async Task DeleteProjectAsync(Guid id)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null)
            {
                throw new InvalidOperationException("Project not found");
            }

            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();
        }
        #endregion

        #region Project Level Methods
        public async Task<IEnumerable<ProjectLevel>> GetProjectLevelsAsync(Guid projectId)
        {
            return await _context.ProjectLevels
                .Where(pl => pl.ProjectId == projectId)
                .ToListAsync();
        }

        public async Task<ProjectLevel> GetProjectLevelByIdAsync(Guid levelId)
        {
            return await _context.ProjectLevels
                .Include(pl => pl.ProjectTasks)
                .FirstOrDefaultAsync(pl => pl.Id == levelId);
        }

        public async Task<ProjectLevel> CreateProjectLevelAsync(ProjectLevel level)
        {
            // Set default values
            level.CreatedAt = DateTime.UtcNow;
            level.UpdatedAt = DateTime.UtcNow;

            _context.ProjectLevels.Add(level);
            await _context.SaveChangesAsync();

            return level;
        }

        public async Task UpdateProjectLevelAsync(ProjectLevel level)
        {
            var existingLevel = await _context.ProjectLevels.FindAsync(level.Id);
            if (existingLevel == null)
            {
                throw new InvalidOperationException("Project level not found");
            }

            // Update properties
            existingLevel.Name = level.Name;
            existingLevel.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        public async Task DeleteProjectLevelAsync(Guid levelId)
        {
            var level = await _context.ProjectLevels.FindAsync(levelId);
            if (level == null)
            {
                throw new InvalidOperationException("Project level not found");
            }

            _context.ProjectLevels.Remove(level);
            await _context.SaveChangesAsync();
        }
        #endregion

        #region Project Task Methods
        public async Task<IEnumerable<ProjectTask>> GetProjectTasksAsync(Guid levelId)
        {
            return await _context.ProjectTasks
                .Where(pt => pt.LevelId == levelId)
                .ToListAsync();
        }

        public async Task<ProjectTask> GetProjectTaskByIdAsync(Guid taskId)
        {
            return await _context.ProjectTasks
                .Include(pt => pt.ProjectSubtasks)
                .FirstOrDefaultAsync(pt => pt.Id == taskId);
        }

        public async Task<ProjectTask> CreateProjectTaskAsync(ProjectTask task)
        {
            // Set default values
            task.CreatedAt = DateTime.UtcNow;
            task.UpdatedAt = DateTime.UtcNow;

            _context.ProjectTasks.Add(task);
            await _context.SaveChangesAsync();

            return task;
        }

        public async Task UpdateProjectTaskAsync(ProjectTask task)
        {
            var existingTask = await _context.ProjectTasks.FindAsync(task.Id);
            if (existingTask == null)
            {
                throw new InvalidOperationException("Project task not found");
            }

            // Update properties
            existingTask.Name = task.Name;
            existingTask.Description = task.Description;
            existingTask.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        public async Task DeleteProjectTaskAsync(Guid taskId)
        {
            var task = await _context.ProjectTasks.FindAsync(taskId);
            if (task == null)
            {
                throw new InvalidOperationException("Project task not found");
            }

            _context.ProjectTasks.Remove(task);
            await _context.SaveChangesAsync();
        }
        #endregion

        #region Project Subtask Methods
        public async Task<IEnumerable<ProjectSubtask>> GetProjectSubtasksAsync(Guid taskId)
        {
            return await _context.ProjectSubtasks
                .Where(ps => ps.TaskId == taskId)
                .ToListAsync();
        }

        public async Task<ProjectSubtask> GetProjectSubtaskByIdAsync(Guid subtaskId)
        {
            return await _context.ProjectSubtasks.FindAsync(subtaskId);
        }

        public async Task<ProjectSubtask> CreateProjectSubtaskAsync(ProjectSubtask subtask)
        {
            // Set default values
            subtask.CreatedAt = DateTime.UtcNow;
            subtask.UpdatedAt = DateTime.UtcNow;

            _context.ProjectSubtasks.Add(subtask);
            await _context.SaveChangesAsync();

            return subtask;
        }

        public async Task UpdateProjectSubtaskAsync(ProjectSubtask subtask)
        {
            var existingSubtask = await _context.ProjectSubtasks.FindAsync(subtask.Id);
            if (existingSubtask == null)
            {
                throw new InvalidOperationException("Project subtask not found");
            }

            // Update properties
            existingSubtask.Name = subtask.Name;
            existingSubtask.Description = subtask.Description;
            existingSubtask.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        public async Task DeleteProjectSubtaskAsync(Guid subtaskId)
        {
            var subtask = await _context.ProjectSubtasks.FindAsync(subtaskId);
            if (subtask == null)
            {
                throw new InvalidOperationException("Project subtask not found");
            }

            _context.ProjectSubtasks.Remove(subtask);
            await _context.SaveChangesAsync();
        }
        #endregion
    }
}