import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService, RequestService } from '../../shared/services';
import { NotificationService } from '../notifications/notification.service';
import { SpinnerComponent } from '../../shared/components/spinner.component';
import { DocumentRequest } from '../../shared/interfaces/api.interfaces';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SpinnerComponent, RouterLink],
  template: `
    <div class="space-y-6">
      <!-- Dashboard Header -->
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Good {{ greeting() }}, {{ displayName() }}!</h1>
          <p class="text-sm text-slate-500 mt-1">Here's what's happening in Barangay San Manuel today.</p>
        </div>
        <div class="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
          <svg class="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <span class="text-sm font-semibold text-slate-700">{{ todayLabel }}</span>
        </div>
      </div>

      @if (loading()) {
        <div class="py-16"><app-spinner /></div>
      } @else {
        <!-- Summary Cards -->
        <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
          @for (card of stats(); track card.key) {
            <a
              [routerLink]="card.route"
              [queryParams]="card.params"
              class="group bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:border-orange-300 hover:shadow-md transition"
            >
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 {{ card.iconBg }} {{ card.iconColor }}">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                    @switch (card.key) {
                      @case ('residents') {
                        <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                      }
                      @case ('requests') {
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      }
                      @case ('pending') {
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      }
                      @case ('released') {
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      }
                      @case ('services') {
                        <path stroke-linecap="round" stroke-linejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      }
                      @case ('today') {
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      }
                    }
                  </svg>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-xs font-medium text-slate-500 truncate">{{ card.label }}</p>
                  <p class="text-2xl font-bold text-slate-900 leading-7 tabular-nums">{{ card.value }}</p>
                  <p class="text-[11px] text-slate-400 truncate mt-0.5">{{ card.sub }}</p>
                </div>
              </div>
            </a>
          }
        </div>

        <!-- Recent Requests + Quick Actions -->
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          <!-- Recent Requests -->
          <section class="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <header class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 class="text-base font-semibold text-slate-900">Recent Requests</h2>
              <a routerLink="/requests" class="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 transition">
                View All
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </a>
            </header>

            @if (recentLoading()) {
              <div class="p-8 text-center text-sm text-slate-400">Loading recent requests...</div>
            } @else if (recentRequests().length === 0) {
              <div class="p-8 text-center text-sm text-slate-400">No requests have been submitted yet.</div>
            } @else {
              <ul class="divide-y divide-slate-100">
                @for (req of recentRequests(); track req.request_id) {
                  <li>
                    <a
                      routerLink="/requests"
                      [queryParams]="{ requestId: req.request_id }"
                      class="flex items-center gap-4 px-5 py-3.5 hover:bg-orange-50/60 transition w-full text-left"
                    >
                      <div class="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between gap-2">
                          <p class="font-semibold text-slate-900 text-sm truncate">{{ req.request_number }}</p>
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex-shrink-0 {{ statusStyle(req).cls }}">
                            {{ statusStyle(req).label }}
                          </span>
                        </div>
                        <p class="text-sm text-slate-500 truncate">{{ req.service_name }}</p>
                        <p class="text-xs text-slate-400 mt-0.5 truncate">{{ req.resident_name }} · {{ formatRequestTime(req.request_date) }}</p>
                      </div>
                      <svg class="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                      </svg>
                    </a>
                  </li>
                }
              </ul>
              <footer class="mt-auto border-t border-slate-100">
                <a routerLink="/requests" class="block text-center text-sm font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50/60 py-3 transition">
                  View All Requests
                </a>
              </footer>
            }
          </section>

          <!-- Quick Actions -->
          <section class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 class="text-base font-semibold text-slate-900 mb-4">Quick Actions</h2>
            <div class="grid grid-cols-2 gap-3">
              @for (action of quickActions; track action.key) {
                <a
                  [routerLink]="action.route"
                  [queryParams]="action.params"
                  class="group relative rounded-xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50/60 p-3.5 transition"
                >
                  <span class="absolute top-3 right-3 text-orange-300 group-hover:text-orange-500 transition">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                  </span>
                  <div class="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center mb-2.5">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      @switch (action.key) {
                        @case ('resident') {
                          <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                        }
                        @case ('request') {
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 13h6M12 10v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        }
                        @case ('rfid') {
                          <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h3m-6 4h16a2 2 0 002-2V7a2 2 0 00-2-2H3a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                        }
                        @case ('report') {
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        }
                      }
                    </svg>
                  </div>
                  <p class="text-sm font-semibold text-slate-800 leading-tight">{{ action.title }}</p>
                  <p class="text-[11px] text-slate-500 mt-1 leading-snug">{{ action.desc }}</p>
                </a>
              }
            </div>
          </section>
        </div>
      }
    </div>
  `
})
export class DashboardComponent implements OnInit, OnDestroy {
  summary = signal<any>(null);
  loading = signal(true);
  recentRequests = signal<DocumentRequest[]>([]);
  recentLoading = signal(true);
  private sseSubscription: any = null;

  greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  });

  displayName = computed(() => this.auth.currentUser()?.role_name || 'Administrator');

  todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  stats = computed(() => {
    const s = this.summary() || {};
    return [
      { key: 'residents', label: 'Total Residents', value: s.totalResidents ?? 0, sub: 'Registered in the barangay', route: '/residents', params: undefined, iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
      { key: 'requests', label: 'Total Requests', value: s.totalRequests ?? 0, sub: 'All-time document requests', route: '/requests', params: undefined, iconBg: 'bg-slate-100', iconColor: 'text-slate-700' },
      { key: 'pending', label: 'Pending Requests', value: s.pendingRequests ?? 0, sub: 'Awaiting staff action', route: '/requests', params: { statusId: 1 }, iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
      { key: 'released', label: 'Released Requests', value: s.releasedRequests ?? 0, sub: 'Successfully released', route: '/requests', params: { statusId: 7 }, iconBg: 'bg-green-100', iconColor: 'text-green-600' },
      { key: 'services', label: 'Active Services', value: s.activeServices ?? 0, sub: 'Available at the kiosk', route: '/services', params: undefined, iconBg: 'bg-sky-100', iconColor: 'text-sky-600' },
      { key: 'today', label: "Today's Requests", value: s.todayRequests ?? 0, sub: 'Submitted today', route: '/requests', params: undefined, iconBg: 'bg-orange-100', iconColor: 'text-orange-700' }
    ];
  });

  quickActions = [
    { key: 'resident', title: 'Add Resident', desc: 'Register a new resident to the system.', route: '/residents', params: { new: 1 } },
    { key: 'request', title: 'New Request', desc: 'Create a new document request.', route: '/requests', params: { new: 1 } },
    { key: 'rfid', title: 'Register RFID Card', desc: 'Assign an RFID card to a resident.', route: '/rfid', params: { new: 1 } },
    { key: 'report', title: 'Generate Report', desc: 'View and export system reports.', route: '/reports' }
  ];

  constructor(
    public auth: AuthService,
    private dashboardService: DashboardService,
    private requestService: RequestService,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    this.loadSummary();
    this.loadRecentRequests();
    this.sseSubscription = this.notificationService.sse$.subscribe(event => {
      if (event?.type?.startsWith('request-') || event?.type?.startsWith('application-')) {
        this.loadSummary();
        this.loadRecentRequests();
      }
    });
  }

  ngOnDestroy() {
    if (this.sseSubscription) {
      this.sseSubscription.unsubscribe();
      this.sseSubscription = null;
    }
  }

  private loadSummary() {
    this.dashboardService.getSummary().subscribe({
      next: (res) => {
        this.summary.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private loadRecentRequests() {
    this.recentLoading.set(true);
    this.requestService.getAll({ page: 1, limit: 5, sortBy: 'request_id', sortOrder: 'DESC' }).subscribe({
      next: (res) => {
        this.recentRequests.set(res.data || []);
        this.recentLoading.set(false);
      },
      error: () => this.recentLoading.set(false)
    });
  }

  statusStyle(req: DocumentRequest): { label: string; cls: string } {
    switch (req.status_id) {
      case 1: return { label: 'Pending', cls: 'bg-orange-100 text-orange-700' };
      case 2: return { label: 'Waiting', cls: 'bg-amber-100 text-amber-700' };
      case 3: return { label: 'Requirements Received', cls: 'bg-amber-100 text-amber-700' };
      case 4: return { label: 'Under Review', cls: 'bg-sky-100 text-sky-700' };
      case 5: return { label: 'Processing', cls: 'bg-indigo-100 text-indigo-700' };
      case 6: return { label: 'Ready for Release', cls: 'bg-cyan-100 text-cyan-700' };
      case 7: return { label: 'Released', cls: 'bg-green-100 text-green-700' };
      case 8: return { label: 'Rejected', cls: 'bg-red-100 text-red-700' };
      default: return { label: req.status_name || 'Cancelled', cls: 'bg-slate-100 text-slate-600' };
    }
  }

  formatRequestTime(value: string): string {
    if (!value) return '-';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '-';
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((startOfToday.getTime() - startOfDay.getTime()) / 86400000);
    if (diffDays === 0) return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}