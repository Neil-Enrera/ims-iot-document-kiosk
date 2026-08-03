import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputComponent } from '../../shared/components/input.component';
import { ButtonComponent } from '../../shared/components/button.component';
import { Service, FormField, FormFieldType } from '../../shared/interfaces/api.interfaces';
import { environment } from '../../../environments/environment';

interface EditableFormField extends FormField {
  optionsText?: string;
  validation: NonNullable<FormField['validation']>;
}

const FIELD_TYPES: { value: FormFieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'tel', label: 'Telephone' },
  { value: 'email', label: 'Email' },
  { value: 'select', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio' },
  { value: 'signature', label: 'Signature' },
  { value: 'photo', label: 'Photo Capture' },
  { value: 'file', label: 'File Upload' }
];

const OPTIONS_TYPES: FormFieldType[] = ['select', 'radio', 'checkbox'];
const TEXT_TYPES: FormFieldType[] = ['text', 'textarea', 'tel', 'email'];

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
        <span class="text-sm font-medium text-gray-700">Requires Photo Capture (global request photo step)</span>
      </div>

      <div class="flex items-center gap-3">
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" [(ngModel)]="form.isActive" name="isActive" class="sr-only peer" />
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
        </label>
        <span class="text-sm font-medium text-gray-700">Status (Active / Inactive)</span>
      </div>

      <!-- Official Document Template -->
      <div class="border rounded-lg p-3">
        <label class="block text-sm font-medium text-gray-700 mb-1">Official Document Template</label>
        <p class="text-xs text-gray-500 mb-2">
          Upload the official barangay document (PDF, DOCX, or image). It serves as the official reference —
          the resident application form below is built from the fields you configure. No automatic field detection is performed.
        </p>

        @if (templateFile) {
          <div class="flex items-center justify-between bg-blue-50 border border-blue-200 rounded p-2 mb-2">
            <div>
              <p class="text-sm font-medium text-blue-800">{{ templateFile.name }}</p>
              <p class="text-xs text-blue-600">{{ formatBytes(templateFile.size) }} — will be uploaded on save</p>
            </div>
            <button type="button" (click)="cancelPendingTemplate()" class="text-xs text-blue-600 hover:underline">Cancel</button>
          </div>
        } @else if (service?.template_path && !templateRemove) {
          <div class="flex items-center justify-between bg-gray-50 border rounded p-2 mb-2">
            <div class="flex items-center gap-3">
              @if (isTemplateImage()) {
                <img [src]="templatePreviewUrl()" alt="Template preview" class="h-16 w-12 object-cover rounded border" />
              }
              <div>
                <p class="text-sm font-medium text-gray-800">{{ service!.template_original_name }}</p>
                <p class="text-xs text-gray-500">{{ formatBytes(service!.template_size) }} · {{ service!.template_mime }}</p>
                <a [href]="templatePreviewUrl()" target="_blank" rel="noopener" class="text-xs text-blue-600 hover:underline">View template</a>
              </div>
            </div>
            <button type="button" (click)="removeCurrentTemplate()" class="text-xs text-red-500 hover:underline">Remove</button>
          </div>
        } @else if (templateRemove) {
          <div class="flex items-center justify-between bg-red-50 border border-red-200 rounded p-2 mb-2">
            <p class="text-sm text-red-700">Current template will be removed on save.</p>
            <button type="button" (click)="cancelRemoveTemplate()" class="text-xs text-red-600 hover:underline">Undo</button>
          </div>
        } @else {
          <p class="text-xs text-gray-400 mb-2">No template uploaded yet.</p>
        }

        <input
          type="file"
          (change)="onTemplateChange($event)"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          class="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
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
          <label class="text-sm font-medium text-gray-700">Application Form Fields</label>
          <button type="button" (click)="addField()" class="text-sm text-blue-600 hover:underline">+ Add Field</button>
        </div>
        <p class="text-xs text-gray-500">Configure the fields from the official template that residents must complete.</p>
        @if (errors['formFields']) {
          <p class="text-xs text-red-500">{{ errors['formFields'] }}</p>
        }
        @if (form.formFields.length === 0) {
          <p class="text-xs text-gray-500">No form fields defined. The kiosk will only collect standard info.</p>
        }
        @for (field of form.formFields; track $index) {
          <div class="border rounded p-2 space-y-2 bg-gray-50">
            <div class="grid grid-cols-12 gap-2 items-center">
              <div class="col-span-5">
                <input [(ngModel)]="field.label" [name]="'label' + $index" placeholder="Label" class="w-full px-2 py-1 border rounded text-xs border-gray-300" />
              </div>
              <div class="col-span-4">
                <input [(ngModel)]="field.key" [name]="'key' + $index" placeholder="key" class="w-full px-2 py-1 border rounded text-xs border-gray-300" />
              </div>
              <div class="col-span-3">
                <select [(ngModel)]="field.type" [name]="'type' + $index" class="w-full px-2 py-1 border rounded text-xs border-gray-300">
                  @for (t of FIELD_TYPES; track t.value) {
                    <option [value]="t.value">{{ t.label }}</option>
                  }
                </select>
              </div>
            </div>
            <div class="grid grid-cols-12 gap-2 items-center">
              <div class="col-span-6">
                <input [(ngModel)]="field.placeholder" [name]="'placeholder' + $index" placeholder="Placeholder" class="w-full px-2 py-1 border rounded text-xs border-gray-300" />
              </div>
              <div class="col-span-6">
                <input [(ngModel)]="field.helperText" [name]="'helper' + $index" placeholder="Helper text (optional)" class="w-full px-2 py-1 border rounded text-xs border-gray-300" />
              </div>
            </div>
            @if (isOptionsType(field.type)) {
              <div>
                <input [(ngModel)]="field.optionsText" [name]="'options' + $index" placeholder="Options separated by commas (Single, Married)" class="w-full px-2 py-1 border rounded text-xs border-gray-300" />
              </div>
            }
            @if (isTextType(field.type)) {
              <div class="grid grid-cols-4 gap-2">
                <input [(ngModel)]="field.validation.minLength" [name]="'minLen' + $index" type="number" placeholder="Min length" class="w-full px-2 py-1 border rounded text-xs border-gray-300" />
                <input [(ngModel)]="field.validation.maxLength" [name]="'maxLen' + $index" type="number" placeholder="Max length" class="w-full px-2 py-1 border rounded text-xs border-gray-300" />
                <input [(ngModel)]="field.validation.pattern" [name]="'pattern' + $index" placeholder="Pattern (regex)" class="w-full px-2 py-1 border rounded text-xs border-gray-300" />
                <input [(ngModel)]="field.validation.patternMessage" [name]="'patternMsg' + $index" placeholder="Pattern error msg" class="w-full px-2 py-1 border rounded text-xs border-gray-300" />
              </div>
            }
            @if (field.type === 'number') {
              <div class="grid grid-cols-2 gap-2">
                <input [(ngModel)]="field.validation.min" [name]="'min' + $index" type="number" placeholder="Min value" class="w-full px-2 py-1 border rounded text-xs border-gray-300" />
                <input [(ngModel)]="field.validation.max" [name]="'max' + $index" type="number" placeholder="Max value" class="w-full px-2 py-1 border rounded text-xs border-gray-300" />
              </div>
            }
            @if (field.type === 'file') {
              <div class="grid grid-cols-2 gap-2">
                <input [(ngModel)]="field.accept" [name]="'accept' + $index" placeholder="Accept (e.g. .pdf,.jpg)" class="w-full px-2 py-1 border rounded text-xs border-gray-300" />
                <input [(ngModel)]="field.maxSize" [name]="'maxSize' + $index" type="number" placeholder="Max size (MB)" class="w-full px-2 py-1 border rounded text-xs border-gray-300" />
              </div>
            }
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <label class="flex items-center gap-1 text-xs text-gray-600">
                  <input type="checkbox" [(ngModel)]="field.required" [name]="'required' + $index" />
                  Required
                </label>
              </div>
              <div class="flex items-center gap-2">
                <button type="button" (click)="moveField($index, -1)" class="text-xs text-gray-500 hover:text-gray-700" title="Move up">&uarr;</button>
                <button type="button" (click)="moveField($index, 1)" class="text-xs text-gray-500 hover:text-gray-700" title="Move down">&darr;</button>
                <button type="button" (click)="removeField($index)" class="text-xs text-red-500 hover:underline">Remove</button>
              </div>
            </div>
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

  FIELD_TYPES = FIELD_TYPES;

  editMode = false;
  serverError = '';

  form = {
    serviceName: '',
    description: '',
    processingFee: '0',
    processingTime: '',
    approvalWorkflow: '',
    requiresPhoto: false,
    isActive: true,
    requirementsText: '',
    requiredDocumentsText: '',
    formFields: [] as EditableFormField[]
  };
  errors: Record<string, string> = {};

  templateFile: File | null = null;
  templateRemove = false;

  private readonly assetBase = environment.apiUrl.replace(/\/api\/v1$/, '');

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
        isActive: !!this.service.is_active,
        requirementsText: (this.service.requirements || []).join('\n'),
        requiredDocumentsText: (this.service.required_documents || []).join('\n'),
        formFields: (this.service.form_fields || []).map(f => ({
          ...f,
          optionsText: (f.options || []).join(', '),
          validation: f.validation ? { ...f.validation } : {},
          maxSize: f.type === 'file' && f.maxSize ? f.maxSize / (1024 * 1024) : undefined
        }))
      };
    }
    this.templateFile = null;
    this.templateRemove = false;
  }

  // ---- Template helpers ----
  templatePreviewUrl(): string {
    return this.service?.template_path ? `${this.assetBase}/uploads/${this.service.template_path}` : '';
  }

  isTemplateImage(): boolean {
    return !!this.service?.template_mime?.startsWith('image/');
  }

  formatBytes(bytes: number | null | undefined): string {
    if (!bytes) return '0 B';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  }

  onTemplateChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.templateFile = input.files[0];
      this.templateRemove = false;
    }
  }

  cancelPendingTemplate() {
    this.templateFile = null;
  }

  removeCurrentTemplate() {
    this.templateRemove = true;
  }

  cancelRemoveTemplate() {
    this.templateRemove = false;
  }

  // ---- Field builder helpers ----
  addField() {
    this.form.formFields.push({
      key: '', label: '', type: 'text', required: true, options: [], optionsText: '', placeholder: '', validation: {}
    });
  }

  removeField(index: number) {
    this.form.formFields.splice(index, 1);
  }

  moveField(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= this.form.formFields.length) return;
    const arr = this.form.formFields;
    const tmp = arr[index];
    arr[index] = arr[target];
    arr[target] = tmp;
  }

  isOptionsType(type: FormFieldType): boolean {
    return OPTIONS_TYPES.includes(type);
  }

  isTextType(type: FormFieldType): boolean {
    return TEXT_TYPES.includes(type);
  }

  validate(): boolean {
    this.errors = {};
    if (!this.form.serviceName.trim()) this.errors['serviceName'] = 'Service name is required.';
    for (const f of this.form.formFields) {
      if (!f.key.trim() || !f.label.trim()) {
        this.errors['formFields'] = 'Every form field needs a key and a label.';
        break;
      }
      if (OPTIONS_TYPES.includes(f.type) && !(f.optionsText || '').trim()) {
        this.errors['formFields'] = `Field "${f.label}" needs at least one option.`;
        break;
      }
    }
    return Object.keys(this.errors).length === 0;
  }

  onSubmit() {
    if (!this.validate()) return;
    this.serverError = '';
    const formFields: FormField[] = this.form.formFields.map(f => {
      const base: FormField = {
        key: f.key.trim(),
        label: f.label.trim(),
        type: f.type,
        required: !!f.required,
        placeholder: f.placeholder?.trim() || undefined,
        helperText: f.helperText?.trim() || undefined,
        defaultValue: f.defaultValue?.trim() || undefined
      };
      if (OPTIONS_TYPES.includes(f.type)) {
        base.options = (f.optionsText || '').split(',').map(s => s.trim()).filter(Boolean);
      }
      const validation: NonNullable<FormField['validation']> = {};
      if (f.validation.min !== undefined && f.validation.min !== null && !isNaN(Number(f.validation.min))) validation.min = Number(f.validation.min);
      if (f.validation.max !== undefined && f.validation.max !== null && !isNaN(Number(f.validation.max))) validation.max = Number(f.validation.max);
      if (f.validation.minLength) validation.minLength = Number(f.validation.minLength);
      if (f.validation.maxLength) validation.maxLength = Number(f.validation.maxLength);
      if (f.validation.pattern?.trim()) validation.pattern = f.validation.pattern.trim();
      if (f.validation.patternMessage?.trim()) validation.patternMessage = f.validation.patternMessage.trim();
      if (Object.keys(validation).length) base.validation = validation;
      if (f.type === 'file') {
        base.accept = f.accept?.trim() || undefined;
        if (f.maxSize) base.maxSize = Number(f.maxSize) * 1024 * 1024;
      }
      return base;
    });

    this.onSave.emit({
      serviceName: this.form.serviceName.trim(),
      description: this.form.description.trim() || undefined,
      processingFee: parseFloat(this.form.processingFee) || 0,
      processingTime: this.form.processingTime.trim() || undefined,
      approvalWorkflow: this.form.approvalWorkflow.trim() || undefined,
      requiresPhoto: this.form.requiresPhoto,
      isActive: this.form.isActive,
      requirements: this.form.requirementsText.split('\n').map(s => s.trim()).filter(Boolean),
      requiredDocuments: this.form.requiredDocumentsText.split('\n').map(s => s.trim()).filter(Boolean),
      formFields,
      templateFile: this.templateFile,
      templateRemove: this.templateRemove
    });
  }
}
