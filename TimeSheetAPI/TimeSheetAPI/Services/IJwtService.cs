using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TimeSheetAPI.Models;

namespace TimeSheetAPI.Services
{
    public interface IJwtService
    {
        string GenerateToken(User user);
        bool ValidateToken(string token);
        Guid? GetUserIdFromToken(string token);
    }
}