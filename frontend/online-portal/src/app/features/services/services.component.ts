import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PortalService, Service } from '../../core/services/portal.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'portal-services',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div class="max-w-2xl">
        <p class="text-xs font-black uppercase tracking-wider text-orange-600">Services</p>
        <h1 class="text-3xl sm:text-4xl font-black text-[#0f172a] mt-1">Available barangay services</h1>
        <p class="text-slate-500 mt-2 leading-relaxed">
          Select a service to begin an online document request. Requirements and fees are configured by the barangay
          and match the services available at the kiosk.
        </p>
      </div>

      @if (!loading() && !error() && services().length > 0) {
        <div class="mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
          <div class="relative flex-1 max-w-md">
            <label for="service-search" class="sr-only">Search services</label>
            <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none"
                 stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
            <input
              id="service-search"
              type="search"
              placeholder="Search by service name or description"
              [value]="search()"
              (input)="search.set($any($event.target).value)"
              class="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
            />
          </div>
          <p class="text-xs font-semibold text-slate-500 sm:ml-auto">
            {{ filteredServices().length }} service{{ filteredServices().length === 1 ? '' : 's' }} available
          </p>
        </div>
      }

      @if (loading()) {
        <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="h-56 rounded-2xl bg-slate-100 animate-pulse"></div>
          }
        </div>
      } @else if (error()) {
        <div class="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <p class="font-bold">Unable to load services.</p>
          <p class="text-sm mt-1">{{ error() }}</p>
        </div>
      } @else {
        <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          @for (service of filteredServices(); track service.service_id) {
            <article
              (click)="onSelectService(service)"
              (keydown.enter)="onSelectService(service)"
              (keydown.space)="$event.preventDefault(); onSelectService(service)"
              role="button"
              tabindex="0"
              [attr.aria-label]="'Request ' + service.service_name"
              class="bg-white border border-slate-200 hover:border-orange-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-2xl p-5 shadow-xs flex flex-col cursor-pointer group"
            >
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-colors shrink-0 flex items-center justify-center">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-start justify-between gap-3">
                    <h2 class="font-black text-lg text-[#0f172a] group-hover:text-orange-600 transition-colors uppercase leading-snug break-words">
                      {{ service.service_name }}
                    </h2>
                    <span class="px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-xs font-bold whitespace-nowrap shrink-0">
                      @if (service.processing_fee > 0) {
                        ₱{{ service.processing_fee | number:'1.2-2' }}
                      } @else {
                        FREE
                      }
                    </span>
                  </div>
                </div>
              </div>

              @if (service.description) {
                <p class="text-sm text-slate-500 mt-3 leading-relaxed line-clamp-3">{{ service.description }}</p>
              }

              @if (service.requirements?.length) {
                <div class="mt-4">
                  <p class="text-[11px] font-black uppercase tracking-wider text-slate-400">Requirements</p>
                  <ul class="mt-2 space-y-1.5">
                    @for (req of service.requirements; track req) {
                      <li class="text-sm text-slate-600 flex items-start gap-2">
                        <span class="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                        <span>{{ req }}</span>
                      </li>
                    }
                  </ul>
                </div>
              } @else {
                <div class="mt-4">
                  <p class="text-[11px] font-black uppercase tracking-wider text-slate-400">Requirements</p>
                  <p class="mt-2 text-sm text-slate-500">No specific requirements listed for this service.</p>
                </div>
              }

              <div class="mt-auto pt-5 flex items-center justify-between border-t border-slate-100 text-xs font-black uppercase tracking-wider text-orange-600">
                <span>Apply now</span>
                <span class="group-hover:translate-x-1 transition-transform" aria-hidden="true">&rarr;</span>
              </div>
            </article>
          } @empty {
            <div class="col-span-full rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              @if (search()) {
                No services match “{{ search() }}”.
              } @else {
                No active services available right now.
              }
            </div>
          }
        </div>
      }
    </div>
  `
})
export class ServicesComponent implements OnInit {
  services = signal<Service[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  search = signal('');

  filteredServices = computed(() => {
    const q = this.search().trim().toLowerCase();
    const list = this.services();
    if (!q) return list;
    return list.filter(s => {
      const name = (s.service_name || '').toLowerCase();
      const desc = (s.description || '').toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  });

  constructor(
    private portalService: PortalService,
    private router: Router,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.portalService.getServices().subscribe({
      next: (res) => {
        const list = Array.isArray(res?.data) ? res.data : [];
        this.services.set(list.filter(s => s.is_active !== false));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Please try again later.');
        this.loading.set(false);
      }
    });
  }

  onSelectService(service: Service): void {
    try {
      sessionStorage.setItem('portal_selected_service_id', String(service.service_id));
    } catch {
      // sessionStorage may be unavailable
    }

    if (!this.auth.isAuthenticated() || this.auth.mustChangePassword()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/apply?service_id=${service.service_id}` }
      });
      return;
    }

    this.router.navigate(['/apply'], {
      queryParams: { service_id: service.service_id }
    });
  }
}
