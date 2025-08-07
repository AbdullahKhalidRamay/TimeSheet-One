using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TimeSheetAPI.Models
{
    public class User
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();
        
        [Required]
        [EmailAddress]
        [StringLength(100)]
        public string Email { get; set; }
        
        [Required]
        public string PasswordHash { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Name { get; set; }
        
        [Required]
        [StringLength(20)]
        public string Role { get; set; }
        
        [Required]
        [StringLength(100)]
        public string JobTitle { get; set; }
        
        public decimal? BillableRate { get; set; }
        
        [Required]
        public decimal AvailableHours { get; set; } = 8.0m;
        
        [Required]
        public decimal TotalBillableHours { get; set; } = 0.0m;
        
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        [Required]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public virtual ICollection<TimeEntry> TimeEntries { get; set; } = new List<TimeEntry>();
    }
}