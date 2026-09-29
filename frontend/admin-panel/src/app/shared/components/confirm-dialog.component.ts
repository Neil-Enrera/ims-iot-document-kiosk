import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (open) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
        <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden" (click)="$event.stopPropagation()">
          <div class="p-6">
            <div class="flex items-start gap-4">
              <div [class]="iconWrapperClass">
                @switch (variant) {
                  @case ('danger') {
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  }
                  @case ('success') {
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  }
                  @case ('warning') {
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                  }
                  @default {
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  }
                }
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-lg font-bold text-slate-900 leading-snug">{{ title }}</h3>
                @if (subtitle) {
                  <p class="text-xs font-medium text-slate-500 mt-0.5">{{ subtitle }}</p>
                }
                @if (message) {
                  <p class="mt-2 text-sm text-slate-600 leading-relaxed whitespace-pre-line">{{ message }}</p>
                }
                <ng-content />
              </div>
            </div>
          </div>
          <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              (click)="onCancel.emit()"
              [disabled]="loading"
              class="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition disabled:opacity-50 cursor-pointer">
              {{ cancelText }}
            </button>
            <button
              type="button"
              (click)="onConfirm.emit()"
              [disabled]="loading"
              [class]="confirmClass">
              @if (loading) {
                <span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              }
              <span>{{ confirmText }}</span>
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class ConfirmDialogComponent {
  @Input() open = false;
  @Input() title = 'Confirm';
  @Input() subtitle = '';
  @Input() message = '';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() variant: 'danger' | 'primary' | 'success' | 'warning' = 'primary';
  @Input() loading = false;

  @Output() onCancel = new EventEmitter<void>();
  @Output() onConfirm = new EventEmitter<void>();

  get iconWrapperClass(): string {
    const base = 'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0';
    switch (this.variant) {
      case 'danger':
        return `${base} bg-red-50 text-red-600 border border-red-200`;
      case 'success':
        return `${base} bg-emerald-50 text-emerald-600 border border-emerald-200`;
      case 'warning':
        return `${base} bg-amber-50 text-amber-600 border border-amber-200`;
      default:
        return `${base} bg-orange-50 text-orange-600 border border-orange-200`;
    }
  }

  get confirmClass(): string {
    const base = 'inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-white shadow-sm transition disabled:opacity-50 cursor-pointer';
    switch (this.variant) {
      case 'danger':
        return `${base} bg-red-600 hover:bg-red-700`;
      case 'success':
        return `${base} bg-emerald-600 hover:bg-emerald-700`;
      case 'warning':
        return `${base} bg-amber-600 hover:bg-amber-700`;
      default:
        return `${base} bg-orange-600 hover:bg-orange-700`;
    }
  }
}
