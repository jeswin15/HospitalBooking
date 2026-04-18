using HospitalBooking.Domain.Enums;
using HospitalBooking.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace HospitalBooking.Infrastructure.Jobs
{
    public class NoShowDetectionJob
    {
        private readonly AppDbContext _context;

        public NoShowDetectionJob(AppDbContext context)
        {
            _context = context;
        }

        public async Task MarkNoShowsAsync()
        {
            var now = DateTime.Now;
            var today = DateTime.Today;

            // Simple logic: If slot time + 15 mins passed AND status is still Pending/Confirmed
            var candidates = await _context.Appointments
                .Where(a => a.AppointmentDate.Date == today 
                       && (a.Status == AppointmentStatus.Pending || a.Status == AppointmentStatus.Confirmed)
                       && !a.IsFollowUp) // Follow-ups might have different rules
                .ToListAsync();

            foreach (var appt in candidates)
            {
                var slotThreshold = appt.SlotTime.Add(TimeSpan.FromMinutes(15));
                
                if (now.TimeOfDay > slotThreshold)
                {
                    // Check if doctor has already processed a later token
                    bool hasLaterTokenProcessed = await _context.Appointments
                        .AnyAsync(a => a.DoctorId == appt.DoctorId 
                                  && a.AppointmentDate.Date == today 
                                  && a.TokenNumber > appt.TokenNumber 
                                  && (a.Status == AppointmentStatus.InRoom || a.Status == AppointmentStatus.Completed));

                    if (hasLaterTokenProcessed)
                    {
                        appt.Status = AppointmentStatus.NoShow;
                        appt.Notes += " | System: Automatically marked as No-Show.";
                    }
                }
            }

            await _context.SaveChangesAsync();
        }
    }
}
