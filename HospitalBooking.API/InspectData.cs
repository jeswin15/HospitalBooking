using HospitalBooking.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;

namespace HospitalBooking.Scratch
{
    public class Inspector
    {
        public static void Inspect(AppDbContext context)
        {
            var slots = context.DoctorAvailabilitySlots.Take(10).ToList();
            Console.WriteLine("--- SLOTS INSPECTION ---");
            foreach (var s in slots)
            {
                Console.WriteLine($"ID: {s.Id}, Doctor: {s.DoctorId}, Date: {s.Date:yyyy-MM-dd HH:mm:ss}, Slot: {s.TimeSlot}, Booked: {s.IsBooked}");
            }
            
            var doctors = context.Doctors.Select(d => new { d.Id, d.Name, d.BookingMode }).ToList();
            Console.WriteLine("\n--- DOCTORS ---");
            foreach (var d in doctors)
            {
                Console.WriteLine($"ID: {d.Id}, Name: {d.Name}, Mode: {d.BookingMode}");
            }
        }
    }
}
