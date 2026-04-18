using HospitalBooking.Application.DTOs;
using HospitalBooking.Domain.Entities;
using HospitalBooking.Domain.Enums;
using System;
using System.Threading.Tasks;

namespace HospitalBooking.Application.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponseDto> LoginAsync(LoginRequestDto request, string role);
        string GenerateJwtToken(string id, string name, string email, string role);
        string HashPassword(string password);
        bool VerifyPassword(string password, string hash);
    }

    public interface ISlotEngineService
    {
        Task GenerateSlotsForDateAsync(int doctorId, DateTime date);
        Task<IEnumerable<dynamic>> GetAvailableTokensAsync(int doctorId, DateTime date);
        Task<bool> HoldTokenAsync(int doctorId, DateTime date, int tokenNumber, int patientId);
        Task<Appointment> BookTokenAsync(int doctorId, DateTime date, int tokenNumber, int patientId, string? reason = null, AppointmentStatus? status = null);
    }

    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string body);
        Task SendWelcomeEmailAsync(string to, string name, string tempPassword);
    }
}
