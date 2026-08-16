import { Component, signal, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../features/notifications/notification.service';
import { NotificationDropdownComponent } from '../../shared/components/notification-dropdown.component';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NotificationDropdownComponent],
  template: `
    <div class="flex h-screen bg-[#F6F5F2]">
      <!-- Desktop Sidebar -->
      <aside class="hidden lg:flex w-64 flex-col bg-white border-r border-slate-200 flex-shrink-0">
        <!-- Brand -->
        <div class="h-14 flex items-center gap-3 px-5 border-b border-slate-100 flex-shrink-0">
          <div class="w-9 h-9 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
          <div class="leading-tight">
            <p class="font-bold text-slate-900 text-sm tracking-tight">Barangay San Manuel</p>
            <p class="text-[11px] text-slate-500 font-medium">IMS Kiosk</p>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          @for (item of navItems; track item.label) {
            <a
              [routerLink]="item.route"
              routerLinkActive="bg-orange-50 text-orange-700 font-semibold"
              [routerLinkActiveOptions]="{ exact: true }"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
            >
              <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                @switch (item.icon) {
                  @case ('dashboard') {
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10"/>
                  }
                  @case ('residents') {
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                  }
                  @case ('requests') {
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  }
                  @case ('applications') {
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h3m-6 4h16a2 2 0 002-2V7a2 2 0 00-2-2H3a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  }
                  @case ('services') {
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  }
                  @case ('rfid') {
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                  }
                  @case ('users') {
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  }
                  @case ('reports') {
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  }
                  @case ('settings') {
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  }
                  @case ('audit') {
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                  }
                }
              </svg>
              <span class="text-sm">{{ item.label }}</span>
            </a>
          }
        </nav>

        <!-- Logout -->
        <div class="p-3 border-t border-slate-100 flex-shrink-0">
          <button
            (click)="auth.logout()"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition"
          >
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            <span class="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col overflow-hidden min-w-0">
        <!-- Top Header -->
        <header class="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shadow-sm z-20 flex-shrink-0">
          <div class="flex items-center gap-3 min-w-0">
            <button
              class="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition flex-shrink-0"
              (click)="toggleSidebar()"
              aria-label="Toggle navigation"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
            <h2 class="text-slate-800 font-semibold text-[15px] truncate">IMS Document Request Services</h2>
          </div>

          <div class="flex items-center gap-2 md:gap-3">
            <app-notification-dropdown />
            <div class="h-8 w-px bg-slate-200 hidden sm:block"></div>

            <!-- Profile Dropdown -->
            <div class="relative">
              <button
                (click)="toggleProfile()"
                class="flex items-center gap-2.5 rounded-lg hover:bg-slate-50 px-2 py-1.5 transition"
                aria-expanded="profileOpen()"
                aria-haspopup="true"
              >
                <div class="w-9 h-9 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                </div>
                <div class="hidden md:block text-left leading-tight">
                  <p class="text-sm font-semibold text-slate-800">{{ auth.currentUser()?.first_name }} {{ auth.currentUser()?.last_name }}</p>
                  <p class="text-[11px] text-slate-500">{{ auth.currentUser()?.role_name }}</p>
                </div>
                <svg class="w-4 h-4 text-slate-400 hidden md:block" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>

              @if (profileOpen()) {
                <div class="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden z-30">
                  <div class="px-4 py-3 border-b border-slate-100">
                    <p class="text-sm font-semibold text-slate-900 truncate">{{ auth.currentUser()?.first_name }} {{ auth.currentUser()?.last_name }}</p>
                    <p class="text-xs text-slate-500 mt-0.5">{{ auth.currentUser()?.role_name }}</p>
                  </div>
                  <button
                    (click)="auth.logout()"
                    class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                    </svg>
                    <span class="text-sm font-medium">Logout</span>
                  </button>
                </div>
                <div class="fixed inset-0 z-20" (click)="toggleProfile()"></div>
              }
            </div>
          </div>
        </header>

        <main class="flex-1 overflow-y-auto p-4 md:p-6">
          <router-outlet />
        </main>
      </div>
    </div>

    <!-- Mobile / Tablet Sidebar Drawer -->
    @if (sidebarOpen()) {
      <div class="fixed inset-0 z-40 lg:hidden">
        <div class="absolute inset-0 bg-black/40" (click)="toggleSidebar()"></div>
        <aside class="absolute left-0 top-0 h-full w-72 bg-white border-r border-slate-200 flex flex-col shadow-xl">
          <div class="h-14 flex items-center gap-3 px-5 border-b border-slate-100 flex-shrink-0">
            <div class="w-9 h-9 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
            <div class="leading-tight flex-1">
              <p class="font-bold text-slate-900 text-sm tracking-tight">Barangay San Manuel</p>
              <p class="text-[11px] text-slate-500 font-medium">IMS Kiosk</p>
            </div>
            <button (click)="toggleSidebar()" class="p-1 text-slate-400 hover:text-slate-600" aria-label="Close navigation">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            @for (item of navItems; track item.label) {
              <a
                [routerLink]="item.route"
                routerLinkActive="bg-orange-50 text-orange-700 font-semibold"
                [routerLinkActiveOptions]="{ exact: true }"
                (click)="toggleSidebar()"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
              >
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                  @switch (item.icon) {
                    @case ('dashboard') {
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10"/>
                    }
                    @case ('residents') {
                      <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                    }
                    @case ('requests') {
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    }
                    @case ('applications') {
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h3m-6 4h16a2 2 0 002-2V7a2 2 0 00-2-2H3a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    }
                    @case ('services') {
                      <path stroke-linecap="round" stroke-linejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    }
                    @case ('rfid') {
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                    }
                    @case ('users') {
                      <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    }
                    @case ('reports') {
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                    }
                    @case ('settings') {
                      <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    }
                    @case ('audit') {
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                    }
                  }
                </svg>
                <span class="text-sm">{{ item.label }}</span>
              </a>
            }
          </nav>
          <div class="p-3 border-t border-slate-100 flex-shrink-0">
            <button
              (click)="auth.logout()"
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition"
            >
              <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              <span class="text-sm font-medium">Logout</span>
            </button>
          </div>
        </aside>
      </div>
    }
  `
})
export class LayoutComponent implements OnInit, OnDestroy {
  sidebarOpen = signal(false);
  profileOpen = signal(false);
  private notificationSub: any;
  private isBrowser: boolean;

