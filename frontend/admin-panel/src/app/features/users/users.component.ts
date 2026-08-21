import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { UserService } from '../../shared/services';
import { User } from '../../shared/interfaces/api.interfaces';
import { TableComponent, TableColumn } from '../../shared/components/table.component';
import { ButtonComponent } from '../../shared/components/button.component';
import { CardComponent } from '../../shared/components/card.component';
import { InputComponent } from '../../shared/components/input.component';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { UserFormComponent } from './user-form.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [TableComponent, ButtonComponent, CardComponent, InputComponent, PaginationComponent, ModalComponent, ConfirmDialogComponent, UserFormComponent, DatePipe],
  template: `
    <div>
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800">User Management</h1>
        <app-button variant="primary" (onClick)="openCreateForm()">+ Add User</app-button>
      </div>

      <app-card>
        <div class="mb-4">
          <app-input placeholder="Search users..." [value]="search()" (valueChange)="onSearch($event)" />
        </div>

        <app-table
          [columns]="columns"
          [data]="users()"
          [loading]="loading()"
          trackBy="user_id"
          emptyMessage="No users found"
          [selectedRow]="selectedRow()"
          [cellTemplates]="{ username: userCell, first_name: nameCell, status: statusCell }"
          (onRowClick)="onRowClick($event)"
        >
          <ng-template #userCell let-row="row">
            <span class="text-sm font-semibold text-slate-900">
              {{ row.username }}
            </span>
          </ng-template>
          <ng-template #nameCell let-row="row">
            <span class="text-sm font-semibold text-slate-900">
              {{ row.first_name }}
            </span>
          </ng-template>
          <ng-template #statusCell let-row="row">
            <span [class]="'px-2.5 py-1 rounded-full text-xs font-bold border ' + (row.status === 'Active' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200')">
              {{ row.status }}
            </span>
          </ng-template>
        </app-table>

        @if (total() > 0) {
          <app-pagination
            [total]="total()"
            [currentPage]="page()"
            [limit]="limit"
            itemLabel="users"
            (onPageChange)="onPageChange($event)"
            (onLimitChange)="onLimitChange($event)" />
        }
      </app-card>

      <!-- User Details Modal -->
      <app-modal [open]="showDetails()" title="User Details" (onClose)="closeDetails()">
        @if (selectedUser(); as usr) {
          <div class="space-y-4">
            <div class="flex items-center justify-between border-b pb-3">
              <div>
                <h3 class="text-lg font-bold text-gray-900">{{ usr.first_name }} {{ usr.last_name }}</h3>
                <p class="text-sm text-gray-500">Username: {{ usr.username }}</p>
              </div>
              <span [class]="'px-3 py-1 rounded-full text-xs font-semibold ' + (usr.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')">{{ usr.status }}</span>
            </div>

            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p class="text-xs uppercase tracking-wide text-gray-500">User ID</p>
                <p class="text-gray-800 font-medium">{{ usr.user_id }}</p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-wide text-gray-500">Role</p>
                <p class="text-gray-800 font-medium">{{ usr.role_name || '-' }}</p>
              </div>
              <div class="col-span-2">
                <p class="text-xs uppercase tracking-wide text-gray-500">Last Login</p>
                <p class="text-gray-800 font-medium">{{ usr.last_login ? (usr.last_login | date: 'medium') : 'Never logged in' }}</p>
              </div>
            </div>

            <div class="flex justify-end gap-3 border-t pt-4 mt-6">
              <app-button variant="danger" (onClick)="onDeleteClick(usr)">Delete</app-button>
              <app-button variant="primary" (onClick)="onEditClick(usr)">Edit</app-button>
            </div>
          </div>
        }
      </app-modal>

      <!-- Create/Edit Modal -->
      <app-modal [open]="showForm()" [title]="editingUser() ? 'Edit User' : 'Add User'" (onClose)="closeForm()">
        <app-user-form
          [user]="editingUser()"
          [loading]="saving()"
          (onSave)="onSave($event)"
          (onCancel)="closeForm()"
        />
      </app-modal>

      <!-- Delete Confirmation -->
      <app-confirm-dialog
        [open]="showDeleteConfirm()"
        title="Delete User"
        [message]="'Are you sure you want to delete ' + (deletingUser()?.username || '') + '?'"
        confirmText="Delete"
        variant="danger"
        (onCancel)="showDeleteConfirm.set(false)"
        (onConfirm)="confirmDelete()"
      />
    </div>
  `
})
export class UsersComponent implements OnInit {
  users = signal<User[]>([]);
  loading = signal(true);
  search = signal('');
  page = signal(1);
  limit = 10;
  total = signal(0);

  showDetails = signal(false);
  selectedUser = signal<User | null>(null);
  selectedRow = signal<User | null>(null);

  showForm = signal(false);
  editingUser = signal<User | null>(null);
  saving = signal(false);

  showDeleteConfirm = signal(false);
  deletingUser = signal<User | null>(null);

  columns: TableColumn[] = [
    { key: 'user_id', label: 'ID', sortable: true },
    { key: 'username', label: 'Username', sortable: true },
    { key: 'first_name', label: 'First Name', sortable: true },
    { key: 'last_name', label: 'Last Name', sortable: true },
    { key: 'role_name', label: 'Role' },
    { key: 'status', label: 'Status' },
    { key: 'last_login', label: 'Last Login' }
  ];

  constructor(private userService: UserService) {}

  ngOnInit() { this.loadUsers(); }

  loadUsers() {
    this.loading.set(true);
    this.userService.getAll({ search: this.search(), page: this.page(), limit: this.limit }).subscribe({
      next: (res) => { this.users.set(res.data); this.total.set(res.pagination.total); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onSearch(value: string) { this.search.set(value); this.page.set(1); this.loadUsers(); }
  onPageChange(page: number) { this.page.set(page); this.loadUsers(); }
  onLimitChange(limit: number) { this.limit = limit; this.page.set(1); this.loadUsers(); }

  onRowClick(user: User) {
    this.viewDetails(user);
  }

  viewDetails(user: User) {
    this.selectedRow.set(user);
    this.userService.getById(user.user_id).subscribe({
      next: (res) => {
        this.selectedUser.set(res.data);
        this.showDetails.set(true);
      },
      error: () => {
        this.selectedUser.set(user);
        this.showDetails.set(true);
      }
    });
  }

  closeDetails() {
    this.showDetails.set(false);
    this.selectedUser.set(null);
    this.selectedRow.set(null);
  }

  onEditClick(user: User) {
    this.editingUser.set(user);
    this.showForm.set(true);
    this.closeDetails();
  }

  onDeleteClick(user: User) {
    this.deletingUser.set(user);
    this.showDeleteConfirm.set(true);
    this.closeDetails();
  }

  openCreateForm() {
    this.editingUser.set(null);
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.editingUser.set(null);
    this.saving.set(false);
  }

  onSave(data: any) {
    this.saving.set(true);
    const request = this.editingUser()
      ? this.userService.update(this.editingUser()!.user_id, data)
      : this.userService.create(data);

    request.subscribe({
      next: () => { this.closeForm(); this.loadUsers(); },
      error: (err) => { this.saving.set(false); alert(err.error?.message || 'Failed to save user.'); }
    });
  }

  confirmDelete() {
    if (!this.deletingUser()) return;
    this.userService.delete(this.deletingUser()!.user_id).subscribe({
      next: () => { this.showDeleteConfirm.set(false); this.deletingUser.set(null); this.loadUsers(); },
      error: (err) => { alert(err.error?.message || 'Failed to delete user.'); }
    });
  }
}
