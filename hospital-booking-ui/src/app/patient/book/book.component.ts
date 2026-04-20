import { Component, signal, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { TokenGridComponent } from '../../shared/components/token-grid.component';
import { DoctorCardComponent } from '../../shared/components/doctor-card.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader.component';
import { SignalrService } from '../../core/services/signalr.service';

@Component({
  selector: 'app-book',
  standalone: true,
  imports: [CommonModule, FormsModule, TokenGridComponent, DoctorCardComponent, SkeletonLoaderComponent],
  template: `
    <div class="booking-container fade-in pb-20">
      
      <!-- Stepper Header -->
      <div class="max-w-6xl mx-auto mb-12">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-6">
            <div class="step-blob" [class.active]="step() >= 1">1</div>
            <div class="step-connector"></div>
            <div class="step-blob" [class.active]="step() >= 2">2</div>
            <div class="step-connector"></div>
            <div class="step-blob" [class.active]="step() >= 3">3</div>
          </div>
          <div class="text-right">
             <h2 class="text-3xl font-black text-slate-900 tracking-tighter">Secure Your Appointment</h2>
             <p class="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Simple 3-step booking process</p>
          </div>
        </div>
      </div>

      <div class="max-w-6xl mx-auto">
        
        <!-- STEP 1: CATEGORY SELECTION -->
        @if (step() === 1) {
          <div class="space-y-8">
            <h3 class="text-xl font-black text-slate-800">Choose a Medical Department</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
               @for (dept of departments(); track dept.id) {
                 <button (click)="selectDept(dept)" class="p-8 bg-white rounded-[32px] border-2 border-slate-50 shadow-sm hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all text-center group">
                    <div class="w-16 h-16 bg-slate-50 rounded-2xl mx-auto mb-6 flex items-center justify-center text-2xl group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">🏥</div>
                    <span class="block font-black text-slate-800 tracking-tight">{{ dept.name }}</span>
                    <span class="block text-[10px] font-black text-slate-400 uppercase mt-2 tracking-widest">{{ dept.doctorCount || 0 }} Specialists</span>
                 </button>
               }
            </div>
          </div>
        }

        <!-- STEP 2: DOCTOR SELECTION -->
        @if (step() === 2) {
          <div class="space-y-8">
             <div class="flex items-center justify-between">
               <h3 class="text-xl font-black text-slate-800">Specialists in {{ selectedDeptName() }}</h3>
               <button (click)="step.set(1)" class="text-blue-600 font-black text-[10px] uppercase tracking-widest">Change Department</button>
             </div>
             
             <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
               @for (doc of filteredDoctors(); track doc.id) {
                 <app-doctor-card [doctor]="doc" (onSelect)="selectDoctor(doc)"></app-doctor-card>
               }
             </div>
          </div>
        }

        <!-- STEP 3: SLOT/TOKEN SELECTION -->
        @if (step() === 3) {
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
             <div class="lg:col-span-2 space-y-8">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-xl font-black text-slate-800">
                      {{ (selectedDoctor()?.bookingMode == 0 || selectedDoctor()?.bookingMode == 'Slot') ? 'Pick a Preferred Time' : 'Automated Token Assignment' }}
                    </h3>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {{ (selectedDoctor()?.bookingMode == 0 || selectedDoctor()?.bookingMode == 'Slot') ? 'Choose from available time slots' : 'Tokens are assigned sequentially' }}
                    </p>
                  </div>
                  <div class="flex gap-4">
                    <input type="date" [(ngModel)]="bookingDate" (change)="loadSlots()" class="p-3 bg-white border border-slate-100 rounded-xl font-bold text-sm" />
                  </div>
                </div>

                @if (selectedDoctor()?.bookingMode == 1 || selectedDoctor()?.bookingMode == 'Token') {
                  <!-- TOKEN MODE UI -->
                  <div class="space-y-6">
                    @if (firstAvailableToken()) {
                      <div class="p-12 bg-white rounded-[40px] border-2 border-blue-500/20 shadow-xl shadow-blue-500/5 text-center fade-in">
                        <div class="w-20 h-20 bg-blue-50 rounded-3xl mx-auto mb-8 flex items-center justify-center text-3xl">🎫</div>
                        <h4 class="text-sm font-black text-blue-600 uppercase tracking-widest mb-2">Next Available</h4>
                        <div class="text-7xl font-black text-slate-900 tracking-tighter mb-4">#{{ firstAvailableToken()?.tokenNumber }}</div>
                        <p class="text-slate-400 font-bold">Estimated Time: <span class="text-slate-900">{{ firstAvailableToken()?.slotTime }}</span></p>
                        
                        <div class="mt-10 flex flex-col gap-3">
                          <button (click)="onTokenSelected(firstAvailableToken())" 
                                  class="w-full py-5 bg-blue-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-900/40 hover:bg-blue-700 active:scale-95 transition-all">
                            Accept Token & Continue
                          </button>
                        </div>
                      </div>
                    } @else if (nextAvailableDate()) {
                      <div class="p-12 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200 text-center fade-in">
                        <div class="w-20 h-20 bg-white rounded-3xl mx-auto mb-8 flex items-center justify-center text-3xl">📅</div>
                        <h4 class="text-xl font-black text-slate-800 mb-2">Fully Booked for Today</h4>
                        <p class="text-slate-400 font-bold mb-8">All tokens for the selected date are already taken.</p>
                        
                        <button (click)="switchToNextDate()" class="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all">
                          Switch to {{ nextAvailableDate() | date:'MMM dd, yyyy' }}
                        </button>
                      </div>
                    } @else {
                      <div class="p-12 text-center text-slate-300 font-bold">Loading availability...</div>
                    }
                  </div>
                } @else {
                  <!-- SLOT MODE UI (Original TokenGrid) -->
                  <app-token-grid [slots]="tokens()" (tokenSelected)="onTokenSelected($event)"></app-token-grid>
                }
             </div>

             <div class="space-y-8">
                <div class="panel !p-10 bg-white rounded-[40px] shadow-2xl shadow-slate-200/50">
                   <h4 class="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-8">Selected Schedule</h4>
                   <div class="space-y-6">
                      <div class="flex justify-between items-end border-b border-slate-100 pb-6">
                        <span class="text-slate-400 font-bold text-xs">Doctor</span>
                        <span class="font-black text-right text-slate-900">{{ selectedDoctor()?.name }}</span>
                      </div>
                      <div class="flex justify-between items-end border-b border-slate-100 pb-6">
                        <span class="text-slate-400 font-bold text-xs">Token / Slot</span>
                        <span class="font-black text-2xl text-blue-600">{{ selectedToken() ? ((selectedDoctor()?.bookingMode == 0 || selectedDoctor()?.bookingMode == 'Slot') ? selectedToken()?.slotTime : '#' + selectedToken()?.tokenNumber) : '--' }}</span>
                      </div>
                      <div class="flex justify-between items-end">
                        <span class="text-slate-400 font-bold text-xs">Consultation Type</span>
                        <span class="font-black text-xl text-emerald-600">In-Person Visit</span>
                      </div>
                   </div>

                   <button [disabled]="!selectedToken()" (click)="confirmBooking()" class="w-full mt-10 py-5 bg-blue-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-30 disabled:shadow-none">
                     Confirm Appointment
                   </button>
                </div>

                <div class="p-8 border-2 border-dashed border-slate-100 rounded-[32px] text-center">
                   <p class="text-xs font-bold text-slate-400">Please arrive 15 minutes prior to your scheduled time slot for registration.</p>
                </div>
             </div>
          </div>
        }

        <!-- PAYMENT STEP REMOVED -->

      </div>
    </div>
  `,
  styles: [`
    .booking-container { @apply pt-12; }
    .step-blob { @apply w-12 h-12 rounded-2xl bg-slate-50 border-2 border-slate-100 flex items-center justify-center font-black text-slate-300 transition-all; }
    .step-blob.active { @apply bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/30; }
    .step-connector { @apply w-12 h-0.5 bg-slate-100; }
    .panel { @apply bg-white p-8 rounded-3xl border border-slate-100 shadow-sm; }
    .fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class BookComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private signalr = inject(SignalrService);
  
  step = signal(1);
  departments = signal<any[]>([]);
  doctors = signal<any[]>([]);
  filteredDoctors = signal<any[]>([]);
  tokens = signal<any[]>([]);
  
  selectedDeptId = signal<number | null>(null);
  selectedDeptName = signal('');
  selectedDoctor = signal<any>(null);
  selectedToken = signal<any>(null);
  
  firstAvailableToken = signal<any>(null);
  nextAvailableDate = signal<string | null>(null);
  
  bookingDate = new Date().toISOString().split('T')[0];

  ngOnInit() {
    this.loadInitialData();
  }

  ngOnDestroy() {
    this.signalr.stopConnection();
  }

  loadInitialData() {
    this.http.get<any[]>(`${environment.apiUrl}/patient/departments`).subscribe(res => this.departments.set(res));
    this.http.get<any[]>(`${environment.apiUrl}/patient/doctors`).subscribe(res => this.doctors.set(res));
  }

  selectDept(dept: any) {
    this.selectedDeptId.set(dept.id);
    this.selectedDeptName.set(dept.name);
    this.filteredDoctors.set(this.doctors().filter(d => d.departmentId === dept.id));
    this.step.set(2);
  }

  selectDoctor(doc: any) {
    this.selectedDoctor.set(doc);
    this.loadSlots();
    this.step.set(3);
    
    // Start SignalR for real-time slot updates
    this.signalr.stopConnection(); // Reset any existing
    this.signalr.startConnection(doc.id, this.bookingDate);
    this.signalr.onSlotStateChanged((data: any) => {
      this.updateLocalSlotStatus(data.tokenNumber, data.status);
    });
  }

  private updateLocalSlotStatus(tokenNumber: number, status: string) {
    const currentTokens = [...this.tokens()];
    const index = currentTokens.findIndex(t => t.tokenNumber === tokenNumber);
    if (index !== -1) {
      currentTokens[index] = { ...currentTokens[index], status: status, isLocked: status === 'Locked' };
      this.tokens.set(currentTokens);
    }
  }

  loadSlots() {
    const docId = this.selectedDoctor()?.id;
    if (!docId) return;

    this.firstAvailableToken.set(null);
    this.nextAvailableDate.set(null);

    this.http.get<any[]>(`${environment.apiUrl}/patient/appointments/slots/${docId}?date=${this.bookingDate}`)
      .subscribe(res => {
        const mappedSlots = res.map(s => ({
          id: s.id,
          tokenNumber: s.tokenNumber,
          isLocked: s.isLocked,
          status: s.status,
          slotTime: s.slotTime
        }));
        this.tokens.set(mappedSlots);

        if (this.selectedDoctor()?.bookingMode == 1 || this.selectedDoctor()?.bookingMode == 'Token') { // TOKEN MODE
          const firstAvailable = mappedSlots.find(s => s.status === 'Available');
          if (firstAvailable) {
            this.firstAvailableToken.set(firstAvailable);
          } else {
            this.findNextAvailableDate(docId);
          }
        }
      });
  }

  findNextAvailableDate(docId: number) {
    this.http.get<string[]>(`${environment.apiUrl}/patient/doctors/${docId}/availability-dates`)
      .subscribe(dates => {
        const futureDates = dates.filter(d => d > this.bookingDate);
        if (futureDates.length > 0) {
          this.nextAvailableDate.set(futureDates[0]);
        }
      });
  }

  switchToNextDate() {
    if (this.nextAvailableDate()) {
      this.bookingDate = this.nextAvailableDate()!;
      this.loadSlots();
    }
  }

  onTokenSelected(token: any) {
    this.http.post(`${environment.apiUrl}/patient/appointments/lock`, { 
      doctorId: this.selectedDoctor().id,
      date: this.bookingDate,
      tokenNumber: token.tokenNumber
    }).subscribe({
      next: () => {
        this.selectedToken.set(token);
        if (this.selectedDoctor()?.bookingMode == 0 || this.selectedDoctor()?.bookingMode == 'Slot') {
           // Scroll to bottom or show feedback for Slot mode
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to lock token. It might be taken.');
        this.loadSlots();
      }
    });
  }

  confirmBooking() {
    const payload = {
      doctorId: this.selectedDoctor().id,
      date: this.bookingDate,
      tokenNumber: this.selectedToken().tokenNumber,
      reasonForVisit: 'General Consultation' // Explicitly providing a default
    };

    this.http.post(`${environment.apiUrl}/patient/appointments/book`, payload).subscribe({
      next: () => {
        alert('Appointment booked successfully!');
        this.step.set(1);
        this.selectedToken.set(null);
      },
      error: (err: any) => {
        const msg = err.status === 0 
          ? 'Unable to connect to the server.' 
          : (err.error?.message || err.error || 'Booking failed. Your slot might have expired.');
        alert(msg);
      }
    });
  }
}

