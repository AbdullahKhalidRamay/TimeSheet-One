using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TimeSheetAPI.Models
{
    public class ProjectTask
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();
        
        [Required]
        public Guid LevelId { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Name { get; set; }
        
        public string Description { get; set; }
        
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        [Required]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public virtual ProjectLevel Level { get; set; }
        public virtual ICollection<ProjectSubtask> ProjectSubtasks { get; set; } = new List<ProjectSubtask>();
    }
}