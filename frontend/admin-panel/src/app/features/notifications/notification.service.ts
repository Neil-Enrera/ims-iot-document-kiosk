import { Injectable, signal, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Observable, Subject } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface Notification {
  notification_id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  reference_type?: string;
  reference_id?: number;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  unreadCount = signal(0);
  isConnected = signal(false);
  private eventSource: EventSource | null = null;
  private notification$ = new Subject<Notification>();
  private sseEvent$ = new Subject<any>();
  private reconnectTimer: any = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private readonly BASE_RECONNECT_DELAY = 2000;
  private seenNotificationIds = new Set<number>();

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  private buildSseUrl(): string {
    const token = this.auth.getToken();
    const baseUrl = environment.apiUrl;
    const origin = baseUrl.startsWith('http') ? baseUrl.split('/api/')[0] : (isPlatformBrowser(this.platformId) ? window.location.origin : '');
    return `${origin}/api/v1/notifications/stream?token=${token}`;
  }

  /**
   * Connect to the SSE stream for real-time notifications.
   * Call this once when the app initializes (e.g., in LayoutComponent).
   */
  connectSSE() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.eventSource) return; // Already connected
    if (!this.auth.getToken()) return;

    this.reconnectAttempts = 0;

    const url = this.buildSseUrl();

    try {
      this.eventSource = new EventSource(url);
    } catch (e) {
      console.error('Failed to create EventSource:', e);
      return;
    }

    this.eventSource.addEventListener('connected', (event) => {
      try {
        this.isConnected.set(true);
        this.reconnectAttempts = 0;
        console.log('SSE connected:', JSON.parse(event.data));
        // Catch-up: fetch latest unread count on successful connect/reconnect
        this.refreshUnreadCount();
      } catch (e) {
        console.error('Error parsing connected event:', e);
      }
    });

    this.eventSource.addEventListener('notification', (event) => {
      try {
        const notification: Notification = JSON.parse(event.data);
        // Dedup: skip if we've already seen this notification
        if (this.seenNotificationIds.has(notification.notification_id)) {
          return;
        }
        this.seenNotificationIds.add(notification.notification_id);
        this.notification$.next(notification);
        this.sseEvent$.next({ type: 'notification', data: notification });
        // Increment unread count optimistically
        this.unreadCount.update(c => c + 1);
      } catch (e) {
        console.error('Error parsing notification event:', e);
      }
    });

    this.eventSource.addEventListener('unread-count', (event) => {
      try {
        const data = JSON.parse(event.data);
        this.unreadCount.set(data.count);
        this.sseEvent$.next({ type: 'unread-count', data });
      } catch (e) {
        console.error('Error parsing unread-count event:', e);
      }
    });

    this.eventSource.addEventListener('unread-count-changed', () => {
      this.refreshUnreadCount();
    });

    // Listen for request status changes
    ['request-created', 'request-status-changed', 'request-approved', 'request-rejected', 'request-cancelled', 'request-released', 'request-updated'].forEach(eventType => {
      this.eventSource?.addEventListener(eventType, (event) => {
        try {
          const data = JSON.parse(event.data);
          this.sseEvent$.next({ type: eventType, data });
        } catch (e) {
          console.error(`Error parsing ${eventType} event:`, e);
        }
      });
    });

    this.eventSource.onerror = () => {
      this.isConnected.set(false);
      this.eventSource?.close();
      this.eventSource = null;

      if (!isPlatformBrowser(this.platformId)) return;
      if (!this.auth.getToken()) {
        console.warn('SSE: No auth token. Not reconnecting.');
        return;
      }

      this.reconnectAttempts++;
      const delay = Math.min(this.BASE_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts - 1), 30000);
      console.log(`SSE: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`);
      this.reconnectTimer = setTimeout(() => this.connectSSE(), delay);
    };
  }

  /**
   * Disconnect from the SSE stream.
   */
  disconnectSSE() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.isConnected.set(false);
    }
    this.reconnectAttempts = 0;
    this.seenNotificationIds.clear();
  }

  /**
   * Subscribe to incoming notifications.
   */
  onNotification(): Observable<Notification> {
    return this.notification$.asObservable();
  }

  /**
   * Subscribe to all SSE events (notifications + request status changes).
   */
  get sse$(): Observable<any> {
    return this.sseEvent$.asObservable();
  }

  getAll(page = 1, limit = 20, unreadOnly = false): Observable<any> {
    let params = `?page=${page}&limit=${limit}`;
    if (unreadOnly) params += '&unreadOnly=true';
    return this.api.get(`/notifications${params}`);
  }

  getById(id: number): Observable<any> {
    return this.api.get(`/notifications/${id}`);
  }

  markAsRead(id: number): Observable<any> {
    // Optimistically decrement unread count
    this.unreadCount.update(c => Math.max(0, c - 1));
    return this.api.patch(`/notifications/${id}/read`, {});
  }

  markAllAsRead(): Observable<any> {
    // Optimistically set unread count to 0
    this.unreadCount.set(0);
    return this.api.patch('/notifications/read-all', {});
  }

  delete(id: number): Observable<any> {
    return this.api.delete(`/notifications/${id}`);
  }

  refreshUnreadCount() {
    this.api.get('/notifications/unread-count').subscribe({
      next: (result: any) => {
        if (result?.data?.count !== undefined) {
          this.unreadCount.set(result.data.count);
        }
      },
      error: () => {}
    });
  }

  navigateToReference(notification: Notification) {
    if (notification.reference_type === 'request' && notification.reference_id) {
      this.router.navigate(['/requests'], { queryParams: { requestId: notification.reference_id } });
    }
    // Can be extended for other reference types
  }
}
