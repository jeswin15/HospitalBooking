using HospitalBooking.Application.DTOs;
using HospitalBooking.Application.Interfaces;
using HospitalBooking.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace HospitalBooking.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IAuthService _authService;

        public AuthController(AppDbContext context, IAuthService authService)
        {
            _context = context;
            _authService = authService;
        }

        [HttpPost("admin/login")]
        public async Task<IActionResult> AdminLogin(LoginRequestDto request)
        {
            var admin = await _context.Admins.FirstOrDefaultAsync(a => a.Email == request.Email);
            if (admin == null || !_authService.VerifyPassword(request.Password, admin.PasswordHash))
            {
                return Unauthorized(new { message = "Invalid email or password." });
            }

            var token = _authService.GenerateJwtToken(admin.Id.ToString(), admin.Name, admin.Email, admin.Role.ToString());
            
            return Ok(new AuthResponseDto
            {
                Token = token,
                User = new UserSummaryDto { Id = admin.Id, Name = admin.Name, Email = admin.Email, Role = admin.Role.ToString() }
            });
        }

        [HttpPost("doctor/login")]
        public async Task<IActionResult> DoctorLogin(LoginRequestDto request)
        {
            var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.Email == request.Email);
            if (doctor == null || !_authService.VerifyPassword(request.Password, doctor.PasswordHash))
            {
                return Unauthorized(new { message = "Invalid email or password." });
            }

            var token = _authService.GenerateJwtToken(doctor.Id.ToString(), doctor.Name, doctor.Email, "Doctor");

            return Ok(new AuthResponseDto
            {
                Token = token,
                User = new UserSummaryDto { Id = doctor.Id, Name = doctor.Name, Email = doctor.Email, Role = "Doctor" }
            });
        }

        [HttpPost("patient/login")]
        public async Task<IActionResult> PatientLogin(LoginRequestDto request)
        {
            var patient = await _context.Patients.FirstOrDefaultAsync(p => p.Email == request.Email);
            if (patient == null || !_authService.VerifyPassword(request.Password, patient.PasswordHash))
            {
                return Unauthorized(new { message = "Invalid email or password." });
            }

            var token = _authService.GenerateJwtToken(patient.Id.ToString(), patient.FullName, patient.Email, "Patient");

            return Ok(new AuthResponseDto
            {
                Token = token,
                User = new UserSummaryDto { Id = patient.Id, Name = patient.FullName, Email = patient.Email, Role = "Patient" }
            });
        }

        [HttpPost("patient/register")]
        public async Task<IActionResult> PatientRegister(PatientRegisterDto request)
        {
            if (await _context.Patients.AnyAsync(p => p.Email == request.Email))
            {
                return BadRequest(new { message = "Email already registered." });
            }

            var patient = new HospitalBooking.Domain.Entities.Patient
            {
                FullName = request.Name,
                Email = request.Email,
                Phone = request.Phone,
                Gender = request.Gender,
                PasswordHash = _authService.HashPassword(request.Password),
                RegisteredAt = DateTime.UtcNow,
                IsActive = true
            };

            _context.Patients.Add(patient);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Registration successful" });
        }
    }
}
