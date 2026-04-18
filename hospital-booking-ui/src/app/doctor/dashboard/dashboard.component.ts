import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { SignalrService } from '../../core/services/signalr.service';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fade-in space-y-8 pb-20">
      
      <!-- SATURDAY PLANNING REMINDER -->
      @if (showSaturdayReminder()) {
        <div class="panel !p-0 overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 border-none shadow-2xl shadow-blue-200">
           <div class="p-8 flex items-center justify-between gap-8 flex-wrap">
              <div class="flex items-center gap-6">
                 <div class="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white text-3xl shadow-inner">
                    📅
                 </div>
                 <div class="text-white">
                    <h3 class="text-2xl font-black tracking-tight">Time to Plan Your Week! 🗓️</h3>
                    <p class="text-blue-100 font-medium max-w-lg mt-1 opacity-90">It's Saturday! Please update your availability for next week to ensure patients can find and book appointments with you.</p>
                 </div>
              </div>
              <button (click)="activeView.set('schedule')" class="px-8 py-4 bg-white text-blue-700 font-black rounded-2xl text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl active:scale-95">
                 Update Availability Now
              </button>
           </div>
        </div>
      }

      <!-- DOCTOR NAVIGATION TABS -->
      <div class="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-fit mb-8 overflow-x-auto max-w-full no-scrollbar">
        <button (click)="activeView.set('queue')" 
                [class]="activeView() === 'queue' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'"
                class="px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap">
           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           Live Queue
        </button>
        <button (click)="activeView.set('requests')" 
                [class]="activeView() === 'requests' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'"
                class="px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap">
           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
           Requests (@if(pending().length > 0){ <span class="badge">{{ pending().length }}</span> })
        </button>
        <button (click)="activeView.set('upcoming')" 
                [class]="activeView() === 'upcoming' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'"
                class="px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap">
           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
           Upcoming
        </button>
        <button (click)="activeView.set('history')" 
                [class]="activeView() === 'history' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'"
                class="px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap">
           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 002-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
           Consulted
        </button>
        <button (click)="activeView.set('schedule')" 
                [class]="activeView() === 'schedule' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'"
                class="px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap">
           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
           Availability
        </button>
        <button (click)="activeView.set('settings')" 
                [class]="activeView() === 'settings' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'"
                class="px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap">
           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
           Parameters
        </button>
      </div>

      <!-- VIEW: QUEUE -->
      @if (activeView() === 'queue') {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="widget-card">
            <div class="flex flex-col">
              <span class="w-val">{{ scheduled().length }}</span>
              <span class="w-label">Active Appointments</span>
            </div>
            <div class="w-icon-box bg-blue-50 text-blue-600 border-blue-100">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
          </div>
          <div class="widget-card">
            <div class="flex flex-col">
              <span class="w-val">{{ pending().length }}</span>
              <span class="w-label">Pending Requests</span>
            </div>
            <div class="w-icon-box bg-amber-50 text-amber-600 border-amber-100">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <!-- Patient Queue -->
          <div class="lg:col-span-2 space-y-6">
            <h3 class="text-xl font-black text-slate-800 flex items-center">
              <span class="w-2.5 h-8 bg-blue-600 rounded-full mr-4 shadow-sm shadow-blue-500/50"></span>
              Live Consultation Queue
            </h3>
            <div class="panel !p-0 overflow-hidden shadow-xl shadow-slate-200/50 border-none">
              <table class="modern-table w-full">
                <thead>
                  <tr class="bg-slate-50">
                    <th class="px-6 py-4 text-left font-black text-[10px] uppercase tracking-widest text-slate-400">Token</th>
                    <th class="px-6 py-4 text-left font-black text-[10px] uppercase tracking-widest text-slate-400">Patient</th>
                    <th class="px-6 py-4 text-left font-black text-[10px] uppercase tracking-widest text-slate-400">Status</th>
                    <th class="px-6 py-4 text-center font-black text-[10px] uppercase tracking-widest text-slate-400">Action</th>
                  </tr>
                </thead>
                <tbody>
                  @for (p of scheduled(); track p.id) {
                    <tr [class.bg-blue-50/30]="p.status === 'InRoom'" class="border-t border-slate-50 transition-colors">
                      <td class="px-6 py-5 font-black text-lg text-blue-600 tracking-tighter">#{{ p.tokenNumber }}</td>
                      <td class="px-6 py-5">
                        <div class="font-extrabold text-slate-800 leading-none">{{ p.patient?.fullName || 'Unknown' }}</div>
                        <div class="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1.5">{{ p.slotTime }} • {{ p.reasonForVisit }}</div>
                      </td>
                      <td class="px-6 py-5">
                        @if (p.status === 'InRoom') {
                          <span class="inline-flex items-center gap-1.5 text-blue-600 font-black text-[10px] uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                             Consulting
                          </span>
                        } @else {
                          <span class="inline-flex items-center gap-1.5 text-amber-500 font-black text-[10px] uppercase tracking-widest bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">Waiting</span>
                        }
                      </td>
                      <td class="px-6 py-5 text-center">
                        @if (p.status === 'Confirmed') {
                          <button (click)="updateStatus(p.id, 'InRoom')" class="btn-primary !py-2 !px-4 !text-[10px] !font-black !rounded-xl shadow-lg shadow-blue-200">CALL IN</button>
                        } @else if (p.status === 'InRoom') {
                          <button (click)="updateStatus(p.id, 'Completed')" class="!bg-emerald-600 !text-white !py-2 !px-4 !text-[10px] !font-black !rounded-xl shadow-lg shadow-emerald-200">FINISH</button>
                        } @else {
                          <span class="text-emerald-500"><svg class="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg></span>
                        }
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="4" class="px-6 py-20 text-center font-bold text-slate-300">No patients in queue currently.</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- Consultation Hub -->
          <div class="space-y-8">
            <div class="panel bg-slate-900 text-white !p-10 relative overflow-hidden shadow-2xl shadow-slate-900/30 rounded-3xl">
               <div class="absolute top-0 right-0 w-48 h-48 bg-blue-600/20 rounded-full -mr-20 -mt-20 blur-3xl"></div>
               <div class="relative z-10 space-y-8 text-center">
                 <div class="space-y-2">
                   <h3 class="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Currently Consulting</h3>
                   <p class="text-6xl font-black tracking-tighter text-white">#{{ currentToken() || '--' }}</p>
                 </div>
                 <div class="flex flex-col gap-3">
                   <button (click)="openActivePrescription()" [disabled]="!isConsulting()" class="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-900/40 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:bg-slate-700 disabled:text-slate-500 disabled:shadow-none">
                     Issue Prescription
                   </button>
                 </div>
               </div>
            </div>
            
            <div class="panel !p-10 rounded-3xl shadow-xl shadow-slate-200/50">
               <h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 mb-8">Next Patient</h3>
               @if (nextPatient()) {
                 <div class="flex items-start gap-4">
                   <div class="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 font-black text-xl border-2 border-slate-100">
                     #{{ nextPatient().tokenNumber }}
                   </div>
                   <div class="flex-1">
                     <p class="text-lg font-black text-slate-800 tracking-tight leading-none">{{ nextPatient().patient?.fullName }}</p>
                     <p class="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-2">{{ nextPatient().reasonForVisit }}</p>
                   </div>
                 </div>
               } @else {
                 <p class="text-slate-300 font-bold">No upcoming patients.</p>
               }
            </div>
          </div>
        </div>
      }

      <!-- VIEW: REQUESTS -->
      @if (activeView() === 'requests') {
        <div class="space-y-6">
          <h3 class="text-2xl font-black text-slate-800">Pending Requests</h3>
          <div class="panel !p-0 shadow-xl shadow-slate-200/50 overflow-hidden border-none rounded-3xl">
             <table class="modern-table w-full">
               <thead>
                 <tr class="bg-slate-50">
                   <th class="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Date / Time</th>
                   <th class="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Patient Details</th>
                   <th class="px-8 py-5 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Actions</th>
                 </tr>
               </thead>
               <tbody>
                  @for (r of pending(); track r.id) {
                    <tr class="border-t border-slate-50">
                      <td class="px-8 py-6">
                        <div class="font-extrabold text-slate-800">{{ r.appointmentDate | date:'mediumDate' }}</div>
                        <div class="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">{{ r.slotTime || 'Online' }}</div>
                      </td>
                      <td class="px-8 py-6">
                        <div class="font-black text-slate-800">{{ r.patient?.fullName }}</div>
                        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{{ r.reasonForVisit }}</div>
                      </td>
                      <td class="px-8 py-6">
                        <div class="flex justify-center gap-3">
                          <button (click)="confirmRequest(r.id)" class="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all">Confirm</button>
                          <button (click)="openRejectModal(r.id)" class="bg-white text-red-500 border-2 border-red-50 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase hover:bg-red-50 transition-all">Reject</button>
                        </div>
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="3" class="px-8 py-20 text-center font-bold text-slate-300">No pending consultation requests.</td></tr>
                  }
               </tbody>
             </table>
          </div>
        </div>
      }

      <!-- VIEW: UPCOMING -->
      @if (activeView() === 'upcoming') {
        <div class="space-y-6">
          <h3 class="text-2xl font-black text-slate-800">Confirmed Future Appointments</h3>
          <div class="panel !p-0 shadow-xl shadow-slate-200/50 overflow-hidden border-none rounded-3xl">
             <table class="modern-table w-full">
               <thead>
                 <tr class="bg-slate-50">
                   <th class="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Date / Time</th>
                   <th class="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Patient Details</th>
                   <th class="px-8 py-5 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                 </tr>
               </thead>
               <tbody>
                  @for (u of upcoming(); track u.id) {
                    <tr class="border-t border-slate-50">
                      <td class="px-8 py-6">
                        <div class="font-extrabold text-slate-800">{{ u.appointmentDate | date:'mediumDate' }}</div>
                        <div class="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">{{ u.slotTime || 'Online' }}</div>
                      </td>
                      <td class="px-8 py-6">
                        <div class="font-black text-slate-800">{{ u.patient?.fullName }}</div>
                        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Token #{{ u.tokenNumber }} • {{ u.reasonForVisit }}</div>
                      </td>
                      <td class="px-8 py-6 text-center">
                        <span class="inline-flex items-center gap-1.5 text-blue-600 font-black text-[10px] uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">Confirmed</span>
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="3" class="px-8 py-20 text-center font-bold text-slate-300">No upcoming appointments for future dates.</td></tr>
                  }
               </tbody>
             </table>
          </div>
        </div>
      }

      <!-- VIEW: HISTORY -->
      @if (activeView() === 'history') {
        <div class="space-y-6">
          <div class="flex justify-between items-center">
            <h3 class="text-2xl font-black text-slate-800">Consultation History</h3>
            <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Total: {{ completed().length }}</span>
          </div>
          <div class="panel !p-0 shadow-xl shadow-slate-200/50 overflow-hidden border-none rounded-3xl">
             <table class="modern-table w-full">
               <thead>
                 <tr class="bg-slate-50">
                   <th class="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Date / Token</th>
                   <th class="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Patient Details</th>
                   <th class="px-8 py-5 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Document</th>
                 </tr>
               </thead>
               <tbody>
                  @for (c of completed(); track c.id) {
                    <tr class="border-t border-slate-50">
                      <td class="px-8 py-6">
                        <div class="font-extrabold text-slate-800">{{ c.appointmentDate | date:'mediumDate' }}</div>
                        <div class="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Token #{{ c.tokenNumber }}</div>
                      </td>
                      <td class="px-8 py-6">
                        <div class="font-black text-slate-800">{{ c.patient?.fullName }}</div>
                        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{{ c.reasonForVisit }}</div>
                      </td>
                      <td class="px-8 py-6 text-center">
                         <button (click)="downloadPrescription(c.id)" class="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-100 transition-all">Rx PDF</button>
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="3" class="px-8 py-20 text-center font-bold text-slate-300">No completed consultations.</td></tr>
                  }
               </tbody>
             </table>
          </div>
        </div>
      }

      <!-- VIEW: SCHEDULE -->
      @if (activeView() === 'schedule') {
        <div class="space-y-8">
           <div class="flex justify-between items-end">
             <div>
                <h3 class="text-3xl font-black text-slate-800 tracking-tight">Availability Grid</h3>
                <p class="text-slate-400 font-medium mt-1">Configure your slots for the next 14 days.</p>
             </div>
             <button (click)="saveAvailability()" class="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all">
               Save Availability
             </button>
           </div>

           <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
              @for (day of availabilityDays; track day.date) {
                <div class="panel !p-6 flex flex-col items-center gap-4 rounded-3xl border-2 transition-all" 
                     [class.bg-blue-600]="day.selected" [class.border-blue-600]="day.selected" [class.text-white]="day.selected">
                  <span class="text-[10px] uppercase font-black tracking-widest opacity-60">{{ day.date | date:'EEE' }}</span>
                  <span class="text-2xl font-black tracking-tighter">{{ day.date | date:'dd' }}</span>
                  <button (click)="day.selected = !day.selected" class="w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-tight border mt-2"
                          [class.bg-white]="day.selected" [class.text-blue-600]="day.selected" [class.border-blue-500]="!day.selected" [class.text-blue-500]="!day.selected">
                    {{ day.selected ? 'OFF' : 'ON' }}
                  </button>
                </div>
              }
           </div>

           @if (capacityForm.bookingMode === 'Slot') {
             <div class="panel !p-10 rounded-3xl shadow-xl shadow-slate-200/50">
                <h4 class="text-sm font-black uppercase text-slate-800 tracking-widest mb-8">Generic Online Slots (Time-based Only)</h4>
                <div class="grid grid-cols-2 md:grid-cols-6 gap-3">
                   @for (s of timeSlots; track s) {
                      <button class="p-4 rounded-xl border-2 font-black text-[11px] transition-all"
                              (click)="toggleSlot(s)"
                              [class.bg-blue-600]="selectedSlots.has(s)" [class.text-white]="selectedSlots.has(s)" [class.border-blue-600]="selectedSlots.has(s)"
                              [class.border-slate-50]="!selectedSlots.has(s)" [class.text-slate-400]="!selectedSlots.has(s)">
                        {{ s }}
                      </button>
                   }
                </div>
             </div>
           } @else {
             <div class="panel !p-10 rounded-3xl bg-blue-50 border-none flex items-center gap-6">
                <div class="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                   <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                </div>
                <div>
                   <h4 class="text-lg font-black text-slate-800">Token Mode Active</h4>
                   <p class="text-slate-500 font-medium">Just select the days you are available in the calendar above. Patients will book sequential tokens for those dates.</p>
                </div>
             </div>
           }
        </div>
      }

      <!-- VIEW: SETTINGS -->
      @if (activeView() === 'settings') {
        <div class="max-w-2xl space-y-8">
           <h3 class="text-3xl font-black text-slate-800 tracking-tight">Capacity & Parameters</h3>
           <div class="panel !p-10 space-y-10 rounded-3xl shadow-2xl shadow-slate-200/50 border-none">
              
              <div class="space-y-4">
                 <div class="flex items-center justify-between">
                    <label class="text-xs font-black uppercase text-slate-400 tracking-[0.2em]">Booking Methodology</label>
                    <span class="text-[10px] font-black px-3 py-1 bg-blue-50 text-blue-600 rounded-full uppercase tracking-widest border border-blue-100">
                      Active: {{ activeMode() === 'Slot' ? 'Time-Slots' : 'Token Based' }}
                    </span>
                 </div>
                 <div class="flex gap-4">
                    <!-- SLOT MODE SELECTOR -->
                    <div class="flex-1 relative">
                       @if (activeMode() === 'Token' && capacityForm.bookingMode !== 'Slot') {
                          <div class="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 rounded-2xl flex items-center justify-center">
                             <button (click)="capacityForm.bookingMode = 'Slot'" class="bg-white/90 shadow-xl border border-slate-100 text-slate-800 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Enable Slots</button>
                          </div>
                       }
                       <button (click)="capacityForm.bookingMode = 'Slot'" 
                               [disabled]="activeMode() === 'Slot'"
                               class="w-full py-5 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all"
                               [class.bg-blue-600]="capacityForm.bookingMode === 'Slot'" [class.text-white]="capacityForm.bookingMode === 'Slot'" [class.border-blue-600]="capacityForm.bookingMode === 'Slot'"
                               [class.border-slate-100]="capacityForm.bookingMode !== 'Slot'" [class.bg-slate-50]="capacityForm.bookingMode !== 'Slot'">
                         Time-Slots
                       </button>
                    </div>

                    <!-- TOKEN MODE SELECTOR -->
                    <div class="flex-1 relative">
                       @if (activeMode() === 'Slot' && capacityForm.bookingMode !== 'Token') {
                          <div class="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 rounded-2xl flex items-center justify-center">
                             <button (click)="capacityForm.bookingMode = 'Token'" class="bg-white/90 shadow-xl border border-slate-100 text-slate-800 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Enable Tokens</button>
                          </div>
                       }
                       <button (click)="capacityForm.bookingMode = 'Token'" 
                               [disabled]="activeMode() === 'Token'"
                               class="w-full py-5 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all"
                               [class.bg-blue-600]="capacityForm.bookingMode === 'Token'" [class.text-white]="capacityForm.bookingMode === 'Token'" [class.border-blue-600]="capacityForm.bookingMode === 'Token'"
                               [class.border-slate-100]="capacityForm.bookingMode !== 'Token'" [class.bg-slate-50]="capacityForm.bookingMode !== 'Token'">
                         Token Based
                       </button>
                    </div>
                 </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <!-- Show Max Tokens if Token Based -->
                 @if (capacityForm.bookingMode === 'Token') {
                   <div class="space-y-3">
                     <label class="text-xs font-black uppercase text-slate-400 tracking-[0.2em]">Maximum Daily Tokens</label>
                     <input type="number" [(ngModel)]="capacityForm.maxTokensPerDay" class="w-full p-4 !bg-slate-50 border-2 border-slate-100 rounded-xl font-black outline-none focus:border-blue-500" />
                   </div>
                 }
                 
                 <!-- Show Slot Duration if Time-Slot based -->
                 @if (capacityForm.bookingMode === 'Slot') {
                   <div class="space-y-3">
                     <label class="text-xs font-black uppercase text-slate-400 tracking-[0.2em]">Consultation Duration (Mins)</label>
                     <input type="number" [(ngModel)]="capacityForm.slotDuration" class="w-full p-4 !bg-slate-50 border-2 border-slate-100 rounded-xl font-black outline-none focus:border-blue-500" />
                   </div>
                 }
              </div>

              <button (click)="updateCapacity()" class="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all">
                Sync Settings
              </button>
           </div>
        </div>
      }

    </div>

    <!-- Prescription Management Modal -->
    @if (showPrescriptionModal()) {
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div class="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <!-- Modal Header -->
          <div class="p-8 border-b border-slate-50 flex items-center justify-between">
            <div>
              <h3 class="text-2xl font-black text-slate-900 line-clamp-1">Dr. {{ auth.currentUser()?.name }}</h3>
              <div class="flex items-center gap-2 mt-1">
                 <span class="text-xs text-blue-600 font-black uppercase tracking-widest">{{ activeAppointment()?.appointmentDate | date:'mediumDate' }}</span>
                 <span class="text-slate-300">•</span>
                 <p class="text-xs text-slate-500 font-medium">Token #{{ activeAppointment()?.tokenNumber }} - {{ activeAppointment()?.patient?.fullName }}</p>
              </div>
            </div>
            <button (click)="closePrescriptionModal()" class="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="space-y-3">
                <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest">Initial Diagnosis</label>
                <textarea [(ngModel)]="prescForm.diagnosis" rows="3" class="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-medium outline-none focus:border-blue-500" placeholder="Medical findings..."></textarea>
              </div>
              <div class="space-y-3">
                <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tests Advised</label>
                <textarea [(ngModel)]="prescForm.testsAdvised" rows="3" class="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-medium outline-none focus:border-blue-500" placeholder="Lab tests..."></textarea>
              </div>
            </div>

            <!-- Medicines -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest">Medications</label>
                <button (click)="addMedicine()" class="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase">+ Add Row</button>
              </div>
              @for (med of prescForm.medicines; track $index) {
                <div class="flex gap-3">
                  <input [(ngModel)]="med.name" placeholder="Name" class="flex-1 p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm" />
                  <input [(ngModel)]="med.dosage" placeholder="1-0-1" class="w-24 p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm" />
                  <input [(ngModel)]="med.duration" placeholder="Days" class="w-24 p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm" />
                  <button (click)="removeMedicine($index)" class="p-3 text-rose-500">×</button>
                </div>
              }
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="p-8 border-t border-slate-50 flex gap-4">
            <button (click)="closePrescriptionModal()" class="flex-1 py-4 border rounded-2xl font-black text-xs uppercase text-slate-400">Cancel</button>
            <button (click)="submitPrescription()" class="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl">Complete & Issue</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .widget-card { @apply bg-white p-8 rounded-3xl flex items-center justify-between border-none shadow-xl shadow-slate-200/50; }
    .w-val { @apply text-4xl font-black tracking-tighter text-slate-800 leading-none; }
    .w-label { @apply text-[10px] font-black uppercase text-slate-400 tracking-widest mt-2; }
    .w-icon-box { @apply w-12 h-12 rounded-2xl flex items-center justify-center border; }
  `]
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private signalr = inject(SignalrService);
  private router = inject(Router);
  public auth = inject(AuthService);

  activeView = signal('dashboard');
  pending = signal<any[]>([]);
  scheduled = signal<any[]>([]);
  upcoming = signal<any[]>([]);
  completed = signal<any[]>([]);
  currentToken = signal<number>(0);
  activeMode = signal<string>('Slot');
  showSaturdayReminder = signal<boolean>(false);


  // Prescription Logic
  showPrescriptionModal = signal(false);
  activeAppointment = signal<any>(null);
  submittingPresc = false;
  prescForm = {
    diagnosis: '',
    medicines: [{ name: '', dosage: '', duration: '', instructions: '' }],
    testsAdvised: '',
    followUpDate: '',
    notes: ''
  };

  openPrescriptionModal(appt: any) {
    this.activeAppointment.set(appt);
    this.showPrescriptionModal.set(true);
  }

  closePrescriptionModal() {
    this.showPrescriptionModal.set(false);
  }

  addMedicine() {
    this.prescForm.medicines.push({ name: '', dosage: '', duration: '', instructions: '' });
  }

  removeMedicine(index: number) {
    this.prescForm.medicines.splice(index, 1);
  }

  submitPrescription() {
    const appt = this.activeAppointment();
    if (!appt) return;
    
    this.submittingPresc = true;
    this.http.post(`${environment.apiUrl}/doctor/appointment/${appt.id}/prescription`, this.prescForm).subscribe({
      next: () => {
        alert('Prescription issued successfully');
        this.closePrescriptionModal();
        this.loadData();
        this.submittingPresc = false;
        this.prescForm = { diagnosis: '', medicines: [{ name: '', dosage: '', duration: '', instructions: '' }], testsAdvised: '', followUpDate: '', notes: '' };
      },
      error: () => this.submittingPresc = false
    });
  }

  // Capacity Form
  capacityForm = {
    bookingMode: 'Slot',
    maxTokensPerDay: 50,
    slotDuration: 15
  };

  // Availability Grid
  availabilityDays: any[] = [];
  timeSlots: string[] = [];
  generateDynamicTimeSlots() {
    const duration = this.capacityForm.slotDuration || 15;
    const slots = [];
    let start = 9 * 60; // 9 AM
    const end = 18 * 60; // 6 PM
    
    while (start < end) {
      const h = Math.floor(start / 60);
      const m = start % 60;
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h > 12 ? h - 12 : (h === 0 ? 12 : h);
      slots.push(`${displayH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`);
      start += duration;
    }
    this.timeSlots = slots;
  }
  selectedSlots = new Set<string>();

  ngOnInit() {
    this.checkSaturday();
    this.detectRoute();
    this.router.events.subscribe(ev => { if (ev instanceof NavigationEnd) this.detectRoute(); });
    this.loadData();
    this.generateAvailabilityDays();
    this.generateDynamicTimeSlots();

    const user = this.auth.currentUser();
    if (user) {
      this.signalr.startConnection(user.id, this.formatDate(new Date()));
      
      this.signalr.onNewAppointmentRequest(() => {
        this.loadData();
      });

      this.signalr.onQueueUpdated(() => {
        this.loadData();
      });
    }
  }

  detectRoute() {
    const url = this.router.url;
    if (url.includes('/requests')) this.activeView.set('requests');
    else if (url.includes('/history')) this.activeView.set('history');
    else if (url.includes('/schedule')) this.activeView.set('schedule');
    else if (url.includes('/settings')) this.activeView.set('settings');
    else this.activeView.set('queue');
  }

  loadData() {
    this.http.get<any[]>(`${environment.apiUrl}/doctor/pending`).subscribe(data => this.pending.set(data));
    this.http.get<any[]>(`${environment.apiUrl}/doctor/scheduled`).subscribe(data => {
      this.scheduled.set(data);
      const active = data.find(a => a.status === 'InRoom');
      if (active) this.currentToken.set(active.tokenNumber);
    });
    this.http.get<any[]>(`${environment.apiUrl}/doctor/upcoming`).subscribe(data => this.upcoming.set(data));
    this.http.get<any>(`${environment.apiUrl}/doctor/capacity`).subscribe(data => {
        if (data) {
          this.capacityForm = data;
          this.activeMode.set(data.bookingMode);
          this.generateDynamicTimeSlots();
        }
    });

    // Load saved availability
    this.http.get<any[]>(`${environment.apiUrl}/doctor/my-availability`).subscribe(slots => {
      this.selectedSlots.clear();
      
      const datesWithSlots = new Set();
      slots.forEach(s => {
        if (s.timeSlot !== 'TOKEN_SESSION') {
          this.selectedSlots.add(s.timeSlot);
        }
        // Slot.Date is YYYY-MM-DD from API
        datesWithSlots.add(s.date.split('T')[0]);
      });
      
      this.availabilityDays.forEach(day => {
        const dateStr = this.formatDate(day.date);
        day.selected = !datesWithSlots.has(dateStr); // selected means OFF in template
      });
    });

    this.http.get<any[]>(`${environment.apiUrl}/doctor/completed`).subscribe(data => {
      this.completed.set(data);
    });
  }

  downloadPrescription(id: number) {
    window.open(`${environment.apiUrl}/doctor/appointment/${id}/prescription/pdf`, '_blank');
  }

  updateStatus(id: number, status: string) {
    this.http.patch(`${environment.apiUrl}/doctor/appointment/${id}/status`, { status }).subscribe(() => {
       this.loadData();
    });
  }

  confirmRequest(id: number) {
    this.http.patch(`${environment.apiUrl}/doctor/appointment/${id}/confirm`, {}).subscribe(() => {
       this.loadData();
    });
  }

  openRejectModal(id: number) {
    const reason = prompt('Reason for rejection:');
    if (reason) {
      this.http.patch(`${environment.apiUrl}/doctor/appointment/${id}/reject`, { reason }).subscribe(() => {
        this.loadData();
      });
    }
  }

  updateCapacity() {
    this.http.patch(`${environment.apiUrl}/doctor/capacity`, this.capacityForm).subscribe(() => {
      this.activeMode.set(this.capacityForm.bookingMode);
      alert('Settings synced. Booking mode is now ' + (this.activeMode() === 'Slot' ? 'Slot based.' : 'Token based.'));
      this.loadData();
    });
  }

  isConsulting(): boolean {
    return !!this.scheduled().find(a => a.status === 'InRoom');
  }

  openActivePrescription() {
    const active = this.scheduled().find(a => a.status === 'InRoom');
    if (active) this.openPrescriptionModal(active);
  }

  nextPatient() {
     return this.scheduled().find(p => p.status === 'Confirmed');
  }

  formatDate(date: Date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  generateAvailabilityDays() {
    this.availabilityDays = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      this.availabilityDays.push({ date: d, selected: true }); // Default to OFF (selected=true)
    }
  }

  toggleSlot(s: string) {
    if (this.selectedSlots.has(s)) this.selectedSlots.delete(s);
    else this.selectedSlots.add(s);
  }

  saveAvailability() {
    const payload = [];
    const isTokenMode = this.capacityForm.bookingMode === 'Token';

    for (const day of this.availabilityDays) {
      if (day.selected) continue; // If selected = OFF
      
      const dateStr = this.formatDate(day.date);
      
      if (isTokenMode) {
        payload.push({ date: dateStr, timeSlot: 'TOKEN_SESSION' });
      } else {
        for (const slot of this.selectedSlots) {
          payload.push({ date: dateStr, timeSlot: slot });
        }
      }
    }

    this.http.post(`${environment.apiUrl}/doctor/availability`, payload).subscribe(() => {
      alert('Availability saved successfully!');
      this.loadData();
    });
  }

  private checkSaturday() {
    this.showSaturdayReminder.set(new Date().getDay() === 6);
  }
}
