using System;
using System.ComponentModel.DataAnnotations;

namespace TimeSheetAPI.Models
{
    public class TeamProject
    {
        [Required]
        public Guid TeamId { get; set; }
        
        [Required]
        public Guid ProjectId { get; set; }
        
        [Required]
        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public virtual Team Team { get; set; }
        public virtual Project Project { get; set; }
    }
}