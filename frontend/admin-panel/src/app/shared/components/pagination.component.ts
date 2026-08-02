import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
      <div class="text-sm text-gray-700">
        Showing <span class="font-medium">{{ startItem }}</span> to <span class="font-medium">{{ endItem }}</span> of <span class="font-medium">{{ total }}</span> results
      </div>
      <div class="flex gap-1">
        <button (click)="onPageChange.emit(currentPage - 1)" [disabled]="currentPage === 1"
          class="px-3 py-1 text-sm border rounded disabled:opacity-50 hover:bg-gray-50">
          Prev
        </button>
        @for (p of visiblePages; track p) {
          <button (click)="onPageChange.emit(p)"
            [class]="p === currentPage ? 'px-3 py-1 text-sm bg-blue-600 text-white rounded' : 'px-3 py-1 text-sm border rounded hover:bg-gray-50'">
            {{ p }}
          </button>
        }
        <button (click)="onPageChange.emit(currentPage + 1)" [disabled]="currentPage === totalPages"
          class="px-3 py-1 text-sm border rounded disabled:opacity-50 hover:bg-gray-50">
          Next
        </button>
      </div>
    </div>
  `
})
export class PaginationComponent {
  @Input() total = 0;
  @Input() currentPage = 1;
  @Input() limit = 20;

  @Output() onPageChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.ceil(this.total / this.limit) || 1;
  }

  get startItem(): number {
    return (this.currentPage - 1) * this.limit + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.limit, this.total);
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }
}
