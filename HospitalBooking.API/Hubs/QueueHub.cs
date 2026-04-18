using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace HospitalBooking.API.Hubs
{
    [Authorize]
    public class QueueHub : Hub
    {
        public async Task JoinDoctorQueue(int doctorId, string date)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"doctor_{doctorId}_{date}");
        }

        public async Task JoinPatientQueue(int doctorId, string date)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"doctor_{doctorId}_{date}");
        }

        public async Task LeaveQueue(int doctorId, string date)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"doctor_{doctorId}_{date}");
        }
    }
}
