using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TimeSheetAPI.Models;

namespace TimeSheetAPI.Services
{
    public interface ITimeEntryService
    {
        Task<IEnumerable<TimeEntry>> GetAllTimeEntriesAsync();
        Task<IEnumerable<TimeEntry>> GetTimeEntriesByUserIdAsync(Guid userId);
        Task<IEnumerable<TimeEntry>> GetTimeEntriesByProjectIdAsync(Guid projectId);
        Task<IEnumerable<TimeEntry>> GetTimeEntriesByDateRangeAsync(Guid userId, DateTime startDate, DateTime endDate);
        Task<TimeEntry> GetTimeEntryByIdAsync(Guid id);
        Task<TimeEntry> CreateTimeEntryAsync(TimeEntry timeEntry);
        Task UpdateTimeEntryAsync(TimeEntry timeEntry);
        Task DeleteTimeEntryAsync(Guid id);
        Task<ApprovalAction> RequestApprovalAsync(Guid timeEntryId, Guid requestedById, string comments = null);
        Task<ApprovalAction> ApproveTimeEntryAsync(Guid approvalActionId, Guid approvedById, string comments = null);
        Task<ApprovalAction> RejectTimeEntryAsync(Guid approvalActionId, Guid rejectedById, string comments = null);
    }
}