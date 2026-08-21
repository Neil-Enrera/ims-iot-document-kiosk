import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      @if (label) {
        <label class="block text-sm font-semibold text-slate-700 mb-1">{{ label }}</label>
      }
      <input
        [type]="type"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [class]="inputClass"
        [value]="value"
        [attr.maxlength]="maxlength || null"
        [attr.max]="max || null"
        [attr.min]="min || null"
        [attr.inputmode]="inputmode || (filterType === 'numeric' || filterType === 'phone' ? 'numeric' : (type === 'email' ? 'email' : null))"
        (keydown)="onKeyDown($event)"
        (input)="onInput($event)"
        (paste)="onPaste($event)"
      />
      @if (error) {
        <p class="mt-1 text-xs font-semibold text-red-600 flex items-center gap-1">
          <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/>
          </svg>
          {{ error }}
        </p>
      }
    </div>
  `
})
export class InputComponent {
  @Input() label = '';
  @Input() type = 'text';
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() error = '';
  @Input() value = '';
  @Input() maxlength?: number | string;
  @Input() max?: string;
  @Input() min?: string;
  @Input() inputmode?: string;
  @Input() filterType: 'none' | 'numeric' | 'name' | 'phone' = 'none';

  @Output() valueChange = new EventEmitter<string>();

  get inputClass(): string {
    const base = 'w-full px-3 py-2 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:bg-slate-100 disabled:cursor-not-allowed shadow-2xs';
    return this.error
      ? `${base} border-red-500 bg-red-50/20 text-red-900`
      : `${base} border-slate-300 text-slate-900 bg-white`;
  }

  onKeyDown(event: KeyboardEvent) {
    if (
      ['Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter'].includes(event.key) ||
      event.ctrlKey || event.metaKey
    ) {
      return;
    }

    if (this.filterType === 'numeric' || this.filterType === 'phone') {
      if (!/^\d$/.test(event.key)) {
        event.preventDefault();
      }
    } else if (this.filterType === 'name') {
      if (!/^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\-\.\']$/.test(event.key)) {
        event.preventDefault();
      }
    }
  }

  onInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let clean = input.value;

    if (this.filterType === 'phone') {
      clean = clean.replace(/\D/g, '').slice(0, 11);
      input.value = clean;
    } else if (this.filterType === 'numeric') {
      clean = clean.replace(/\D/g, '');
      if (this.maxlength) {
        clean = clean.slice(0, Number(this.maxlength));
      }
      input.value = clean;
    } else if (this.filterType === 'name') {
      clean = clean.replace(/[^a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\-\.\']/g, '');
      if (this.maxlength) {
        clean = clean.slice(0, Number(this.maxlength));
      }
      input.value = clean;
    }

    this.valueChange.emit(clean);
  }

  onPaste(event: ClipboardEvent) {
    if (this.filterType === 'none') return;
    event.preventDefault();
    const text = event.clipboardData?.getData('text') || '';
    let clean = text;

    if (this.filterType === 'phone') {
      clean = clean.replace(/\D/g, '').slice(0, 11);
    } else if (this.filterType === 'numeric') {
      clean = clean.replace(/\D/g, '');
      if (this.maxlength) clean = clean.slice(0, Number(this.maxlength));
    } else if (this.filterType === 'name') {
      clean = clean.replace(/[^a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\-\.\']/g, '');
      if (this.maxlength) clean = clean.slice(0, Number(this.maxlength));
    }

    const input = event.target as HTMLInputElement;
    input.value = clean;
    this.valueChange.emit(clean);
  }
}

