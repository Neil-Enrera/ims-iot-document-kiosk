import { Component, Input, Output, EventEmitter } from '@angular/core';
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
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            @for (col of columns; track col.key) {
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                [style.width]="col.width"
                [class.cursor-pointer]="col.sortable"
                (click)="col.sortable && onSort.emit(col.key)">
                <div class="flex items-center gap-1">
                  {{ col.label }}
                  @if (col.sortable && sortColumn === col.key) {
                    <span>{{ sortDirection === 'ASC' ? '&#9650;' : '&#9660;' }}</span>
                  }
                </div>
              </th>
            }
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          @if (loading) {
            <tr>
              <td [attr.colspan]="columns.length" class="px-6 py-12 text-center text-gray-500">
                <div class="flex justify-center items-center">
                  <svg class="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  <span class="ml-2">Loading...</span>
                </div>
              </td>
            </tr>
          } @else if (data.length === 0) {
            <tr>
              <td [attr.colspan]="columns.length" class="px-6 py-12 text-center text-gray-500">
                {{ emptyMessage }}
              </td>
            </tr>
          } @else {
            @for (row of data; track row[trackBy]; let i = $index) {
              <tr class="hover:bg-gray-50" (click)="onRowClick.emit(row)">
                @for (col of columns; track col.key) {
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      [class.text-center]="col.align === 'center'"
                      [class.text-right]="col.align === 'right'">
                    <ng-container [ngTemplateOutlet]="cellTemplate"
                                  [ngTemplateOutletContext]="{ $implicit: row[col.key], row: row, col: col }">
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

  @Output() onSort = new EventEmitter<string>();
  @Output() onRowClick = new EventEmitter<any>();
}
