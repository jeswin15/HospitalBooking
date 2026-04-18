using HospitalBooking.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.Linq;

var builder = Host.CreateApplicationBuilder(args);
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer("Server=(localdb)\\MSSQLLocalDB;Database=HospitalBookingDb;Trusted_Connection=True;MultipleActiveResultSets=true"));

using var host = builder.Build();
using var scope = host.Services.CreateScope();
var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

Console.WriteLine("--- DIAGNOSING DATABASE ---");

var doctors = await context.Doctors.CountAsync();
Console.WriteLine($"Total Doctors: {doctors}");

var schedules = await context.DoctorSchedules.CountAsync();
Console.WriteLine($"Total Schedules: {schedules}");

var today = DateTime.Today.DayOfWeek;
var todaySchedules = await context.DoctorSchedules.Where(s => s.DayOfWeek == today).CountAsync();
Console.WriteLine($"Schedules for {today} (Today): {todaySchedules}");

if (todaySchedules > 0) {
    var sample = await context.DoctorSchedules.Where(s => s.DayOfWeek == today).Take(3).ToListAsync();
    foreach(var s in sample) {
        Console.WriteLine($" - DocID {s.DoctorId}, MaxTokens {s.MaxTokensOnline}, Active: {s.IsActive}");
    }
} else {
    Console.WriteLine("!!! WARNING: No schedules found for today.");
}

var appointments = await context.Appointments.CountAsync();
Console.WriteLine($"Total Appointments: {appointments}");

Console.WriteLine("---------------------------");
