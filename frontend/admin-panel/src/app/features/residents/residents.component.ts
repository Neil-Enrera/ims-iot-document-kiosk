import { Component, OnInit, signal } from '@angular/core';
import { ResidentService } from '../../shared/services';
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
  imports: [TableComponent, ButtonComponent, CardComponent, InputComponent, PaginationComponent, ModalComponent, ConfirmDialogComponent, ResidentFormComponent],
  template: `
    <div>
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Residents</h1>
        <app-button variant="primary" (onClick)="openCreateForm()">+ Add Resident</app-button>
      </div>

      <app-card>
        <div class="mb-4">
          <app-input placeholder="Search residents..." [value]="search()" (valueChange)="onSearch($event)" />
        </div>

        <app-table
          [columns]="columns"
          [data]="residents()"
          [loading]="loading()"
          [sortColumn]="sortColumn()"
          [sortDirection]="sortDirection()"
          trackBy="resident_id"
          emptyMessage="No residents found"
          (onSort)="onSort($event)"
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

      <!-- Create/Edit Modal -->
      <app-modal [open]="showForm()" [title]="editingResident() ? 'Edit Resident' : 'Add Resident'" (onClose)="closeForm()">
        <app-resident-form
          [resident]="editingResident()"
          [loading]="saving()"
          (onSave)="onSave($event)"
          (onCancel)="closeForm()"
        />
      </app-modal>

      <!-- Delete Confirmation -->
      <app-confirm-dialog
        [open]="showDeleteConfirm()"
        title="Delete Resident"
        [message]="'Are you sure you want to delete ' + (deletingResident()?.first_name || '') + ' ' + (deletingResident()?.last_name || '') + '?'"
        confirmText="Delete"
        variant="danger"
        (onCancel)="showDeleteConfirm.set(false)"
        (onConfirm)="confirmDelete()"
      />
    </div>
  `
})
export class ResidentsComponent implements OnInit {
  residents = signal<Resident[]>([]);
  loading = signal(true);
  search = signal('');
  page = signal(1);
  limit = 20;
  total = signal(0);
  sortColumn = signal('resident_id');
  sortDirection = signal<'ASC' | 'DESC'>('DESC');

  showForm = signal(false);
  editingResident = signal<Resident | null>(null);
  saving = signal(false);

  showDeleteConfirm = signal(false);
  deletingResident = signal<Resident | null>(null);

  columns: TableColumn[] = [
    { key: 'resident_code', label: 'Code', sortable: true },
    { key: 'first_name', label: 'First Name', sortable: true },
    { key: 'last_name', label: 'Last Name', sortable: true },
    { key: 'gender', label: 'Gender' },
    { key: 'civil_status', label: 'Civil Status' },
    { key: 'contact_number', label: 'Contact' },
    { key: 'status', label: 'Status', sortable: true }
  ];

  constructor(private residentService: ResidentService) {}

  ngOnInit() {
    this.loadResidents();
  }

  loadResidents() {
    this.loading.set(true);
    this.residentService.getAll({
      search: this.search(),
      page: this.page(),
      limit: this.limit,
      sortBy: this.sortColumn(),
      sortOrder: this.sortDirection()
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

  confirmDelete() {
    if (!this.deletingResident()) return;
    this.residentService.delete(this.deletingResident()!.resident_id).subscribe({
      next: () => {
        this.showDeleteConfirm.set(false);
        this.deletingResident.set(null);
        this.loadResidents();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to delete resident.');
      }
    });
  }
}
