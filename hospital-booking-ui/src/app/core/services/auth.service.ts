import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  profilePhotoUrl?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl + '/auth';
  
  // State management using Signals
  currentUser = signal<User | null>(this.getUserFromStorage());
  isAuthenticated = signal<boolean>(!!this.getUserFromStorage());
  isImpersonating = signal<boolean>(!!sessionStorage.getItem('admin_session_backup'));

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: any, role: 'admin' | 'doctor' | 'patient'): Observable<AuthResponse> {
    return this.http.post<any>(`${this.apiUrl}/${role}/login`, credentials).pipe(
      tap((res: any) => {
        const userObj = res.user || res.User || {};
        const token = res.token || res.Token;
        
        // Force normalization based on context
        let normalizedRole = 'Patient';
        if (role === 'admin') normalizedRole = 'Admin';
        else if (role === 'doctor') normalizedRole = 'Doctor';
        
        const normalizedUser: User = {
          id: userObj.id || userObj.Id || 0,
          name: userObj.name || userObj.Name || 'User',
          email: userObj.email || userObj.Email || '',
          role: normalizedRole,
          profilePhotoUrl: userObj.profilePhotoUrl || userObj.ProfilePhotoUrl || ''
        };

        sessionStorage.setItem('auth_token', token);
        sessionStorage.setItem('user', JSON.stringify(normalizedUser));
        this.currentUser.set(normalizedUser);
        this.isAuthenticated.set(true);
      })
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/patient/register`, userData);
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  logout() {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('admin_session_backup');
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.isImpersonating.set(false);
  }

  impersonatePatient(patientId: number): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/admin/impersonate/${patientId}`, {}).pipe(
      tap(res => {
        // Backup Admin Session
        const adminToken = sessionStorage.getItem('auth_token');
        const adminUser = sessionStorage.getItem('user');
        if (adminToken && adminUser) {
          sessionStorage.setItem('admin_session_backup', JSON.stringify({ token: adminToken, user: adminUser }));
        }

        // Apply Patient Session
        sessionStorage.setItem('auth_token', res.token);
        sessionStorage.setItem('user', JSON.stringify(res.user));
        
        this.currentUser.set(res.user);
        this.isAuthenticated.set(true);
        this.isImpersonating.set(true);
      })
    );
  }

  stopImpersonation() {
    const backup = sessionStorage.getItem('admin_session_backup');
    if (backup) {
      const { token, user } = JSON.parse(backup);
      sessionStorage.setItem('auth_token', token);
      sessionStorage.setItem('user', user);
      sessionStorage.removeItem('admin_session_backup');
      
      this.currentUser.set(JSON.parse(user));
      this.isImpersonating.set(false);
      this.router.navigate(['/admin/dashboard']);
    }
  }

  getToken(): string | null {
    return sessionStorage.getItem('auth_token');
  }

  isAdmin(): boolean {
    const role = this.currentUser()?.role;
    return role === 'Admin';
  }

  isDoctor(): boolean {
    const role = this.currentUser()?.role;
    return role === 'Doctor';
  }

  isPatient(): boolean {
    const role = this.currentUser()?.role;
    return role === 'Patient';
  }

  private getUserFromStorage(): User | null {
    const data = sessionStorage.getItem('user');
    if (!data) return null;
    try {
      const user = JSON.parse(data);
      // Ensure role is normalized even for old storage
      const r = (user.role || '').toLowerCase();
      if (r.includes('admin') || r.includes('staff') || r.includes('super')) user.role = 'Admin';
      else if (r.includes('doctor')) user.role = 'Doctor';
      else user.role = 'Patient';
      return user;
    } catch {
      return null;
    }
  }
}
