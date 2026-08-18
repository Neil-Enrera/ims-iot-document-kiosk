import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RequestService, DocumentService, ServiceService } from '../../shared/services';
import { NotificationService } from '../notifications/notification.service';
import { DocumentRequest, RequestStatusHistory, GeneratedDocument, FormField, Service } from '../../shared/interfaces/api.interfaces';
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
  imports: [TableComponent, CardComponent, InputComponent, PaginationComponent, ButtonComponent, ModalComponent, RequestFormComponent, DocumentPreviewModalComponent],
  template: `
    <div>
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Document Requests</h1>
          <p class="text-sm text-slate-500 mt-1">Track, process, and release resident document service requests.</p>
        </div>
        <app-button variant="primary" (onClick)="showForm.set(true)">+ New Request</app-button>
      </div>

      <app-card>
        <div class="mb-4 flex flex-col gap-3">
          <!-- Main Filter Bar -->
          <div class="flex flex-wrap items-center gap-3">
            <!-- Search Input -->
            <div class="flex-1 min-w-[220px]">
              <app-input placeholder="Search requests (e.g. #, name, service)..." [value]="search()" (valueChange)="onSearch($event)" />
            </div>

            <!-- All Services Filter -->
            <div class="w-48 sm:w-52">
              <select
                [value]="serviceFilter()"
                (change)="onServiceFilter($any($event.target).value)"
                class="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer shadow-xs">
                <option value="">All Services</option>
                @for (svc of services(); track svc.service_id) {
                  <option [value]="svc.service_id">{{ svc.service_name }}</option>
                }
              </select>
            </div>

            <!-- All Dates Filter -->
            <div class="w-44 sm:w-48">
              <select
                [value]="datePreset()"
                (change)="onDatePresetChange($any($event.target).value)"
                class="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer shadow-xs">
                <option value="">All Dates</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7days">Last 7 Days</option>
                <option value="thisMonth">This Month</option>
                <option value="custom">Custom Date Range...</option>
              </select>
            </div>

            <!-- Status Filter -->
            <div class="w-48 sm:w-52">
              <select
                [value]="statusFilter()"
                (change)="onStatusFilter($any($event.target).value)"
                class="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer shadow-xs">
                @for (opt of filterOptions; track opt.value) {
                  <option [value]="opt.value">{{ opt.label }}</option>
                }
              </select>
            </div>

            <!-- Reset Filters Button -->
            @if (hasActiveFilters()) {
              <button
                type="button"
                (click)="resetFilters()"
                class="h-10 px-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
                Reset
              </button>
            }
          </div>

          <!-- Custom Date Range Sub-row (revealed when 'custom' is picked) -->
          @if (datePreset() === 'custom') {
            <div class="flex flex-wrap items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span class="text-xs font-bold text-slate-600 uppercase tracking-wide">Custom Date:</span>
              <div class="flex items-center gap-2">
                <label class="text-xs text-slate-500">From:</label>
                <input
                  type="date"
                  [value]="dateFrom()"
                  (change)="onCustomDateChange('from', $any($event.target).value)"
                  class="h-8 px-2.5 border border-gray-300 rounded-lg text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-xs"
                />
              </div>
              <div class="flex items-center gap-2">
                <label class="text-xs text-slate-500">To:</label>
                <input
                  type="date"
                  [value]="dateTo()"
                  (change)="onCustomDateChange('to', $any($event.target).value)"
                  class="h-8 px-2.5 border border-gray-300 rounded-lg text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-xs"
                />
              </div>
            </div>
          }
        </div>

        <app-table
          [columns]="columns"
          [data]="requests()"
          [loading]="loading()"
          [sortColumn]="sortColumn()"
          [sortDirection]="sortDirection()"
          trackBy="request_id"
          emptyMessage="No requests found"
          [cellTemplates]="{
            request_number: reqNumCell,
            resident_name: residentCell,
            request_date: dateCell,
            status_name: statusCell,
            expires_at: expiryCell
          }"
          [selectedRow]="selectedRow()"
          (onSort)="onSort($event)"
          (onRowClick)="onRowClick($event)">

          <ng-template #reqNumCell let-row="row">
            <span class="text-sm font-semibold text-slate-900">
              {{ row.request_number }}
            </span>
          </ng-template>

          <ng-template #residentCell let-row="row">
            <span class="text-sm font-semibold text-slate-900">
              {{ row.resident_name }}
            </span>
          </ng-template>

          <ng-template #dateCell let-row="row">
            <div class="leading-tight">
              <p class="text-sm font-medium text-slate-800">{{ formatSubmissionDate(row.request_date) }}</p>
              <p class="text-xs text-slate-400 mt-0.5">{{ formatSubmissionTime(row.request_date) }}</p>
            </div>
          </ng-template>

          <ng-template #statusCell let-status let-row="row">
            <select
              [value]="row.status_id"
              [disabled]="row.status_id === 7 || row.status_id === 8 || row.status_id === 9"
              (click)="$event.stopPropagation()"
              (change)="onStatusChange($any($event.target).value, row); $event.stopPropagation()"
              class="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white cursor-pointer shadow-xs">
              @for (opt of statusOptions; track opt.value) {
                <option [value]="opt.value">{{ opt.label }}</option>
              }
            </select>
          </ng-template>

          <ng-template #expiryCell let-value let-row="row">
            @if (row.is_expired) {
              <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold text-red-800 bg-red-50 border border-red-200">Expired</span>
            } @else if (row.expires_at) {
              <span
                [class]="expiryBadgeClass(row.expires_at)">
                {{ daysRemaining(row.expires_at) }}d left
              </span>
            } @else {
              <span class="text-slate-400 font-medium">-</span>
            }
          </ng-template>
        </app-table>

        @if (total() > 0) {
          <app-pagination
            [total]="total()"
            [currentPage]="page()"
            [limit]="limit"
            itemLabel="requests"
            (onPageChange)="onPageChange($event)"
            (onLimitChange)="onLimitChange($event)" />
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
      <app-modal [open]="showDetails()" [title]="selectedRequest()?.request_number || 'Request Details'" (onClose)="closeDetails()" containerClass="max-w-xl">
        @if (selectedRequest(); as request) {
          <div class="space-y-4">
              <!-- Stepper Header -->
              <div class="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                @for (step of stepperSteps; track step.id) {
                  <div class="flex items-center gap-1.5">
                    <span [class]="'w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ' + (isStepActive(request.status_id, step.id) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500')">
                      {{ step.id }}
                    </span>
                    <span [class]="'text-[10px] font-semibold hidden md:inline ' + (isStepActive(request.status_id, step.id) ? 'text-blue-600' : 'text-gray-400')">
                      {{ step.label }}
                    </span>
                  </div>
                  @if (step.id < 7) {
                    <div [class]="'h-0.5 flex-1 border-t ' + (request.status_id >= 4 && step.id === 1 ? 'border-blue-600' : request.status_id >= 5 && step.id === 4 ? 'border-blue-600' : request.status_id >= 6 && step.id === 5 ? 'border-blue-600' : request.status_id === 7 && step.id === 6 ? 'border-blue-600' : 'border-gray-200')"></div>
                  }
                }
              </div>

              <!-- Metadata Description List -->
              <dl class="grid grid-cols-3 gap-y-2 gap-x-4 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                <dt class="text-gray-500 font-medium">Request #</dt>
                <dd class="col-span-2 font-bold text-gray-900">{{ request.request_number }}</dd>

                <dt class="text-gray-500 font-medium">Resident</dt>
                <dd class="col-span-2 text-gray-900 font-medium">{{ request.resident_name }} <span class="text-gray-400">({{ request.resident_code || 'Guest' }})</span></dd>

                <dt class="text-gray-500 font-medium">Service</dt>
                <dd class="col-span-2 text-gray-900 font-medium">{{ request.service_name }}</dd>

                <dt class="text-gray-500 font-medium">Submitted</dt>
                <dd class="col-span-2 text-gray-900">{{ formatDate(request.request_date) }}</dd>

                <dt class="text-gray-500 font-medium">Status</dt>
                <dd class="col-span-2 text-gray-900 font-semibold">{{ request.status_name }}</dd>

                @if (request.expires_at) {
                  <dt class="text-gray-500 font-medium">Claim Expiry</dt>
                  <dd class="col-span-2">
                    @if (request.is_expired) {
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold text-red-700 bg-red-100">Expired</span>
                    } @else {
                      <span class="text-gray-900 font-medium">{{ formatDate(request.expires_at) }} ({{ daysRemaining(request.expires_at) }}d left)</span>
                    }
                  </dd>
                }
                
                <dt class="text-gray-500 font-medium">Purpose</dt>
                <dd class="col-span-2 text-gray-900">{{ request.purpose || '-' }}</dd>

                <dt class="text-gray-500 font-medium">Notes</dt>
                <dd class="col-span-2 text-gray-900">{{ request.remarks || '-' }}</dd>
              </dl>

              <!-- Stepper workflow actions -->
              <div class="border-t border-gray-100 pt-4 mt-2">
                <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Workflow Quick Actions</h4>
                <div class="flex flex-wrap gap-2">
                  @if (request.status_id === 1) {
                    <app-button variant="primary" size="sm" (onClick)="onStatusChange('4', request)">Review Request</app-button>
                    <app-button variant="danger" size="sm" (onClick)="onStatusChange('8', request)">Reject</app-button>
                  }
                  @if (request.status_id === 2 || request.status_id === 3 || request.status_id === 4) {
                    <app-button variant="success" size="sm" (onClick)="onStatusChange('5', request)">Approve & Start Processing</app-button>
                    <app-button variant="danger" size="sm" (onClick)="onStatusChange('8', request)">Reject</app-button>
                  }
                  @if (request.status_id === 5) {
                    <app-button variant="primary" size="sm" (onClick)="onStatusChange('6', request)">Complete & Mark Ready for Release</app-button>
                  }
                  @if (request.status_id === 6) {
                    <app-button variant="success" size="sm" (onClick)="onStatusChange('7', request)">Release to Resident</app-button>
                  }
                  @if (request.status_id < 7 && request.status_id !== 8 && request.status_id !== 9) {
                    <app-button variant="secondary" size="sm" (onClick)="onStatusChange('9', request)">Cancel Request</app-button>
                  }
                </div>
              </div>

              <!-- Form Data Preview -->
              @if (request.form_data && hasFormData(request.form_data)) {
                <div class="flex items-center justify-between mt-4 mb-2">
                  <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wide">Submitted Form Data</h4>
                  <button type="button" (click)="previewRequestData(request)" class="text-xs font-semibold text-blue-600 hover:underline">Preview Json</button>
                </div>
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm space-y-1.5">
                  @for (entry of formDataEntries(request.form_data); track entry.key) {
                    <div class="mb-1.5 flex justify-between border-b border-gray-100 pb-1 last:border-0 last:pb-0">
                      <span class="font-medium text-gray-500">{{ formatFieldLabel(entry.key) }}:</span>
                      <span class="font-semibold text-gray-800 text-right">{{ entry.value }}</span>
                    </div>
                  }
                </div>
              }

              <!-- Generated Documents Section -->
              <div class="flex items-center justify-between mt-4 mb-2">
                <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wide">Document Artifacts</h4>
                <div class="flex items-center gap-2">
                  <button type="button" [disabled]="previewBusy()" (click)="previewRequestDocument()" class="text-xs font-semibold text-blue-600 hover:underline disabled:opacity-50">
                    {{ previewBusy() ? 'Loading...' : 'Preview Live' }}
                  </button>
                  <span class="text-gray-300">|</span>
                  <button type="button" [disabled]="generatingDoc()" (click)="generateDocument()" class="text-xs font-semibold text-blue-600 hover:underline disabled:opacity-50">
                    {{ generatingDoc() ? 'Generating...' : 'Regenerate' }}
                  </button>
                </div>
              </div>

              @if (documents().length > 0) {
                <div class="space-y-2">
                  @for (doc of documents(); track doc.document_id) {
                    <div class="border border-gray-200 rounded-lg p-3 bg-white hover:bg-gray-50 transition">
                      <div class="flex items-center justify-between mb-2">
                        <div class="min-w-0 flex-1">
                          <p class="font-semibold text-gray-900 truncate" [title]="doc.file_name">{{ doc.file_name }}</p>
                          <p class="text-[11px] text-gray-400">{{ formatDate(doc.generated_at) }} · {{ formatBytes(doc.file_size) }}</p>
                        </div>
                        @if (approvalBadge(doc.approval_status); as badge) {
                          <span [class]="'px-2 py-0.5 text-[10px] font-bold rounded-full ' + badge.class">{{ badge.label }}</span>
                        }
                      </div>

                      @if (doc.generation_warnings && doc.generation_warnings.length > 0) {
                        <div class="mb-2 rounded bg-amber-50 border border-amber-200 px-2 py-1">
                          @for (warn of doc.generation_warnings; track warn) {
                            <p class="text-[11px] text-amber-700 font-medium">• {{ warn }}</p>
                          }
                        </div>
                      }

                      <div class="flex items-center gap-3 border-t border-gray-100 pt-2 text-xs">
                        <button type="button" (click)="previewDocument(doc)" class="text-blue-600 font-semibold hover:underline">Preview</button>
                        <button type="button" (click)="downloadDocument(doc)" [disabled]="doc.approval_status !== 'approved'" class="text-blue-600 font-semibold hover:underline disabled:opacity-40 flex-wrap">Download</button>
                        <button type="button" (click)="printDocument(doc)" [disabled]="doc.approval_status !== 'approved'" class="text-blue-600 font-semibold hover:underline disabled:opacity-40">Print</button>
                        
                        @if (doc.approval_status === 'pending') {
                          <span class="text-gray-300">|</span>
                          <button type="button" (click)="reviewDocument(doc, 'approved')" class="text-green-600 font-bold hover:underline">Approve</button>
                          <button type="button" (click)="reviewDocument(doc, 'returned')" class="text-amber-600 font-bold hover:underline">Return</button>
                          <button type="button" (click)="reviewDocument(doc, 'rejected')" class="text-red-600 font-bold hover:underline">Reject</button>
                        }
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <p class="text-xs text-gray-500 bg-gray-50 border border-dashed rounded-lg p-4 text-center">
                  No documents generated yet. Click "Preview Live" to generate one.
                </p>
              }

              <!-- Status History -->
              <h4 class="mt-6 mb-3 text-xs font-bold text-gray-700 uppercase tracking-wide">Status History Logs</h4>
              @if (request.history && request.history.length > 0) {
                <ol class="border-l-2 border-gray-200 space-y-3 pl-4">
                  @for (entry of request.history; track entry.history_id) {
                    <li class="text-xs">
                      <div class="flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span class="font-semibold text-gray-900">{{ entry.status_name }}</span>
                        <span class="text-[11px] text-gray-400">{{ formatDate(entry.changed_at) }}</span>
                      </div>
                      <p class="ml-4 text-xs text-gray-500 font-medium">{{ entry.changed_by_name ? entry.changed_by_name : 'System' }}{{ entry.remarks ? ' — ' + entry.remarks : '' }}</p>
                    </li>
                  }
                </ol>
              } @else {
                <p class="text-xs text-gray-500">No status history recorded.</p>
              }
          </div>
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
  services = signal<Service[]>([]);
  loading = signal(true);
  search = signal('');
  page = signal(1);
  limit = 20;
  total = signal(0);
  sortColumn = signal('request_id');
  sortDirection = signal<'ASC' | 'DESC'>('DESC');
  statusFilter = signal('');
  serviceFilter = signal('');
  datePreset = signal('');
  dateFrom = signal('');
  dateTo = signal('');

  showForm = signal(false);
  saving = signal(false);
  showDetails = signal(false);
  selectedRequest = signal<RequestDetail | null>(null);
  selectedRow = signal<DocumentRequest | null>(null);
  documents = signal<GeneratedDocument[]>([]);
  generatingDoc = signal(false);
  previewBusy = signal(false);
  docError = signal('');
  docNotice = signal('');

  stepperSteps = [
    { id: 1, label: 'Submitted' },
    { id: 4, label: 'Under Review' },
    { id: 5, label: 'Processing' },
    { id: 6, label: 'Ready' },
    { id: 7, label: 'Released' }
  ];

  private sseSubscription: any = null;
  private pendingRequestId: number | null = null;

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
    private serviceService: ServiceService,
    private documentService: DocumentService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadServices();
    this.route.queryParams.subscribe(params => {
      if (params['requestId']) {
        this.pendingRequestId = parseInt(params['requestId']);
        const request = this.requests().find(r => r.request_id === this.pendingRequestId);
        if (request) {
          this.viewDetails(request);
        }
        this.router.navigate([], { queryParams: { requestId: null }, queryParamsHandling: 'merge' });
      }
      if (params['new'] === '1') {
        this.showForm.set(true);
        this.router.navigate([], { queryParams: { new: null }, queryParamsHandling: 'merge' });
      }
    });
    this.loadRequests();
    this.connectToRequestUpdates();
  }

  ngOnDestroy() {
    this.disconnectFromRequestUpdates();
  }

  isStepActive(currentStatusId: number, stepId: number): boolean {
    const statusStepsMap: Record<number, number[]> = {
      1: [1],
      2: [1],
      3: [1],
      4: [1, 4],
      5: [1, 4, 5],
      6: [1, 4, 5, 6],
      7: [1, 4, 5, 6, 7],
      8: [],
      9: []
    };
    return (statusStepsMap[currentStatusId] || []).includes(stepId);
  }


  private connectToRequestUpdates() {
    this.sseSubscription = this.notificationService.sse$.subscribe(event => {
      if (event?.type?.startsWith('request-')) {
        this.loadRequests();
        const current = this.selectedRequest();
        if (current && (event.data?.requestId === current.request_id || event.data?.request_id === current.request_id)) {
          this.requestService.getById(current.request_id).subscribe({
            next: (res) => {
              this.selectedRequest.set(res.data as RequestDetail);
              this.loadDocuments(current.request_id);
            }
          });
        }
      }
    });
  }

  private disconnectFromRequestUpdates() {
    if (this.sseSubscription) {
      this.sseSubscription.unsubscribe();
      this.sseSubscription = null;
    }
  }

  loadServices() {
    this.serviceService.getAll({ limit: 100 }).subscribe({
      next: (res) => {
        this.services.set(res.data || []);
      }
    });
  }

  loadRequests() {
    this.loading.set(true);
    this.requestService.getAll({
      search: this.search() || undefined,
      statusId: this.statusFilter() ? parseInt(this.statusFilter()) : undefined,
      serviceId: this.serviceFilter() ? parseInt(this.serviceFilter()) : undefined,
      dateFrom: this.dateFrom() || undefined,
      dateTo: this.dateTo() || undefined,
      page: this.page(),
      limit: this.limit,
      sortBy: this.sortColumn(),
      sortOrder: this.sortDirection()
    }).subscribe({
      next: (res) => {
        this.requests.set(res.data);
        this.total.set(res.pagination.total);
        this.loading.set(false);
        if (this.pendingRequestId !== null) {
          const pending = this.pendingRequestId;
          this.pendingRequestId = null;
          const request = res.data.find(r => r.request_id === pending);
          if (request) {
            this.viewDetails(request);
          }
        }
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

  onServiceFilter(serviceId: string) {
    this.serviceFilter.set(serviceId);
    this.page.set(1);
    this.loadRequests();
  }

  onDatePresetChange(preset: string) {
    this.datePreset.set(preset);
    this.page.set(1);
    const now = new Date();

    if (preset === 'today') {
      const d = this.formatDateIso(now);
      this.dateFrom.set(d);
      this.dateTo.set(d);
    } else if (preset === 'yesterday') {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      const d = this.formatDateIso(yest);
      this.dateFrom.set(d);
      this.dateTo.set(d);
    } else if (preset === 'last7days') {
      const past7 = new Date(now);
      past7.setDate(past7.getDate() - 6);
      this.dateFrom.set(this.formatDateIso(past7));
      this.dateTo.set(this.formatDateIso(now));
    } else if (preset === 'thisMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      this.dateFrom.set(this.formatDateIso(firstDay));
      this.dateTo.set(this.formatDateIso(now));
    } else if (preset === 'custom') {
      if (!this.dateFrom()) this.dateFrom.set(this.formatDateIso(now));
      if (!this.dateTo()) this.dateTo.set(this.formatDateIso(now));
    } else {
      this.dateFrom.set('');
      this.dateTo.set('');
    }
    this.loadRequests();
  }

  onCustomDateChange(type: 'from' | 'to', value: string) {
    if (type === 'from') this.dateFrom.set(value);
    if (type === 'to') this.dateTo.set(value);
    this.page.set(1);
    this.loadRequests();
  }

  private formatDateIso(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatSubmissionDate(dateStr: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatSubmissionTime(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  hasActiveFilters(): boolean {
    return !!(this.search() || this.statusFilter() || this.serviceFilter() || this.datePreset() || this.dateFrom() || this.dateTo());
  }

  resetFilters() {
    this.search.set('');
    this.statusFilter.set('');
    this.serviceFilter.set('');
    this.datePreset.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
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

  onLimitChange(limit: number) {
    this.limit = limit;
    this.page.set(1);
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
      next: () => {
        // Fetch updated details immediately so stepper highlights the new step in real-time
        this.requestService.getById(request.request_id).subscribe({
          next: (res) => {
            this.selectedRequest.set(res.data as RequestDetail);
            this.loadRequests();
            this.loadDocuments(request.request_id);
          }
        });
      },
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
          this.docNotice.set('No document generated yet. It becomes available once the request is Under Review.');
        }
      },
      error: () => {
        this.docError.set('Could not load generated documents.');
      }
    });
  }

  canGenerateDocument(): boolean {
    const statusId = this.selectedRequest()?.status_id;
    return statusId === 4 || statusId === 5 || statusId === 6 || statusId === 7;
  }

  generateDocument() {
    const request = this.selectedRequest();
    if (!request) return;
    if (!this.canGenerateDocument()) {
      this.docError.set('Only approved requests (Under Review and onwards) can generate official documents.');
      return;
    }
    this.generatingDoc.set(true);
    this.docError.set('');
    this.documentService.generate(request.request_id).subscribe({
      next: () => {
        this.generatingDoc.set(false);
        this.loadDocuments(request.request_id);
      },
      error: (err) => {
        this.generatingDoc.set(false);
        this.docError.set(err.error?.message || 'Failed to generate document.');
        this.loadDocuments(request.request_id);
      }
    });
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
    this.previewTitle = doc.file_name;
    this.previewBlob = null;
    this.showPreview.set(true);
    this.documentService.fetchBlob(request.request_id, doc.document_id).subscribe({
      next: (blob) => {
        this.previewBlob = blob;
      },
      error: () => {
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
      this.previewBusy.set(false);
      this.previewDocument(docs[docs.length - 1]);
      return;
    }
    if (!this.canGenerateDocument()) {
      this.previewBusy.set(false);
      this.docError.set('A document can only be generated once the request is Under Review.');
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

  approvalBadge(status: string): { class: string; label: string } | null {
    switch (status) {
      case 'approved':
        return { class: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold text-green-700 bg-green-100', label: 'Approved' };
      case 'rejected':
        return { class: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold text-red-700 bg-red-100', label: 'Rejected' };
      case 'returned':
        return { class: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold text-amber-700 bg-amber-100', label: 'Returned' };
      case 'pending':
        return { class: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold text-gray-700 bg-gray-100', label: 'Pending Review' };
      default:
        return null;
    }
  }

  reviewDocument(doc: GeneratedDocument, status: 'approved' | 'rejected' | 'returned') {
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
