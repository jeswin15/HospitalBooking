import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { RouterLink } from '@angular/router';
import { SignalrService } from '../../core/services/signalr.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="home-container fade-in">
      
      <!-- WELCOME BANNER -->
      <div class="welcome-banner shadow-lg mb-12">
        <div class="banner-content">
          <div class="flex items-center gap-4 mb-6">
             <span class="px-5 py-2 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-teal-900 border border-white/20">Member Dashboard</span>
             <span class="text-teal-800 text-xs font-bold">{{ todayDate }}</span>
          </div>
          <h4>Welcome back,</h4>
          <h2>{{ authService.currentUser()?.name }}.</h2>
          <p class="mt-4 text-teal-900/80 font-medium max-w-xl">Your health is our primary commitment. Monitor your upcoming consultations, view live specialists, and access your managed care records instantly.</p>
          
          <div class="flex gap-4 mt-10">
            <button routerLink="/patient/doctors" class="px-8 py-4 bg-teal-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-teal-900/20 hover:scale-105 transition-all">
              Schedule New Visit
            </button>
            <button routerLink="/patient/appointments" class="px-8 py-4 bg-white/20 backdrop-blur-md text-teal-900 border border-teal-900/10 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/30 transition-all">
              View My Schedule
            </button>
          </div>
        </div>
      </div>

      <!-- ANALYTICS GRID -->
      <div class="status-section">
        <div class="flex items-center justify-between mb-8">
           <h3 class="text-2xl font-black text-slate-800 tracking-tight">Pulse Wellness Overview</h3>
           <a routerLink="/patient/doctors" class="text-xs font-black text-teal-600 uppercase tracking-widest hover:text-teal-800 transition-colors">See all specialists →</a>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <!-- Specialists Card -->
          <div class="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-teal-100 transition-all group">
            <div class="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 mb-6 group-hover:bg-teal-600 group-hover:text-white transition-all">
              <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/></svg>
            </div>
            <div class="text-3xl font-black text-slate-800 leading-none mb-2">{{ doctorsCount() }}</div>
            <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Specialists</div>
          </div>

          <!-- Appointments Card -->
          <div class="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-orange-100 transition-all group">
            <div class="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mb-6 group-hover:bg-orange-600 group-hover:text-white transition-all">
              <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div class="text-3xl font-black text-slate-800 leading-none mb-2">{{ appointments().length }}</div>
            <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Consultations</div>
          </div>

          <!-- Community Card -->
          <div class="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group">
            <div class="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /></svg>
            </div>
            <div class="text-3xl font-black text-slate-800 leading-none mb-2">{{ stats()?.totalPatients || '2.4k' }}</div>
            <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Community</div>
          </div>

          <!-- Wellness Score -->
          <div class="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-rose-100 transition-all group">
            <div class="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-6 group-hover:bg-rose-600 group-hover:text-white transition-all">
              <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <div class="text-3xl font-black text-slate-800 leading-none mb-2">98%</div>
            <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Care Satisfaction</div>
          </div>
        </div>
      </div>

      <!-- DASHBOARD QUICK SEARCH -->
      <div class="mt-12 p-12 bg-slate-900 rounded-[40px] text-white flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden">
         <div class="relative z-10 flex flex-col gap-4 max-w-xl">
            <h3 class="text-3xl font-black tracking-tight leading-tight">Missing a consultation?<br><span class="text-teal-400">Discover top specialists now.</span></h3>
            <p class="text-slate-400 font-medium">Search through 20+ specialized departments and book your preferred token in seconds.</p>
         </div>
         <div class="relative z-10 w-full md:w-fit">
            <button routerLink="/patient/doctors" class="w-full md:w-auto px-12 py-5 bg-teal-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-teal-600 hover:scale-105 transition-all shadow-xl shadow-teal-500/20">
              Start Searching
            </button>
         </div>
         <div class="absolute right-[-50px] top-[-50px] w-64 h-64 bg-teal-500/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  `,
  styles: [`
    .home-container { @apply flex flex-col pt-2 pb-20; }
    .welcome-banner {
      background: linear-gradient(135deg, #CCF2F4 0%, #A4EBF3 100%);
      border-radius: 40px;
      padding: 4rem;
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.5);
    }
    .banner-content { position: relative; z-index: 1; color: #004D40; }
    .banner-content h4 { @apply text-sm font-black uppercase tracking-[0.3em] text-teal-700/60 mb-2; }
    .banner-content h2 { @apply text-5xl font-black text-teal-900 tracking-tighter mb-4; }
    .fade-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class HomeComponent implements OnInit {
  public authService = inject(AuthService);
  private http = inject(HttpClient);
  public signalrService = inject(SignalrService);

  todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  doctorsCount = signal(0);
  appointments = signal<any[]>([]);
  stats = signal<any>(null);

  ngOnInit() {
    this.http.get<any[]>(`${environment.apiUrl}/patient/doctors`).subscribe(data => {
      this.doctorsCount.set(data.filter((d: any) => d.name).length);
    });

    this.http.get<any[]>(`${environment.apiUrl}/patient/appointments`).subscribe(data => {
      this.appointments.set(data);
      if (data.length > 0) {
        this.signalrService.startConnection(data[0].doctorId, data[0].date);
      }
    });

    this.http.get<any>(`${environment.apiUrl}/admin/stats`).subscribe(data => {
      this.stats.set(data);
    });
  }
}
