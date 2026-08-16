import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputComponent } from '../../shared/components/input.component';
import { SelectComponent } from '../../shared/components/select.component';
import { ButtonComponent } from '../../shared/components/button.component';
import { Resident } from '../../shared/interfaces/api.interfaces';

@Component({
  selector: 'app-resident-form',
  standalone: true,
  imports: [CommonModule, FormsModule, InputComponent, SelectComponent, ButtonComponent],
  template: `
    <form (ngSubmit)="onSubmit()" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <app-input label="First Name *" [value]="form.firstName" (valueChange)="form.firstName = $event" [error]="errors['firstName']" />
        <app-input label="Middle Name" [value]="form.middleName" (valueChange)="form.middleName = $event" />
        <app-input label="Last Name *" [value]="form.lastName" (valueChange)="form.lastName = $event" [error]="errors['lastName']" />
        <app-input label="Suffix" [value]="form.suffix" (valueChange)="form.suffix = $event" />
        <app-input label="Birth Date" type="date" [value]="form.birthDate" (valueChange)="form.birthDate = $event" />
        <app-input label="Birth Place" [value]="form.birthPlace" (valueChange)="form.birthPlace = $event" />
        <app-select label="Gender" [value]="form.gender" (valueChange)="form.gender = $event" [options]="genderOptions" placeholder="Select gender" />
        <app-select label="Civil Status" [value]="form.civilStatus" (valueChange)="form.civilStatus = $event" [options]="civilStatusOptions" placeholder="Select status" />
        <app-input label="Nationality" [value]="form.nationality" (valueChange)="form.nationality = $event" />
        <app-input label="Religion" [value]="form.religion" (valueChange)="form.religion = $event" />
        <app-input label="Occupation" [value]="form.occupation" (valueChange)="form.occupation = $event" />
        <app-input label="Blood Type" [value]="form.bloodType" (valueChange)="form.bloodType = $event" />
        <app-input label="Contact Number" [value]="form.contactNumber" (valueChange)="form.contactNumber = $event" />
        <app-input label="Email" type="email" [value]="form.email" (valueChange)="form.email = $event" [error]="errors['email']" />
      </div>

      <div class="border-t pt-4">
        <h4 class="text-sm font-bold text-gray-700 mb-3">Address</h4>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <app-input label="House Number" [value]="form.houseNumber" (valueChange)="form.houseNumber = $event" />
          <app-input label="Street" [value]="form.street" (valueChange)="form.street = $event" />
          <app-input label="Purok / Zone" [value]="form.purokZone" (valueChange)="form.purokZone = $event" />
          <app-input label="Sitio" [value]="form.sitio" (valueChange)="form.sitio = $event" />
          <app-input label="Municipality" [value]="form.municipality" (valueChange)="form.municipality = $event" />
          <app-input label="Province" [value]="form.province" (valueChange)="form.province = $event" />
          <app-input label="ZIP Code" [value]="form.zipCode" (valueChange)="form.zipCode = $event" />
        </div>
        <div class="mt-4">
          <app-input label="Full Address / Barangay Address Line *" [value]="form.addressLine" (valueChange)="form.addressLine = $event" [error]="errors['addressLine']" />
        </div>
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
export class ResidentFormComponent implements OnInit, OnChanges {
  @Input() resident: Resident | null = null;
  @Input() loading = false;
  @Output() onSave = new EventEmitter<any>();
  @Output() onCancel = new EventEmitter<void>();

  editMode = false;
  serverError = '';

  form = {
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    birthDate: '',
    birthPlace: '',
    gender: '',
    civilStatus: '',
    nationality: '',
    religion: '',
    occupation: '',
    bloodType: '',
    barangayId: 1,
    addressLine: '',
    houseNumber: '',
    street: '',
    purokZone: '',
    sitio: '',
    municipality: '',
    province: '',
    zipCode: '',
    contactNumber: '',
    email: ''
  };

  errors: Record<string, string> = {};

  genderOptions = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' }
  ];

  civilStatusOptions = [
    { value: 'Single', label: 'Single' },
    { value: 'Married', label: 'Married' },
    { value: 'Widowed', label: 'Widowed' },
    { value: 'Separated', label: 'Separated' },
    { value: 'Divorced', label: 'Divorced' }
  ];

  ngOnInit() {
    this.populateForm();
  }

  ngOnChanges() {
    this.populateForm();
  }

  populateForm() {
    if (this.resident) {
      this.editMode = true;
      this.form = {
        firstName: this.resident.first_name || '',
        middleName: this.resident.middle_name || '',
        lastName: this.resident.last_name || '',
        suffix: this.resident.suffix || '',
        birthDate: this.resident.birth_date ? this.resident.birth_date.split('T')[0] : '',
        birthPlace: this.resident.birth_place || '',
        gender: this.resident.gender || '',
        civilStatus: this.resident.civil_status || '',
        nationality: this.resident.nationality || '',
        religion: this.resident.religion || '',
        occupation: this.resident.occupation || '',
        bloodType: this.resident.blood_type || '',
        barangayId: this.resident.barangay_id || 1,
        addressLine: this.resident.address_line || '',
        houseNumber: this.resident.house_number || '',
        street: this.resident.street || '',
        purokZone: this.resident.purok_zone || '',
        sitio: this.resident.sitio || '',
        municipality: this.resident.municipality || '',
        province: this.resident.province || '',
        zipCode: this.resident.zip_code || '',
        contactNumber: this.resident.contact_number || '',
        email: this.resident.email || ''
      };
    }
  }

  validate(): boolean {
    this.errors = {};
    if (!this.form.firstName.trim()) this.errors['firstName'] = 'First name is required.';
    if (!this.form.lastName.trim()) this.errors['lastName'] = 'Last name is required.';
    if (!this.form.addressLine.trim()) this.errors['addressLine'] = 'Address is required.';
    if (this.form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email)) {
      this.errors['email'] = 'Invalid email format.';
    }
    return Object.keys(this.errors).length === 0;
  }

  onSubmit() {
    if (!this.validate()) return;
    this.serverError = '';
    this.onSave.emit({ ...this.form });
  }
}
