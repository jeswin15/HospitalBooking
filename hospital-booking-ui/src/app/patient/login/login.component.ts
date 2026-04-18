import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-surface px-4">
      <div class="card w-full max-w-md space-y-8">
        <div class="text-center">
          <h2 class="text-3xl font-bold text-primary">City Hospital</h2>
          <p class="mt-2 text-slate-500">Welcome back. Please login to your account.</p>
        </div>
        
        <form class="space-y-6" (submit)="onLogin()">
          <div class="space-y-1">
            <label class="text-sm font-medium text-slate-700">Email Address</label>
            <input name="email" type="email" [(ngModel)]="credentials.email" required 
                   class="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all">
          </div>
          
          <div class="space-y-1">
            <label class="text-sm font-medium text-slate-700">Password</label>
            <input name="password" type="password" [(ngModel)]="credentials.password" required
                   class="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all">
          </div>

          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center">
              <input type="checkbox" class="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded">
              <label class="ml-2 text-slate-600">Remember me</label>
            </div>
            <a href="#" class="text-primary hover:underline font-medium">Forgot password?</a>
          </div>

          <button type="submit" [disabled]="loading" class="w-full btn-primary py-3 flex justify-center items-center">
            @if (loading) {
              <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Logging in...
            } @else {
              Sign In
            }
          </button>
        </form>

        <div class="text-center text-sm text-slate-600">
          Don't have an account? 
          <a routerLink="/register" class="text-primary hover:underline font-medium">Register now</a>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  credentials = { email: '', password: '' };
  loading = false;

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
    this.loading = true;
    this.authService.login(this.credentials, 'patient').subscribe({
      next: () => {
        this.router.navigate(['/patient/home']);
      },
      error: (err) => {
        this.loading = false;
        alert(err.error?.message || 'Login failed');
      }
    });
  }
}
