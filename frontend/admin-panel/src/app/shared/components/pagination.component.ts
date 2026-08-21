import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-slate-100 mt-2">
      <!-- Left side: Range text -->
      <div class="text-sm text-slate-500 font-normal">
        Showing {{ startItem }} to {{ endItem }} of {{ total }} {{ itemLabel }}
      </div>

      <!-- Right side: Controls (Hidden when total <= limit) -->
      @if (total > limit) {
        <div class="flex items-center gap-1.5 flex-wrap justify-center">
          <!-- Prev Button -->
          <button
            (click)="changePage(currentPage - 1)"
            [disabled]="currentPage <= 1"
            class="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-xs"
            aria-label="Previous page">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>

          <!-- Page Numbers -->
          @for (p of visiblePages; track p) {
            <button
              (click)="changePage(p)"
              [class]="p === currentPage
                ? 'w-8 h-8 rounded-lg border border-orange-400 bg-orange-50/80 text-orange-600 font-bold flex items-center justify-center text-sm shadow-xs'
                : 'w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium flex items-center justify-center text-sm hover:bg-slate-50 hover:text-slate-900 transition shadow-xs'"
              [attr.aria-current]="p === currentPage ? 'page' : null">
              {{ p }}
            </button>
          }

          <!-- Next Button -->
          <button
            (click)="changePage(currentPage + 1)"
            [disabled]="currentPage >= totalPages"
            class="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-xs"
            aria-label="Next page">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </button>

          <!-- Page Size Select -->
          @if (showPageSize) {
            <div class="relative ml-2">
              <select
                [value]="limit"
                (change)="onPageSizeSelect($any($event.target).value)"
                class="h-8 pl-3 pr-7 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 appearance-none cursor-pointer hover:bg-slate-50 transition shadow-xs"
                aria-label="Items per page">
                @for (opt of pageSizeOptions; track opt) {
                  <option [value]="opt">{{ opt }} / page</option>
                }
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class PaginationComponent {
  @Input() total = 0;
  @Input() currentPage = 1;
  @Input() limit = 10;
  @Input() itemLabel = 'results';
  @Input() showPageSize = true;
  @Input() pageSizeOptions = [10, 20, 50, 100];

  @Output() onPageChange = new EventEmitter<number>();
  @Output() onLimitChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.ceil(this.total / this.limit) || 1;
  }

  get startItem(): number {
    if (this.total === 0) return 0;
    return (this.currentPage - 1) * this.limit + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.limit, this.total);
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.onPageChange.emit(page);
    }
  }

  onPageSizeSelect(size: string): void {
    const num = Number(size);
    if (!isNaN(num) && num > 0) {
      this.limit = num;
      this.onLimitChange.emit(num);
    }
  }
}
