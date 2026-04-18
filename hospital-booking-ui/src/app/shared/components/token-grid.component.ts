import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SlotInfo {
  tokenNumber: number;
  slotTime: string;
  status: 'Available' | 'Booked' | 'Blocked' | 'Selected';
}

@Component({
  selector: 'app-token-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="token-grid-container">
      <div class="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
        <button 
          *ngFor="let slot of slots" 
          [disabled]="slot.status.toLowerCase() === 'booked' || slot.status.toLowerCase() === 'blocked' || slot.status.toLowerCase() === 'locked'"
          (click)="selectToken(slot)"
          [class]="getSlotClass(slot)"
          class="token-pill group relative h-16 flex flex-col items-center justify-center rounded-2xl border-2 transition-all active:scale-95">
          
          <span class="token-number text-lg font-black">{{ slot.tokenNumber }}</span>
          <span class="token-time text-[10px] font-bold opacity-60 uppercase">{{ slot.slotTime }}</span>
          
          <!-- Tooltip for status -->
          <div class="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
            {{ slot.status }}
          </div>
        </button>
      </div>

      <!-- Selection Footer with Countdown -->
      <div *ngIf="selectedSlot" class="mt-8 p-6 bg-blue-50 border border-blue-100 rounded-3xl slide-in">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg shadow-blue-200">
              {{ selectedSlot.tokenNumber }}
            </div>
            <div>
              <p class="text-blue-900 font-bold">Token Selected</p>
              <p class="text-blue-600 text-sm font-medium">Session at {{ selectedSlot.slotTime }}</p>
            </div>
          </div>
          
          <div class="text-right">
            <p class="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Hold Expires In</p>
            <div class="text-2xl font-black text-blue-600 tabular-nums">
              {{ formatTime(timerSeconds) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .token-pill.available { border-color: #F1F5F9; background: white; color: #475569; }
    .token-pill.available:hover { border-color: #2563EB; color: #2563EB; background: #EFF6FF; }
    
    .token-pill.booked { border-color: #FEE2E2; background: #FEF2F2; color: #F87171; cursor: not-allowed; opacity: 0.6; }
    .token-pill.blocked { border-color: #F1F5F9; background: #F8FAFC; color: #CBD5E1; cursor: not-allowed; }
    
    .token-pill.selected { border-color: #2563EB; background: #2563EB; color: white; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2); }
    
    .slide-in { animation: slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes slideInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class TokenGridComponent implements OnInit, OnDestroy {
  @Input() slots: SlotInfo[] = [];
  @Output() tokenSelected = new EventEmitter<SlotInfo>();
  @Output() holdExpired = new EventEmitter<void>();

  selectedSlot: SlotInfo | null = null;
  timerSeconds: number = 480; // 8 minutes
  private intervalId: any;

  ngOnInit() {}

  ngOnDestroy() {
    this.clearTimer();
  }

  selectToken(slot: SlotInfo) {
    if (slot.status !== 'Available') return;
    
    // Reset previous selection
    this.slots.forEach(s => { if (s.status === 'Selected') s.status = 'Available'; });
    
    this.selectedSlot = slot;
    slot.status = 'Selected';
    this.tokenSelected.emit(slot);
    this.startTimer();
  }

  private startTimer() {
    this.clearTimer();
    this.timerSeconds = 480;
    this.intervalId = setInterval(() => {
      this.timerSeconds--;
      if (this.timerSeconds <= 0) {
        this.clearTimer();
        this.holdExpired.emit();
        if (this.selectedSlot) this.selectedSlot.status = 'Available';
        this.selectedSlot = null;
      }
    }, 1000);
  }

  private clearTimer() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getSlotClass(slot: SlotInfo): string {
    return slot.status.toLowerCase();
  }
}
