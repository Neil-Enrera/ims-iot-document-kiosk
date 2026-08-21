import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, FormsModule, TableComponent, ButtonComponent, CardComponent, InputComponent, PaginationComponent, ModalComponent, RfidFormComponent, DatePipe],
  template: `
    <div>
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">RFID Cards & Resident Registration</h1>
          <p class="text-sm text-slate-500 mt-1">Manage RFID card assignments and track registered vs. unregistered residents.</p>
        </div>
        <app-button variant="primary" (onClick)="openRegisterModal()">+ Register Card</app-button>
      </div>

      <app-card>
        <!-- Search & Filter Controls -->
        <div class="mb-4 flex flex-wrap items-center gap-3">
          <div class="flex-1 min-w-[240px]">
            <app-input placeholder="Search by resident name, code, or card UID..." [value]="search()" (valueChange)="onSearch($event)" />
          </div>
          <select
            [ngModel]="statusFilter()"
            (ngModelChange)="onStatusFilter($event)"
            class="h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Residents</option>
            <option value="REGISTERED">Registered Only</option>
            <option value="NOT_REGISTERED">Not Registered Only</option>
            <option value="Active">Active Cards</option>
            <option value="Suspended">Suspended Cards</option>
            <option value="Revoked">Revoked Cards</option>
          </select>
        </div>

        <!-- Table -->
        <app-table
          [columns]="columns"
          [data]="cards()"
          [loading]="loading()"
          [sortColumn]="sortColumn()"
          [sortDirection]="sortDirection()"
          trackBy="resident_id"
          emptyMessage="No resident or RFID records found"
          [selectedRow]="selectedRow()"
          [cellTemplates]="{ resident_name: residentCell, card_uid: uidCell, registration_status: regCell, status: statusCell, issued_date: dateCell }"
          (onSort)="onSort($event)"
          (onRowClick)="onRowClick($event)"
        >
          <!-- Resident Name Cell -->
          <ng-template #residentCell let-row="row">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-orange-100 border border-orange-200 text-orange-700 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                {{ getInitials(row) }}
              </div>
              <div class="min-w-0">
                <p class="font-semibold text-slate-900 text-sm leading-tight truncate">{{ row.resident_name || '-' }}</p>
                <p class="text-[11px] text-slate-400 leading-tight mt-0.5">{{ row.resident_code || 'Code: -' }}</p>
              </div>
            </div>
          </ng-template>

          <!-- Card UID Cell -->
          <ng-template #uidCell let-row="row">
            @if (row.card_uid && (row.status === 'Active' || row.status === 'ACTIVE')) {
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-orange-50 text-orange-800 border border-orange-200">
                <svg class="w-3.5 h-3.5 text-orange-600 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 9.5h8M7 12h8" stroke-linecap="round"/>
                </svg>
                {{ row.card_uid }}
              </span>
            } @else if (row.card_uid) {
              <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono text-slate-500 bg-slate-50 border border-slate-200">
                {{ row.card_uid }}
              </span>
            } @else {
              <span class="text-xs text-slate-400 font-medium italic">None</span>
            }
          </ng-template>

          <!-- Registration Status Cell -->
          <ng-template #regCell let-row="row">
            @if (row.registration_status === 'Registered' || (row.card_uid && (row.status === 'Active' || row.status === 'ACTIVE'))) {
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <svg class="w-3 h-3 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                Registered
              </span>
            } @else {
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                <svg class="w-3 h-3 text-slate-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9"/>
                  <line x1="9" y1="12" x2="15" y2="12"/>
                </svg>
                Not Registered
              </span>
            }
          </ng-template>

          <!-- Card Status Cell -->
          <ng-template #statusCell let-row="row">
            @if (row.status) {
              <span [class]="'px-2.5 py-0.5 rounded-full text-xs font-bold border ' + (row.status === 'Active' || row.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : row.status === 'Suspended' || row.status === 'SUSPENDED' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-red-50 text-red-800 border-red-200')">
                {{ formatCardStatus(row.status) }}
              </span>
            } @else {
              <span class="text-xs text-slate-400">-</span>
            }
          </ng-template>

          <!-- Issued Date Cell -->
          <ng-template #dateCell let-row="row">
            @if (row.issued_date || row.created_at) {
              <span class="text-xs text-slate-600">
                {{ (row.issued_date || row.created_at) | date: 'mediumDate' }}
              </span>
            } @else {
              <span class="text-xs text-slate-400">-</span>
            }
          </ng-template>
        </app-table>

        @if (total() > 0) {
          <app-pagination
            [total]="total()"
            [currentPage]="page()"
            [limit]="limit"
            itemLabel="residents"
            (onPageChange)="onPageChange($event)"
            (onLimitChange)="onLimitChange($event)" />
        }
      </app-card>

      <!-- Registered RFID Card Details Modal -->
      <app-modal [open]="showDetails()" title="RFID Card Details" (onClose)="closeDetails()">
        @if (selectedCard(); as card) {
          <div class="space-y-4">
            <div class="flex items-center justify-between border-b pb-3">
              <div>
                <h3 class="text-lg font-bold text-gray-900">UID: {{ card.card_uid }}</h3>
                <p class="text-sm text-gray-500">Resident: {{ card.resident_name || 'Unassigned' }}</p>
              </div>
              <span [class]="'px-3 py-1 rounded-full text-xs font-semibold ' + (card.status === 'Active' || card.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : card.status === 'Suspended' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800')">
                {{ card.status }}
              </span>
            </div>

            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p class="text-xs uppercase tracking-wide text-gray-500">Registration Status</p>
                <p class="text-gray-800 font-medium">Registered</p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-wide text-gray-500">Card Status</p>
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

            @if (card.rfid_card_id) {
              <div class="border-t pt-4 mt-6">
                <label class="block text-xs uppercase tracking-wide text-gray-500 mb-2">Change Card Status</label>
                <div class="flex gap-2">
                  <app-button variant="success" size="sm" [disabled]="card.status === 'Active' || card.status === 'ACTIVE' || updating()" (onClick)="updateCardStatus(card.rfid_card_id, 'Active')">Activate</app-button>
                  <app-button variant="secondary" size="sm" [disabled]="card.status === 'Suspended' || updating()" (onClick)="updateCardStatus(card.rfid_card_id, 'Suspended')">Suspend</app-button>
                  <app-button variant="danger" size="sm" [disabled]="card.status === 'Revoked' || updating()" (onClick)="updateCardStatus(card.rfid_card_id, 'Revoked')">Revoke</app-button>
                </div>
              </div>
            }
          </div>
        }
      </app-modal>

      <!-- Register Modal -->
      <app-modal [open]="showForm()" title="Register RFID Card" (onClose)="showForm.set(false)">
        <app-rfid-form
          [initialResidentId]="selectedResidentIdForRegister()"
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
  statusFilter = signal('');
  page = signal(1);
  limit = 10;
  total = signal(0);
  sortColumn = signal('resident_name');
  sortDirection = signal<'ASC' | 'DESC'>('ASC');

  showForm = signal(false);
  selectedResidentIdForRegister = signal<number | null>(null);
  saving = signal(false);

  showDetails = signal(false);
  selectedCard = signal<RfidCard | null>(null);
  selectedRow = signal<RfidCard | null>(null);
  updating = signal(false);

  columns: TableColumn[] = [
    { key: 'resident_name', label: 'Resident Name', sortable: true },
    { key: 'card_uid', label: 'Card UID', sortable: true },
    { key: 'registration_status', label: 'Registration', sortable: true },
    { key: 'status', label: 'Card Status', sortable: true },
    { key: 'issued_date', label: 'Issued Date' }
  ];

  constructor(private rfidService: RfidService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['new'] === '1') {
        this.openRegisterModal();
        this.router.navigate([], { queryParams: { new: null }, queryParamsHandling: 'merge' });
      }
    });
    this.loadCards();
  }

  loadCards() {
    this.loading.set(true);
    this.rfidService.getAll({
      search: this.search(),
      status: this.statusFilter() || undefined,
      page: this.page(),
      limit: this.limit,
      sortBy: this.sortColumn(),
      sortOrder: this.sortDirection()
    }).subscribe({
      next: (res) => {
        this.cards.set(res.data);
        this.total.set(res.pagination.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch(value: string) {
    this.search.set(value);
    this.page.set(1);
    this.loadCards();
  }

  onStatusFilter(value: string) {
    this.statusFilter.set(value);
    this.page.set(1);
    this.loadCards();
  }

  onSort(column: string) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'ASC' ? 'DESC' : 'ASC');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('ASC');
    }
    this.loadCards();
  }

  onPageChange(page: number) {
    this.page.set(page);
    this.loadCards();
  }

  onLimitChange(limit: number) {
    this.limit = limit;
    this.page.set(1);
    this.loadCards();
  }

  openRegisterModal(residentId?: number) {
    this.selectedResidentIdForRegister.set(residentId || null);
    this.showForm.set(true);
  }

  onRowClick(card: RfidCard) {
    this.selectedRow.set(card);
    if (card.card_uid && card.rfid_card_id) {
      this.viewDetails(card);
    } else {
      // Resident is not registered - open registration modal with this resident pre-selected
      this.openRegisterModal(card.resident_id);
    }
  }

  viewDetails(card: RfidCard) {
    if (card.rfid_card_id) {
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
    } else {
      this.selectedCard.set(card);
      this.showDetails.set(true);
    }
  }

  closeDetails() {
    this.showDetails.set(false);
    this.selectedCard.set(null);
    this.selectedRow.set(null);
  }

  getInitials(row: RfidCard): string {
    const first = (row.first_name || '')[0] || '';
    const last = (row.last_name || '')[0] || '';
    if (first || last) return (first + last).toUpperCase();
    const name = row.resident_name || '';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return 'R';
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

  formatCardStatus(status: string | null | undefined): string {
    if (!status) return '-';
    const s = status.toUpperCase();
    if (s === 'ACTIVE') return 'Active';
    if (s === 'SUSPENDED') return 'Suspended';
    if (s === 'CANCELLED') return 'Cancelled';
    if (s === 'REVOKED') return 'Revoked';
    return status;
  }

  onSave(data: any) {
    this.saving.set(true);
    this.rfidService.register(data).subscribe({
      next: () => {
        this.showForm.set(false);
        this.saving.set(false);
        this.loadCards();
      },
      error: (err) => {
        this.saving.set(false);
        alert(err.error?.message || 'Failed to register card.');
      }
    });
  }
}
