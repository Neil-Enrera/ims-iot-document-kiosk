import { Component, Input, Output, EventEmitter, signal, effect, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isVisible()) {
      <div 
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        [class.animate-fade-in]="!isClosing()"
        [class.animate-fade-out]="isClosing()"
        (click)="onClose.emit()"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title">
        
        <!-- Modern overlay with subtle blur effect -->
        <div 
          class="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-200"
          [class.opacity-100]="!isClosing()"
          [class.opacity-0]="isClosing()">
        </div>
        
        <!-- Modal container -->
        <div 
          [class]="'relative bg-white rounded-xl shadow-2xl w-full max-h-[90vh] flex flex-col overflow-hidden ' + containerClass"
          [class.animate-scale-in]="!isClosing()"
          [class.animate-scale-out]="isClosing()"
          (click)="$event.stopPropagation()">
          
          <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
            <h3 id="modal-title" class="text-lg font-semibold text-gray-800">{{ title }}</h3>
            <button 
              (click)="onClose.emit()" 
              class="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-200"
              aria-label="Close modal">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          <div [class]="'p-6 overflow-y-auto flex-1 ' + bodyClass">
            <ng-content />
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes fade-out {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    @keyframes scale-in {
      from { opacity: 0; transform: scale(0.95) translateY(4px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes scale-out {
      from { opacity: 1; transform: scale(1) translateY(0); }
      to { opacity: 0; transform: scale(0.95) translateY(4px); }
    }
    
    .animate-fade-in { animation: fade-in 200ms ease-out; }
    .animate-fade-out { animation: fade-out 150ms ease-in; }
    .animate-scale-in { animation: scale-in 200ms ease-out; }
    .animate-scale-out { animation: scale-out 150ms ease-in; }
  `]
})
export class ModalOverlayComponent {
  open = input(false);
  @Input() title = '';
  @Input() closeOnBackdropClick = true;
  @Input() containerClass = 'max-w-lg';
  @Input() bodyClass = '';
  @Output() onClose = new EventEmitter<void>();
  
  isVisible = signal(false);
  isClosing = signal(false);
  
  private closeTimer: any = null;
  
  constructor() {
    effect(() => {
      if (this.open()) {
        this.isClosing.set(false);
        this.isVisible.set(true);
      } else if (this.isVisible() && !this.isClosing()) {
        this.startCloseAnimation();
      }
    });
  }
  
  private startCloseAnimation(): void {
    this.isClosing.set(true);
    if (this.closeTimer) clearTimeout(this.closeTimer);
    this.closeTimer = setTimeout(() => {
      this.isVisible.set(false);
      this.isClosing.set(false);
    }, 150);
  }
  
  onBackdropClick(event: MouseEvent): void {
    if (this.closeOnBackdropClick && (event.target as HTMLElement).classList.contains('fixed')) {
      this.onClose.emit();
    }
  }
}