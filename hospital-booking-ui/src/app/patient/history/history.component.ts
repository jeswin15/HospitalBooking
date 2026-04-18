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
                    <button (click)="viewPrescription(appt)" class="px-6 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200">
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
    
    <!-- Prescription View Modal -->
    @if (showPrescriptionModal()) {
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div class="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <!-- Modal Header -->
          <div class="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 class="text-xs font-black text-blue-600 uppercase tracking-[0.3em] mb-2">Doctor's Suggestion</h3>
              <p class="text-2xl font-black text-slate-900 tracking-tight">Dr. {{ selectedAppointment()?.doctorName }}</p>
            </div>
            <button (click)="closePrescriptionModal()" class="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors shadow-sm">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-10">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div class="space-y-4">
                <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Diagnosis</label>
                <div class="p-6 bg-blue-50/30 border border-blue-50 rounded-2xl text-slate-800 font-medium leading-relaxed">
                   {{ currentPrescription()?.diagnosis || 'No diagnosis recorded.' }}
                </div>
              </div>
              <div class="space-y-4">
                <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Tests Advised</label>
                <div class="p-6 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 font-medium leading-relaxed italic">
                   {{ currentPrescription()?.testsAdvised || 'No special tests advised.' }}
                </div>
              </div>
            </div>

            <div class="space-y-6">
              <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Medications (Rx)</label>
              <div class="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
                <table class="w-full text-left">
                  <thead class="bg-slate-50">
                    <tr>
                      <th class="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Medicine</th>
                      <th class="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Dosage</th>
                      <th class="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (med of currentPrescription()?.medicines; track med.name) {
                      <tr class="border-t border-slate-50">
                        <td class="px-6 py-4 font-bold text-slate-800">{{ med.name }}</td>
                        <td class="px-6 py-4 text-sm font-medium text-slate-600">{{ med.dosage }}</td>
                        <td class="px-6 py-4 text-sm font-medium text-slate-600">{{ med.duration }}</td>
                      </tr>
                    } @empty {
                      <tr><td colspan="3" class="px-6 py-8 text-center text-slate-300 font-bold">No medicines prescribed.</td></tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            @if (currentPrescription()?.followUpDate) {
              <div class="p-6 bg-emerald-50 rounded-2xl flex items-center gap-4 border border-emerald-100/50">
                <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                   <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Suggested Follow-up</p>
                  <p class="text-lg font-black text-emerald-900 tracking-tight">{{ currentPrescription()?.followUpDate | date:'fullDate' }}</p>
                </div>
              </div>
            }
          </div>

          <!-- Modal Footer -->
          <div class="p-8 border-t border-slate-50 bg-slate-50/30 flex gap-4">
            <button (click)="closePrescriptionModal()" class="flex-1 py-4 border border-slate-200 rounded-2xl font-black text-xs uppercase text-slate-400 tracking-widest hover:bg-white transition-all">Close</button>
            <button (click)="downloadPrescription(selectedAppointment()?.id)" class="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
               <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
               Download PDF
            </button>
          </div>
        </div>
      </div>
    }
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
  showPrescriptionModal = signal(false);
  selectedAppointment = signal<any>(null);
  currentPrescription = signal<any>(null);

  ngOnInit() {
    this.loadAppointments();
  }

  loadAppointments() {
    this.http.get<any[]>(`${environment.apiUrl}/patient/appointments`).subscribe(res => {
      this.appointments.set(res);
    });
  }

  viewPrescription(appt: any) {
    this.selectedAppointment.set(appt);
    this.http.get(`${environment.apiUrl}/patient/appointments/${appt.id}/prescription/data`).subscribe({
      next: (data) => {
        this.currentPrescription.set(data);
        this.showPrescriptionModal.set(true);
      },
      error: () => alert('Prescription details are not yet available for this appointment.')
    });
  }

  closePrescriptionModal() {
    this.showPrescriptionModal.set(false);
    this.currentPrescription.set(null);
    this.selectedAppointment.set(null);
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
    if (!appointmentId) return;
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
