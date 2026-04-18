using HospitalBooking.Domain.Enums;
using System;
using System.Collections.Generic;

namespace HospitalBooking.Domain.Entities
{
    public class Patient
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public DateTime DateOfBirth { get; set; }
        public string Gender { get; set; } = string.Empty;
        public string BloodGroup { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Pincode { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string ProfilePhotoUrl { get; set; } = string.Empty;
        public bool IsEmailVerified { get; set; }
        public bool IsPhoneVerified { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastLogin { get; set; }
        public virtual ICollection<FamilyMember>? FamilyMembers { get; set; }
        public virtual ICollection<Appointment>? Appointments { get; set; }
    }

    public class FamilyMember
    {
        public int Id { get; set; }
        public int PatientId { get; set; }
        public virtual Patient? Patient { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Relation { get; set; } = string.Empty;
        public DateTime DateOfBirth { get; set; }
        public string Gender { get; set; } = string.Empty;
        public string BloodGroup { get; set; } = string.Empty;
    }

    public class SlotBlock
    {
        public int Id { get; set; }
        public int DoctorId { get; set; }
        public virtual Doctor? Doctor { get; set; }
        public DateTime BlockDate { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string BlockedBy { get; set; } = string.Empty;  // "admin" | "doctor"
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
