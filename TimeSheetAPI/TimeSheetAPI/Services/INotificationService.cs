using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TimeSheetAPI.Models;

namespace TimeSheetAPI.Services
{
    public interface INotificationService
    {
        Task<IEnumerable<Notification>> GetUserNotificationsAsync(Guid userId);
        Task<IEnumerable<Notification>> GetUnreadUserNotificationsAsync(Guid userId);
        Task<Notification> CreateNotificationAsync(Notification notification);
        Task MarkNotificationAsReadAsync(Guid notificationId);
        Task MarkAllUserNotificationsAsReadAsync(Guid userId);
        Task DeleteNotificationAsync(Guid notificationId);
    }
}