using HospitalBooking.Application.Interfaces;
using HospitalBooking.Domain.Entities;
using HospitalBooking.Domain.Enums;
using HospitalBooking.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace HospitalBooking.Infrastructure.Services
{
    public class SlotEngineService : ISlotEngineService
    {
        private readonly AppDbContext _context;

        public SlotEngineService(AppDbContext context)
        {
            _context = context;
        }

        public async Task GenerateSlotsForDateAsync(int doctorId, DateTime date)
        {
            // Placeholder for background job or manual generation
            await Task.CompletedTask;
        }

        public async Task<IEnumerable<dynamic>> GetAvailableTokensAsync(int doctorId, DateTime date)
        {
            var doctor = await _context.Doctors.FindAsync(doctorId);
            if (doctor == null) return Enumerable.Empty<dynamic>();

            var schedule = await _context.DoctorSchedules
                .Where(s => s.DoctorId == doctorId && s.DayOfWeek == date.DayOfWeek && s.IsActive)
                .FirstOrDefaultAsync();

            var existingAppointments = await _context.Appointments
                .Where(a => a.DoctorId == doctorId && a.AppointmentDate == date.Date && a.Status != AppointmentStatus.Cancelled)
                .ToDictionaryAsync(a => a.TokenNumber);

            var existingLocks = await _context.TokenLocks
                .Where(t => t.DoctorId == doctorId && t.AppointmentDate == date.Date && !t.IsReleased && t.ExpiresAt > DateTime.UtcNow)
                .ToDictionaryAsync(t => t.TokenNumber);

            var tokens = new List<dynamic>();

            // TOKEN MODE: Use Schedule if exists, otherwise fallback to doctor defaults
            if (doctor.BookingMode == BookingMode.Token)
            {
                // Check if doctor has a manual 'ON' entry for this date
                // We use .Date to ensure timezone/time precision doesn't cause a mismatch
                var isAvailableManually = await _context.DoctorAvailabilitySlots
                    .AnyAsync(s => s.DoctorId == doctorId && s.Date.Date == date.Date && s.TimeSlot == "TOKEN_SESSION");
                
                if (!isAvailableManually) return tokens; // No manual ON for this date

                // Fallback to Doctor defaults if no specific schedule found for this day
                var totalTokens = schedule?.MaxTokensOnline ?? doctor.MaxTokensPerDay;
                var startTime = schedule?.StartTime ?? new TimeSpan(9, 0, 0); // Default 9 AM
                var slotDuration = (schedule?.SlotDurationMinutes ?? doctor.DefaultSlotDurationMinutes);
                if (slotDuration <= 0) slotDuration = 15;

                if (existingAppointments.Count >= totalTokens) return tokens;

                for (int i = 1; i <= totalTokens; i++)
                {
                    var status = getStatus(i, existingAppointments, existingLocks);
                    var slotTime = startTime.Add(TimeSpan.FromMinutes((i - 1) * slotDuration));

                    tokens.Add(new
                    {
                        id = i,
                        tokenNumber = i,
                        status = status,
                        isLocked = status == "Locked",
                        slotTime = slotTime.ToString(@"hh\:mm")
                    });
                }
            }
            // SLOT MODE: Use DoctorAvailabilitySlots (saved in grid) as master
            {
                var savedSlots = await _context.DoctorAvailabilitySlots
                    .Where(s => s.DoctorId == doctorId && s.Date.Date == date.Date)
                    .OrderBy(s => s.TimeSlot)
                    .ToListAsync();

                for (int i = 0; i < savedSlots.Count; i++)
                {
                    var s = savedSlots[i];
                    var tokenNum = i + 1;
                    var status = s.IsBooked ? "Booked" : "Available";

                    if (status == "Available" && existingLocks.ContainsKey(tokenNum)) status = "Locked";
                    if (status == "Available" && existingAppointments.ContainsKey(tokenNum)) status = "Booked";

                    tokens.Add(new
                    {
                        id = s.Id,
                        tokenNumber = tokenNum,
                        status = status,
                        isLocked = status == "Locked",
                        slotTime = s.TimeSlot
                    });
                }
            }

            return tokens;
        }

        private string getStatus(int tokenNumber, Dictionary<int, Appointment> appts, Dictionary<int, TokenLock> locks)
        {
            if (appts.ContainsKey(tokenNumber)) return "Booked";
            if (locks.ContainsKey(tokenNumber)) return "Locked";
            return "Available";
        }

        public async Task<bool> HoldTokenAsync(int doctorId, DateTime date, int tokenNumber, int patientId)
        {
            // First, release any existing locks for THIS patient for THIS doctor/date to avoid orphans
            var previousLocks = await _context.TokenLocks
                .Where(t => t.PatientId == patientId && t.DoctorId == doctorId && !t.IsReleased)
                .ToListAsync();
            
            foreach(var pl in previousLocks) pl.IsReleased = true;

            var result = await CheckAndLockAsync(doctorId, date, tokenNumber, patientId);
            return result;
        }

        private async Task<bool> CheckAndLockAsync(int doctorId, DateTime date, int tokenNumber, int patientId)
        {
            var isTaken = await _context.TokenLocks
                .AnyAsync(t => t.DoctorId == doctorId && t.AppointmentDate.Date == date.Date && t.TokenNumber == tokenNumber && !t.IsReleased && t.ExpiresAt > DateTime.UtcNow);
            
            if (isTaken) return false;

            var isBooked = await _context.Appointments
                .AnyAsync(a => a.DoctorId == doctorId && a.AppointmentDate.Date == date.Date && a.TokenNumber == tokenNumber && a.Status != AppointmentStatus.Cancelled);

            if (isBooked) return false;

            var @lock = new TokenLock
            {
                DoctorId = doctorId,
                PatientId = patientId,
                AppointmentDate = date.Date,
                TokenNumber = tokenNumber,
                LockedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddMinutes(8),
                IsReleased = false
            };

            _context.TokenLocks.Add(@lock);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<Appointment> BookTokenAsync(int doctorId, DateTime date, int tokenNumber, int patientId, string? reason = null, AppointmentStatus? status = null)
        {
            var @lock = await _context.TokenLocks
                .FirstOrDefaultAsync(t => t.DoctorId == doctorId && t.AppointmentDate.Date == date.Date && t.TokenNumber == tokenNumber && t.PatientId == patientId && !t.IsReleased);

            if (@lock == null) return null;

            var doctor = await _context.Doctors.FindAsync(doctorId);
            var schedule = await _context.DoctorSchedules
                .Include(s => s.Doctor)
                .FirstOrDefaultAsync(s => s.DoctorId == doctorId && s.DayOfWeek == date.DayOfWeek);

            TimeSpan finalSlotTime = TimeSpan.Zero;

            if (doctor?.BookingMode == BookingMode.Token)
            {
                finalSlotTime = schedule?.StartTime.Add(TimeSpan.FromMinutes((tokenNumber - 1) * (schedule?.SlotDurationMinutes ?? 15))) ?? TimeSpan.Zero;
            }
            else
            {
                // Slot Mode: Find the manual slot
                var savedSlots = await _context.DoctorAvailabilitySlots
                    .Where(s => s.DoctorId == doctorId && s.Date.Date == date.Date)
                    .OrderBy(s => s.TimeSlot)
                    .ToListAsync();
                
                var index = tokenNumber - 1;
                if (index < savedSlots.Count)
                {
                    var slot = savedSlots[index];
                    slot.IsBooked = true;
                    // Attempt to parse "hh:mm AM" to TimeSpan
                    if (DateTime.TryParse(slot.TimeSlot, out var parsed))
                    {
                        finalSlotTime = parsed.TimeOfDay;
                    }
                }
            }

            var appointment = new Appointment
            {
                DoctorId = doctorId,
                PatientId = patientId,
                ScheduleId = schedule?.Id,
                AppointmentDate = date.Date,
                TokenNumber = tokenNumber,
                SlotTime = finalSlotTime,
                ReasonForVisit = reason,
                Status = status ?? (doctor?.BookingMode == BookingMode.Token ? AppointmentStatus.Confirmed : AppointmentStatus.Pending),
                CreatedAt = DateTime.UtcNow
            };

            _context.Appointments.Add(appointment);
            @lock.IsReleased = true;
            
            await _context.SaveChangesAsync();
            return appointment;
        }
    }
}
