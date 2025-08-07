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
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            var users = await _userService.GetAllUsersAsync();
            return Ok(users);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<User>> GetUser(Guid id)
        {
            var user = await _userService.GetUserByIdAsync(id);

            if (user == null)
            {
                return NotFound();
            }

            // Check if the user is requesting their own data or is an admin/manager
            var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var currentUserRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            if (currentUserId != id.ToString() && currentUserRole != "Admin" && currentUserRole != "Manager")
            {
                return Forbid();
            }

            return Ok(user);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Check if the user is updating their own data or is an admin
            var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var currentUserRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            if (currentUserId != id.ToString() && currentUserRole != "Admin")
            {
                return Forbid();
            }

            var user = await _userService.GetUserByIdAsync(id);

            if (user == null)
            {
                return NotFound();
            }

            // Update user properties
            user.Name = model.Name ?? user.Name;
            user.Email = model.Email ?? user.Email;
            user.JobTitle = model.JobTitle ?? user.JobTitle;
            user.BillableRate = model.BillableRate ?? user.BillableRate;
            user.AvailableHours = model.AvailableHours ?? user.AvailableHours;

            // Only admin can update role
            if (currentUserRole == "Admin" && model.Role != null)
            {
                user.Role = model.Role;
            }

            try
            {
                await _userService.UpdateUserAsync(user);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            var user = await _userService.GetUserByIdAsync(id);

            if (user == null)
            {
                return NotFound();
            }

            try
            {
                await _userService.DeleteUserAsync(id);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }
    }

    public class UpdateUserModel
    {
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? Role { get; set; }
        public string? JobTitle { get; set; }
        public decimal? BillableRate { get; set; }
        public int? AvailableHours { get; set; }
    }
}