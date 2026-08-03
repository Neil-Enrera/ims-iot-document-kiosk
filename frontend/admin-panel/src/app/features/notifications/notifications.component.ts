import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { NotificationService, Notification } from './notification.service';
import { TableColumn } from '../../shared/components/table.component';
import { ButtonComponent } from '../../shared/components/button.component';
import { CardComponent } from '../../shared/components/card.component';
import { InputComponent } from '../../shared/components/input.component';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [ButtonComponent, CardComponent, InputComponent, PaginationComponent, ConfirmDialogComponent, DatePipe],
  template: `
    <div>
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Notifications</h1>
        <app-button variant="secondary" (onClick)="markAllRead()">Mark All Read</app-button>
      </div>

      <app-card>
        <div class="mb-4 flex gap-4">
          <div class="flex-1">
            <app-input placeholder="Search notifications..." [value]="search()" (valueChange)="onSearch($event)" />
          </div>
          <select class="border rounded px-3 py-2 text-sm" (change)="onFilterChange($event)">
            <option value="">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>

        <div class="space-y-2">
          @for (notif of notifications(); track notif.notification_id) {
            <div class="flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer"
                 [class]="notif.is_read ? 'bg-white border-gray-200 hover:bg-gray-50' : 'bg-blue-50 border-blue-200 hover:bg-blue-100'"
                 (click)="onNotificationClick(notif)">
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <span class="w-3 h-3 rounded-full flex-shrink-0"
                      [class]="notif.is_read ? 'bg-gray-300' : 'bg-blue-500'"></span>
                <div class="min-w-0">
                  <div class="font-medium text-gray-800 truncate">{{ notif.title }}</div>
                  <div class="text-sm text-gray-500 truncate">{{ notif.message }}</div>
                  <div class="text-xs text-gray-400 mt-1">{{ notif.created_at | date:'medium' }}</div>
                </div>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <span class="px-2 py-1 text-xs rounded-full"
                      [class]="getTypeClass(notif.type)">{{ notif.type }}</span>
                @if (!notif.is_read) {
                  <app-button variant="secondary" size="sm" (onClick)="$event.stopPropagation(); markRead(notif)">Read</app-button>
                }
                <app-button variant="danger" size="sm" (onClick)="$event.stopPropagation(); deleteNotif(notif)">Delete</app-button>
              </div>
            </div>
          } @empty {
            <div class="text-center py-8 text-gray-500">No notifications found</div>
          }
        </div>

        @if (total() > limit) {
          <app-pagination
            [total]="total()"
            [currentPage]="page()"
            [limit]="limit"
            (onPageChange)="onPageChange($event)" />
        }
      </app-card>

      <app-confirm-dialog
        [open]="showDeleteConfirm()"
        title="Delete Notification"
        message="Are you sure you want to delete this notification?"
        confirmText="Delete"
        variant="danger"
        (onCancel)="showDeleteConfirm.set(false)"
        (onConfirm)="confirmDelete()"
      />
    </div>
  `
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications = signal<Notification[]>([]);
  loading = signal(true);
  search = signal('');
  filter = signal('');
  page = signal(1);
  limit = 20;
  total = signal(0);

  showDeleteConfirm = signal(false);
  deletingNotif = signal<Notification | null>(null);

  private notificationSub: any;

  columns: TableColumn[] = [
    { key: 'title', label: 'Title' },
    { key: 'message', label: 'Message' },
    { key: 'type', label: 'Type' },
    { key: 'created_at', label: 'Date' },
  ];

  constructor(private notifService: NotificationService) {}

  ngOnInit() {
    this.loadNotifications();
    // Auto-refresh when new notification arrives via SSE
    this.notificationSub = this.notifService.onNotification().subscribe(() => {
      this.loadNotifications();
    });
  }

  ngOnDestroy() {
    if (this.notificationSub) {
      this.notificationSub.unsubscribe();
    }
  }

  loadNotifications() {
    this.loading.set(true);
    const unreadOnly = this.filter() === 'unread';
    this.notifService.getAll(this.page(), this.limit, unreadOnly).subscribe({
      next: (result: any) => {
        this.notifications.set(result?.data || []);
        this.total.set(result?.pagination?.total || 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch(value: string) {
    this.search.set(value);
    this.page.set(1);
    this.loadNotifications();
  }

  onFilterChange(event: Event) {
    this.filter.set((event.target as HTMLSelectElement).value);
    this.page.set(1);
    this.loadNotifications();
  }

  onPageChange(newPage: number) {
    this.page.set(newPage);
    this.loadNotifications();
  }

  onNotificationClick(notif: Notification) {
    if (!notif.is_read) {
      this.markRead(notif);
    }
    this.notifService.navigateToReference(notif);
  }

  markRead(notif: Notification) {
    this.notifService.markAsRead(notif.notification_id).subscribe({
      next: () => this.loadNotifications()
    });
  }

  markAllRead() {
    this.notifService.markAllAsRead().subscribe({
      next: () => this.loadNotifications()
    });
  }

  deleteNotif(notif: Notification) {
    this.deletingNotif.set(notif);
    this.showDeleteConfirm.set(true);
  }

  confirmDelete() {
    const notif = this.deletingNotif();
    if (notif) {
      this.notifService.delete(notif.notification_id).subscribe({
        next: () => {
          this.showDeleteConfirm.set(false);
          this.loadNotifications();
        }
      });
    }
  }

  getTypeClass(type: string): string {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-700';
      case 'warning': return 'bg-yellow-100 text-yellow-700';
      case 'error': return 'bg-red-100 text-red-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  }
}
