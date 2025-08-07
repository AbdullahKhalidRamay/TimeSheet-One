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
    public class TeamsController : ControllerBase
    {
        private readonly ITeamService _teamService;
        private readonly IDepartmentService _departmentService;
        private readonly IUserService _userService;
        private readonly IProjectService _projectService;

        public TeamsController(
            ITeamService teamService,
            IDepartmentService departmentService,
            IUserService userService,
            IProjectService projectService)
        {
            _teamService = teamService;
            _departmentService = departmentService;
            _userService = userService;
            _projectService = projectService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Team>>> GetAllTeams()
        {
            var teams = await _teamService.GetAllTeamsAsync();
            return Ok(teams);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Team>> GetTeam(Guid id)
        {
            var team = await _teamService.GetTeamByIdAsync(id);

            if (team == null)
            {
                return NotFound();
            }

            return Ok(team);
        }

        [HttpGet("{id}/members")]
        public async Task<ActionResult<IEnumerable<User>>> GetTeamMembers(Guid id)
        {
            var team = await _teamService.GetTeamByIdAsync(id);

            if (team == null)
            {
                return NotFound(new { Message = "Team not found" });
            }

            var members = await _teamService.GetTeamMembersAsync(id);
            return Ok(members);
        }

        [HttpGet("{id}/projects")]
        public async Task<ActionResult<IEnumerable<Project>>> GetTeamProjects(Guid id)
        {
            var team = await _teamService.GetTeamByIdAsync(id);

            if (team == null)
            {
                return NotFound(new { Message = "Team not found" });
            }

            var projects = await _teamService.GetTeamProjectsAsync(id);
            return Ok(projects);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<Team>> CreateTeam([FromBody] CreateTeamModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Validate department
            var department = await _departmentService.GetDepartmentByIdAsync(model.DepartmentId);
            if (department == null)
            {
                return BadRequest(new { Message = "Invalid department ID" });
            }

            // Validate leader if provided
            if (model.LeaderId.HasValue)
            {
                var leader = await _userService.GetUserByIdAsync(model.LeaderId.Value);
                if (leader == null)
                {
                    return BadRequest(new { Message = "Invalid leader ID" });
                }
            }

            var team = new Team
            {
                Name = model.Name,
                Description = model.Description,
                DepartmentId = model.DepartmentId,
                LeaderId = model.LeaderId
            };

            try
            {
                var createdTeam = await _teamService.CreateTeamAsync(team);
                return CreatedAtAction(nameof(GetTeam), new { id = createdTeam.Id }, createdTeam);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> UpdateTeam(Guid id, [FromBody] UpdateTeamModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var team = await _teamService.GetTeamByIdAsync(id);

            if (team == null)
            {
                return NotFound();
            }

            // Validate department if provided
            if (model.DepartmentId.HasValue)
            {
                var department = await _departmentService.GetDepartmentByIdAsync(model.DepartmentId.Value);
                if (department == null)
                {
                    return BadRequest(new { Message = "Invalid department ID" });
                }
            }

            // Validate leader if provided
            if (model.LeaderId.HasValue)
            {
                var leader = await _userService.GetUserByIdAsync(model.LeaderId.Value);
                if (leader == null)
                {
                    return BadRequest(new { Message = "Invalid leader ID" });
                }
            }

            // Update team properties
            team.Name = model.Name ?? team.Name;
            team.Description = model.Description ?? team.Description;
            team.DepartmentId = model.DepartmentId ?? team.DepartmentId;
            team.LeaderId = model.LeaderId ?? team.LeaderId;

            try
            {
                await _teamService.UpdateTeamAsync(team);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteTeam(Guid id)
        {
            var team = await _teamService.GetTeamByIdAsync(id);

            if (team == null)
            {
                return NotFound();
            }

            try
            {
                await _teamService.DeleteTeamAsync(id);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpPost("{id}/members")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> AddTeamMember(Guid id, [FromBody] AddTeamMemberModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var team = await _teamService.GetTeamByIdAsync(id);
            if (team == null)
            {
                return NotFound(new { Message = "Team not found" });
            }

            var user = await _userService.GetUserByIdAsync(model.UserId);
            if (user == null)
            {
                return BadRequest(new { Message = "Invalid user ID" });
            }

            try
            {
                await _teamService.AddTeamMemberAsync(id, model.UserId);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpDelete("{id}/members/{userId}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> RemoveTeamMember(Guid id, Guid userId)
        {
            var team = await _teamService.GetTeamByIdAsync(id);
            if (team == null)
            {
                return NotFound(new { Message = "Team not found" });
            }

            var user = await _userService.GetUserByIdAsync(userId);
            if (user == null)
            {
                return BadRequest(new { Message = "Invalid user ID" });
            }

            try
            {
                await _teamService.RemoveTeamMemberAsync(id, userId);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpPost("{id}/projects")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> AssignProjectToTeam(Guid id, [FromBody] AssignProjectModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var team = await _teamService.GetTeamByIdAsync(id);
            if (team == null)
            {
                return NotFound(new { Message = "Team not found" });
            }

            var project = await _projectService.GetProjectByIdAsync(model.ProjectId);
            if (project == null)
            {
                return BadRequest(new { Message = "Invalid project ID" });
            }

            try
            {
                await _teamService.AssignProjectToTeamAsync(id, model.ProjectId);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpDelete("{id}/projects/{projectId}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> RemoveProjectFromTeam(Guid id, Guid projectId)
        {
            var team = await _teamService.GetTeamByIdAsync(id);
            if (team == null)
            {
                return NotFound(new { Message = "Team not found" });
            }

            var project = await _projectService.GetProjectByIdAsync(projectId);
            if (project == null)
            {
                return BadRequest(new { Message = "Invalid project ID" });
            }

            try
            {
                await _teamService.RemoveProjectFromTeamAsync(id, projectId);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }
    }

    public class CreateTeamModel
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public Guid DepartmentId { get; set; }
        public Guid? LeaderId { get; set; }
    }

    public class UpdateTeamModel
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public Guid? DepartmentId { get; set; }
        public Guid? LeaderId { get; set; }
    }

    public class AddTeamMemberModel
    {
        public Guid UserId { get; set; }
    }

    public class AssignProjectModel
    {
        public Guid ProjectId { get; set; }
    }
}