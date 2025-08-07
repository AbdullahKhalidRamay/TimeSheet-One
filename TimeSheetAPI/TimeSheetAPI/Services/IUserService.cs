using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TimeSheetAPI.Models;

namespace TimeSheetAPI.Services
{
    public interface IUserService
    {
        Task<IEnumerable<User>> GetAllUsersAsync();
        Task<User> GetUserByIdAsync(Guid id);
        Task<User> GetUserByEmailAsync(string email);
        Task<User> CreateUserAsync(User user, string password);
        Task UpdateUserAsync(User user);
        Task DeleteUserAsync(Guid id);
        Task<bool> ValidateUserCredentialsAsync(string email, string password);
        Task<User> AuthenticateAsync(string email, string password);
    }
}