import { Component, OnInit, signal } from '@angular/core';
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
  imports: [TableComponent, ButtonComponent, CardComponent, InputComponent, PaginationComponent, ModalComponent, ConfirmDialogComponent, UserFormComponent],
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
          emptyMessage="No users found" />

        @if (total() > limit) {
          <app-pagination
            [total]="total()"
            [currentPage]="page()"
            [limit]="limit"
            (onPageChange)="onPageChange($event)" />
        }
      </app-card>

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
  limit = 20;
  total = signal(0);

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
