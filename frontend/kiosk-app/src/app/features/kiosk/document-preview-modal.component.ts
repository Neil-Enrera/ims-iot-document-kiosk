import { Component, Input, Output, EventEmitter, AfterViewChecked, ViewChild, ElementRef, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { renderAsync } from 'docx-preview';
import { TranslationService } from '../../i18n/translation.service';

// Kiosk-side document preview modal, mirroring the admin panel's preview UX:
// zoom in/out + fit-width controls over a scrollable white document area. The
// resident can review the actual generated DOCX before submitting, then either
// go back to the form (Edit Information) or Submit Request.
@Component({
  selector: 'app-document-preview-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (open) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
           role="dialog" aria-modal="true" aria-label="Document preview">
        <div class="absolute inset-0" (click)="close()" aria-hidden="true"></div>

        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-[min(94vw,1100px)] max-h-[94vh] flex flex-col overflow-hidden"
             (click)="$event.stopPropagation()">

          <!-- Header: title + hint + zoom toolbar + close -->
          <div class="px-5 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between gap-4">
            <div class="min-w-0">
              <h3 class="text-lg font-bold text-gray-800 truncate">{{ title }}</h3>
              <p class="text-xs text-gray-500 truncate">{{ t('doc.review.previewScroll') }}</p>
            </div>
            <div class="flex items-center gap-2 shrink-0" role="toolbar" [attr.aria-label]="t('doc.review.previewZoom')">
              <button
                type="button"
                (click)="zoomOut()"
                title="Zoom out"
                [attr.aria-label]="t('doc.review.previewZoomOut')"
                class="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 text-gray-700 text-lg font-semibold bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-40 disabled:cursor-not-allowed"
                [disabled]="zoom() <= MIN_ZOOM">−</button>
              <span class="w-14 text-center text-sm font-semibold text-gray-700 tabular-nums">{{ zoomPercent() }}</span>
              <button
                type="button"
                (click)="zoomIn()"
                title="Zoom in"
                [attr.aria-label]="t('doc.review.previewZoomIn')"
                class="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 text-gray-700 text-lg font-semibold bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-40 disabled:cursor-not-allowed"
                [disabled]="zoom() >= MAX_ZOOM">+</button>
              <button
                type="button"
                (click)="resetZoom()"
                title="Fit document to width"
                [attr.aria-label]="t('doc.review.previewFitWidth')"
                class="h-9 px-3 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500">
                {{ t('doc.review.previewFitWidth') }}
              </button>
              <button
                type="button"
                (click)="close()"
                class="ml-2 w-9 h-9 flex items-center justify-center rounded-lg bg-[#F97316] text-white hover:bg-[#EA580C]"
                [attr.aria-label]="t('common.close') || 'Close'">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Scrollable white document area -->
          <div #scrollArea class="flex-1 min-h-0 overflow-auto bg-gray-100 p-3 sm:p-4">
            <div #previewBox class="w-fit min-w-full mx-auto flex flex-col items-center" [style.zoom]="zoom()">
              @if (rendering()) {
                <div class="h-48 w-full flex items-center justify-center text-sm text-gray-500">{{ t('doc.review.previewLoading') }}</div>
              }
              @if (error()) {
                <div class="h-40 w-full flex items-center justify-center text-sm text-red-600 px-4 text-center">{{ error() }}</div>
              }
              <div #container class="docx-preview-container w-full"></div>
            </div>
          </div>

          <!-- Footer: Edit Information + Submit Request -->
          <div class="px-5 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
            <button
              type="button"
              (click)="edit()"
              class="flex items-center justify-center gap-2 h-11 px-6 rounded-xl border-2 border-[#F97316] bg-white text-[#F97316] text-sm font-bold hover:bg-[#FFF7ED] focus:outline-none focus:ring-2 focus:ring-[#F97316]/30 disabled:opacity-50 disabled:cursor-not-allowed">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.4-9.4a2 2 0 112.8 2.8L11 17l-4 1 1-4z"/>
              </svg>
              {{ t('doc.review.edit') }}
            </button>
            <button
              type="button"
              (click)="submit()"
              [disabled]="submitting"
              class="flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-[#F97316] text-white text-sm font-bold shadow-[0_2px_10px_rgba(249,115,22,0.35)] hover:bg-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 disabled:opacity-60 disabled:cursor-not-allowed">
              @if (submitting) {
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              }
              {{ t('doc.review.submit') }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .docx-preview-container {
      background: white;
      box-shadow: 0 1px 8px rgba(15, 23, 42, 0.18);
      min-height: 200px;
    }
  `]
})
export class DocumentPreviewModalComponent implements AfterViewChecked, OnChanges {
  readonly MIN_ZOOM = 0.5;
  readonly MAX_ZOOM = 3;

  @Input() open = false;
  @Input() title = '';
  @Input() blob: Blob | null = null;
  @Input() submitting = false;
  @Output() onClose = new EventEmitter<void>();
  @Output() onEdit = new EventEmitter<void>();
  @Output() onSubmit = new EventEmitter<void>();

  // The container only exists while `open` is true, so the query must be dynamic.
  @ViewChild('container', { static: false }) container!: ElementRef<HTMLDivElement>;
  @ViewChild('previewBox', { static: false }) previewBox!: ElementRef<HTMLDivElement>;
  @ViewChild('scrollArea', { static: false }) scrollArea!: ElementRef<HTMLDivElement>;

  rendering = signal(false);
  error = signal('');
  zoom = signal(1);

  private fitRatio = 1;
  private userAdjusted = false;
  private renderedKey: Blob | null = null;

  constructor(private translations: TranslationService) {}

  t(key: string, params?: Record<string, string | number>): string {
    return this.translations.translate(key, params);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['open'] && !this.open) {
      this.renderedKey = null;
      this.error.set('');
      this.rendering.set(false);
      this.resetZoomState();
    }
    if (changes['blob']) {
      this.renderedKey = null;
      this.resetZoomState();
    }
  }

  ngAfterViewChecked() {
    if (this.open && this.container?.nativeElement && this.blob) {
      this.render();
    }
  }

  close() {
    this.renderedKey = null;
    this.resetZoomState();
    this.onClose.emit();
  }

  edit() {
    this.onEdit.emit();
  }

  submit() {
    this.onSubmit.emit();
  }

  zoomPercent(): string {
    return Math.round(this.zoom() * 100) + '%';
  }

  zoomIn() {
    this.userAdjusted = true;
    this.zoom.set(Math.min(this.MAX_ZOOM, this.zoom() * 1.25));
  }

  zoomOut() {
    this.userAdjusted = true;
    this.zoom.set(Math.max(this.MIN_ZOOM, this.zoom() / 1.25));
  }

  resetZoom() {
    this.userAdjusted = false;
    this.fitToWidth();
  }

  private resetZoomState() {
    this.zoom.set(1);
    this.fitRatio = 1;
    this.userAdjusted = false;
  }

  private async render() {
    const container = this.container.nativeElement;
    const key = this.blob;
    if (this.renderedKey === key) return;
    if (!this.blob) {
      this.rendering.set(false);
      this.error.set(this.t('doc.review.previewFailed'));
      return;
    }
    this.renderedKey = key;
    this.error.set('');
    this.rendering.set(true);
    container.innerHTML = '';
    this.previewBox.nativeElement.style.zoom = '1';

    try {
      await renderAsync(this.blob, container);
      this.rendering.set(false);
      this.applyInitialZoom();
    } catch (e: any) {
      this.renderedKey = null;
      this.rendering.set(false);
      this.error.set(e?.message || this.t('doc.review.previewFailed'));
    }
  }

  private applyInitialZoom() {
    const container = this.container?.nativeElement;
    const area = this.scrollArea?.nativeElement;
    if (!container || !area) return;
    const page = container.querySelector('.docx') as HTMLElement | null;
    const measured = page?.offsetWidth ?? container.scrollWidth ?? 0;
    const available = area.clientWidth - 32;
    if (measured <= 0 || available <= 0) {
      this.fitRatio = 1;
      this.zoom.set(1);
      return;
    }
    this.fitRatio = Math.min(this.MAX_ZOOM, Math.max(this.MIN_ZOOM, available / measured));
    if (!this.userAdjusted) {
      this.zoom.set(this.fitRatio);
    }
  }

  private fitToWidth() {
    const container = this.container?.nativeElement;
    const area = this.scrollArea?.nativeElement;
    if (!container || !area) return;
    const page = container.querySelector('.docx') as HTMLElement | null;
    const measured = page?.offsetWidth ?? (container.firstElementChild as HTMLElement | null)?.offsetWidth ?? container.scrollWidth ?? 0;
    const available = area.clientWidth - 24;
    const ratio = measured > 0 && available > 0 ? available / measured : 1;
    this.zoom.set(Math.min(this.MAX_ZOOM, Math.max(this.MIN_ZOOM, ratio)));
  }
}