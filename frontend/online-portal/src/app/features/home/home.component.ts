import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BarangayUpdate, PortalService, Service } from '../../core/services/portal.service';

@Component({
  selector: 'portal-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="relative overflow-hidden bg-gradient-to-b from-orange-50 via-white to-slate-50">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid gap-10 lg:grid-cols-2 items-center">
        <div class="space-y-6">
          <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wider">
            Remote Online Document Request
          </span>
          <h1 class="text-4xl sm:text-5xl font-black tracking-tight text-[#0f172a] leading-tight">
            Request barangay documents from home.
          </h1>
          <p class="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl">
            The Barangay San Manuel Online Portal lets verified residents submit document requests remotely,
            upload requirements, and monitor status — processed through the same system used by the kiosk.
          </p>
          <div class="flex flex-wrap gap-3">
            <a routerLink="/services"
               class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-sm shadow-lg transition">
              Browse Services
            </a>
            <a routerLink="/contact"
               class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-300 hover:border-orange-400 text-slate-800 font-bold text-sm transition">
              Contact Us
            </a>
          </div>
        </div>

        <div class="relative">
          <div class="rounded-3xl overflow-hidden border border-orange-200/70 shadow-xl">
            <img src="Barangay Hall.png" alt="Barangay San Manuel Hall"
                 class="w-full h-64 sm:h-80 object-cover" />
          </div>
          <div class="absolute -bottom-5 -left-4 bg-white border border-slate-200 rounded-2xl shadow-lg px-5 py-4">
            <p class="text-xs font-bold uppercase tracking-wider text-orange-600">Barangay ID Required</p>
            <p class="text-sm text-slate-600 mt-1">Online accounts are issued after Barangay ID approval.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="max-w-6xl mx-auto px-4 sm:px-6 py-14">
      <div class="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p class="text-xs font-black uppercase tracking-wider text-orange-600">Most requested</p>
          <h2 class="text-2xl sm:text-3xl font-black text-[#0f172a] mt-1">Popular services</h2>
          <p class="text-slate-500 mt-2 text-sm sm:text-base">Frequently requested barangay documents, ranked by recent request volume.</p>
        </div>
        <a routerLink="/services"
           class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-orange-400 text-slate-800 font-bold text-sm transition">
          View all services
          <span aria-hidden="true">&rarr;</span>
        </a>
      </div>

      @if (popularLoading()) {
        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          @for (i of [1, 2, 3, 4, 5, 6]; track i) {
            <div class="h-44 rounded-2xl bg-slate-100 animate-pulse"></div>
          }
        </div>
      } @else if (popularError()) {
        <div class="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <p class="font-bold text-sm">Unable to load popular services right now.</p>
          <p class="text-sm mt-1">You can still browse the full list on the Services page.</p>
          <a routerLink="/services" class="inline-flex mt-3 font-bold text-sm text-orange-700 hover:underline">
            View all services &rarr;
          </a>
        </div>
      } @else {
        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          @for (service of popularServices(); track service.service_id) {
            <article class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col">
              <div class="flex items-start justify-between gap-3">
                <h3 class="font-black text-lg text-[#0f172a]">{{ service.service_name }}</h3>
                @if (service.request_count) {
                  <span class="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold whitespace-nowrap"
                        [attr.aria-label]="service.request_count + ' requests'">
                    {{ service.request_count }} req
                  </span>
                }
              </div>
              @if (service.description) {
                <p class="text-sm text-slate-500 mt-2 leading-relaxed line-clamp-3">{{ service.description }}</p>
              }
              <div class="mt-auto pt-5 flex items-center justify-between gap-3">
                <span class="text-sm font-bold text-slate-700">
                  ₱{{ service.processing_fee | number:'1.2-2' }}
                </span>
                <a routerLink="/services"
                   class="text-sm font-bold text-orange-700 hover:text-orange-800 transition">
                  View details &rarr;
                </a>
              </div>
            </article>
          } @empty {
            <div class="col-span-full rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              No popular services to show yet.
            </div>
          }
        </div>
      }
    </section>

    <section class="bg-white border-y border-slate-200">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div class="text-center max-w-2xl mx-auto mb-10">
          <p class="text-xs font-black uppercase tracking-wider text-orange-600">Stay informed</p>
          <h2 class="text-2xl sm:text-3xl font-black text-[#0f172a] mt-1">Barangay updates &amp; information</h2>
          <p class="text-slate-500 mt-2 text-sm sm:text-base">
            Announcements, notices, and portal guidance from Barangay San Manuel.
          </p>
        </div>

        @if (updates().length) {
          <div class="grid gap-5 sm:grid-cols-2">
            @for (update of updates(); track update.id) {
              <article class="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-xs flex flex-col"
                       [class.ring-2]="update.is_pinned"
                       [class.ring-orange-300]="update.is_pinned">
                <div class="flex items-start justify-between gap-3">
                  <span class="inline-flex px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider"
                        [ngClass]="categoryClasses(update.category)">
                    {{ update.category }}
                  </span>
                  @if (update.is_pinned) {
                    <span class="text-[11px] font-black uppercase tracking-wider text-orange-600">Pinned</span>
                  }
                </div>
                <h3 class="mt-4 font-black text-[#0f172a] text-lg leading-snug">{{ update.title }}</h3>
                <p class="mt-2 text-sm text-slate-600 leading-relaxed">{{ update.summary }}</p>
                @if (update.published_at) {
                  <p class="mt-4 text-xs text-slate-400">{{ update.published_at }}</p>
                }
              </article>
            }
          </div>
        } @else {
          <div class="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
            No barangay updates available right now.
          </div>
        }

        <div class="mt-8 grid gap-4 sm:grid-cols-3">
          <div class="rounded-2xl bg-orange-50 border border-orange-200 p-5">
            <p class="text-[11px] font-black uppercase tracking-wider text-orange-700">Office</p>
            <p class="mt-1 font-bold text-slate-900">Barangay San Manuel</p>
            <p class="text-sm text-orange-900/80 mt-1 leading-relaxed">City of San Jose del Monte, Bulacan</p>
          </div>
          <div class="rounded-2xl bg-orange-50 border border-orange-200 p-5">
            <p class="text-[11px] font-black uppercase tracking-wider text-orange-700">Office hours</p>
            <p class="mt-1 text-sm text-orange-900/80 leading-relaxed">
              Contact the barangay office during business hours for document verification and releases.
            </p>
          </div>
          <div class="rounded-2xl bg-orange-50 border border-orange-200 p-5">
            <p class="text-[11px] font-black uppercase tracking-wider text-orange-700">Portal access</p>
            <p class="mt-1 text-sm text-orange-900/80 leading-relaxed">
              Don't have an account? Apply for a Barangay ID to activate online portal access.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="max-w-6xl mx-auto px-4 sm:px-6 py-14">
      <div class="grid gap-8 md:grid-cols-3">
        <div>
          <h3 class="font-black text-[#0f172a] text-lg">Same centralized system</h3>
          <p class="text-sm text-slate-500 mt-2 leading-relaxed">Online and kiosk requests share one resident, transaction, and document workflow.</p>
        </div>
        <div>
          <h3 class="font-black text-[#0f172a] text-lg">Digital requirements</h3>
          <p class="text-sm text-slate-500 mt-2 leading-relaxed">Upload PDF, JPG, or PNG files instead of visiting the barangay for every submission.</p>
        </div>
        <div>
          <h3 class="font-black text-[#0f172a] text-lg">Status monitoring</h3>
          <p class="text-sm text-slate-500 mt-2 leading-relaxed">Follow your request from Submitted through Ready for Release in My Requests.</p>
        </div>
      </div>
    </section>
  `
})
export class HomeComponent implements OnInit {
  popularServices = signal<Service[]>([]);
  popularLoading = signal(true);
  popularError = signal(false);
  updates = signal<BarangayUpdate[]>([]);

  constructor(private portalService: PortalService) {}

  ngOnInit(): void {
    this.portalService.getPopularServices(6).subscribe({
      next: (res) => {
        const list = Array.isArray(res?.data) ? res.data : [];
        this.popularServices.set(list.filter(s => s.is_active !== false));
        this.popularLoading.set(false);
      },
      error: () => {
        this.popularError.set(true);
        this.popularLoading.set(false);
      }
    });

    this.portalService.getBarangayUpdates().subscribe({
      next: (res) => {
        const list = Array.isArray(res?.data) ? res.data : [];
        this.updates.set(
          [...list].sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned))
        );
      },
      error: () => this.updates.set([])
    });
  }

  categoryClasses(category: BarangayUpdate['category']): string {
    switch (category) {
      case 'announcement':
        return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'notice':
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      default:
        return 'bg-slate-200 text-slate-700 border border-slate-300';
    }
  }
}
