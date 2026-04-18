using System;

namespace HospitalBooking.Application.DTOs
{
    public class TokenLockRequest
    {
        public int DoctorId { get; set; }
        public DateTime Date { get; set; }
        public int TokenNumber { get; set; }
    }

    public class BookingConfirmationRequest
    {
        public int DoctorId { get; set; }
        public DateTime Date { get; set; }
        public int TokenNumber { get; set; }
        public string? ReasonForVisit { get; set; }
    }

    public class AdminBookingRequestDto
    {
        public int PatientId { get; set; }
        public int DoctorId { get; set; }
        public DateTime Date { get; set; }
        public int TokenNumber { get; set; }
        public string? ReasonForVisit { get; set; }
    }
}

