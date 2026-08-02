import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputComponent } from '../../shared/components/input.component';
import { ButtonComponent } from '../../shared/components/button.component';
import { Service, FormField } from '../../shared/interfaces/api.interfaces';

@Component({
  selector: 'app-service-form',
  standalone: true,
  imports: [CommonModule, FormsModule, InputComponent, ButtonComponent],
  template: `
    <form (ngSubmit)="onSubmit()" class="space-y-4">
      <app-input label="Service Name *" [value]="form.serviceName" (valueChange)="form.serviceName = $event" [error]="errors['serviceName']" />
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea [(ngModel)]="form.description" name="description" rows="2" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"></textarea>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <app-input label="Processing Fee" type="number" [value]="form.processingFee" (valueChange)="form.processingFee = $event" placeholder="0.00" />
        <app-input label="Processing Time" [value]="form.processingTime" (valueChange)="form.processingTime = $event" placeholder="e.g. 1-2 business days" />
      </div>

      <app-input label="Approval Workflow" [value]="form.approvalWorkflow" (valueChange)="form.approvalWorkflow = $event" placeholder="e.g. Review by Secretary, approve by Captain" />

      <div class="flex items-center gap-3">
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" [(ngModel)]="form.requiresPhoto" name="requiresPhoto" class="sr-only peer" />
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
        <span class="text-sm font-medium text-gray-700">Requires Photo Capture</span>
      </div>

      <!-- Requirements -->
      <div class="border rounded-lg p-3">
        <label class="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
        <p class="text-xs text-gray-500 mb-2">One requirement per line.</p>
        <textarea [(ngModel)]="form.requirementsText" name="requirementsText" rows="3" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300" placeholder="Valid Government ID&#10;Proof of Residency"></textarea>
      </div>

      <!-- Required Documents -->
      <div class="border rounded-lg p-3">
        <label class="block text-sm font-medium text-gray-700 mb-1">Required Documents</label>
        <p class="text-xs text-gray-500 mb-2">One document per line.</p>
        <textarea [(ngModel)]="form.requiredDocumentsText" name="requiredDocumentsText" rows="3" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300" placeholder="Valid Government ID&#10;Proof of Residency"></textarea>
      </div>

      <!-- Dynamic Form Fields -->
      <div class="border rounded-lg p-3 space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-gray-700">Form Fields</label>
          <button type="button" (click)="addField()" class="text-sm text-blue-600 hover:underline">+ Add Field</button>
        </div>
        @if (form.formFields.length === 0) {
          <p class="text-xs text-gray-500">No form fields defined. The kiosk will only collect standard info.</p>
        }
        @for (field of form.formFields; track $index) {
          <div class="border rounded p-2 space-y-2 bg-gray-50">
            <div class="grid grid-cols-6 gap-2">
              <div class="col-span-2">
                <input [(ngModel)]="field.key" [name]="'key' + $index" placeholder="key" class="w-full px-2 py-1 border rounded text-xs border-gray-300" />
              </div>
              <div class="col-span-2">
                <input [(ngModel)]="field.label" [name]="'label' + $index" placeholder="Label" class="w-full px-2 py-1 border rounded text-xs border-gray-300" />
              </div>
              <div class="col-span-2">
                <select [(ngModel)]="field.type" [name]="'type' + $index" class="w-full px-2 py-1 border rounded text-xs border-gray-300">
                  <option value="text">text</option>
                  <option value="textarea">textarea</option>
                  <option value="number">number</option>
                  <option value="date">date</option>
                  <option value="tel">tel</option>
                  <option value="email">email</option>
                  <option value="select">select</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-6 gap-2">
              <div class="col-span-2">
                <input [(ngModel)]="field.placeholder" [name]="'placeholder' + $index" placeholder="Placeholder" class="w-full px-2 py-1 border rounded text-xs border-gray-300" />
              </div>
              <div class="col-span-2 flex items-center gap-1">
                <input type="checkbox" [(ngModel)]="field.required" [name]="'required' + $index" />
                <label class="text-xs text-gray-600">Required</label>
              </div>
              <div class="col-span-2 flex items-center justify-end">
                <button type="button" (click)="removeField($index)" class="text-xs text-red-500 hover:underline">Remove</button>
              </div>
            </div>
            @if (field.type === 'select') {
              <div>
                <input [(ngModel)]="field.optionsText" [name]="'options' + $index" placeholder="Options separated by commas (Single, Married)" class="w-full px-2 py-1 border rounded text-xs border-gray-300" />
              </div>
            }
          </div>
        }
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
export class ServiceFormComponent implements OnChanges {
  @Input() service: Service | null = null;
  @Input() loading = false;
  @Output() onSave = new EventEmitter<any>();
  @Output() onCancel = new EventEmitter<void>();

  editMode = false;
  serverError = '';

  form = {
    serviceName: '',
    description: '',
    processingFee: '0',
    processingTime: '',
    approvalWorkflow: '',
    requiresPhoto: false,
    requirementsText: '',
    requiredDocumentsText: '',
    formFields: [] as (FormField & { optionsText?: string })[]
  };
  errors: Record<string, string> = {};

  ngOnChanges() {
    if (this.service) {
      this.editMode = true;
      this.form = {
        serviceName: this.service.service_name || '',
        description: this.service.description || '',
        processingFee: this.service.processing_fee?.toString() || '0',
        processingTime: this.service.processing_time || '',
        approvalWorkflow: this.service.approval_workflow || '',
        requiresPhoto: this.service.requires_photo || false,
        requirementsText: (this.service.requirements || []).join('\n'),
        requiredDocumentsText: (this.service.required_documents || []).join('\n'),
        formFields: (this.service.form_fields || []).map(f => ({ ...f, optionsText: (f.options || []).join(', ') }))
      };
    }
  }

  addField() {
    this.form.formFields.push({ key: '', label: '', type: 'text', required: true, options: [], optionsText: '' });
  }

  removeField(index: number) {
    this.form.formFields.splice(index, 1);
  }

  validate(): boolean {
    this.errors = {};
    if (!this.form.serviceName.trim()) this.errors['serviceName'] = 'Service name is required.';
    for (const f of this.form.formFields) {
      if (!f.key.trim() || !f.label.trim()) {
        this.errors['formFields'] = 'Every form field needs a key and a label.';
        break;
      }
    }
    return Object.keys(this.errors).length === 0;
  }

  onSubmit() {
    if (!this.validate()) return;
    this.serverError = '';
    const formFields = this.form.formFields.map(f => ({
      key: f.key.trim(),
      label: f.label.trim(),
      type: f.type,
      required: !!f.required,
      placeholder: f.placeholder?.trim() || undefined,
      options: f.type === 'select'
        ? (f.optionsText || '').split(',').map(s => s.trim()).filter(Boolean)
        : undefined
    }));
    this.onSave.emit({
      serviceName: this.form.serviceName.trim(),
      description: this.form.description.trim() || undefined,
      processingFee: parseFloat(this.form.processingFee) || 0,
      processingTime: this.form.processingTime.trim() || undefined,
      approvalWorkflow: this.form.approvalWorkflow.trim() || undefined,
      requiresPhoto: this.form.requiresPhoto,
      requirements: this.form.requirementsText.split('\n').map(s => s.trim()).filter(Boolean),
      requiredDocuments: this.form.requiredDocumentsText.split('\n').map(s => s.trim()).filter(Boolean),
      formFields
    });
  }
}
