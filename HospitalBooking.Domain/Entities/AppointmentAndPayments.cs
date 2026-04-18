using HospitalBooking.Domain.Enums;
using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace HospitalBooking.Domain.Entities
{
    public class Appointment
    {
        public int Id { get; set; }
        public int? PatientId { get; set; }
        public virtual Patient? Patient { get; set; }
        public int DoctorId { get; set; }
        public virtual Doctor? Doctor { get; set; }
        public int? ScheduleId { get; set; }
        public virtual DoctorSchedule? Schedule { get; set; }
        public DateTime AppointmentDate { get; set; }
        public int TokenNumber { get; set; }
        public TimeSpan SlotTime { get; set; }
        public BookingType BookingType { get; set; }   // Online | WalkIn
        public AppointmentStatus Status { get; set; }
        public int? FamilyMemberId { get; set; }
        public virtual FamilyMember? FamilyMember { get; set; }
        public string ReasonForVisit { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
        public string CancelReason { get; set; } = string.Empty;
        public bool IsFollowUp { get; set; }
        public int? ParentAppointmentId { get; set; }
        public bool Reminder24hSent { get; set; }
        public bool Reminder1hSent { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public virtual Prescription? Prescription { get; set; }
        public virtual Review? Review { get; set; }
    }

    public class Prescription
    {
        public int Id { get; set; }
        public int AppointmentId { get; set; }
        public virtual Appointment? Appointment { get; set; }
        public int DoctorId { get; set; }
        public int PatientId { get; set; }
        public string Diagnosis { get; set; } = string.Empty;
        public string MedicinesJson { get; set; } = string.Empty;   // serialized List<Medicine>
        public string TestsAdvised { get; set; } = string.Empty;
        public DateTime? FollowUpDate { get; set; }
        public string Notes { get; set; } = string.Empty;
        public string PdfUrl { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

}
