import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

@Component({
  selector: 'app-all-doctors',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="doctors-container fade-in pb-20">
      
      <!-- Filter Strip -->
      <div class="filter-strip panel shadow-sm mb-10">
        <div class="filter-item search-box-wrap">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" [(ngModel)]="searchTerm" placeholder="Search Doctor name or specialty..." class="search-input" />
        </div>
        
        <div class="filter-item">
          <label class="text-xs font-bold uppercase text-slate-400 tracking-wider mr-3">Specialty</label>
          <select [(ngModel)]="selectedSpecialty" class="select-field">
            <option value="">All Specialties</option>
            @for (s of specialties; track s) {
              <option [value]="s">{{ s }}</option>
            }
          </select>
        </div>
      </div>

      <!-- Grid -->
      <div class="cards-grid">
        @for (doc of filteredDoctors(); track doc.id) {
          <div class="doctor-card panel !p-0 group">
            <div class="card-image aspect-[4/3] relative overflow-hidden">
               <img [src]="getPhotoUrl(doc) || 'https://images.unsplash.com/photo-1559839734-2b71f1536783?auto=format&fit=crop&q=80&w=400'" [alt]="doc.name" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
               <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/60 to-transparent p-6 pt-12">
                  <span class="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded">
                    {{ doc.departmentName || 'Specialist' }}
                  </span>
               </div>
            </div>
            
            <div class="card-content !p-6 flex flex-col">
              <h3 class="doc-name text-xl font-black text-slate-800 tracking-tight">{{ doc.name }}</h3>
              <p class="doc-specialty text-sm font-bold text-blue-600 uppercase tracking-widest mt-1 mb-4">{{ doc.designation }}</p>
              
              <div class="doc-info flex gap-6 mb-6">
                <div class="info-item flex items-center gap-2 text-slate-500 font-bold text-xs uppercase">
                  <svg class="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20"/></svg>
                  <span>Pay at Hospital</span>
                </div>
                <div class="info-item flex items-center gap-2 text-slate-500 font-bold text-xs uppercase">
                  <svg class="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span>{{ doc.bookingMode || 'Slot' }} Basis</span>
                </div>
              </div>
              
              <p class="doc-bio text-slate-400 text-sm leading-relaxed mb-8 line-clamp-2">{{ doc.bio }}</p>
              
              <button class="btn-primary w-full py-4 !bg-blue-600 hover:!bg-blue-700 !font-black !rounded-xl !tracking-widest uppercase text-xs !shadow-lg !shadow-blue-200 transition-all active:scale-95" (click)="bookNow(doc)">
                Book Appointment
              </button>
            </div>
          </div>
        } @empty {
          <div class="col-span-full py-32 text-center panel border-dashed border-2 bg-slate-50/50">
            <h4 class="text-xl font-bold text-slate-400">No doctors matching your filters.</h4>
            <p class="text-slate-400 mt-2">Try adjusting your search terms or specialty.</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .doctors-container { max-width: 1400px; margin: 0 auto; }
    
    .filter-strip {
      display: flex; align-items: center; gap: 2rem; padding: 1.5rem 2rem;
      background: white; border-radius: 20px;
    }
    
    .search-box-wrap {
      flex: 1; display: flex; align-items: center; gap: 1rem;
      background: #F8FAFC; border: 2px solid #F1F5F9; border-radius: 12px;
      padding: 0 1.25rem; transition: border-color 0.2s;
    }
    .search-box-wrap:focus-within { border-color: #3B82F6; background: white; }
    .search-icon { width: 18px; height: 18px; color: #94A3B8; }
    .search-input { width: 100%; border: none; outline: none; background: transparent; padding: 1.25rem 0; font-size: 0.95rem; font-weight: 500; }

    .select-field {
      padding: 1rem 1.5rem; background: #F8FAFC; border: 2px solid #F1F5F9;
      border-radius: 12px; font-weight: 700; font-size: 0.85rem; outline: none;
      color: #1E293B; cursor: pointer; transition: all 0.2s;
    }
    .select-field:hover { border-color: #CBD5E1; }

    .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 2rem; }
    
    .doctor-card { 
      border-radius: 24px; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      border: 1px solid #F1F5F9;
    }
    .doctor-card:hover { transform: translateY(-8px); border-color: #3B82F6; box-shadow: 0 25px 50px -12px rgba(37, 99, 235, 0.08); }
  `]
})
export class AllDoctorsComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  doctors = signal<any[]>([]);
  searchTerm = '';
  selectedSpecialty = '';

  specialties = [
    'Cardiology', 'Dermatology', 'Pediatrics', 'Orthopedics', 'Neurology', 
    'Oncology', 'Gynecology', 'Ophthalmology', 'Psychiatry', 'Urology', 
    'Endocrinology', 'Gastroenterology', 'Nephrology', 'Pulmonology', 
    'Rheumatology', 'General Physician'
  ];

  ngOnInit() {
    this.http.get<any[]>(`${environment.apiUrl}/patient/doctors`).subscribe(data => {
      this.doctors.set(data);
    });
  }

  getPhotoUrl(doc: any): string {
    const photo = doc.profilePhotoUrl;
    if (!photo) return '';
    if (photo.startsWith('http')) return photo;
    return `${environment.signalrUrl}/${photo}`;
  }

  filteredDoctors() {
    return this.doctors().filter(d => {
      const term = this.searchTerm.toLowerCase();
      const matchesName = d.name.toLowerCase().includes(term);
      const matchesSpecialty = !this.selectedSpecialty || d.department?.name === this.selectedSpecialty;
      const matchesBio = d.bio?.toLowerCase().includes(term);
      return (matchesName || matchesBio) && matchesSpecialty;
    });
  }

  bookNow(doc: any) {
    this.router.navigate(['/patient/slots'], { queryParams: { doctorId: doc.id } });
  }
}
