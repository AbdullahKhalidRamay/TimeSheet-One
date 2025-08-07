using System;
using System.ComponentModel.DataAnnotations;

namespace TimeSheetAPI.Models
{
    public class ApprovalAction
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();
        
        [Required]
        public Guid TimeEntryId { get; set; }
        
        [Required]
        public Guid RequestedById { get; set; }
        
        public Guid? ApprovedById { get; set; }
        
        [Required]
        [StringLength(50)]
        public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected
        
        public string Comments { get; set; }
        
        [Required]
        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? ActionedAt { get; set; }
        
        // Navigation properties
        public virtual TimeEntry TimeEntry { get; set; }
        public virtual User RequestedBy { get; set; }
        public virtual User ApprovedBy { get; set; }
    }
}