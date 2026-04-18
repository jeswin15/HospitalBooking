import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="getBadgeClass()" class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
      {{ status }}
    </span>
  `,
  styles: [`
    .badge-available { background: #ECFDF5; color: #059669; }
    .badge-pending { background: #FFFBEB; color: #D97706; }
    .badge-confirmed { background: #EFF6FF; color: #2563EB; }
    .badge-checkedin { background: #F5F3FF; color: #7C3AED; }
    .badge-inroom { background: #FDF2F8; color: #DB2777; }
    .badge-completed { background: #F0FDF4; color: #16A34A; }
    .badge-cancelled { background: #FEF2F2; color: #DC2626; }
    .badge-noshow { background: #F9FAFB; color: #4B5563; }
  `]
})
export class StatusBadgeComponent {
  @Input() status: string = 'Pending';

  getBadgeClass(): string {
    const s = this.status.toLowerCase().replace(/\s+/g, '');
    return `badge-${s}`;
  }
}
