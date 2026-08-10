import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit, OnDestroy, signal } from '@angular/core';
import { TranslationService } from '../../i18n/translation.service';

@Component({
  selector: 'app-signature-pad',
  standalone: true,
  template: `
    <div class="space-y-4">
      <!-- Signature canvas -->
      <div class="relative bg-white rounded-[18px] overflow-hidden border-2 border-[#F97316]/70 shadow-[0_2px_14px_rgba(15,23,42,0.08)]"
           [class.border-red-500]="showError && isEmpty()">
        <canvas #canvas
                (pointerdown)="onPointerDown($event)"
                (pointermove)="onPointerMove($event)"
                (pointerup)="endStroke()"
                (pointerleave)="endStroke()"
                (pointercancel)="endStroke()"
                [class]="'w-full touch-none cursor-crosshair h-56 ' + heightClass"></canvas>

        @if (isEmpty()) {
          <!-- Placeholder: large subtle 'Sign here' -->
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p class="text-[#94A3B8] text-2xl sm:text-3xl font-medium tracking-wide select-none">{{ t('sig.here') }}</p>
          </div>
          <!-- Baseline guide through the lower-middle of the canvas -->
          <div class="absolute inset-x-[7%] bottom-[24%] h-[2px] rounded-full bg-[#E2E8F0] pointer-events-none" aria-hidden="true"></div>
        }
      </div>

      <!-- Inline validation message -->
      @if (showError && isEmpty()) {
        <p class="flex items-center justify-center gap-2 text-[15px] font-semibold text-[#DC2626]" role="alert">
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9"/><path stroke-linecap="round" d="M12 8v4M12 16h.01"/>
          </svg>
          {{ t('sig.required') }}
        </p>
      }

      <!-- Actions -->
      <div class="flex flex-wrap items-center justify-center gap-3">
        <button type="button" (click)="clear()"
                class="inline-flex items-center justify-center gap-2.5 min-h-[56px] sm:min-h-[64px] min-w-[180px] px-7 rounded-xl bg-white border-2 border-[#E5E7EB] text-[#0F172A] hover:bg-[#F1F5F9] active:scale-[0.98] text-base sm:text-lg font-semibold shadow-sm transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/25">
          <svg class="w-5 h-5 sm:w-6 sm:h-6 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v6h6M20 20v-6h-6M4 10a8 8 0 0 1 14-4M20 14a8 8 0 0 1-14 4"/>
          </svg>
          {{ t('sig.clear') }}
        </button>
        <button type="button" (click)="confirm()"
                class="inline-flex items-center justify-center gap-2.5 min-h-[56px] sm:min-h-[64px] min-w-[200px] px-7 rounded-xl bg-[#F97316] hover:bg-[#EA580C] active:scale-[0.98] text-white text-base sm:text-lg font-semibold shadow-[0_4px_14px_rgba(249,115,22,0.35)] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/40">
          {{ t('sig.use') }}
          <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
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

  /** Tailwind height classes for the canvas (e.g. "sm:h-[360px] xl:h-[400px]"). */
  @Input() heightClass = '';

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
    this.showError = false;
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