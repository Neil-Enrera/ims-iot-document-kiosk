import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../shared/services';
import { NotificationService } from '../notifications/notification.service';
import { CardComponent } from '../../shared/components/card.component';
import { SpinnerComponent } from '../../shared/components/spinner.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CardComponent, SpinnerComponent],
  template: `
    <div>
      <h1 class="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      @if (loading()) {
        <app-spinner />
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <app-card>
            <div class="text-center">
              <p class="text-sm text-gray-500">Total Residents</p>
              <p class="text-3xl font-bold text-blue-600">{{ summary()?.totalResidents ?? 0 }}</p>
            </div>
          </app-card>
          <app-card>
            <div class="text-center">
              <p class="text-sm text-gray-500">Total Requests</p>
              <p class="text-3xl font-bold text-green-600">{{ summary()?.totalRequests ?? 0 }}</p>
            </div>
          </app-card>
          <app-card>
            <div class="text-center">
              <p class="text-sm text-gray-500">Pending Requests</p>
              <p class="text-3xl font-bold text-yellow-600">{{ summary()?.pendingRequests ?? 0 }}</p>
            </div>
          </app-card>
          <app-card>
            <div class="text-center">
              <p class="text-sm text-gray-500">Released Requests</p>
              <p class="text-3xl font-bold text-purple-600">{{ summary()?.releasedRequests ?? 0 }}</p>
            </div>
          </app-card>
          <app-card>
            <div class="text-center">
              <p class="text-sm text-gray-500">Active Services</p>
              <p class="text-3xl font-bold text-indigo-600">{{ summary()?.activeServices ?? 0 }}</p>
            </div>
          </app-card>
          <app-card>
            <div class="text-center">
              <p class="text-sm text-gray-500">Today's Requests</p>
              <p class="text-3xl font-bold text-teal-600">{{ summary()?.todayRequests ?? 0 }}</p>
            </div>
          </app-card>
        </div>
      }
    </div>
  `
})
export class DashboardComponent implements OnInit, OnDestroy {
  summary = signal<any>(null);
  loading = signal(true);
  private sseSubscription: any = null;

  constructor(
    private dashboardService: DashboardService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadSummary();
    this.sseSubscription = this.notificationService.sse$.subscribe(event => {
      if (event?.type?.startsWith('request-')) {
        this.loadSummary();
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
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
