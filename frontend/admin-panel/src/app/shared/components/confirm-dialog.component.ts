import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (open) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
          <div class="p-6">
            <h3 class="text-lg font-semibold text-gray-800">{{ title }}</h3>
            <p class="mt-2 text-sm text-gray-600">{{ message }}</p>
          </div>
          <div class="px-6 py-4 border-t flex justify-end gap-3">
            <button (click)="onCancel.emit()"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">
              Cancel
            </button>
            <button (click)="onConfirm.emit()"
              [class]="confirmClass">
              {{ confirmText }}
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
  @Input() message = 'Are you sure?';
  @Input() confirmText = 'Confirm';
  @Input() variant: 'danger' | 'primary' = 'primary';

  @Output() onCancel = new EventEmitter<void>();
  @Output() onConfirm = new EventEmitter<void>();

  get confirmClass(): string {
    const base = 'px-4 py-2 text-sm font-medium rounded-lg text-white';
    return this.variant === 'danger'
      ? `${base} bg-red-600 hover:bg-red-700`
      : `${base} bg-orange-600 hover:bg-orange-700`;
  }
}
