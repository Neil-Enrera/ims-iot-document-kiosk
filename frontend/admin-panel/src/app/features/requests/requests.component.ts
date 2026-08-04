import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RequestService } from '../../shared/services';
import { NotificationService } from '../notifications/notification.service';
import { DocumentRequest, RequestStatusHistory } from '../../shared/interfaces/api.interfaces';
import { TableComponent, TableColumn } from '../../shared/components/table.component';
import { CardComponent } from '../../shared/components/card.component';
import { InputComponent } from '../../shared/components/input.component';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { ButtonComponent } from '../../shared/components/button.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { RequestFormComponent } from './request-form.component';

interface RequestDetail extends DocumentRequest {
  history?: RequestStatusHistory[];
}

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [TableComponent, CardComponent, InputComponent, PaginationComponent, ButtonComponent, ModalComponent, RequestFormComponent],
  template: `
    <div>
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Document Requests</h1>
        <app-button variant="primary" (onClick)="showForm.set(true)">+ New Request</app-button>
      </div>

      <app-card>
        <div class="mb-4 flex flex-wrap items-center gap-4">
          <div class="flex-1 min-w-48">
            <app-input placeholder="Search requests..." [value]="search()" (valueChange)="onSearch($event)" />
          </div>
          <div class="w-56">
            <select
              [value]="statusFilter()"
              (change)="onStatusFilter($any($event.target).value)"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300">
              @for (opt of filterOptions; track opt.value) {
                <option [value]="opt.value">{{ opt.label }}</option>
              }
            </select>
          </div>
        </div>

        <app-table
          [columns]="columns"
          [data]="requests()"
          [loading]="loading()"
          [sortColumn]="sortColumn()"
          [sortDirection]="sortDirection()"
          trackBy="request_id"
          emptyMessage="No requests found"
          [cellTemplates]="{ status_name: statusCell }"
          [rowActionsTemplate]="rowActions"
          (onSort)="onSort($event)">

          <ng-template #statusCell let-status let-row="row">
            <select
              [value]="row.status_id"
              [disabled]="row.status_id === 7 || row.status_id === 8 || row.status_id === 9"
              (change)="onStatusChange($any($event.target).value, row); $event.stopPropagation()"
              class="w-full px-2 py-1.5 border rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 bg-white">
              @for (opt of statusOptions; track opt.value) {
                <option [value]="opt.value">{{ opt.label }}</option>
              }
            </select>
          </ng-template>

          <ng-template #rowActions let-request>
            <button
              type="button"
              (click)="viewDetails(request); $event.stopPropagation()"
              class="text-blue-600 hover:underline text-sm">View</button>
          </ng-template>
        </app-table>

        @if (total() > limit) {
          <app-pagination
            [total]="total()"
            [currentPage]="page()"
            [limit]="limit"
            (onPageChange)="onPageChange($event)" />
        }
      </app-card>

      <!-- New Request Modal -->
      <app-modal [open]="showForm()" title="New Document Request" (onClose)="showForm.set(false)">
        <app-request-form
          [loading]="saving()"
          (onSave)="onSave($event)"
          (onCancel)="showForm.set(false)"
        />
      </app-modal>

      <!-- Request Details Modal -->
      <app-modal [open]="showDetails()" [title]="selectedRequest()?.request_number || 'Request Details'" (onClose)="showDetails.set(false)">
        @if (selectedRequest(); as request) {
          <dl class="space-y-3 text-sm">
            <div class="grid grid-cols-3 gap-2">
              <dt class="text-gray-500 font-medium">Request Number</dt>
              <dd class="col-span-2 font-semibold text-gray-900">{{ request.request_number }}</dd>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <dt class="text-gray-500 font-medium">Resident</dt>
              <dd class="col-span-2 text-gray-900">{{ request.resident_name }} <span class="text-gray-400">({{ request.resident_code }})</span></dd>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <dt class="text-gray-500 font-medium">Service</dt>
              <dd class="col-span-2 text-gray-900">{{ request.service_name }}</dd>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <dt class="text-gray-500 font-medium">Date Submitted</dt>
              <dd class="col-span-2 text-gray-900">{{ formatDate(request.request_date) }}</dd>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <dt class="text-gray-500 font-medium">Current Status</dt>
              <dd class="col-span-2 text-gray-900">{{ request.status_name }}</dd>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <dt class="text-gray-500 font-medium">Assigned Staff</dt>
              <dd class="col-span-2 text-gray-900">{{ request.assigned_staff || '-' }}</dd>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <dt class="text-gray-500 font-medium">Purpose</dt>
              <dd class="col-span-2 text-gray-900">{{ request.purpose || '-' }}</dd>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <dt class="text-gray-500 font-medium">Notes</dt>
              <dd class="col-span-2 text-gray-900">{{ request.remarks || '-' }}</dd>
            </div>
          </dl>

          <h4 class="mt-6 mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">Status History</h4>
          @if (request.history && request.history.length > 0) {
            <ol class="border-l-2 border-gray-200 space-y-3 pl-4">
              @for (entry of request.history; track entry.history_id) {
                <li class="text-sm">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span class="font-medium text-gray-900">{{ entry.status_name }}</span>
                    <span class="text-gray-400">{{ formatDate(entry.changed_at) }}</span>
                  </div>
                  <p class="ml-4 text-gray-500">{{ entry.changed_by_name ? entry.changed_by_name : 'System' }}{{ entry.remarks ? ' — ' + entry.remarks : '' }}</p>
                </li>
              }
            </ol>
          } @else {
            <p class="text-sm text-gray-500">No status history recorded.</p>
          }
        }
      </app-modal>
    </div>
  `
})
export class RequestsComponent implements OnInit, OnDestroy {
  requests = signal<DocumentRequest[]>([]);
  loading = signal(true);
  search = signal('');
  page = signal(1);
  limit = 20;
  total = signal(0);
  sortColumn = signal('request_id');
  sortDirection = signal<'ASC' | 'DESC'>('DESC');
  statusFilter = signal('');

