using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TimeSheetAPI.Data;
using TimeSheetAPI.Models;

namespace TimeSheetAPI.Services
{
    public class DepartmentService : IDepartmentService
    {
        private readonly TimeFlowDbContext _context;

        public DepartmentService(TimeFlowDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Department>> GetAllDepartmentsAsync()
        {
            return await _context.Departments
                .Include(d => d.Manager)
                .ToListAsync();
        }

        public async Task<Department> GetDepartmentByIdAsync(Guid id)
        {
            return await _context.Departments
                .Include(d => d.Manager)
                .Include(d => d.Teams)
                .FirstOrDefaultAsync(d => d.Id == id);
        }

        public async Task<Department> CreateDepartmentAsync(Department department)
        {
            // Set default values
            department.CreatedAt = DateTime.UtcNow;
            department.UpdatedAt = DateTime.UtcNow;

            _context.Departments.Add(department);
            await _context.SaveChangesAsync();

            return department;
        }

        public async Task UpdateDepartmentAsync(Department department)
        {
            var existingDepartment = await _context.Departments.FindAsync(department.Id);
            if (existingDepartment == null)
            {
                throw new InvalidOperationException("Department not found");
            }

            // Update properties
            existingDepartment.Name = department.Name;
            existingDepartment.Description = department.Description;
            existingDepartment.ManagerId = department.ManagerId;
            existingDepartment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        public async Task DeleteDepartmentAsync(Guid id)
        {
            var department = await _context.Departments.FindAsync(id);
            if (department == null)
            {
                throw new InvalidOperationException("Department not found");
            }

            _context.Departments.Remove(department);
            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<Team>> GetDepartmentTeamsAsync(Guid departmentId)
        {
            return await _context.Teams
                .Where(t => t.DepartmentId == departmentId)
                .Include(t => t.Leader)
                .ToListAsync();
        }
    }
}