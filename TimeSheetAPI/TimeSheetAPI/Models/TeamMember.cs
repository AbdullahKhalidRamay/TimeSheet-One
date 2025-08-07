using System;
using System.ComponentModel.DataAnnotations;

namespace TimeSheetAPI.Models
{
    public class TeamMember
    {
        [Required]
        public Guid TeamId { get; set; }
        
        [Required]
        public Guid UserId { get; set; }
        
        [Required]
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public virtual Team Team { get; set; }
        public virtual User User { get; set; }
    }
}