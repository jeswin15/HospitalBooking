using HospitalBooking.Application.DTOs;
using HospitalBooking.Application.Interfaces;
using HospitalBooking.Domain.Entities;
using HospitalBooking.Domain.Enums;
using HospitalBooking.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace HospitalBooking.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly IConfiguration _configuration;
        private readonly AppDbContext _context;

        public AuthService(IConfiguration configuration, AppDbContext context)
        {
            _configuration = configuration;
            _context = context;
        }

        public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request, string role)
        {
            UserSummaryDto? userSummary = null;
            string storedHash = string.Empty;

            if (role.ToLower() == "admin")
            {
                var admin = await _context.Admins.FirstOrDefaultAsync(a => a.Email == request.Email && a.IsActive);
                if (admin != null)
                {
                    userSummary = new UserSummaryDto { Id = admin.Id, Name = admin.Name, Email = admin.Email, Role = admin.Role.ToString() };
                    storedHash = admin.PasswordHash;
                }
            }
            else if (role.ToLower() == "doctor")
            {
                var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.Email == request.Email && d.IsActive);
                if (doctor != null)
                {
                    userSummary = new UserSummaryDto { Id = doctor.Id, Name = doctor.Name, Email = doctor.Email, Role = "Doctor" };
                    storedHash = doctor.PasswordHash;
                }
            }
            else if (role.ToLower() == "patient")
            {
                var patient = await _context.Patients.FirstOrDefaultAsync(p => p.Email == request.Email && p.IsActive);
                if (patient != null)
                {
                    userSummary = new UserSummaryDto { Id = patient.Id, Name = patient.FullName, Email = patient.Email, Role = "Patient" };
                    storedHash = patient.PasswordHash;
                }
            }

            if (userSummary != null && VerifyPassword(request.Password, storedHash))
            {
                return new AuthResponseDto
                {
                    Token = GenerateJwtToken(userSummary.Id.ToString(), userSummary.Name, userSummary.Email, userSummary.Role),
                    User = userSummary
                };
            }

            return null!;
        }

        public string GenerateJwtToken(string id, string name, string email, string role)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, id),
                new Claim(ClaimTypes.Name, name),
                new Claim(ClaimTypes.Email, email),
                new Claim(ClaimTypes.Role, role)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JwtSettings:SecretKey"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expires = DateTime.UtcNow.AddMinutes(Convert.ToDouble(_configuration["JwtSettings:AccessTokenExpiryMinutes"]));

            var token = new JwtSecurityToken(
                _configuration["JwtSettings:Issuer"],
                _configuration["JwtSettings:Audience"],
                claims,
                expires: expires,
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        public bool VerifyPassword(string password, string hash)
        {
            return BCrypt.Net.BCrypt.Verify(password, hash);
        }
    }
}
