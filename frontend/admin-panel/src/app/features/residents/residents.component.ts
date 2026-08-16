import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { DatePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResidentService, RfidService, RequestService, ApplicationService } from '../../shared/services';
import { Resident } from '../../shared/interfaces/api.interfaces';
import { TableComponent, TableColumn } from '../../shared/components/table.component';
import { ButtonComponent } from '../../shared/components/button.component';
import { CardComponent } from '../../shared/components/card.component';
import { InputComponent } from '../../shared/components/input.component';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { ResidentFormComponent } from './resident-form.component';

@Component({
  selector: 'app-residents',
  standalone: true,
  imports: [CommonModule, FormsModule, TableComponent, ButtonComponent, CardComponent, InputComponent, PaginationComponent, ModalComponent, ConfirmDialogComponent, ResidentFormComponent, DatePipe],
  template: `
    <div>
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Residents</h1>
        <app-button variant="primary" (onClick)="openCreateForm()">+ Add Resident</app-button>
      </div>

      <app-card>
        <div class="mb-4 flex flex-wrap items-center gap-3">
          <div class="flex-1 min-w-[220px]">
            <app-input placeholder="Search residents..." [value]="search()" (valueChange)="onSearch($event)" />
          </div>
          <select
            [ngModel]="statusFilter()"
            (ngModelChange)="onStatusFilter($event)"
            class="h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Archived</option>
          </select>
        </div>

        <app-table
          [columns]="columns"
          [data]="residents()"
          [loading]="loading()"
          [sortColumn]="sortColumn()"
          [sortDirection]="sortDirection()"
          trackBy="resident_id"
          emptyMessage="No residents found"
          [selectedRow]="selectedRow()"
          (onSort)="onSort($event)"
          (onRowClick)="onRowClick($event)"
        />

        @if (total() > limit) {
          <app-pagination
            [total]="total()"
            [currentPage]="page()"
            [limit]="limit"
            (onPageChange)="onPageChange($event)"
          />
        }
      </app-card>

      <!-- Resident Details Modal -->
      <app-modal [open]="showDetails()" title="Resident Profile" (onClose)="closeDetails()" containerClass="max-w-2xl">
        @if (selectedResident(); as res) {
          <div class="space-y-4">
            <!-- Header Block -->
            <div class="flex items-center justify-between border-b pb-3">
              <div>
                <h3 class="text-lg font-bold text-gray-900">{{ res.first_name }} {{ res.middle_name ? res.middle_name + ' ' : '' }}{{ res.last_name }}{{ res.suffix ? ' ' + res.suffix : '' }}</h3>
                <p class="text-sm text-gray-500">Code: {{ res.resident_code }}</p>
              </div>
              <span [class]="'px-3 py-1 rounded-full text-xs font-semibold ' + (isActive(res) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')">{{ res.status }}</span>
            </div>

            <!-- Tab Headers -->
            <div class="flex border-b border-gray-200">
              <button type="button" (click)="activeTab.set('bio')" [class]="'px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition ' + (activeTab() === 'bio' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')">
                Bio Info
              </button>
              <button type="button" (click)="activeTab.set('rfid'); connectRfidScanner()" [class]="'px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition ' + (activeTab() === 'rfid' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')">
                RFID Cards
              </button>
              <button type="button" (click)="activeTab.set('history'); disconnectRfidScanner()" [class]="'px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition ' + (activeTab() === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')">
                Request History
              </button>
            </div>

            <!-- TAB CONTENT -->
            <div class="min-h-[250px] max-h-[60vh] overflow-y-auto pr-1">
              
              <!-- Tab 1: Bio Info -->
              @if (activeTab() === 'bio') {
                <div class="grid grid-cols-2 gap-4 text-sm mt-2">
                  <div>
                    <p class="text-xs uppercase tracking-wide text-gray-500">Gender</p>
                    <p class="text-gray-800 font-medium">{{ res.gender || '-' }}</p>
                  </div>
                  <div>
                    <p class="text-xs uppercase tracking-wide text-gray-500">Civil Status</p>
                    <p class="text-gray-800 font-medium">{{ res.civil_status || '-' }}</p>
                  </div>
                  <div>
                    <p class="text-xs uppercase tracking-wide text-gray-500">Birth Date</p>
                    <p class="text-gray-800 font-medium">{{ res.birth_date ? (res.birth_date | date: 'mediumDate') : '-' }}</p>
                  </div>
                  <div>
                    <p class="text-xs uppercase tracking-wide text-gray-500">Birth Place</p>
                    <p class="text-gray-800 font-medium">{{ res.birth_place || '-' }}</p>
                  </div>
                  <div>
                    <p class="text-xs uppercase tracking-wide text-gray-500">Nationality</p>
                    <p class="text-gray-800 font-medium">{{ res.nationality || 'Filipino' }}</p>
                  </div>
                  <div>
                    <p class="text-xs uppercase tracking-wide text-gray-500">Religion</p>
                    <p class="text-gray-800 font-medium">{{ res.religion || '-' }}</p>
                  </div>
                  <div>
                    <p class="text-xs uppercase tracking-wide text-gray-500">Occupation</p>
                    <p class="text-gray-800 font-medium">{{ res.occupation || '-' }}</p>
                  </div>
                  <div>
                    <p class="text-xs uppercase tracking-wide text-gray-500">Contact Number</p>
                    <p class="text-gray-800 font-medium">{{ res.contact_number || '-' }}</p>
                  </div>
                  <div class="col-span-2">
                    <p class="text-xs uppercase tracking-wide text-gray-500">Email Address</p>
                    <p class="text-gray-800 font-medium">{{ res.email || '-' }}</p>
                  </div>
                  <div class="col-span-2">
                    <p class="text-xs uppercase tracking-wide text-gray-500">House Number / Street / Purok / Sitio</p>
                    <p class="text-gray-800 font-medium">
                      {{ formatFullAddress(res) }}
                    </p>
                  </div>
                </div>

                <div class="flex justify-end gap-3 border-t pt-4 mt-6">
                  @if (isActive(res)) {
                    <app-button variant="danger" (onClick)="onArchiveClick(res)">Archive</app-button>
                  } @else {
                    <app-button variant="primary" (onClick)="onRestoreClick(res)">Restore</app-button>
                  }
                  <app-button variant="primary" (onClick)="onEditClick(res)">Edit</app-button>
                </div>
              }

              <!-- Tab 2: RFID Cards -->
              @if (activeTab() === 'rfid') {
                <div class="space-y-4 mt-2">
                  <!-- Register Card Form -->
                  <div class="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">Register New RFID Card</h4>
                    <div class="flex items-end gap-3">
                      <div class="flex-1">
                        <label class="block text-xs text-gray-500 font-semibold mb-1">Tap a card on the RFID Scanner to scan automatically...</label>
                        <input type="text" [(ngModel)]="newCardUid" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Card UID (e.g. 8A1B2C3D)" />
                      </div>
                      <app-button variant="primary" (onClick)="registerRfid(res)" [disabled]="!newCardUid.trim()">Register Card</app-button>
                    </div>
                  </div>

                  <!-- Registered Cards List -->
                  <div>
                    <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Registered RFID Cards</h4>
                    @if (residentRfidCards().length > 0) {
                      <div class="space-y-2">
                        @for (card of residentRfidCards(); track card.rfid_card_id) {
                          <div class="flex items-center justify-between border rounded-lg p-3 bg-white hover:bg-gray-50 transition">
                            <div>
                              <p class="text-sm font-semibold text-gray-900">UID: {{ card.card_uid }}</p>
                              <p class="text-[11px] text-gray-400">Registered: {{ card.created_at | date: 'medium' }}</p>
                            </div>
                            <div class="flex items-center gap-2">
                              <span [class]="'px-2 py-0.5 rounded-full text-[10px] font-bold ' + (card.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')">{{ card.status }}</span>
                              @if (card.status === 'Active') {
                                <button type="button" (click)="deactivateRfid(card.rfid_card_id, res)" class="text-xs text-red-600 font-semibold hover:underline">Deactivate</button>
                              } @else {
                                <button type="button" (click)="activateRfid(card.rfid_card_id, res)" class="text-xs text-green-600 font-semibold hover:underline">Activate</button>
                              }
                            </div>
                          </div>
                        }
                      </div>
                    } @else {
                      <p class="text-xs text-gray-500 bg-gray-50 border border-dashed rounded-lg p-4 text-center">No RFID cards registered for this resident.</p>
                    }
                  </div>
                </div>
              }

              <!-- Tab 3: Request History -->
              @if (activeTab() === 'history') {
                <div class="space-y-4 mt-2">
                  <!-- Document Requests List -->
                  <div>
                    <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Document Requests</h4>
                    @if (residentRequests().length > 0) {
                      <div class="space-y-2 max-h-48 overflow-y-auto">
                        @for (req of residentRequests(); track req.request_id) {
                          <div class="border rounded-lg p-3 bg-white">
                            <div class="flex items-center justify-between">
                              <p class="text-sm font-semibold text-gray-900">{{ req.service_name }}</p>
                              <span class="text-xs font-semibold text-gray-500">{{ req.status_name }}</span>
                            </div>
                            <p class="text-[11px] text-gray-400">Requested: {{ req.request_date | date: 'medium' }} · Request #: {{ req.request_number }}</p>
                          </div>
                        }
                      </div>
                    } @else {
                      <p class="text-xs text-gray-500 bg-gray-50 border border-dashed rounded-lg p-3 text-center">No document requests recorded.</p>
                    }
                  </div>

                  <!-- Barangay ID Applications -->
                  <div>
                    <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Barangay ID Applications</h4>
                    @if (residentApplications().length > 0) {
                      <div class="space-y-2 max-h-48 overflow-y-auto">
                        @for (app of residentApplications(); track app.application_id) {
                          <div class="border rounded-lg p-3 bg-white">
                            <div class="flex items-center justify-between">
                              <p class="text-sm font-semibold text-gray-900">Application #: {{ app.application_number }}</p>
                              <span [class]="'px-2 py-0.5 rounded-full text-[10px] font-bold ' + (app.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800')">{{ app.status }}</span>
                            </div>
                            <p class="text-[11px] text-gray-400">Submitted: {{ app.created_at }}</p>
                          </div>
                        }
                      </div>
                    } @else {
                      <p class="text-xs text-gray-500 bg-gray-50 border border-dashed rounded-lg p-3 text-center">No Barangay ID applications recorded.</p>
                    }
                  </div>
                </div>
              }

            </div>
          </div>
        }
      </app-modal>

      <!-- Create/Edit Modal -->
      <app-modal [open]="showForm()" [title]="editingResident() ? 'Edit Resident' : 'Add Resident'" (onClose)="closeForm()">
        <app-resident-form
          [resident]="editingResident()"
          [loading]="saving()"
          (onSave)="onSave($event)"
          (onCancel)="closeForm()"
        />
      </app-modal>

      <!-- Archive / Restore Confirmation -->
      @if (showArchiveConfirm()) {
        <app-confirm-dialog
          [open]="true"
          title="Archive Resident"
          [message]="'Are you sure you want to archive ' + (targetResident()?.first_name || '') + ' ' + (targetResident()?.last_name || '') + '? They will no longer be able to request documents at the kiosk.'"
          confirmText="Archive"
          variant="danger"
          (onCancel)="showArchiveConfirm.set(false)"
          (onConfirm)="confirmArchive()"
        />
      }
      @if (showRestoreConfirm()) {
        <app-confirm-dialog
          [open]="true"
          title="Restore Resident"
          [message]="'Are you sure you want to restore ' + (targetResident()?.first_name || '') + ' ' + (targetResident()?.last_name || '') + '?'"
          confirmText="Restore"
          variant="primary"
          (onCancel)="showRestoreConfirm.set(false)"
          (onConfirm)="confirmRestore()"
        />
      }
    </div>
  `
})
export class ResidentsComponent implements OnInit, OnDestroy {
  residents = signal<Resident[]>([]);
  loading = signal(true);
  search = signal('');
  page = signal(1);
  limit = 20;
  total = signal(0);
  sortColumn = signal('resident_id');
  sortDirection = signal<'ASC' | 'DESC'>('DESC');

