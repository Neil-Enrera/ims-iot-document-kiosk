import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="classes">
      @if (title) {
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-800">{{ title }}</h3>
          @if (subtitle) {
            <p class="text-sm text-gray-500 mt-1">{{ subtitle }}</p>
          }
        </div>
      }
      <div class="p-6">
        <ng-content />
      </div>
    </div>
  `
})
export class CardComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() padded = true;

  get classes(): string {
    return 'bg-white rounded-xl shadow-sm border border-slate-200';
  }
}
