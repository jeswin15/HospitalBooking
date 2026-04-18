using HospitalBooking.Application.DTOs;
using HospitalBooking.Application.Interfaces;
using HospitalBooking.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Security.Claims;
using System.Threading.Tasks;

namespace HospitalBooking.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AccountController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IAuthService _authService;
        private readonly IWebHostEnvironment _environment;

        public AccountController(AppDbContext context, IAuthService authService, IWebHostEnvironment environment)
        {
            _context = context;
            _authService = authService;
            _environment = environment;
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequestDto request)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var role = User.FindFirst(ClaimTypes.Role)?.Value;

            if (role == "Doctor")
            {
                var doctor = await _context.Doctors.FindAsync(userId);
                if (doctor == null) return NotFound();

                doctor.Name = request.Name;
                doctor.Email = request.Email;
                if (!string.IsNullOrEmpty(request.NewPassword))
                {
                    doctor.PasswordHash = _authService.HashPassword(request.NewPassword);
                }
                await _context.SaveChangesAsync();
            }
            else if (role == "Patient")
            {
                var patient = await _context.Patients.FindAsync(userId);
                if (patient == null) return NotFound();

                patient.FullName = request.Name;
                patient.Email = request.Email;
                if (!string.IsNullOrEmpty(request.NewPassword))
                {
                    patient.PasswordHash = _authService.HashPassword(request.NewPassword);
                }
                await _context.SaveChangesAsync();
            }
            else if (role == "SuperAdmin" || role == "Staff")
            {
                var admin = await _context.Admins.FindAsync(userId);
                if (admin == null) return NotFound();

                admin.Name = request.Name;
                admin.Email = request.Email;
                if (!string.IsNullOrEmpty(request.NewPassword))
                {
                    admin.PasswordHash = _authService.HashPassword(request.NewPassword);
                }
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "Profile updated successfully" });
        }

        [HttpPost("profile/image")]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("No file uploaded");

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var role = User.FindFirst(ClaimTypes.Role)?.Value;

            // Only supporting Doctors for profile photo uploads in this request
            if (role != "Doctor") return BadRequest("Photo upload only supported for Doctors at this time.");

            var doctor = await _context.Doctors.FindAsync(userId);
            if (doctor == null) return NotFound();

            // Create unique filename
            var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
            var uploadsPath = Path.Combine(_environment.WebRootPath, "uploads", "profiles");
            
            if (!Directory.Exists(uploadsPath)) Directory.CreateDirectory(uploadsPath);

            var filePath = Path.Combine(uploadsPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Store relative path in database
            doctor.ProfilePhotoUrl = $"uploads/profiles/{fileName}";
            await _context.SaveChangesAsync();

            return Ok(new { 
                message = "Image uploaded successfully", 
                imageUrl = doctor.ProfilePhotoUrl 
            });
        }
    }
}
