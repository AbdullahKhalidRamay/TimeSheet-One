using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TimeSheetAPI.Models;

namespace TimeSheetAPI.Services
{
    public interface IProjectService
    {
        Task<IEnumerable<Project>> GetAllProjectsAsync();
        Task<Project> GetProjectByIdAsync(Guid id);
        Task<Project> CreateProjectAsync(Project project);
        Task UpdateProjectAsync(Project project);
        Task DeleteProjectAsync(Guid id);
        
        // Project Level methods
        Task<IEnumerable<ProjectLevel>> GetProjectLevelsAsync(Guid projectId);
        Task<ProjectLevel> GetProjectLevelByIdAsync(Guid levelId);
        Task<ProjectLevel> CreateProjectLevelAsync(ProjectLevel level);
        Task UpdateProjectLevelAsync(ProjectLevel level);
        Task DeleteProjectLevelAsync(Guid levelId);
        
        // Project Task methods
        Task<IEnumerable<ProjectTask>> GetProjectTasksAsync(Guid levelId);
        Task<ProjectTask> GetProjectTaskByIdAsync(Guid taskId);
        Task<ProjectTask> CreateProjectTaskAsync(ProjectTask task);
        Task UpdateProjectTaskAsync(ProjectTask task);
        Task DeleteProjectTaskAsync(Guid taskId);
        
        // Project Subtask methods
        Task<IEnumerable<ProjectSubtask>> GetProjectSubtasksAsync(Guid taskId);
        Task<ProjectSubtask> GetProjectSubtaskByIdAsync(Guid subtaskId);
        Task<ProjectSubtask> CreateProjectSubtaskAsync(ProjectSubtask subtask);
        Task UpdateProjectSubtaskAsync(ProjectSubtask subtask);
        Task DeleteProjectSubtaskAsync(Guid subtaskId);
    }
}