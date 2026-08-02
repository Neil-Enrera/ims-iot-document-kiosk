import { Component, OnInit, signal } from '@angular/core';
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
        <div class="flex gap-4 mb-4">
          <app-input label="Start Date" type="date" [value]="startDate()" (valueChange)="startDate.set($event)" />
          <app-input label="End Date" type="date" [value]="endDate()" (valueChange)="endDate.set($event)" />
          <div class="flex items-end">
            <app-button variant="primary" (onClick)="loadReport()">Generate</app-button>
          </div>
        </div>

        <app-table
          [columns]="columns"
          [data]="reportData()"
          [loading]="loading()"
          trackBy="request_id"
          emptyMessage="No report data" />
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
    { key: 'service_name', label: 'Service' },
    { key: 'status_name', label: 'Status' },
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
    this.reportService.getRequests({ start_date: this.startDate(), end_date: this.endDate() }).subscribe({
      next: (res) => { this.reportData.set(res.data?.requests || []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
