using System;
using System.ComponentModel.DataAnnotations;

namespace TimeSheetAPI.Models
{
    public class Notification
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();
        
        [Required]
        public Guid UserId { get; set; }
        
        [Required]
        [StringLength(200)]
        public string Message { get; set; }
        
        public string Type { get; set; }
        
        public Guid? RelatedEntityId { get; set; }
        
        public string RelatedEntityType { get; set; }
        
        [Required]
        public bool IsRead { get; set; } = false;
        
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public virtual User User { get; set; }
    }
}