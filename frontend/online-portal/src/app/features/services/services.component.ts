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
        <p class="text-xs font-black uppercase tracking-wider text-orange-600">Services Directory</p>
        <h1 class="text-3xl sm:text-4xl font-black text-[#0f172a] mt-1">Barangay Online Services</h1>
        <p class="text-slate-500 mt-2 leading-relaxed text-sm sm:text-base">
          Select a service below to begin your online request. Request documents, clearances, and Barangay ID applications or renewals from home.
        </p>
      </div>

      @if (!loading() && !error() && services().length > 0) {
        <!-- Search Bar and Category Tabs -->
        <div class="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
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
              class="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition shadow-2xs"
            />
          </div>

          <!-- Category Filter Pills -->
          <div class="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80 self-start md:self-auto shrink-0">
            <button
              type="button"
              (click)="activeCategory.set('all')"
              [class.bg-white]="activeCategory() === 'all'"
              [class.text-slate-900]="activeCategory() === 'all'"
              [class.shadow-2xs]="activeCategory() === 'all'"
              [class.text-slate-600]="activeCategory() !== 'all'"
              class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5">
              <span>All Services</span>
              <span class="px-1.5 py-0.5 rounded-full text-[10px] font-black"
                    [class.bg-orange-100]="activeCategory() === 'all'"
                    [class.text-orange-700]="activeCategory() === 'all'"
                    [class.bg-slate-200]="activeCategory() !== 'all'"
                    [class.text-slate-600]="activeCategory() !== 'all'">
                {{ filteredServices().length }}
              </span>
            </button>

            <button
              type="button"
              (click)="activeCategory.set('documents')"
              [class.bg-white]="activeCategory() === 'documents'"
              [class.text-slate-900]="activeCategory() === 'documents'"
              [class.shadow-2xs]="activeCategory() === 'documents'"
              [class.text-slate-600]="activeCategory() !== 'documents'"
              class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5">
              <span>Document Services</span>
              <span class="px-1.5 py-0.5 rounded-full text-[10px] font-black"
                    [class.bg-orange-100]="activeCategory() === 'documents'"
                    [class.text-orange-700]="activeCategory() === 'documents'"
                    [class.bg-slate-200]="activeCategory() !== 'documents'"
                    [class.text-slate-600]="activeCategory() !== 'documents'">
                {{ documentServices().length }}
              </span>
            </button>

            <button
              type="button"
              (click)="activeCategory.set('id')"
              [class.bg-white]="activeCategory() === 'id'"
              [class.text-slate-900]="activeCategory() === 'id'"
              [class.shadow-2xs]="activeCategory() === 'id'"
              [class.text-slate-600]="activeCategory() !== 'id'"
              class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5">
              <span>Barangay ID Services</span>
              <span class="px-1.5 py-0.5 rounded-full text-[10px] font-black"
                    [class.bg-orange-100]="activeCategory() === 'id'"
                    [class.text-orange-700]="activeCategory() === 'id'"
                    [class.bg-slate-200]="activeCategory() !== 'id'"
                    [class.text-slate-600]="activeCategory() !== 'id'">
                {{ idServices().length }}
              </span>
            </button>
          </div>
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
      } @else if (filteredServices().length === 0) {
        <div class="mt-8 rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
          @if (search()) {
            <p class="text-base font-bold text-slate-700">No services match “{{ search() }}”.</p>
            <p class="text-xs text-slate-400 mt-1">Try searching with a different term or clear the search filter.</p>
          } @else {
            <p class="text-base font-bold text-slate-700">No active services available right now.</p>
          }
        </div>
      } @else {
        <div class="mt-10 space-y-12">
          <!-- ========================================================================= -->
          <!-- SECTION 1: DOCUMENT SERVICES -->
          <!-- ========================================================================= -->
          @if ((activeCategory() === 'all' || activeCategory() === 'documents') && documentServices().length > 0) {
            <section aria-labelledby="heading-document-services">
              <div class="flex items-center justify-between pb-3 border-b border-slate-200">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-black text-sm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <div>
                    <h2 id="heading-document-services" class="text-xl font-black text-slate-900 tracking-tight">
                      Document Services
                    </h2>
                    <p class="text-xs text-slate-500">Barangay clearances, certifications, and indigent records.</p>
                  </div>
                </div>
                <span class="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                  {{ documentServices().length }} Available
                </span>
              </div>

              <div class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                @for (service of documentServices(); track service.service_id) {
                  <article
                    (click)="onSelectService(service)"
                    (keydown.enter)="onSelectService(service)"
                    (keydown.space)="$event.preventDefault(); onSelectService(service)"
                    role="button"
                    tabindex="0"
                    [attr.aria-label]="'Request ' + service.service_name"
                    class="bg-white border border-slate-200 hover:border-orange-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-2xl p-5 shadow-xs flex flex-col cursor-pointer group">
                    <div class="flex items-start gap-3">
                      <div class="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-colors shrink-0 flex items-center justify-center">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="flex items-start justify-between gap-2">
                          <h3 class="font-black text-base text-[#0f172a] group-hover:text-orange-600 transition-colors uppercase leading-snug break-words">
                            {{ service.service_name }}
                          </h3>
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
                      <p class="text-xs text-slate-500 mt-3 leading-relaxed line-clamp-2">{{ service.description }}</p>
                    }

                    @if (service.requirements?.length) {
                      <div class="mt-4">
                        <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Requirements</p>
                        <ul class="mt-1.5 space-y-1">
                          @for (req of service.requirements; track req) {
                            <li class="text-xs text-slate-600 flex items-start gap-1.5 truncate">
                              <span class="mt-1.5 w-1 h-1 rounded-full bg-orange-500 shrink-0"></span>
                              <span class="truncate">{{ req }}</span>
                            </li>
                          }
                        </ul>
                      </div>
                    }

                    <div class="mt-auto pt-4 flex items-center justify-between border-t border-slate-100 text-xs font-black uppercase tracking-wider text-orange-600">
                      <span>Apply now</span>
                      <span class="group-hover:translate-x-1 transition-transform" aria-hidden="true">&rarr;</span>
                    </div>
                  </article>
                }
              </div>
            </section>
          }

          <!-- ========================================================================= -->
          <!-- SECTION 2: BARANGAY ID SERVICES -->
          <!-- ========================================================================= -->
          @if ((activeCategory() === 'all' || activeCategory() === 'id') && idServices().length > 0) {
            <section aria-labelledby="heading-id-services">
              <div class="flex items-center justify-between pb-3 border-b border-slate-200">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 id="heading-id-services" class="text-xl font-black text-slate-900 tracking-tight">
                      Barangay ID Services
                    </h2>
                    <p class="text-xs text-slate-500">Official resident identification card issuance, renewal, and replacements.</p>
                  </div>
                </div>
                <span class="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                  {{ idServices().length }} Available
                </span>
              </div>

              <div class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                @for (service of idServices(); track service.service_id) {
                  <article
                    (click)="onSelectService(service)"
                    (keydown.enter)="onSelectService(service)"
                    (keydown.space)="$event.preventDefault(); onSelectService(service)"
                    role="button"
                    tabindex="0"
                    [attr.aria-label]="'Request ' + service.service_name"
                    class="bg-white border border-slate-200 hover:border-blue-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-2xl p-5 shadow-xs flex flex-col cursor-pointer group">
                    <div class="flex items-start gap-3">
                      <div class="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0 flex items-center justify-center">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round"
                                d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                        </svg>
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="flex items-start justify-between gap-2">
                          <h3 class="font-black text-base text-[#0f172a] group-hover:text-blue-600 transition-colors uppercase leading-snug break-words">
                            {{ service.service_name }}
                          </h3>
                          <span class="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold whitespace-nowrap shrink-0">
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
                      <p class="text-xs text-slate-500 mt-3 leading-relaxed line-clamp-2">{{ service.description }}</p>
                    }

                    @if (service.requirements?.length) {
                      <div class="mt-4">
                        <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Requirements</p>
                        <ul class="mt-1.5 space-y-1">
                          @for (req of service.requirements; track req) {
                            <li class="text-xs text-slate-600 flex items-start gap-1.5 truncate">
                              <span class="mt-1.5 w-1 h-1 rounded-full bg-blue-500 shrink-0"></span>
                              <span class="truncate">{{ req }}</span>
                            </li>
                          }
                        </ul>
                      </div>
                    }

                    <div class="mt-auto pt-4 flex items-center justify-between border-t border-slate-100 text-xs font-black uppercase tracking-wider text-blue-600">
                      <span>Apply now</span>
                      <span class="group-hover:translate-x-1 transition-transform" aria-hidden="true">&rarr;</span>
                    </div>
                  </article>
                }
              </div>
            </section>
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
  activeCategory = signal<'all' | 'documents' | 'id'>('all');

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

  documentServices = computed(() => {
    return this.filteredServices().filter(s => !this.isIdService(s));
  });

  idServices = computed(() => {
    return this.filteredServices().filter(s => this.isIdService(s));
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

  isIdService(service: Service): boolean {
    const name = (service.service_name || '').toLowerCase();
    return name.includes('barangay id') || name.includes('id card') || name.includes('id renewal') || name.includes('id replacement') || !!service.requires_photo;
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
