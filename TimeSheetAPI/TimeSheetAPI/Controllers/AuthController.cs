using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using TimeSheetAPI.Models;
using TimeSheetAPI.Services;

namespace TimeSheetAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IJwtService _jwtService;

        public AuthController(IUserService userService, IJwtService jwtService)
        {
            _userService = userService;
            _jwtService = jwtService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var user = new User
                {
                    Email = model.Email,
                    Name = model.Name,
                    Role = model.Role ?? "User",
                    JobTitle = model.JobTitle,
                    BillableRate = model.BillableRate ?? 0,
                    AvailableHours = model.AvailableHours ?? 40
                };

                var createdUser = await _userService.CreateUserAsync(user, model.Password);

                return Ok(new { Message = "User registered successfully" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await _userService.AuthenticateAsync(model.Email, model.Password);

            if (user == null)
            {
                return Unauthorized(new { Message = "Invalid email or password" });
            }

            var token = _jwtService.GenerateToken(user);

            return Ok(new
            {
                Token = token,
                User = new
                {
                    Id = user.Id,
                    Email = user.Email,
                    Name = user.Name,
                    Role = user.Role
                }
            });
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { Message = "Invalid token" });
            }

            var user = await _userService.GetUserByIdAsync(Guid.Parse(userId));

            if (user == null)
            {
                return NotFound(new { Message = "User not found" });
            }

            return Ok(new
            {
                Id = user.Id,
                Email = user.Email,
                Name = user.Name,
                Role = user.Role,
                JobTitle = user.JobTitle,
                BillableRate = user.BillableRate,
                AvailableHours = user.AvailableHours,
                TotalBillableHours = user.TotalBillableHours
            });
        }
    }

    public class RegisterModel
    {
        public string Email { get; set; }
        public string Password { get; set; }
        public string Name { get; set; }
        public string? Role { get; set; }
        public string? JobTitle { get; set; }
        public decimal? BillableRate { get; set; }
        public int? AvailableHours { get; set; }
    }

    public class LoginModel
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }
}