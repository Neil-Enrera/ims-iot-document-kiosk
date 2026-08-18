import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuditService } from '../../shared/services';
import { AuditLog } from '../../shared/interfaces/api.interfaces';
import { TableComponent, TableColumn } from '../../shared/components/table.component';
import { CardComponent } from '../../shared/components/card.component';
import { InputComponent } from '../../shared/components/input.component';
import { PaginationComponent } from '../../shared/components/pagination.component';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [TableComponent, CardComponent, InputComponent, PaginationComponent, DatePipe],
  template: `
    <div>
      <h1 class="text-2xl font-bold text-slate-900 tracking-tight mb-6">Audit Logs</h1>

      <app-card>
        <div class="mb-4">
          <app-input placeholder="Search logs..." [value]="search()" (valueChange)="onSearch($event)" />
        </div>

        <app-table
          [columns]="columns"
          [data]="logs()"
          [loading]="loading()"
          trackBy="audit_log_id"
          emptyMessage="No audit logs found"
          [cellTemplates]="{ username: userCell, action: actionCell, created_at: dateCell }"
        >
          <ng-template #userCell let-row="row">
            <span class="text-sm font-semibold text-slate-900">
              {{ row.username || 'System' }}
            </span>
          </ng-template>
          <ng-template #actionCell let-row="row">
            <span class="text-sm font-semibold text-slate-900">
              {{ row.action }}
            </span>
          </ng-template>
          <ng-template #dateCell let-row="row">
            <span class="text-sm font-medium text-slate-700">
              {{ row.created_at | date: 'medium' }}
            </span>
          </ng-template>
        </app-table>

        @if (total() > 0) {
          <app-pagination
            [total]="total()"
            [currentPage]="page()"
            [limit]="limit"
            itemLabel="logs"
            (onPageChange)="onPageChange($event)"
            (onLimitChange)="onLimitChange($event)" />
        }
      </app-card>
    </div>
  `
})
export class AuditComponent implements OnInit {
  logs = signal<AuditLog[]>([]);
  loading = signal(true);
  search = signal('');
  page = signal(1);
  limit = 20;
  total = signal(0);

  columns: TableColumn[] = [
    { key: 'audit_log_id', label: 'ID', sortable: true },
    { key: 'username', label: 'User' },
    { key: 'action', label: 'Action', sortable: true },
    { key: 'module', label: 'Module', sortable: true },
    { key: 'ip_address', label: 'IP Address' },
    { key: 'created_at', label: 'Date', sortable: true }
  ];

  constructor(private auditService: AuditService) {}

  ngOnInit() { this.loadLogs(); }

  loadLogs() {
    this.loading.set(true);
    this.auditService.getAll({ search: this.search(), page: this.page(), limit: this.limit }).subscribe({
      next: (res) => { this.logs.set(res.data); this.total.set(res.pagination.total); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onSearch(value: string) { this.search.set(value); this.page.set(1); this.loadLogs(); }
  onPageChange(page: number) { this.page.set(page); this.loadLogs(); }
  onLimitChange(limit: number) { this.limit = limit; this.page.set(1); this.loadLogs(); }
}
