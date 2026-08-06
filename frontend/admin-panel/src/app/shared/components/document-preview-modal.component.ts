import { Component, Input, Output, EventEmitter, AfterViewChecked, ViewChild, ElementRef, signal, OnChanges, SimpleChanges } from '@angular/core';
import { renderAsync } from 'docx-preview';

@Component({
  selector: 'app-document-preview-modal',
  standalone: true,
  imports: [],
  template: `
    @if (open) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" (click)="close()">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()">
          <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-800 truncate" [title]="title">{{ title }}</h3>
            <button (click)="close()" class="text-gray-400 hover:text-gray-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="p-4 overflow-y-auto bg-gray-100">
            @if (rendering()) {
              <div class="text-center py-12 text-sm text-gray-500">Rendering document...</div>
            }
            @if (error()) {
              <div class="text-center py-12 text-sm text-red-600">{{ error() }}</div>
            }
            <div #container class="docx-preview-container"></div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .docx-preview-container {
      background: white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
      min-height: 200px;
      padding: 16px;
      overflow: auto;
      max-height: 70vh;
    }
  `]
})
export class DocumentPreviewModalComponent implements AfterViewChecked, OnChanges {
  @Input() open = false;
  @Input() title = '';
  @Input() blob: Blob | null = null;
  @Input() blobUrl: string | null = null;
  @Output() onClose = new EventEmitter<void>();

  // The container only exists while `open` is true (it lives inside `@if (open)`),
  // so the query must be dynamic (static: false). A static query is resolved once
  // at init — when the div is not yet rendered — and never updated, which would
  // leave the preview permanently blank.
  @ViewChild('container', { static: false }) container!: ElementRef<HTMLDivElement>;

  rendering = signal(false);
  error = signal('');

  private renderedKey: string | Blob | null = null;

  // Reset the render state whenever the modal closes or a new document arrives.
  // Closing destroys the container (the @if block) and clears renderedKey, so the
  // next open re-renders from scratch. Without this, reopening after a close would
  // skip render() (renderedKey still matches) and show an empty container.
  ngOnChanges(changes: SimpleChanges) {
    if (changes['open'] && !this.open) {
      this.renderedKey = null;
      this.error.set('');
      this.rendering.set(false);
    }
    if (changes['blob'] || changes['blobUrl']) {
      this.renderedKey = null;
    }
  }

  // Runs after every change-detection cycle, i.e. after the `@if (open)` block has
  // rendered the container div. ngOnChanges cannot be used for the actual render
  // because it fires BEFORE the conditional view is created on the same cycle, so
  // the container is still unavailable when `open` first becomes true. `render()`
  // is idempotent via renderedKey, so repeated calls are cheap.
  ngAfterViewChecked() {
    if (this.open && this.container?.nativeElement && (this.blob || this.blobUrl)) {
      this.render();
    }
  }

  close() {
    this.renderedKey = null;
    this.onClose.emit();
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

    try {
      const blob = await this.loadBlob();
      if (blob.type === 'application/pdf' || blob.type === 'image/png' || blob.type === 'image/jpeg') {
        const url = URL.createObjectURL(blob);
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '600px';
        iframe.style.border = '0';
        iframe.src = url;
        container.appendChild(iframe);
      } else {
        await renderAsync(blob, container);
      }
      this.rendering.set(false);
    } catch (e: any) {
      this.renderedKey = null;
      this.rendering.set(false);
      this.error.set(e?.message || 'Could not render the document preview.');
    }
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
