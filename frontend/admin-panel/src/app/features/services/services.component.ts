import { Component, OnInit, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ServiceService } from '../../shared/services';
import { Service } from '../../shared/interfaces/api.interfaces';
import { TableComponent, TableColumn } from '../../shared/components/table.component';
import { ButtonComponent } from '../../shared/components/button.component';
import { CardComponent } from '../../shared/components/card.component';
import { InputComponent } from '../../shared/components/input.component';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { ServiceFormComponent } from './service-form.component';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [TableComponent, ButtonComponent, CardComponent, InputComponent, PaginationComponent, ModalComponent, ConfirmDialogComponent, ServiceFormComponent],
  template: `
    <div>
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Services</h1>
        <app-button variant="primary" (onClick)="openCreateForm()">+ Add Service</app-button>
      </div>

      <app-card>
        <div class="mb-4">
          <app-input placeholder="Search services..." [value]="search()" (valueChange)="onSearch($event)" />
        </div>

        <app-table
          [columns]="columns"
          [data]="services()"
          [loading]="loading()"
          trackBy="service_id"
          emptyMessage="No services found"
          [cellTemplates]="{ service_name: nameCell, is_active: activeCell }"
          [rowActionsTemplate]="rowActions"
          (onRowClick)="openEditForm($event)">
          <ng-template #nameCell let-row="row">
            <span class="text-sm font-semibold text-slate-900">
              {{ row.service_name }}
            </span>
          </ng-template>
          <ng-template #activeCell let-value>
            <span
              [class]="value ? 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200' : 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200'">
              {{ value ? 'Active' : 'Inactive' }}
            </span>
          </ng-template>
          <ng-template #rowActions let-service>
            <div class="flex justify-end gap-3">
              <button
                type="button"
                (click)="openEditForm(service); $event.stopPropagation()"
                class="text-orange-600 hover:text-orange-800 font-semibold text-sm transition">Edit</button>
              <button
                type="button"
                (click)="openDeleteConfirm(service); $event.stopPropagation()"
                class="text-rose-600 hover:text-rose-800 font-semibold text-sm transition">Delete</button>
            </div>
          </ng-template>
        </app-table>

        @if (total() > 0) {
          <app-pagination
            [total]="total()"
            [currentPage]="page()"
            [limit]="limit"
            itemLabel="services"
            (onPageChange)="onPageChange($event)"
            (onLimitChange)="onLimitChange($event)" />
        }
      </app-card>

      <!-- Create/Edit Modal -->
      <app-modal [open]="showForm()" [title]="editingService() ? 'Edit Service' : 'Add Service'" (onClose)="closeForm()">
        <app-service-form
          [service]="editingService()"
          [loading]="saving()"
          (onSave)="onSave($event)"
          (onCancel)="closeForm()"
        />
      </app-modal>

      <!-- Delete Confirmation -->
      <app-confirm-dialog
        [open]="showDeleteConfirm()"
        title="Delete Service"
        [message]="'Are you sure you want to delete ' + (deletingService()?.service_name || '') + '?'"
        confirmText="Delete"
        variant="danger"
        (onCancel)="showDeleteConfirm.set(false)"
        (onConfirm)="confirmDelete()"
      />
    </div>
  `
})
export class ServicesComponent implements OnInit {
  services = signal<Service[]>([]);
  loading = signal(true);
  search = signal('');
  page = signal(1);
  limit = 20;
  total = signal(0);

  showForm = signal(false);
  editingService = signal<Service | null>(null);
  saving = signal(false);

  showDeleteConfirm = signal(false);
  deletingService = signal<Service | null>(null);

  columns: TableColumn[] = [
    { key: 'service_name', label: 'Service Name', sortable: true },
    { key: 'description', label: 'Description' },
    { key: 'processing_fee', label: 'Fee', align: 'right', sortable: true },
    { key: 'requires_photo', label: 'Photo Required' },
    { key: 'is_active', label: 'Status' }
  ];

  constructor(private serviceService: ServiceService) {}

  ngOnInit() { this.loadServices(); }

  loadServices() {
    this.loading.set(true);
    this.serviceService.getAll({ search: this.search(), page: this.page(), limit: this.limit }).subscribe({
      next: (res) => { this.services.set(res.data); this.total.set(res.pagination.total); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onSearch(value: string) { this.search.set(value); this.page.set(1); this.loadServices(); }
  onPageChange(page: number) { this.page.set(page); this.loadServices(); }
  onLimitChange(limit: number) { this.limit = limit; this.page.set(1); this.loadServices(); }

  openCreateForm() {
    this.editingService.set(null);
    this.showForm.set(true);
  }

  openEditForm(service: Service) {
    this.editingService.set(service);
    this.showForm.set(true);
  }

  openDeleteConfirm(service: Service) {
    this.deletingService.set(service);
    this.showDeleteConfirm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.editingService.set(null);
    this.saving.set(false);
  }

  onSave(data: any) {
    this.saving.set(true);
    const request = this.editingService()
      ? this.serviceService.update(this.editingService()!.service_id, data)
      : this.serviceService.create(data);

    request.subscribe({
      next: (res) => {
        const serviceId = res.data.service_id;
        this.handleTemplate(serviceId, data).subscribe({
          next: () => { this.closeForm(); this.loadServices(); },
          error: (err) => {
            this.saving.set(false);
            alert(err.error?.message || 'Service saved, but the template could not be uploaded.');
          }
        });
      },
      error: (err) => { this.saving.set(false); alert(err.error?.message || 'Failed to save service.'); }
    });
  }

  private handleTemplate(serviceId: number, data: any): Observable<any> {
    if (data.templateFile) {
      return this.serviceService.uploadTemplate(serviceId, data.templateFile);
    }
    if (data.templateRemove) {
      return this.serviceService.removeTemplate(serviceId);
    }
    return of(null);
  }

  confirmDelete() {
    if (!this.deletingService()) return;
    this.serviceService.delete(this.deletingService()!.service_id).subscribe({
      next: () => { this.showDeleteConfirm.set(false); this.deletingService.set(null); this.loadServices(); },
      error: (err) => { alert(err.error?.message || 'Failed to delete service.'); }
    });
  }
}
