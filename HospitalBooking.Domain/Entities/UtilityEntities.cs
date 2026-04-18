using System;

namespace HospitalBooking.Domain.Entities
{
    public class TokenLock
    {
        public int Id { get; set; }
        public int DoctorId { get; set; }
        public DateTime AppointmentDate { get; set; }
        public int TokenNumber { get; set; }
        public int PatientId { get; set; }
        public DateTime LockedAt { get; set; }
        public DateTime ExpiresAt { get; set; }   // LockedAt + 8 min
        public bool IsReleased { get; set; }
    }

    public class Review
    {
        public int Id { get; set; }
        public int AppointmentId { get; set; }
        public int PatientId { get; set; }
        public int DoctorId { get; set; }
        public int Rating { get; set; }
        public string ReviewText { get; set; } = string.Empty;
        public bool IsAnonymous { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public virtual Appointment? Appointment { get; set; }
    }

    public class AuditLog
    {
        public int Id { get; set; }
        public string ActorType { get; set; } = string.Empty;  // admin | doctor | patient
        public int ActorId { get; set; }
        public string Action { get; set; } = string.Empty;
        public string EntityType { get; set; } = string.Empty;
        public int? EntityId { get; set; }
        public string OldValues { get; set; } = string.Empty;  // JSON
        public string NewValues { get; set; } = string.Empty;  // JSON
        public string IpAddress { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class Notification
    {
        public int Id { get; set; }
        public string RecipientType { get; set; } = string.Empty;
        public int RecipientId { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Channel { get; set; } = string.Empty;   // email | sms | in_app
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public DateTime SentAt { get; set; } = DateTime.UtcNow;
    }
}
