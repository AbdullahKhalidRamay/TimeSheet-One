using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TimeSheetAPI.Models
{
    public class Department
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();
        
        [Required]
        [StringLength(100)]
        public string Name { get; set; }
        
        public string Description { get; set; }
        
        public Guid? ManagerId { get; set; }
        
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        [Required]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public virtual User Manager { get; set; }
        public virtual ICollection<Team> Teams { get; set; } = new List<Team>();
    }
}