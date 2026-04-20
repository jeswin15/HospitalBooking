import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-wrapper fade-in">
      <div class="auth-card glass-panel slide-in">
        <div class="brand-header">
          <div class="brand-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <h2 class="text-3xl font-black tracking-tight text-slate-900">{{ isLogin() ? 'Welcome Back' : 'Join Our Platform' }}</h2>
          <p class="subtitle mt-2 text-slate-500 font-medium">{{ isLogin() ? 'Sign in to access your dashboard' : 'Create an account to book your first appointment' }}</p>
        </div>
        
        <div *ngIf="errorMsg()" class="alert error !bg-red-50 !text-red-600 !border-red-100 !p-4 !rounded-xl !mb-6 !font-bold !text-sm">{{ errorMsg() }}</div>
        <div *ngIf="successMsg()" class="alert success !bg-emerald-50 !text-emerald-600 !border-emerald-100 !p-4 !rounded-xl !mb-6 !font-bold !text-sm">{{ successMsg() }}</div>

        <form (ngSubmit)="onSubmit()" class="space-y-5">
          
          <div *ngIf="isLogin()" class="role-selector flex gap-2 mb-8 p-1.5 bg-slate-100/50 rounded-2xl">
            <button 
              type="button" 
              (click)="formData.role = 'patient'" 
              [class.active]="formData.role === 'patient'"
              class="flex-1 py-3 text-xs font-bold rounded-xl transition-all uppercase tracking-wider">
              Patient
            </button>
            <button 
              type="button" 
              (click)="formData.role = 'doctor'" 
              [class.active]="formData.role === 'doctor'"
              class="flex-1 py-3 text-xs font-bold rounded-xl transition-all uppercase tracking-wider">
              Doctor
            </button>
            <button 
              type="button" 
              (click)="formData.role = 'admin'" 
              [class.active]="formData.role === 'admin'"
              class="flex-1 py-3 text-xs font-bold rounded-xl transition-all uppercase tracking-wider">
              Admin
            </button>
          </div>

          <div *ngIf="!isLogin()" class="form-group slide-in">
            <label for="name" class="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
            <input type="text" id="name" name="name" [(ngModel)]="formData.name" required placeholder="Enter your name" class="input-field w-full px-5 py-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white"/>
          </div>

          <div class="form-group">
            <label for="email" class="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
            <input type="email" id="email" name="email" [(ngModel)]="formData.email" required placeholder="name@example.com" class="input-field w-full px-5 py-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white"/>
          </div>

          <div class="form-group">
            <label for="password" class="block text-sm font-bold text-slate-700 mb-2">Password</label>
            <input type="password" id="password" name="password" [(ngModel)]="formData.password" required placeholder="Enter password" class="input-field w-full px-5 py-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white"/>
          </div>

          <button type="submit" class="btn-primary w-full py-4 !bg-blue-600 !text-white !font-bold !rounded-xl !text-lg !shadow-xl !shadow-blue-200 hover:!bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50" [disabled]="loading()">
            {{ loading() ? 'Authenticating...' : (isLogin() ? 'Secure Login' : 'Create Account') }}
          </button>
        </form>

        <div class="divider flex items-center gap-4 my-8">
            <div class="h-[1px] bg-slate-100 flex-1"></div>
            <span class="text-xs font-bold text-slate-300 uppercase tracking-widest">OR</span>
            <div class="h-[1px] bg-slate-100 flex-1"></div>
        </div>

        <div class="toggle-link text-center">
          <p class="text-slate-500 font-medium">
            {{ isLogin() ? "Don't have an account?" : "Already have an account?" }}
            <button type="button" class="btn-link !text-blue-600 !font-extrabold ml-2 hover:underline" (click)="router.navigate(['/register'])">
              {{ isLogin() ? 'Register here' : 'Login here' }}
            </button>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-wrapper { 
      display: flex; justify-content: center; align-items: center; min-height: 100vh; 
      background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%); padding: 1.5rem; 
    }
    .glass-panel { 
      background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(20px); 
      border: 1px solid white; border-radius: 32px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.05); 
      width: 100%; max-width: 480px; padding: 4rem 3rem; 
    }
    .brand-icon svg { width: 56px; height: 56px; color: #2563EB; margin: 0 auto 1.5rem; filter: drop-shadow(0 4px 6px rgba(37, 99, 235, 0.2)); }
    .brand-header { text-align: center; margin-bottom: 3rem; }
    
    .fade-in { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
    .slide-in { animation: slideInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
    
    .role-selector button { color: #64748B; background: transparent; }
    .role-selector button.active { 
      background: white; color: #2563EB; 
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); 
    }
    
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideInUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class AuthComponent implements OnInit {
  private authService = inject(AuthService);
  public router = inject(Router);

  isLogin = signal(true);
  loading = signal(false);
  errorMsg = signal('');
  successMsg = signal('');

  formData = {
    name: '',
    email: '',
    password: '',
    role: 'Patient'
  };

  ngOnInit() {
    // Reset form data to ensure clean slate
    this.formData = { name: '', email: '', password: '', role: 'patient' };
    
    if (this.authService.isLoggedIn()) {
      this.redirectUser();
    }
  }

  toggleMode() {
    this.isLogin.set(!this.isLogin());
    this.errorMsg.set('');
    this.successMsg.set('');
  }

  onSubmit() {
    this.errorMsg.set('');
    this.successMsg.set('');
    this.loading.set(true);

    if (this.isLogin()) {
      // Login Validation
      if (!this.formData.email || !this.formData.email.includes('@')) {
        this.errorMsg.set('Please enter a valid email address.');
        this.loading.set(false);
        return;
      }
      if (!this.formData.password) {
        this.errorMsg.set('Please enter your password.');
        this.loading.set(false);
        return;
      }

      const role = this.formData.role.toLowerCase() as 'admin' | 'doctor' | 'patient';
      this.authService.login({ email: this.formData.email, password: this.formData.password }, role).subscribe({
        next: (res) => {
          this.loading.set(false);
          // Get the normalized role from the service after it's been processed
          const normalizedRole = this.authService.currentUser()?.role;
          this.redirectUser(normalizedRole);
        },
        error: (err: any) => {
          this.loading.set(false);
          const msg = err.status === 0 
            ? 'Unable to connect to the server. Please ensure the backend is running.'
            : (err.error?.message || err.error || 'Login failed. Check credentials.');
          this.errorMsg.set(msg);
        }
      });
    } else {
      if (!this.formData.name) {
        this.errorMsg.set('Name is required.');
        this.loading.set(false);
        return;
      }
      this.authService.register(this.formData).subscribe({
        next: () => {
          this.loading.set(false);
          this.successMsg.set('Success! Now please login.');
          this.isLogin.set(true);
        },
        error: (err) => {
          this.loading.set(false);
          const msg = err.status === 0 
            ? 'Unable to connect to the server. Please ensure the backend is running.'
            : (err.error?.message || err.error || 'Registration failed.');
          this.errorMsg.set(msg);
        }
      });
    }
  }

  private redirectUser(role?: string) {
    const currentRole = role || this.authService.currentUser()?.role;
    console.log('Redirecting user with role:', currentRole);
    
    if (currentRole === 'Admin') {
      this.router.navigate(['/admin/dashboard']);
    } else if (currentRole === 'Doctor') {
      this.router.navigate(['/doctor/dashboard']);
    } else {
      this.router.navigate(['/patient/home']);
    }
  }
}
