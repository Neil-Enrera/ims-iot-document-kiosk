import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortalService, Service } from '../../core/services/portal.service';

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
          Select a service to begin an online document request. Requirements and fees are configured by the barangay.
        </p>
      </div>

      @if (loading()) {
        <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          @for (i of [1,2,3]; track i) {
            <div class="h-48 rounded-2xl bg-slate-100 animate-pulse"></div>
          }
        </div>
      } @else if (error()) {
        <div class="mt-10 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <p class="font-bold">Unable to load services.</p>
          <p class="text-sm mt-1">{{ error() }}</p>
        </div>
      } @else {
        <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          @for (service of services(); track service.service_id) {
            <article class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col">
              <div class="flex items-start justify-between gap-3">
                <h2 class="font-black text-lg text-[#0f172a]">{{ service.service_name }}</h2>
                <span class="px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-xs font-bold whitespace-nowrap">
                  ₱{{ service.processing_fee | number:'1.2-2' }}
                </span>
              </div>

              @if (service.description) {
                <p class="text-sm text-slate-500 mt-2 leading-relaxed">{{ service.description }}</p>
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
              }

              <div class="mt-auto pt-5">
                <button type="button"
                        class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-sm transition"
                        disabled>
                  Request Online (Coming Soon)
                </button>
                <p class="text-[11px] text-slate-400 text-center mt-2">Login will be enabled in a later phase.</p>
              </div>
            </article>
          } @empty {
            <div class="col-span-full rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              No active services available right now.
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

  constructor(private portalService: PortalService) {}

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
}
