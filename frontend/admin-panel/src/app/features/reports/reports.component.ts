import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReportService } from '../../shared/services';
import { AuthService } from '../../core/services/auth.service';
import { TableComponent, TableColumn } from '../../shared/components/table.component';
import { CardComponent } from '../../shared/components/card.component';
import { InputComponent } from '../../shared/components/input.component';
import { ButtonComponent } from '../../shared/components/button.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [TableComponent, CardComponent, InputComponent, DatePipe],
  template: `
    <div>
      <!-- Page Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Reports</h1>
        <p class="text-sm text-slate-500 mt-1">Generate and export official document request reports for Barangay San Manuel.</p>
      </div>

      <app-card title="Request Report">
        <!-- Date Filters and Actions -->
        <div class="flex flex-wrap gap-4 mb-6 items-end">
          <div class="w-44 sm:w-48">
            <app-input label="Start Date" type="date" [value]="startDate()" (valueChange)="onStartDateChange($event)" />
          </div>
          <div class="w-44 sm:w-48">
            <app-input label="End Date" type="date" [value]="endDate()" (valueChange)="onEndDateChange($event)" />
          </div>
          <div class="flex items-end gap-2 pb-0.5">
            <button
              type="button"
              (click)="loadReport()"
              class="inline-flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm rounded-xl shadow-xs transition focus:outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Generate
            </button>
            <button
              type="button"
              (click)="exportPdf()"
              [disabled]="reportData().length === 0 || exporting()"
              class="inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 font-semibold text-sm rounded-xl shadow-xs transition focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer">
              @if (exporting()) {
                <svg class="animate-spin h-4 w-4 text-orange-600" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Exporting...
              } @else {
                <svg class="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Export PDF
              }
            </button>
          </div>
        </div>

        <!-- Report Table -->
        <app-table
          [columns]="columns"
          [data]="reportData()"
          [loading]="loading()"
          trackBy="request_id"
          emptyMessage="No request records found for the selected date range"
          [cellTemplates]="{
            request_number: reqNumCell,
            resident_name: residentCell,
            service_name: serviceCell,
            status_name: statusCell,
            processing_fee: feeCell,
            request_date: dateCell
          }"
        >
          <ng-template #reqNumCell let-row="row">
            <span class="text-sm font-semibold text-slate-900">
              {{ row.request_number }}
            </span>
          </ng-template>

          <ng-template #residentCell let-row="row">
            <span class="text-sm font-semibold text-slate-900">
              {{ row.resident_name }}
            </span>
          </ng-template>

          <ng-template #serviceCell let-row="row">
            <span class="text-sm font-medium text-slate-800">
              {{ row.service_name }}
            </span>
          </ng-template>

          <ng-template #statusCell let-row="row">
            <span [class]="'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ' + statusClass(row.status_name)">
              {{ formatStatusName(row.status_name) }}
            </span>
          </ng-template>

          <ng-template #feeCell let-row="row">
            <span class="text-sm font-medium text-slate-800">
              PHP {{ formatAmount(row.processing_fee) }}
            </span>
          </ng-template>

          <ng-template #dateCell let-row="row">
            <span class="text-sm font-medium text-slate-800">
              {{ row.request_date ? (row.request_date | date: 'mediumDate') : '-' }}
            </span>
          </ng-template>
        </app-table>

        <!-- Bottom Total Row -->
        @if (reportData().length > 0) {
          <div class="mt-4 p-3 bg-orange-50/60 border border-orange-200/80 rounded-xl flex items-center justify-between text-sm">
            <div class="flex items-center gap-2">
              <span class="font-bold text-slate-900">Total:</span>
              <span class="font-bold text-orange-700">PHP {{ formatAmount(totalFees) }}</span>
            </div>
            <div class="font-semibold text-slate-600">
              {{ reportData().length }} request(s)
            </div>
          </div>
        }
      </app-card>
    </div>
  `
})
export class ReportsComponent implements OnInit {
  reportData = signal<any[]>([]);
  loading = signal(false);
  exporting = signal(false);
  startDate = signal('');
  endDate = signal('');

