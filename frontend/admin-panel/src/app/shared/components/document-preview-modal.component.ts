import { Component, Input, Output, EventEmitter, AfterViewChecked, ViewChild, ElementRef, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { renderAsync } from 'docx-preview';

@Component({
  selector: 'app-document-preview-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (open) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
           role="dialog" aria-modal="true" aria-label="Document preview">
        <div class="absolute inset-0" (click)="close()" aria-hidden="true"></div>

        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-[min(94vw,1240px)] max-h-[94vh] flex flex-col overflow-hidden"
             (click)="$event.stopPropagation()">

          <!-- Header: title + hint + zoom toolbar + close -->
          <div class="px-5 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between gap-4">
            <div class="min-w-0">
              <h3 class="text-lg font-bold text-gray-800 truncate">{{ title }}</h3>
              <p class="text-xs text-gray-500 truncate">Scroll to review all pages. Use the controls to adjust the size.</p>
            </div>
            <div class="flex items-center gap-2 shrink-0" role="toolbar" aria-label="Document zoom controls">
              <button
                type="button"
                (click)="zoomOut()"
                title="Zoom out"
                aria-label="Zoom out"
                class="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 text-gray-700 text-lg font-semibold bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                [disabled]="zoom() <= MIN_ZOOM">
                −
              </button>
              <span class="w-14 text-center text-sm font-semibold text-gray-700 tabular-nums">{{ zoomPercent() }}</span>
              <button
                type="button"
                (click)="zoomIn()"
                title="Zoom in"
                aria-label="Zoom in"
                class="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 text-gray-700 text-lg font-semibold bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                [disabled]="zoom() >= MAX_ZOOM">
                +
              </button>
              <button
                type="button"
                (click)="resetZoom()"
                title="Fit document to width"
                aria-label="Fit document to width"
                class="h-9 px-3 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                Fit Width
              </button>
              <button
                type="button"
                (click)="close()"
                class="ml-2 w-9 h-9 flex items-center justify-center rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                aria-label="Close">
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
                <div class="h-48 w-full flex items-center justify-center text-sm text-gray-500">Rendering document...</div>
              }
              @if (error()) {
                <div class="h-40 w-full flex items-center justify-center text-sm text-red-600 px-4 text-center">{{ error() }}</div>
              }
              <div #container class="docx-preview-container w-full"></div>
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
export class DocumentPreviewModalComponent implements AfterViewChecked, OnChanges {
  @Input() open = false;
  @Input() title = '';
  @Input() blob: Blob | null = null;
  @Input() blobUrl: string | null = null;
  @Output() onClose = new EventEmitter<void>();

  readonly MIN_ZOOM = 0.5;
  readonly MAX_ZOOM = 3;

  // The container only exists while `open` is true, so the query must be dynamic
  // (static: false). A static query is resolved once at init — when the div is not
  // yet rendered — and never updated, which would leave the preview blank.
  @ViewChild('container', { static: false }) container!: ElementRef<HTMLDivElement>;
  @ViewChild('previewBox', { static: false }) previewBox!: ElementRef<HTMLDivElement>;
  @ViewChild('scrollArea', { static: false }) scrollArea!: ElementRef<HTMLDivElement>;

  rendering = signal(false);
  error = signal('');
  zoom = signal(1);

  private fitRatio = 1;
  private userAdjusted = false;

  private renderedKey: string | Blob | null = null;

  // Reset the render state whenever the modal closes or a new document arrives.
  // Closing destroys the container (the @if block) and clears renderedKey, so the
  // next open re-renders from scratch.
  ngOnChanges(changes: SimpleChanges) {
    if (changes['open'] && !this.open) {
      this.renderedKey = null;
      this.error.set('');
      this.rendering.set(false);
      this.resetZoomState();
    }
    if (changes['blob'] || changes['blobUrl']) {
      this.renderedKey = null;
      this.resetZoomState();
    }
  }

  // Runs after every change-detection cycle, i.e. after the conditional block has
  // rendered the container div. ngOnChanges cannot be used for the actual render
  // because it fires BEFORE the conditional view is created on the same cycle, so
  // the container is still unavailable on that cycle. render() is idempotent.
  ngAfterViewChecked() {
    if (this.open && this.container?.nativeElement && (this.blob || this.blobUrl)) {
      this.render();
    }
  }

  close() {
    this.renderedKey = null;
    this.resetZoomState();
    this.onClose.emit();
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
    const key = this.blobUrl ?? this.blob;
    if (this.renderedKey === key) return;
    if (!this.blob && !this.blobUrl) {
      this.rendering.set(false);
      this.error.set('No document to preview.');
      return;
    }
    // Claim the key synchronously so a re-entrant ngAfterViewChecked during the
    // async render does not start a second render of the same document.
    this.renderedKey = key;
    this.error.set('');
    this.rendering.set(true);
    container.innerHTML = '';
    this.previewBox.nativeElement.style.zoom = '1';

    try {
      const blob = await this.loadBlob();
      if (blob.type === 'application/pdf') {
        const url = URL.createObjectURL(blob);
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '80vh';
        iframe.style.minHeight = '480px';
        iframe.style.border = '0';
        iframe.style.background = 'white';
        iframe.src = url;
        container.appendChild(iframe);
      } else if (blob.type === 'image/png' || blob.type === 'image/jpeg') {
        const url = URL.createObjectURL(blob);
        const img = document.createElement('img');
        img.src = url;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.display = 'block';
        container.appendChild(img);
      } else {
        await renderAsync(blob, container);
      }
      this.rendering.set(false);
      this.applyInitialZoom();
      this.scheduleSettleFit();
    } catch (e: any) {
      this.renderedKey = null;
      this.rendering.set(false);
      this.error.set(e?.message || 'Could not render the document preview.');
    }
  }

  // Size the rendered document so its width fits the available preview area while
  // keeping readability. Repeated previews reset to the same fit.
  private applyInitialZoom() {
    const container = this.container?.nativeElement;
    const area = this.scrollArea?.nativeElement;
    if (!container || !area) return;

    const iframe = container.querySelector('iframe');
    if (iframe) {
      // PDF/images fill the preview width natively.
      this.fitRatio = 1;
      this.zoom.set(1);
      return;
    }

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

  // docx-preview injects the pages asynchronously, so the width measured in the
  // tick right after renderAsync can be stale (0 / not yet laid out). Re-measure
  // once the browser has settled layout and, unless the user zoomed manually,
  // apply the fit-width scale. Frames not yet rendered keep natural width.
  private scheduleSettleFit() {
    const settle = () => {
      if (!this.open) return;
      if (!this.userAdjusted) {
        this.applyInitialZoom();
      }
    };
    requestAnimationFrame(settle);
    setTimeout(settle, 100);
    setTimeout(settle, 300);
  }

  private fitToWidth() {
    const container = this.container?.nativeElement;
    const area = this.scrollArea?.nativeElement;
    if (!container || !area) return;
    const iframe = container.querySelector('iframe');
    if (iframe) {
      this.zoom.set(1);
      return;
    }
    const page = container.querySelector('.docx') as HTMLElement | null;
    const measured = page?.offsetWidth ?? (container.firstElementChild as HTMLElement | null)?.offsetWidth ?? container.scrollWidth ?? 0;
    const available = area.clientWidth - 24;
    const ratio = measured > 0 && available > 0 ? available / measured : 1;
    this.zoom.set(Math.min(this.MAX_ZOOM, Math.max(this.MIN_ZOOM, ratio)));
  }

  private loadBlob(): Promise<Blob> {
    if (this.blob) return Promise.resolve(this.blob);
    if (this.blobUrl) return fetch(this.blobUrl).then(r => {
      if (!r.ok) throw new Error('Failed to fetch document for preview.');
      return r.blob();
    });
    return Promise.reject(new Error('No document provided for preview.'));
  }
}