import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputComponent } from '../../shared/components/input.component';
import { SelectComponent } from '../../shared/components/select.component';
import { ButtonComponent } from '../../shared/components/button.component';
import { User } from '../../shared/interfaces/api.interfaces';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule, InputComponent, SelectComponent, ButtonComponent],
  template: `
    <form (ngSubmit)="onSubmit()" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <app-input label="Username *" [value]="form.username" (valueChange)="form.username = $event" [error]="errors['username']" [disabled]="editMode" />
        @if (!editMode) {
          <app-input label="Password *" type="password" [value]="form.password" (valueChange)="form.password = $event" [error]="errors['password']" />
        }
        <app-select label="Role *" [value]="form.roleId" (valueChange)="form.roleId = $event" [options]="roleOptions" placeholder="Select role" [error]="errors['roleId']" />
        <app-input label="First Name *" [value]="form.firstName" (valueChange)="form.firstName = $event" [error]="errors['firstName']" />
        <app-input label="Middle Name" [value]="form.middleName" (valueChange)="form.middleName = $event" />
        <app-input label="Last Name *" [value]="form.lastName" (valueChange)="form.lastName = $event" [error]="errors['lastName']" />
        <app-input label="Email" type="email" [value]="form.email" (valueChange)="form.email = $event" [error]="errors['email']" />
        <app-input label="Contact Number" [value]="form.contactNumber" (valueChange)="form.contactNumber = $event" />
      </div>

      @if (serverError) {
        <p class="text-sm text-red-500">{{ serverError }}</p>
      }

      <div class="flex justify-end gap-3 pt-4 border-t">
        <app-button variant="secondary" (onClick)="onCancel.emit()">Cancel</app-button>
        <app-button variant="primary" type="submit" [loading]="loading">{{ editMode ? 'Update' : 'Create' }}</app-button>
      </div>
    </form>
  `
})
export class UserFormComponent implements OnChanges {
  @Input() user: User | null = null;
  @Input() loading = false;
  @Output() onSave = new EventEmitter<any>();
  @Output() onCancel = new EventEmitter<void>();

  editMode = false;
  serverError = '';

  form = { username: '', password: '', roleId: '', firstName: '', middleName: '', lastName: '', email: '', contactNumber: '' };
  errors: Record<string, string> = {};

  roleOptions = [
    { value: '1', label: 'Administrator' },
    { value: '2', label: 'Barangay Secretary' },
    { value: '3', label: 'Barangay Captain' }
  ];

  ngOnChanges() {
    if (this.user) {
      this.editMode = true;
      this.form = {
        username: this.user.username || '',
        password: '',
        roleId: this.user.role_id?.toString() || '',
        firstName: this.user.first_name || '',
        middleName: this.user.middle_name || '',
        lastName: this.user.last_name || '',
        email: this.user.email || '',
        contactNumber: this.user.contact_number || ''
      };
    }
  }

  validate(): boolean {
    this.errors = {};
    if (!this.form.username.trim()) this.errors['username'] = 'Username is required.';
    if (!this.editMode && !this.form.password) this.errors['password'] = 'Password is required.';
    if (!this.form.roleId) this.errors['roleId'] = 'Role is required.';
    if (!this.form.firstName.trim()) this.errors['firstName'] = 'First name is required.';
    if (!this.form.lastName.trim()) this.errors['lastName'] = 'Last name is required.';
    if (this.form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email)) {
      this.errors['email'] = 'Invalid email format.';
    }
    return Object.keys(this.errors).length === 0;
  }

  onSubmit() {
    if (!this.validate()) return;
    this.serverError = '';
    const data: any = {
      roleId: parseInt(this.form.roleId, 10),
      firstName: this.form.firstName.trim(),
      middleName: this.form.middleName.trim() || undefined,
      lastName: this.form.lastName.trim(),
      email: this.form.email.trim() || undefined,
      contactNumber: this.form.contactNumber.trim() || undefined
    };
    if (!this.editMode) {
      data.username = this.form.username.trim();
      data.password = this.form.password;
    }
    this.onSave.emit(data);
  }
}
