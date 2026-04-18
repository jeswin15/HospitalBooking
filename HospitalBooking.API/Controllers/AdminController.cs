using HospitalBooking.Application.DTOs;
using HospitalBooking.Application.Interfaces;
using HospitalBooking.Domain.Entities;
using HospitalBooking.Domain.Enums;
using HospitalBooking.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Linq;

namespace HospitalBooking.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Policy = "AdminOnly")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IAuthService _authService;
        private readonly ISlotEngineService _slotEngine;

        public AdminController(AppDbContext context, IAuthService authService, ISlotEngineService slotEngine)
        {
            _context = context;
            _authService = authService;
            _slotEngine = slotEngine;
        }

        [HttpGet("doctors")]
        public async Task<IActionResult> GetDoctors()
        {
            var doctors = await _context.Doctors.Include(d => d.Department).ToListAsync();
            return Ok(doctors);
        }

        [HttpPost("doctors")]
        public async Task<IActionResult> CreateDoctor(CreateDoctorRequestDto request)
        {
            // Check including inactive ones to handle re-enrollment
            var existingDoctor = await _context.Doctors.IgnoreQueryFilters().FirstOrDefaultAsync(d => d.Email == request.Email);
            
            var adminIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(adminIdClaim) || !int.TryParse(adminIdClaim, out int adminId))
            {
                return Unauthorized(new { message = "Admin context not found." });
            }

            if (existingDoctor != null)
            {
                if (existingDoctor.IsActive)
                {
                    return BadRequest(new { message = "Active professional with this email already exists." });
                }

                // Reactivate and update
                existingDoctor.Name = request.Name;
                existingDoctor.Phone = request.Phone;
                existingDoctor.DepartmentId = request.DepartmentId;
                existingDoctor.Designation = request.Designation;
                existingDoctor.Qualification = request.Qualification;
                existingDoctor.ExperienceYears = request.ExperienceYears;
                existingDoctor.Bio = request.Bio;
                existingDoctor.IsActive = true;
                existingDoctor.UpdatedAt = DateTime.UtcNow;
                
                await _context.SaveChangesAsync();
                return Ok(new { message = "Former professional re-enrolled successfully", doctorId = existingDoctor.Id });
            }

            var doctor = new Doctor
            {
                Name = request.Name,
                Email = request.Email,
                Phone = request.Phone,
                DepartmentId = request.DepartmentId,
                Designation = request.Designation,
                Qualification = request.Qualification,
                ExperienceYears = request.ExperienceYears,
                Bio = request.Bio,
                CreatedByAdminId = adminId,
                PasswordHash = _authService.HashPassword("Temp@123"),
                IsFirstLogin = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Doctors.Add(doctor);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Doctor onboarded successfully", doctorId = doctor.Id });
        }

        [HttpPut("doctors/{id}")]
        public async Task<IActionResult> UpdateDoctor(int id, CreateDoctorRequestDto request)
        {
            var doctor = await _context.Doctors.FindAsync(id);
            if (doctor == null) return NotFound();

            doctor.Name = request.Name;
            doctor.Email = request.Email;
            doctor.Phone = request.Phone;
            doctor.DepartmentId = request.DepartmentId;
            doctor.Designation = request.Designation;
            doctor.Qualification = request.Qualification;
            doctor.ExperienceYears = request.ExperienceYears;
            doctor.Bio = request.Bio;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Doctor updated successfully" });
        }

        [HttpDelete("doctors/{id}")]
        public async Task<IActionResult> DeleteDoctor(int id)
        {
            var doctor = await _context.Doctors.FindAsync(id);
            if (doctor == null) return NotFound();

            doctor.IsActive = false; // Soft delete
            await _context.SaveChangesAsync();
            return Ok(new { message = "Doctor removed successfully" });
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var today = DateTime.Today;
            var sevenDaysAgo = today.AddDays(-6);
            
            var stats = new
            {
                TodayAppointments = await _context.Appointments.CountAsync(a => a.AppointmentDate.Date == today),
                TotalPatients = await _context.Patients.CountAsync(p => p.IsActive),
                ActiveDoctors = await _context.Doctors.CountAsync(d => d.IsActive),
                
                // Weekly Appointments (Line Chart Format)
                WeeklyAppointments = await _context.Appointments
                    .Where(a => a.AppointmentDate >= sevenDaysAgo && a.AppointmentDate <= today)
                    .GroupBy(a => a.AppointmentDate.Date)
                    .Select(g => new { Date = g.Key, Count = g.Count() })
                    .OrderBy(g => g.Date)
                    .ToListAsync(),
                
                // Department-wise Appointments (Bar Chart Format)
                DeptAppointments = await _context.Departments
                    .Select(d => new { 
                        Name = d.Name, 
                        Count = d.Doctors!.SelectMany(dr => dr.Appointments!).Count() 
                    })
                    .ToListAsync(),

                // Recent Registrations
                RecentPatients = await _context.Patients
                    .Where(p => p.IsActive)
                    .OrderByDescending(p => p.RegisteredAt)
                    .Take(5)
                    .Select(p => new { p.FullName, p.Email, RegisteredAt = p.RegisteredAt.ToString("MMM dd, yyyy") })
                    .ToListAsync()
            };

            return Ok(stats);
        }

        [HttpGet("departments")]
        public async Task<IActionResult> GetDepartments()
        {
            var depts = await _context.Departments.ToListAsync();
            return Ok(depts);
        }

        [HttpPost("departments")]
        public async Task<IActionResult> CreateDepartment(Department dept)
        {
            _context.Departments.Add(dept);
            await _context.SaveChangesAsync();
            return Ok(dept);
        }
        [HttpGet("patients")]
        public async Task<IActionResult> GetPatients()
        {
            var patients = await _context.Patients
                .Where(p => p.IsActive)
                .Select(p => new {
                    p.Id,
                    p.FullName,
                    p.Email,
                    p.Phone,
                    p.Gender,
                    RegisteredAt = p.RegisteredAt.ToString("MMM dd, yyyy"),
                    AppointmentCount = p.Appointments!.Count,
                    LastAppointment = p.Appointments!.OrderByDescending(a => a.AppointmentDate).Select(a => a.AppointmentDate.ToString("MMM dd, yyyy")).FirstOrDefault()
                })
                .ToListAsync();
            return Ok(patients);
        }

        [HttpPost("patients")]
        public async Task<IActionResult> CreatePatient(AdminPatientCreateDto request)
        {
            if (await _context.Patients.AnyAsync(p => p.Email == request.Email))
            {
                return BadRequest(new { message = "Email already registered." });
            }

            var patient = new Patient
            {
                FullName = request.FullName,
                Email = request.Email,
                Phone = request.Phone,
                Gender = request.Gender,
                PasswordHash = _authService.HashPassword("Temp@123"), // Auto-generate temp password
                RegisteredAt = DateTime.UtcNow,
                IsActive = true
            };

            _context.Patients.Add(patient);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Patient onboarded successfully", patientId = patient.Id });
        }

        [HttpPut("patients/{id}")]
        public async Task<IActionResult> UpdatePatient(int id, AdminPatientCreateDto request)
        {
            var patient = await _context.Patients.FindAsync(id);
            if (patient == null) return NotFound();

            patient.FullName = request.FullName;
            patient.Email = request.Email;
            patient.Phone = request.Phone;
            patient.Gender = request.Gender;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Patient updated successfully" });
        }

        [HttpDelete("patients/{id}")]
        public async Task<IActionResult> DeletePatient(int id)
        {
            var patient = await _context.Patients.FindAsync(id);
            if (patient == null) return NotFound();

            patient.IsActive = false; // Soft delete
            await _context.SaveChangesAsync();
            return Ok(new { message = "Patient record removed" });
        }

        [HttpPost("appointments/book")]
        public async Task<IActionResult> AdminBookAppointment(AdminBookingRequestDto request)
        {
            var appointment = await _slotEngine.BookTokenAsync(
                request.DoctorId,
                request.Date,
                request.TokenNumber,
                request.PatientId,
                request.ReasonForVisit ?? "Administrative Booking",
                AppointmentStatus.Confirmed
            );

            if (appointment == null)
            {
                return BadRequest(new { message = "Failed to book appointment. Slot may be unavailable." });
            }

            return Ok(new { message = "Appointment booked successfully", appointmentId = appointment.Id });
        }

        [HttpGet("appointments")]
        public async Task<IActionResult> GetAppointments()
        {
            var appointments = await _context.Appointments
                .Include(a => a.Patient)
                .Include(a => a.Doctor)
                .OrderByDescending(a => a.AppointmentDate)
                .ThenByDescending(a => a.SlotTime)
                .Select(a => new {
                    a.Id,
                    PatientName = a.Patient!.FullName,
                    DoctorName = a.Doctor!.Name,
                    a.AppointmentDate,
                    a.SlotTime,
                    a.TokenNumber,
                    a.Status
                })
                .ToListAsync();
            return Ok(appointments);
        }

        [HttpPost("seed")]
        public async Task<IActionResult> SeedDatabase()
        {
            try
            {
                await DbInitializer.SeedAsync(_context, _authService);
                return Ok(new { message = "Database seeded successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Seeding failed", error = ex.Message });
            }
        }

        [HttpPost("impersonate/{patientId}")]
        public async Task<IActionResult> ImpersonatePatient(int patientId)
        {
            var patient = await _context.Patients.FindAsync(patientId);
            if (patient == null)
            {
                return NotFound(new { message = "Patient not found." });
            }

            var token = _authService.GenerateJwtToken(patient.Id.ToString(), patient.FullName, patient.Email, "Patient");

            return Ok(new AuthResponseDto
            {
                Token = token,
                User = new UserSummaryDto 
                { 
                    Id = patient.Id, 
                    Name = patient.FullName, 
                    Email = patient.Email, 
                    Role = "Patient" 
                }
            });
        }
    }
}

