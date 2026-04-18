using HospitalBooking.Domain.Entities;
using HospitalBooking.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HospitalBooking.Infrastructure.Data.Seed
{
    public class DatabaseSeeder
    {
        private readonly AppDbContext _context;

        public DatabaseSeeder(AppDbContext context)
        {
            _context = context;
        }

        public async Task SeedAsync()
        {
            await _context.Database.MigrateAsync();

            if (!_context.Admins.Any())
            {
                var admin = new Admin
                {
                    Name = "Super Admin",
                    Email = "admin@hospital.com",
                    PasswordHash = "$2a$11$d8mUdFeuHFH9Mn45IDJ/mO/1aUu5sxMAlmpwMMm2hCQhUkusVQULC", // admin123
                    Role = AdminRole.SuperAdmin,
                    IsActive = true
                };
                _context.Admins.Add(admin);
                await _context.SaveChangesAsync();
            }

            if (!_context.Departments.Any())
            {
                var departments = new List<Department>
                {
                    new Department { Name = "General Medicine", Description = "Primary care", Icon = "🩺", DisplayOrder = 1, CreatedByAdminId = 1 },
                    new Department { Name = "Cardiology", Description = "Heart care", Icon = "❤️", DisplayOrder = 2, CreatedByAdminId = 1 },
                    new Department { Name = "Orthopaedics", Description = "Bone care", Icon = "🦴", DisplayOrder = 3, CreatedByAdminId = 1 },
                    new Department { Name = "Dermatology", Description = "Skin care", Icon = "✨", DisplayOrder = 4, CreatedByAdminId = 1 },
                    new Department { Name = "Paediatrics", Description = "Child care", Icon = "👶", DisplayOrder = 5, CreatedByAdminId = 1 },
                    new Department { Name = "Gynaecology", Description = "Women care", Icon = "🌸", DisplayOrder = 6, CreatedByAdminId = 1 }
                };
                await _context.Departments.AddRangeAsync(departments);
                await _context.SaveChangesAsync();

                var deptDict = _context.Departments.ToDictionary(d => d.Name, d => d.Id);
                var doctors = new List<Doctor>();
                
                // Add 12 doctors (2 per dept)
                AddDoctor(doctors, "Dr. Aarav Sharma", "aarav.sharma@hospital.com", deptDict["General Medicine"], "Consultant", "MBBS, MD", 10);
                AddDoctor(doctors, "Dr. Priya Menon", "priya.menon@hospital.com", deptDict["General Medicine"], "Associate", "MBBS", 5);
                AddDoctor(doctors, "Dr. Rajesh Iyer", "rajesh.iyer@hospital.com", deptDict["Cardiology"], "Senior Cardiologist", "MBBS, MD, DM", 15);
                AddDoctor(doctors, "Dr. Smitha Patil", "smitha.patil@hospital.com", deptDict["Cardiology"], "Cardiologist", "MBBS, MD", 8);
                AddDoctor(doctors, "Dr. Vijay Singh", "vijay.singh@hospital.com", deptDict["Orthopaedics"], "Ortho Surgeon", "MBBS, MS", 12);
                AddDoctor(doctors, "Dr. Anjali Rao", "anjali.rao@hospital.com", deptDict["Orthopaedics"], "Consultant", "MBBS, MS", 7);
                AddDoctor(doctors, "Dr. Vikram Seth", "vikram.seth@hospital.com", deptDict["Dermatology"], "Dermatologist", "MBBS, MD", 10);
                AddDoctor(doctors, "Dr. Kavita Reddy", "kavita.reddy@hospital.com", deptDict["Dermatology"], "Specialist", "MBBS, DVD", 5);
                AddDoctor(doctors, "Dr. Arjun Nair", "arjun.nair@hospital.com", deptDict["Paediatrics"], "Pediatrician", "MBBS, MD", 9);
                AddDoctor(doctors, "Dr. Deepa Gupta", "deepa.gupta@hospital.com", deptDict["Paediatrics"], "Consultant", "MBBS, DCH", 6);
                AddDoctor(doctors, "Dr. Sanjay Jain", "sanjay.jain@hospital.com", deptDict["Gynaecology"], "Gynaecologist", "MBBS, MD", 11);
                AddDoctor(doctors, "Dr. Neha Kapoor", "neha.kapoor@hospital.com", deptDict["Gynaecology"], "Specialist", "MBBS, DGO", 5);

                await _context.Doctors.AddRangeAsync(doctors);
                await _context.SaveChangesAsync();

                // Schedules
                var doctorIds = _context.Doctors.Select(d => d.Id).ToList();
                var schedules = new List<DoctorSchedule>();
                foreach (var docId in doctorIds)
                {
                    for (int i = 1; i <= 5; i++) // Mon-Fri
                    {
                        schedules.Add(new DoctorSchedule {
                            DoctorId = docId, DayOfWeek = (DayOfWeek)i, Session = SessionType.Morning, 
                            StartTime = new TimeSpan(9, 0, 0), EndTime = new TimeSpan(12, 0, 0), 
                            SlotDurationMinutes = 15, MaxTokensOnline = 8, MaxTokensWalkIn = 4
                        });
                        schedules.Add(new DoctorSchedule {
                            DoctorId = docId, DayOfWeek = (DayOfWeek)i, Session = SessionType.Afternoon, 
                            StartTime = new TimeSpan(14, 0, 0), EndTime = new TimeSpan(17, 0, 0), 
                            SlotDurationMinutes = 15, MaxTokensOnline = 8, MaxTokensWalkIn = 4
                        });
                    }
                }
                await _context.DoctorSchedules.AddRangeAsync(schedules);
                await _context.SaveChangesAsync();

                // Patients
                var patients = new List<Patient>
                {
                    new Patient { FullName = "Amit Kumar", Email = "amit@gmail.com", Phone = "9000010001", PasswordHash = "$2a$11$d8mUdFeuHFH9Mn45IDJ/mO/1aUu5sxMAlmpwMMm2hCQhUkusVQULC", DateOfBirth = new DateTime(1990, 5, 10), Gender = "Male" },
                    new Patient { FullName = "Sneha Roy", Email = "sneha@gmail.com", Phone = "9000010002", PasswordHash = "$2a$11$d8mUdFeuHFH9Mn45IDJ/mO/1aUu5sxMAlmpwMMm2hCQhUkusVQULC", DateOfBirth = new DateTime(1995, 8, 20), Gender = "Female" },
                    new Patient { FullName = "Rahul Verma", Email = "rahul@gmail.com", Phone = "9000010003", PasswordHash = "$2a$11$d8mUdFeuHFH9Mn45IDJ/mO/1aUu5sxMAlmpwMMm2hCQhUkusVQULC", DateOfBirth = new DateTime(1985, 3, 15), Gender = "Male" },
                    new Patient { FullName = "Priya Das", Email = "priya@gmail.com", Phone = "9000010004", PasswordHash = "$2a$11$d8mUdFeuHFH9Mn45IDJ/mO/1aUu5sxMAlmpwMMm2hCQhUkusVQULC", DateOfBirth = new DateTime(1992, 11, 2), Gender = "Female" },
                    new Patient { FullName = "Karan Singh", Email = "karan@gmail.com", Phone = "9000010005", PasswordHash = "$2a$11$d8mUdFeuHFH9Mn45IDJ/mO/1aUu5sxMAlmpwMMm2hCQhUkusVQULC", DateOfBirth = new DateTime(1988, 1, 25), Gender = "Male" }
                };
                await _context.Patients.AddRangeAsync(patients);
                await _context.SaveChangesAsync();

                // Appointments (some past, some upcoming)
                var pIds = _context.Patients.Select(p => p.Id).ToList();
                var dIds = _context.Doctors.Select(d => d.Id).ToList();
                var appointments = new List<Appointment>();
                
                // 3 Past (Completed)
                appointments.Add(new Appointment { PatientId = pIds[0], DoctorId = dIds[0], ScheduleId = 1, AppointmentDate = DateTime.Today.AddDays(-5), SlotTime = new TimeSpan(10, 0, 0), Status = AppointmentStatus.Completed });
                appointments.Add(new Appointment { PatientId = pIds[1], DoctorId = dIds[2], ScheduleId = 3, AppointmentDate = DateTime.Today.AddDays(-3), SlotTime = new TimeSpan(15, 0, 0), Status = AppointmentStatus.Completed });
                appointments.Add(new Appointment { PatientId = pIds[2], DoctorId = dIds[4], ScheduleId = 5, AppointmentDate = DateTime.Today.AddDays(-1), SlotTime = new TimeSpan(11, 0, 0), Status = AppointmentStatus.Completed });
                
                // 2 Upcoming
                appointments.Add(new Appointment { PatientId = pIds[3], DoctorId = dIds[1], ScheduleId = 2, AppointmentDate = DateTime.Today.AddDays(1), SlotTime = new TimeSpan(9, 30, 0), Status = AppointmentStatus.Confirmed });
                appointments.Add(new Appointment { PatientId = pIds[4], DoctorId = dIds[3], ScheduleId = 4, AppointmentDate = DateTime.Today.AddDays(2), SlotTime = new TimeSpan(14, 15, 0), Status = AppointmentStatus.Confirmed });

                await _context.Appointments.AddRangeAsync(appointments);
                await _context.SaveChangesAsync();
            }
        }

        private void AddDoctor(List<Doctor> list, string name, string email, int deptId, string desig, string qual, int exp)
        {
            list.Add(new Doctor {
                Name = name, Email = email, DepartmentId = deptId, Designation = desig, Qualification = qual, 
                ExperienceYears = exp,
                PasswordHash = "$2a$11$d8mUdFeuHFH9Mn45IDJ/mO/1aUu5sxMAlmpwMMm2hCQhUkusVQULC", // admin123
                Phone = "9" + (list.Count + 100000000).ToString().Substring(1),
                Bio = $"Highly skilled {desig} with {exp} years of experience.",
                LanguagesSpoken = "[\"English\", \"Hindi\"]"
            });
        }
    }
}
