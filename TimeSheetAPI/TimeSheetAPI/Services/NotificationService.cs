using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TimeSheetAPI.Data;
using TimeSheetAPI.Models;

namespace TimeSheetAPI.Services
{
    public class NotificationService : INotificationService
    {
        private readonly TimeFlowDbContext _context;

        public NotificationService(TimeFlowDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Notification>> GetUserNotificationsAsync(Guid userId)
        {
            return await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Notification>> GetUnreadUserNotificationsAsync(Guid userId)
        {
            return await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();
        }

        public async Task<Notification> CreateNotificationAsync(Notification notification)
        {
            // Set default values
            notification.CreatedAt = DateTime.UtcNow;
            notification.IsRead = false;

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            return notification;
        }

        public async Task MarkNotificationAsReadAsync(Guid notificationId)
        {
            var notification = await _context.Notifications.FindAsync(notificationId);
            if (notification == null)
            {
                throw new InvalidOperationException("Notification not found");
            }

            notification.IsRead = true;
            await _context.SaveChangesAsync();
        }

        public async Task MarkAllUserNotificationsAsReadAsync(Guid userId)
        {
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
            }

            await _context.SaveChangesAsync();
        }

        public async Task DeleteNotificationAsync(Guid notificationId)
        {
            var notification = await _context.Notifications.FindAsync(notificationId);
            if (notification == null)
            {
                throw new InvalidOperationException("Notification not found");
            }

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();
        }
    }
}