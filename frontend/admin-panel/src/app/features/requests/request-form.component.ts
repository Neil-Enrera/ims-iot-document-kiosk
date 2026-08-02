import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputComponent } from '../../shared/components/input.component';
import { SelectComponent } from '../../shared/components/select.component';
import { ButtonComponent } from '../../shared/components/button.component';
import { ResidentService, ServiceService } from '../../shared/services';
import { Resident, Service } from '../../shared/interfaces/api.interfaces';

@Component({
  selector: 'app-request-form',
  standalone: true,
  imports: [CommonModule, FormsModule, InputComponent, SelectComponent, ButtonComponent],
  template: `
    <form (ngSubmit)="onSubmit()" class="space-y-4">
      <div class="space-y-4">
        <app-select
          label="Resident *"
          [value]="form.residentId"
          (valueChange)="form.residentId = $event"
          [options]="residentOptions"
          placeholder="Select resident"
          [error]="errors['residentId']"
        />
        <app-select
          label="Service *"
          [value]="form.serviceId"
          (valueChange)="form.serviceId = $event"
          [options]="serviceOptions"
          placeholder="Select service"
          [error]="errors['serviceId']"
        />
        <app-input label="Purpose" [value]="form.purpose" (valueChange)="form.purpose = $event" placeholder="Purpose of request" />
      </div>

      @if (serverError) {
        <p class="text-sm text-red-500">{{ serverError }}</p>
      }

      <div class="flex justify-end gap-3 pt-4 border-t">
        <app-button variant="secondary" (onClick)="onCancel.emit()">Cancel</app-button>
        <app-button variant="primary" type="submit" [loading]="loading">Submit Request</app-button>
      </div>
    </form>
  `
})
export class RequestFormComponent implements OnInit {
  @Input() loading = false;
  @Output() onSave = new EventEmitter<any>();
  @Output() onCancel = new EventEmitter<void>();

  serverError = '';

  form = {
    residentId: '',
    serviceId: '',
    purpose: ''
  };

  errors: Record<string, string> = {};

  residentOptions: { value: string; label: string }[] = [];
  serviceOptions: { value: string; label: string }[] = [];

  constructor(
    private residentService: ResidentService,
    private serviceService: ServiceService
  ) {}

  ngOnInit() {
    this.loadResidents();
    this.loadServices();
  }

  loadResidents() {
    this.residentService.getAll({ limit: 100 }).subscribe({
      next: (res) => {
        this.residentOptions = res.data.map(r => ({
          value: r.resident_id.toString(),
          label: `${r.first_name} ${r.last_name} (${r.resident_code})`
        }));
      }
    });
  }

  loadServices() {
    this.serviceService.getAll({ limit: 100 }).subscribe({
      next: (res) => {
        this.serviceOptions = res.data.map(s => ({
          value: s.service_id.toString(),
          label: `${s.service_name} - ₱${s.processing_fee}`
        }));
      }
    });
  }

  validate(): boolean {
    this.errors = {};
    if (!this.form.residentId) this.errors['residentId'] = 'Resident is required.';
    if (!this.form.serviceId) this.errors['serviceId'] = 'Service is required.';
    return Object.keys(this.errors).length === 0;
  }

  onSubmit() {
    if (!this.validate()) return;
    this.serverError = '';
    this.onSave.emit({
      residentId: parseInt(this.form.residentId, 10),
      serviceId: parseInt(this.form.serviceId, 10),
      purpose: this.form.purpose || undefined
    });
  }
}
