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
    public class DepartmentsController : ControllerBase
    {
        private readonly IDepartmentService _departmentService;
        private readonly IUserService _userService;

        public DepartmentsController(IDepartmentService departmentService, IUserService userService)
        {
            _departmentService = departmentService;
            _userService = userService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Department>>> GetAllDepartments()
        {
            var departments = await _departmentService.GetAllDepartmentsAsync();
            return Ok(departments);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Department>> GetDepartment(Guid id)
        {
            var department = await _departmentService.GetDepartmentByIdAsync(id);

            if (department == null)
            {
                return NotFound();
            }

            return Ok(department);
        }

        [HttpGet("{id}/teams")]
        public async Task<ActionResult<IEnumerable<Team>>> GetDepartmentTeams(Guid id)
        {
            var department = await _departmentService.GetDepartmentByIdAsync(id);

            if (department == null)
            {
                return NotFound(new { Message = "Department not found" });
            }

            var teams = await _departmentService.GetTeamsByDepartmentIdAsync(id);
            return Ok(teams);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Department>> CreateDepartment([FromBody] CreateDepartmentModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Validate manager if provided
            if (model.ManagerId.HasValue)
            {
                var manager = await _userService.GetUserByIdAsync(model.ManagerId.Value);
                if (manager == null)
                {
                    return BadRequest(new { Message = "Invalid manager ID" });
                }
            }

            var department = new Department
            {
                Name = model.Name,
                Description = model.Description,
                ManagerId = model.ManagerId
            };

            try
            {
                var createdDepartment = await _departmentService.CreateDepartmentAsync(department);
                return CreatedAtAction(nameof(GetDepartment), new { id = createdDepartment.Id }, createdDepartment);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateDepartment(Guid id, [FromBody] UpdateDepartmentModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var department = await _departmentService.GetDepartmentByIdAsync(id);

            if (department == null)
            {
                return NotFound();
            }

            // Validate manager if provided
            if (model.ManagerId.HasValue)
            {
                var manager = await _userService.GetUserByIdAsync(model.ManagerId.Value);
                if (manager == null)
                {
                    return BadRequest(new { Message = "Invalid manager ID" });
                }
            }

            // Update department properties
            department.Name = model.Name ?? department.Name;
            department.Description = model.Description ?? department.Description;
            department.ManagerId = model.ManagerId ?? department.ManagerId;

            try
            {
                await _departmentService.UpdateDepartmentAsync(department);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteDepartment(Guid id)
        {
            var department = await _departmentService.GetDepartmentByIdAsync(id);

            if (department == null)
            {
                return NotFound();
            }

            try
            {
                await _departmentService.DeleteDepartmentAsync(id);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }
    }

    public class CreateDepartmentModel
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public Guid? ManagerId { get; set; }
    }

    public class UpdateDepartmentModel
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public Guid? ManagerId { get; set; }
    }
}