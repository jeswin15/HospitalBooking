import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  public authService = inject(AuthService);
  private router = inject(Router);
  private location = inject(Location);

  todayDate = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' });
  currentUrl = '';

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentUrl = event.urlAfterRedirects;
    });
  }

  getPageTitle(): string {
    const url = this.currentUrl;
    if (url.includes('/admin/doctors')) return 'Medical Practitioners';
    if (url.includes('/admin/schedule')) return 'Department Sessions';
    if (url.includes('/admin/dashboard')) return 'System Analytics';
    
    if (url.includes('/patient/home')) return 'Personal Overview';
    if (url.includes('/patient/doctors')) return 'Discover Specialist';
    if (url.includes('/patient/appointments')) return 'Appointment History';
    if (url.includes('/patient/book')) return 'New Appointment Booking';
    if (url.includes('/patient/slots')) return 'Selection & Scheduling';
    
    if (url.includes('/doctor/dashboard')) return 'Live Operation Hub';
    if (url.includes('/doctor/requests')) return 'Inbound Enquiries';
    if (url.includes('/doctor/schedule')) return 'Availability Planner';
    if (url.includes('/doctor/settings')) return 'Clinical Parameters';

    if (url.includes('/profile')) return 'Account Preferences';
    if (url.includes('/auth')) return 'Identity Services';

    return 'Hospital Managed Care';
  }

  getInitials(): string {
    const name = this.authService.currentUser()?.name || 'A';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  goBack() {
    this.location.back();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }
}
