import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  template: `
    <div class="fixed top-4 right-4 z-[100] flex flex-col gap-3 w-[360px] max-w-[calc(100vw-2rem)]">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="relative flex items-start gap-3 rounded-xl border bg-white shadow-lg p-4 pr-10 animate-[toast-in_0.25s_ease-out]"
          [class.border-green-200]="toast.type === 'success'"
          [class.border-blue-200]="toast.type === 'info'"
          [class.border-amber-200]="toast.type === 'warning'"
          [class.border-red-200]="toast.type === 'error'"
        >
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            [class.bg-green-100]="toast.type === 'success'"
            [class.bg-blue-100]="toast.type === 'info'"
            [class.bg-amber-100]="toast.type === 'warning'"
            [class.bg-red-100]="toast.type === 'error'"
          >
            @if (toast.type === 'success') {
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            } @else if (toast.type === 'warning') {
              <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
            } @else if (toast.type === 'error') {
              <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/></svg>
            } @else {
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/></svg>
            }
          </div>
          <div class="flex-1 min-w-0 pt-0.5">
            <p class="text-sm font-bold text-slate-900 leading-snug">{{ toast.title }}</p>
            @if (toast.message) {
              <p class="text-[13px] text-slate-500 mt-0.5 leading-snug">{{ toast.message }}</p>
            }
          </div>
          <button
            (click)="toastService.dismiss(toast.id)"
            class="absolute top-3 right-3 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            aria-label="Dismiss"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      }
    </div>
  `
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
}