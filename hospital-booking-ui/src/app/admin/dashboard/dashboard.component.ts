import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  template: `
    <div class="fade-in space-y-8 pb-20">
      

      <!-- DASHBOARD VIEW -->
      <ng-container *ngIf="activeView() === 'dashboard'">
        <!-- Stats Widgets -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-primary/20 transition-all">
            <div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Appointments</p>
              <h4 class="text-3xl font-black text-slate-900 group-hover:text-primary transition-colors">{{ stats()?.todayAppointments ?? 0 }}</h4>
            </div>
            <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
            </div>
          </div>

          <div class="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Staff</p>
              <h4 class="text-3xl font-black text-slate-900">{{ stats()?.activeDoctors ?? 0 }}</h4>
            </div>
            <div class="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
          </div>

          <div class="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Network</p>
              <h4 class="text-3xl font-black text-slate-900">{{ stats()?.totalPatients ?? 0 }}</h4>
            </div>
            <div class="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Weekly Chart -->
          <div class="p-8 bg-white rounded-[32px] border border-slate-100 shadow-sm">
            <h5 class="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <div class="w-2 h-6 bg-primary rounded-full"></div>
              Weekly Appointment Flow
            </h5>
            <div class="h-[300px]">
              <canvas baseChart [data]="lineChartData" [options]="lineChartOptions" [type]="'line'"></canvas>
            </div>
          </div>

          <!-- Department Chart -->
          <div class="p-8 bg-white rounded-[32px] border border-slate-100 shadow-sm">
            <h5 class="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <div class="w-2 h-6 bg-indigo-500 rounded-full"></div>
              Departmental Distribution
            </h5>
            <div class="h-[300px]">
              <canvas baseChart [data]="barChartData" [options]="barChartOptions" [type]="'bar'"></canvas>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- DOCTORS VIEW -->
      <ng-container *ngIf="activeView() === 'doctors'">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h3 class="text-2xl font-black text-slate-900">Medical Professionals</h3>
            <p class="text-sm text-slate-500 font-medium">Manage and onboard clinical staff members.</p>
          </div>
          <button (click)="openOnboardModal()" class="btn-primary flex items-center gap-2 !px-8 !rounded-2xl shadow-lg shadow-primary/20">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
            Onboard New Doctor
          </button>
        </div>

        <div class="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div class="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center gap-4">
            <div class="flex-1 relative">
              <svg class="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" [(ngModel)]="searchQuery" placeholder="Search by name, email or specialization..." 
                     class="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium">
            </div>
          </div>
          <table class="w-full text-left">
            <thead>
              <tr class="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/30">
                <th class="px-8 py-4">Professional</th>
                <th class="px-8 py-4">Department</th>
                <th class="px-8 py-4">Expertise</th>
                <th class="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr *ngFor="let doc of filteredDoctors()" class="hover:bg-slate-50/50 transition-colors group">
                <td class="px-8 py-5">
                  <div class="flex items-center gap-4">
                    <div class="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                      {{ (doc.name || 'D').charAt(0) }}
                    </div>
                    <div>
                      <p class="font-black text-slate-900">{{ doc.name }}</p>
                      <p class="text-xs text-slate-500 font-medium">{{ doc.email }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-8 py-5">
                   <span class="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-tight">
                     {{ doc.department?.name || 'General' }}
                   </span>
                </td>
                <td class="px-8 py-5 font-medium text-slate-600 text-sm">
                  {{ doc.designation }} • {{ doc.experienceYears }} Years
                </td>
                <td class="px-8 py-5">
                  <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button (click)="openEditDoctorModal(doc)" class="p-2.5 bg-white border border-slate-100 text-blue-600 rounded-xl shadow-sm hover:shadow-md transition-all">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 00-2 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button (click)="deleteDoctor(doc.id)" class="p-2.5 bg-white border border-slate-100 text-rose-600 rounded-xl shadow-sm hover:shadow-md transition-all">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </ng-container>

      <!-- PATIENTS VIEW -->
      <ng-container *ngIf="activeView() === 'patients'">
          <div class="mb-8 flex justify-between items-center">
            <div>
              <h3 class="text-2xl font-black text-slate-900">Patient Directory</h3>
              <p class="text-sm text-slate-500 font-medium">Track registrations and healthcare engagement.</p>
            </div>
            <button (click)="router.navigate(['/register'])" class="btn-primary flex items-center gap-2 !px-8 !rounded-2xl shadow-lg shadow-primary/20">
               <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
               Add New Patient
            </button>
          </div>

         <div class="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <table class="w-full text-left">
              <thead>
                <tr class="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/30">
                  <th class="px-8 py-4">Patient Details</th>
                  <th class="px-8 py-4">Gender</th>
                  <th class="px-8 py-4">Engagement</th>
                  <th class="px-8 py-4">Last Visit</th>
                  <th class="px-8 py-4">Joined</th>
                  <th class="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr *ngFor="let p of patients()" class="hover:bg-slate-50/50 transition-colors group">
                  <td class="px-8 py-5">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center font-bold">
                        {{ p.fullName.charAt(0) }}
                      </div>
                      <div>
                        <p class="font-black text-slate-900">{{ p.fullName }}</p>
                        <p class="text-xs text-slate-500 font-medium">{{ p.email }} • {{ p.phone }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-8 py-5 text-sm font-medium text-slate-600">{{ p.gender }}</td>
                  <td class="px-8 py-5">
                     <span class="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                       {{ p.appointmentCount }} Appointments
                     </span>
                  </td>
                  <td class="px-8 py-5 text-sm font-medium text-slate-600">{{ p.lastAppointment || 'Never' }}</td>
                  <td class="px-8 py-5 text-sm text-slate-400 font-bold uppercase">{{ p.registeredAt }}</td>
                  <td class="px-8 py-5">
                    <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button (click)="impersonate(p)" class="p-2.5 bg-white border border-slate-100 text-indigo-600 rounded-xl shadow-sm hover:shadow-md transition-all" title="Access Patient Account">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </button>
                      <button (click)="openEditPatientModal(p)" class="p-2.5 bg-white border border-slate-100 text-blue-600 rounded-xl shadow-sm hover:shadow-md transition-all">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 00-2 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button (click)="deletePatient(p.id)" class="p-2.5 bg-white border border-slate-100 text-rose-600 rounded-xl shadow-sm hover:shadow-md transition-all">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
         </div>
      </ng-container>

      <!-- HISTORY VIEW -->
      <ng-container *ngIf="activeView() === 'history'">
         <div class="mb-8 flex justify-between items-center">
            <div>
              <h3 class="text-2xl font-black text-slate-900">Appointment Ledger</h3>
              <p class="text-sm text-slate-500 font-medium">Complete record of clinical engagements.</p>
            </div>
            <div class="flex items-center gap-3">
               <input type="date" class="form-input !py-2.5 !w-auto" [(ngModel)]="historyFilterDate">
               <button class="btn-primary !py-2.5" (click)="refreshHistory()">Apply Filter</button>
            </div>
         </div>

         <div class="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <table class="w-full text-left">
              <thead>
                <tr class="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/30">
                  <th class="px-8 py-4">Engagement ID</th>
                  <th class="px-8 py-4">Patient</th>
                  <th class="px-8 py-4">Medical Professional</th>
                  <th class="px-8 py-4">Date/Time</th>
                  <th class="px-8 py-4">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr *ngFor="let a of appointments()" class="hover:bg-slate-50/50 transition-colors">
                  <td class="px-8 py-5 font-bold text-slate-400 text-xs uppercase">#MB-{{ a.id }}</td>
                  <td class="px-8 py-5 font-black text-slate-900 text-sm">{{ a.patientName }}</td>
                  <td class="px-8 py-5 font-black text-primary text-sm">{{ a.doctorName }}</td>
                  <td class="px-8 py-5">
                    <p class="text-sm font-bold text-slate-700">{{ a.appointmentDate | date:'MMM dd, yyyy' }}</p>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-tight">{{ a.slotTime }}</p>
                  </td>
                  <td class="px-8 py-5">
                     <span [class]="'status-pill ' + a.status.toLowerCase()">{{ a.status }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <div *ngIf="appointments().length === 0" class="p-20 text-center">
               <p class="text-slate-400 font-bold">No appointment records found in the ledger.</p>
            </div>
         </div>
      </ng-container>

      <!-- SETTINGS VIEW -->
      <ng-container *ngIf="activeView() === 'settings'">
         <div class="mb-8">
            <h3 class="text-2xl font-black text-slate-900">System Parameters</h3>
            <p class="text-sm text-slate-500 font-medium">Global hospital and platform configuration.</p>
         </div>

         <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="p-8 bg-white rounded-[32px] border border-slate-100 shadow-sm space-y-6">
               <h4 class="text-lg font-black text-slate-900 border-b border-slate-50 pb-4">Departmental Master</h4>
               <div class="space-y-4">
                  <div *ngFor="let d of departments()" class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group transition-all hover:bg-white hover:shadow-md">
                     <span class="font-black text-slate-700">{{ d.name }}</span>
                     <button class="text-xs font-black text-rose-500 opacity-0 group-hover:opacity-100 uppercase tracking-widest">Remove</button>
                  </div>
                  <div class="pt-4 flex gap-2">
                     <input type="text" [(ngModel)]="newDeptName" placeholder="New Department..." class="form-input !py-3 flex-1">
                     <button (click)="addDepartment()" class="btn-primary !px-5 !py-3 !rounded-xl">Add</button>
                  </div>
               </div>
            </div>

            <div class="p-8 bg-white rounded-[32px] border border-slate-100 shadow-sm space-y-6">
               <h4 class="text-lg font-black text-slate-900 border-b border-slate-50 pb-4">Platform General</h4>
               <div class="space-y-4">
                  <div class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                     <span class="font-bold text-slate-600">Video Consultation</span>
                     <div class="w-12 h-6 bg-emerald-500 rounded-full relative p-1"><div class="w-4 h-4 bg-white rounded-full absolute right-1"></div></div>
                  </div>
                  <div class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                     <span class="font-bold text-slate-600">SMS Reminders</span>
                     <div class="w-12 h-6 bg-slate-300 rounded-full relative p-1"><div class="w-4 h-4 bg-white rounded-full absolute left-1"></div></div>
                  </div>
                  <div class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                     <span class="font-bold text-slate-600">Payment Gateway</span>
                     <span class="text-xs font-black text-primary uppercase">Active: Cash</span>
                  </div>
               </div>
            </div>
          </div>
       </ng-container>

       <!-- SESSIONS VIEW -->
       <ng-container *ngIf="activeView() === 'schedule'">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             <div *ngFor="let dept of departments()" class="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group">
                <div class="flex items-center justify-between mb-8">
                   <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold text-xl">
                      🏛️
                   </div>
                   <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Department</span>
                </div>
                <h4 class="text-xl font-black text-slate-800 mb-2">{{ dept.name }}</h4>
                <div class="flex items-center gap-4 text-xs font-bold text-slate-500">
                   <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> {{ dept.doctorCount }} Active</span>
                   <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Live Queue</span>
                </div>
                
                <div class="mt-8 pt-8 border-t border-slate-50">
                   <button (click)="activeView.set('doctors')" class="w-full py-3 bg-slate-50 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">
                      Manage Department
                   </button>
                </div>
             </div>
          </div>
       </ng-container>
    </div>

    <!-- ONBOARD / EDIT MODAL -->
    <div *ngIf="showModal" class="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12 overflow-hidden">
       <!-- Backdrop with intense blur -->
       <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md" (click)="closeModal()"></div>
       
       <div class="bg-white/95 w-full max-w-4xl max-h-[90vh] rounded-[48px] shadow-2xl z-10 flex flex-col relative fade-in border border-white/20 backdrop-blur-2xl">
          
          <!-- Modal Header (Fixed) -->
          <div class="p-10 pb-6 flex justify-between items-center border-b border-slate-50">
             <div>
                <h3 class="text-3xl font-black text-slate-900 tracking-tight">{{ isEditMode ? 'Update Professional' : 'Onboard New Doctor' }}</h3>
                <p class="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">Platform Enrollment & Credentialing</p>
             </div>
             <button (click)="closeModal()" class="group w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-90">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l18 18" /></svg>
             </button>
          </div>

          <!-- Modal Body (Scrollable) -->
          <div class="p-10 overflow-y-auto custom-scrollbar flex-1">
             
             <!-- Feedback Alerts -->
             <div *ngIf="errorMsg" class="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-4 text-rose-600 animate-shake">
                <svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span class="text-sm font-black">{{ errorMsg }}</span>
             </div>

             <form (ngSubmit)="saveDoctor()" class="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                
                <!-- Section: Personal -->
                <div class="md:col-span-2 flex items-center gap-4 mb-2">
                   <div class="h-[1px] flex-1 bg-slate-100"></div>
                   <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Basic Identity</h4>
                   <div class="h-[1px] flex-1 bg-slate-100"></div>
                </div>

                <div class="space-y-3 md:col-span-2">
                   <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Full Professional Name</label>
                   <div class="relative group">
                      <div class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                      <input [(ngModel)]="currentDoc.name" name="name" required class="form-input-premium !pl-12" placeholder="Dr. Sarah Johnson">
                   </div>
                </div>

                <div class="space-y-3">
                   <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Institutional Email</label>
                   <input [(ngModel)]="currentDoc.email" name="email" type="email" required class="form-input-premium" placeholder="sarah.j@appointmed.com">
                </div>

                <div class="space-y-3">
                   <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mobile Contact</label>
                   <input [(ngModel)]="currentDoc.phone" name="phone" required class="form-input-premium" placeholder="+91 98765 43210">
                </div>

                <!-- Section: Professional -->
                <div class="md:col-span-2 flex items-center gap-4 mt-4 mb-2">
                   <div class="h-[1px] flex-1 bg-slate-100"></div>
                   <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Clinical Profiling</h4>
                   <div class="h-[1px] flex-1 bg-slate-100"></div>
                </div>

                <div class="space-y-3">
                   <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Medical Department</label>
                   <select [(ngModel)]="currentDoc.departmentId" name="departmentId" required class="form-input-premium appearance-none">
                      <option [value]="0" disabled>Select Department</option>
                      <option *ngFor="let d of departments()" [value]="d.id">{{ d.name }}</option>
                   </select>
                </div>

                <div class="space-y-3">
                   <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Current Designation</label>
                   <input [(ngModel)]="currentDoc.designation" name="designation" required class="form-input-premium" placeholder="Senior Cardiologist">
                </div>

                <div class="space-y-3">
                   <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Professional Qualification</label>
                   <input [(ngModel)]="currentDoc.qualification" name="qualification" required class="form-input-premium" placeholder="MBBS, MD, DM">
                </div>

                <div class="space-y-3">
                   <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Clinical Experience (Yrs)</label>
                   <input [(ngModel)]="currentDoc.experienceYears" name="experienceYears" type="number" required class="form-input-premium">
                </div>

                <div class="space-y-3 md:col-span-2 mt-4">
                   <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Clinical Bio / Summary</label>
                   <textarea [(ngModel)]="currentDoc.bio" name="bio" rows="3" class="form-input-premium !py-4" placeholder="Briefly describe background, special interests and achievements..."></textarea>
                </div>
                
                <!-- Submit Area -->
                <div class="md:col-span-2 pt-10 sticky bottom-0 bg-white/50 backdrop-blur-md -mx-10 px-10 pb-2">
                   <button type="submit" [disabled]="loading" class="w-full h-16 bg-slate-900 text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-primary hover:shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-50 disabled:grayscale">
                      <span *ngIf="loading" class="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></span>
                      {{ isEditMode ? 'Commit Identity Updates' : 'Initialize Clinical Onboarding' }}
                      <svg *ngIf="!loading" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                   </button>
                </div>
             </form>
          </div>
       </div>
    </div>

    <!-- PATIENT MODAL -->
    <div *ngIf="showPatientModal()" class="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12 overflow-hidden">
       <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md" (click)="closePatientModal()"></div>
       <div class="bg-white/95 w-full max-w-2xl rounded-[40px] shadow-2xl z-10 flex flex-col relative fade-in border border-white/20 backdrop-blur-2xl">
          <div class="p-10 pb-6 flex justify-between items-center border-b border-slate-50">
             <div>
                <h3 class="text-2xl font-black text-slate-900 tracking-tight">{{ isPatientEditMode() ? 'Edit Profile' : 'Register Patient' }}</h3>
                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">Clinical Master Record</p>
             </div>
             <button (click)="closePatientModal()" class="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l18 18" /></svg>
             </button>
          </div>
          <div class="p-10 overflow-y-auto">
             <form (ngSubmit)="savePatient()" class="space-y-6">
                <div class="space-y-2">
                   <label class="text-[10px] font-black text-slate-400 uppercase px-1">Full Legal Name</label>
                   <input [(ngModel)]="currentPatient().fullName" name="fullName" required class="form-input-premium" placeholder="John Doe">
                </div>
                <div class="grid grid-cols-2 gap-6">
                   <div class="space-y-2">
                      <label class="text-[10px] font-black text-slate-400 uppercase px-1">Email Address</label>
                      <input [(ngModel)]="currentPatient().email" name="email" type="email" required class="form-input-premium" placeholder="john@example.com">
                   </div>
                   <div class="space-y-2">
                      <label class="text-[10px] font-black text-slate-400 uppercase px-1">Phone Number</label>
                      <input [(ngModel)]="currentPatient().phone" name="phone" required class="form-input-premium" placeholder="+91 98765 43210">
                   </div>
                </div>
                <div class="space-y-2">
                   <label class="text-[10px] font-black text-slate-400 uppercase px-1">Gender Identification</label>
                   <select [(ngModel)]="currentPatient().gender" name="gender" class="form-input-premium">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                   </select>
                </div>
                <button type="submit" class="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-primary transition-all shadow-xl shadow-slate-200">
                   {{ isPatientEditMode() ? 'Save Identity Updates' : 'Initialize Registration' }}
                </button>
             </form>
          </div>
       </div>
    </div>

    <!-- ADMIN BOOKING MODAL -->
    <div *ngIf="showBookingModal()" class="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12 overflow-hidden">
       <div class="absolute inset-0 bg-indigo-900/60 backdrop-blur-md" (click)="closeBookingModal()"></div>
       <div class="bg-white w-full max-w-4xl max-h-[90vh] rounded-[48px] shadow-2xl z-10 flex flex-col relative fade-in">
          <div class="p-10 border-b border-slate-50 flex justify-between items-center">
             <div class="flex items-center gap-6">
                <div class="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center font-black text-xl shadow-inner shadow-indigo-100/50">
                  {{ selectedPatient()?.fullName?.charAt(0) }}
                </div>
                <div>
                   <h3 class="text-3xl font-black text-slate-900 tracking-tight">Schedule Consultation</h3>
                   <p class="text-xs text-indigo-500 font-bold uppercase tracking-widest mt-1">Booking for {{ selectedPatient()?.fullName }}</p>
                </div>
             </div>
             <button (click)="closeBookingModal()" class="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l18 18" /></svg>
             </button>
          </div>

          <div class="p-10 overflow-y-auto flex-1 custom-scrollbar space-y-10">
             <div class="grid grid-cols-2 gap-10">
                <!-- Step 1: Select Doctor -->
                <div class="space-y-4">
                   <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">1. Select Medical Professional</label>
                   <div class="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      <div *ngFor="let doc of doctors()" 
                           (click)="selectedDoctor.set(doc); fetchSlots()"
                           [class]="selectedDoctor()?.id === doc.id ? 'border-primary bg-blue-50/50 shadow-md' : 'border-slate-100 hover:border-slate-200 bg-slate-50/30'"
                           class="p-4 border-2 rounded-2xl cursor-pointer transition-all flex items-center gap-4">
                         <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-bold text-slate-400 border border-slate-100 shadow-sm">
                            {{ doc.name.charAt(0) }}
                         </div>
                         <div class="flex-1">
                            <p class="font-black text-slate-900 text-sm">{{ doc.name }}</p>
                            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{{ doc.department?.name }}</p>
                         </div>
                         <div *ngIf="selectedDoctor()?.id === doc.id" class="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
                         </div>
                      </div>
                   </div>
                </div>

                <!-- Step 2: Select Date & Reason -->
                <div class="space-y-8 text-center pt-8">
                   <div *ngIf="!selectedDoctor()" class="h-full flex flex-col items-center justify-center text-slate-300 space-y-4 bg-slate-50/30 rounded-[32px] border-2 border-dashed border-slate-100">
                      <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      <p class="font-black uppercase tracking-widest text-[10px]">Select a doctor to continue</p>
                   </div>
                   <div *ngIf="selectedDoctor()" class="space-y-3">
                      <div class="space-y-3">
                         <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-left">2. Select Consultation Date</label>
                         <input type="date" [ngModel]="selectedDate()" (ngModelChange)="selectedDate.set($event); fetchSlots()" 
                                class="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary focus:bg-white outline-none transition-all font-black text-slate-800">
                      </div>
                      <div class="space-y-3">
                         <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-left">3. Clinical Note / Reason</label>
                         <textarea [ngModel]="bookingReason()" (ngModelChange)="bookingReason.set($event)" rows="3" class="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary focus:bg-white transition-all font-bold text-slate-800" placeholder="Note for the doctor..."></textarea>
                      </div>
                   </div>
                </div>
             </div>

             <!-- Step 3: Slots / Tokens Selection -->
             <div *ngIf="selectedDoctor() && selectedDate()" class="pt-10 border-t border-slate-50">
                <div class="flex items-center justify-between mb-8">
                   <h5 class="text-sm font-black text-slate-900 uppercase tracking-widest">Available Clinical Tokens</h5>
                   <span class="text-xs font-bold text-indigo-500 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100">Mode: {{ selectedDoctor().bookingMode }}</span>
                </div>
                
                <div class="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                   <button *ngFor="let token of availableTokens()" 
                           [disabled]="token.status !== 'Available'"
                           (click)="confirmAdminBooking(token)"
                           [class]="token.status === 'Available' ? 'bg-white border-2 border-slate-100 hover:border-primary hover:text-primary hover:-translate-y-1 shadow-sm' : 'bg-slate-50 text-slate-200 border-slate-50 mix-blend-multiply grayscale'"
                           class="h-16 rounded-2xl flex flex-col items-center justify-center transition-all disabled:cursor-not-allowed">
                      <span class="text-lg font-black tracking-tight">#{{ token.tokenNumber }}</span>
                      <span class="text-[8px] font-black uppercase tracking-tight opacity-50">{{ token.slotTime }}</span>
                   </button>
                   <div *ngIf="availableTokens().length === 0" class="col-span-full py-20 text-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-100">
                      <p class="text-slate-400 font-bold">No availability found for the selected parameters.</p>
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  `,
  styles: [`
    .form-input { @apply w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-medium text-slate-900; }
    .form-input-premium { @apply w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white focus:border-primary transition-all font-bold text-slate-800 shadow-sm placeholder:text-slate-300; }
    
    .status-pill { @apply px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest; }
    .status-pill.available { @apply bg-emerald-50 text-emerald-600; }
    .status-pill.booked { @apply bg-blue-50 text-blue-600; }
    .status-pill.noshow { @apply bg-rose-50 text-rose-500; }
    .status-pill.cancelled { @apply bg-slate-100 text-slate-400; }
    
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }

    .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
    @keyframes shake {
      10%, 90% { transform: translate3d(-1px, 0, 0); }
      20%, 80% { transform: translate3d(2px, 0, 0); }
      30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
      40%, 60% { transform: translate3d(4px, 0, 0); }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  public router = inject(Router);
  public authService = inject(AuthService); 
  
  activeView = signal('dashboard');
  stats = signal<any>(null);
  doctors = signal<any[]>([]);
  patients = signal<any[]>([]);
  appointments = signal<any[]>([]);
  departments = signal<any[]>([]);
  
  showModal = false;
  isEditMode = false;
  loading = false;
  searchQuery = '';
  historyFilterDate = '';
  errorMsg = '';
  
  currentDoc: any = this.resetDoc();

  // Patient Management State
  showPatientModal = signal(false);
  isPatientEditMode = signal(false);
  currentPatient = signal<any>(this.resetPatient());

  // Admin Booking State
  showBookingModal = signal(false);
  selectedPatient = signal<any>(null);
  selectedDoctor = signal<any>(null);
  selectedDate = signal<string>('');
  availableTokens = signal<any[]>([]);
  bookingReason = signal<string>('');
  
  // Charts Config
  lineChartData: ChartData<'line'> = { labels: [], datasets: [{ data: [], label: 'Daily Flow', borderColor: '#2563EB', backgroundColor: 'rgba(37, 99, 235, 0.1)', fill: true, tension: 0.4 }] };
  lineChartOptions: ChartConfiguration['options'] = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.02)' } }, x: { grid: { display: false } } } };

  barChartData: ChartData<'bar'> = { labels: [], datasets: [{ data: [], label: 'Volume', backgroundColor: '#6366F1', borderRadius: 8 }] };
  barChartOptions: ChartConfiguration['options'] = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.02)' } }, x: { grid: { display: false } } } };

  ngOnInit() {
    this.syncViewFromUrl(this.router.url);
    this.router.events.pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => this.syncViewFromUrl(e.urlAfterRedirects));
    this.refreshData();
  }

  private syncViewFromUrl(url: string) {
    if (url.includes('/admin/doctors')) this.activeView.set('doctors');
    else if (url.includes('/admin/patients')) this.activeView.set('patients');
    else if (url.includes('/admin/history')) this.activeView.set('history');
    else if (url.includes('/admin/settings')) this.activeView.set('settings');
    else if (url.includes('/admin/schedule')) this.activeView.set('schedule');
    else this.activeView.set('dashboard');
  }

  refreshData() {
    this.http.get<any>(`${environment.apiUrl}/admin/stats`).subscribe(data => {
      this.stats.set(data);
      this.syncCharts(data);
    });
    this.http.get<any[]>(`${environment.apiUrl}/admin/doctors`).subscribe(data => this.doctors.set(data));
    this.http.get<any[]>(`${environment.apiUrl}/admin/patients`).subscribe(data => this.patients.set(data));
    this.http.get<any[]>(`${environment.apiUrl}/admin/departments`).subscribe(data => this.departments.set(data));
    this.refreshHistory();
  }

  refreshHistory() {
    this.http.get<any[]>(`${environment.apiUrl}/admin/appointments`).subscribe(data => this.appointments.set(data));
  }

  private syncCharts(stats: any) {
    if (!stats) return;
    this.lineChartData = {
      labels: stats.weeklyAppointments.map((a: any) => new Date(a.date).toLocaleDateString('en-US', { weekday: 'short' })),
      datasets: [{ ...this.lineChartData.datasets[0], data: stats.weeklyAppointments.map((a: any) => a.count) }]
    };
    this.barChartData = {
      labels: stats.deptAppointments.map((d: any) => d.name),
      datasets: [{ ...this.barChartData.datasets[0], data: stats.deptAppointments.map((d: any) => d.count) }]
    };
  }

  filteredDoctors() {
    if (!this.searchQuery) return this.doctors();
    const query = this.searchQuery.toLowerCase();
    return this.doctors().filter(d => 
      d.name.toLowerCase().includes(query) || 
      d.email.toLowerCase().includes(query) ||
      d.department?.name?.toLowerCase().includes(query)
    );
  }

  openOnboardModal() {
    this.isEditMode = false;
    this.currentDoc = this.resetDoc();
    this.showModal = true;
  }

  openEditDoctorModal(doc: any) {
    this.isEditMode = true;
    this.currentDoc = { ...doc };
    this.showModal = true;
  }

  closeModal() { this.showModal = false; }

  saveDoctor() {
    this.loading = true;
    this.errorMsg = '';

    const obs = this.isEditMode 
      ? this.http.put(`${environment.apiUrl}/admin/doctors/${this.currentDoc.id}`, this.currentDoc)
      : this.http.post(`${environment.apiUrl}/admin/doctors`, this.currentDoc);

    obs.subscribe({
      next: () => {
        this.loading = false;
        this.showModal = false;
        this.searchQuery = ''; // Clear search so the new doctor is visible
        this.refreshData();
        // Simple visual confirmation
        alert(this.isEditMode ? 'Doctor record updated successfully.' : 'New medical professional successfully onboarded.');
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'Technical failure during onboarding. Please verify credentials.';
      }
    });
  }

  newDeptName = '';

  addDepartment() {
    if (!this.newDeptName.trim()) return;
    this.http.post(`${environment.apiUrl}/admin/departments`, { name: this.newDeptName }).subscribe(() => {
      this.newDeptName = '';
      this.refreshData();
    });
  }

  deleteDoctor(id: number) {
    if (!confirm('Are you sure you want to remove this medical professional?')) return;
    this.http.delete(`${environment.apiUrl}/admin/doctors/${id}`).subscribe(() => this.refreshData());
  }

  private resetDoc() {
    return { name: '', email: '', phone: '', departmentId: 0, designation: '', qualification: '', experienceYears: 0, bio: '' };
  }

  // --- PATIENT MANAGEMENT ---

  openPatientModal() {
    this.isPatientEditMode.set(false);
    this.currentPatient.set(this.resetPatient());
    this.showPatientModal.set(true);
  }

  openEditPatientModal(patient: any) {
    this.isPatientEditMode.set(true);
    this.currentPatient.set({ ...patient });
    this.showPatientModal.set(true);
  }

  closePatientModal() { this.showPatientModal.set(false); }

  savePatient() {
    this.loading = true;
    this.errorMsg = '';
    const patientData = this.currentPatient();
    
    // Normalize properties for DTO
    const payload = {
        fullName: patientData.fullName,
        email: patientData.email,
        phone: patientData.phone,
        gender: patientData.gender
    };

    const obs = this.isPatientEditMode()
      ? this.http.put(`${environment.apiUrl}/admin/patients/${patientData.id}`, payload)
      : this.http.post(`${environment.apiUrl}/admin/patients`, payload);

    obs.subscribe({
      next: () => {
        this.loading = false;
        this.showPatientModal.set(false);
        this.refreshData();
        alert(this.isPatientEditMode() ? 'Patient record updated.' : 'New patient registered successfully.');
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'Failed to save patient. Please check details.';
      }
    });
  }

  deletePatient(id: number) {
    if (!confirm('Are you sure you want to remove this patient record?')) return;
    this.http.delete(`${environment.apiUrl}/admin/patients/${id}`).subscribe(() => this.refreshData());
  }

  private resetPatient() {
    return { fullName: '', email: '', phone: '', gender: 'Male' };
  }

  // --- ADMIN BOOKING ---

  impersonate(p: any) {
    this.loading = true;
    this.authService.impersonatePatient(p.id).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/patient/home']);
      },
      error: (err: any) => {
        this.loading = false;
        alert(err.error?.message || 'Impersonation failed.');
      }
    });
  }

  openBookingModal(patient: any) {
    this.selectedPatient.set(patient);
    this.selectedDoctor.set(null);
    this.selectedDate.set('');
    this.availableTokens.set([]);
    this.bookingReason.set('');
    this.showBookingModal.set(true);
  }

  closeBookingModal() { this.showBookingModal.set(false); }

  fetchSlots() {
    if (!this.selectedDoctor() || !this.selectedDate()) return;
    this.http.get<any[]>(`${environment.apiUrl}/patient/appointments/slots/${this.selectedDoctor().id}?date=${this.selectedDate()}`)
      .subscribe(slots => this.availableTokens.set(slots));
  }

  confirmAdminBooking(token: any) {
    if (!confirm(`Book Token #${token.tokenNumber} for ${this.selectedPatient().fullName}?`)) return;
    
    const payload = {
        patientId: this.selectedPatient().id,
        doctorId: this.selectedDoctor().id,
        date: this.selectedDate(),
        tokenNumber: token.tokenNumber,
        reasonForVisit: this.bookingReason() || 'Administrative Booking'
    };

    this.http.post(`${environment.apiUrl}/admin/appointments/book`, payload).subscribe({
      next: () => {
        this.showBookingModal.set(false);
        this.refreshData();
        alert('Appointment successfully booked by administrator.');
      },
      error: (err) => alert(err.error?.message || 'Booking failed. Slot may have been taken.')
    });
  }
}
