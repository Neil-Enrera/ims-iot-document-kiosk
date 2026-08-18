import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalOverlayComponent } from './modal-overlay.component';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, ModalOverlayComponent],
  template: `
    <app-modal-overlay 
      [open]="open" 
      [title]="title" 
      [closeOnBackdropClick]="true"
      [containerClass]="containerClass"
      [bodyClass]="bodyClass"
      (onClose)="onClose.emit()">
      <ng-content />
    </app-modal-overlay>
  `
})
export class ModalComponent {
  @Input() open = false;
  @Input() title = '';
  @Input() containerClass = 'max-w-lg';
  @Input() bodyClass = '';
  @Output() onClose = new EventEmitter<void>();
}
