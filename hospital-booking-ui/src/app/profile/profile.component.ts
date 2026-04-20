import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService, User } from '../core/services/auth.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profile-page fade-in max-w-2xl mx-auto py-10">

      <!-- Page Header -->
      <div class="page-header flex justify-between items-start mb-10">
        <div>
          <h2 class="text-3xl font-black text-slate-800 tracking-tight">Account Profile</h2>
          <p class="subtitle text-slate-400 font-medium mt-1">Manage your personal information and account security.</p>
        </div>
        <span class="role-tag bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
           {{ authService.currentUser()?.role }}
        </span>
      </div>

      <!-- Main Card -->
      <div class="profile-card panel !p-0 shadow-2xl shadow-slate-200/50 border-none overflow-hidden">

        <!-- Avatar & Identity -->
        <div class="identity-section p-10 flex items-center gap-8 bg-gradient-to-br from-slate-50 to-white">
          <div class="relative group cursor-pointer" (click)="fileInput.click()">
            <div class="avatar-ring w-24 h-24 rounded-3xl bg-blue-600 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-blue-200 overflow-hidden">
               <img *ngIf="getPhotoUrl()" [src]="getPhotoUrl()" class="w-full h-full object-cover">
               <span *ngIf="!getPhotoUrl()">{{ getInitials() }}</span>
            </div>
            <!-- Upload Overlay -->
            <div class="absolute inset-0 bg-slate-900/60 rounded-3xl opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white text-xl">
               <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <!-- Loading Spinner -->
            <div *ngIf="uploading()" class="absolute inset-0 bg-white/80 rounded-3xl flex items-center justify-center">
              <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <input #fileInput type="file" class="hidden" (change)="onFileSelected($event)" accept="image/*">
          </div>
          <div class="identity-text flex flex-col gap-1">
            <h3 class="display-name text-2xl font-black text-slate-800 tracking-tight">{{ authService.currentUser()?.name }}</h3>
            <p class="display-email text-slate-400 font-medium">{{ authService.currentUser()?.email }}</p>
            <span class="role-pill bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded w-fit mt-2">Verified Account</span>
          </div>
        </div>

        <div class="divider h-[1px] bg-slate-100"></div>

        <!-- Edit Form -->
        <div class="edit-section p-10">
          <div class="section-label flex justify-between items-center mb-10">
            <span class="section-label-text text-[10px] font-black uppercase text-slate-400 tracking-widest">Personal Information</span>
            <button class="edit-toggle-btn text-xs font-black uppercase text-blue-600 hover:text-blue-700 transition-colors" (click)="toggleEdit()" *ngIf="!isEditing()">
              Edit Profile
            </button>
          </div>

          <div *ngIf="successMsg()" class="alert-banner success bg-emerald-50 text-emerald-600 p-4 rounded-xl border border-emerald-100 mb-8 font-bold text-sm">
            {{ successMsg() }}
          </div>
          <div *ngIf="errorMsg()" class="alert-banner error bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 mb-8 font-bold text-sm">
            {{ errorMsg() }}
          </div>

          <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="form-field flex flex-col gap-2">
                <label class="text-sm font-bold text-slate-700 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  [(ngModel)]="form.name"
                  [disabled]="!isEditing()"
                  placeholder="Your full name"
                  class="rounded-xl border-2 border-slate-100 p-4 font-bold focus:border-blue-500 outline-none transition-all disabled:bg-slate-50"
                />
              </div>

              <div class="form-field flex flex-col gap-2">
                <label class="text-sm font-bold text-slate-700 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  [(ngModel)]="form.email"
                  [disabled]="!isEditing()"
                  placeholder="your@email.com"
                  class="rounded-xl border-2 border-slate-100 p-4 font-bold focus:border-blue-500 outline-none transition-all disabled:bg-slate-50"
                />
              </div>
            </div>

            <!-- Password Section -->
            <div class="form-field flex flex-col gap-2 pt-6 border-t border-slate-50" *ngIf="isEditing()">
              <label class="text-sm font-bold text-slate-700 uppercase tracking-wider">New Password <span class="text-[10px] text-slate-300 ml-2">(Keep blank to stay unchanged)</span></label>
              <input
                type="password"
                [(ngModel)]="form.newPassword"
                placeholder="********"
                class="rounded-xl border-2 border-slate-100 p-4 font-bold focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <!-- Action Buttons -->
            <div class="action-row flex gap-4 pt-10" *ngIf="isEditing()">
              <button class="btn-save flex-1 py-4 !bg-blue-600 hover:!bg-blue-700 !text-white !font-black !rounded-xl transition-all !shadow-xl !shadow-blue-200" (click)="saveProfile()" [disabled]="saving()">
                {{ saving() ? 'Saving...' : 'Save Changes' }}
              </button>
              <button class="btn-cancel px-8 py-4 border-2 border-slate-100 !text-slate-400 !font-black !rounded-xl hover:bg-slate-50 transition-all" (click)="cancelEdit()">Cancel</button>
            </div>
          </div>
        </div>

        <div class="divider h-[1px] bg-slate-100"></div>

        <!-- Logout Section -->
        <div class="logout-section p-8 px-10 flex justify-between items-center bg-slate-50/50">
          <div>
            <p class="logout-title font-black text-slate-700">Dangerous Action</p>
            <p class="logout-desc text-xs font-medium text-slate-400">Terminate your current session and sign out.</p>
          </div>
          <button class="btn-logout bg-red-50 text-red-600 border-2 border-red-100 px-8 py-3 rounded-xl font-black uppercase text-xs hover:bg-red-100 transition-all shadow-sm" (click)="logout()">Sign Out</button>
        </div>

      </div>
    </div>
  `,
  styles: []
})
export class ProfileComponent implements OnInit {
  public authService = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);

  isEditing = signal(false);
  saving = signal(false);
  uploading = signal(false);
  successMsg = signal('');
  errorMsg = signal('');

  form = {
    name: '',
    email: '',
    newPassword: '',
    role: ''
  };

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      this.form.name = user.name;
      this.form.email = user.email;
      this.form.role = user.role;
    }
  }

  getPhotoUrl(): string {
    const photo = this.authService.currentUser()?.profilePhotoUrl;
    if (!photo) return '';
    if (photo.startsWith('http')) return photo;
    return `${environment.signalrUrl}/${photo}`;
  }

  getInitials(): string {
    const name = this.authService.currentUser()?.name || 'A';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  toggleEdit() {
    this.isEditing.set(true);
    this.successMsg.set('');
    this.errorMsg.set('');
  }

  cancelEdit() {
    const user = this.authService.currentUser();
    if (user) {
      this.form.name = user.name;
      this.form.email = user.email;
    }
    this.form.newPassword = '';
    this.isEditing.set(false);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.uploadImage(file);
    }
  }

  uploadImage(file: File) {
    if (this.form.role !== 'Doctor') {
      alert('Photo uploads are only available for Doctor accounts at this time.');
      return;
    }

    this.uploading.set(true);
    this.errorMsg.set('');
    
    const formData = new FormData();
    formData.append('file', file);

    this.http.post(`${environment.apiUrl}/account/profile/image`, formData).subscribe({
      next: (res: any) => {
        const current = this.authService.currentUser();
        if (current) {
          const updated: User = { ...current, profilePhotoUrl: res.imageUrl };
          sessionStorage.setItem('user', JSON.stringify(updated));
          this.authService.currentUser.set(updated);
        }
        this.uploading.set(false);
        this.successMsg.set('Photo updated successfully!');
      },
      error: (err) => {
        this.uploading.set(false);
        this.errorMsg.set(err.error?.message || 'Upload failed.');
      }
    });
  }

  saveProfile() {
    this.saving.set(true);
    const payload = {
      name: this.form.name,
      email: this.form.email,
      newPassword: this.form.newPassword
    };

    this.http.put(`${environment.apiUrl}/account/profile`, payload).subscribe({
      next: (res: any) => {
        const current = this.authService.currentUser();
        if (current) {
          const updated: User = { ...current, name: this.form.name, email: this.form.email };
          sessionStorage.setItem('user', JSON.stringify(updated));
          this.authService.currentUser.set(updated);
        }
        
        this.saving.set(false);
        this.isEditing.set(false);
        this.successMsg.set('Profile updated successfully!');
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMsg.set(err.error?.message || 'Update failed.');
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }
}
