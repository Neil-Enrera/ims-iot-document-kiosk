import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { firstValueFrom } from 'rxjs';
import { AuditService } from '../../shared/services';
import { AuthService } from '../../core/services/auth.service';
import { AuditLog } from '../../shared/interfaces/api.interfaces';
import { TableComponent, TableColumn } from '../../shared/components/table.component';
import { CardComponent } from '../../shared/components/card.component';
import { InputComponent } from '../../shared/components/input.component';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { ButtonComponent } from '../../shared/components/button.component';
import { ModalComponent } from '../../shared/components/modal.component';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableComponent,
    CardComponent,
    InputComponent,
    PaginationComponent,
    ButtonComponent,
    ModalComponent,
    DatePipe
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Audit Logs</h1>
          <p class="text-sm text-slate-500 mt-1">
            Real-time security and operational audit trail tracking all staff, kiosk, and system actions.
          </p>
        </div>
        <div class="flex items-center gap-2.5">
          <app-button variant="secondary" (onClick)="exportPdf()" [disabled]="logs().length === 0 || exporting()">
            @if (exporting()) {
              <svg class="animate-spin h-4 w-4 mr-1.5 inline text-orange-600" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <span>Exporting...</span>
            } @else {
              <svg class="w-4 h-4 mr-1.5 inline text-orange-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <span>Export PDF</span>
            }
          </app-button>
          <app-button variant="primary" (onClick)="loadLogs()">
            <svg class="w-4 h-4 mr-1.5 inline" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>
            </svg>
            Refresh
          </app-button>
        </div>
      </div>

      <!-- Filters Card -->
      <app-card>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <!-- Search -->
          <div class="lg:col-span-1">
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Search</label>
            <app-input
              placeholder="Search user, action, module..."
              [value]="search()"
              (valueChange)="onSearch($event)" />
          </div>

          <!-- Module Filter -->
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Module</label>
            <select
              [value]="selectedModule()"
              (change)="onModuleChange($any($event.target).value)"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Modules</option>
              @for (mod of availableModules(); track mod) {
                <option [value]="mod">{{ mod }}</option>
              }
            </select>
          </div>

          <!-- Date From -->
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Date From</label>
            <input
              type="date"
              [value]="dateFrom()"
              (change)="onDateFromChange($any($event.target).value)"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <!-- Date To & Clear -->
          <div class="flex items-center gap-2">
            <div class="flex-1">
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Date To</label>
              <input
                type="date"
                [value]="dateTo()"
                (change)="onDateToChange($any($event.target).value)"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            @if (search() || selectedModule() || dateFrom() || dateTo()) {
              <button
                (click)="clearFilters()"
                title="Clear all filters"
                class="mt-6 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-300 hover:border-red-200 rounded-lg transition-colors shrink-0">
                Clear
              </button>
            }
          </div>
        </div>
      </app-card>

      <!-- Logs Table Card (Clickable rows) -->
      <app-card>
        <app-table
          [columns]="columns"
          [data]="logs()"
          [loading]="loading()"
          trackBy="audit_log_id"
          emptyMessage="No audit logs match the current criteria"
          [cellTemplates]="{
            audit_log_id: idCell,
            user_name: userCell,
            module: moduleCell,
            action: actionCell,
            created_at: dateCell
          }"
          (onRowClick)="onRowClick($event)"
        >
          <!-- ID Cell -->
          <ng-template #idCell let-row="row">
            <span class="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              #{{ row.audit_log_id }}
            </span>
          </ng-template>

          <!-- User Cell -->
          <ng-template #userCell let-row="row">
            <div class="flex items-center gap-2.5 min-w-0 py-0.5">
              <div class="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                {{ getInitials(row.user_name || row.username || 'System') }}
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-slate-900 truncate">
                  {{ row.user_name || row.username || 'System' }}
                </p>
                @if (row.role_name) {
                  <span class="inline-block text-[11px] font-medium text-slate-500 leading-none">
                    {{ row.role_name }}
                  </span>
                }
              </div>
            </div>
          </ng-template>

          <!-- Module Cell -->
          <ng-template #moduleCell let-row="row">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold" [ngClass]="getModuleBadgeClass(row.module)">
              {{ row.module || 'System' }}
            </span>
          </ng-template>

          <!-- Action Cell -->
          <ng-template #actionCell let-row="row">
            <span class="text-sm font-medium text-slate-800 break-words">
              {{ row.action }}
            </span>
          </ng-template>

          <!-- Date & Time Cell with subtle chevron -->
          <ng-template #dateCell let-row="row">
            <div class="flex items-center justify-between gap-3">
              <div class="text-xs">
                <p class="font-semibold text-slate-800">{{ row.created_at | date: 'mediumDate' }}</p>
                <p class="text-slate-500">{{ row.created_at | date: 'shortTime' }}</p>
              </div>
              <svg class="w-4 h-4 text-slate-300 group-hover:text-orange-500 transition-colors shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </ng-template>
        </app-table>

        @if (total() > 0) {
          <app-pagination
            [total]="total()"
            [currentPage]="page()"
            [limit]="limit"
            itemLabel="audit logs"
            (onPageChange)="onPageChange($event)"
            (onLimitChange)="onLimitChange($event)" />
        }
      </app-card>

      <!-- Audit Log Details Modal -->
      <app-modal
        [open]="showDetailsModal()"
        [title]="selectedLog() ? ('Audit Log #' + selectedLog()?.audit_log_id) : 'Audit Log Details'"
        containerClass="max-w-xl"
        (onClose)="closeDetailsModal()">
        @if (selectedLog(); as log) {
          <div class="space-y-5 text-sm">
            <!-- Header Summary Card -->
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
              <div>
                <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Module</span>
                <div class="mt-1">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold" [ngClass]="getModuleBadgeClass(log.module)">
                    {{ log.module || 'System' }}
                  </span>
                </div>
              </div>
              <div class="text-right">
                <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Date & Time</span>
                <p class="font-bold text-slate-900 mt-1">{{ log.created_at | date: 'medium' }}</p>
              </div>
            </div>

            <!-- User / Actor Section -->
            <div class="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Administrator / Staff / User</p>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-orange-100 text-orange-700 font-bold text-sm flex items-center justify-center shrink-0 border border-orange-200">
                  {{ getInitials(log.user_name || log.username || 'System') }}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <p class="font-bold text-slate-900 text-base">{{ log.user_name || log.username || 'System' }}</p>
                    @if (log.role_name) {
                      <span class="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                        {{ log.role_name }}
                      </span>
                    }
                  </div>
                  <div class="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                    @if (log.username) {
                      <span>Username: <strong class="text-slate-700">&#64;{{ log.username }}</strong></span>
                    }
                    @if (log.email) {
                      <span>•</span>
                      <span>{{ log.email }}</span>
                    }
                  </div>
                </div>
              </div>
            </div>

            <!-- Action Description Section -->
            <div class="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Action Performed</p>
              <div class="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <p class="font-semibold text-slate-900 text-sm leading-relaxed break-words">
                  {{ log.action }}
                </p>
              </div>
            </div>

            <!-- Metadata Section -->
            <div class="p-4 rounded-xl border border-slate-200 bg-white">
              <p class="text-xs font-bold uppercase tracking-wider text-slate-500">User ID Reference</p>
              <p class="text-xs font-semibold text-slate-800 mt-1">
                User #{{ log.user_id }}
              </p>
            </div>

            <!-- Footer Action -->
            <div class="pt-3 border-t border-slate-200 flex justify-end">
              <app-button variant="secondary" (onClick)="closeDetailsModal()">Close</app-button>
            </div>
          </div>
        }
      </app-modal>
    </div>
  `
})
export class AuditComponent implements OnInit {
  logs = signal<AuditLog[]>([]);
  loading = signal(true);
  search = signal('');
  selectedModule = signal('');
  dateFrom = signal('');
  dateTo = signal('');
  page = signal(1);
  limit = 20;
  total = signal(0);
  availableModules = signal<string[]>([
    'Authentication',
    'Requests',
    'Residents',
    'RFID',
    'Barangay ID',
    'BarangayID',
    'Documents',
    'Settings',
    'Users',
    'Services',
    'Kiosk'
  ]);

  showDetailsModal = signal(false);
  selectedLog = signal<AuditLog | null>(null);
  exporting = signal(false);

  columns: TableColumn[] = [
    { key: 'audit_log_id', label: 'ID', sortable: true },
    { key: 'user_name', label: 'User / Actor' },
    { key: 'module', label: 'Module', sortable: true },
    { key: 'action', label: 'Action Performed', sortable: true },
    { key: 'created_at', label: 'Date & Time', sortable: true }
  ];

  constructor(
    private auditService: AuditService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.loadModules();
    this.loadLogs();
  }

  loadModules() {
    this.auditService.getModules().subscribe({
      next: (res: any) => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          const merged = Array.from(new Set([...this.availableModules(), ...res.data])).sort();
          this.availableModules.set(merged);
        }
      },
      error: () => {}
    });
  }

  loadLogs() {
    this.loading.set(true);
    this.auditService.getAll({
      search: this.search(),
      module: this.selectedModule(),
      dateFrom: this.dateFrom(),
      dateTo: this.dateTo(),
      page: this.page(),
      limit: this.limit
    }).subscribe({
      next: (res) => {
        this.logs.set(res.data || []);
        this.total.set(res.pagination?.total || 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onRowClick(log: AuditLog) {
    this.selectedLog.set(log);
    this.showDetailsModal.set(true);
  }

  onSearch(value: string) {
    this.search.set(value);
    this.page.set(1);
    this.loadLogs();
  }

  onModuleChange(mod: string) {
    this.selectedModule.set(mod);
    this.page.set(1);
    this.loadLogs();
  }

  onDateFromChange(date: string) {
    this.dateFrom.set(date);
    this.page.set(1);
    this.loadLogs();
  }

  onDateToChange(date: string) {
    this.dateTo.set(date);
    this.page.set(1);
    this.loadLogs();
  }

  clearFilters() {
    this.search.set('');
    this.selectedModule.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.page.set(1);
    this.loadLogs();
  }

  onPageChange(page: number) {
    this.page.set(page);
    this.loadLogs();
  }

  onLimitChange(limit: number) {
    this.limit = limit;
    this.page.set(1);
    this.loadLogs();
  }

  closeDetailsModal() {
    this.showDetailsModal.set(false);
    this.selectedLog.set(null);
  }

  getInitials(name: string): string {
    if (!name) return 'S';
    return name
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  getModuleBadgeClass(module: string): string {
    const mod = (module || '').toLowerCase();
    if (mod.includes('auth')) return 'bg-sky-100 text-sky-800 border border-sky-200';
    if (mod.includes('request')) return 'bg-blue-100 text-blue-800 border border-blue-200';
    if (mod.includes('resident')) return 'bg-teal-100 text-teal-800 border border-teal-200';
    if (mod.includes('rfid')) return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    if (mod.includes('barangay') || mod.includes('id')) return 'bg-purple-100 text-purple-800 border border-purple-200';
    if (mod.includes('setting')) return 'bg-amber-100 text-amber-800 border border-amber-200';
    if (mod.includes('user')) return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
    if (mod.includes('service')) return 'bg-rose-100 text-rose-800 border border-rose-200';
    if (mod.includes('kiosk')) return 'bg-orange-100 text-orange-800 border border-orange-200';
    if (mod.includes('doc')) return 'bg-cyan-100 text-cyan-800 border border-cyan-200';
    return 'bg-slate-100 text-slate-800 border border-slate-200';
  }

  private async loadLogoImage(): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = 'Barangay Logo.png';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
    });
  }

  private formatDateRangeLabel(): string {
    const formatSingle = (dateStr: string) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const from = formatSingle(this.dateFrom());
    const to = formatSingle(this.dateTo());
    if (from && to) {
      return from === to ? from : `${from} - ${to}`;
    }
    return from || to || 'All Dates';
  }

  private formatDateTimeNow(): string {
    const now = new Date();
    const datePart = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timePart = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${datePart}, ${timePart}`;
  }

  async exportPdf() {
    if (this.logs().length === 0) return;
    this.exporting.set(true);

    try {
      // If there are more records than currently displayed on this single page, fetch all matching records up to 2000
      let recordsToExport: AuditLog[] = this.logs();
      if (this.total() > this.logs().length) {
        try {
          const res = await firstValueFrom(this.auditService.getAll({
            search: this.search(),
            module: this.selectedModule(),
            dateFrom: this.dateFrom(),
            dateTo: this.dateTo(),
            page: 1,
            limit: Math.min(this.total(), 2000)
          }));
          if (res?.data && res.data.length > 0) {
            recordsToExport = res.data;
          }
        } catch {
          recordsToExport = this.logs();
        }
      }

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth(); // 297 mm
      const pageHeight = doc.internal.pageSize.getHeight(); // 210 mm
      const marginX = 14;

      // 1. Logo on upper-left
      const logoImg = await this.loadLogoImage();
      if (logoImg) {
        doc.addImage(logoImg, 'PNG', marginX, 10, 22, 22);
      }

      // 2. Formal Center Government Header
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text('REPUBLIC OF THE PHILIPPINES', pageWidth / 2, 12, { align: 'center' });
      doc.text('CITY OF SAN JOSE DEL MONTE', pageWidth / 2, 16, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text('BARANGAY SAN MANUEL', pageWidth / 2, 20.5, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(234, 88, 12);
      doc.text('IMS SECURITY & OPERATIONS AUDIT TRAIL', pageWidth / 2, 25, { align: 'center' });

      // Report Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12.5);
      doc.setTextColor(15, 23, 42);
      doc.text('AUDIT LOGS REPORT', pageWidth / 2, 31.5, { align: 'center' });

      // 3. Compact Report Information Block on Upper-Right
      const infoBoxWidth = 78;
      const infoBoxX = pageWidth - marginX - infoBoxWidth;
      const infoBoxY = 10;

      doc.setFillColor(255, 247, 237); // Light peach/orange background #FFF7ED
      doc.setDrawColor(254, 215, 170); // Soft orange border #FED7AA
      doc.setLineWidth(0.2);
      doc.roundedRect(infoBoxX, infoBoxY, infoBoxWidth, 21, 1.5, 1.5, 'FD');

      const drawIcon = (type: 'calendar' | 'clock' | 'user', x: number, y: number) => {
        doc.setDrawColor(249, 115, 22);
        doc.setLineWidth(0.3);
        if (type === 'calendar') {
          doc.rect(x, y, 3, 3);
          doc.line(x, y + 1, x + 3, y + 1);
          doc.line(x + 0.8, y - 0.4, x + 0.8, y + 0.3);
          doc.line(x + 2.2, y - 0.4, x + 2.2, y + 0.3);
        } else if (type === 'clock') {
          doc.circle(x + 1.5, y + 1.5, 1.5);
          doc.line(x + 1.5, y + 0.6, x + 1.5, y + 1.5);
          doc.line(x + 1.5, y + 1.5, x + 2.2, y + 1.5);
        } else if (type === 'user') {
          doc.circle(x + 1.5, y + 0.9, 0.8);
          doc.line(x + 0.5, y + 3, x + 2.5, y + 3);
          doc.line(x + 0.5, y + 3, x + 0.8, y + 2.1);
          doc.line(x + 2.5, y + 3, x + 2.2, y + 2.1);
          doc.line(x + 0.8, y + 2.1, x + 2.2, y + 2.1);
        }
      };

      const currentUser = this.auth.currentUser();
      const currentUserName = currentUser
        ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.username || 'Administrator'
        : 'Administrator';

      // Row 1: Date Range / Module Filter
      drawIcon('calendar', infoBoxX + 2.5, infoBoxY + 3.2);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(234, 88, 12);
      doc.text('Date Range:', infoBoxX + 7.5, infoBoxY + 5.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(this.formatDateRangeLabel(), infoBoxX + 27, infoBoxY + 5.5);

      // Row 2: Generated On
      drawIcon('clock', infoBoxX + 2.5, infoBoxY + 9.5);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(234, 88, 12);
      doc.text('Generated On:', infoBoxX + 7.5, infoBoxY + 12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(this.formatDateTimeNow(), infoBoxX + 27, infoBoxY + 12);

      // Row 3: Generated By
      drawIcon('user', infoBoxX + 2.5, infoBoxY + 15.5);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(234, 88, 12);
      doc.text('Generated By:', infoBoxX + 7.5, infoBoxY + 18);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(currentUserName, infoBoxX + 27, infoBoxY + 18);

      // 4. Thin orange horizontal divider line below title
      doc.setDrawColor(249, 115, 22);
      doc.setLineWidth(0.6);
      doc.line(marginX, 35, pageWidth - marginX, 35);

      // 5. Main Audit Table
      const tableRows = recordsToExport.map(l => {
        const dateObj = new Date(l.created_at);
        const dateFormatted = !isNaN(dateObj.getTime())
          ? dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ', ' +
            dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
          : '-';
        return [
          `#${l.audit_log_id}`,
          dateFormatted,
          l.user_name || l.username || 'System',
          l.role_name || '-',
          l.module || 'System',
          l.action || '-'
        ];
      });

      const totalCountLabel = `${recordsToExport.length} audit log record(s)`;

      autoTable(doc, {
        startY: 38,
        margin: { left: marginX, right: marginX, bottom: 25 },
        head: [[
          'Log ID',
          'Date & Time',
          'User / Actor',
          'Role',
          'Module',
          'Action Performed'
        ]],
        body: tableRows,
        foot: [[
          '',
          '',
          '',
          '',
          'Total Records:',
          totalCountLabel
        ]],
        theme: 'grid',
        headStyles: {
          fillColor: [249, 115, 22],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8.5,
          halign: 'left',
          cellPadding: 3
        },
        bodyStyles: {
          textColor: [30, 41, 59],
          fontSize: 8,
          cellPadding: 2.8,
          lineColor: [226, 232, 240],
          lineWidth: 0.15
        },
        footStyles: {
          fillColor: [255, 247, 237],
          textColor: [15, 23, 42],
          fontStyle: 'bold',
          fontSize: 8.5,
          cellPadding: 3,
          lineColor: [254, 215, 170],
          lineWidth: 0.2
        },
        columnStyles: {
          0: { cellWidth: 20, fontStyle: 'bold' },
          1: { cellWidth: 42 },
          2: { cellWidth: 42, fontStyle: 'bold' },
          3: { cellWidth: 26 },
          4: { cellWidth: 30 },
          5: { cellWidth: 109 }
        },
        didDrawPage: () => {
          const pageStr = `Page ${doc.internal.pages.length - 1}`;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(148, 163, 184);
          doc.text('BARANGAY SAN MANUEL • IMS AUDIT LOGS — OFFICIAL GOVERNMENT RECORD', marginX, pageHeight - 6);
          doc.text(pageStr, pageWidth - marginX, pageHeight - 6, { align: 'right' });
        }
      });

      // 6. Signature Section (Below the Table)
      const finalY = (doc as any).lastAutoTable?.finalY || 140;
      let sigY = finalY + 10;

      if (sigY + 28 > pageHeight - 12) {
        doc.addPage();
        sigY = 22;
      }

      const leftSigX = marginX + 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('Prepared By:', leftSigX, sigY);

      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.4);
      doc.line(leftSigX, sigY + 18, leftSigX + 65, sigY + 18);

      const rightSigX = pageWidth - marginX - 75;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('Approved By:', rightSigX, sigY);

      doc.line(rightSigX, sigY + 18, rightSigX + 65, sigY + 18);

      // 7. Save Generated PDF
      const datePart = new Date().toISOString().slice(0, 10);
      const filename = `audit-logs-report_${datePart}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error('Error generating Audit Logs PDF:', err);
    } finally {
      this.exporting.set(false);
    }
  }
}
