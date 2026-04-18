import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-queue-tracker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="queue-tracker glass-panel p-8 rounded-[32px] border border-white shadow-2xl">
      <div class="flex items-center justify-between mb-10">
        <div>
          <h3 class="text-2xl font-black text-slate-900 leading-tight">Live Queue Status</h3>
          <p class="text-slate-500 font-medium mt-1">Updates in real-time as doctor calls patients</p>
        </div>
        <div class="status-indicator flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span class="text-xs font-black uppercase tracking-widest">Live</span>
        </div>
      </div>

      <!-- Progressive Tracker -->
      <div class="relative flex justify-between items-center mb-12">
        <div class="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1.5 bg-slate-100 rounded-full -z-10"></div>
        <div class="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-blue-600 rounded-full transition-all duration-1000 -z-10"
             [style.width.%]="getProgress()"></div>

        <!-- Serving -->
        <div class="step flex flex-col items-center">
          <div class="w-14 h-14 rounded-2xl bg-white border-4 border-blue-600 flex items-center justify-center text-xl font-black text-blue-600 shadow-xl shadow-blue-100">
            {{ currentToken }}
          </div>
          <p class="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Now Serving</p>
        </div>

        <!-- Progress Indicator (if gap exists) -->
        <div *ngIf="yourToken - currentToken > 1" class="text-slate-300 font-black italic">...</div>

        <!-- You -->
        <div class="step flex flex-col items-center">
          <div [class.active]="yourToken === currentToken" 
               class="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-black shadow-2xl shadow-blue-300 relative">
            {{ yourToken }}
            <div class="absolute -top-3 px-3 py-1 bg-amber-400 text-amber-950 text-[10px] font-black rounded-full shadow-lg">YOU</div>
          </div>
          <p class="mt-4 text-[10px] font-black text-blue-600 uppercase tracking-widest">Your Token</p>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 gap-4">
        <div class="p-5 bg-slate-50 rounded-2xl border border-slate-100">
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estimated Wait</p>
          <p class="text-3xl font-black text-slate-900">{{ calculateWaitTime() }} <span class="text-sm text-slate-500 font-bold uppercase ml-1">min</span></p>
        </div>
        <div class="p-5 bg-slate-50 rounded-2xl border border-slate-100">
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Queue Position</p>
          <p class="text-3xl font-black text-slate-900">{{ yourToken - currentToken }} <span class="text-sm text-slate-500 font-bold uppercase ml-1">in queue</span></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .glass-panel { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); }
  `]
})
export class QueueTrackerComponent {
  @Input() currentToken: number = 0;
  @Input() yourToken: number = 0;
  @Input() slotDurationMinutes: number = 15;

  getProgress(): number {
    if (this.yourToken === 0) return 0;
    return Math.min((this.currentToken / this.yourToken) * 100, 100);
  }

  calculateWaitTime(): number {
    const diff = this.yourToken - this.currentToken;
    return Math.max(diff * this.slotDurationMinutes, 0);
  }
}
