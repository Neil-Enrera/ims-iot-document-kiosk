import { Component, OnInit, signal } from '@angular/core';
import { RfidService } from '../../shared/services';
import { RfidCard } from '../../shared/interfaces/api.interfaces';
import { TableComponent, TableColumn } from '../../shared/components/table.component';
import { ButtonComponent } from '../../shared/components/button.component';
import { CardComponent } from '../../shared/components/card.component';
import { InputComponent } from '../../shared/components/input.component';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { RfidFormComponent } from './rfid-form.component';

@Component({
  selector: 'app-rfid',
  standalone: true,
  imports: [TableComponent, ButtonComponent, CardComponent, InputComponent, PaginationComponent, ModalComponent, RfidFormComponent],
  template: `
    <div>
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800">RFID Cards</h1>
        <app-button variant="primary" (onClick)="showForm.set(true)">+ Register Card</app-button>
      </div>

      <app-card>
        <div class="mb-4">
          <app-input placeholder="Search by UID..." [value]="search()" (valueChange)="onSearch($event)" />
        </div>

        <app-table
          [columns]="columns"
          [data]="cards()"
          [loading]="loading()"
          trackBy="rfid_card_id"
          emptyMessage="No RFID cards found" />

        @if (total() > limit) {
          <app-pagination
            [total]="total()"
            [currentPage]="page()"
            [limit]="limit"
            (onPageChange)="onPageChange($event)" />
        }
      </app-card>

      <!-- Register Modal -->
      <app-modal [open]="showForm()" title="Register RFID Card" (onClose)="showForm.set(false)">
        <app-rfid-form
          [loading]="saving()"
          (onSave)="onSave($event)"
          (onCancel)="showForm.set(false)"
        />
      </app-modal>
    </div>
  `
})
export class RfidComponent implements OnInit {
  cards = signal<RfidCard[]>([]);
  loading = signal(true);
  search = signal('');
  page = signal(1);
  limit = 20;
  total = signal(0);
  showForm = signal(false);
  saving = signal(false);

  columns: TableColumn[] = [
    { key: 'rfid_card_id', label: 'ID', sortable: true },
    { key: 'card_uid', label: 'Card UID', sortable: true },
    { key: 'resident_name', label: 'Resident' },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'issued_date', label: 'Issued Date' },
    { key: 'expiration_date', label: 'Expires' }
  ];

  constructor(private rfidService: RfidService) {}

  ngOnInit() { this.loadCards(); }

  loadCards() {
    this.loading.set(true);
    this.rfidService.getAll({ search: this.search(), page: this.page(), limit: this.limit }).subscribe({
      next: (res) => { this.cards.set(res.data); this.total.set(res.pagination.total); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onSearch(value: string) { this.search.set(value); this.page.set(1); this.loadCards(); }
  onPageChange(page: number) { this.page.set(page); this.loadCards(); }

  onSave(data: any) {
    this.saving.set(true);
    this.rfidService.register(data).subscribe({
      next: () => { this.showForm.set(false); this.saving.set(false); this.loadCards(); },
      error: (err) => { this.saving.set(false); alert(err.error?.message || 'Failed to register card.'); }
    });
  }
}
