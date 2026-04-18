namespace HospitalBooking.Domain.Enums
{
    public enum AdminRole { SuperAdmin, Staff }
    public enum SessionType { Morning, Afternoon, Evening }
    public enum BookingType { Online, WalkIn }
    public enum BookingMode { Slot, Token }
    public enum AppointmentStatus
    {
        Available, Pending, Confirmed, CheckedIn, InRoom, Completed, Cancelled, NoShow
    }
    public enum PaymentStatus
    {
        Initiated, Success, Failed, Refunded
    }
}