  showForm = signal(false);
  saving = signal(false);
  showDetails = signal(false);
  selectedRequest = signal<RequestDetail | null>(null);

  private sseSubscription: any = null;

  columns: TableColumn[] = [
    { key: 'request_number', label: 'Request #', sortable: true },
    { key: 'resident_name', label: 'Resident' },
    { key: 'service_name', label: 'Service' },
    { key: 'request_date', label: 'Date Submitted', sortable: true },
    { key: 'status_name', label: 'Status' },
    { key: 'remarks', label: 'Notes' }
  ];

  statusOptions = [
    { value: 1, label: 'Submitted' },
    { value: 2, label: 'Waiting for Requirements' },
    { value: 3, label: 'Requirements Received' },
    { value: 4, label: 'Under Review' },
    { value: 5, label: 'Document Processing' },
    { value: 6, label: 'Ready for Release' },
    { value: 7, label: 'Released' },
    { value: 8, label: 'Rejected' },
    { value: 9, label: 'Cancelled' }
  ];

  filterOptions = [
    { value: '', label: 'All Statuses' },
    ...this.statusOptions
  ];

  constructor(
    private requestService: RequestService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['requestId']) {
        const requestId = parseInt(params['requestId']);
        const request = this.requests().find(r => r.request_id === requestId);
        if (request) {
          this.viewDetails(request);
        }
        this.router.navigate([], { queryParams: { requestId: null }, queryParamsHandling: 'merge' });
      }
    });
    this.loadRequests();
    this.connectToRequestUpdates();
  }

  ngOnDestroy() {
    this.disconnectFromRequestUpdates();
  }

  private connectToRequestUpdates() {
    this.sseSubscription = this.notificationService.sse$.subscribe(event => {
      if (event?.type?.startsWith('request-')) {
        this.loadRequests();
      }
    });
  }

  private disconnectFromRequestUpdates() {
    if (this.sseSubscription) {
      this.sseSubscription.unsubscribe();
      this.sseSubscription = null;
    }
  }

  loadRequests() {
    this.loading.set(true);
    this.requestService.getAll({
      search: this.search(),
      statusId: this.statusFilter() || undefined,
      page: this.page(),
      limit: this.limit,
      sortBy: this.sortColumn(),
      sortOrder: this.sortDirection()
    }).subscribe({
      next: (res) => {
        this.requests.set(res.data);
        this.total.set(res.pagination.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch(value: string) {
    this.search.set(value);
    this.page.set(1);
    this.loadRequests();
  }

  onStatusFilter(value: string) {
    this.statusFilter.set(value);
    this.page.set(1);
    this.loadRequests();
  }

  onSort(column: string) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'ASC' ? 'DESC' : 'ASC');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('ASC');
    }
    this.loadRequests();
  }

  onPageChange(page: number) {
    this.page.set(page);
    this.loadRequests();
  }

  onSave(data: any) {
    this.saving.set(true);
    this.requestService.create(data).subscribe({
      next: () => {
        this.showForm.set(false);
        this.saving.set(false);
        this.loadRequests();
      },
      error: (err) => {
        this.saving.set(false);
        alert(err.error?.message || 'Failed to create request.');
      }
    });
  }

  onStatusChange(value: string, request: DocumentRequest) {
    const statusId = parseInt(value, 10);
    if (!statusId || statusId === request.status_id) return;

    this.requestService.changeStatus(request.request_id, statusId).subscribe({
      next: () => this.loadRequests(),
      error: (err) => {
        alert(err.error?.message || 'Failed to update status.');
        this.loadRequests();
      }
    });
  }

  viewDetails(request: DocumentRequest) {
    this.requestService.getById(request.request_id).subscribe({
      next: (res) => {
        this.selectedRequest.set(res.data as RequestDetail);
        this.showDetails.set(true);
      },
      error: () => {
        this.selectedRequest.set(request as RequestDetail);
        this.showDetails.set(true);
      }
    });
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '-';
    const date = new Date(value);
    return isNaN(date.getTime())
      ? value
      : date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }
}
