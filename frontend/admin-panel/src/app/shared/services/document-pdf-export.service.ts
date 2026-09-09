import { Injectable } from '@angular/core';
import { renderAsync } from 'docx-preview';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

@Injectable({ providedIn: 'root' })
export class DocumentPdfExportService {
  /**
   * Converts a DOCX Blob to a real downloadable PDF file with fast client-side rendering.
   */
  async convertDocxToPdf(blob: Blob, baseName: string): Promise<void> {
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.top = '-99999px';
    tempContainer.style.left = '-99999px';
    tempContainer.style.width = '794px'; // Standard A4 width at 96 DPI
    tempContainer.style.background = '#ffffff';
    tempContainer.style.zIndex = '-9999';
    document.body.appendChild(tempContainer);

    try {
      await renderAsync(blob, tempContainer);
      await this.exportElementToPdf(tempContainer, baseName);
    } finally {
      if (document.body.contains(tempContainer)) {
        document.body.removeChild(tempContainer);
      }
    }
  }

  /**
   * Captures rendered pages concurrently with optimized rasterization and fast compression.
   */
  async exportElementToPdf(container: HTMLElement, baseName: string): Promise<void> {
    const pageNodes = Array.from(container.querySelectorAll<HTMLElement>('.docx_page, section.docx_page, .docx-wrapper > section'));
    const elementsToCapture = pageNodes.length > 0 ? pageNodes : [container];

    // Capture all pages in parallel for maximum speed on multi-core processors
    const canvases = await Promise.all(
      elementsToCapture.map(pageEl =>
        html2canvas(pageEl, {
          scale: 1.5, // 1.5x resolution provides crisp text while rendering 2x+ faster than 2.0x
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          imageTimeout: 0
        })
      )
    );

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    for (let i = 0; i < canvases.length; i++) {
      const canvas = canvases[i];
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      if (i > 0) {
        pdf.addPage();
      }
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    }

    const cleanName = (baseName || 'document').replace(/\.[^/.]+$/, '');
    pdf.save(`${cleanName}.pdf`);
  }
}

