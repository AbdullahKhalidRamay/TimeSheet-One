using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TimeSheetAPI.Models
{
    public class ProjectLevel
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();
        
        [Required]
        public Guid ProjectId { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Name { get; set; }
        
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        [Required]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public virtual Project Project { get; set; }
        public virtual ICollection<ProjectTask> ProjectTasks { get; set; } = new List<ProjectTask>();
    }
}