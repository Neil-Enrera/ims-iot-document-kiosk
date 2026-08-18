import { Component, Input, Output, EventEmitter, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-slate-200">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr>
            @for (col of columns; track col.key) {
              <th
                class="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider"
                [style.width]="col.width"
                [class.cursor-pointer]="col.sortable"
                (click)="col.sortable && onSort.emit(col.key)">
                <div class="flex items-center gap-1">
                  {{ col.label }}
                  @if (col.sortable && sortColumn === col.key) {
                    <span class="text-orange-600">{{ sortDirection === 'ASC' ? '&#9650;' : '&#9660;' }}</span>
                  }
                </div>
              </th>
            }
            @if (rowActionsTemplate) {
              <th class="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider"></th>
            }
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-slate-100">
          @if (loading) {
            <tr>
              <td [attr.colspan]="columns.length + (rowActionsTemplate ? 1 : 0)" class="px-6 py-12 text-center text-slate-500">
                <div class="flex justify-center items-center">
                  <svg class="animate-spin h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  <span class="ml-2 text-sm font-medium">Loading...</span>
                </div>
              </td>
            </tr>
          } @else if (data.length === 0) {
            <tr>
              <td [attr.colspan]="columns.length + (rowActionsTemplate ? 1 : 0)" class="px-6 py-12 text-center text-slate-500 text-sm font-medium">
                {{ emptyMessage }}
              </td>
            </tr>
          } @else {
            @for (row of data; track row[trackBy]; let i = $index) {
              <tr 
                class="hover:bg-orange-50/40 cursor-pointer transition-colors group"
                [class.bg-orange-50/30]="selectedRow && selectedRow[trackBy] === row[trackBy]"
                [class.border-l-4]="selectedRow && selectedRow[trackBy] === row[trackBy]"
                [class.border-orange-500]="selectedRow && selectedRow[trackBy] === row[trackBy]"
                [class.shadow-xs]="selectedRow && selectedRow[trackBy] === row[trackBy]"
                (click)="onRowClick.emit(row)">
                @for (col of columns; track col.key) {
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900"
                      [class.text-center]="col.align === 'center'"
                      [class.text-right]="col.align === 'right'">
                    @if (cellTemplates[col.key]) {
                      <ng-container [ngTemplateOutlet]="cellTemplates[col.key]"
                                    [ngTemplateOutletContext]="{ $implicit: row[col.key], row: row, col: col }">
                      </ng-container>
                    } @else {
                      <ng-container [ngTemplateOutlet]="cellTemplate"
                                    [ngTemplateOutletContext]="{ $implicit: row[col.key], row: row, col: col }">
                      </ng-container>
                    }
                  </td>
                }
                @if (rowActionsTemplate) {
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <ng-container [ngTemplateOutlet]="rowActionsTemplate"
                                  [ngTemplateOutletContext]="{ $implicit: row }">
                    </ng-container>
                  </td>
                }
              </tr>
            }
          }
        </tbody>
      </table>
    </div>
    <ng-template #cellTemplate let-value let-row="row" let-col="col">
      {{ value ?? '-' }}
    </ng-template>
  `
})
export class TableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() loading = false;
  @Input() emptyMessage = 'No data available';
  @Input() trackBy = 'id';
  @Input() sortColumn = '';
  @Input() sortDirection: 'ASC' | 'DESC' = 'ASC';
  @Input() rowActionsTemplate: TemplateRef<any> | null = null;
  @Input() cellTemplates: Record<string, TemplateRef<any>> = {};
  @Input() selectedRow: any = null;

  @Output() onSort = new EventEmitter<string>();
  @Output() onRowClick = new EventEmitter<any>();
}
