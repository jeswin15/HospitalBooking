import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-doctor-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dr-card bg-white rounded-[40px] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-slate-100 group">
      <div class="flex flex-col h-full">
        <!-- Badge -->
        <div class="flex justify-between items-start mb-6">
          <div class="status-pill px-4 py-2 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Available Today
          </div>
          <div class="rating-badge flex items-center gap-1.5 font-black text-slate-900">
            <svg class="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            {{ rating }}
          </div>
        </div>

        <!-- Bio Section -->
        <div class="flex items-center gap-6 mb-8">
          <div class="relative">
            <div class="w-24 h-24 rounded-3xl bg-slate-100 overflow-hidden ring-4 ring-slate-50 border-4 border-white">
              <img [src]="photoUrl || 'assets/dr-placeholder.png'" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="Doctor photo">
            </div>
            <div class="absolute -bottom-2 -right-2 w-10 h-10 bg-white shadow-lg rounded-2xl flex items-center justify-center border border-slate-50">
               <span class="text-lg">👨‍⚕️</span>
            </div>
          </div>
          <div>
            <h4 class="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">{{ name }}</h4>
            <p class="text-slate-500 font-bold text-sm">{{ designation }}</p>
            <p class="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">{{ qualification }}</p>
          </div>
        </div>

        <!-- Experience Display -->
        <div class="mb-8">
          <div class="p-4 bg-slate-50 rounded-3xl border border-slate-100 group-hover:bg-white transition-colors flex items-center justify-between">
            <div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Professional Experience</p>
              <p class="text-lg font-black text-slate-900">{{ experience }} <span class="text-xs font-medium text-slate-500">Years of Practice</span></p>
            </div>
            <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
          </div>
        </div>

        <button 
          (click)="onSelect.emit()" 
          class="mt-auto w-full py-5 bg-slate-900 text-white font-black rounded-[24px] shadow-xl shadow-slate-200 group-hover:bg-blue-600 group-hover:shadow-blue-200 active:scale-95 transition-all">
          Book Appointment
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dr-card { height: 100%; min-height: 480px; }
  `]
})
export class DoctorCardComponent {
  @Input() doctor: any;
  @Output() onSelect = new EventEmitter<void>();

  get name() { return this.doctor?.name || ''; }
  get designation() { return this.doctor?.designation || ''; }
  get qualification() { return this.doctor?.qualification || ''; }
  get experience() { return this.doctor?.experienceYears || 0; }
  get fee() { return this.doctor?.consultationFee || 0; }
  get photoUrl() { 
    const photo = this.doctor?.profilePhotoUrl;
    if (!photo) return '';
    if (photo.startsWith('http')) return photo;
    return `${environment.signalrUrl}/${photo}`;
  }
  get rating() { return 4.8; }
}
