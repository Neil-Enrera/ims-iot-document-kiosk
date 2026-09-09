import { Component, Input, Output, EventEmitter, AfterViewChecked, ViewChild, ElementRef, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { renderAsync } from 'docx-preview';
import { DocumentPdfExportService } from '../services';

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
            <div class="flex items-center gap-2 shrink-0 flex-wrap" role="toolbar" aria-label="Document controls">
              <!-- Download Formats & Print -->
              <button
                type="button"
                (click)="downloadDocx()"
                [disabled]="rendering() || (!blob && !blobUrl)"
                title="Download as Word DOCX document"
                class="h-9 px-3 flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 disabled:opacity-40 transition cursor-pointer">
                <svg class="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                </svg>
                <span>DOCX</span>
              </button>

              <button
                type="button"
                (click)="downloadPdf()"
                [disabled]="rendering() || (!blob && !blobUrl) || downloadingPdf()"
                title="Download as PDF file"
                class="h-9 px-3 flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 disabled:opacity-40 transition cursor-pointer">
                @if (downloadingPdf()) {
                  <svg class="animate-spin h-3.5 w-3.5 text-rose-600" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  <span>Downloading...</span>
                } @else {
                  <svg class="w-4 h-4 text-rose-600 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  <span>PDF</span>
                }
              </button>

              <button
                type="button"
                (click)="print()"
                [disabled]="rendering() || (!blob && !blobUrl)"
                title="Print document"
                class="h-9 px-3 flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer">
                <svg class="w-4 h-4 text-slate-600 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                </svg>
                <span>Print</span>
              </button>

              <div class="h-5 w-px bg-slate-200 mx-1 hidden sm:block"></div>

              <!-- Zoom Controls -->
              <button
                type="button"
                (click)="zoomOut()"
                title="Zoom out"
                aria-label="Zoom out"
                class="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 text-gray-700 text-lg font-semibold bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                [disabled]="zoom() <= MIN_ZOOM">
                −
              </button>
              <span class="w-12 text-center text-xs font-semibold text-gray-700 tabular-nums">{{ zoomPercent() }}</span>
              <button
                type="button"
                (click)="zoomIn()"
                title="Zoom in"
                aria-label="Zoom in"
                class="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 text-gray-700 text-lg font-semibold bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                [disabled]="zoom() >= MAX_ZOOM">
                +
              </button>
              <button
                type="button"
                (click)="resetZoom()"
                title="Fit document to width"
                aria-label="Fit document to width"
                class="h-9 px-3 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                Fit Width
              </button>
              <button
                type="button"
                (click)="close()"
                class="ml-1 w-9 h-9 flex items-center justify-center rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 cursor-pointer"
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
  downloadingPdf = signal(false);

  private fitRatio = 1;
  private userAdjusted = false;

  private renderedKey: string | Blob | null = null;

  constructor(private pdfExportService: DocumentPdfExportService) {}

  // Reset the render state whenever the modal closes or a new document arrives.
  // Closing destroys the container (the @if block) and clears renderedKey, so the
  // next open re-renders from scratch.
  ngOnChanges(changes: SimpleChanges) {
    if (changes['open'] && !this.open) {
      this.renderedKey = null;
      this.error.set('');
      this.rendering.set(false);
      this.downloadingPdf.set(false);
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

  downloadDocx() {
    if (!this.blob && !this.blobUrl) return;
    this.loadBlob().then(b => {
      const url = URL.createObjectURL(b);
      const a = document.createElement('a');
      a.href = url;
      const baseName = (this.title || 'document').replace(/\.[^/.]+$/, '');
      a.download = `${baseName}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }

  async downloadPdf() {
    if (!this.blob && !this.blobUrl) return;
    this.downloadingPdf.set(true);

    try {
      const b = await this.loadBlob();
      if (b.type === 'application/pdf') {
        const url = URL.createObjectURL(b);
        const a = document.createElement('a');
        a.href = url;
        const baseName = (this.title || 'document').replace(/\.[^/.]+$/, '');
        a.download = `${baseName}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } else if (this.container?.nativeElement) {
        await this.pdfExportService.exportElementToPdf(this.container.nativeElement, this.title || 'document');
      } else {
        await this.pdfExportService.convertDocxToPdf(b, this.title || 'document');
      }
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      this.downloadingPdf.set(false);
    }
  }

  print() {
    const container = this.container?.nativeElement;
    if (!container) return;

    const iframe = container.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const styleTags = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(node => node.outerHTML)
      .join('\n');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${this.title || 'Document'}</title>
          ${styleTags}
          <style>
            @media print {
              @page { margin: 10mm; size: auto; }
              body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .docx-preview-container { box-shadow: none !important; margin: 0 auto; width: 100% !important; }
            }
            body { margin: 0; padding: 10mm; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .docx-preview-container { box-shadow: none !important; margin: 0 auto; width: 100% !important; }
          </style>
        </head>
        <body>
          <div class="docx-preview-container">
            ${container.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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