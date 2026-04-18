using HospitalBooking.API.Hubs;
using HospitalBooking.Application.Interfaces;
using HospitalBooking.Domain.Entities;
using HospitalBooking.Domain.Enums;
using HospitalBooking.Infrastructure.Data;
using HospitalBooking.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace HospitalBooking.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Policy = "DoctorOnly")]
    public class DoctorController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<QueueHub> _hubContext;
        private readonly IPrescriptionPdfService _pdfService;

        public DoctorController(AppDbContext context, IHubContext<QueueHub> hubContext, IPrescriptionPdfService pdfService)
        {
            _context = context;
            _hubContext = hubContext;
            _pdfService = pdfService;
        }

        [HttpGet("pending")]
        public async Task<IActionResult> GetPending()
        {
            var doctorId = GetDoctorId();
            var appointments = await _context.Appointments
                .Where(a => a.DoctorId == doctorId && a.Status == AppointmentStatus.Pending)
                .Include(a => a.Patient)
                .OrderBy(a => a.AppointmentDate)
                .Select(a => new {
                    a.Id,
                    Patient = new { a.Patient!.FullName },
                    a.AppointmentDate,
                    a.TokenNumber,
                    a.SlotTime,
                    a.Status,
                    a.ReasonForVisit
                })
                .ToListAsync();
            return Ok(appointments);
        }

        [HttpGet("scheduled")]
        public async Task<IActionResult> GetScheduled()
        {
            var doctorId = GetDoctorId();
            var today = DateTime.UtcNow.Date;
            var appointments = await _context.Appointments
                .Where(a => a.DoctorId == doctorId && 
                       (a.Status == AppointmentStatus.Confirmed || a.Status == AppointmentStatus.InRoom) &&
                       a.AppointmentDate.Date == today)
                .Include(a => a.Patient)
                .OrderBy(a => a.TokenNumber)
                .Select(a => new {
                    a.Id,
                    Patient = new { a.Patient!.FullName },
                    a.AppointmentDate,
                    a.TokenNumber,
                    a.SlotTime,
                    a.Status,
                    a.ReasonForVisit
                })
                .ToListAsync();
            return Ok(appointments);
        }

        [HttpGet("upcoming")]
        public async Task<IActionResult> GetUpcoming()
        {
            var doctorId = GetDoctorId();
            var today = DateTime.UtcNow.Date;
            var appointments = await _context.Appointments
                .Where(a => a.DoctorId == doctorId && 
                       a.Status == AppointmentStatus.Confirmed &&
                       a.AppointmentDate > today)
                .Include(a => a.Patient)
                .Select(a => new {
                    a.Id,
                    Patient = new { a.Patient!.FullName },
                    a.AppointmentDate,
                    a.TokenNumber,
                    a.SlotTime,
                    a.Status,
                    a.ReasonForVisit
                })
                .ToListAsync();
            return Ok(appointments);
        }

        [HttpGet("completed")]
        public async Task<IActionResult> GetCompleted()
        {
            var doctorId = GetDoctorId();
            var appointments = await _context.Appointments
                .Where(a => a.DoctorId == doctorId && a.Status == AppointmentStatus.Completed)
                .Include(a => a.Patient)
                .OrderByDescending(a => a.AppointmentDate)
                .Select(a => new {
                    a.Id,
                    Patient = new { a.Patient!.FullName },
                    a.AppointmentDate,
                    a.TokenNumber,
                    a.SlotTime,
                    a.Status,
                    a.ReasonForVisit
                })
                .ToListAsync();
            return Ok(appointments);
        }

        [HttpPatch("appointment/{id}/confirm")]
        public async Task<IActionResult> ConfirmAppointment(int id)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null) return NotFound();
            
            appointment.Status = AppointmentStatus.Confirmed;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Appointment confirmed" });
        }

        [HttpPatch("appointment/{id}/reject")]
        public async Task<IActionResult> RejectAppointment(int id, [FromBody] RejectionRequest request)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null) return NotFound();
            
            appointment.Status = AppointmentStatus.Cancelled;
            appointment.CancelReason = request.Reason;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Appointment rejected" });
        }

        [HttpPatch("appointment/{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] StatusUpdateRequest request)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null) return NotFound();
            
            if (Enum.TryParse<AppointmentStatus>(request.Status, true, out var newStatus))
            {
                appointment.Status = newStatus;
                await _context.SaveChangesAsync();

                // Notify patients about the queue movement or status change
                await _hubContext.Clients
                    .Group($"doctor_{appointment.DoctorId}_{appointment.AppointmentDate:yyyy-MM-dd}")
                    .SendAsync("QueueUpdated", new { 
                        currentToken = appointment.TokenNumber, 
                        status = appointment.Status.ToString() 
                    });

                return Ok(new { message = "Status updated" });
            }
            return BadRequest("Invalid status");
        }

        [HttpGet("capacity")]
        public async Task<IActionResult> GetCapacity()
        {
            var doctorId = GetDoctorId();
            var doctor = await _context.Doctors.FindAsync(doctorId);
            if (doctor == null) return NotFound();

            return Ok(new {
                bookingMode = doctor.BookingMode.ToString(),
                maxTokensPerDay = doctor.MaxTokensPerDay,
                slotDuration = doctor.DefaultSlotDurationMinutes
            });
        }

        [HttpPatch("capacity")]
        public async Task<IActionResult> UpdateCapacity([FromBody] CapacityUpdateRequest request)
        {
            var doctorId = GetDoctorId();
            var doctor = await _context.Doctors.FindAsync(doctorId);
            if (doctor == null) return NotFound();

            if (Enum.TryParse<BookingMode>(request.BookingMode, true, out var mode))
            {
                doctor.BookingMode = mode;
            }
            doctor.DefaultSlotDurationMinutes = request.SlotDuration;

            // Sync with existing active schedules
            var schedules = await _context.DoctorSchedules
                .Where(s => s.DoctorId == doctorId && s.IsActive)
                .ToListAsync();

            foreach (var s in schedules)
            {
                s.SlotDurationMinutes = request.SlotDuration;
                s.MaxTokensOnline = request.MaxTokensPerDay; // Syncing daily limit to session limit for simplicity
            }

            await _context.SaveChangesAsync();

            // Broadcast that availability parameters have changed
            await _hubContext.Clients.All.SendAsync("AvailabilityUpdated", new { doctorId });

            return Ok(new { message = "Capacity updated and synced across schedules" });
        }

        [HttpGet("my-availability")]
        public async Task<IActionResult> GetMyAvailability()
        {
            var doctorId = GetDoctorId();
            var slots = await _context.DoctorAvailabilitySlots
                .Where(s => s.DoctorId == doctorId && s.Date >= DateTime.UtcNow.Date)
                .ToListAsync();
            return Ok(slots);
        }

        [HttpPost("availability")]
        public async Task<IActionResult> SaveAvailability([FromBody] List<AvailabilitySlotRequest> slots)
        {
            var doctorId = GetDoctorId();
            
            // For simplicity, we clear future slots and re-add. 
            // Real apps would merge or selectively update.
            var existing = await _context.DoctorAvailabilitySlots
                .Where(s => s.DoctorId == doctorId && s.Date >= DateTime.UtcNow.Date)
                .ToListAsync();
            _context.DoctorAvailabilitySlots.RemoveRange(existing);

            foreach (var s in slots)
            {
                _context.DoctorAvailabilitySlots.Add(new DoctorAvailabilitySlot {
                    DoctorId = doctorId,
                    Date = DateTime.Parse(s.Date).Date,
                    TimeSlot = s.TimeSlot,
                    IsBooked = false
                });
            }

            await _context.SaveChangesAsync();

            // Broadcast that specific slots have changed
            await _hubContext.Clients.All.SendAsync("AvailabilityUpdated", new { doctorId });

            return Ok(new { message = "Availability saved" });
        }

        [HttpPost("appointment/{id}/prescription")]
        public async Task<IActionResult> IssuePrescription(int id, [FromBody] PrescriptionRequest request)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null) return NotFound();

            var prescription = new Prescription
            {
                AppointmentId = id,
                PatientId = appointment.PatientId ?? 0,
                DoctorId = appointment.DoctorId,
                Diagnosis = request.Diagnosis,
                MedicinesJson = System.Text.Json.JsonSerializer.Serialize(request.Medicines),
                TestsAdvised = request.TestsAdvised,
                FollowUpDate = request.FollowUpDate,
                Notes = request.Notes,
                CreatedAt = DateTime.UtcNow
            };

            _context.Prescriptions.Add(prescription);
            
            // Mark appointment as completed
            appointment.Status = AppointmentStatus.Completed;
            
            await _context.SaveChangesAsync();

            return Ok(new { message = "Prescription issued and appointment completed", prescriptionId = prescription.Id });
        }

        [HttpGet("appointment/{id}/prescription")]
        public async Task<IActionResult> GetPrescription(int id)
        {
            var prescription = await _context.Prescriptions
                .FirstOrDefaultAsync(p => p.AppointmentId == id);
            
            if (prescription == null) return NotFound();
            return Ok(prescription);
        }

        [HttpGet("appointment/{id}/prescription/pdf")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPrescriptionPdf(int id)
        {
            var prescription = await _context.Prescriptions
                .Include(p => p.Appointment)
                    .ThenInclude(a => a.Doctor)
                        .ThenInclude(d => d.Department)
                .Include(p => p.Appointment)
                    .ThenInclude(a => a.Patient)
                .FirstOrDefaultAsync(p => p.AppointmentId == id);
            
            if (prescription == null || prescription.Appointment == null) return NotFound();

            var pdfBytes = _pdfService.GeneratePrescription(
                prescription, 
                prescription.Appointment.Doctor!, 
                prescription.Appointment.Patient!);

            return File(pdfBytes, "application/pdf", $"Prescription_{id}.pdf");
        }

        private int GetDoctorId()
        {
            return int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
        }
    }

    public class RejectionRequest { public string Reason { get; set; } = string.Empty; }
    public class StatusUpdateRequest { public string Status { get; set; } = string.Empty; }
    public class CapacityUpdateRequest 
    { 
        public string BookingMode { get; set; } = "Slot";
        public int MaxTokensPerDay { get; set; }
        public int SlotDuration { get; set; }
    }
    public class AvailabilitySlotRequest
    {
        public string Date { get; set; } = string.Empty;
        public string TimeSlot { get; set; } = string.Empty;
    }

    public class PrescriptionRequest
    {
        public string Diagnosis { get; set; } = string.Empty;
        public List<MedicineItem> Medicines { get; set; } = new();
        public string TestsAdvised { get; set; } = string.Empty;
        public DateTime? FollowUpDate { get; set; }
        public string Notes { get; set; } = string.Empty;
    }

    public class MedicineItem
    {
        public string Name { get; set; } = string.Empty;
        public string Dosage { get; set; } = string.Empty;
        public string Duration { get; set; } = string.Empty;
        public string Instructions { get; set; } = string.Empty;
    }
}
