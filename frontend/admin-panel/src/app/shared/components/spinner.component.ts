import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="containerClass">
      <svg [class]="sizeClass" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
      </svg>
      @if (message) {
        <span class="ml-3 text-gray-600">{{ message }}</span>
      }
    </div>
  `
})
export class SpinnerComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() message = '';
  @Input() centered = true;

  get sizeClass(): string {
    const sizes: Record<string, string> = {
      sm: 'h-4 w-4',
      md: 'h-8 w-8',
      lg: 'h-12 w-12'
    };
    return `animate-spin text-blue-600 ${sizes[this.size]}`;
  }

  get containerClass(): string {
    return this.centered ? 'flex justify-center items-center py-8' : 'flex items-center';
  }
}