  columns: TableColumn[] = [
    { key: 'request_number', label: 'Request #' },
    { key: 'resident_name', label: 'Resident' },
    { key: 'resident_code', label: 'Resident Code' },
    { key: 'service_name', label: 'Service' },
    { key: 'status_name', label: 'Status' },
    { key: 'processing_fee', label: 'Processing Fee (PHP)', align: 'right' },
    { key: 'request_date', label: 'Request Date', align: 'center' }
  ];

  constructor(
    private reportService: ReportService,
    private auth: AuthService
  ) { }

  ngOnInit() {
    const today = new Date();
    const isoDate = today.toISOString().split('T')[0];
    this.startDate.set(isoDate);
    this.endDate.set(isoDate);
    this.loadReport();
  }

  onStartDateChange(val: string) {
    this.startDate.set(val);
  }

  onEndDateChange(val: string) {
    this.endDate.set(val);
  }

  loadReport() {
    this.loading.set(true);
    this.reportService.getRequests({ dateFrom: this.startDate(), dateTo: this.endDate() }).subscribe({
      next: (res: any) => {
        this.reportData.set(res.data || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  get totalFees(): number {
    return this.reportData().reduce((sum, r) => sum + (Number(r.processing_fee) || 0), 0);
  }

  formatAmount(val: any): string {
    const num = Number(val) || 0;
    return num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatStatusName(status: string): string {
    if (!status) return '-';
    // Normalize status strings to standard title case
    const s = status.trim().toUpperCase();
    if (s === 'PENDING' || s === 'SUBMITTED') return 'Submitted';
    if (s === 'UNDER_REVIEW' || s === 'UNDER REVIEW') return 'Under Review';
    if (s === 'PROCESSING' || s === 'DOCUMENT PROCESSING' || s === 'DOCUMENT_PROCESSING') return 'Document Processing';
    if (s === 'COMPLETED' || s === 'RELEASED') return 'Released';
    if (s === 'RETURNED') return 'Returned';
    if (s === 'REJECTED') return 'Rejected';
    if (s === 'READY_FOR_PICKUP' || s === 'READY FOR PICKUP') return 'Ready for Pickup';
    return status;
  }

  statusClass(status: string): string {
    const s = (status || '').toUpperCase();
    if (s.includes('COMPLETED') || s.includes('RELEASED') || s.includes('APPROVED')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    if (s.includes('RETURNED') || s.includes('REJECTED')) {
      return 'bg-rose-50 text-rose-800 border-rose-200';
    }
    if (s.includes('PROCESSING') || s.includes('READY')) {
      return 'bg-blue-50 text-blue-800 border-blue-200';
    }
    return 'bg-amber-50 text-amber-800 border-amber-200';
  }

  private async loadLogoImage(): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = 'Barangay Logo.png';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
    });
  }

  private formatDateRangeLabel(): string {
    const formatSingle = (dateStr: string) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const from = formatSingle(this.startDate());
    const to = formatSingle(this.endDate());
    if (from && to) {
      return from === to ? from : `${from} - ${to}`;
    }
    return from || to || 'All Dates';
  }

  private formatDateTimeNow(): string {
    const now = new Date();
    const datePart = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timePart = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${datePart}, ${timePart}`;
  }

  private formatTableDate(dateStr: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  async exportPdf() {
    const rows = this.reportData();
    if (!rows.length) return;

    this.exporting.set(true);

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth(); // 297 mm
      const pageHeight = doc.internal.pageSize.getHeight(); // 210 mm
      const marginX = 14;

      // 1. Logo on upper-left
      const logoImg = await this.loadLogoImage();
      if (logoImg) {
        doc.addImage(logoImg, 'PNG', marginX, 10, 22, 22);
      }

      // 2. Formal Center Government Header
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59); // Dark navy/slate #1E293B
      doc.text('REPUBLIC OF THE PHILIPPINES', pageWidth / 2, 12, { align: 'center' });
      doc.text('CITY OF SAN JOSE DEL MONTE', pageWidth / 2, 16, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42); // Deep navy #0F172A
      doc.text('BARANGAY SAN MANUEL', pageWidth / 2, 20.5, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(234, 88, 12); // Orange #EA580C
      doc.text('IMS DOCUMENT REQUEST SERVICES', pageWidth / 2, 25, { align: 'center' });

      // Report Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12.5);
      doc.setTextColor(15, 23, 42);
      doc.text('DOCUMENT REQUESTS REPORT', pageWidth / 2, 31.5, { align: 'center' });

      // 3. Compact Report Information Block on Upper-Right
      const infoBoxWidth = 74;
      const infoBoxX = pageWidth - marginX - infoBoxWidth;
      const infoBoxY = 10;

      // Draw subtle background container for metadata
      doc.setFillColor(255, 247, 237); // Light peach/orange background #FFF7ED
      doc.setDrawColor(254, 215, 170); // Soft orange border #FED7AA
      doc.setLineWidth(0.2);
      doc.roundedRect(infoBoxX, infoBoxY, infoBoxWidth, 21, 1.5, 1.5, 'FD');

      // Helper function to draw simple line icons
      const drawIcon = (type: 'calendar' | 'clock' | 'user', x: number, y: number) => {
        doc.setDrawColor(249, 115, 22); // Orange #F97316
        doc.setLineWidth(0.3);
        if (type === 'calendar') {
          doc.rect(x, y, 3, 3);
          doc.line(x, y + 1, x + 3, y + 1);
          doc.line(x + 0.8, y - 0.4, x + 0.8, y + 0.3);
          doc.line(x + 2.2, y - 0.4, x + 2.2, y + 0.3);
        } else if (type === 'clock') {
          doc.circle(x + 1.5, y + 1.5, 1.5);
          doc.line(x + 1.5, y + 0.6, x + 1.5, y + 1.5);
          doc.line(x + 1.5, y + 1.5, x + 2.2, y + 1.5);
        } else if (type === 'user') {
          doc.circle(x + 1.5, y + 0.9, 0.8);
          doc.line(x + 0.5, y + 3, x + 2.5, y + 3);
          doc.line(x + 0.5, y + 3, x + 0.8, y + 2.1);
          doc.line(x + 2.5, y + 3, x + 2.2, y + 2.1);
          doc.line(x + 0.8, y + 2.1, x + 2.2, y + 2.1);
        }
      };

      // Current Admin / User
      const currentUser = this.auth.currentUser();
      const currentUserName = currentUser
        ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.username || 'Administrator'
        : 'Administrator';

      // Row 1: Date Range
      drawIcon('calendar', infoBoxX + 2.5, infoBoxY + 3.2);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(234, 88, 12);
      doc.text('Date Range:', infoBoxX + 7.5, infoBoxY + 5.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(this.formatDateRangeLabel(), infoBoxX + 27, infoBoxY + 5.5);

      // Row 2: Generated On
      drawIcon('clock', infoBoxX + 2.5, infoBoxY + 9.5);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(234, 88, 12);
      doc.text('Generated On:', infoBoxX + 7.5, infoBoxY + 12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(this.formatDateTimeNow(), infoBoxX + 27, infoBoxY + 12);

      // Row 3: Generated By
      drawIcon('user', infoBoxX + 2.5, infoBoxY + 15.5);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(234, 88, 12);
      doc.text('Generated By:', infoBoxX + 7.5, infoBoxY + 18);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(currentUserName, infoBoxX + 27, infoBoxY + 18);

      // 4. Thin orange horizontal divider line below title
      doc.setDrawColor(249, 115, 22); // Orange #F97316
      doc.setLineWidth(0.6);
      doc.line(marginX, 35, pageWidth - marginX, 35);

      // 5. Main Report Table (7 Columns)
      const tableRows = rows.map(r => [
        r.request_number || '-',
        r.resident_name || '-',
        r.resident_code || '-',
        r.service_name || '-',
        this.formatStatusName(r.status_name),
        `PHP ${this.formatAmount(r.processing_fee)}`,
        this.formatTableDate(r.request_date)
      ]);

      const formattedTotalFees = `PHP ${this.formatAmount(this.totalFees)}`;
      const requestCountLabel = `${rows.length} request(s)`;

      autoTable(doc, {
        startY: 38,
        margin: { left: marginX, right: marginX, bottom: 25 },
        head: [[
          'Request #',
          'Resident',
          'Resident Code',
          'Service',
          'Status',
          'Processing Fee (PHP)',
          'Request Date'
        ]],
        body: tableRows,
        foot: [[
          '',
          '',
          '',
          '',
          'Total:',
          formattedTotalFees,
          requestCountLabel
        ]],
        theme: 'grid',
        headStyles: {
          fillColor: [249, 115, 22], // Solid Orange #F97316
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8.5,
          halign: 'left',
          cellPadding: 3
        },
        bodyStyles: {
          textColor: [30, 41, 59], // Dark navy/slate #1E293B
          fontSize: 8,
          cellPadding: 2.8,
          lineColor: [226, 232, 240], // Thin subtle gray border #E2E8F0
          lineWidth: 0.15
        },
        footStyles: {
          fillColor: [255, 247, 237], // Very light peach/orange background #FFF7ED
          textColor: [15, 23, 42], // Deep dark navy #0F172A
          fontStyle: 'bold',
          fontSize: 8.5,
          cellPadding: 3,
          lineColor: [254, 215, 170], // Light orange border
          lineWidth: 0.2
        },
        columnStyles: {
          0: { cellWidth: 38, fontStyle: 'bold' },
          1: { cellWidth: 48, fontStyle: 'bold' },
          2: { cellWidth: 32 },
          3: { cellWidth: 54 }, // Accommodates long service names
          4: { cellWidth: 34 },
          5: { cellWidth: 35, halign: 'right' },
          6: { cellWidth: 28, halign: 'center' }
        },
        didDrawPage: () => {
          // Page Numbering Footer
          const pageStr = `Page ${doc.internal.pages.length - 1}`;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(148, 163, 184); // Slate-400
          doc.text('BARANGAY SAN MANUEL • IMS DOCUMENT REQUEST SERVICES — OFFICIAL GOVERNMENT RECORD', marginX, pageHeight - 6);
          doc.text(pageStr, pageWidth - marginX, pageHeight - 6, { align: 'right' });
        }
      });

      // 6. Signature Section (Below the Table)
      const finalY = (doc as any).lastAutoTable?.finalY || 140;
      let sigY = finalY + 10;

      // Check if signature section needs a new page
      if (sigY + 28 > pageHeight - 12) {
        doc.addPage();
        sigY = 22;
      }

      // Prepared By (Left Area)
      const leftSigX = marginX + 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42); // Dark navy
      doc.text('Prepared By:', leftSigX, sigY);

      // Blank signature line with ample space for handwritten signature
      doc.setDrawColor(148, 163, 184); // Slate-400
      doc.setLineWidth(0.4);
      doc.line(leftSigX, sigY + 18, leftSigX + 65, sigY + 18);

      // Approved By (Right Area)
      const rightSigX = pageWidth - marginX - 75;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42); // Dark navy
      doc.text('Approved By:', rightSigX, sigY);

      // Blank signature line with ample space for handwritten signature
      doc.line(rightSigX, sigY + 18, rightSigX + 65, sigY + 18);

      // 7. Save Generated PDF
      const filename = `document-requests-report_${this.startDate()}_to_${this.endDate()}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error('Error generating PDF report:', err);
    } finally {
      this.exporting.set(false);
    }
  }
}