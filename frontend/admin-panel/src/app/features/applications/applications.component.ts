import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { NotificationService } from '../notifications/notification.service';
import { BarangayIdApplication } from '../../shared/interfaces/api.interfaces';
import { ApplicationService } from '../../shared/services';
import { TableComponent, TableColumn } from '../../shared/components/table.component';
import { CardComponent } from '../../shared/components/card.component';
import { InputComponent } from '../../shared/components/input.component';
import { SelectComponent } from '../../shared/components/select.component';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { ButtonComponent } from '../../shared/components/button.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { environment } from '../../../environments/environment';

type ApplicationRow = BarangayIdApplication & { full_name: string };

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [TableComponent, CardComponent, InputComponent, SelectComponent, PaginationComponent, ButtonComponent, ModalComponent, ConfirmDialogComponent],
  template: `
    <div>
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Barangay ID Applications</h1>
      </div>

      <app-card>
        <div class="flex flex-col md:flex-row gap-4 mb-4">
          <div class="flex-1">
            <app-input placeholder="Search applications..." [value]="search()" (valueChange)="onSearch($event)" />
          </div>
          <div class="w-full md:w-64">
            <app-select [options]="statusOptions" [value]="statusFilter()" (valueChange)="onStatusChange($event)" />
          </div>
        </div>

        <app-table
          [columns]="columns"
          [data]="applications()"
          [loading]="loading()"
          [sortColumn]="sortColumn()"
          [sortDirection]="sortDirection()"
          trackBy="application_id"
          emptyMessage="No applications found"
          (onSort)="onSort($event)"
          (onRowClick)="openDetail($event)"
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

      <!-- Application Detail Modal -->
      <app-modal [open]="showDetail()" [title]="selected()?.application_number || 'Application Details'" (onClose)="closeDetail()">
        @if (selected(); as app) {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2 flex items-center justify-between gap-4">
              <div>
                <p class="text-lg font-semibold text-gray-800">{{ app.full_name }}</p>
                <p class="text-sm text-gray-500">Submitted {{ app.created_at }}</p>
              </div>
              <span [class]="'px-3 py-1 rounded-full text-xs font-semibold ' + statusChipClass(app.status)">{{ app.status }}</span>
            </div>

            <div class="md:col-span-2 grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs uppercase tracking-wide text-gray-500 mb-1">Photo</p>
                @if (imageUrl(app.photo)) {
                  <img [src]="imageUrl(app.photo)" alt="Applicant photo" class="w-full h-40 object-cover rounded-lg border border-gray-200">
                } @else {
                  <p class="text-sm text-gray-400">No photo submitted</p>
                }
              </div>
              <div>
                <p class="text-xs uppercase tracking-wide text-gray-500 mb-1">Signature</p>
                @if (imageUrl(app.signature)) {
                  <img [src]="imageUrl(app.signature)" alt="Applicant signature" class="w-full h-40 object-contain bg-white rounded-lg border border-gray-200">
                } @else {
                  <p class="text-sm text-gray-400">No signature submitted</p>
                }
              </div>
            </div>

            <div class="md:col-span-2 border-t border-gray-200 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><p class="text-xs uppercase tracking-wide text-gray-500">Birth Date</p><p class="text-gray-800">{{ app.birth_date || '-' }}</p></div>
              <div><p class="text-xs uppercase tracking-wide text-gray-500">Gender</p><p class="text-gray-800">{{ app.gender || '-' }}</p></div>
              <div><p class="text-xs uppercase tracking-wide text-gray-500">Civil Status</p><p class="text-gray-800">{{ app.civil_status || '-' }}</p></div>
              <div><p class="text-xs uppercase tracking-wide text-gray-500">Occupation</p><p class="text-gray-800">{{ app.occupation || '-' }}</p></div>
              <div><p class="text-xs uppercase tracking-wide text-gray-500">Blood Type</p><p class="text-gray-800">{{ app.blood_type || '-' }}</p></div>
              <div><p class="text-xs uppercase tracking-wide text-gray-500">Contact Number</p><p class="text-gray-800">{{ app.contact_number || '-' }}</p></div>
              <div class="sm:col-span-2"><p class="text-xs uppercase tracking-wide text-gray-500">Address</p><p class="text-gray-800">{{ app.address_line || '-' }}</p></div>
              <div><p class="text-xs uppercase tracking-wide text-gray-500">Email</p><p class="text-gray-800">{{ app.email || '-' }}</p></div>
              <div><p class="text-xs uppercase tracking-wide text-gray-500">Emergency Contact</p><p class="text-gray-800">{{ app.emergency_contact_name || '-' }}</p></div>
              <div><p class="text-xs uppercase tracking-wide text-gray-500">Emergency Contact #</p><p class="text-gray-800">{{ app.emergency_contact_number || '-' }}</p></div>
              @if (app.reviewed_by_name) {
                <div><p class="text-xs uppercase tracking-wide text-gray-500">Reviewed By</p><p class="text-gray-800">{{ app.reviewed_by_name }}</p></div>
                <div><p class="text-xs uppercase tracking-wide text-gray-500">Reviewed At</p><p class="text-gray-800">{{ app.reviewed_at }}</p></div>
              }
              @if (app.review_remarks) {
                <div class="sm:col-span-2"><p class="text-xs uppercase tracking-wide text-gray-500">Review Remarks</p><p class="text-gray-800">{{ app.review_remarks }}</p></div>
              }
            </div>

            @if (app.status === 'PENDING') {
              <div class="md:col-span-2 border-t border-gray-200 pt-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Remarks (optional)</label>
                <textarea
                  [value]="remarks()"
                  (input)="remarks.set($any($event.target).value)"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Notes for this application..."></textarea>
                <div class="flex justify-end gap-3 mt-4">
                  <app-button variant="danger" (onClick)="requestAction('reject')">Reject</app-button>
                  <app-button variant="success" (onClick)="requestAction('approve')">Approve</app-button>
                </div>
              </div>
            }
          </div>
        }
      </app-modal>

      <!-- Action Confirmation -->
      <app-confirm-dialog
        [open]="showActionConfirm()"
        [title]="pendingAction() === 'approve' ? 'Approve Application' : 'Reject Application'"
        [message]="actionMessage()"
        [confirmText]="pendingAction() === 'approve' ? 'Approve' : 'Reject'"
        [variant]="pendingAction() === 'approve' ? 'primary' : 'danger'"
        (onCancel)="showActionConfirm.set(false)"
        (onConfirm)="confirmAction()"
      />
    </div>
  `
})
export class ApplicationsComponent implements OnInit, OnDestroy {
  applications = signal<ApplicationRow[]>([]);
  loading = signal(true);
  search = signal('');
  statusFilter = signal('');
  page = signal(1);
  limit = 20;
  total = signal(0);
  sortColumn = signal('application_id');
  sortDirection = signal<'ASC' | 'DESC'>('DESC');