  constructor(public auth: AuthService, public notifService: NotificationService, @Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  get navItems(): NavItem[] {
    const items: NavItem[] = [
      { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
      { label: 'Residents', route: '/residents', icon: 'residents' },
      { label: 'Requests', route: '/requests', icon: 'requests' },
      { label: 'Barangay ID Apps', route: '/applications', icon: 'applications' },
      { label: 'Services', route: '/services', icon: 'services' },
      { label: 'RFID Cards', route: '/rfid', icon: 'rfid' }
    ];
    if (this.auth.isAdmin()) {
      items.push(
        { label: 'Users', route: '/users', icon: 'users' },
        { label: 'Reports', route: '/reports', icon: 'reports' },
        { label: 'Settings', route: '/settings', icon: 'settings' },
        { label: 'Audit Logs', route: '/audit', icon: 'audit' }
      );
    }
    return items;
  }

  ngOnInit() {
    if (!this.isBrowser) return;

    // Initial fetch of unread count
    this.notifService.refreshUnreadCount();

    // Connect to SSE for real-time notifications with error boundary
    try {
      this.notifService.connectSSE();
    } catch (e) {
      console.error('Failed to connect SSE:', e);
    }

    // Subscribe to incoming notifications (optional: show toast/snackbar)
    this.notificationSub = this.notifService.onNotification().subscribe({
      next: (notif) => {
        console.log('New notification received:', notif);
      },
      error: (e) => {
        console.error('Notification subscription error:', e);
      }
    });
  }

  ngOnDestroy() {
    this.notifService.disconnectSSE();
    if (this.notificationSub) {
      this.notificationSub.unsubscribe();
    }
  }

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  toggleProfile() {
    this.profileOpen.update(v => !v);
  }
}