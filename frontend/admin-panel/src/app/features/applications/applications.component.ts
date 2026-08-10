import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
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
import { DocumentPreviewModalComponent } from '../../shared/components/document-preview-modal.component';
import { environment } from '../../../environments/environment';

type ApplicationRow = BarangayIdApplication & { full_name: string };

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [TableComponent, CardComponent, InputComponent, SelectComponent, PaginationComponent, ButtonComponent, ModalComponent, ConfirmDialogComponent, DocumentPreviewModalComponent, DatePipe],
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
                <div class="flex items-center justify-between gap-4 mb-4">
                  <p class="text-xs uppercase tracking-wide text-gray-500">Review the generated ID before making a decision</p>
                  <app-button variant="secondary" (onClick)="previewDraft(app)" [loading]="previewing()">Preview ID Card</app-button>
                </div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Remarks (optional)</label>
                <textarea
                  [value]="remarks()"
                  (input)="remarks.set($any($event.target).value)"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Notes for this application..."></textarea>
                <div class="flex justify-end gap-3 mt-4">
                  <app-button variant="secondary" (onClick)="requestAction('return')">Return for Correction</app-button>
                  <app-button variant="danger" (onClick)="requestAction('reject')">Reject</app-button>
                  <app-button variant="success" (onClick)="requestAction('approve')">Approve</app-button>
                </div>
              </div>
            }

            @if (app.status === 'RETURNED') {
              <div class="md:col-span-2 border-t border-gray-200 pt-4 flex items-center justify-between gap-4">
                <p class="text-xs uppercase tracking-wide text-gray-500">Review the corrected information before re-approving</p>
                <app-button variant="secondary" (onClick)="previewDraft(app)" [loading]="previewing()">Preview ID Card</app-button>
              </div>
            }

            @if (app.status === 'APPROVED' && app.id_number) {
              <div class="md:col-span-2 border-t border-gray-200 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div><p class="text-xs uppercase tracking-wide text-gray-500">Barangay ID No.</p><p class="text-gray-800 font-semibold">{{ app.id_number }}</p></div>
                <div><p class="text-xs uppercase tracking-wide text-gray-500">Issued</p><p class="text-gray-800">{{ app.id_issued_at ? (app.id_issued_at | date: 'mediumDate') : '-' }}</p></div>
                <div><p class="text-xs uppercase tracking-wide text-gray-500">Expires</p><p class="text-gray-800">{{ app.id_expiration_date ? (app.id_expiration_date | date: 'mediumDate') : '-' }}</p></div>
                @if (app.id_card_path) {
                  <div class="sm:col-span-3 flex items-center justify-between">
                    <p class="text-xs uppercase tracking-wide text-gray-500">Issued ID Card</p>
                    <div class="flex items-center gap-3">
                      <button type="button" (click)="previewIdCard(app)" class="text-blue-600 hover:text-blue-800 text-sm font-medium">Preview</button>
                      <a [href]="idCardUrl(app)" target="_blank" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        {{ app.id_card_mime?.includes('pdf') ? 'Download PDF ID Card' : 'Download DOCX ID Card' }}
                      </a>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }
      </app-modal>

      <!-- Action Confirmation -->
      <app-confirm-dialog
        [open]="showActionConfirm()"
        [title]="actionTitle()"
        [message]="actionMessage()"
        [confirmText]="actionConfirmText()"
        [variant]="pendingAction() === 'approve' ? 'primary' : 'danger'"
        (onCancel)="showActionConfirm.set(false)"
        (onConfirm)="confirmAction()"
      />

      <!-- Issued ID Card Preview -->
      <app-document-preview-modal
        [open]="showCardPreview()"
        [title]="cardPreviewTitle()"
        [blob]="cardPreviewBlob()"
        [blobUrl]="cardPreviewUrl()"
        (onClose)="closeCardPreview()"
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
  pendingAction = signal<'approve' | 'reject' | 'return' | null>(null);

  showCardPreview = signal(false);
  cardPreviewTitle = signal('Barangay ID Card');
  cardPreviewUrl = signal<string | null>(null);
  cardPreviewBlob = signal<Blob | null>(null);
  previewing = signal(false);

  statusOptions = [
    { value: '', label: 'All statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'RETURNED', label: 'Returned' },
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
      case 'RETURNED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  actionTitle(): string {
    const action = this.pendingAction();
    if (action === 'approve') return 'Approve Application';
    if (action === 'reject') return 'Reject Application';
    if (action === 'return') return 'Return for Correction';
    return '';
  }

  actionMessage(): string {
    const app = this.selected();
    const action = this.pendingAction();
    if (!app || !action) return '';
    if (action === 'approve') {
      return `Approve application ${app.application_number} for ${app.full_name}? A permanent resident record will be created, an official Barangay ID number assigned, and the ID card generated.`;
    }
    if (action === 'return') {
      return `Return application ${app.application_number} for ${app.full_name} back for correction? No resident record or ID number will be created; the application can be reviewed again later.`;
    }
    return `Reject application ${app.application_number} for ${app.full_name}?`;
  }

  actionConfirmText(): string {
    const action = this.pendingAction();
    if (action === 'approve') return 'Approve';
    if (action === 'reject') return 'Reject';
    if (action === 'return') return 'Return';
    return '';
  }

  idCardUrl(app: ApplicationRow): string {
    return app.id_card_path ? `${this.assetBase}/uploads/${app.id_card_path}` : '';
  }

  previewIdCard(app: ApplicationRow) {
    this.cardPreviewTitle.set(`${app.full_name} — Barangay ID (${app.id_number})`);
    this.cardPreviewBlob.set(null);
    this.cardPreviewUrl.set(this.idCardUrl(app));
    this.showCardPreview.set(true);
  }

  // Draft preview: render the ID card from the application's submitted data
  // WITHOUT approving it. The server returns a DOCX buffer (no resident record,
  // no ID number, nothing persisted), which we display inline for review.
  previewDraft(app: ApplicationRow) {
    if (this.previewing()) return;
    this.previewing.set(true);
    this.cardPreviewBlob.set(null);
    this.applicationService.previewBlob(app.application_id).subscribe({
      next: (blob) => {
        this.previewing.set(false);
        this.cardPreviewTitle.set(`${app.full_name} — Barangay ID (Draft Preview)`);
        this.cardPreviewBlob.set(blob);
        this.cardPreviewUrl.set(null);
        this.showCardPreview.set(true);
      },
      error: (err: any) => {
        this.previewing.set(false);
        let msg = 'Could not render the ID card preview.';
        if (err?.error instanceof Blob) {
          err.error.text().then((text: string) => {
            try {
              const parsed = JSON.parse(text);
              msg = parsed?.message || msg;
            } catch { /* ignore non-JSON error bodies */ }
            alert(msg);
          });
        } else {
          alert(err?.error?.message || msg);
        }
      }
    });
  }

  closeCardPreview() {
    this.showCardPreview.set(false);
    this.cardPreviewUrl.set(null);
    this.cardPreviewBlob.set(null);
  }

  requestAction(action: 'approve' | 'reject' | 'return') {
    this.pendingAction.set(action);
    this.showActionConfirm.set(true);
  }

  confirmAction() {
    const app = this.selected();
    const action = this.pendingAction();
    if (!app || !action) return;
    this.saving.set(true);
    const remarks = this.remarks().trim() || undefined;
    const calls: Record<'approve' | 'reject' | 'return', () => any> = {
      approve: () => this.applicationService.approve(app.application_id, remarks),
      reject: () => this.applicationService.reject(app.application_id, remarks),
      return: () => this.applicationService.returnForCorrection(app.application_id, remarks)
    };
    calls[action]().subscribe({
      next: () => {
        this.saving.set(false);
        this.showActionConfirm.set(false);
        this.closeDetail();
        this.loadApplications();
      },
      error: (err: any) => {
        this.saving.set(false);
        this.showActionConfirm.set(false);
        alert(err.error?.message || 'Action failed.');
      }
    });
  }
}
