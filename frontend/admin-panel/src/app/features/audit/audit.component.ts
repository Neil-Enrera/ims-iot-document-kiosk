import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditService } from '../../shared/services';
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
            Real-time security and operational audit trail tracking all staff and system actions.
          </p>
        </div>
        <div class="flex items-center gap-2.5">
          <app-button variant="secondary" (onClick)="exportCsv()" [disabled]="logs().length === 0">
            <svg class="w-4 h-4 mr-1.5 inline" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
            </svg>
            Export CSV
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
              placeholder="Search user, action, IP..."
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

      <!-- Logs Table Card -->
      <app-card>
        <app-table
          [columns]="columns"
          [data]="logs()"
          [loading]="loading()"
          trackBy="audit_log_id"
          emptyMessage="No audit logs match the current criteria"
          [cellTemplates]="{ user_name: userCell, module: moduleCell, action: actionCell, ip_address: ipCell, created_at: dateCell, actions: actionsCell }"
        >
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

          <!-- IP Address Cell -->
          <ng-template #ipCell let-row="row">
            <span class="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {{ row.ip_address || '—' }}
            </span>
          </ng-template>

          <!-- Date Cell -->
          <ng-template #dateCell let-row="row">
            <div class="text-xs">
              <p class="font-semibold text-slate-800">{{ row.created_at | date: 'mediumDate' }}</p>
              <p class="text-slate-500">{{ row.created_at | date: 'shortTime' }}</p>
            </div>
          </ng-template>

          <!-- Actions Cell -->
          <ng-template #actionsCell let-row="row">
            <button
              (click)="viewDetails(row)"
              class="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline">
              Details
            </button>
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

      <!-- Details Modal -->
      <app-modal
        [open]="showDetailsModal()"
        title="Audit Log Entry Details"
        (onClose)="closeDetailsModal()">
        @if (selectedLog()) {
          <div class="space-y-4 text-sm">
            <div class="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p class="text-xs text-slate-500 font-medium uppercase">Log ID</p>
                <p class="font-bold text-slate-900 mt-0.5">#{{ selectedLog()?.audit_log_id }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-500 font-medium uppercase">Timestamp</p>
                <p class="font-semibold text-slate-900 mt-0.5">{{ selectedLog()?.created_at | date: 'medium' }}</p>
              </div>
            </div>

            <div class="space-y-3">
              <div>
                <p class="text-xs text-slate-500 font-medium uppercase">User / Actor</p>
                <div class="flex items-center gap-2 mt-1">
                  <span class="font-semibold text-slate-900">{{ selectedLog()?.user_name || selectedLog()?.username || 'System' }}</span>
                  @if (selectedLog()?.role_name) {
                    <span class="px-2 py-0.5 text-xs rounded-full bg-slate-200 text-slate-800 font-medium">
                      {{ selectedLog()?.role_name }}
                    </span>
                  }
                </div>
                @if (selectedLog()?.email) {
                  <p class="text-xs text-slate-500 mt-0.5">{{ selectedLog()?.email }}</p>
                }
              </div>

              <div>
                <p class="text-xs text-slate-500 font-medium uppercase">Module</p>
                <span class="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold" [ngClass]="getModuleBadgeClass(selectedLog()?.module || '')">
                  {{ selectedLog()?.module || 'System' }}
                </span>
              </div>

              <div>
                <p class="text-xs text-slate-500 font-medium uppercase">Action Description</p>
                <p class="p-3 bg-slate-100 rounded-lg text-slate-800 font-medium mt-1 break-words">
                  {{ selectedLog()?.action }}
                </p>
              </div>

              <div>
                <p class="text-xs text-slate-500 font-medium uppercase">IP Address</p>
                <p class="font-mono text-xs text-slate-700 mt-1">{{ selectedLog()?.ip_address || 'N/A' }}</p>
              </div>
            </div>

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
    'Settings',
    'Users',
    'Services',
    'Kiosk'
  ]);

  showDetailsModal = signal(false);
  selectedLog = signal<AuditLog | null>(null);

  columns: TableColumn[] = [
    { key: 'audit_log_id', label: 'ID', sortable: true },
    { key: 'user_name', label: 'User / Actor' },
    { key: 'module', label: 'Module', sortable: true },
    { key: 'action', label: 'Action Taken', sortable: true },
    { key: 'ip_address', label: 'IP Address' },
    { key: 'created_at', label: 'Timestamp', sortable: true },
    { key: 'actions', label: 'Details' }
  ];

  constructor(private auditService: AuditService) {}

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

  viewDetails(log: AuditLog) {
    this.selectedLog.set(log);
    this.showDetailsModal.set(true);
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
    return 'bg-slate-100 text-slate-800 border border-slate-200';
  }

  exportCsv() {
    const currentLogs = this.logs();
    if (!currentLogs || currentLogs.length === 0) return;

    const headers = ['Log ID', 'Timestamp', 'User', 'Role', 'Module', 'Action', 'IP Address'];
    const rows = currentLogs.map(l => [
      l.audit_log_id,
      `"${new Date(l.created_at).toLocaleString()}"`,
      `"${(l.user_name || l.username || 'System').replace(/"/g, '""')}"`,
      `"${(l.role_name || '').replace(/"/g, '""')}"`,
      `"${(l.module || 'System').replace(/"/g, '""')}"`,
      `"${(l.action || '').replace(/"/g, '""')}"`,
      `"${l.ip_address || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