  showDetails = signal(false);
  selectedResident = signal<any | null>(null);
  selectedRow = signal<Resident | null>(null);

  activeTab = signal<'bio' | 'rfid' | 'history'>('bio');
  residentRfidCards = signal<any[]>([]);
  residentRequests = signal<any[]>([]);
  residentApplications = signal<any[]>([]);
  newCardUid = '';
  private ws: WebSocket | null = null;

  formatFullAddress(res: any): string {
    if (!res) return '';
    const addr = [res.house_number, res.street, res.purok_zone, res.sitio].filter(x => !!x).join(', ');
    return addr || res.address_line || '-';
  }

  showForm = signal(false);
  editingResident = signal<Resident | null>(null);
  saving = signal(false);

  showArchiveConfirm = signal(false);
  showRestoreConfirm = signal(false);
  targetResident = signal<Resident | null>(null);
  statusFilter = signal('');

  isActive(res: any): boolean {
    return res?.status === 'ACTIVE' || res?.status === 'Active';
  }

  columns: TableColumn[] = [
    { key: 'resident_code', label: 'Code', sortable: true },
    { key: 'first_name', label: 'First Name', sortable: true },
    { key: 'last_name', label: 'Last Name', sortable: true },
    { key: 'gender', label: 'Gender' },
    { key: 'civil_status', label: 'Civil Status' },
    { key: 'contact_number', label: 'Contact' },
    { key: 'status', label: 'Status', sortable: true }
  ];

