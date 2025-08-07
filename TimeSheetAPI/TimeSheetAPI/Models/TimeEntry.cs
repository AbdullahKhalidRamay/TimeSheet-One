using System;
using System.ComponentModel.DataAnnotations;

namespace TimeSheetAPI.Models
{
    public class TimeEntry
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();
        
        [Required]
        public Guid UserId { get; set; }
        
        [Required]
        public Guid ProjectId { get; set; }
        
        [Required]
        [DataType(DataType.Date)]
        public DateTime Date { get; set; }
        
        [DataType(DataType.Time)]
        public TimeSpan? ClockIn { get; set; }
        
        [DataType(DataType.Time)]
        public TimeSpan? ClockOut { get; set; }
        
        public int? BreakTime { get; set; }
        
        [Required]
        [Range(0, 24)]
        public decimal ActualHours { get; set; }
        
        [Required]
        [Range(0, 24)]
        public decimal BillableHours { get; set; }
        
        [Required]
        [Range(0, 24)]
        public decimal TotalHours { get; set; }
        
        [Required]
        [Range(0, 24)]
        public decimal AvailableHours { get; set; }
        
        [Required]
        public string Task { get; set; }
        
        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "pending";
        
        [Required]
        public bool IsBillable { get; set; }
        
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        [Required]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public virtual User User { get; set; }
        public virtual Project Project { get; set; }
    }
}