  selected = signal<ApplicationRow | null>(null);
  showDetail = signal(false);
  remarks = signal('');
  saving = signal(false);

  showActionConfirm = signal(false);
  pendingAction = signal<'approve' | 'reject' | null>(null);

  statusOptions = [
    { value: '', label: 'All statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' }
  ];

  columns: TableColumn[] = [
    { key: 'application_number', label: 'Application #', sortable: true },
    { key: 'full_name', label: 'Applicant' },
    { key: 'contact_number', label: 'Contact' },
    { key: 'address_line', label: 'Address' },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'created_at', label: 'Submitted', sortable: true }
  ];

  private sseSubscription: any = null;
  private readonly assetBase = environment.apiUrl.replace(/\/api\/v1$/, '');

  constructor(
    private applicationService: ApplicationService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadApplications();
    this.connectToUpdates();
  }

  ngOnDestroy() {
    if (this.sseSubscription) {
      this.sseSubscription.unsubscribe();
      this.sseSubscription = null;
    }
  }

  private connectToUpdates() {
    this.sseSubscription = this.notificationService.sse$.subscribe(event => {
      if (event?.type?.startsWith('application-')) {
        this.loadApplications();
      }
    });
  }

  loadApplications() {
    this.loading.set(true);
    this.applicationService.getAll({
      search: this.search(),
      status: this.statusFilter(),
      page: this.page(),
      limit: this.limit,
      sortBy: this.sortColumn(),
      sortOrder: this.sortDirection()
    }).subscribe({
      next: (res) => {
        this.applications.set(res.data.map(a => ({ ...a, full_name: this.fullName(a) })));
        this.total.set(res.pagination.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private fullName(app: BarangayIdApplication): string {
    const parts = [app.first_name, app.middle_name, app.last_name, app.suffix].filter(Boolean);
    return parts.join(' ');
  }

  onSearch(value: string) {
    this.search.set(value);
    this.page.set(1);
    this.loadApplications();
  }

  onStatusChange(value: string) {
    this.statusFilter.set(value);
    this.page.set(1);
    this.loadApplications();
  }

  onSort(column: string) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'ASC' ? 'DESC' : 'ASC');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('ASC');
    }
    this.loadApplications();
  }

  onPageChange(page: number) {
    this.page.set(page);
    this.loadApplications();
  }

  openDetail(row: ApplicationRow) {
    this.selected.set(row);
    this.remarks.set('');
    this.showDetail.set(true);
  }

  closeDetail() {
    this.showDetail.set(false);
    this.selected.set(null);
  }

  imageUrl(path: string | null): string {
    return path ? `${this.assetBase}/uploads/${path}` : '';
  }

  statusChipClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  actionMessage(): string {
    const app = this.selected();
    const action = this.pendingAction();
    if (!app || !action) return '';
    return action === 'approve'
      ? `Approve application ${app.application_number} for ${app.full_name}? A permanent resident record will be created and the captured photo copied to it.`
      : `Reject application ${app.application_number} for ${app.full_name}?`;
  }

  requestAction(action: 'approve' | 'reject') {
    this.pendingAction.set(action);
    this.showActionConfirm.set(true);
  }

  confirmAction() {
    const app = this.selected();
    const action = this.pendingAction();
    if (!app || !action) return;
    this.saving.set(true);
    const remarks = this.remarks().trim() || undefined;
    const obs = action === 'approve'
      ? this.applicationService.approve(app.application_id, remarks)
      : this.applicationService.reject(app.application_id, remarks);
    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.showActionConfirm.set(false);
        this.closeDetail();
        this.loadApplications();
      },
      error: (err) => {
        this.saving.set(false);
        this.showActionConfirm.set(false);
        alert(err.error?.message || 'Action failed.');
      }
    });
  }
}
