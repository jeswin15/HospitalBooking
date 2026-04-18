import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div class="w-full max-w-md">
        <!-- Logo/Header -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-xl shadow-blue-200 mb-4">
             <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <h2 class="text-3xl font-black text-slate-800 tracking-tight">Create Account</h2>
          <p class="mt-2 text-slate-500 font-medium">Join City Hospital's digital patient network.</p>
        </div>

        <div class="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100">
          
          <!-- Error Alert -->
          @if (errorMessage) {
            <div class="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-shake">
               <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               <div class="flex-1">
                 <p class="text-xs font-bold text-red-800 uppercase tracking-widest leading-none mb-1">Registration Error</p>
                 <p class="text-sm text-red-600 font-medium">{{ errorMessage }}</p>
               </div>
               <button (click)="errorMessage = ''" class="text-red-400 hover:text-red-600">
                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>
          }

          <form class="space-y-5" (submit)="onRegister()">
            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Identity</label>
              <input name="name" type="text" [(ngModel)]="user.name" required placeholder="Dr. John Doe"
                     class="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all">
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Connection</label>
              <input name="email" type="email" [(ngModel)]="user.email" required placeholder="john@example.com"
                     class="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all">
            </div>

            <div class="grid grid-cols-2 gap-4">
               <div class="space-y-1.5">
                  <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Mobile Contact</label>
                  <input name="phone" type="tel" [(ngModel)]="user.phone" required placeholder="9876543210"
                         class="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all">
               </div>
               <div class="space-y-1.5">
                  <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Gender</label>
                  <select name="gender" [(ngModel)]="user.gender" required
                          class="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer">
                     <option value="Male">Male</option>
                     <option value="Female">Female</option>
                     <option value="Other">Other</option>
                  </select>
               </div>
            </div>
            
            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Security Code</label>
              <input name="password" type="password" [(ngModel)]="user.password" required placeholder="••••••••"
                     class="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all">
            </div>

            <button type="submit" [disabled]="loading" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-200 transition-all active:scale-[0.98] disabled:opacity-50 uppercase text-xs tracking-widest mt-4">
              @if (loading) {
                <div class="flex items-center justify-center gap-2">
                  <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Onboarding...</span>
                </div>
              } @else {
                Create Secure Account
              }
            </button>
          </form>

          <p class="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mt-8">
            Already registered? 
            <a routerLink="/auth" class="text-blue-600 hover:underline">Login Securely</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-4px); }
      75% { transform: translateX(4px); }
    }
    .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
  `]
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  user = { name: '', email: '', phone: '', gender: 'Male', password: '' };
  loading = false;
  errorMessage = '';

  onRegister() {
    this.loading = true;
    this.errorMessage = '';
    
    this.authService.register(this.user).subscribe({
      next: () => {
        alert('Account successfully established! You can now log in.');
        this.router.navigate(['/auth']);
      },
      error: (err) => {
        this.loading = false;
        console.error('Registration failed:', err);
        
        // Robust Error Parsing
        if (err.status === 0) {
          this.errorMessage = 'Network Connection Error. Please verify the backend API is reachable.';
        } else if (err.error && typeof err.error === 'object') {
           this.errorMessage = err.error.message || 'Validation failed. Please check your data.';
        } else if (typeof err.error === 'string') {
           this.errorMessage = err.error;
        } else {
           this.errorMessage = 'An unexpected server error occurred during registration.';
        }
      }
    });
  }
}
