using HospitalBooking.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace HospitalBooking.Infrastructure.Jobs
{
    public class TokenLockCleanupJob
    {
        private readonly AppDbContext _context;

        public TokenLockCleanupJob(AppDbContext context)
        {
            _context = context;
        }

        public async Task CleanupExpiredLocksAsync()
        {
            var now = DateTime.UtcNow;

            var expiredLocks = await _context.TokenLocks
                .Where(t => t.ExpiresAt < now && !t.IsReleased)
                .ToListAsync();

            if (expiredLocks.Any())
            {
                _context.TokenLocks.RemoveRange(expiredLocks);
                await _context.SaveChangesAsync();
            }
        }
    }
}
