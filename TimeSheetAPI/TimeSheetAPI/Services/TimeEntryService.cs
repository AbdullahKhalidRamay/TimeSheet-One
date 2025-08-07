using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TimeSheetAPI.Data;
using TimeSheetAPI.Models;

namespace TimeSheetAPI.Services
{
    public class TimeEntryService : ITimeEntryService
    {
        private readonly TimeFlowDbContext _context;

        public TimeEntryService(TimeFlowDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<TimeEntry>> GetAllTimeEntriesAsync()
        {
            return await _context.TimeEntries
                .Include(te => te.User)
                .Include(te => te.Project)
                .ToListAsync();
        }

        public async Task<IEnumerable<TimeEntry>> GetTimeEntriesByUserIdAsync(Guid userId)
        {
            return await _context.TimeEntries
                .Where(te => te.UserId == userId)
                .Include(te => te.Project)
                .OrderByDescending(te => te.Date)
                .ToListAsync();
        }

        public async Task<IEnumerable<TimeEntry>> GetTimeEntriesByProjectIdAsync(Guid projectId)
        {
            return await _context.TimeEntries
                .Where(te => te.ProjectId == projectId)
                .Include(te => te.User)
                .OrderByDescending(te => te.Date)
                .ToListAsync();
        }

        public async Task<IEnumerable<TimeEntry>> GetTimeEntriesByDateRangeAsync(Guid userId, DateTime startDate, DateTime endDate)
        {
            return await _context.TimeEntries
                .Where(te => te.UserId == userId && te.Date >= startDate && te.Date <= endDate)
                .Include(te => te.Project)
                .OrderByDescending(te => te.Date)
                .ToListAsync();
        }

        public async Task<TimeEntry> GetTimeEntryByIdAsync(Guid id)
        {
            return await _context.TimeEntries
                .Include(te => te.User)
                .Include(te => te.Project)
                .FirstOrDefaultAsync(te => te.Id == id);
        }

        public async Task<TimeEntry> CreateTimeEntryAsync(TimeEntry timeEntry)
        {
            // Set default values
            timeEntry.CreatedAt = DateTime.UtcNow;
            timeEntry.UpdatedAt = DateTime.UtcNow;
            
            // Calculate hours if not provided
            if (timeEntry.ClockIn.HasValue && timeEntry.ClockOut.HasValue && timeEntry.ActualHours == 0)
            {
                var duration = timeEntry.ClockOut.Value - timeEntry.ClockIn.Value;
                timeEntry.ActualHours = (decimal)(duration.TotalHours - (timeEntry.BreakTime / 60.0));
                
                if (timeEntry.IsBillable)
                {
                    timeEntry.BillableHours = timeEntry.ActualHours;
                }
                
                timeEntry.TotalHours = timeEntry.ActualHours;
            }

            _context.TimeEntries.Add(timeEntry);
            await _context.SaveChangesAsync();

            return timeEntry;
        }

        public async Task UpdateTimeEntryAsync(TimeEntry timeEntry)
        {
            var existingTimeEntry = await _context.TimeEntries.FindAsync(timeEntry.Id);
            if (existingTimeEntry == null)
            {
                throw new InvalidOperationException("Time entry not found");
            }

            // Update properties
            existingTimeEntry.Date = timeEntry.Date;
            existingTimeEntry.ClockIn = timeEntry.ClockIn;
            existingTimeEntry.ClockOut = timeEntry.ClockOut;
            existingTimeEntry.BreakTime = timeEntry.BreakTime;
            existingTimeEntry.ActualHours = timeEntry.ActualHours;
            existingTimeEntry.BillableHours = timeEntry.BillableHours;
            existingTimeEntry.TotalHours = timeEntry.TotalHours;
            existingTimeEntry.AvailableHours = timeEntry.AvailableHours;
            existingTimeEntry.Task = timeEntry.Task;
            existingTimeEntry.Status = timeEntry.Status;
            existingTimeEntry.IsBillable = timeEntry.IsBillable;
            existingTimeEntry.UpdatedAt = DateTime.UtcNow;

            // Recalculate hours if needed
            if (timeEntry.ClockIn.HasValue && timeEntry.ClockOut.HasValue)
            {
                var duration = timeEntry.ClockOut.Value - timeEntry.ClockIn.Value;
                existingTimeEntry.ActualHours = (decimal)(duration.TotalHours - (timeEntry.BreakTime / 60.0));
                
                if (existingTimeEntry.IsBillable)
                {
                    existingTimeEntry.BillableHours = existingTimeEntry.ActualHours;
                }
                
                existingTimeEntry.TotalHours = existingTimeEntry.ActualHours;
            }

            await _context.SaveChangesAsync();
        }

        public async Task DeleteTimeEntryAsync(Guid id)
        {
            var timeEntry = await _context.TimeEntries.FindAsync(id);
            if (timeEntry == null)
            {
                throw new InvalidOperationException("Time entry not found");
            }

            _context.TimeEntries.Remove(timeEntry);
            await _context.SaveChangesAsync();
        }

        public async Task<ApprovalAction> RequestApprovalAsync(Guid timeEntryId, Guid requestedById, string comments = null)
        {
            var timeEntry = await _context.TimeEntries.FindAsync(timeEntryId);
            if (timeEntry == null)
            {
                throw new InvalidOperationException("Time entry not found");
            }

            // Create approval action
            var approvalAction = new ApprovalAction
            {
                TimeEntryId = timeEntryId,
                RequestedById = requestedById,
                Status = "Pending",
                Comments = comments,
                RequestedAt = DateTime.UtcNow
            };

            // Update time entry status
            timeEntry.Status = "Pending Approval";
            timeEntry.UpdatedAt = DateTime.UtcNow;

            _context.ApprovalActions.Add(approvalAction);
            await _context.SaveChangesAsync();

            return approvalAction;
        }

        public async Task<ApprovalAction> ApproveTimeEntryAsync(Guid approvalActionId, Guid approvedById, string comments = null)
        {
            var approvalAction = await _context.ApprovalActions
                .Include(aa => aa.TimeEntry)
                .FirstOrDefaultAsync(aa => aa.Id == approvalActionId);

            if (approvalAction == null)
            {
                throw new InvalidOperationException("Approval action not found");
            }

            // Update approval action
            approvalAction.ApprovedById = approvedById;
            approvalAction.Status = "Approved";
            approvalAction.Comments = comments ?? approvalAction.Comments;
            approvalAction.ActionedAt = DateTime.UtcNow;

            // Update time entry status
            approvalAction.TimeEntry.Status = "Approved";
            approvalAction.TimeEntry.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return approvalAction;
        }

        public async Task<ApprovalAction> RejectTimeEntryAsync(Guid approvalActionId, Guid rejectedById, string comments = null)
        {
            var approvalAction = await _context.ApprovalActions
                .Include(aa => aa.TimeEntry)
                .FirstOrDefaultAsync(aa => aa.Id == approvalActionId);

            if (approvalAction == null)
            {
                throw new InvalidOperationException("Approval action not found");
            }

            // Update approval action
            approvalAction.ApprovedById = rejectedById;
            approvalAction.Status = "Rejected";
            approvalAction.Comments = comments ?? approvalAction.Comments;
            approvalAction.ActionedAt = DateTime.UtcNow;

            // Update time entry status
            approvalAction.TimeEntry.Status = "Rejected";
            approvalAction.TimeEntry.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return approvalAction;
        }
    }
}