  constructor(
    private residentService: ResidentService,
    private rfidService: RfidService,
    private requestService: RequestService,
    private applicationService: ApplicationService
  ) {}

  ngOnInit() {
    this.loadResidents();
  }

  ngOnDestroy() {
    this.disconnectRfidScanner();
  }

  loadResidents() {
    this.loading.set(true);
    this.residentService.getAll({
      search: this.search(),
      page: this.page(),
      limit: this.limit,
      sortBy: this.sortColumn(),
      sortOrder: this.sortDirection(),
      status: this.statusFilter() || undefined
    }).subscribe({
      next: (res) => {
        this.residents.set(res.data);
        this.total.set(res.pagination.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch(value: string) {
    this.search.set(value);
    this.page.set(1);
    this.loadResidents();
  }

  onStatusFilter(value: string) {
    this.statusFilter.set(value);
    this.page.set(1);
    this.loadResidents();
  }

  onSort(column: string) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'ASC' ? 'DESC' : 'ASC');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('ASC');
    }
    this.loadResidents();
  }

  onPageChange(page: number) {
    this.page.set(page);
    this.loadResidents();
  }

  onRowClick(resident: Resident) {
    this.viewDetails(resident);
  }

  viewDetails(resident: Resident) {
    this.selectedRow.set(resident);
    this.activeTab.set('bio');
    this.newCardUid = '';
    this.disconnectRfidScanner();
    this.residentService.getById(resident.resident_id).subscribe({
      next: (res) => {
        this.selectedResident.set(res.data);
        this.showDetails.set(true);
        this.loadResidentRfid(res.data);
        this.loadResidentHistory(res.data);
      },
      error: () => {
        this.selectedResident.set(resident);
        this.showDetails.set(true);
        this.loadResidentRfid(resident);
        this.loadResidentHistory(resident);
      }
    });
  }

  closeDetails() {
    this.showDetails.set(false);
    this.selectedResident.set(null);
    this.selectedRow.set(null);
    this.disconnectRfidScanner();
  }

  onEditClick(resident: Resident) {
    this.editingResident.set(resident);
    this.showForm.set(true);
    this.closeDetails();
  }

  onArchiveClick(resident: Resident) {
    this.targetResident.set(resident);
    this.showArchiveConfirm.set(true);
    this.closeDetails();
  }

  onRestoreClick(resident: Resident) {
    this.targetResident.set(resident);
    this.showRestoreConfirm.set(true);
    this.closeDetails();
  }

  openCreateForm() {
    this.editingResident.set(null);
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.editingResident.set(null);
    this.saving.set(false);
  }

  onSave(data: any) {
    this.saving.set(true);
    const request = this.editingResident()
      ? this.residentService.update(this.editingResident()!.resident_id, data)
      : this.residentService.create(data);

    request.subscribe({
      next: () => {
        this.closeForm();
        this.loadResidents();
      },
      error: (err) => {
        this.saving.set(false);
        alert(err.error?.message || 'Failed to save resident.');
      }
    });
  }

  confirmArchive() {
    if (!this.targetResident()) return;
    this.residentService.archive(this.targetResident()!.resident_id).subscribe({
      next: () => {
        this.showArchiveConfirm.set(false);
        this.targetResident.set(null);
        this.loadResidents();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to archive resident.');
      }
    });
  }

  confirmRestore() {
    if (!this.targetResident()) return;
    this.residentService.restore(this.targetResident()!.resident_id).subscribe({
      next: () => {
        this.showRestoreConfirm.set(false);
        this.targetResident.set(null);
        this.loadResidents();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to restore resident.');
      }
    });
  }

  loadResidentRfid(res: Resident) {
    this.rfidService.getAll({ search: res.resident_code }).subscribe({
      next: (resData) => {
        this.residentRfidCards.set(resData.data || []);
      }
    });
  }

  loadResidentHistory(res: Resident) {
    this.requestService.getAll({ residentId: res.resident_id }).subscribe({
      next: (reqRes) => {
        this.residentRequests.set(reqRes.data || []);
      }
    });
    this.applicationService.getAll({ search: res.last_name }).subscribe({
      next: (appRes) => {
        const apps = (appRes.data || []).filter((a: any) => a.resident_id === res.resident_id);
        this.residentApplications.set(apps);
      }
    });
  }

  connectRfidScanner() {
    if (this.ws) return;
    this.ws = new WebSocket('ws://localhost:3001/ws?type=kiosk');
    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'rfid_scan' && msg.data?.uid) {
          this.newCardUid = msg.data.uid;
        }
      } catch (e) {
        console.error('Error parsing WS message:', e);
      }
    };
    this.ws.onclose = () => {
      this.ws = null;
    };
  }

  disconnectRfidScanner() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  registerRfid(res: Resident) {
    if (!this.newCardUid.trim()) return;
    this.rfidService.register({
      residentId: res.resident_id,
      cardUid: this.newCardUid.trim()
    }).subscribe({
      next: () => {
        this.newCardUid = '';
        this.loadResidentRfid(res);
        alert('RFID Card registered successfully!');
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to register card.');
      }
    });
  }

  activateRfid(cardId: number, res: Resident) {
    this.rfidService.updateStatus(cardId, 'Active').subscribe({
      next: () => this.loadResidentRfid(res),
      error: (err) => alert(err.error?.message || 'Failed to activate card.')
    });
  }

  deactivateRfid(cardId: number, res: Resident) {
    this.rfidService.updateStatus(cardId, 'Revoked').subscribe({
      next: () => this.loadResidentRfid(res),
      error: (err) => alert(err.error?.message || 'Failed to deactivate card.')
    });
  }
}

