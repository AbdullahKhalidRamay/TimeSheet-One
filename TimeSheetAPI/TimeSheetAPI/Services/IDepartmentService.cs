using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TimeSheetAPI.Models;

namespace TimeSheetAPI.Services
{
    public interface IDepartmentService
    {
        Task<IEnumerable<Department>> GetAllDepartmentsAsync();
        Task<Department> GetDepartmentByIdAsync(Guid id);
        Task<Department> CreateDepartmentAsync(Department department);
        Task UpdateDepartmentAsync(Department department);
        Task DeleteDepartmentAsync(Guid id);
        Task<IEnumerable<Team>> GetDepartmentTeamsAsync(Guid departmentId);
    }
}