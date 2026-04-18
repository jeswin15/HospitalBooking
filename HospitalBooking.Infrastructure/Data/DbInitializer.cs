using HospitalBooking.Application.Interfaces;
using HospitalBooking.Domain.Entities;
using HospitalBooking.Domain.Enums;
using HospitalBooking.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HospitalBooking.Infrastructure.Data
{
    public static class DbInitializer
    {
        public static async Task SeedAsync(AppDbContext context, IAuthService authService)
        {
            // 1. Seed Admin if none exists
            if (!await context.Admins.AnyAsync())
            {
                var admin = new Admin
                {
                    Name = "Super Admin",
                    Email = "admin@hospital.com",
                    PasswordHash = authService.HashPassword("Admin@123"),
                    Role = AdminRole.SuperAdmin,
                    IsActive = true
                };
                context.Admins.Add(admin);
                await context.SaveChangesAsync();
            }

            var adminId = (await context.Admins.FirstAsync()).Id;

            // 2. Seed Departments
            if (!await context.Departments.AnyAsync())
            {
                var departments = new List<Department>
                {
                    new Department { Name = "Cardiology", Description = "Heart and cardiovascular system specialists", Icon = "❤️", DisplayOrder = 1, CreatedByAdminId = adminId },
                    new Department { Name = "Neurology", Description = "Brain and nervous system specialists", Icon = "🧠", DisplayOrder = 2, CreatedByAdminId = adminId },
                    new Department { Name = "Pediatrics", Description = "Child health and medical care", Icon = "👶", DisplayOrder = 3, CreatedByAdminId = adminId },
                    new Department { Name = "Orthopedics", Description = "Bone, joint, and muscle specialists", Icon = "🦴", DisplayOrder = 4, CreatedByAdminId = adminId },
                    new Department { Name = "General Medicine", Description = "Primary care and internal medicine", Icon = "🩺", DisplayOrder = 5, CreatedByAdminId = adminId },
                    new Department { Name = "Dermatology", Description = "Skin, hair, and nail specialists", Icon = "✨", DisplayOrder = 6, CreatedByAdminId = adminId }
                };
                context.Departments.AddRange(departments);
                await context.SaveChangesAsync();
            }

            // 3. Seed Doctors
            if (!await context.Doctors.AnyAsync())
            {
                var cardiology = await context.Departments.FirstAsync(d => d.Name == "Cardiology");
                var neurology = await context.Departments.FirstAsync(d => d.Name == "Neurology");
                var pediatrics = await context.Departments.FirstAsync(d => d.Name == "Pediatrics");

                var doctors = new List<Doctor>
                {
                    new Doctor 
                    { 
                        Name = "Dr. Sarah Chen", Email = "sarah.chen@hospital.com", Phone = "9876543210", 
                        PasswordHash = authService.HashPassword("Doctor@123"), DepartmentId = cardiology.Id,
                        Designation = "Senior Cardiologist", Qualification = "MBBS, MD, DM (Cardiology)", 
                        ExperienceYears = 15, CreatedByAdminId = adminId,
                        BookingMode = BookingMode.Token, MaxTokensPerDay = 30, DefaultSlotDurationMinutes = 15,
                        Bio = "Expert in interventional cardiology with over 15 years of experience."
                    },
                    new Doctor 
                    { 
                        Name = "Dr. James Wilson", Email = "james.wilson@hospital.com", Phone = "9876543211", 
                        PasswordHash = authService.HashPassword("Doctor@123"), DepartmentId = cardiology.Id,
                        Designation = "Consultant Cardiologist", Qualification = "MBBS, MD (Medicine)", 
                        ExperienceYears = 8, CreatedByAdminId = adminId,
                        BookingMode = BookingMode.Token, MaxTokensPerDay = 20, DefaultSlotDurationMinutes = 20,
                        Bio = "Specializes in non-invasive cardiology and preventive heart care."
                    },
                    new Doctor 
                    { 
                        Name = "Dr. Elena Rodriguez", Email = "elena.r@hospital.com", Phone = "9876543212", 
                        PasswordHash = authService.HashPassword("Doctor@123"), DepartmentId = neurology.Id,
                        Designation = "Chief Neurologist", Qualification = "MBBS, MD, PhD (Neurology)", 
                        ExperienceYears = 20, CreatedByAdminId = adminId,
                        BookingMode = BookingMode.Slot, DefaultSlotDurationMinutes = 30,
                        Bio = "World-renowned specialist in neurodegenerative disorders."
                    },
                    new Doctor 
                    { 
                        Name = "Dr. Michael Park", Email = "michael.park@hospital.com", Phone = "9876543213", 
                        PasswordHash = authService.HashPassword("Doctor@123"), DepartmentId = pediatrics.Id,
                        Designation = "Pediatrician", Qualification = "MBBS, DCH, MD (Pediatrics)", 
                        ExperienceYears = 12, CreatedByAdminId = adminId,
                        BookingMode = BookingMode.Slot, DefaultSlotDurationMinutes = 20,
                        Bio = "Dedicated to providing compassionate care for children and infants."
                    }
                };

                context.Doctors.AddRange(doctors);
                await context.SaveChangesAsync();
            }
        }
    }
}
