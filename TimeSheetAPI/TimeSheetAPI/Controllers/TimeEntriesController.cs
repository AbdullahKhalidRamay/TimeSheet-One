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
    public class TimeEntriesController : ControllerBase
    {
        private readonly ITimeEntryService _timeEntryService;
        private readonly IUserService _userService;
        private readonly IProjectService _projectService;

        public TimeEntriesController(
            ITimeEntryService timeEntryService,
            IUserService userService,
            IProjectService projectService)
        {
            _timeEntryService = timeEntryService;
            _userService = userService;
            _projectService = projectService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<IEnumerable<TimeEntry>>> GetAllTimeEntries()
        {
            var timeEntries = await _timeEntryService.GetAllTimeEntriesAsync();
            return Ok(timeEntries);
        }

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<TimeEntry>>> GetUserTimeEntries(Guid userId)
        {
            // Check if the user is requesting their own data or is an admin/manager
            var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var currentUserRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            if (currentUserId != userId.ToString() && currentUserRole != "Admin" && currentUserRole != "Manager")
            {
                return Forbid();
            }

            var timeEntries = await _timeEntryService.GetTimeEntriesByUserIdAsync(userId);
            return Ok(timeEntries);
        }

        [HttpGet("project/{projectId}")]
        public async Task<ActionResult<IEnumerable<TimeEntry>>> GetProjectTimeEntries(Guid projectId)
        {
            // Only admin, manager, or project members should see project time entries
            var currentUserRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
            
            if (currentUserRole != "Admin" && currentUserRole != "Manager")
            {
                // TODO: Check if user is a member of the project team
                // For now, we'll allow all authenticated users to view project time entries
            }

            var timeEntries = await _timeEntryService.GetTimeEntriesByProjectIdAsync(projectId);
            return Ok(timeEntries);
        }

        [HttpGet("user/{userId}/daterange")]
        public async Task<ActionResult<IEnumerable<TimeEntry>>> GetTimeEntriesByDateRange(
            Guid userId, [FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            // Check if the user is requesting their own data or is an admin/manager
            var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var currentUserRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            if (currentUserId != userId.ToString() && currentUserRole != "Admin" && currentUserRole != "Manager")
            {
                return Forbid();
            }

            var timeEntries = await _timeEntryService.GetTimeEntriesByDateRangeAsync(userId, startDate, endDate);
            return Ok(timeEntries);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TimeEntry>> GetTimeEntry(Guid id)
        {
            var timeEntry = await _timeEntryService.GetTimeEntryByIdAsync(id);

            if (timeEntry == null)
            {
                return NotFound();
            }

            // Check if the user is requesting their own data or is an admin/manager
            var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var currentUserRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            if (currentUserId != timeEntry.UserId.ToString() && currentUserRole != "Admin" && currentUserRole != "Manager")
            {
                return Forbid();
            }

            return Ok(timeEntry);
        }

        [HttpPost]
        public async Task<ActionResult<TimeEntry>> CreateTimeEntry([FromBody] CreateTimeEntryModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Check if the user is creating an entry for themselves or is an admin
            var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var currentUserRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            if (currentUserId != model.UserId.ToString() && currentUserRole != "Admin")
            {
                return Forbid();
            }

            // Validate user and project
            var user = await _userService.GetUserByIdAsync(model.UserId);
            if (user == null)
            {
                return BadRequest(new { Message = "Invalid user ID" });
            }

            var project = await _projectService.GetProjectByIdAsync(model.ProjectId);
            if (project == null)
            {
                return BadRequest(new { Message = "Invalid project ID" });
            }

            var timeEntry = new TimeEntry
            {
                UserId = model.UserId,
                ProjectId = model.ProjectId,
                Date = model.Date,
                ClockIn = model.ClockIn,
                ClockOut = model.ClockOut,
                BreakTime = model.BreakTime,
                ActualHours = model.ActualHours,
                BillableHours = model.IsBillable ? model.ActualHours : 0,
                TotalHours = model.ActualHours,
                AvailableHours = model.AvailableHours,
                Task = model.Task,
                Status = "Pending",
                IsBillable = model.IsBillable
            };

            try
            {
                var createdTimeEntry = await _timeEntryService.CreateTimeEntryAsync(timeEntry);
                return CreatedAtAction(nameof(GetTimeEntry), new { id = createdTimeEntry.Id }, createdTimeEntry);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTimeEntry(Guid id, [FromBody] UpdateTimeEntryModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var timeEntry = await _timeEntryService.GetTimeEntryByIdAsync(id);

            if (timeEntry == null)
            {
                return NotFound();
            }

            // Check if the user is updating their own entry or is an admin/manager
            var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var currentUserRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            if (currentUserId != timeEntry.UserId.ToString() && currentUserRole != "Admin" && currentUserRole != "Manager")
            {
                return Forbid();
            }

            // Update time entry properties
            if (model.ProjectId.HasValue)
            {
                var project = await _projectService.GetProjectByIdAsync(model.ProjectId.Value);
                if (project == null)
                {
                    return BadRequest(new { Message = "Invalid project ID" });
                }
                timeEntry.ProjectId = model.ProjectId.Value;
            }

            timeEntry.Date = model.Date ?? timeEntry.Date;
            timeEntry.ClockIn = model.ClockIn ?? timeEntry.ClockIn;
            timeEntry.ClockOut = model.ClockOut ?? timeEntry.ClockOut;
            timeEntry.BreakTime = model.BreakTime ?? timeEntry.BreakTime;
            timeEntry.ActualHours = model.ActualHours ?? timeEntry.ActualHours;
            timeEntry.AvailableHours = model.AvailableHours ?? timeEntry.AvailableHours;
            timeEntry.Task = model.Task ?? timeEntry.Task;
            
            if (model.IsBillable.HasValue)
            {
                timeEntry.IsBillable = model.IsBillable.Value;
                if (model.IsBillable.Value)
                {
                    timeEntry.BillableHours = timeEntry.ActualHours;
                }
                else
                {
                    timeEntry.BillableHours = 0;
                }
            }

            // Only admin or manager can update status directly
            if ((currentUserRole == "Admin" || currentUserRole == "Manager") && model.Status != null)
            {
                timeEntry.Status = model.Status;
            }

            try
            {
                await _timeEntryService.UpdateTimeEntryAsync(timeEntry);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTimeEntry(Guid id)
        {
            var timeEntry = await _timeEntryService.GetTimeEntryByIdAsync(id);

            if (timeEntry == null)
            {
                return NotFound();
            }

            // Check if the user is deleting their own entry or is an admin
            var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var currentUserRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            if (currentUserId != timeEntry.UserId.ToString() && currentUserRole != "Admin")
            {
                return Forbid();
            }

            try
            {
                await _timeEntryService.DeleteTimeEntryAsync(id);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpPost("{id}/request-approval")]
        public async Task<ActionResult<ApprovalAction>> RequestApproval(Guid id, [FromBody] RequestApprovalModel model)
        {
            var timeEntry = await _timeEntryService.GetTimeEntryByIdAsync(id);

            if (timeEntry == null)
            {
                return NotFound();
            }

            // Check if the user is requesting approval for their own entry
            var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (currentUserId != timeEntry.UserId.ToString())
            {
                return Forbid();
            }

            try
            {
                var approvalAction = await _timeEntryService.RequestApprovalAsync(
                    id, Guid.Parse(currentUserId), model.Comments);
                return Ok(approvalAction);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpPost("approval/{approvalId}/approve")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<ApprovalAction>> ApproveTimeEntry(Guid approvalId, [FromBody] ApprovalActionModel model)
        {
            var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            try
            {
                var approvalAction = await _timeEntryService.ApproveTimeEntryAsync(
                    approvalId, Guid.Parse(currentUserId), model.Comments);
                return Ok(approvalAction);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpPost("approval/{approvalId}/reject")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<ApprovalAction>> RejectTimeEntry(Guid approvalId, [FromBody] ApprovalActionModel model)
        {
            var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            try
            {
                var approvalAction = await _timeEntryService.RejectTimeEntryAsync(
                    approvalId, Guid.Parse(currentUserId), model.Comments);
                return Ok(approvalAction);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }
    }

    public class CreateTimeEntryModel
    {
        public Guid UserId { get; set; }
        public Guid ProjectId { get; set; }
        public DateTime Date { get; set; }
        public DateTime? ClockIn { get; set; }
        public DateTime? ClockOut { get; set; }
        public int BreakTime { get; set; } = 0; // In minutes
        public decimal ActualHours { get; set; }
        public int AvailableHours { get; set; } = 8;
        public string Task { get; set; }
        public bool IsBillable { get; set; } = true;
    }

    public class UpdateTimeEntryModel
    {
        public Guid? ProjectId { get; set; }
        public DateTime? Date { get; set; }
        public DateTime? ClockIn { get; set; }
        public DateTime? ClockOut { get; set; }
        public int? BreakTime { get; set; }
        public decimal? ActualHours { get; set; }
        public int? AvailableHours { get; set; }
        public string? Task { get; set; }
        public bool? IsBillable { get; set; }
        public string? Status { get; set; }
    }

    public class RequestApprovalModel
    {
        public string? Comments { get; set; }
    }

    public class ApprovalActionModel
    {
        public string? Comments { get; set; }
    }
}