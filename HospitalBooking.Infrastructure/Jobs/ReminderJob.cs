using HospitalBooking.Domain.Enums;
using HospitalBooking.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace HospitalBooking.Infrastructure.Jobs
{
    public class ReminderJob
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ReminderJob> _logger;

        public ReminderJob(AppDbContext context, ILogger<ReminderJob> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task SendRemindersAsync()
        {
            var tomorrow = DateTime.Today.AddDays(1);
            var now = DateTime.UtcNow;
            
            // 1. 24h Reminders
            var dueFor24h = await _context.Appointments
                .Where(a => a.AppointmentDate.Date == tomorrow.Date 
                       && a.Status == AppointmentStatus.Confirmed 
                       && !a.Reminder24hSent)
                .Include(a => a.Patient)
                .Include(a => a.Doctor)
                .ToListAsync();

            foreach (var appt in dueFor24h)
            {
                _logger.LogInformation($"[REMINDER 24H] To: {appt.Patient?.Email}, Body: Your appointment with {appt.Doctor?.Name} is tomorrow at {appt.SlotTime}. Token: {appt.TokenNumber}");
                appt.Reminder24hSent = true;
            }

            // 2. 1h Reminders
            var within1h = await _context.Appointments
                .Where(a => a.AppointmentDate.Date == DateTime.Today 
                       && a.Status == AppointmentStatus.Confirmed 
                       && !a.Reminder1hSent)
                .Include(a => a.Patient)
                .Include(a => a.Doctor)
                .ToListAsync();

            foreach (var appt in within1h)
            {
                // Simple logic: if slot time is within the next 60-90 minutes from local time
                // (Assumes server time and hospital time are handled properly)
                var localTimeNow = DateTime.Now.TimeOfDay;
                var timeUntilSlot = appt.SlotTime - localTimeNow;

                if (timeUntilSlot.TotalMinutes > 0 && timeUntilSlot.TotalMinutes <= 60)
                {
                    _logger.LogInformation($"[REMINDER 1H] To: {appt.Patient?.Email}, Body: Your appointment is in 1 hour! Token: {appt.TokenNumber}");
                    appt.Reminder1hSent = true;
                }
            }

            await _context.SaveChangesAsync();
        }
    }
}
