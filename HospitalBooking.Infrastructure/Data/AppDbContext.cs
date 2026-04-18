using HospitalBooking.Domain.Entities;
using HospitalBooking.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace HospitalBooking.Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Admin> Admins { get; set; }
        public DbSet<Department> Departments { get; set; }
        public DbSet<Doctor> Doctors { get; set; }
        public DbSet<DoctorSchedule> DoctorSchedules { get; set; }
        public DbSet<SlotBlock> SlotBlocks { get; set; }
        public DbSet<Patient> Patients { get; set; }
        public DbSet<FamilyMember> FamilyMembers { get; set; }
        public DbSet<Appointment> Appointments { get; set; }
        public DbSet<TokenLock> TokenLocks { get; set; }
        public DbSet<Prescription> Prescriptions { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<DoctorAvailabilitySlot> DoctorAvailabilitySlots { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // 1. Set Global NoAction Delete Behavior (To prevent circular paths)
            foreach (var relationship in modelBuilder.Model.GetEntityTypes().SelectMany(e => e.GetForeignKeys()))
            {
                relationship.DeleteBehavior = DeleteBehavior.ClientCascade; // Using ClientCascade or NoAction
            }
            // Forcing NoAction for SQL Server compatibility
            foreach (var foreignKey in modelBuilder.Model.GetEntityTypes().SelectMany(e => e.GetForeignKeys()))
            {
                foreignKey.DeleteBehavior = DeleteBehavior.NoAction;
            }

            // 2. Indexes & Constraints
            modelBuilder.Entity<Appointment>()
                .HasIndex(a => new { a.DoctorId, a.AppointmentDate, a.TokenNumber })
                .IsUnique();

            modelBuilder.Entity<TokenLock>()
                .HasIndex(t => new { t.DoctorId, t.AppointmentDate, t.TokenNumber });

            // 3. Decimal Precision


            // 4. Custom Mappings (Explicitly avoiding Cascade if needed)
            modelBuilder.Entity<Appointment>(entity => {
                entity.HasOne(a => a.Patient).WithMany(p => p.Appointments).HasForeignKey(a => a.PatientId).OnDelete(DeleteBehavior.NoAction);
                entity.HasOne(a => a.Doctor).WithMany(d => d.Appointments).HasForeignKey(a => a.DoctorId).OnDelete(DeleteBehavior.NoAction);
                entity.HasOne(a => a.Schedule).WithMany(s => s.Appointments).HasForeignKey(a => a.ScheduleId).OnDelete(DeleteBehavior.NoAction);
            });

            modelBuilder.Entity<Prescription>(entity => {
                entity.HasOne(p => p.Appointment).WithOne(a => a.Prescription).HasForeignKey<Prescription>(p => p.AppointmentId).OnDelete(DeleteBehavior.NoAction);
            });



            modelBuilder.Entity<Review>(entity => {
                entity.HasOne(r => r.Appointment).WithOne(a => a.Review).HasForeignKey<Review>(r => r.AppointmentId).OnDelete(DeleteBehavior.NoAction);
            });

            // Global Filter
            modelBuilder.Entity<Doctor>().HasQueryFilter(d => d.IsActive);

            modelBuilder.Entity<DoctorAvailabilitySlot>(entity => {
                entity.HasOne(d => d.Doctor)
                    .WithMany(d => d.AvailabilitySlots)
                    .HasForeignKey(d => d.DoctorId)
                    .OnDelete(DeleteBehavior.NoAction);
            });
        }
    }
}
