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

            var midnightDate = date.Date;

            // 1. Fetch existing status data
            var appointmentsList = await _context.Appointments
                .Where(a => a.DoctorId == doctorId && a.AppointmentDate.Date == midnightDate && a.Status != AppointmentStatus.Cancelled)
                .ToListAsync();
            
            var apptDict = appointmentsList
                .GroupBy(a => a.TokenNumber)
                .ToDictionary(g => g.Key, g => g.First());

            var locksList = await _context.TokenLocks
                .Where(t => t.DoctorId == doctorId && t.AppointmentDate.Date == midnightDate && !t.IsReleased && t.ExpiresAt > DateTime.UtcNow)
                .ToListAsync();

            var locksDict = locksList
                .GroupBy(t => t.TokenNumber)
                .ToDictionary(g => g.Key, g => g.First());

            var tokens = new List<dynamic>();

            // 2. Fetch manual slots (if any)
            var manualSlots = await _context.DoctorAvailabilitySlots
                .Where(s => s.DoctorId == doctorId && s.Date.Date == midnightDate)
                .OrderBy(s => s.TimeSlot)
                .ToListAsync();

            if (manualSlots.Any(s => s.TimeSlot != "TOKEN_SESSION"))
            {
                // Unified Logic Part A: Manual Slots Override
                for (int i = 0; i < manualSlots.Count; i++)
                {
                    var s = manualSlots[i];
                    if (s.TimeSlot == "TOKEN_SESSION") continue;

                    var tokenNum = i + 1;
                    var status = s.IsBooked ? "Booked" : "Available";

                    if (status == "Available" && locksDict.ContainsKey(tokenNum)) status = "Locked";
                    if (status == "Available" && apptDict.ContainsKey(tokenNum)) status = "Booked";

                    tokens.Add(new
                    {
                        id = s.Id,
                        tokenNumber = tokenNum,
                        status = status,
                        isLocked = status == "Locked" || status == "Booked",
                        slotTime = s.TimeSlot
                    });
                }
            }
            else if (doctor.BookingMode == BookingMode.Token)
            {
                // Unified Logic Part B: Fallback to Automated Tokens (Schedule-based)
                // Only proceed if TOKEN_SESSION is marked 'ON' or if it's the doctor's default
                var isAvailableManually = manualSlots.Any(s => s.TimeSlot == "TOKEN_SESSION");
                
                if (isAvailableManually)
                {
                    var schedule = await _context.DoctorSchedules
                        .Where(s => s.DoctorId == doctorId && s.DayOfWeek == date.DayOfWeek && s.IsActive)
                        .FirstOrDefaultAsync();

                    var totalTokens = schedule?.MaxTokensOnline ?? doctor.MaxTokensPerDay;
                    var startTime = schedule?.StartTime ?? new TimeSpan(9, 0, 0);
                    var slotDuration = schedule?.SlotDurationMinutes ?? doctor.DefaultSlotDurationMinutes;
                    if (slotDuration <= 0) slotDuration = 15;

                    for (int i = 1; i <= totalTokens; i++)
                    {
                        var status = "Available";
                        if (apptDict.ContainsKey(i)) status = "Booked";
                        else if (locksDict.ContainsKey(i)) status = "Locked";

                        var slotTime = startTime.Add(TimeSpan.FromMinutes((i - 1) * slotDuration));

                        tokens.Add(new
                        {
                            id = i,
                            tokenNumber = i,
                            status = status,
                            isLocked = status == "Locked" || status == "Booked",
                            slotTime = slotTime.ToString(@"hh\:mm")
                        });
                    }
                }
            }

            return tokens;
        }

        public async Task<(bool Success, string Message, List<int> ReleasedTokens)> HoldTokenAsync(int doctorId, DateTime date, int tokenNumber, int patientId)
        {
            var previousLocks = await _context.TokenLocks
                .Where(t => t.PatientId == patientId && t.DoctorId == doctorId && !t.IsReleased)
                .ToListAsync();
            
            var releasedTokens = previousLocks.Select(l => l.TokenNumber).ToList();

            foreach(var pl in previousLocks) pl.IsReleased = true;
            await _context.SaveChangesAsync();

            var (success, error) = await CheckAndLockAsync(doctorId, date, tokenNumber, patientId);
            return (success, error, releasedTokens);
        }

        private async Task<(bool Success, string Error)> CheckAndLockAsync(int doctorId, DateTime date, int tokenNumber, int patientId)
        {
            var midnightDate = date.Date;

            // Use a transaction to ensure atomicity and prevent double-locking
            using var transaction = await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
            try 
            {
                var activeLock = await _context.TokenLocks
                    .FirstOrDefaultAsync(t => t.DoctorId == doctorId && t.AppointmentDate.Date == midnightDate && t.TokenNumber == tokenNumber && !t.IsReleased && t.ExpiresAt > DateTime.UtcNow);
                
                if (activeLock != null) 
                {
                    if (activeLock.PatientId == patientId) 
                    {
                        await transaction.RollbackAsync();
                        return (true, "Already held by you");
                    }
                    await transaction.RollbackAsync();
                    return (false, "This slot is currently held by another user.");
                }

                var isBooked = await _context.Appointments
                    .AnyAsync(a => a.DoctorId == doctorId && a.AppointmentDate.Date == midnightDate && a.TokenNumber == tokenNumber && a.Status != AppointmentStatus.Cancelled);

                if (isBooked) 
                {
                    await transaction.RollbackAsync();
                    return (false, "This slot is already booked.");
                }

                var @lock = new TokenLock
                {
                    DoctorId = doctorId,
                    PatientId = patientId,
                    AppointmentDate = midnightDate,
                    TokenNumber = tokenNumber,
                    LockedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddMinutes(8),
                    IsReleased = false
                };

                _context.TokenLocks.Add(@lock);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return (true, "Success");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return (false, $"Internal Error: {ex.Message}");
            }
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
