import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

import { RoleRedirectComponent } from './role-redirect.component';

export const routes: Routes = [
  { path: '', component: RoleRedirectComponent },
  { path: 'auth', loadComponent: () => import('./auth/auth.component').then(m => m.AuthComponent) },
  { path: 'register', loadComponent: () => import('./patient/register/register.component').then(m => m.RegisterComponent) },
  
  {
    path: 'patient',
    canActivate: [authGuard],
    children: [
      { path: 'home', loadComponent: () => import('./patient/home/home.component').then(m => m.HomeComponent) },
      { path: 'book', redirectTo: 'doctors' },
      { path: 'doctors', loadComponent: () => import('./patient/all-doctors/all-doctors.component').then(m => m.AllDoctorsComponent) },
      { path: 'slots', loadComponent: () => import('./patient/slots/slots.component').then(m => m.SlotsComponent) },
      { path: 'appointments', loadComponent: () => import('./patient/history/history.component').then(m => m.HistoryComponent) }
    ]
  },
  
  {
    path: 'doctor',
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./doctor/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'appointments', loadComponent: () => import('./doctor/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'schedule', loadComponent: () => import('./doctor/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'history', loadComponent: () => import('./doctor/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'settings', loadComponent: () => import('./doctor/dashboard/dashboard.component').then(m => m.DashboardComponent) }
    ]
  },

  {
    path: 'admin',
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'doctors', loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'patients', loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'history', loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'settings', loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'schedule', loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.DashboardComponent) }
    ]
  },

  { path: 'profile', canActivate: [authGuard], loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent) },
  { path: '**', redirectTo: 'auth' }
];
