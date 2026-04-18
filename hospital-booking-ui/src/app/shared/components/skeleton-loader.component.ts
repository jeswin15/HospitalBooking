import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [ngSwitch]="type" class="animate-pulse">
      <!-- Card Skeleton -->
      <div *ngSwitchCase="'card'" class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-12 h-12 bg-slate-200 rounded-2xl"></div>
          <div class="space-y-2 flex-1">
            <div class="h-4 bg-slate-200 rounded w-3/4"></div>
            <div class="h-3 bg-slate-200 rounded w-1/2"></div>
          </div>
        </div>
        <div class="h-24 bg-slate-100 rounded-2xl mb-4"></div>
        <div class="h-10 bg-slate-200 rounded-xl"></div>
      </div>

      <!-- Table Row Skeleton -->
      <div *ngSwitchCase="'table'" class="flex items-center gap-4 py-4 border-b border-slate-50">
        <div class="w-10 h-10 bg-slate-200 rounded-full"></div>
        <div class="h-4 bg-slate-200 rounded flex-1"></div>
        <div class="h-4 bg-slate-200 rounded w-24"></div>
        <div class="h-4 bg-slate-200 rounded w-16"></div>
      </div>

      <!-- Detail Skeleton -->
      <div *ngSwitchCase="'list'" class="space-y-4">
        <div class="h-4 bg-slate-200 rounded w-full"></div>
        <div class="h-4 bg-slate-200 rounded w-5/6"></div>
        <div class="h-4 bg-slate-200 rounded w-4/6"></div>
      </div>
    </div>
  `
})
export class SkeletonLoaderComponent {
  @Input() type: 'card' | 'table' | 'list' = 'card';
}
