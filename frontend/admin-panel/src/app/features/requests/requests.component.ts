import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RequestService, DocumentService } from '../../shared/services';
import { NotificationService } from '../notifications/notification.service';
import { DocumentRequest, RequestStatusHistory, GeneratedDocument, FormField } from '../../shared/interfaces/api.interfaces';
import { TableComponent, TableColumn } from '../../shared/components/table.component';
import { CardComponent } from '../../shared/components/card.component';
import { InputComponent } from '../../shared/components/input.component';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { ButtonComponent } from '../../shared/components/button.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { DocumentPreviewModalComponent } from '../../shared/components/document-preview-modal.component';
import { RequestFormComponent } from './request-form.component';

interface RequestDetail extends DocumentRequest {
  history?: RequestStatusHistory[];
}

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [TableComponent, CardComponent, InputComponent, PaginationComponent, ButtonComponent, ModalComponent, RequestFormComponent, DocumentPreviewModalComponent, FormsModule],
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
          [cellTemplates]="{ status_name: statusCell, expires_at: expiryCell }"
          [selectedRow]="selectedRow()"
          (onSort)="onSort($event)"
          (onRowClick)="onRowClick($event)">

          <ng-template #statusCell let-status let-row="row">
            <select
              [value]="row.status_id"
              [disabled]="row.status_id === 7 || row.status_id === 8 || row.status_id === 9"
              (click)="$event.stopPropagation()"
              (change)="onStatusChange($any($event.target).value, row); $event.stopPropagation()"
              class="w-full px-2 py-1.5 border rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 bg-white">
              @for (opt of statusOptions; track opt.value) {
                <option [value]="opt.value">{{ opt.label }}</option>
              }
            </select>
          </ng-template>

          <ng-template #expiryCell let-value let-row="row">
            @if (row.is_expired) {
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold text-red-700 bg-red-100">Expired</span>
            } @else if (row.expires_at) {
              <span
                [class]="expiryBadgeClass(row.expires_at)">
                {{ daysRemaining(row.expires_at) }}d left
              </span>
            } @else {
              <span class="text-gray-400">-</span>
            }
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
      <app-modal [open]="showDetails()" [title]="selectedRequest()?.request_number || 'Request Details'" (onClose)="closeDetails()">
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
            @if (request.expires_at) {
              <div class="grid grid-cols-3 gap-2">
                <dt class="text-gray-500 font-medium">Claim Expiry</dt>
                <dd class="col-span-2">
                  @if (request.is_expired) {
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold text-red-700 bg-red-100">Expired</span>
                  } @else {
                    <span class="text-gray-900">{{ formatDate(request.expires_at) }} · {{ daysRemaining(request.expires_at) }}d left</span>
                  }
                </dd>
              </div>
            }
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

          <!-- Form Data Preview -->
          @if (request.form_data && hasFormData(request.form_data)) {
            <div class="flex items-center justify-between mt-6 mb-2">
              <h4 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Submitted Form Data</h4>
              <button
                type="button"
                (click)="previewRequestData(request)"
                class="text-xs font-medium text-blue-600 hover:underline">
                Preview Form Data
              </button>
            </div>
            <div class="bg-gray-50 rounded p-3 text-sm max-h-60 overflow-y-auto">
              @for (entry of formDataEntries(request.form_data); track entry.key) {
                <div class="mb-2">
                  <span class="font-medium text-gray-700">{{ formatFieldLabel(entry.key) }}:</span>
                  <span class="ml-2 text-gray-900 whitespace-pre-wrap">{{ entry.value }}</span>
                </div>
              }
            </div>
          }

          <div class="flex items-center justify-between mt-6 mb-2">
            <h4 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Generated Documents</h4>
            <div class="flex items-center gap-3">
              <button
                type="button"
                [disabled]="previewBusy()"
                (click)="previewRequestDocument()"
                class="text-xs font-medium text-blue-600 hover:underline disabled:opacity-50"
                title="Preview the fully populated document before approving or rejecting">
                {{ previewBusy() ? 'Preparing...' : 'Preview Document' }}
              </button>
              @if (canEditDocument()) {
                <button
                  type="button"
                  (click)="openEditForm()"
                  class="text-xs font-medium text-blue-600 hover:underline disabled:opacity-50"
                  title="Edit the dynamic application form data, then regenerate and preview the document.">
                  Edit Document
                </button>
              }
            </div>
          </div>
          <p class="text-xs text-gray-500 mb-2">
            A document can be previewed or edited in <span class="font-medium">Submitted</span> or <span class="font-medium">Under Review</span> status.
            "Preview Document" generates one if none exists yet; "Edit Document" allows modifying submitted fields and automatically updates the generated document.
          </p>
          @if (!editingDocument()) {
            @if (documents().length > 0) {
              <div class="space-y-2">
                @for (doc of documents(); track doc.document_id) {
                  <div class="border rounded p-2 text-sm bg-white">
                    <div class="flex items-center justify-between">
                      <div class="min-w-0">
                        <p class="font-medium text-gray-900 truncate" [title]="doc.file_name">{{ doc.file_name }}</p>
                        <p class="text-xs text-gray-500">{{ formatDate(doc.generated_at) }} · {{ formatBytes(doc.file_size) }}</p>
                      </div>
                      <div class="flex shrink-0 items-center gap-2">
                        @if (approvalBadge(doc.approval_status); as badge) {
                          <span [class]="badge.class">{{ badge.label }}</span>
                        }
                      </div>
                    </div>

                    @if (doc.generation_warnings && doc.generation_warnings.length > 0) {
                      <div class="mt-2 rounded bg-amber-50 border border-amber-200 px-2 py-1.5">
                        <p class="text-xs font-medium text-amber-800">Generation warnings</p>
                        @for (warn of doc.generation_warnings; track warn) {
                          <p class="text-xs text-amber-700">• {{ warn }}</p>
                        }
                      </div>
                    }

                    <div class="mt-2 flex flex-wrap items-center gap-2">
                      <button type="button" (click)="previewDocument(doc)" class="text-xs text-blue-600 hover:underline">Preview</button>
                      <button
                        type="button"
                        (click)="downloadDocument(doc)"
                        [disabled]="doc.approval_status !== 'approved'"
                        class="text-xs text-blue-600 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                        [title]="doc.approval_status === 'approved' ? 'Download' : 'Download only available after approval'">
                        Download
                      </button>
                      <button
                        type="button"
                        (click)="printDocument(doc)"
                        [disabled]="doc.approval_status !== 'approved'"
                        class="text-xs text-blue-600 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                        [title]="doc.approval_status === 'approved' ? 'Print' : 'Print only available after approval'">
                        Print
                      </button>

                      @if (doc.approval_status === 'pending' && request.status_id === 4) {
                        <span class="text-gray-300">|</span>
                        <button type="button" (click)="reviewDocument(doc, 'approved')" class="text-xs text-green-600 hover:underline">Approve</button>
                        <button type="button" (click)="reviewDocument(doc, 'rejected')" class="text-xs text-red-600 hover:underline">Reject</button>
                      }

                      @if (doc.review_remarks) {
                        <span class="text-xs text-gray-500" [title]="doc.review_remarks">Remarks: {{ doc.review_remarks }}</span>
                      }
                    </div>
                  </div>
                }
              </div>
            } @else {
              <p class="text-sm text-gray-500">
                No documents generated yet{{ docNotice() }}.
              </p>
            }
            @if (docError()) {
              <p class="text-xs text-red-500 mt-2">{{ docError() }}</p>
            }
          } @else {
            <!-- Edit Document form: correct submitted application data and regenerate -->
            <div class="border rounded-lg p-4 bg-gray-50 space-y-4">
              <h5 class="text-sm font-semibold text-gray-700">Correct Application Data</h5>

              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Purpose</label>
                <input
                  type="text"
                  [(ngModel)]="editPurpose"
                  class="w-full px-3 py-2 border rounded-lg text-sm text-gray-800 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Purpose of request" />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea
                  [(ngModel)]="editRemarks"
                  rows="2"
                  class="w-full px-3 py-2 border rounded-lg text-sm text-gray-800 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Notes"></textarea>
              </div>

              @if (selectedRequest()?.resident_id === null) {
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Guest Information</label>
                  <p class="text-xs text-gray-500 mb-2">Temporary session identity for this request.</p>
                  @for (field of GUEST_IDENTITY_FIELDS; track field.key) {
                    <div class="mb-3">
                      @switch (field.type) {
                        @case ('textarea') {
                          <textarea
                            [id]="'edit-' + field.key"
                            [name]="field.key"
                            [(ngModel)]="editFormData[field.key]"
                            rows="2"
                            class="w-full px-3 py-2 border rounded-lg text-sm text-gray-800 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            [placeholder]="field.label"></textarea>
                        }
                        @default {
                          <input
                            [id]="'edit-' + field.key"
                            [type]="field.type"
                            [name]="field.key"
                            [(ngModel)]="editFormData[field.key]"
                            class="w-full px-3 py-2 border rounded-lg text-sm text-gray-800 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            [placeholder]="field.label" />
                        }
                      }
                      @if (editErrors[field.key]) {
                        <p class="text-xs text-red-500 mt-1">{{ editErrors[field.key] }}</p>
                      }
                    </div>
                  }
                </div>
              }

              @if (editFormFields().length > 0) {
                <div>
                  <h6 class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Service Form Fields</h6>
                  @for (field of editFormFields(); track field.key) {
                    <div class="mb-3">
                      <label [attr.for]="'edit-' + field.key" class="block text-xs font-medium text-gray-600 mb-1">
                        {{ field.label }} @if (field.required) { <span class="text-[#F97316]">*</span> }
                      </label>
                      @switch (field.type) {
                        @case ('select') {
                          <select
                            [id]="'edit-' + field.key"
                            [name]="field.key"
                            [(ngModel)]="editFormData[field.key]"
                            class="w-full px-3 py-2 border rounded-lg text-sm text-gray-800 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Select</option>
                            @for (opt of field.options || []; track opt) {
                              <option [value]="opt">{{ opt }}</option>
                            }
                          </select>
                        }
                        @case ('textarea') {
                          <textarea
                            [id]="'edit-' + field.key"
                            [name]="field.key"
                            [(ngModel)]="editFormData[field.key]"
                            rows="3"
                            class="w-full px-3 py-2 border rounded-lg text-sm text-gray-800 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            [placeholder]="field.placeholder || field.label"></textarea>
                        }
                        @case ('radio') {
                          <div class="flex flex-col gap-2">
                            @for (opt of field.options || []; track opt) {
                              <label class="flex items-center gap-2">
                                <input type="radio" [name]="field.key" [value]="opt"
                                  [checked]="editFormData[field.key] === opt"
                                  (change)="editFormData[field.key] = opt"
                                  class="w-4 h-4 accent-[#F97316]" />
                                <span class="text-sm text-gray-700">{{ opt }}</span>
                              </label>
                            }
                          </div>
                        }
                        @case ('checkbox') {
                          <div class="flex flex-col gap-2">
                            @for (opt of field.options || []; track opt) {
                              <label class="flex items-center gap-2">
                                <input type="checkbox" [value]="opt"
                                  [checked]="isCheckboxChecked(field.key, opt)"
                                  (change)="toggleCheckbox(field.key, opt, $event)"
                                  class="w-4 h-4 accent-[#F97316]" />
                                <span class="text-sm text-gray-700">{{ opt }}</span>
                              </label>
                            }
                          </div>
                        }
                        @default {
                          <input
                            [id]="'edit-' + field.key"
                            [type]="field.type"
                            [name]="field.key"
                            [(ngModel)]="editFormData[field.key]"
                            class="w-full px-3 py-2 border rounded-lg text-sm text-gray-800 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            [placeholder]="field.placeholder || field.label" />
                        }
                      }
                      @if (field.helperText) {
                        <p class="mt-1 text-xs text-gray-500">{{ field.helperText }}</p>
                      }
                      @if (editErrors[field.key]) {
                        <p class="mt-1 text-xs text-red-500">{{ editErrors[field.key] }}</p>
                      }
                    </div>
                  }
                </div>
              } @else {
                <p class="text-sm text-gray-400">This service has no configurable application form fields.</p>
              }

              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Correction Notes (optional)</label>
                <textarea
                  [(ngModel)]="editReason"
                  rows="2"
                  class="w-full px-3 py-2 border rounded-lg text-sm text-gray-800 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Why was this data corrected?"></textarea>
              </div>

              @if (editErrors['form']) {
                <p class="text-xs text-red-500">{{ editErrors['form'] }}</p>
              }

              <div class="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  (click)="closeEditForm()"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  Cancel
                </button>
                <button
                  type="button"
                  [disabled]="savingEdit()"
                  (click)="saveEditForm()"
                  class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
                  {{ savingEdit() ? 'Saving...' : 'Save & Regenerate' }}
                </button>
              </div>
            </div>
          }

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

      <!-- Document Preview Modal -->
      <app-document-preview-modal
        [open]="showPreview()"
        [title]="previewTitle"
        [blob]="previewBlob"
        (onClose)="closePreview()"
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
  statusFilter = signal('');

  showForm = signal(false);
  saving = signal(false);
  showDetails = signal(false);
  selectedRequest = signal<RequestDetail | null>(null);
  selectedRow = signal<DocumentRequest | null>(null);
  documents = signal<GeneratedDocument[]>([]);
  previewBusy = signal(false);
  docError = signal('');
  docNotice = signal('');

  // --- Edit Document ---
  editingDocument = signal(false);
  editFormData: Record<string, any> = {};
  editPurpose = '';
  editRemarks = '';
  editReason = '';
  editErrors: Record<string, string> = {};
  savingEdit = signal(false);

  GUEST_IDENTITY_FIELDS: FormField[] = [
    { key: 'full_name', label: 'Full Name', type: 'text', required: true },
    { key: 'birth_date', label: 'Birth Date', type: 'date', required: false },
    { key: 'address', label: 'Address', type: 'textarea', required: false },
    { key: 'contact_number', label: 'Contact Number', type: 'tel', required: false },
    { key: 'email', label: 'Email', type: 'email', required: false }
  ];

  private sseSubscription: any = null;

  columns: TableColumn[] = [
    { key: 'request_number', label: 'Request #', sortable: true },
    { key: 'resident_name', label: 'Resident' },
    { key: 'service_name', label: 'Service' },
    { key: 'request_date', label: 'Date Submitted', sortable: true },
    { key: 'status_name', label: 'Status' },
    { key: 'expires_at', label: 'Claim Expiry' },
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
    private documentService: DocumentService,
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
    this.selectedRow.set(request);
    this.requestService.getById(request.request_id).subscribe({
      next: (res) => {
        this.selectedRequest.set(res.data as RequestDetail);
        this.showDetails.set(true);
        this.loadDocuments(request.request_id);
      },
      error: () => {
        this.selectedRequest.set(request as RequestDetail);
        this.showDetails.set(true);
        this.loadDocuments(request.request_id);
      }
    });
  }

  onRowClick(request: DocumentRequest) {
    this.viewDetails(request);
  }

  closeDetails() {
    this.showDetails.set(false);
    this.selectedRequest.set(null);
    this.selectedRow.set(null);
    this.documents.set([]);
    this.docError.set('');
    this.docNotice.set('');
  }

  loadDocuments(requestId: number) {
    this.docError.set('');
    this.docNotice.set('');
    this.documents.set([]);
    this.documentService.list(requestId).subscribe({
      next: (res) => {
        this.documents.set(res.data || []);
        if (this.documents().length === 0 && !this.canGenerateDocument()) {
          this.docNotice.set(' (not available for current status)');
        }
      },
      error: () => {
        this.docError.set('Could not load generated documents.');
      }
    });
  }

  canGenerateDocument(): boolean {
    const statusId = this.selectedRequest()?.status_id;
    return statusId === 1 || statusId === 4 || statusId === 5 || statusId === 6 || statusId === 7;
  }

  openDocument(doc: GeneratedDocument) {
    const request = this.selectedRequest();
    if (!request) return;
    this.documentService.fetchBlob(request.request_id, doc.document_id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const isPdf = doc.file_type === 'application/pdf';
        window.open(url, isPdf ? '_blank' : '_blank');
      },
      error: () => {
        this.docError.set('Could not open the document.');
      }
    });
  }

  downloadDocument(doc: GeneratedDocument) {
    const request = this.selectedRequest();
    if (!request) return;
    this.documentService.fetchBlob(request.request_id, doc.document_id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.file_name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.docError.set('Could not download the document.');
      }
    });
  }

  printDocument(doc: GeneratedDocument) {
    this.openDocument(doc);
  }

  // --- Document Preview Modal State ---
  showPreview = signal(false);
  previewBlob: Blob | null = null;
  previewTitle = '';

  // --- Document Review / Approval ---
  reviewing = signal(false);

  previewDocument(doc: GeneratedDocument) {
    const request = this.selectedRequest();
    if (!request) return;
    this.previewBusy.set(true);
    this.docError.set('');
    this.documentService.fetchBlob(request.request_id, doc.document_id).subscribe({
      next: (blob) => {
        this.previewTitle = doc.file_name;
        this.previewBlob = blob;
        this.showPreview.set(true);
        this.previewBusy.set(false);
      },
      error: () => {
        this.previewBusy.set(false);
        this.docError.set('Could not load the document for preview.');
      }
    });
  }

  closePreview() {
    this.showPreview.set(false);
    this.previewBlob = null;
    this.previewTitle = '';
  }

  // Preview the populated official document BEFORE approving/rejecting.
  // If no document exists yet, generate one on demand (idempotently) first.
  previewRequestDocument() {
    const request = this.selectedRequest();
    if (!request) return;
    if (this.previewBusy()) return;
    this.previewBusy.set(true);
    this.docError.set('');
    const docs = this.documents();
    if (docs.length > 0) {
      this.previewDocument(docs[docs.length - 1]);
      return;
    }
    if (!this.canGenerateDocument()) {
      this.previewBusy.set(false);
      this.docError.set('A document can only be generated for submitted or under review requests.');
      return;
    }
    this.documentService.generate(request.request_id).subscribe({
      next: () => {
        this.documentService.list(request.request_id).subscribe({
          next: (res) => {
            this.documents.set(res.data || []);
            this.previewBusy.set(false);
            const latest = this.documents();
            if (latest.length > 0) this.previewDocument(latest[latest.length - 1]);
            else this.docError.set('No document was produced to preview.');
          },
          error: () => {
            this.previewBusy.set(false);
            this.docError.set('Could not load the generated document.');
          }
        });
      },
      error: (err) => {
        this.previewBusy.set(false);
        this.docError.set(err.error?.message || 'Failed to generate the document for preview.');
      }
    });
  }

  // --- Edit Document (replace Regenerate Document) ---
  // Lets staff correct typos / wrong info in the resident's submitted
  // application form data and immediately regenerate + preview the document.
  canEditDocument(): boolean {
    const statusId = this.selectedRequest()?.status_id;
    return statusId === 1 || statusId === 4;
  }

  editFormFields(): FormField[] {
    const request = this.selectedRequest();
    if (!request) return [];
    const formFields = request.service_snapshot?.form_fields || [];
    return request.resident_id === null
      ? [...this.GUEST_IDENTITY_FIELDS, ...formFields]
      : formFields;
  }

  openEditForm() {
    const request = this.selectedRequest();
    if (!request) return;
    if (!this.canEditDocument()) {
      this.docError.set('A document can only be edited while the request is Submitted or Under Review.');
      return;
    }
    // Deep-clone the form_data so we never mutate the original request record
    // until the admin saves.
    this.editFormData = JSON.parse(JSON.stringify(request.form_data || {}));
    this.editPurpose = request.purpose || '';
    this.editRemarks = request.remarks || '';
    this.editReason = '';
    this.editErrors = {};
    this.savingEdit.set(false);
    this.editingDocument.set(true);
    this.docError.set('');
  }

  closeEditForm() {
    this.editingDocument.set(false);
    this.editFormData = {};
    this.editPurpose = '';
    this.editRemarks = '';
    this.editReason = '';
    this.editErrors = {};
  }

  isCheckboxChecked(key: string, value: string): boolean {
    const arr = this.editFormData[key];
    return Array.isArray(arr) && arr.includes(value);
  }

  toggleCheckbox(key: string, value: string, event: any) {
    const arr: string[] = Array.isArray(this.editFormData[key]) ? [...this.editFormData[key]] : [];
    if (event?.target?.checked) {
      if (!arr.includes(value)) arr.push(value);
    } else {
      const idx = arr.indexOf(value);
      if (idx > -1) arr.splice(idx, 1);
    }
    this.editFormData[key] = arr;
  }

  saveEditForm() {
    const request = this.selectedRequest();
    if (!request) return;
    this.editErrors = {};

    // Validate required form fields
    for (const field of this.editFormFields()) {
      if (field.required && !this.editFormData[field.key]) {
        this.editErrors[field.key] = `${field.label} is required.`;
      }
    }
    if (Object.keys(this.editErrors).length > 0) {
      return;
    }

    this.savingEdit.set(true);
    this.docError.set('');
    this.requestService.update(request.request_id, {
      serviceId: request.service_id,
      purpose: this.editPurpose || undefined,
      remarks: this.editRemarks || undefined,
      reason: this.editReason || undefined,
      formData: this.editFormData
    }).subscribe({
      next: () => {
        this.savingEdit.set(false);
        this.editingDocument.set(false);
        this.editFormData = {};
        // Reload the request details and documents so the Admin Panel
        // reflects the corrected data and the regenerated document.
        this.requestService.getById(request.request_id).subscribe({
          next: (res) => {
            this.selectedRequest.set(res.data as RequestDetail);
            this.loadDocuments(request.request_id);
            // Preview the updated document immediately.
            setTimeout(() => this.previewRequestDocument(), 300);
          },
          error: () => {
            this.loadDocuments(request.request_id);
            setTimeout(() => this.previewRequestDocument(), 300);
          }
        });
      },
      error: (err) => {
        this.savingEdit.set(false);
        this.editErrors['form'] = err.error?.message || 'Failed to save corrections.';
      }
    });
  }

  approvalBadge(status: string): { class: string; label: string } | null {
    switch (status) {
      case 'approved':
        return { class: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold text-green-700 bg-green-100', label: 'Approved' };
      case 'rejected':
        return { class: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold text-red-700 bg-red-100', label: 'Rejected' };
      case 'pending':
        return { class: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold text-gray-700 bg-gray-100', label: 'Pending Review' };
      default:
        return null;
    }
  }

  reviewDocument(doc: GeneratedDocument, status: 'approved' | 'rejected') {
    const request = this.selectedRequest();
    if (!request) return;

    const remarks = status === 'approved' ? '' : prompt(`Enter remarks for ${status}:`);
    if (status !== 'approved' && remarks === null) return; // user cancelled

    this.reviewing.set(true);
    this.documentService.review(request.request_id, doc.document_id, status, remarks || '').subscribe({
      next: () => {
        this.reviewing.set(false);
        this.loadDocuments(request.request_id);
      },
      error: (err) => {
        this.reviewing.set(false);
        this.docError.set(err.error?.message || 'Failed to review document.');
      }
    });
  }



  formatBytes(bytes: number | null | undefined): string {
    if (!bytes) return '0 B';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '-';
    const date = new Date(value);
    return isNaN(date.getTime())
      ? value
      : date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  daysRemaining(value: string): number {
    const expires = new Date(value).getTime();
    if (isNaN(expires)) return 0;
    return Math.max(0, Math.ceil((expires - Date.now()) / (24 * 60 * 60 * 1000)));
  }

  expiryBadgeClass(value: string): string {
    const base = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold';
    return this.daysRemaining(value) <= 2
      ? `${base} text-red-700 bg-red-100`
      : `${base} text-amber-800 bg-amber-100`;
  }

  // --- Request Form Data Preview ---
  previewRequestData(request: DocumentRequest) {
    // The form_data is already in the request object
    // This could open a modal, but for now we show it inline
    // Could be extended to a full modal if needed
  }

  formDataEntries(formData: Record<string, unknown>): { key: string; value: string }[] {
    return Object.entries(formData).map(([key, value]) => ({
      key,
      value: value === null || value === undefined ? '-' : String(value)
    }));
  }

  formatFieldLabel(key: string): string {
    const labelMap: Record<string, string> = {
      full_name: 'Full Name',
      first_name: 'First Name',
      middle_name: 'Middle Name',
      last_name: 'Last Name',
      suffix: 'Suffix',
      birth_date: 'Birth Date',
      birthdate: 'Birth Date',
      gender: 'Gender',
      sex: 'Gender',
      civil_status: 'Civil Status',
      address_line: 'Address',
      address: 'Address',
      contact_number: 'Contact Number',
      contact: 'Contact Number',
      email: 'Email',
      resident_code: 'Resident Code',
      blood_type: 'Blood Type',
      emergency_contact_name: 'Emergency Contact Name',
      emergency_contact_number: 'Emergency Contact Number',
      purpose: 'Purpose',
      occupation: 'Occupation',
      business_name: 'Business Name',
      owner_name: 'Owner Name',
      business_address: 'Business Address',
      nature_of_business: 'Nature of Business',
      pole_type: 'Pole Type',
      street: 'Street',
      office_address: 'Office Address',
      requestor_name: 'Requestor Name',
      years_of_residency: 'Years of Residency',
      monthly_income: 'Monthly Income',
      household_members: 'Household Members',
      _guest: 'Guest Info'
    };
    return labelMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  hasFormData(formData: Record<string, unknown>): boolean {
    return formData && Object.keys(formData).length > 0;
  }
}
