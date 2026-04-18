import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { SignalrService } from '../../core/services/signalr.service';


import { TokenGridComponent } from '../../shared/components/token-grid.component';

@Component({
  selector: 'app-slots',
  standalone: true,
  imports: [CommonModule, FormsModule, TokenGridComponent],
  template: `
    <div class="sessions-container fade-in pb-20 max-w-6xl mx-auto">
      
      <div class="header mb-10">
        <button (click)="goBack()" class="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-bold text-sm mb-4 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          Back to Search
        </button>
        <h2 class="text-3xl font-black text-slate-800 tracking-tight">Schedule Appointment</h2>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        <!-- Doctor Info Sidebar -->
        <div class="lg:col-span-1">
          <div class="panel !p-0 overflow-hidden shadow-xl shadow-slate-200/50 border-none">
            <div class="h-48 relative">
              <img [src]="getPhotoUrl() || 'https://images.unsplash.com/photo-1559839734-2b71f1536783?auto=format&fit=crop&q=80&w=400'" class="w-full h-full object-cover">
              <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
              <div class="absolute bottom-6 left-6">
                <span class="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded mb-2 inline-block">
                  {{ doctor()?.departmentName || 'Specialist' }}
                </span>
                <h3 class="text-white text-xl font-black leading-tight">{{ doctor()?.name }}</h3>
              </div>
            </div>
            <div class="p-6 space-y-4">
                <div class="info-item flex items-center gap-2 text-slate-500 font-bold text-xs uppercase">
                  <svg class="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20"/></svg>
                  <span>Validated Professional</span>
                </div>
              <div class="flex items-center gap-3 text-slate-600">
                <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <div class="flex flex-col">
                   <span class="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Clinical Practice</span>
                   <span class="font-bold">{{ doctor()?.experienceYears || 0 }} Years of Experience</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Booking Portal -->
        <div class="lg:col-span-2 space-y-8">
          
          <div class="panel !p-10 shadow-2xl shadow-slate-200/50 border-none relative overflow-hidden">
            <div class="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
            
            <div class="flex items-center gap-4 mb-10">
              <div class="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-200">1</div>
              <div>
                <h4 class="text-xl font-black text-slate-800 tracking-tight">Select your convenience</h4>
                <p class="text-slate-400 font-medium text-sm">Choose the date and timing for your consultation.</p>
              </div>
            </div>

            <div class="mb-10">
              <label class="block text-sm font-bold text-slate-800 mb-4 uppercase tracking-widest">Available Dates</label>
              <div class="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                @for (date of availableDates(); track date) {
                  <button (click)="jumpToDate(date)" 
                          [class.bg-blue-600]="selectedDate === date"
                          [class.text-white]="selectedDate === date"
                          [class.border-blue-600]="selectedDate === date"
                          [class.bg-white]="selectedDate !== date"
                          [class.text-slate-600]="selectedDate !== date"
                          [class.border-slate-100]="selectedDate !== date"
                          class="px-5 py-3 rounded-xl border-2 font-bold text-xs whitespace-nowrap transition-all hover:border-blue-300">
                    {{ date | date:'MMM dd' }}
                    <span class="block text-[10px] opacity-60">{{ date | date:'EEEE' }}</span>
                  </button>
                }
                @if (availableDates().length === 0) {
                  <p class="text-slate-400 text-xs font-medium italic">No upcoming availability found.</p>
                }
              </div>
            </div>

            <div class="mb-10">
              <label class="block text-sm font-bold text-slate-800 mb-4 uppercase tracking-widest">Manual Date Selection</label>
              <input type="date" [(ngModel)]="selectedDate" (change)="onDateChange()" class="w-full md:w-64 p-4 !bg-slate-50 border-2 border-slate-100 rounded-xl font-bold focus:border-blue-500 outline-none transition-all" />
            </div>

            <!-- Token / Slot Grid Integration -->
            <!-- Token / Slot Grid Integration -->
            <div class="mb-10">
              <label class="block text-sm font-bold text-slate-800 mb-4 uppercase tracking-widest">
                {{ (doctor()?.bookingMode === 'Slot' || doctor()?.bookingMode === 0) ? 'Select your timing' : 'Your Secure Entry' }}
              </label>
              
              @if (doctor()?.bookingMode === 'Slot' || doctor()?.bookingMode === 0) {
                <div class="mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                   <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Time-Slot Based</p>
                   <p class="text-xs font-bold text-slate-600">Please select a specific timing from the saved availability below.</p>
                </div>
                <app-token-grid [slots]="tokens()" (tokenSelected)="onTokenSelected($event)"></app-token-grid>
                
                @if (tokens().length === 0) {
                  <div class="py-12 text-center panel border-dashed border-2 bg-slate-50/50 rounded-2xl">
                     <p class="text-slate-400 font-bold">No timing slots saved for this date.</p>
                     <p class="text-[10px] font-black uppercase tracking-widest text-slate-300 mt-2">Try selecting another date</p>
                  </div>
                }
              } @else {
                <!-- TOKEN MODE SIMPLIFIED VIEW -->
                @if (getNextToken()) {
                  <div class="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                     <div>
                        <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Queue Status</p>
                        <p class="text-xs font-bold text-slate-700">Next available: #{{ getNextToken()?.tokenNumber }}</p>
                     </div>
                     <div class="text-right">
                        <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Capacity</p>
                        <p class="text-xs font-bold text-slate-700">{{ tokens().length }} Slots / {{ doctor()?.maxTokensPerDay || 50 }} Tokens</p>
                     </div>
                  </div>

                  <div class="p-8 bg-blue-600 rounded-3xl shadow-2xl shadow-blue-200 text-white relative overflow-hidden group">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                    <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div>
                        <span class="text-[10px] font-black uppercase tracking-widest opacity-80 block mb-2">Secure Entry for {{ selectedDate | date:'fullDate' }}</span>
                        <h3 class="text-4xl font-black tracking-tighter">Token #{{ getNextToken()?.tokenNumber }}</h3>
                        <p class="text-blue-100 font-medium mt-1">Estimated Consult Time: {{ getNextToken()?.slotTime }}</p>
                      </div>
                      <button (click)="onTokenSelected(getNextToken())" 
                              [class.bg-white]="selectedSlot()?.tokenNumber === getNextToken()?.tokenNumber"
                              [class.text-blue-600]="selectedSlot()?.tokenNumber === getNextToken()?.tokenNumber"
                              class="px-8 py-4 bg-blue-500/30 border-2 border-white/20 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white hover:text-blue-600 transition-all">
                        {{ selectedSlot()?.tokenNumber === getNextToken()?.tokenNumber ? 'Token Secured' : 'Secure This Token' }}
                      </button>
                    </div>
                  </div>
                } @else {

                   <!-- SUGGESTION LOGIC -->
                   <div class="py-12 text-center panel border-dashed border-2 bg-slate-50/50 rounded-2xl">
                     <div class="mb-4">
                        <svg class="w-12 h-12 text-slate-200 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                     </div>
                     <p class="text-slate-500 font-black uppercase text-[10px] tracking-widest mb-1">Today's Schedule</p>
                     <p class="text-slate-400 font-bold mb-6">Consultation queue is currently full or unavailable.</p>
                     
                     @if (isScanning()) {
                        <div class="flex items-center justify-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest">
                           <div class="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                           Looking for next available...
                        </div>
                     } @else if (nextAvailableDate()) {
                        <div class="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 slide-in">
                           <p class="text-xs font-bold text-slate-800 mb-4">Next available entry found on:</p>
                           <button (click)="jumpToDate(nextAvailableDate()!)" class="bg-blue-600 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-100 active:scale-95 transition-all">
                              Switch to {{ nextAvailableDate() | date:'MMM dd, yyyy' }}
                           </button>
                        </div>
                     } @else {
                        <p class="text-[10px] font-black uppercase tracking-widest text-slate-300">Try selecting a different date from the picker</p>
                     }
                   </div>
                }
              }
            </div>

            <div class="divider h-[1px] bg-slate-100 my-10"></div>

            <div class="flex items-center gap-4 mb-10">
              <div class="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-200">2</div>
              <div>
                <h4 class="text-xl font-black text-slate-800 tracking-tight">Visit Details</h4>
                <p class="text-slate-400 font-medium text-sm">Please provide the reason for your consultation below.</p>
              </div>
            </div>

            <div class="space-y-8">
              <div>
                <label class="block text-sm font-bold text-slate-800 mb-4 uppercase tracking-widest">Reason for Visit</label>
                <textarea [(ngModel)]="reason" placeholder="Briefly describe your health concern..." class="w-full p-6 !bg-slate-50 border-2 border-slate-100 rounded-2xl font-medium focus:border-blue-500 outline-none transition-all min-height-[120px]"></textarea>
              </div>

              <div class="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Attendance Policy</p>
                <p class="text-xs font-bold text-slate-600">Please arrive 10-15 minutes prior to your allocated time for clinical verification at the front desk.</p>
              </div>

              <button (click)="confirmBooking()" 
                      [disabled]="submitting() || (!selectedSlot() && (doctor()?.bookingMode === 'Slot' || doctor()?.bookingMode === 0 ? true : !getNextToken()))" 
                      class="w-full py-6 !bg-blue-600 hover:!bg-blue-700 !text-white !font-black !rounded-2xl !text-xl !shadow-2xl !shadow-blue-200 transition-all active:scale-[0.98] mt-6 disabled:opacity-30 disabled:grayscale">
                {{ submitting() ? 'Processing...' : 'Confirm Appointment' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sessions-container { padding-top: 2rem; }
  `]
})
export class SlotsComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private signalr = inject(SignalrService);

  doctor = signal<any>(null);
  tokens = signal<any[]>([]);
  availableDates = signal<string[]>([]);
  selectedSlot = signal<any>(null);
  selectedDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD


  reason = '';
  submitting = signal(false);

  // New scanning logic
  nextAvailableDate = signal<string | null>(null);
  isScanning = signal(false);


  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const doctorId = params['doctorId'];
      if (!doctorId) {
        this.router.navigate(['/patient/doctors']);
        return;
      }
      this.fetchDoctor(doctorId);
      this.fetchAvailableDates(doctorId);
    });
  }

  fetchAvailableDates(doctorId: number) {
    this.http.get<string[]>(`${environment.apiUrl}/patient/doctors/${doctorId}/availability-dates`).subscribe(dates => {
      this.availableDates.set(dates);
      // Auto-select first available if today is not available
      if (dates.length > 0 && !dates.includes(this.selectedDate)) {
        this.jumpToDate(dates[0]);
      }
    });
  }

  fetchDoctor(id: number) {
    this.http.get<any[]>(`${environment.apiUrl}/patient/doctors`).subscribe(doctors => {
      const doc = doctors.find((d: any) => d.id === +id);
      this.doctor.set(doc);
      // Always fetch slots to show "Next Token" or the Full Grid
      this.fetchSlots(id, this.selectedDate);
    });
  }

  getPhotoUrl(): string {
    const photo = this.doctor()?.profilePhotoUrl;
    if (!photo) return '';
    if (photo.startsWith('http')) return photo;
    return `${environment.signalrUrl}/${photo}`;
  }

  fetchSlots(doctorId: number, date: string) {
    console.log('Fetching slots for:', doctorId, date);
    
    // Join real-time group for this doctor and date
    this.signalr.onConnected().then(() => {
        this.signalr.joinDoctorQueue(doctorId, date);
    });

    this.http.get<any[]>(`${environment.apiUrl}/patient/appointments/slots/${doctorId}?date=${date}`).subscribe({
      next: (res) => {
        console.log('Fetched slots:', res);
        this.tokens.set(res);
        this.setupListeners(doctorId, date);

        // TRIGGER SCAN if empty and in Token mode
        if (res.length === 0 || !res.some(t => t.status === 'Available')) {
            if (this.doctor()?.bookingMode === 'Token') {
                this.findNextAvailableDate(doctorId, date);
            }
        } else {
            this.nextAvailableDate.set(null);
        }
      },
      error: (err) => console.error('Slot fetch error:', err)
    });
  }

  async findNextAvailableDate(doctorId: number, startDate: string) {
    this.isScanning.set(true);
    this.nextAvailableDate.set(null);
    let current = new Date(startDate);
    
    for(let i = 1; i <= 14; i++) { // Scan up to 14 days
        const next = new Date(startDate);
        next.setDate(next.getDate() + i);
        const dateStr = next.toLocaleDateString('en-CA'); // YYYY-MM-DD
        try {
            const res = await this.http.get<any[]>(`${environment.apiUrl}/patient/appointments/slots/${doctorId}?date=${dateStr}`).toPromise();
            if (res && res.some(t => t.status === 'Available')) {
                this.nextAvailableDate.set(dateStr);
                this.isScanning.set(false);
                return;
            }
        } catch (e) { }
    }
    this.isScanning.set(false);
  }

  jumpToDate(date: string) {
    this.selectedDate = date;
    this.onDateChange();
    this.nextAvailableDate.set(null);
  }

  private setupListeners(doctorId: number, date: string) {
    // 1. Listen for slot status changes (Lock/Book)
    this.signalr.onSlotStateChanged((data: any) => {
        this.tokens.update(current => {
            return current.map(t => {
                if (t.tokenNumber === data.tokenNumber) {
                    return { ...t, status: data.status };
                }
                return t;
            });
        });
    });

    // 2. Listen for broader availability changes (Mode/Capacity)
    this.signalr.onAvailabilityUpdated((data: any) => {
        if (data.doctorId === doctorId) {
            this.http.get<any[]>(`${environment.apiUrl}/patient/appointments/slots/${doctorId}?date=${date}`).subscribe(res => {
                this.tokens.set(res);
            });
        }
    });

    // 3. Queue updates (Doctor status changes)
    this.signalr.onQueueUpdated((data: any) => {
        // Shared state update for "Current Token" is handled via the specific notification
        console.log('Live Queue Update:', data);
    });
  }

  onDateChange() {
    this.fetchSlots(this.doctor().id, this.selectedDate);
  }

  getNextToken() {
    return this.tokens().find(t => t.status === 'Available');
  }

  goBack() {
    this.router.navigate(['/patient/doctors']);
  }

  onTokenSelected(token: any) {
    const payload = {
      doctorId: this.doctor().id,
      date: this.selectedDate,
      tokenNumber: token.tokenNumber
    };

    this.http.post(`${environment.apiUrl}/patient/appointments/lock`, payload).subscribe({
      next: () => this.selectedSlot.set(token),
      error: (err) => {
        alert(err.error?.message || 'Slot busy. Try another.');
        this.fetchSlots(this.doctor().id, this.selectedDate);
      }
    });
  }

  confirmBooking() {
    const isSlotMode = this.doctor()?.bookingMode === 'Slot' || this.doctor()?.bookingMode === 0;
    const isTokenMode = !isSlotMode;
    
    // If Token mode and nothing selected, auto-select next and proceed
    if (isTokenMode && !this.selectedSlot()) {
        const nextToken = this.getNextToken();
        if (nextToken) {
            console.log('Auto-securing token:', nextToken.tokenNumber);
            this.submitting.set(true);
            const payload = {
                doctorId: this.doctor().id,
                date: this.selectedDate,
                tokenNumber: nextToken.tokenNumber
            };
            this.http.post(`${environment.apiUrl}/patient/appointments/lock`, payload).subscribe({
                next: () => {
                    this.selectedSlot.set(nextToken);
                    this.finalizeBooking();
                },
                error: (err) => {
                    this.submitting.set(false);
                    alert(err.error?.message || 'Token was just taken. Refreshing...');
                    this.fetchSlots(this.doctor().id, this.selectedDate);
                }
            });
            return;
        }
    }

    if (!this.selectedSlot()) {
        if (isSlotMode) alert('Please select a specific timing slot first.');
        else alert('No tokens available to secure on this date. Please pick another date.');
        return;
    }
    if (!this.reason.trim()) {
      alert('Please describe your concern.');
      return;
    }

    this.submitting.set(true);
    this.finalizeBooking();
  }

  finalizeBooking() {
    const payload = {
      doctorId: this.doctor().id,
      date: this.selectedDate,
      tokenNumber: this.selectedSlot().tokenNumber,
      reasonForVisit: this.reason
    };

    this.http.post(`${environment.apiUrl}/patient/appointments/book`, payload).subscribe({
      next: (res: any) => {
        const timeInfo = res.slotTime ? ` at ${res.slotTime}` : '';
        const tokenInfo = `#${res.tokenNumber}`;
        alert(`Appointment Booked Successfully! Your Token is ${tokenInfo}${timeInfo}.`);
        this.router.navigate(['/patient/home'], { queryParams: { tab: 'bookings' } });
      },
      error: (err) => {
        this.submitting.set(false);
        alert(err.error?.message || 'Booking expired.');
      }
    });
  }
}
