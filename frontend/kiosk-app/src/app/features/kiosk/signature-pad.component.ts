import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit, OnDestroy, signal } from '@angular/core';
import { TranslationService } from '../../i18n/translation.service';

@Component({
  selector: 'app-signature-pad',
  standalone: true,
  template: `
    <div class="space-y-4">
      <div class="relative bg-white rounded-2xl overflow-hidden border-4 border-blue-700"
           [class.border-red-500]="!isEmpty() && showError">
        <canvas #canvas
                (pointerdown)="onPointerDown($event)"
                (pointermove)="onPointerMove($event)"
                (pointerup)="endStroke()"
                (pointerleave)="endStroke()"
                class="w-full h-56 touch-none cursor-crosshair"></canvas>
        @if (isEmpty()) {
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p class="text-gray-400 text-lg">{{ t('sig.here') }}</p>
          </div>
        }
      </div>
      @if (showError && isEmpty()) {
        <p class="text-red-300 text-sm">{{ t('sig.required') }}</p>
      }
      <div class="flex gap-4 justify-center">
        <button
          class="inline-flex items-center justify-center font-medium rounded-lg transition bg-gray-200 text-gray-800 hover:bg-gray-300 px-6 py-3 text-base"
          (click)="clear()">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          {{ t('sig.clear') }}
        </button>
        <button
          class="inline-flex items-center justify-center font-medium rounded-lg transition bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 text-base"
          (click)="confirm()">
          {{ t('sig.use') }}
        </button>
      </div>
    </div>
  `
})
export class SignaturePadComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasEl!: ElementRef<HTMLCanvasElement>;

  /** Emits the signature as a PNG data URL when confirmed. */
  @Output() signature = new EventEmitter<string>();
  @Output() cleared = new EventEmitter<void>();

  /** Show inline validation error when confirmed empty. */
  @Input() showError = false;

  constructor(private translations: TranslationService) {}

  t(key: string, params?: Record<string, string | number>): string {
    return this.translations.translate(key, params);
  }

  private ctx: CanvasRenderingContext2D | null = null;
  private drawing = false;
  private lastX = 0;
  private lastY = 0;
  private hasInk = false;

  ngAfterViewInit() {
    const canvas = this.canvasEl.nativeElement;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    this.ctx = canvas.getContext('2d');
    if (this.ctx) {
      this.ctx.scale(dpr, dpr);
      this.ctx.lineWidth = 3;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.strokeStyle = '#1e3a8a';
    }
  }

  ngOnDestroy() {
    this.ctx = null;
  }

  onPointerDown(event: PointerEvent) {
    const rect = this.canvasEl.nativeElement.getBoundingClientRect();
    this.drawing = true;
    this.lastX = event.clientX - rect.left;
    this.lastY = event.clientY - rect.top;
    this.ctx?.beginPath();
    this.ctx?.moveTo(this.lastX, this.lastY);
  }

  onPointerMove(event: PointerEvent) {
    if (!this.drawing || !this.ctx) return;
    const rect = this.canvasEl.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.lastX = x;
    this.lastY = y;
    this.hasInk = true;
  }

  endStroke() {
    this.drawing = false;
  }

  isEmpty(): boolean {
    return !this.hasInk;
  }

  clear() {
    if (!this.ctx || !this.canvasEl) return;
    const canvas = this.canvasEl.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.hasInk = false;
    this.cleared.emit();
  }

  confirm() {
    if (!this.hasInk || !this.canvasEl) {
      this.showError = true;
      return;
    }
    const dataUrl = this.canvasEl.nativeElement.toDataURL('image/png');
    this.signature.emit(dataUrl);
  }
}
