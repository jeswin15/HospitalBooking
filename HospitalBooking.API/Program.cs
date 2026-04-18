using HospitalBooking.API.Hubs;
using HospitalBooking.Application.Interfaces;
using HospitalBooking.Application.Mappings;
using HospitalBooking.Application.Mappings;
using HospitalBooking.Infrastructure.Data;
using HospitalBooking.Infrastructure.Data.Seed;
using HospitalBooking.Infrastructure.Services;
using HospitalBooking.Infrastructure.Jobs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Hangfire;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
            ValidAudience = builder.Configuration["JwtSettings:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:SecretKey"]!))
        };
        
        // SignalR token support
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", p => p.RequireRole("SuperAdmin", "Staff"));
    options.AddPolicy("DoctorOnly", p => p.RequireRole("Doctor"));
    options.AddPolicy("PatientOnly", p => p.RequireRole("Patient"));
});

// Dependency Injection
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ISlotEngineService, SlotEngineService>();
// builder.Services.AddScoped<IEmailService, EmailService>(); // Implement later
builder.Services.AddScoped<DatabaseSeeder>();
builder.Services.AddScoped<SlotGenerationJob>();
builder.Services.AddScoped<ReminderJob>();
builder.Services.AddScoped<NoShowDetectionJob>();
builder.Services.AddScoped<TokenLockCleanupJob>();

// AutoMapper
builder.Services.AddAutoMapper(typeof(MappingProfile).Assembly);

// SignalR
builder.Services.AddSignalR();

// Hangfire
builder.Services.AddHangfire(config =>
    config.UseSqlServerStorage(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddHangfireServer();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AngularApp", policy =>
        policy.WithOrigins("http://localhost:4200", "http://localhost:4201")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

builder.Services.AddScoped<IPrescriptionPdfService, PrescriptionPdfService>();

QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;

var app = builder.Build();

// Seed Database
using (var scope = app.Services.CreateScope())
{
    var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
    await seeder.SeedAsync();

    // Hangfire Recurring Jobs
    var jobManager = scope.ServiceProvider.GetRequiredService<IRecurringJobManager>();
    jobManager.AddOrUpdate<SlotGenerationJob>("DailySlotGeneration", j => j.GenerateTomorrowSlotsAsync(), Cron.Daily);
    jobManager.AddOrUpdate<ReminderJob>("HourlyReminders", j => j.SendRemindersAsync(), Cron.Hourly);
    jobManager.AddOrUpdate<NoShowDetectionJob>("FiveMinNoShowCheck", j => j.MarkNoShowsAsync(), "*/5 * * * *");
    jobManager.AddOrUpdate<TokenLockCleanupJob>("EveryMinuteLockCleanup", j => j.CleanupExpiredLocksAsync(), Cron.Minutely);
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AngularApp");

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseStaticFiles();

// Ensure upload directories exist
var uploadPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot", "uploads", "profiles");
if (!Directory.Exists(uploadPath))
{
    Directory.CreateDirectory(uploadPath);
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<QueueHub>("/hubs/queue");

app.Run();
