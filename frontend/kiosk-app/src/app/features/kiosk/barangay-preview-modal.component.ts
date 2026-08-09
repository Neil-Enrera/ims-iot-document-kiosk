import { Component, Input, Output, EventEmitter, AfterViewChecked, ViewChild, ElementRef, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { renderAsync } from 'docx-preview';
import { TranslationService } from '../../i18n/translation.service';

@Component({
  selector: 'app-barangay-preview-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (open) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
           role="dialog" aria-modal="true" aria-label="Barangay ID preview">
        <div class="absolute inset-0" (click)="close()" aria-hidden="true"></div>

        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-[min(92vw,820px)] max-h-[92vh] flex flex-col overflow-hidden"
             (click)="$event.stopPropagation()">
          <div class="px-5 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between gap-4">
            <div class="min-w-0">
              <h3 class="text-lg font-bold text-gray-800 truncate">{{ title }}</h3>
              <p class="text-xs text-gray-500 truncate">{{ t('bar.preview.hint') }}</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button
                type="button"
                (click)="zoomOut()"
                title="Zoom out"
                class="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 text-gray-700 font-semibold bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                [disabled]="zoom() <= MIN_ZOOM">−</button>
              <span class="w-14 text-center text-sm font-semibold text-gray-700 tabular-nums">{{ zoomPercent() }}</span>
              <button
                type="button"
                (click)="zoomIn()"
                title="Zoom in"
                class="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 text-gray-700 font-semibold bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                [disabled]="zoom() >= MAX_ZOOM">+</button>
              <button
                type="button"
                (click)="close()"
                class="ml-2 w-9 h-9 flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                [attr.aria-label]="t('common.close') || 'Close'">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <div #scrollArea class="flex-1 min-h-0 overflow-auto bg-gray-100 p-4">
            <div #previewBox>
              @if (rendering()) {
                <div class="h-48 w-full flex items-center justify-center text-sm text-gray-500">{{ t('bar.preview.rendering') }}</div>
              }
              @if (error()) {
                <div class="h-40 w-full flex items-center justify-center text-sm text-red-600 px-4 text-center">{{ error() }}</div>
              }
              <div #container class="docx-preview-container w-full" [style.zoom]="zoom()"></div>
            </div>
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
export class BarangayPreviewModalComponent implements AfterViewChecked, OnChanges {
  readonly MIN_ZOOM = 0.5;
  readonly MAX_ZOOM = 3;

  @Input() open = false;
  @Input() title = '';
  @Input() blob: Blob | null = null;
  @Output() onClose = new EventEmitter<void>();

  @ViewChild('container', { static: false }) container!: ElementRef<HTMLDivElement>;
  @ViewChild('previewBox', { static: false }) previewBox!: ElementRef<HTMLDivElement>;

  rendering = signal(false);
  error = signal('');
  zoom = signal(1);

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
      this.zoom.set(1);
    }
    if (changes['blob']) {
      this.renderedKey = null;
      this.zoom.set(1);
    }
  }

  ngAfterViewChecked() {
    if (this.open && this.container?.nativeElement && this.blob) {
      this.render();
    }
  }

  close() {
    this.renderedKey = null;
    this.onClose.emit();
  }

  zoomPercent(): string {
    return Math.round(this.zoom() * 100) + '%';
  }

  zoomIn() {
    this.zoom.set(Math.min(this.MAX_ZOOM, this.zoom() * 1.25));
  }

  zoomOut() {
    this.zoom.set(Math.max(this.MIN_ZOOM, this.zoom() / 1.25));
  }

  private async render() {
    const container = this.container.nativeElement;
    const key = this.blob;
    if (!key || this.renderedKey === key) return;
    this.renderedKey = key;
    this.error.set('');
    this.rendering.set(true);
    container.innerHTML = '';

    try {
      await renderAsync(key, container);
      this.rendering.set(false);
      this.fitToWidth();
    } catch (e: any) {
      this.renderedKey = null;
      this.rendering.set(false);
      this.error.set(e?.message || this.t('bar.preview.error'));
    }
  }

  private fitToWidth() {
    const container = this.container?.nativeElement;
    const area = container?.parentElement;
    if (!container || !area) return;
    const page = container.querySelector('.docx') as HTMLElement | null;
    const measured = page?.offsetWidth ?? (container.firstElementChild as HTMLElement | null)?.offsetWidth ?? container.scrollWidth ?? 0;
    const available = area.clientWidth - 32;
    const ratio = measured > 0 && available > 0 ? Math.min(1.5, available / measured) : 1;
    this.zoom.set(Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, ratio)));
  }
}