using HospitalBooking.Domain.Enums;
using System;
using System.Collections.Generic;

namespace HospitalBooking.Domain.Entities
{
    public class Admin
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public AdminRole Role { get; set; }  // SuperAdmin | Staff
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class Department
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; } = true;
        public int CreatedByAdminId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public virtual ICollection<Doctor>? Doctors { get; set; }
    }

    public class Doctor
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public bool IsFirstLogin { get; set; } = true;
        public int DepartmentId { get; set; }
        public virtual Department? Department { get; set; }
        public string Designation { get; set; } = string.Empty;
        public string Qualification { get; set; } = string.Empty;
        public int ExperienceYears { get; set; }
        public string ProfilePhotoUrl { get; set; } = string.Empty;
        public string Bio { get; set; } = string.Empty;
        public string LanguagesSpoken { get; set; } = string.Empty;   // JSON array stored as string
        public BookingMode BookingMode { get; set; } = BookingMode.Slot;
        public int MaxTokensPerDay { get; set; } = 50;
        public int DefaultSlotDurationMinutes { get; set; } = 15;
        public bool IsActive { get; set; } = true;
        public int CreatedByAdminId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public virtual ICollection<DoctorSchedule>? Schedules { get; set; }
        public virtual ICollection<Appointment>? Appointments { get; set; }
        public virtual ICollection<Review>? Reviews { get; set; }
        public virtual ICollection<DoctorAvailabilitySlot>? AvailabilitySlots { get; set; }
    }

    public class DoctorAvailabilitySlot
    {
        public int Id { get; set; }
        public int DoctorId { get; set; }
        public virtual Doctor? Doctor { get; set; }
        public DateTime Date { get; set; }
        public string TimeSlot { get; set; } = string.Empty; // e.g. "09:00 AM"
        public bool IsBooked { get; set; } = false;
    }

    public class DoctorSchedule
    {
        public int Id { get; set; }
        public int DoctorId { get; set; }
        public virtual Doctor? Doctor { get; set; }
        public DayOfWeek DayOfWeek { get; set; }
        public SessionType Session { get; set; }   // Morning | Afternoon | Evening
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public int SlotDurationMinutes { get; set; }
        public int MaxTokensOnline { get; set; }
        public int MaxTokensWalkIn { get; set; }
        public int BufferMinutes { get; set; }
        public bool IsActive { get; set; } = true;
        public virtual ICollection<Appointment>? Appointments { get; set; }
    }
}
