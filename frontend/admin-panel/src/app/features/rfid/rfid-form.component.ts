import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputComponent } from '../../shared/components/input.component';
import { SelectComponent } from '../../shared/components/select.component';
import { ButtonComponent } from '../../shared/components/button.component';
import { ResidentService } from '../../shared/services';
import { Resident } from '../../shared/interfaces/api.interfaces';

@Component({
  selector: 'app-rfid-form',
  standalone: true,
  imports: [CommonModule, FormsModule, InputComponent, SelectComponent, ButtonComponent],
  template: `
    <form (ngSubmit)="onSubmit()" class="space-y-4">
      <app-input label="Card UID *" [value]="form.cardUid" (valueChange)="form.cardUid = $event" [error]="errors['cardUid']" placeholder="Enter RFID card UID" />
      <app-select
        label="Resident *"
        [value]="form.residentId"
        (valueChange)="form.residentId = $event"
        [options]="residentOptions"
        placeholder="Select resident"
        [error]="errors['residentId']"
      />
      <app-input label="Expiration Date" type="date" [value]="form.expirationDate" (valueChange)="form.expirationDate = $event" />

      @if (serverError) {
        <p class="text-sm text-red-500">{{ serverError }}</p>
      }

      <div class="flex justify-end gap-3 pt-4 border-t">
        <app-button variant="secondary" (onClick)="onCancel.emit()">Cancel</app-button>
        <app-button variant="primary" type="submit" [loading]="loading">Register Card</app-button>
      </div>
    </form>
  `
})
export class RfidFormComponent implements OnInit {
  @Input() loading = false;
  @Input() set initialResidentId(id: number | null | undefined) {
    if (id) {
      this.form.residentId = id.toString();
    }
  }
  @Output() onSave = new EventEmitter<any>();
  @Output() onCancel = new EventEmitter<void>();

  serverError = '';
  form = { cardUid: '', residentId: '', expirationDate: '' };
  errors: Record<string, string> = {};
  residentOptions: { value: string; label: string }[] = [];

  constructor(private residentService: ResidentService) {}

  ngOnInit() {
    this.residentService.getAll({ limit: 100 }).subscribe({
      next: (res) => {
        this.residentOptions = res.data.map(r => ({
          value: r.resident_id.toString(),
          label: `${r.first_name} ${r.last_name} (${r.resident_code})`
        }));
      }
    });
  }

  validate(): boolean {
    this.errors = {};
    if (!this.form.cardUid.trim()) this.errors['cardUid'] = 'Card UID is required.';
    if (!this.form.residentId) this.errors['residentId'] = 'Resident is required.';
    return Object.keys(this.errors).length === 0;
  }

  onSubmit() {
    if (!this.validate()) return;
    this.serverError = '';
    this.onSave.emit({
      cardUid: this.form.cardUid.trim(),
      residentId: parseInt(this.form.residentId, 10),
      expirationDate: this.form.expirationDate || undefined
    });
  }
}
