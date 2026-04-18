using HospitalBooking.Domain.Entities;
using HospitalBooking.Domain.Enums;
using HospitalBooking.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HospitalBooking.Infrastructure.Jobs
{
    public class SlotGenerationJob
    {
        private readonly AppDbContext _context;

        public SlotGenerationJob(AppDbContext context)
        {
            _context = context;
        }

        public async Task GenerateTomorrowSlotsAsync()
        {
            var tomorrow = DateTime.Today.AddDays(1);
            var dayOfWeek = tomorrow.DayOfWeek;

            var activeSchedules = await _context.DoctorSchedules
                .Where(s => s.IsActive && s.DayOfWeek == dayOfWeek)
                .Include(s => s.Doctor)
                .ToListAsync();

            foreach (var schedule in activeSchedules)
            {
                // Check if slots already exist for this doctor and date
                bool exists = await _context.Appointments.AnyAsync(a => 
                    a.DoctorId == schedule.DoctorId && 
                    a.AppointmentDate.Date == tomorrow.Date);

                if (exists) continue;

                var slots = new List<Appointment>();
                var currentTime = schedule.StartTime;
                int tokenCounter = 1;

                // Total Online Slots
                while (currentTime + TimeSpan.FromMinutes(schedule.SlotDurationMinutes) <= schedule.EndTime 
                       && tokenCounter <= schedule.MaxTokensOnline)
                {
                    slots.Add(new Appointment
                    {
                        DoctorId = schedule.DoctorId,
                        ScheduleId = schedule.Id,
                        AppointmentDate = tomorrow.Date,
                        TokenNumber = tokenCounter++,
                        SlotTime = currentTime,
                        BookingType = BookingType.Online,
                        Status = AppointmentStatus.Available,
                        CreatedAt = DateTime.UtcNow
                    });

                    currentTime = currentTime.Add(TimeSpan.FromMinutes(schedule.SlotDurationMinutes));
                }

                // Walk-in slots usually start after online or are integrated. 
                // Spec says 70/30 split. We'll just continue tokens for walk-in.
                int walkInTokens = 0;
                while (walkInTokens < schedule.MaxTokensWalkIn)
                {
                    slots.Add(new Appointment
                    {
                        DoctorId = schedule.DoctorId,
                        ScheduleId = schedule.Id,
                        AppointmentDate = tomorrow.Date,
                        TokenNumber = tokenCounter++,
                        SlotTime = currentTime, // Estimating time for walk-ins too
                        BookingType = BookingType.WalkIn,
                        Status = AppointmentStatus.Available,
                        CreatedAt = DateTime.UtcNow
                    });
                    currentTime = currentTime.Add(TimeSpan.FromMinutes(schedule.SlotDurationMinutes));
                    walkInTokens++;
                }

                await _context.Appointments.AddRangeAsync(slots);
            }

            await _context.SaveChangesAsync();
        }
    }
}
