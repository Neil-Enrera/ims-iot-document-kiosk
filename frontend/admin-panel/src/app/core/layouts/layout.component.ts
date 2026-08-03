import { Component, signal, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService, Notification } from '../../features/notifications/notification.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-screen bg-gray-100">
      <!-- Sidebar -->
      <aside class="w-64 bg-blue-800 text-white flex flex-col flex-shrink-0 sidebar-responsive">
        <div class="p-4 border-b border-blue-700">
          <h1 class="text-lg font-bold">Barangay San Manuel</h1>
          <p class="text-xs text-blue-200">IMS Kiosk</p>
        </div>
        <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
          <a routerLink="/dashboard" routerLinkActive="bg-blue-700"
             class="block px-3 py-2 rounded hover:bg-blue-700 transition">Dashboard</a>
          <a routerLink="/residents" routerLinkActive="bg-blue-700"
             class="block px-3 py-2 rounded hover:bg-blue-700 transition">Residents</a>
          <a routerLink="/requests" routerLinkActive="bg-blue-700"
             class="block px-3 py-2 rounded hover:bg-blue-700 transition">Requests</a>
          <a routerLink="/applications" routerLinkActive="bg-blue-700"
             class="block px-3 py-2 rounded hover:bg-blue-700 transition">Barangay ID Apps</a>
          <a routerLink="/services" routerLinkActive="bg-blue-700"
             class="block px-3 py-2 rounded hover:bg-blue-700 transition">Services</a>
          <a routerLink="/rfid" routerLinkActive="bg-blue-700"
             class="block px-3 py-2 rounded hover:bg-blue-700 transition">RFID Cards</a>
          <a routerLink="/notifications" routerLinkActive="bg-blue-700"
             class="block px-3 py-2 rounded hover:bg-blue-700 transition">Notifications</a>
          <a routerLink="/files" routerLinkActive="bg-blue-700"
             class="block px-3 py-2 rounded hover:bg-blue-700 transition">Files</a>
          @if (auth.isAdmin()) {
            <a routerLink="/users" routerLinkActive="bg-blue-700"
               class="block px-3 py-2 rounded hover:bg-blue-700 transition">Users</a>
            <a routerLink="/reports" routerLinkActive="bg-blue-700"
               class="block px-3 py-2 rounded hover:bg-blue-700 transition">Reports</a>
            <a routerLink="/settings" routerLinkActive="bg-blue-700"
               class="block px-3 py-2 rounded hover:bg-blue-700 transition">Settings</a>
            <a routerLink="/audit" routerLinkActive="bg-blue-700"
               class="block px-3 py-2 rounded hover:bg-blue-700 transition">Audit Logs</a>
          }
        </nav>
        <div class="p-4 border-t border-blue-700">
          <p class="text-xs text-blue-200">{{ auth.currentUser()?.first_name }} {{ auth.currentUser()?.last_name }}</p>
          <button (click)="auth.logout()" class="mt-2 text-sm text-blue-200 hover:text-white">Logout</button>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col overflow-hidden min-w-0">
        <header class="h-14 bg-white border-b flex items-center justify-between px-4 md:px-6 shadow-sm">
          <button class="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded" (click)="toggleSidebar()">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <h2 class="text-gray-700 font-medium hidden sm:block">IMS Document Request Services</h2>
          <div class="flex items-center gap-4">
            <a routerLink="/notifications" class="relative p-2 text-gray-600 hover:bg-gray-100 rounded">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
              @if (notifService.unreadCount() > 0) {
                <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {{ notifService.unreadCount() > 99 ? '99+' : notifService.unreadCount() }}
                </span>
              }
            </a>
            <span class="text-sm text-gray-500 hidden sm:inline">{{ auth.currentUser()?.role_name }}</span>
          </div>
        </header>
        <main class="flex-1 overflow-y-auto p-4 md:p-6">
          <router-outlet />
        </main>
      </div>
    </div>

    @if (sidebarOpen()) {
      <div class="fixed inset-0 z-40 md:hidden">
        <div class="absolute inset-0 bg-black/50" (click)="toggleSidebar()"></div>
        <aside class="absolute left-0 top-0 h-full w-64 bg-blue-800 text-white flex flex-col">
          <div class="p-4 border-b border-blue-700 flex justify-between items-center">
            <h1 class="text-lg font-bold">Barangay San Manuel</h1>
            <button (click)="toggleSidebar()" class="text-white p-1">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
            <a routerLink="/dashboard" routerLinkActive="bg-blue-700" (click)="toggleSidebar()"
               class="block px-3 py-2 rounded hover:bg-blue-700 transition">Dashboard</a>
            <a routerLink="/residents" routerLinkActive="bg-blue-700" (click)="toggleSidebar()"
               class="block px-3 py-2 rounded hover:bg-blue-700 transition">Residents</a>
            <a routerLink="/requests" routerLinkActive="bg-blue-700" (click)="toggleSidebar()"
               class="block px-3 py-2 rounded hover:bg-blue-700 transition">Requests</a>
            <a routerLink="/applications" routerLinkActive="bg-blue-700" (click)="toggleSidebar()"
               class="block px-3 py-2 rounded hover:bg-blue-700 transition">Barangay ID Apps</a>
            <a routerLink="/services" routerLinkActive="bg-blue-700" (click)="toggleSidebar()"
               class="block px-3 py-2 rounded hover:bg-blue-700 transition">Services</a>
            <a routerLink="/rfid" routerLinkActive="bg-blue-700" (click)="toggleSidebar()"
               class="block px-3 py-2 rounded hover:bg-blue-700 transition">RFID Cards</a>
            <a routerLink="/notifications" routerLinkActive="bg-blue-700" (click)="toggleSidebar()"
               class="block px-3 py-2 rounded hover:bg-blue-700 transition">Notifications</a>
            <a routerLink="/files" routerLinkActive="bg-blue-700" (click)="toggleSidebar()"
               class="block px-3 py-2 rounded hover:bg-blue-700 transition">Files</a>
            @if (auth.isAdmin()) {
              <a routerLink="/users" routerLinkActive="bg-blue-700" (click)="toggleSidebar()"
                 class="block px-3 py-2 rounded hover:bg-blue-700 transition">Users</a>
              <a routerLink="/reports" routerLinkActive="bg-blue-700" (click)="toggleSidebar()"
                 class="block px-3 py-2 rounded hover:bg-blue-700 transition">Reports</a>
              <a routerLink="/settings" routerLinkActive="bg-blue-700" (click)="toggleSidebar()"
                 class="block px-3 py-2 rounded hover:bg-blue-700 transition">Settings</a>
              <a routerLink="/audit" routerLinkActive="bg-blue-700" (click)="toggleSidebar()"
                 class="block px-3 py-2 rounded hover:bg-blue-700 transition">Audit Logs</a>
            }
          </nav>
          <div class="p-4 border-t border-blue-700">
            <p class="text-xs text-blue-200">{{ auth.currentUser()?.first_name }} {{ auth.currentUser()?.last_name }}</p>
            <button (click)="auth.logout()" class="mt-2 text-sm text-blue-200 hover:text-white">Logout</button>
          </div>
        </aside>
      </div>
    }
  `,
  styles: [`
    @media (max-width: 767px) {
      .sidebar-responsive {
        display: none;
      }
    }
  `]
})
export class LayoutComponent implements OnInit, OnDestroy {
  sidebarOpen = signal(false);
  private notificationSub: any;
  private isBrowser: boolean;

  constructor(public auth: AuthService, public notifService: NotificationService, @Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    if (!this.isBrowser) return;

    // Initial fetch of unread count
    this.notifService.refreshUnreadCount();

    // Connect to SSE for real-time notifications
    this.notifService.connectSSE();

    // Subscribe to incoming notifications (optional: show toast/snackbar)
    this.notificationSub = this.notifService.onNotification().subscribe((notif) => {
      console.log('New notification received:', notif);
      // You could show a toast/snackbar here in the future
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
}
