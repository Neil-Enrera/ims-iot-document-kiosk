import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
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
  imports: [TableComponent, ButtonComponent, CardComponent, InputComponent, PaginationComponent, ModalComponent, RfidFormComponent, DatePipe],
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
          emptyMessage="No RFID cards found"
          [selectedRow]="selectedRow()"
          [cellTemplates]="{ card_uid: uidCell, resident_name: residentCell, status: statusCell }"
          (onRowClick)="onRowClick($event)"
        >
          <ng-template #uidCell let-row="row">
            <span class="text-sm font-semibold text-slate-900">
              {{ row.card_uid }}
            </span>
          </ng-template>
          <ng-template #residentCell let-row="row">
            <span class="text-sm font-semibold text-slate-900">
              {{ row.resident_name || 'Unassigned' }}
            </span>
          </ng-template>
          <ng-template #statusCell let-row="row">
            <span [class]="'px-2.5 py-1 rounded-full text-xs font-bold border ' + (row.status === 'Active' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : row.status === 'Suspended' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-red-50 text-red-800 border-red-200')">
              {{ row.status }}
            </span>
          </ng-template>
        </app-table>

        @if (total() > 0) {
          <app-pagination
            [total]="total()"
            [currentPage]="page()"
            [limit]="limit"
            itemLabel="cards"
            (onPageChange)="onPageChange($event)"
            (onLimitChange)="onLimitChange($event)" />
        }
      </app-card>

      <!-- RFID Card Details Modal -->
      <app-modal [open]="showDetails()" title="RFID Card Details" (onClose)="closeDetails()">
        @if (selectedCard(); as card) {
          <div class="space-y-4">
            <div class="flex items-center justify-between border-b pb-3">
              <div>
                <h3 class="text-lg font-bold text-gray-900">UID: {{ card.card_uid }}</h3>
                <p class="text-sm text-gray-500">Resident: {{ card.resident_name || 'Unassigned' }}</p>
              </div>
              <span [class]="'px-3 py-1 rounded-full text-xs font-semibold ' + (card.status === 'Active' ? 'bg-green-100 text-green-800' : card.status === 'Suspended' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800')">{{ card.status }}</span>
            </div>

            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p class="text-xs uppercase tracking-wide text-gray-500">Card ID</p>
                <p class="text-gray-800 font-medium">{{ card.rfid_card_id }}</p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-wide text-gray-500">Status</p>
                <p class="text-gray-800 font-medium">{{ card.status }}</p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-wide text-gray-500">Issued Date</p>
                <p class="text-gray-800 font-medium">{{ card.issued_date ? (card.issued_date | date: 'mediumDate') : '-' }}</p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-wide text-gray-500">Expiration Date</p>
                <p class="text-gray-800 font-medium">{{ card.expiration_date ? (card.expiration_date | date: 'mediumDate') : 'Never' }}</p>
              </div>
            </div>

            <div class="border-t pt-4 mt-6">
              <label class="block text-xs uppercase tracking-wide text-gray-500 mb-2">Change Card Status</label>
              <div class="flex gap-2">
                <app-button variant="success" size="sm" [disabled]="card.status === 'Active' || updating()" (onClick)="updateCardStatus(card.rfid_card_id, 'Active')">Activate</app-button>
                <app-button variant="secondary" size="sm" [disabled]="card.status === 'Suspended' || updating()" (onClick)="updateCardStatus(card.rfid_card_id, 'Suspended')">Suspend</app-button>
                <app-button variant="danger" size="sm" [disabled]="card.status === 'Revoked' || updating()" (onClick)="updateCardStatus(card.rfid_card_id, 'Revoked')">Revoke</app-button>
              </div>
            </div>
          </div>
        }
      </app-modal>

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

  showDetails = signal(false);
  selectedCard = signal<RfidCard | null>(null);
  selectedRow = signal<RfidCard | null>(null);
  updating = signal(false);

  columns: TableColumn[] = [
    { key: 'rfid_card_id', label: 'ID', sortable: true },
    { key: 'card_uid', label: 'Card UID', sortable: true },
    { key: 'resident_name', label: 'Resident' },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'issued_date', label: 'Issued Date' },
    { key: 'expiration_date', label: 'Expires' }
  ];

  constructor(private rfidService: RfidService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['new'] === '1') {
        this.showForm.set(true);
        this.router.navigate([], { queryParams: { new: null }, queryParamsHandling: 'merge' });
      }
    });
    this.loadCards();
  }

  loadCards() {
    this.loading.set(true);
    this.rfidService.getAll({ search: this.search(), page: this.page(), limit: this.limit }).subscribe({
      next: (res) => { this.cards.set(res.data); this.total.set(res.pagination.total); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onSearch(value: string) { this.search.set(value); this.page.set(1); this.loadCards(); }
  onPageChange(page: number) { this.page.set(page); this.loadCards(); }
  onLimitChange(limit: number) { this.limit = limit; this.page.set(1); this.loadCards(); }

  onRowClick(card: RfidCard) {
    this.viewDetails(card);
  }

  viewDetails(card: RfidCard) {
    this.selectedRow.set(card);
    this.rfidService.getById(card.rfid_card_id).subscribe({
      next: (res) => {
        this.selectedCard.set(res.data);
        this.showDetails.set(true);
      },
      error: () => {
        this.selectedCard.set(card);
        this.showDetails.set(true);
      }
    });
  }

  closeDetails() {
    this.showDetails.set(false);
    this.selectedCard.set(null);
    this.selectedRow.set(null);
  }

  updateCardStatus(id: number, status: string) {
    this.updating.set(true);
    this.rfidService.updateStatus(id, status).subscribe({
      next: () => {
        this.updating.set(false);
        this.closeDetails();
        this.loadCards();
      },
      error: (err) => {
        this.updating.set(false);
        alert(err.error?.message || 'Failed to update RFID card status.');
      }
    });
  }

  onSave(data: any) {
    this.saving.set(true);
    this.rfidService.register(data).subscribe({
      next: () => { this.showForm.set(false); this.saving.set(false); this.loadCards(); },
      error: (err) => { this.saving.set(false); alert(err.error?.message || 'Failed to register card.'); }
    });
  }
}
