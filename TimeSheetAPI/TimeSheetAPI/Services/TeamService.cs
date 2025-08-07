using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TimeSheetAPI.Data;
using TimeSheetAPI.Models;

namespace TimeSheetAPI.Services
{
    public class TeamService : ITeamService
    {
        private readonly TimeFlowDbContext _context;

        public TeamService(TimeFlowDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Team>> GetAllTeamsAsync()
        {
            return await _context.Teams
                .Include(t => t.Department)
                .Include(t => t.Leader)
                .ToListAsync();
        }

        public async Task<Team> GetTeamByIdAsync(Guid id)
        {
            return await _context.Teams
                .Include(t => t.Department)
                .Include(t => t.Leader)
                .FirstOrDefaultAsync(t => t.Id == id);
        }

        public async Task<Team> CreateTeamAsync(Team team)
        {
            // Set default values
            team.CreatedAt = DateTime.UtcNow;
            team.UpdatedAt = DateTime.UtcNow;

            _context.Teams.Add(team);
            await _context.SaveChangesAsync();

            return team;
        }

        public async Task UpdateTeamAsync(Team team)
        {
            var existingTeam = await _context.Teams.FindAsync(team.Id);
            if (existingTeam == null)
            {
                throw new InvalidOperationException("Team not found");
            }

            // Update properties
            existingTeam.Name = team.Name;
            existingTeam.Description = team.Description;
            existingTeam.DepartmentId = team.DepartmentId;
            existingTeam.LeaderId = team.LeaderId;
            existingTeam.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        public async Task DeleteTeamAsync(Guid id)
        {
            var team = await _context.Teams.FindAsync(id);
            if (team == null)
            {
                throw new InvalidOperationException("Team not found");
            }

            _context.Teams.Remove(team);
            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<User>> GetTeamMembersAsync(Guid teamId)
        {
            var teamMembers = await _context.TeamMembers
                .Where(tm => tm.TeamId == teamId)
                .Include(tm => tm.User)
                .ToListAsync();

            return teamMembers.Select(tm => tm.User).ToList();
        }

        public async Task AddTeamMemberAsync(Guid teamId, Guid userId)
        {
            // Check if team exists
            var team = await _context.Teams.FindAsync(teamId);
            if (team == null)
            {
                throw new InvalidOperationException("Team not found");
            }

            // Check if user exists
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                throw new InvalidOperationException("User not found");
            }

            // Check if user is already a member of the team
            var existingMember = await _context.TeamMembers
                .FirstOrDefaultAsync(tm => tm.TeamId == teamId && tm.UserId == userId);

            if (existingMember != null)
            {
                throw new InvalidOperationException("User is already a member of this team");
            }

            // Add user to team
            var teamMember = new TeamMember
            {
                TeamId = teamId,
                UserId = userId,
                JoinedAt = DateTime.UtcNow
            };

            _context.TeamMembers.Add(teamMember);
            await _context.SaveChangesAsync();
        }

        public async Task RemoveTeamMemberAsync(Guid teamId, Guid userId)
        {
            var teamMember = await _context.TeamMembers
                .FirstOrDefaultAsync(tm => tm.TeamId == teamId && tm.UserId == userId);

            if (teamMember == null)
            {
                throw new InvalidOperationException("User is not a member of this team");
            }

            _context.TeamMembers.Remove(teamMember);
            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<Project>> GetTeamProjectsAsync(Guid teamId)
        {
            var teamProjects = await _context.TeamProjects
                .Where(tp => tp.TeamId == teamId)
                .Include(tp => tp.Project)
                .ToListAsync();

            return teamProjects.Select(tp => tp.Project).ToList();
        }

        public async Task AssignProjectToTeamAsync(Guid teamId, Guid projectId)
        {
            // Check if team exists
            var team = await _context.Teams.FindAsync(teamId);
            if (team == null)
            {
                throw new InvalidOperationException("Team not found");
            }

            // Check if project exists
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null)
            {
                throw new InvalidOperationException("Project not found");
            }

            // Check if project is already assigned to the team
            var existingAssignment = await _context.TeamProjects
                .FirstOrDefaultAsync(tp => tp.TeamId == teamId && tp.ProjectId == projectId);

            if (existingAssignment != null)
            {
                throw new InvalidOperationException("Project is already assigned to this team");
            }

            // Assign project to team
            var teamProject = new TeamProject
            {
                TeamId = teamId,
                ProjectId = projectId,
                AssignedAt = DateTime.UtcNow
            };

            _context.TeamProjects.Add(teamProject);
            await _context.SaveChangesAsync();
        }

        public async Task RemoveProjectFromTeamAsync(Guid teamId, Guid projectId)
        {
            var teamProject = await _context.TeamProjects
                .FirstOrDefaultAsync(tp => tp.TeamId == teamId && tp.ProjectId == projectId);

            if (teamProject == null)
            {
                throw new InvalidOperationException("Project is not assigned to this team");
            }

            _context.TeamProjects.Remove(teamProject);
            await _context.SaveChangesAsync();
        }
    }
}