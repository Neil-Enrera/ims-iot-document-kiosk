import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      @if (label) {
        <label class="block text-sm font-medium text-gray-700 mb-1">{{ label }}</label>
      }
      <input
        [type]="type"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [class]="inputClass"
        [value]="value"
        (input)="valueChange.emit($any($event.target).value)"
      />
      @if (error) {
        <p class="mt-1 text-sm text-red-500">{{ error }}</p>
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

  @Output() valueChange = new EventEmitter<string>();

  get inputClass(): string {
    const base = 'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100';
    return this.error
      ? `${base} border-red-500`
      : `${base} border-gray-300`;
  }
}
