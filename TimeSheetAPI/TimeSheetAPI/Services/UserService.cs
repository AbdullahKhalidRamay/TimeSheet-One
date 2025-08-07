using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using TimeSheetAPI.Data;
using TimeSheetAPI.Models;

namespace TimeSheetAPI.Services
{
    public class UserService : IUserService
    {
        private readonly TimeFlowDbContext _context;

        public UserService(TimeFlowDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<User>> GetAllUsersAsync()
        {
            return await _context.Users.ToListAsync();
        }

        public async Task<User> GetUserByIdAsync(Guid id)
        {
            return await _context.Users.FindAsync(id);
        }

        public async Task<User> GetUserByEmailAsync(string email)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
        }

        public async Task<User> CreateUserAsync(User user, string password)
        {
            // Check if user already exists
            if (await _context.Users.AnyAsync(u => u.Email.ToLower() == user.Email.ToLower()))
            {
                throw new InvalidOperationException("Email already exists");
            }

            // Hash password
            user.PasswordHash = HashPassword(password);
            
            // Set default values
            user.CreatedAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return user;
        }

        public async Task UpdateUserAsync(User user)
        {
            var existingUser = await _context.Users.FindAsync(user.Id);
            if (existingUser == null)
            {
                throw new InvalidOperationException("User not found");
            }

            // Update properties
            existingUser.Name = user.Name;
            existingUser.Email = user.Email;
            existingUser.Role = user.Role;
            existingUser.JobTitle = user.JobTitle;
            existingUser.BillableRate = user.BillableRate;
            existingUser.AvailableHours = user.AvailableHours;
            existingUser.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        public async Task DeleteUserAsync(Guid id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                throw new InvalidOperationException("User not found");
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> ValidateUserCredentialsAsync(string email, string password)
        {
            var user = await GetUserByEmailAsync(email);
            if (user == null)
            {
                return false;
            }

            return VerifyPassword(password, user.PasswordHash);
        }

        public async Task<User> AuthenticateAsync(string email, string password)
        {
            var user = await GetUserByEmailAsync(email);
            if (user == null || !VerifyPassword(password, user.PasswordHash))
            {
                return null;
            }

            return user;
        }

        private string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashedBytes);
            }
        }

        private bool VerifyPassword(string password, string storedHash)
        {
            var hashedPassword = HashPassword(password);
            return hashedPassword == storedHash;
        }
    }
}