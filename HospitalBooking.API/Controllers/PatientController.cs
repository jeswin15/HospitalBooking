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

using HospitalBooking.API.Hubs;
using Microsoft.AspNetCore.SignalR;
using HospitalBooking.Infrastructure.Services;

namespace HospitalBooking.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PatientController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ISlotEngineService _slotEngine;
        private readonly IHubContext<QueueHub> _hubContext;
        private readonly IPrescriptionPdfService _pdfService;

        public PatientController(AppDbContext context, ISlotEngineService slotEngine, IHubContext<QueueHub> hubContext, IPrescriptionPdfService pdfService)
        {
            _context = context;
            _slotEngine = slotEngine;
            _hubContext = hubContext;
            _pdfService = pdfService;
        }

        [HttpGet("doctors")]
        public async Task<IActionResult> GetAllDoctors()
        {
            var doctors = await _context.Doctors
                .Where(d => d.IsActive)
                .Select(d => new {
                    d.Id,
                    d.Name,
                    d.Designation,
                    d.DepartmentId,
                    DepartmentName = d.Department.Name,
                    d.BookingMode,
                    d.ProfilePhotoUrl,
                    d.ExperienceYears,
                    d.Qualification
                })
                .ToListAsync();
            return Ok(doctors);
        }

        [HttpGet("departments")]
        public async Task<IActionResult> GetDepartments()
        {
            var departments = await _context.Departments
                .Select(d => new { 
                    d.Id, 
                    d.Name, 
                    DoctorCount = d.Doctors.Count(doc => doc.IsActive) 
                })
                .ToListAsync();
            return Ok(departments);
        }

        [HttpGet("appointments/slots/{id}")]
        public async Task<IActionResult> GetSlots(int id, [FromQuery] DateTime date)
        {
            var slots = await _slotEngine.GetAvailableTokensAsync(id, date);
            return Ok(slots);
        }

        [HttpGet("doctors/{id}/availability-dates")]
        public async Task<IActionResult> GetAvailableDates(int id)
        {
            var dates = await _context.DoctorAvailabilitySlots
                .Where(s => s.DoctorId == id && s.Date >= DateTime.UtcNow.Date)
                .OrderBy(s => s.Date)
                .Select(s => s.Date)
                .Distinct()
                .ToListAsync();

            var dateStrings = dates.Select(d => d.ToString("yyyy-MM-dd")).ToList();
            return Ok(dateStrings);
        }

        [HttpPost("appointments/lock")]
        [Authorize(Policy = "PatientOnly")]
        public async Task<IActionResult> HoldToken(TokenLockRequest request)
        {
            var patientIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(patientIdClaim) || !int.TryParse(patientIdClaim, out int patientId))
            {
                return Unauthorized(new { message = "Patient session not found." });
            }

            var result = await _slotEngine.HoldTokenAsync(request.DoctorId, request.Date, request.TokenNumber, patientId);
            if (!result) return BadRequest(new { message = "Slot just taken or unavailable" });

            // Broadcast lock to all patients viewing this doctor/date
            await _hubContext.Clients.Group($"doctor_{request.DoctorId}_{request.Date:yyyy-MM-dd}")
                .SendAsync("SlotStateChanged", new { tokenNumber = request.TokenNumber, status = "Locked" });

            return Ok(new { message = "Slot held for 8 minutes" });
        }

        [HttpGet("appointments")]
        [Authorize(Policy = "PatientOnly")]
        public async Task<IActionResult> GetMyAppointments()
        {
            var patientId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var appointments = await _context.Appointments
                .Where(a => a.PatientId == patientId)
                .Include(a => a.Doctor)
                .ThenInclude(d => d.Department)
                .OrderByDescending(a => a.AppointmentDate)
                .Select(a => new {
                    id = a.Id,
                    doctorName = a.Doctor.Name,
                    departmentName = a.Doctor.Department.Name,
                    date = a.AppointmentDate.ToString("yyyy-MM-dd"),
                    tokenNumber = a.TokenNumber,
                    slotTime = a.SlotTime.ToString(@"hh\:mm"),
                    status = a.Status.ToString(),
                    doctorId = a.DoctorId,
                    cancelReason = a.CancelReason
                })
                .ToListAsync();

            return Ok(appointments);
        }

        [HttpPost("appointments/book")]
        [Authorize(Policy = "PatientOnly")]
        public async Task<IActionResult> ConfirmBooking(BookingConfirmationRequest request)
        {
            var patientIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(patientIdClaim) || !int.TryParse(patientIdClaim, out int patientId))
            {
                return Unauthorized(new { message = "Patient session not found." });
            }

            var doctor = await _context.Doctors.FindAsync(request.DoctorId);
            if (doctor == null) return NotFound("Doctor not found");

            // Call the unified booking logic in SlotEngine
            var appointment = await _slotEngine.BookTokenAsync(
                request.DoctorId, 
                request.Date, 
                request.TokenNumber, 
                patientId, 
                request.ReasonForVisit
            );

            if (appointment == null) 
            {
                return BadRequest(new { message = "Your token lock has expired or slot was taken. Please select again." });
            }

            var dateStr = request.Date.ToString("yyyy-MM-dd");

            // 1. Notify patients: Slot is now Booked
            await _hubContext.Clients.Group($"doctor_{request.DoctorId}_{dateStr}")
                .SendAsync("SlotStateChanged", new { tokenNumber = request.TokenNumber, status = "Booked" });

            // 2. Notify Doctor: New appointment request received
            await _hubContext.Clients.Group($"doctor_{request.DoctorId}")
                .SendAsync("NewAppointmentRequest", new { 
                    appointmentId = appointment.Id,
                    patientName = User.FindFirst(ClaimTypes.Name)?.Value,
                    tokenNumber = appointment.TokenNumber
                });
            
            return Ok(new { message = "Appointment booked successfully", appointmentId = appointment.Id });
        }

        [HttpGet("appointments/{id}/prescription")]
        [Authorize(Policy = "PatientOnly")]
        public async Task<IActionResult> GetPrescriptionPdf(int id)
        {
            var patientId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var prescription = await _context.Prescriptions
                .Include(p => p.Appointment)
                    .ThenInclude(a => a.Doctor)
                        .ThenInclude(d => d.Department)
                .Include(p => p.Appointment)
                    .ThenInclude(a => a.Patient)
                .FirstOrDefaultAsync(p => p.AppointmentId == id && p.PatientId == patientId);
            
            if (prescription == null || prescription.Appointment == null) return NotFound();

            var pdfBytes = _pdfService.GeneratePrescription(
                prescription, 
                prescription.Appointment.Doctor!, 
                prescription.Appointment.Patient!);

            return File(pdfBytes, "application/pdf", $"Prescription_{id}.pdf");
        }

        [HttpGet("appointments/{id}/prescription/data")]
        [Authorize(Policy = "PatientOnly")]
        public async Task<IActionResult> GetPrescriptionData(int id)
        {
            var patientId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var prescription = await _context.Prescriptions
                .Where(p => p.AppointmentId == id && p.PatientId == patientId)
                .Select(p => new {
                    p.Diagnosis,
                    p.TestsAdvised,
                    p.FollowUpDate,
                    p.Notes,
                    Medicines = System.Text.Json.JsonSerializer.Deserialize<List<MedicineItem>>(p.MedicinesJson ?? "[]")
                })
                .FirstOrDefaultAsync();
            
            if (prescription == null) return NotFound();
            return Ok(prescription);
        }

    }
}
