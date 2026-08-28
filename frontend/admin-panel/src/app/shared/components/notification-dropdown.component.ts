import { Component, Input, Output, EventEmitter, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService, Notification } from '../../features/notifications/notification.service';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative">
      <!-- Bell Button -->
      <button
        type="button"
        (click)="toggleDropdown()"
        class="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition"
        aria-label="Notifications"
        aria-expanded="isOpen()"
        aria-haspopup="true">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>
        @if (unreadCount() > 0) {
          <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-medium">
            {{ unreadCount() > 99 ? '99+' : unreadCount() }}
          </span>
        }
      </button>

      <!-- Dropdown Panel -->
      @if (isOpen()) {
        <div class="fixed right-2 sm:right-4 top-14 z-50 w-96 max-w-[calc(100vw-1rem)] bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 class="text-lg font-semibold text-gray-900">Notifications</h3>
            <div class="flex items-center gap-2">
              @if (unreadCount() > 0) {
                <button
                  type="button"
                  (click)="markAllAsRead()"
                  class="text-xs text-orange-600 hover:text-orange-800 font-medium px-2 py-1 rounded transition">
                  Mark all as read
                </button>
              }
            </div>
          </div>

          <!-- Notifications List -->
          <div class="max-h-96 overflow-y-auto">
            @if (isLoading()) {
              <div class="p-4 text-center text-gray-500">Loading...</div>
            } @else if (notifications().length === 0) {
              <div class="p-4 text-center text-gray-500">No notifications</div>
            } @else {
              <ul class="divide-y divide-gray-100">
                @for (notif of notifications(); track notif.notification_id) {
                  <li
                    (click)="handleClick(notif)"
                    class="p-4 hover:bg-gray-50 cursor-pointer transition"
                    [class.bg-orange-50]="!notif.is_read"
                    [class.ring-1]="!notif.is_read"
                    [class.ring-orange-200]="!notif.is_read">
                    <div class="flex items-start gap-3">
                      <!-- Unread indicator dot -->
                      @if (!notif.is_read) {
                        <div class="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                      } @else {
                        <div class="w-2 h-2 flex-shrink-0 mt-2"></div>
                      }
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900">{{ notif.title }}</p>
                        <p class="text-sm text-gray-600 mt-0.5">{{ notif.message }}</p>
                        <div class="flex items-center gap-2 mt-2 text-xs text-gray-400">
                          <span>{{ formatTime(notif.created_at) }}</span>
                          @if (notif.reference_type && notif.reference_id) {
                            <span class="px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded">{{ notif.reference_type }}</span>
                          }
                        </div>
                      </div>
                    </div>
                  </li>
                }
              </ul>
            }

            <!-- Load More / View All -->
            @if (hasMore()) {
              <div class="p-3 border-t border-gray-100 text-center">
                <button
                  type="button"
                  (click)="loadMore()"
                  class="text-sm text-orange-600 hover:text-orange-800 font-medium">
                  Load more
                </button>
              </div>
            }
          </div>
        </div>

        <!-- Backdrop for closing on outside click -->
        <div class="fixed inset-0 z-40" (click)="closeDropdown()"></div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class NotificationDropdownComponent implements OnInit, OnDestroy {
  private notifService = inject(NotificationService);
  private router = inject(Router);

  isOpen = signal(false);
  isLoading = signal(false);
  notifications = signal<Notification[]>([]);
  // Use computed signal to always reflect the service's unread count
  unreadCount = computed(() => this.notifService.unreadCount());
  currentPage = 1;
  hasMore = signal(true);

  ngOnInit() {
    this.loadNotifications();
    // Subscribe to SSE for real-time updates
    this.notifService.onNotification().subscribe(() => {
      this.refreshUnreadCount();
      if (this.isOpen()) {
        this.loadNotifications(true);
      }
    });
    // Subscribe to unread count changes from SSE
    this.notifService.sse$.subscribe((event) => {
      if (event?.type === 'unread-count') {
        this.notifService.unreadCount.set(event.data.count);
      }
    });
  }

  ngOnDestroy() {}

  toggleDropdown() {
    this.isOpen.update(v => !v);
    if (this.isOpen()) {
      this.loadNotifications(true);
    }
  }

  closeDropdown() {
    this.isOpen.set(false);
  }

  async loadNotifications(reset = false) {
    if (reset) {
      this.currentPage = 1;
      this.notifications.set([]);
      this.hasMore.set(true);
    }
    if (!this.hasMore()) return;

    this.isLoading.set(true);
    try {
      const result = await this.notifService.getAll(this.currentPage, 10).toPromise();
      const newNotifs = result?.data || [];
      if (reset || this.currentPage === 1) {
        this.notifications.set(newNotifs);
      } else {
        this.notifications.update(current => [...current, ...newNotifs]);
      }
      this.hasMore.set(newNotifs.length === 10);
      this.currentPage++;
    } catch (e) {
      console.error('Failed to load notifications:', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  loadMore() {
    this.loadNotifications(false);
  }

  refreshUnreadCount() {
    this.notifService.refreshUnreadCount();
  }

  async markAllAsRead() {
    await this.notifService.markAllAsRead().toPromise();
    this.notifications.update(list => list.map(n => ({ ...n, is_read: true })));
  }

  async handleClick(notif: Notification) {
    if (!notif.is_read) {
      try {
        await this.notifService.markAsRead(notif.notification_id).toPromise();
        this.notifications.update(list => list.map(n => n.notification_id === notif.notification_id ? { ...n, is_read: true } : n));
      } catch (e) {
        console.error('Failed to mark as read:', e);
      }
    }
    // Navigate to reference
    if (notif.reference_type === 'request' && notif.reference_id) {
      this.router.navigate(['/requests'], { queryParams: { requestId: notif.reference_id } });
      this.closeDropdown();
    } else if (notif.reference_type === 'application' && notif.reference_id) {
      this.router.navigate(['/applications'], { queryParams: { applicationId: notif.reference_id } });
      this.closeDropdown();
    } else if ((notif.reference_type === 'resident_update' || notif.reference_type === 'resident_update_request') && notif.reference_id) {
      this.router.navigate(['/residents'], { queryParams: { tab: 'updates', updateId: notif.reference_id } });
      this.closeDropdown();
    }
  }

  formatTime(iso: string): string {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}