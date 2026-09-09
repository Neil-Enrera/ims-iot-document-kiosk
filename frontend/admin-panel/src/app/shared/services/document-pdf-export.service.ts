import { Injectable } from '@angular/core';
import { renderAsync } from 'docx-preview';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

@Injectable({ providedIn: 'root' })
export class DocumentPdfExportService {
  /**
   * Converts a DOCX Blob to a real downloadable PDF file and triggers instant file download.
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
      // Allow fonts and images to settle in DOM
      await new Promise(r => setTimeout(r, 150));
      await this.exportElementToPdf(tempContainer, baseName);
    } finally {
      if (document.body.contains(tempContainer)) {
        document.body.removeChild(tempContainer);
      }
    }
  }

  /**
   * Captures rendered pages from a DOM element and downloads them as a multi-page PDF.
   */
  async exportElementToPdf(container: HTMLElement, baseName: string): Promise<void> {
    const pageNodes = Array.from(container.querySelectorAll<HTMLElement>('.docx_page, section.docx_page, .docx-wrapper > section'));
    const elementsToCapture = pageNodes.length > 0 ? pageNodes : [container];

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    for (let i = 0; i < elementsToCapture.length; i++) {
      const pageEl = elementsToCapture[i];
      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      if (i > 0) {
        pdf.addPage();
      }
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
    }

    const cleanName = (baseName || 'document').replace(/\.[^/.]+$/, '');
    pdf.save(`${cleanName}.pdf`);
  }
}
