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
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationsController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        [HttpGet("user")]
        public async Task<ActionResult<IEnumerable<Notification>>> GetUserNotifications()
        {
            var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);
            var notifications = await _notificationService.GetUserNotificationsAsync(userId);
            return Ok(notifications);
        }

        [HttpGet("user/unread")]
        public async Task<ActionResult<IEnumerable<Notification>>> GetUnreadNotifications()
        {
            var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);
            var notifications = await _notificationService.GetUnreadNotificationsAsync(userId);
            return Ok(notifications);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<Notification>> CreateNotification([FromBody] CreateNotificationModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var notification = new Notification
            {
                UserId = model.UserId,
                Title = model.Title,
                Message = model.Message,
                Type = model.Type,
                IsRead = false,
                RelatedEntityId = model.RelatedEntityId
            };

            try
            {
                var createdNotification = await _notificationService.CreateNotificationAsync(notification);
                return CreatedAtAction(nameof(GetNotification), new { id = createdNotification.Id }, createdNotification);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Notification>> GetNotification(Guid id)
        {
            var notification = await _notificationService.GetNotificationByIdAsync(id);

            if (notification == null)
            {
                return NotFound();
            }

            // Check if the notification belongs to the current user
            var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);
            var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            if (notification.UserId != userId && userRole != "Admin" && userRole != "Manager")
            {
                return Forbid();
            }

            return Ok(notification);
        }

        [HttpPut("{id}/mark-as-read")]
        public async Task<IActionResult> MarkAsRead(Guid id)
        {
            var notification = await _notificationService.GetNotificationByIdAsync(id);

            if (notification == null)
            {
                return NotFound();
            }

            // Check if the notification belongs to the current user
            var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);

            if (notification.UserId != userId)
            {
                return Forbid();
            }

            try
            {
                await _notificationService.MarkNotificationAsReadAsync(id);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpPut("user/mark-all-as-read")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);

            try
            {
                await _notificationService.MarkAllNotificationsAsReadAsync(userId);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(Guid id)
        {
            var notification = await _notificationService.GetNotificationByIdAsync(id);

            if (notification == null)
            {
                return NotFound();
            }

            // Check if the notification belongs to the current user or user is admin
            var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);
            var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            if (notification.UserId != userId && userRole != "Admin")
            {
                return Forbid();
            }

            try
            {
                await _notificationService.DeleteNotificationAsync(id);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }
    }

    public class CreateNotificationModel
    {
        public Guid UserId { get; set; }
        public string Title { get; set; }
        public string Message { get; set; }
        public string Type { get; set; } = "Info"; // Info, Warning, Error, Success
        public Guid? RelatedEntityId { get; set; }
    }
}