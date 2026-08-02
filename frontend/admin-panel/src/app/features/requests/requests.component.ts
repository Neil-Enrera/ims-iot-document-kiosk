import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RequestService } from '../../shared/services';
import { NotificationService } from '../notifications/notification.service';
import { DocumentRequest } from '../../shared/interfaces/api.interfaces';
import { TableComponent, TableColumn } from '../../shared/components/table.component';
import { CardComponent } from '../../shared/components/card.component';
import { InputComponent } from '../../shared/components/input.component';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { ButtonComponent } from '../../shared/components/button.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { RequestFormComponent } from './request-form.component';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [TableComponent, CardComponent, InputComponent, PaginationComponent, ButtonComponent, ModalComponent, ConfirmDialogComponent, RequestFormComponent],
  template: `
    <div>
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Document Requests</h1>
        <app-button variant="primary" (onClick)="showForm.set(true)">+ New Request</app-button>
      </div>

      <app-card>
        <div class="mb-4">
          <app-input placeholder="Search requests..." [value]="search()" (valueChange)="onSearch($event)" />
        </div>

        <app-table
          [columns]="columns"
          [data]="requests()"
          [loading]="loading()"
          [sortColumn]="sortColumn()"
          [sortDirection]="sortDirection()"
          trackBy="request_id"
          emptyMessage="No requests found"
          (onSort)="onSort($event)"
        />

        @if (total() > limit) {
          <app-pagination
            [total]="total()"
            [currentPage]="page()"
            [limit]="limit"
            (onPageChange)="onPageChange($event)"
          />
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

      <!-- Action Confirmation -->
      <app-confirm-dialog
        [open]="showActionConfirm()"
        [title]="actionTitle()"
        [message]="actionMessage()"
        [confirmText]="actionConfirmText()"
        [variant]="actionVariant()"
        (onCancel)="showActionConfirm.set(false)"
        (onConfirm)="confirmAction()"
      />
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

  showForm = signal(false);
  saving = signal(false);

  showActionConfirm = signal(false);
  selectedRequest = signal<DocumentRequest | null>(null);
  pendingAction = signal<'approve' | 'reject' | 'release' | null>(null);
  actionTitle = signal('');
  actionMessage = signal('');
  actionConfirmText = signal('');
  actionVariant = signal<'danger' | 'primary'>('primary');

  private sseSubscription: any = null;

  columns: TableColumn[] = [
    { key: 'request_number', label: 'Request #', sortable: true },
    { key: 'resident_name', label: 'Resident' },
    { key: 'service_name', label: 'Service' },
    { key: 'purpose', label: 'Purpose' },
    { key: 'status_name', label: 'Status', sortable: true },
    { key: 'request_date', label: 'Date', sortable: true }
  ];

  constructor(
    private requestService: RequestService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    // Check for requestId query param to open specific request
    this.route.queryParams.subscribe(params => {
      if (params['requestId']) {
        this.openRequestAction(parseInt(params['requestId']));
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
      // Auto-refresh on any request-related event
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

  openRequestAction(requestId: number) {
    // Find the request in current data or load it
    const request = this.requests().find(r => r.request_id === requestId);
    if (request) {
      // Default to approve action, but could be configurable
      this.openAction(request, 'approve');
    }
    // Clear the query param
    this.router.navigate([], { queryParams: { requestId: null }, queryParamsHandling: 'merge' });
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

  openAction(request: DocumentRequest, action: 'approve' | 'reject' | 'release') {
    this.selectedRequest.set(request);
    this.pendingAction.set(action);

    if (action === 'approve') {
      this.actionTitle.set('Approve Request');
      this.actionMessage.set(`Approve request ${request.request_number} for ${request.resident_name}?`);
      this.actionConfirmText.set('Approve');
      this.actionVariant.set('primary');
    } else if (action === 'reject') {
      this.actionTitle.set('Reject Request');
      this.actionMessage.set(`Reject request ${request.request_number}?`);
      this.actionConfirmText.set('Reject');
      this.actionVariant.set('danger');
    } else {
      this.actionTitle.set('Release Request');
      this.actionMessage.set(`Mark request ${request.request_number} as released?`);
      this.actionConfirmText.set('Release');
      this.actionVariant.set('primary');
    }

    this.showActionConfirm.set(true);
  }

  confirmAction() {
    const request = this.selectedRequest();
    const action = this.pendingAction();
    if (!request || !action) return;

    let obs;
    if (action === 'approve') obs = this.requestService.approve(request.request_id);
    else if (action === 'reject') obs = this.requestService.reject(request.request_id);
    else obs = this.requestService.release(request.request_id);

    obs.subscribe({
      next: () => {
        this.showActionConfirm.set(false);
        this.selectedRequest.set(null);
        this.pendingAction.set(null);
        this.loadRequests();
      },
      error: (err) => {
        alert(err.error?.message || 'Action failed.');
        this.showActionConfirm.set(false);
      }
    });
  }
}
