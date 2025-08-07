using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TimeSheetAPI.Models;

namespace TimeSheetAPI.Services
{
    public interface ITeamService
    {
        Task<IEnumerable<Team>> GetAllTeamsAsync();
        Task<Team> GetTeamByIdAsync(Guid id);
        Task<Team> CreateTeamAsync(Team team);
        Task UpdateTeamAsync(Team team);
        Task DeleteTeamAsync(Guid id);
        
        // Team Member methods
        Task<IEnumerable<User>> GetTeamMembersAsync(Guid teamId);
        Task AddTeamMemberAsync(Guid teamId, Guid userId);
        Task RemoveTeamMemberAsync(Guid teamId, Guid userId);
        
        // Team Project methods
        Task<IEnumerable<Project>> GetTeamProjectsAsync(Guid teamId);
        Task AssignProjectToTeamAsync(Guid teamId, Guid projectId);
        Task RemoveProjectFromTeamAsync(Guid teamId, Guid projectId);
    }
}