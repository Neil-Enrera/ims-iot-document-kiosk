import { Component, OnInit, signal } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReportService } from '../../shared/services';
import { TableComponent, TableColumn } from '../../shared/components/table.component';
import { CardComponent } from '../../shared/components/card.component';
import { InputComponent } from '../../shared/components/input.component';
import { ButtonComponent } from '../../shared/components/button.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [TableComponent, CardComponent, InputComponent, ButtonComponent],
  template: `
    <div>
      <h1 class="text-2xl font-bold text-gray-800 mb-6">Reports</h1>

      <app-card title="Request Report">
        <div class="flex flex-wrap gap-4 mb-4 items-end">
          <app-input label="Start Date" type="date" [value]="startDate()" (valueChange)="startDate.set($event)" />
          <app-input label="End Date" type="date" [value]="endDate()" (valueChange)="endDate.set($event)" />
          <div class="flex items-end gap-2">
            <app-button variant="primary" (onClick)="loadReport()">Generate</app-button>
            <app-button variant="secondary" (onClick)="exportPdf()" [disabled]="reportData().length === 0">Export PDF</app-button>
          </div>
        </div>

        <app-table
          [columns]="columns"
          [data]="reportData()"
          [loading]="loading()"
          trackBy="request_id"
          emptyMessage="No report data" />

        @if (reportData().length > 0) {
          <div class="mt-4 text-sm text-gray-600 flex items-center gap-2">
            <span class="font-semibold">Total Processing Fees: ₱{{ totalFees }}</span>
            <span class="text-gray-300">|</span>
            <span>{{ reportData().length }} request(s)</span>
          </div>
        }
      </app-card>
    </div>
  `
})
export class ReportsComponent implements OnInit {
  reportData = signal<any[]>([]);
  loading = signal(false);
  startDate = signal('');
  endDate = signal('');

  columns: TableColumn[] = [
    { key: 'request_number', label: 'Request #' },
    { key: 'resident_name', label: 'Resident' },
    { key: 'resident_code', label: 'Resident Code' },
    { key: 'service_name', label: 'Service' },
    { key: 'status_name', label: 'Status' },
    { key: 'processing_fee', label: 'Fee' },
    { key: 'request_date', label: 'Date' }
  ];

  constructor(private reportService: ReportService) {}

  ngOnInit() {
    const today = new Date();
    this.startDate.set(today.toISOString().split('T')[0]);
    this.endDate.set(today.toISOString().split('T')[0]);
    this.loadReport();
  }

  loadReport() {
    this.loading.set(true);
    this.reportService.getRequests({ dateFrom: this.startDate(), dateTo: this.endDate() }).subscribe({
      next: (res: any) => { this.reportData.set(res.data || []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  get totalFees(): number {
    return this.reportData().reduce((sum, r) => sum + (Number(r.processing_fee) || 0), 0);
  }

  exportPdf() {
    const rows = this.reportData();
    if (!rows.length) return;

    const doc = new jsPDF({ orientation: 'landscape' });
    const rangeLabel = `${this.startDate()} to ${this.endDate()}`;

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('Barangay San Manuel', 14, 15);
    doc.setFontSize(11);
    doc.text('IMS Document Request Services', 14, 21);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Document Requests Report', 14, 28);
    doc.text(`Date Range: ${rangeLabel}`, 14, 34);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 40);

    autoTable(doc, {
      startY: 45,
      head: [[
        'Request #', 'Resident', 'Resident Code', 'Service', 'Status',
        'Processing Fee (PHP)', 'Request Date'
      ]],
      body: rows.map(r => [
        r.request_number || '',
        r.resident_name || '',
        r.resident_code || '',
        r.service_name || '',
        r.status_name || '',
        r.processing_fee != null ? Number(r.processing_fee).toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '',
        r.request_date ? new Date(r.request_date).toLocaleDateString('en-PH') : ''
      ]),
      foot: [[
        '', '', '', '', 'Total:',
        this.totalFees.toLocaleString('en-PH', { minimumFractionDigits: 2 }),
        `${rows.length} request(s)`
      ]],
      theme: 'grid',
      headStyles: { fillColor: [249, 115, 22], textColor: 255, fontStyle: 'bold' },
      footStyles: { fillColor: [255, 247, 237], textColor: [15, 23, 42], fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 2 }
    });

    const filename = `request-report_${this.startDate()}_to_${this.endDate()}.pdf`;
    doc.save(filename);
  }
}