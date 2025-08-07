using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TimeSheetAPI.Models;
using TimeSheetAPI.Services;

namespace TimeSheetAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProjectsController : ControllerBase
    {
        private readonly IProjectService _projectService;
        private readonly ITeamService _teamService;

        public ProjectsController(IProjectService projectService, ITeamService teamService)
        {
            _projectService = projectService;
            _teamService = teamService;
        }

        #region Projects

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Project>>> GetAllProjects()
        {
            var projects = await _projectService.GetAllProjectsAsync();
            return Ok(projects);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Project>> GetProject(Guid id)
        {
            var project = await _projectService.GetProjectByIdAsync(id);

            if (project == null)
            {
                return NotFound();
            }

            return Ok(project);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<Project>> CreateProject([FromBody] CreateProjectModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var project = new Project
            {
                Name = model.Name,
                Description = model.Description,
                ClientName = model.ClientName,
                StartDate = model.StartDate,
                EndDate = model.EndDate,
                Status = model.Status,
                BudgetHours = model.BudgetHours,
                BillableHours = 0, // Will be updated as time entries are added
                ActualHours = 0,   // Will be updated as time entries are added
                BillingRate = model.BillingRate,
                IsActive = model.IsActive
            };

            try
            {
                var createdProject = await _projectService.CreateProjectAsync(project);

                // If team is specified, assign project to team
                if (model.TeamId.HasValue)
                {
                    await _teamService.AssignProjectToTeamAsync(model.TeamId.Value, createdProject.Id);
                }

                return CreatedAtAction(nameof(GetProject), new { id = createdProject.Id }, createdProject);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> UpdateProject(Guid id, [FromBody] UpdateProjectModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var project = await _projectService.GetProjectByIdAsync(id);

            if (project == null)
            {
                return NotFound();
            }

            // Update project properties
            project.Name = model.Name ?? project.Name;
            project.Description = model.Description ?? project.Description;
            project.ClientName = model.ClientName ?? project.ClientName;
            project.StartDate = model.StartDate ?? project.StartDate;
            project.EndDate = model.EndDate ?? project.EndDate;
            project.Status = model.Status ?? project.Status;
            project.BudgetHours = model.BudgetHours ?? project.BudgetHours;
            project.BillingRate = model.BillingRate ?? project.BillingRate;
            
            if (model.IsActive.HasValue)
            {
                project.IsActive = model.IsActive.Value;
            }

            try
            {
                await _projectService.UpdateProjectAsync(project);

                // If team is specified, update project team assignment
                if (model.TeamId.HasValue)
                {
                    // First remove from any existing teams
                    var teams = await _teamService.GetTeamsForProjectAsync(id);
                    foreach (var team in teams)
                    {
                        await _teamService.RemoveProjectFromTeamAsync(team.Id, id);
                    }

                    // Then assign to the new team
                    await _teamService.AssignProjectToTeamAsync(model.TeamId.Value, id);
                }

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteProject(Guid id)
        {
            var project = await _projectService.GetProjectByIdAsync(id);

            if (project == null)
            {
                return NotFound();
            }

            try
            {
                await _projectService.DeleteProjectAsync(id);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        #endregion

        #region Project Levels

        [HttpGet("{projectId}/levels")]
        public async Task<ActionResult<IEnumerable<ProjectLevel>>> GetProjectLevels(Guid projectId)
        {
            var project = await _projectService.GetProjectByIdAsync(projectId);

            if (project == null)
            {
                return NotFound(new { Message = "Project not found" });
            }

            var levels = await _projectService.GetProjectLevelsByProjectIdAsync(projectId);
            return Ok(levels);
        }

        [HttpGet("levels/{id}")]
        public async Task<ActionResult<ProjectLevel>> GetProjectLevel(Guid id)
        {
            var level = await _projectService.GetProjectLevelByIdAsync(id);

            if (level == null)
            {
                return NotFound();
            }

            return Ok(level);
        }

        [HttpPost("{projectId}/levels")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<ProjectLevel>> CreateProjectLevel(
            Guid projectId, [FromBody] CreateProjectLevelModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var project = await _projectService.GetProjectByIdAsync(projectId);

            if (project == null)
            {
                return NotFound(new { Message = "Project not found" });
            }

            var level = new ProjectLevel
            {
                ProjectId = projectId,
                Name = model.Name,
                Description = model.Description,
                IsActive = model.IsActive
            };

            try
            {
                var createdLevel = await _projectService.CreateProjectLevelAsync(level);
                return CreatedAtAction(
                    nameof(GetProjectLevel), 
                    new { id = createdLevel.Id }, 
                    createdLevel);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpPut("levels/{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> UpdateProjectLevel(
            Guid id, [FromBody] UpdateProjectLevelModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var level = await _projectService.GetProjectLevelByIdAsync(id);

            if (level == null)
            {
                return NotFound();
            }

            // Update level properties
            level.Name = model.Name ?? level.Name;
            level.Description = model.Description ?? level.Description;
            
            if (model.IsActive.HasValue)
            {
                level.IsActive = model.IsActive.Value;
            }

            try
            {
                await _projectService.UpdateProjectLevelAsync(level);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpDelete("levels/{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> DeleteProjectLevel(Guid id)
        {
            var level = await _projectService.GetProjectLevelByIdAsync(id);

            if (level == null)
            {
                return NotFound();
            }

            try
            {
                await _projectService.DeleteProjectLevelAsync(id);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        #endregion

        #region Project Tasks

        [HttpGet("levels/{levelId}/tasks")]
        public async Task<ActionResult<IEnumerable<ProjectTask>>> GetProjectTasks(Guid levelId)
        {
            var level = await _projectService.GetProjectLevelByIdAsync(levelId);

            if (level == null)
            {
                return NotFound(new { Message = "Project level not found" });
            }

            var tasks = await _projectService.GetProjectTasksByLevelIdAsync(levelId);
            return Ok(tasks);
        }

        [HttpGet("tasks/{id}")]
        public async Task<ActionResult<ProjectTask>> GetProjectTask(Guid id)
        {
            var task = await _projectService.GetProjectTaskByIdAsync(id);

            if (task == null)
            {
                return NotFound();
            }

            return Ok(task);
        }

        [HttpPost("levels/{levelId}/tasks")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<ProjectTask>> CreateProjectTask(
            Guid levelId, [FromBody] CreateProjectTaskModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var level = await _projectService.GetProjectLevelByIdAsync(levelId);

            if (level == null)
            {
                return NotFound(new { Message = "Project level not found" });
            }

            var task = new ProjectTask
            {
                ProjectLevelId = levelId,
                Name = model.Name,
                Description = model.Description,
                IsActive = model.IsActive
            };

            try
            {
                var createdTask = await _projectService.CreateProjectTaskAsync(task);
                return CreatedAtAction(
                    nameof(GetProjectTask), 
                    new { id = createdTask.Id }, 
                    createdTask);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpPut("tasks/{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> UpdateProjectTask(
            Guid id, [FromBody] UpdateProjectTaskModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var task = await _projectService.GetProjectTaskByIdAsync(id);

            if (task == null)
            {
                return NotFound();
            }

            // Update task properties
            task.Name = model.Name ?? task.Name;
            task.Description = model.Description ?? task.Description;
            
            if (model.IsActive.HasValue)
            {
                task.IsActive = model.IsActive.Value;
            }

            try
            {
                await _projectService.UpdateProjectTaskAsync(task);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpDelete("tasks/{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> DeleteProjectTask(Guid id)
        {
            var task = await _projectService.GetProjectTaskByIdAsync(id);

            if (task == null)
            {
                return NotFound();
            }

            try
            {
                await _projectService.DeleteProjectTaskAsync(id);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        #endregion

        #region Project Subtasks

        [HttpGet("tasks/{taskId}/subtasks")]
        public async Task<ActionResult<IEnumerable<ProjectSubtask>>> GetProjectSubtasks(Guid taskId)
        {
            var task = await _projectService.GetProjectTaskByIdAsync(taskId);

            if (task == null)
            {
                return NotFound(new { Message = "Project task not found" });
            }

            var subtasks = await _projectService.GetProjectSubtasksByTaskIdAsync(taskId);
            return Ok(subtasks);
        }

        [HttpGet("subtasks/{id}")]
        public async Task<ActionResult<ProjectSubtask>> GetProjectSubtask(Guid id)
        {
            var subtask = await _projectService.GetProjectSubtaskByIdAsync(id);

            if (subtask == null)
            {
                return NotFound();
            }

            return Ok(subtask);
        }

        [HttpPost("tasks/{taskId}/subtasks")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<ProjectSubtask>> CreateProjectSubtask(
            Guid taskId, [FromBody] CreateProjectSubtaskModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var task = await _projectService.GetProjectTaskByIdAsync(taskId);

            if (task == null)
            {
                return NotFound(new { Message = "Project task not found" });
            }

            var subtask = new ProjectSubtask
            {
                ProjectTaskId = taskId,
                Name = model.Name,
                Description = model.Description,
                IsActive = model.IsActive
            };

            try
            {
                var createdSubtask = await _projectService.CreateProjectSubtaskAsync(subtask);
                return CreatedAtAction(
                    nameof(GetProjectSubtask), 
                    new { id = createdSubtask.Id }, 
                    createdSubtask);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpPut("subtasks/{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> UpdateProjectSubtask(
            Guid id, [FromBody] UpdateProjectSubtaskModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var subtask = await _projectService.GetProjectSubtaskByIdAsync(id);

            if (subtask == null)
            {
                return NotFound();
            }

            // Update subtask properties
            subtask.Name = model.Name ?? subtask.Name;
            subtask.Description = model.Description ?? subtask.Description;
            
            if (model.IsActive.HasValue)
            {
                subtask.IsActive = model.IsActive.Value;
            }

            try
            {
                await _projectService.UpdateProjectSubtaskAsync(subtask);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpDelete("subtasks/{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> DeleteProjectSubtask(Guid id)
        {
            var subtask = await _projectService.GetProjectSubtaskByIdAsync(id);

            if (subtask == null)
            {
                return NotFound();
            }

            try
            {
                await _projectService.DeleteProjectSubtaskAsync(id);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        #endregion
    }

    public class CreateProjectModel
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public string ClientName { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string Status { get; set; } = "Active";
        public decimal BudgetHours { get; set; }
        public decimal BillingRate { get; set; }
        public bool IsActive { get; set; } = true;
        public Guid? TeamId { get; set; }
    }

    public class UpdateProjectModel
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string? ClientName { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? Status { get; set; }
        public decimal? BudgetHours { get; set; }
        public decimal? BillingRate { get; set; }
        public bool? IsActive { get; set; }
        public Guid? TeamId { get; set; }
    }

    public class CreateProjectLevelModel
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class UpdateProjectLevelModel
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public bool? IsActive { get; set; }
    }

    public class CreateProjectTaskModel
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class UpdateProjectTaskModel
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public bool? IsActive { get; set; }
    }

    public class CreateProjectSubtaskModel
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class UpdateProjectSubtaskModel
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public bool? IsActive { get; set; }
    }
}