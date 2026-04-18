import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="history-container fade-in">
      <div class="flex justify-between items-center mb-10">
         <div>
           <h3 class="text-3xl font-black text-slate-800 tracking-tight">Active Consultations</h3>
           <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Manage your treatment sessions and clinical history</p>
         </div>
         <span class="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-5 py-2.5 rounded-xl border border-blue-100 flex items-center gap-2">
            <span class="w-1.5 h-1.5 bg-blue-600 rounded-full animate-ping"></span>
            Live Status Tracking
         </span>
      </div>

      <div class="panel !p-0 overflow-hidden shadow-2xl shadow-blue-900/5 border-none rounded-[32px] bg-white">
        <table class="modern-table w-full">
          <thead>
            <tr class="bg-slate-50/50">
              <th class="px-8 py-6 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Identification</th>
              <th class="px-8 py-6 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Medical Professional</th>
              <th class="px-8 py-6 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Schedule Info</th>
              <th class="px-8 py-6 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
              <th class="px-8 py-6 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Action</th>
            </tr>
          </thead>
          <tbody>
            @for (appt of appointments(); track appt.id) {
              <tr class="border-t border-slate-50">
                <td class="px-8 py-8">
                   <div class="flex items-center gap-4">
                      <span class="bg-blue-50 text-blue-600 font-extrabold px-4 py-2 rounded-xl border border-blue-100 text-lg tracking-tighter">#{{ appt.tokenNumber }}</span>
                      @if (appt.status === 'InRoom') {
                        <span class="flex h-2 w-2 rounded-full bg-blue-600"></span>
                      }
                   </div>
                </td>
                <td class="px-8 py-8">
                   <div class="font-black text-slate-800 text-lg leading-none">{{ appt.doctorName }}</div>
                   <div class="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-2">{{ appt.departmentName }}</div>
                </td>
                <td class="px-8 py-8">
                   <div class="text-slate-800 font-extrabold">{{ appt.date }}</div>
                   <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{{ appt.slotTime }} Session</div>
                </td>
                <td class="px-8 py-8">
                  <div class="flex flex-col gap-2">
                    <span [class]="getStatusClass(appt.status)" class="px-4 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest inline-block w-fit">
                      {{ appt.status }}
                    </span>
                    @if (appt.status === 'Cancelled' && appt.cancelReason) {
                      <div class="text-[9px] font-black text-rose-500 bg-rose-50 px-3 py-2 rounded-lg border border-rose-100 flex items-start gap-2 max-w-[200px]">
                        <svg class="w-2.5 h-2.5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>{{ appt.cancelReason }}</span>
                      </div>
                    }
                  </div>
                </td>
                <td class="px-8 py-8 text-center">
                  @if (appt.status === 'Completed') {
                    <button (click)="downloadPrescription(appt.id)" class="px-6 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200">
                       Prescription
                    </button>
                  } @else if (appt.status === 'InRoom') {
                     <span class="animate-pulse text-blue-600 font-black uppercase text-[10px] tracking-widest">Active Consultation</span>
                  } @else {
                    <span class="text-slate-300 font-black uppercase text-[9px] tracking-widest">Upcoming Visit</span>
                  }
                </td>
              </tr>
            }
            @if (appointments().length === 0) {
              <tr>
                <td colspan="5" class="px-8 py-20 text-center">
                   <div class="max-w-xs mx-auto">
                      <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">📋</div>
                      <h4 class="text-lg font-black text-slate-800 mb-2">No Appointments Yet</h4>
                      <p class="text-xs font-bold text-slate-400 leading-relaxed uppercase tracking-widest">Your clinical journey starts here. Book your first appointment to see it here.</p>
                   </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .history-container { @apply pt-2; }
    .fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class HistoryComponent implements OnInit {
  private http = inject(HttpClient);
  public authService = inject(AuthService);
  
  appointments = signal<any[]>([]);

  ngOnInit() {
    this.loadAppointments();
  }

  loadAppointments() {
    this.http.get<any[]>(`${environment.apiUrl}/patient/appointments`).subscribe(res => {
      this.appointments.set(res);
    });
  }

  getStatusClass(status: string) {
    switch (status) {
      case 'Confirmed': return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      case 'Pending': return 'bg-amber-50 text-amber-600 border border-amber-100';
      case 'Completed': return 'bg-blue-50 text-blue-600 border border-blue-100';
      case 'Cancelled': return 'bg-rose-50 text-rose-600 border border-rose-100';
      case 'InRoom': return 'bg-purple-50 text-purple-600 border border-purple-100';
      default: return 'bg-slate-50 text-slate-600 border border-slate-100';
    }
  }

  downloadPrescription(appointmentId: number) {
    this.http.get(`${environment.apiUrl}/patient/appointments/${appointmentId}/prescription`, { responseType: 'blob' })
      .subscribe(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Prescription_${appointmentId}.pdf`;
        link.click();
      });
  }
}
