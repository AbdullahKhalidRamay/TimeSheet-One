using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TimeSheetAPI.Models
{
    public class Team
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();
        
        [Required]
        [StringLength(100)]
        public string Name { get; set; }
        
        public string Description { get; set; }
        
        [Required]
        public Guid DepartmentId { get; set; }
        
        public Guid? LeaderId { get; set; }
        
        [Required]
        public Guid CreatedBy { get; set; }
        
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        [Required]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public virtual Department Department { get; set; }
        public virtual User Leader { get; set; }
        public virtual User Creator { get; set; }
    }
}