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
        <app-input label="First Name *" [value]="form.firstName" (valueChange)="form.firstName = $event" filterType="name" maxlength="50" [error]="errors['firstName']" placeholder="First Name (letters only)" />
        <app-input label="Middle Name" [value]="form.middleName" (valueChange)="form.middleName = $event" filterType="name" maxlength="50" [error]="errors['middleName']" placeholder="Middle Name" />
        <app-input label="Last Name *" [value]="form.lastName" (valueChange)="form.lastName = $event" filterType="name" maxlength="50" [error]="errors['lastName']" placeholder="Last Name (letters only)" />
        <app-input label="Suffix" [value]="form.suffix" (valueChange)="form.suffix = $event" maxlength="20" placeholder="e.g. Jr., III" />
        <app-input label="Birth Date" type="date" [value]="form.birthDate" (valueChange)="form.birthDate = $event" [max]="todayDateString()" [error]="errors['birthDate']" />
        <app-input label="Birth Place" [value]="form.birthPlace" (valueChange)="form.birthPlace = $event" maxlength="100" placeholder="City / Municipality" />
        <app-select label="Gender" [value]="form.gender" (valueChange)="form.gender = $event" [options]="genderOptions" placeholder="Select gender" />
        <app-select label="Civil Status" [value]="form.civilStatus" (valueChange)="form.civilStatus = $event" [options]="civilStatusOptions" placeholder="Select status" />
        <app-input label="Nationality" [value]="form.nationality" (valueChange)="form.nationality = $event" filterType="name" maxlength="50" placeholder="Filipino" />
        <app-input label="Religion" [value]="form.religion" (valueChange)="form.religion = $event" maxlength="50" placeholder="Religion" />
        <app-input label="Occupation" [value]="form.occupation" (valueChange)="form.occupation = $event" maxlength="100" placeholder="Occupation" />
        <app-input label="Blood Type" [value]="form.bloodType" (valueChange)="form.bloodType = $event" maxlength="10" placeholder="e.g. O+, A+" />
        <app-input label="Contact Number" type="tel" [value]="form.contactNumber" (valueChange)="form.contactNumber = $event" filterType="phone" maxlength="11" [error]="errors['contactNumber']" placeholder="09XXXXXXXXX" />
        <app-input label="Email" type="email" [value]="form.email" (valueChange)="form.email = $event" maxlength="100" [error]="errors['email']" placeholder="resident@example.com" />
      </div>

      <div class="border-t pt-4">
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-sm font-bold text-slate-800">Address Information</h4>
          <button type="button" (click)="autoComposeAddress(true)" class="text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline transition-colors">
            Generate Complete Address
          </button>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <app-input label="Subdivision" [value]="form.subdivision" (valueChange)="updateAddressField('subdivision', $event)" maxlength="100" placeholder="e.g. San Manuel Subdivision" />
          <app-input label="Street" [value]="form.street" (valueChange)="updateAddressField('street', $event)" maxlength="100" placeholder="e.g. Mabini Street" />
          <app-input label="Block" [value]="form.block" (valueChange)="updateAddressField('block', $event)" maxlength="50" placeholder="e.g. 10" />
          <app-input label="Lot" [value]="form.lot" (valueChange)="updateAddressField('lot', $event)" maxlength="50" placeholder="e.g. 5" />
          <app-input label="House Number" [value]="form.houseNumber" (valueChange)="updateAddressField('houseNumber', $event)" maxlength="50" placeholder="House #" />
          <app-input label="Purok / Zone" [value]="form.purokZone" (valueChange)="updateAddressField('purokZone', $event)" maxlength="100" placeholder="Purok 1" />
          <app-input label="Sitio" [value]="form.sitio" (valueChange)="updateAddressField('sitio', $event)" maxlength="100" placeholder="Sitio" />
          <app-input label="Municipality" [value]="form.municipality" (valueChange)="updateAddressField('municipality', $event)" maxlength="100" placeholder="San Manuel" />
          <app-input label="Province" [value]="form.province" (valueChange)="updateAddressField('province', $event)" maxlength="100" placeholder="Tarlac" />
          <app-input label="ZIP Code" [value]="form.zipCode" (valueChange)="form.zipCode = $event" filterType="numeric" maxlength="10" placeholder="2301" />
        </div>
        <div class="mt-4">
          <app-input label="Full Address / Barangay Address Line *" [value]="form.addressLine" (valueChange)="form.addressLine = $event" maxlength="255" [error]="errors['addressLine']" placeholder="Complete resident address line" />
        </div>
      </div>

      @if (serverError) {
        <p class="text-sm font-semibold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">{{ serverError }}</p>
      }

      <div class="flex justify-end gap-3 pt-4 border-t">
        <app-button variant="secondary" (onClick)="onCancel.emit()">Cancel</app-button>
        <app-button variant="primary" type="submit" [loading]="loading">{{ editMode ? 'Update Resident' : 'Create Resident' }}</app-button>
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
    subdivision: '',
    block: '',
    lot: '',
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

  todayDateString(): string {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  }

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
        subdivision: this.resident.subdivision || '',
        block: this.resident.block || '',
        lot: this.resident.lot || '',
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

  updateAddressField(field: string, val: string) {
    (this.form as any)[field] = val;
    // If not in edit mode or address line is empty, auto-update address line
    if (!this.editMode || !this.form.addressLine.trim()) {
      this.autoComposeAddress();
    }
  }

  autoComposeAddress(force = false) {
    const rawParts = [
      this.form.block ? (this.form.block.toLowerCase().startsWith('blk') ? this.form.block : `Blk ${this.form.block}`) : null,
      this.form.lot ? (this.form.lot.toLowerCase().startsWith('lot') ? this.form.lot : `Lot ${this.form.lot}`) : null,
      this.form.houseNumber,
      this.form.street,
      this.form.subdivision,
      this.form.purokZone,
      this.form.sitio,
      this.form.municipality,
      this.form.province
    ].filter(x => !!x && String(x).trim() !== '');

    const uniqueParts: string[] = [];
    for (const part of rawParts) {
      if (part && !uniqueParts.some(p => p.toLowerCase() === String(part).toLowerCase())) {
        uniqueParts.push(part);
      }
    }

    if (uniqueParts.length > 0) {
      this.form.addressLine = uniqueParts.join(', ');
      if (this.errors['addressLine']) {
        delete this.errors['addressLine'];
      }
    }
  }

  validate(): boolean {
    this.errors = {};
    const nameRegex = /^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\-\.\']+$/;

    // First Name
    if (!this.form.firstName.trim()) {
      this.errors['firstName'] = 'First name is required.';
    } else if (this.form.firstName.trim().length < 2) {
      this.errors['firstName'] = 'First name must be at least 2 characters.';
    } else if (!nameRegex.test(this.form.firstName.trim())) {
      this.errors['firstName'] = 'First name must contain letters only.';
    }

    // Middle Name
    if (this.form.middleName && this.form.middleName.trim()) {
      if (!nameRegex.test(this.form.middleName.trim())) {
        this.errors['middleName'] = 'Middle name must contain letters only.';
      }
    }

    // Last Name
    if (!this.form.lastName.trim()) {
      this.errors['lastName'] = 'Last name is required.';
    } else if (this.form.lastName.trim().length < 2) {
      this.errors['lastName'] = 'Last name must be at least 2 characters.';
    } else if (!nameRegex.test(this.form.lastName.trim())) {
      this.errors['lastName'] = 'Last name must contain letters only.';
    }

    // Birth Date
    if (this.form.birthDate) {
      const birth = new Date(this.form.birthDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (isNaN(birth.getTime()) || birth > today || birth.getFullYear() < (today.getFullYear() - 125)) {
        this.errors['birthDate'] = 'Birth date must be a valid past date.';
      }
    }

    // Contact Number
    if (this.form.contactNumber && this.form.contactNumber.trim()) {
      const cleanPhone = this.form.contactNumber.trim().replace(/[\s\-()]/g, '');
      if (!/^(09\d{9}|\+639\d{9})$/.test(cleanPhone)) {
        this.errors['contactNumber'] = 'Contact number must be a valid 11-digit mobile number (e.g. 09123456789).';
      }
    }

    // Address Line
    if (!this.form.addressLine.trim()) {
      this.errors['addressLine'] = 'Address is required.';
    } else if (this.form.addressLine.trim().length < 5) {
      this.errors['addressLine'] = 'Address must be at least 5 characters.';
    }

    // Email
    if (this.form.email && this.form.email.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email.trim())) {
        this.errors['email'] = 'Invalid email format.';
      }
    }

    return Object.keys(this.errors).length === 0;
  }

  onSubmit() {
    if (!this.validate()) return;
    this.serverError = '';
    this.onSave.emit({ ...this.form });
  }
}

