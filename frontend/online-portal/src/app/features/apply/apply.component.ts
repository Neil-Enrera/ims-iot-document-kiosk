import { Component, OnInit, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import {
  PortalService,
  Service,
  UploadedRequirement,
  FormField,
  ApiResponse
} from '../../core/services/portal.service';
import { AuthService, PortalAccount } from '../../core/services/auth.service';
import { IdPhotoValidatorService } from '../../core/services/id-photo-validator.service';
import { environment } from '../../../environments/environment';

export interface UploadedReceipt {
  file_url: string;
  file_name: string;
  original_name: string;
  size?: number;
  mime_type?: string;
  reference_number?: string;
  uploaded_at?: string;
}

@Component({
  selector: 'portal-apply',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8">

      <!-- Breadcrumb / Back Link -->
      <div class="mb-6 flex items-center justify-between">
        <a routerLink="/services" class="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-500 hover:text-orange-600 transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          <span>Back to Services</span>
        </a>

        @if (selectedService(); as svc) {
          <span class="text-xs font-semibold text-slate-500">
            Resident ID: <strong class="text-slate-700">{{ auth.currentUser()?.resident_code || auth.currentUser()?.account_id }}</strong>
          </span>
        }
      </div>

      <!-- Loading State -->
      @if (loadingService()) {
        <div class="rounded-3xl border border-slate-200 bg-white p-8 animate-pulse space-y-4">
          <div class="h-6 w-48 bg-slate-200 rounded-lg"></div>
          <div class="h-10 w-3/4 bg-slate-100 rounded-xl"></div>
          <div class="h-32 bg-slate-100 rounded-2xl"></div>
        </div>
      } @else if (!selectedService()) {
        <div class="rounded-3xl border border-slate-200 bg-white p-8 text-center">
          <p class="text-lg font-bold text-slate-800">No service selected</p>
          <p class="text-sm text-slate-500 mt-1">Please select a service from the Available Services page first.</p>
          <a routerLink="/services"
             class="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-sm transition">
            Go to Services
          </a>
        </div>
      } @else {
        @let svc = selectedService()!;

        <!-- Selected Service Banner -->
        <div class="rounded-3xl border border-orange-200 bg-orange-50/70 p-6 sm:p-7 shadow-xs mb-8">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-orange-100 text-orange-800">
                Online Document Request
              </span>
              <h1 class="text-2xl sm:text-3xl font-black text-[#0f172a] mt-1.5 uppercase tracking-tight">
                {{ svc.service_name }}
              </h1>
              @if (svc.description) {
                <p class="text-slate-600 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
                  {{ svc.description }}
                </p>
              }
            </div>

            <div class="sm:text-right shrink-0">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Processing Fee</span>
              <span class="text-2xl font-black text-orange-600 mt-0.5 block">
                @if (isPaidService()) {
                  ₱{{ svc.processing_fee | number:'1.2-2' }}
                } @else {
                  FREE
                }
              </span>
            </div>
          </div>
        </div>

        <!-- Wizard Progress Bar (Steps 1 to 4) -->
        @if (wizardStep() <= 4) {
          <div class="mb-8">
            <div class="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2">
              <span [class.text-orange-600]="wizardStep() >= 1" [class.text-slate-400]="wizardStep() < 1">
                1. Application Form
              </span>
              <span [class.text-orange-600]="wizardStep() >= 2" [class.text-slate-400]="wizardStep() < 2">
                2. Requirements
              </span>
              @if (isPaidService()) {
                <span [class.text-orange-600]="wizardStep() >= 3" [class.text-slate-400]="wizardStep() < 3">
                  3. GCash Payment
                </span>
                <span [class.text-orange-600]="wizardStep() >= 4" [class.text-slate-400]="wizardStep() < 4">
                  4. Review & Submit
                </span>
              } @else {
                <span [class.text-orange-600]="wizardStep() >= 4" [class.text-slate-400]="wizardStep() < 4">
                  3. Review & Submit
                </span>
              }
            </div>
            <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-[#ea580c] transition-all duration-300"
                [style.width.%]="wizardProgress()">
              </div>
            </div>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- STEP 1: APPLICATION FORM -->
        <!-- ========================================================================= -->
        @if (wizardStep() === 1) {
          <div class="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
              <div>
                <h2 class="text-xl sm:text-2xl font-black text-slate-900">Application Form</h2>
                <p class="text-slate-500 text-sm mt-0.5">
                  Fill in the required information for your <strong class="text-slate-800">{{ svc.service_name }}</strong> request.
                </p>
              </div>
            </div>

            <!-- Purpose Field -->
            <div class="mt-6">
              @if (getPurposeField(); as purposeField) {
                <label [for]="'field-' + purposeField.key" class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  {{ purposeField.label || 'Purpose of Request' }} <span class="text-red-500">*</span>
                </label>
                @if (purposeField.type === 'select' && purposeField.options?.length) {
                  <select
                    [id]="'field-' + purposeField.key"
                    [(ngModel)]="formData['purpose']"
                    class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition">
                    <option value="">Select purpose</option>
                    @for (opt of purposeField.options; track opt) {
                      <option [value]="opt">{{ opt }}</option>
                    }
                  </select>
                } @else {
                  <textarea
                    [id]="'field-' + purposeField.key"
                    rows="2"
                    [(ngModel)]="formData['purpose']"
                    [placeholder]="purposeField.placeholder || 'e.g. Employment, Scholarship, Postal ID...'"
                    class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition">
                  </textarea>
                }
              } @else {
                <label for="req-purpose" class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Purpose of Request <span class="text-red-500">*</span>
                </label>
                <textarea
                  id="req-purpose"
                  rows="2"
                  [(ngModel)]="formData['purpose']"
                  placeholder="e.g. Employment requirement, Bank account opening, Scholarship, ID renewal..."
                  class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition">
                </textarea>
              }
              @if (formErrors['purpose']) {
                <p class="text-xs text-red-600 mt-1 font-semibold">{{ formErrors['purpose'] }}</p>
              }
            </div>

            <!-- Dynamic Service Fields (if configured) -->
            @if (getNonPurposeServiceFields().length > 0) {
              <div class="mt-6 pt-6 border-t border-slate-100">
                <h3 class="text-xs font-black uppercase tracking-wider text-slate-500 mb-4">
                  Service Application Details
                </h3>
                <div class="grid gap-4 sm:grid-cols-2">
                  @for (field of getNonPurposeServiceFields(); track field.key) {
                    <div [class.sm:col-span-2]="isFullWidthField(field)">
                      <label [for]="'field-' + field.key" class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        {{ field.label || field.key }}
                        @if (field.required) { <span class="text-red-500">*</span> }
                      </label>

                      @if (field.type === 'select') {
                        <select
                          [id]="'field-' + field.key"
                          [(ngModel)]="formData[field.key]"
                          (ngModelChange)="onFormFieldChange(field.key)"
                          class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition">
                          <option value="">Select an option</option>
                          @for (opt of field.options; track opt) {
                            <option [value]="opt">{{ opt }}</option>
                          }
                        </select>
                      } @else if (field.type === 'textarea') {
                        <textarea
                          [id]="'field-' + field.key"
                          rows="2"
                          [(ngModel)]="formData[field.key]"
                          (ngModelChange)="onFormFieldChange(field.key)"
                          [placeholder]="field.placeholder || ''"
                          class="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition">
                        </textarea>
                      } @else if (field.type === 'date') {
                        <input
                          [id]="'field-' + field.key"
                          type="date"
                          [(ngModel)]="formData[field.key]"
                          (ngModelChange)="onFormFieldChange(field.key)"
                          class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                        />
                      } @else {
                        <input
                          [id]="'field-' + field.key"
                          [type]="field.type || 'text'"
                          [(ngModel)]="formData[field.key]"
                          (ngModelChange)="onFormFieldChange(field.key)"
                          [placeholder]="field.placeholder || ''"
                          class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                        />
                      }

                      @if (formErrors[field.key]) {
                        <p class="text-xs text-red-600 mt-1 font-semibold">{{ formErrors[field.key] }}</p>
                      }
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Address Breakdown Section (if service didn't include individual address fields) -->
            @if (!hasSpecificAddressFields()) {
              <div class="mt-6 pt-6 border-t border-slate-100">
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <h3 class="text-xs font-black uppercase tracking-wider text-slate-500">
                      Resident Address Details
                    </h3>
                    <p class="text-xs text-slate-400 mt-0.5">
                      Verify your address information as it will appear on your document.
                    </p>
                  </div>
                </div>

                <div class="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label for="addr-block" class="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Block No.
                    </label>
                    <input
                      id="addr-block"
                      type="text"
                      [(ngModel)]="formData['block']"
                      (ngModelChange)="updateCompositeAddress()"
                      placeholder="e.g. 15"
                      class="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                    />
                  </div>
                  <div>
                    <label for="addr-lot" class="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Lot No.
                    </label>
                    <input
                      id="addr-lot"
                      type="text"
                      [(ngModel)]="formData['lot']"
                      (ngModelChange)="updateCompositeAddress()"
                      placeholder="e.g. 20 B"
                      class="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                    />
                  </div>
                  <div>
                    <label for="addr-street" class="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Street
                    </label>
                    <input
                      id="addr-street"
                      type="text"
                      [(ngModel)]="formData['street']"
                      (ngModelChange)="updateCompositeAddress()"
                      placeholder="e.g. Samaria"
                      class="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                    />
                  </div>
                  <div>
                    <label for="addr-subdivision" class="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Subdivision / Village
                    </label>
                    <input
                      id="addr-subdivision"
                      type="text"
                      [(ngModel)]="formData['subdivision']"
                      (ngModelChange)="updateCompositeAddress()"
                      placeholder="e.g. Pleasant Hills"
                      class="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                    />
                  </div>
                  <div>
                    <label for="addr-purok" class="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Purok / Zone
                    </label>
                    <input
                      id="addr-purok"
                      type="text"
                      [(ngModel)]="formData['purok_zone']"
                      (ngModelChange)="updateCompositeAddress()"
                      placeholder="e.g. Purok 2"
                      class="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                    />
                  </div>
                  <div>
                    <label for="addr-barangay" class="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Barangay
                    </label>
                    <input
                      id="addr-barangay"
                      type="text"
                      [(ngModel)]="formData['barangay']"
                      (ngModelChange)="updateCompositeAddress()"
                      placeholder="San Manuel"
                      class="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                    />
                  </div>
                </div>

                <div class="mt-3">
                  <label for="addr-complete" class="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Complete Address Line
                  </label>
                  <input
                    id="addr-complete"
                    type="text"
                    [(ngModel)]="formData['address']"
                    placeholder="Complete address line"
                    class="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                  />
                </div>
              </div>
            }

            <div class="mt-8 flex items-center justify-between pt-5 border-t border-slate-100">
              <a routerLink="/services"
                 class="px-5 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-700 font-bold text-sm transition cursor-pointer">
                Cancel
              </a>
              <button
                type="button"
                (click)="validateAndProceedToRequirements()"
                class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-sm transition cursor-pointer shadow-sm">
                <span>Continue to Requirements</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- STEP 2: UPLOAD / REVIEW REQUIREMENTS -->
        <!-- ========================================================================= -->
        @if (wizardStep() === 2) {
          <div class="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
              <div>
                <h2 class="text-xl sm:text-2xl font-black text-slate-900">Upload Digital Requirements</h2>
                <p class="text-slate-500 text-sm mt-0.5">
                  Provide digital photos or PDF copies of the required documents for <strong class="text-slate-800">{{ svc.service_name }}</strong>.
                </p>
              </div>
              <span class="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-medium shrink-0 self-start sm:self-auto">
                Accepted: PDF, JPG, PNG (Max 10MB)
              </span>
            </div>

            @if (!svc.requirements || svc.requirements.length === 0) {
              <div class="mt-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-emerald-900 text-sm">
                <p class="font-bold">No mandatory documents required for this service.</p>
                <p class="text-xs mt-1 text-emerald-800">You may proceed directly to the next step.</p>
              </div>
            } @else {
              <div class="mt-6 space-y-5">
                @for (reqName of svc.requirements; track reqName; let idx = $index) {
                  <div class="rounded-2xl border border-slate-200 p-5 bg-slate-50/50">
                    <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div class="flex-1">
                        <div class="flex items-center gap-2">
                          <p class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Requirement #{{ idx + 1 }}</p>
                          @if (is2x2PhotoReq(reqName)) {
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                              2×2 ID Photo (1:1 Ratio)
                            </span>
                          }
                        </div>
                        <h3 class="text-base font-bold text-slate-900 mt-0.5">{{ reqName }}</h3>

                        <!-- 2x2 Photo Specific Guidelines -->
                        @if (is2x2PhotoReq(reqName)) {
                          <div class="mt-2 text-xs text-slate-500 space-y-1 bg-white/70 border border-slate-200/60 rounded-xl p-3">
                            <p class="font-semibold text-slate-700 flex items-center gap-1.5">
                              <svg class="w-3.5 h-3.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                              </svg>
                              <span>2×2 ID Photo Validation Requirements:</span>
                            </p>
                            <ul class="list-disc list-inside text-[11px] text-slate-600 space-y-0.5 pl-1">
                              <li>Accepted formats: <strong>JPG, JPEG, PNG only</strong></li>
                              <li>Square 1:1 aspect ratio (min 300 × 300 px)</li>
                              <li>Must contain <strong>exactly one</strong> detectable human face</li>
                              <li>Face is centered, sufficiently visible, and not severely cropped</li>
                              <li>Crisp, well-lit portrait (not blurry, dark, or overexposed)</li>
                              <li>Plain white or light-colored background</li>
                            </ul>
                          </div>
                        }
                      </div>

                      <!-- Uploaded Status or Upload Button -->
                      @if (getUploadedReq(reqName); as uploaded) {
                        <div class="flex items-center gap-3 bg-white border border-emerald-300 rounded-xl p-2.5 shadow-2xs shrink-0">
                          @if (is2x2PhotoReq(reqName) || isImageFile(uploaded)) {
                            <img [src]="resolveFileUrl(uploaded.file_url)" alt="Uploaded Requirement Preview"
                                 class="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0" />
                          } @else {
                            <svg class="w-6 h-6 text-emerald-600 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          }
                          <div class="text-left text-xs min-w-0 max-w-[180px]">
                            <p class="font-bold text-slate-800 truncate">{{ uploaded.original_name }}</p>
                            <p class="text-[10px] text-emerald-600 font-semibold">{{ formatSize(uploaded.size) }} &bull; Verified</p>
                          </div>
                          <button
                            type="button"
                            (click)="removeUploadedReq(reqName)"
                            class="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer ml-1">
                            Remove
                          </button>
                        </div>
                      } @else {
                        <div class="shrink-0">
                          <label [for]="'file-upload-' + idx"
                                 class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-orange-500 text-slate-700 font-bold text-xs transition cursor-pointer shadow-2xs">
                            <svg class="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                            <span>{{ is2x2PhotoReq(reqName) ? 'Upload 2×2 Photo' : 'Upload Document' }}</span>
                          </label>
                          <input
                            [id]="'file-upload-' + idx"
                            type="file"
                            [accept]="is2x2PhotoReq(reqName) ? 'image/jpeg,image/png' : '.pdf,image/jpeg,image/png'"
                            class="sr-only"
                            (change)="onFileSelected($event, reqName)"
                          />
                        </div>
                      }
                    </div>

                    <!-- Upload Error Banner for this requirement -->
                    @if (reqErrors()[reqName]) {
                      <div class="mt-3 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-start gap-2">
                        <svg class="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                        <div>
                          <p class="font-bold">Validation Error</p>
                          <p class="mt-0.5 leading-relaxed">{{ reqErrors()[reqName] }}</p>
                        </div>
                      </div>
                    }

                    @if (uploadingReq() === reqName) {
                      <div class="mt-3 flex items-center gap-2 text-xs text-orange-600 font-semibold">
                        <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                        <span>Validating and uploading file...</span>
                      </div>
                    }
                  </div>
                }
              </div>
            }

            <div class="mt-8 flex items-center justify-between pt-5 border-t border-slate-100">
              <button
                type="button"
                (click)="proceedToStep(1)"
                class="px-5 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-700 font-bold text-sm transition cursor-pointer">
                &larr; Back to Form
              </button>
              <button
                type="button"
                (click)="validateAndProceedFromRequirements()"
                class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-sm transition cursor-pointer shadow-sm">
                @if (isPaidService()) {
                  <span>Continue to Payment</span>
                } @else {
                  <span>Continue to Review</span>
                }
                <span>&rarr;</span>
              </button>
            </div>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- STEP 3: GCASH PAYMENT & RECEIPT UPLOAD (Only for Paid Services) -->
        <!-- ========================================================================= -->
        @if (wizardStep() === 3 && isPaidService()) {
          <div class="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
            <div class="pb-5 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">
                  GCash Official Payment
                </span>
              </div>
              <h2 class="text-xl sm:text-2xl font-black text-slate-900 mt-1">Pay Processing Fee via GCash</h2>
              <p class="text-slate-500 text-sm mt-0.5">
                Scan the official QR code or send payment to the Barangay San Manuel GCash account, then upload your transaction receipt.
              </p>
            </div>

            <!-- 2-Column Payment Card: Left QR & Account Info, Right Upload Receipt -->
            <div class="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6">

              <!-- Left: Official GCash QR Code & Instructions (5 cols) -->
              <div class="md:col-span-5 bg-blue-50/60 border border-blue-200/80 rounded-3xl p-5 sm:p-6 flex flex-col items-center text-center">
                <div class="w-full flex items-center justify-between pb-3 border-b border-blue-200/60">
                  <div class="flex items-center gap-2 text-left">
                    <div class="w-8 h-8 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-2xs">
                      G
                    </div>
                    <div>
                      <h3 class="text-xs font-black text-blue-950 uppercase tracking-wide">GCash QR</h3>
                      <p class="text-[10px] text-blue-700 font-semibold">Scan to Pay</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Amount Due</span>
                    <span class="text-lg font-black text-blue-900 block">₱{{ svc.processing_fee | number:'1.2-2' }}</span>
                  </div>
                </div>

                <!-- QR Code Box -->
                <div class="mt-4 p-3.5 bg-white rounded-2xl border border-blue-200 shadow-sm relative group flex flex-col items-center">
                  <img
                    src="/gcash-qr.png"
                    alt="Official Barangay San Manuel GCash QR Code"
                    class="w-52 h-52 sm:w-60 sm:h-60 object-contain rounded-xl"
                  />
                  <div class="mt-2.5 text-center">
                    <p class="text-xs font-bold text-slate-800">Barangay San Manuel Treasurer</p>
                    <p class="text-xs font-mono font-black text-blue-700">0917-827-4638</p>
                  </div>
                </div>

                <!-- Payment Guidelines -->
                <div class="mt-4 w-full text-left bg-white/80 border border-blue-100 rounded-xl p-3.5 text-xs space-y-2">
                  <p class="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                    </svg>
                    <span>How to Pay:</span>
                  </p>
                  <ol class="list-decimal list-inside text-[11px] text-slate-600 space-y-1 pl-0.5">
                    <li>Open your <strong>GCash App</strong> & select <strong>Scan QR</strong> or <strong>Express Send</strong>.</li>
                    <li>Enter the exact amount: <strong class="text-blue-900">₱{{ svc.processing_fee | number:'1.2-2' }}</strong>.</li>
                    <li>Save / screenshot your <strong>GCash confirmation receipt</strong>.</li>
                    <li>Enter your <strong>Reference Number</strong> and attach your <strong>Receipt</strong> below.</li>
                  </ol>
                </div>
              </div>

              <!-- Right: Unified Payment Verification Card (7 cols) -->
              <div class="md:col-span-7">
                <div class="bg-slate-50/80 border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xs">
                  <div class="flex items-center justify-between pb-4 border-b border-slate-200/80 mb-5">
                    <div>
                      <h3 class="text-sm font-black text-slate-900 flex items-center gap-2">
                        <span class="w-6 h-6 rounded-lg bg-orange-600 text-white font-black text-xs flex items-center justify-center">2</span>
                        Payment Verification Details
                      </h3>
                      <p class="text-[11px] text-slate-500 mt-0.5">Enter your GCash transaction details below to verify payment.</p>
                    </div>
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-800">
                      Required
                    </span>
                  </div>

                  <div class="space-y-4">
                    <!-- 1. Reference Number Input -->
                    <div>
                      <label for="gcash-ref-input" class="block text-xs font-bold text-slate-800 mb-1">
                        GCash Reference Number <span class="text-red-500">*</span>
                      </label>
                      <p class="text-[11px] text-slate-500 mb-1.5">
                        Enter the 13-digit Reference Number found on your GCash transaction receipt.
                      </p>
                      <input
                        id="gcash-ref-input"
                        type="text"
                        [(ngModel)]="paymentRefNumber"
                        (ngModelChange)="onRefNumberChange()"
                        placeholder="e.g. 1002 9384 7561 or 100293847561"
                        class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                      />
                      @if (paymentErrors['reference_number']) {
                        <p class="text-xs text-red-600 mt-1.5 font-semibold">{{ paymentErrors['reference_number'] }}</p>
                      }
                    </div>

                    <!-- Divider / connection -->
                    <div class="pt-2 border-t border-slate-200/60"></div>

                    <!-- 2. Receipt Upload Box -->
                    <div>
                      <div class="flex items-center justify-between mb-1">
                        <label class="block text-xs font-bold text-slate-800">
                          Upload GCash Payment Receipt / Screenshot <span class="text-red-500">*</span>
                        </label>
                        <span class="text-[10px] text-slate-400 font-medium">JPG, PNG, WEBP (Max 10MB)</span>
                      </div>
                      <p class="text-[11px] text-slate-500 mb-2.5">
                        Ensure that the Reference Number, Amount (₱{{ svc.processing_fee | number:'1.2-2' }}), and Date are clearly visible.
                      </p>

                      @if (uploadedReceipt(); as receipt) {
                        <!-- Uploaded Receipt Preview Box -->
                        <div class="bg-white border-2 border-emerald-300 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center gap-3.5">
                          <button
                            type="button"
                            (click)="openReceiptPreview()"
                            title="Click to inspect uploaded receipt"
                            class="relative group shrink-0 cursor-pointer">
                            <img
                              [src]="resolveFileUrl(receipt.file_url)"
                              alt="GCash Receipt Preview"
                              class="w-20 h-20 sm:w-22 sm:h-22 object-cover rounded-xl border border-slate-200 group-hover:border-orange-500 shadow-2xs transition"
                            />
                            <div class="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                              </svg>
                            </div>
                          </button>

                          <div class="flex-1 min-w-0 text-center sm:text-left">
                            <div class="flex items-center justify-center sm:justify-start gap-2">
                              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <svg class="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                </svg>
                                <span>Receipt Attached</span>
                              </span>
                            </div>
                            <p class="font-bold text-slate-900 text-sm mt-1 truncate">{{ receipt.original_name }}</p>
                            <p class="text-[11px] text-slate-500 mt-0.5">{{ formatSize(receipt.size) }} &bull; Ready for barangay verification</p>

                            <div class="mt-2 flex items-center justify-center sm:justify-start gap-3">
                              <button
                                type="button"
                                (click)="openReceiptPreview()"
                                class="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer flex items-center gap-1">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>Inspect Image</span>
                              </button>
                              <span class="text-slate-300">|</span>
                              <button
                                type="button"
                                (click)="removeUploadedReceipt()"
                                class="text-xs font-bold text-red-500 hover:text-red-700 cursor-pointer">
                                Change Receipt
                              </button>
                            </div>
                          </div>
                        </div>
                      } @else {
                        <!-- Drag & Drop / Upload Trigger Area -->
                        <div>
                          <label
                            for="receipt-file-upload"
                            class="border-2 border-dashed border-slate-300 hover:border-orange-500 rounded-2xl p-5 bg-white flex flex-col items-center justify-center text-center cursor-pointer transition group">
                            <div class="w-11 h-11 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition">
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                              </svg>
                            </div>
                            <span class="text-xs font-bold text-slate-800">
                              Click to select GCash Receipt image
                            </span>
                            <span class="text-[11px] text-slate-400 mt-0.5">
                              Upload screenshot or downloaded official receipt (JPG, PNG)
                            </span>
                          </label>
                          <input
                            id="receipt-file-upload"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            class="sr-only"
                            (change)="onReceiptFileSelected($event)"
                          />
                        </div>
                      }

                      @if (uploadingReceipt()) {
                        <div class="mt-2.5 flex items-center gap-2 text-xs text-orange-600 font-semibold">
                          <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                          </svg>
                          <span>Validating and uploading GCash receipt...</span>
                        </div>
                      }

                      @if (paymentErrors['receipt']) {
                        <div class="mt-2.5 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-start gap-2">
                          <svg class="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                          </svg>
                          <div>
                            <p class="font-bold">Receipt Error</p>
                            <p class="mt-0.5 leading-relaxed">{{ paymentErrors['receipt'] }}</p>
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Navigation Buttons -->
            <div class="mt-8 flex items-center justify-between pt-5 border-t border-slate-100">
              <button
                type="button"
                (click)="proceedToStep(2)"
                class="px-5 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-700 font-bold text-sm transition cursor-pointer">
                &larr; Back to Requirements
              </button>
              <button
                type="button"
                (click)="validateAndProceedFromPayment()"
                class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-sm transition cursor-pointer shadow-sm">
                <span>Continue to Review</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- STEP 4: REVIEW & SUBMIT -->
        <!-- ========================================================================= -->
        @if (wizardStep() === 4) {
          <div class="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
            <div class="pb-5 border-b border-slate-100">
              <h2 class="text-xl sm:text-2xl font-black text-slate-900">Review & Confirm Request</h2>
              <p class="text-slate-500 text-sm mt-0.5">Please check your details and payment evidence before submitting your request.</p>
            </div>

            <div class="mt-6 rounded-2xl bg-slate-50/70 border border-slate-200 p-5 sm:p-6 space-y-6">
              <!-- Service & Fee Summary -->
              <div class="flex items-center justify-between pb-4 border-b border-slate-200/80">
                <div>
                  <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Selected Service</span>
                  <h3 class="font-black text-slate-900 text-base sm:text-lg mt-0.5 uppercase">{{ svc.service_name }}</h3>
                </div>
                <div class="text-right">
                  <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Processing Fee</span>
                  <p class="font-black text-orange-600 text-base sm:text-lg mt-0.5">
                    @if (isPaidService()) {
                      ₱{{ svc.processing_fee | number:'1.2-2' }}
                    } @else {
                      FREE
                    }
                  </p>
                </div>
              </div>

              <!-- GCash Payment Summary Card (if paid service) -->
              @if (isPaidService()) {
                <div class="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 sm:p-5">
                  <div class="flex items-center justify-between pb-3 border-b border-blue-200/60 mb-3">
                    <h4 class="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-2">
                      <div class="w-5 h-5 rounded-md bg-blue-600 text-white font-black flex items-center justify-center text-[10px]">
                        G
                      </div>
                      <span>GCash Payment Evidence</span>
                    </h4>
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Receipt Verified
                    </span>
                  </div>

                  <div class="grid sm:grid-cols-2 gap-4 items-center">
                    <div class="space-y-2 text-xs">
                      <div>
                        <span class="text-slate-400 block font-bold text-[10px] uppercase tracking-wider">Payment Method</span>
                        <span class="font-bold text-slate-800">GCash QR / Mobile</span>
                      </div>
                      <div>
                        <span class="text-slate-400 block font-bold text-[10px] uppercase tracking-wider">GCash Reference Number</span>
                        <span class="font-mono font-bold text-blue-800 text-sm">{{ paymentRefNumber || '—' }}</span>
                      </div>
                      <div>
                        <span class="text-slate-400 block font-bold text-[10px] uppercase tracking-wider">Amount Paid</span>
                        <span class="font-bold text-slate-900">₱{{ svc.processing_fee | number:'1.2-2' }}</span>
                      </div>
                    </div>

                    @if (uploadedReceipt(); as r) {
                      <div class="flex items-center gap-3 bg-white border border-blue-200 rounded-xl p-3 shadow-2xs">
                        <button
                          type="button"
                          (click)="openReceiptPreview()"
                          class="relative group shrink-0 cursor-pointer">
                          <img [src]="resolveFileUrl(r.file_url)" alt="Receipt Thumbnail" class="w-16 h-16 rounded-lg object-cover border border-slate-200 group-hover:border-orange-500 shadow-2xs" />
                          <div class="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                            </svg>
                          </div>
                        </button>
                        <div class="min-w-0 text-xs">
                          <p class="font-bold text-slate-900 truncate">{{ r.original_name }}</p>
                          <p class="text-[10px] text-slate-500">{{ formatSize(r.size) }}</p>
                          <button
                            type="button"
                            (click)="openReceiptPreview()"
                            class="text-orange-600 hover:text-orange-700 font-bold text-[11px] mt-1 cursor-pointer flex items-center gap-1">
                            <span>Inspect Full Receipt</span>
                            <span>&rarr;</span>
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Service Details Section -->
              <div>
                <h4 class="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Service Details</h4>
                <div class="grid gap-3 sm:grid-cols-2">
                  <!-- Purpose -->
                  <div class="sm:col-span-2 bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                    <span class="text-slate-400 block font-bold text-[10px] uppercase tracking-wider">Purpose of Request</span>
                    <span class="font-bold text-slate-800 text-sm mt-0.5 block leading-relaxed">{{ formData['purpose'] || '—' }}</span>
                  </div>

                  <!-- Registered Address (if present) -->
                  @if (formData['address']) {
                    <div class="sm:col-span-2 bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                      <span class="text-slate-400 block font-bold text-[10px] uppercase tracking-wider">Registered Address</span>
                      <span class="font-bold text-slate-800 text-sm mt-0.5 block leading-relaxed">{{ formData['address'] }}</span>
                    </div>
                  }

                  <!-- Dynamic Service Fields -->
                  @for (item of getReviewFields(); track item.label) {
                    <div class="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs" [class.sm:col-span-2]="item.isFullWidth">
                      <span class="text-slate-400 block font-bold text-[10px] uppercase tracking-wider">{{ item.label }}</span>
                      <span class="font-bold text-slate-800 text-sm mt-0.5 block">{{ item.value }}</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Attached Digital Requirements List -->
              <div class="pt-5 border-t border-slate-200/80">
                <h4 class="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Attached Digital Requirements</h4>
                @if (uploadedRequirements().length === 0) {
                  <p class="text-xs text-slate-500 italic">No files attached (not required for this service).</p>
                } @else {
                  <ul class="space-y-3">
                    @for (file of uploadedRequirements(); track file.requirement_name) {
                      <li class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs">
                        <div class="flex items-center gap-3.5 min-w-0">
                          @if (is2x2PhotoReq(file.requirement_name) || isImageFile(file)) {
                            <button
                              type="button"
                              (click)="openFilePreview(file)"
                              [title]="is2x2PhotoReq(file.requirement_name) ? 'Click to inspect 2x2 ID photo' : 'Click to inspect document image'"
                              class="relative group shrink-0 cursor-pointer">
                              <img [src]="resolveFileUrl(file.file_url)" [alt]="file.requirement_name" class="w-14 h-14 rounded-xl object-cover border-2 border-orange-200 group-hover:border-orange-500 shadow-xs transition" />
                              <div class="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                                </svg>
                              </div>
                            </button>
                          } @else {
                            <div class="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center shrink-0">
                              <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                              </svg>
                            </div>
                          }
                          <div class="min-w-0">
                            <div class="flex items-center gap-2">
                              <span class="font-bold text-slate-900 block truncate text-sm">{{ file.requirement_name }}</span>
                              @if (is2x2PhotoReq(file.requirement_name)) {
                                <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Verified 2×2 ID Photo
                                </span>
                              }
                            </div>
                            <span class="text-slate-400 font-mono text-[11px] block truncate mt-0.5">{{ file.original_name }}</span>
                          </div>
                        </div>

                        <div class="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <button
                            type="button"
                            (click)="openFilePreview(file)"
                            class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs transition cursor-pointer border border-orange-200">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{{ is2x2PhotoReq(file.requirement_name) ? 'Check & Enlarge Photo' : (isImageFile(file) ? 'Preview Image' : 'View Details') }}</span>
                          </button>
                        </div>
                      </li>
                    }
                  </ul>
                }
              </div>
            </div>

            @if (submissionError()) {
              <div class="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-semibold">
                {{ submissionError() }}
              </div>
            }

            <div class="mt-8 flex items-center justify-between pt-5 border-t border-slate-100">
              <button
                type="button"
                (click)="proceedToStep(isPaidService() ? 3 : 2)"
                class="px-5 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-700 font-bold text-sm transition cursor-pointer">
                &larr; Back to {{ isPaidService() ? 'Payment' : 'Requirements' }}
              </button>
              <button
                type="button"
                [disabled]="submitting()"
                (click)="submitOnlineRequest()"
                class="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] disabled:bg-slate-300 text-white font-bold text-sm shadow-sm transition cursor-pointer">
                @if (submitting()) {
                  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Submitting Request...</span>
                } @else {
                  <span>Submit Document Request</span>
                  <span>&rarr;</span>
                }
              </button>
            </div>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- STEP 5: CONFIRMATION -->
        <!-- ========================================================================= -->
        @if (wizardStep() === 5) {
          <div class="rounded-3xl border border-emerald-200 bg-white p-6 sm:p-10 shadow-xs text-center">
            <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-xs">
              <svg class="w-9 h-9" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>

            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black uppercase tracking-wider mt-4">
              Request Submitted Successfully
            </span>

            <h2 class="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              Your request is being processed
            </h2>
            <p class="text-slate-500 text-sm max-w-md mx-auto mt-2 leading-relaxed">
              Barangay personnel will review your application, digital requirements, and GCash payment verification. You can track status updates in your resident dashboard.
            </p>

            @if (submittedResult(); as res) {
              <div class="mt-6 inline-block bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left max-w-sm w-full">
                <div class="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                  <span class="font-bold text-slate-400 uppercase tracking-wider">Tracking Number</span>
                  <span class="font-black text-orange-600 font-mono text-sm">
                    {{ res.transaction?.transaction_number || res.requests?.[0]?.request_number }}
                  </span>
                </div>
                <div class="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div class="flex justify-between">
                    <span class="text-slate-400">Service:</span>
                    <span class="font-bold text-slate-800">{{ svc.service_name }}</span>
                  </div>
                  @if (isPaidService()) {
                    <div class="flex justify-between">
                      <span class="text-slate-400">Payment:</span>
                      <span class="font-bold text-blue-700">GCash (Ref: {{ paymentRefNumber }})</span>
                    </div>
                  }
                  <div class="flex justify-between">
                    <span class="text-slate-400">Status:</span>
                    <span class="font-bold text-amber-600">Pending Staff Review</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400">Submitted:</span>
                    <span class="font-semibold text-slate-800">{{ res.requests?.[0]?.request_date || (res.requests?.[0]?.created_at | date:'mediumDate') }}</span>
                  </div>
                </div>
              </div>
            }

            <div class="mt-8 flex flex-wrap justify-center gap-3">
              <a routerLink="/requests"
                 class="px-6 py-2.5 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-sm shadow-sm transition">
                Track My Requests
              </a>
              <a routerLink="/services"
                 class="px-6 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-700 font-bold text-sm transition">
                Request Another Document
              </a>
            </div>
          </div>
        }
      }

      <!-- ========================================================================= -->
      <!-- PHOTO, RECEIPT & REQUIREMENT PREVIEW MODAL -->
      <!-- ========================================================================= -->
      @if (previewModalFile(); as preview) {
        <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
             (click)="closeFilePreview()">
          <div class="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-7 relative overflow-hidden max-h-[90vh] flex flex-col"
               (click)="$event.stopPropagation()">
            <!-- Modal Header -->
            <div class="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div>
                <span class="text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                  {{ preview.isReceipt ? 'GCash Payment Receipt Preview' : (preview.isPhoto ? '2×2 ID Photo Preview' : (preview.isImage ? 'Uploaded Document Image' : 'Document Preview')) }}
                </span>
                <h3 class="text-lg font-black text-slate-900 mt-1">{{ preview.title }}</h3>
              </div>
              <button
                type="button"
                (click)="closeFilePreview()"
                class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Modal Image Preview Content -->
            <div class="py-5 text-center overflow-y-auto flex-1">
              @if (preview.isReceipt) {
                <div class="inline-block relative p-2 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner max-w-full">
                  <img
                    [src]="preview.url"
                    alt="Uploaded GCash Receipt Preview"
                    class="max-h-96 sm:max-h-[28rem] w-auto max-w-full object-contain rounded-xl border border-slate-300 shadow-md mx-auto"
                  />
                  <span class="absolute bottom-4 right-4 bg-blue-900/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-md backdrop-blur-xs">
                    GCash Receipt &bull; Ref: {{ paymentRefNumber || 'N/A' }}
                  </span>
                </div>
              } @else if (preview.isPhoto) {
                <div class="inline-block relative p-2 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner">
                  <img
                    [src]="preview.url"
                    alt="Uploaded 2x2 ID Photo Preview"
                    class="w-64 h-64 sm:w-72 sm:h-72 object-cover rounded-xl border border-slate-300 shadow-md mx-auto"
                  />
                  <span class="absolute bottom-4 right-4 bg-black/75 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                    1:1 Square &bull; 2×2 ID
                  </span>
                </div>

                <!-- Verification Checklist Badges -->
                <div class="mt-4 grid grid-cols-3 gap-2 text-[11px] font-semibold text-slate-600">
                  <div class="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center gap-1">
                    <svg class="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    <span>1:1 Square</span>
                  </div>
                  <div class="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center gap-1">
                    <svg class="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    <span>Face Verified</span>
                  </div>
                  <div class="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center gap-1">
                    <svg class="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    <span>White BG</span>
                  </div>
                </div>
              } @else if (preview.isImage) {
                <div class="inline-block relative p-2 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner max-w-full">
                  <img
                    [src]="preview.url"
                    alt="Uploaded Requirement Preview"
                    class="max-h-80 sm:max-h-96 w-auto max-w-full object-contain rounded-xl border border-slate-300 shadow-md mx-auto"
                  />
                  <span class="absolute bottom-4 right-4 bg-black/75 text-white text-[10px] font-bold px-2.5 py-1 rounded-md backdrop-blur-xs">
                    Uploaded Document Image
                  </span>
                </div>
              } @else {
                <div class="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-slate-700 max-w-md mx-auto">
                  <div class="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-3">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <p class="font-bold text-slate-900 text-sm">{{ preview.fileName || 'Document File' }}</p>
                  <p class="text-xs text-slate-500 mt-1">Attached digital document is ready for barangay staff review.</p>
                </div>
              }
            </div>

            <!-- Modal Actions -->
            <div class="pt-4 border-t border-slate-100 flex items-center justify-end shrink-0">
              <button
                type="button"
                (click)="closeFilePreview()"
                class="px-6 py-2 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-xs transition cursor-pointer shadow-xs">
                Done
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ApplyComponent implements OnInit {
  private portalService = inject(PortalService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public auth = inject(AuthService);
  private idPhotoValidator = inject(IdPhotoValidatorService);

  loadingService = signal<boolean>(true);
  selectedService = signal<Service | null>(null);
  wizardStep = signal<number>(1);

  formData: Record<string, any> = {};
  formErrors: Record<string, string> = {};
  reqErrors = signal<Record<string, string>>({});
  uploadedRequirements = signal<UploadedRequirement[]>([]);
  uploadingReq = signal<string | null>(null);
  uploadedPhotoUrl = signal<string | null>(null);

  // GCash Payment & Receipt signals
  paymentRefNumber = '';
  uploadedReceipt = signal<UploadedReceipt | null>(null);
  uploadingReceipt = signal<boolean>(false);
  paymentErrors: Record<string, string> = {};

  previewModalFile = signal<{ url: string; title: string; fileName?: string; isPhoto: boolean; isImage: boolean; isReceipt?: boolean } | null>(null);

  submitting = signal<boolean>(false);
  submissionError = signal<string | null>(null);
  submittedResult = signal<any | null>(null);

  residentFullName = computed(() => {
    const u = this.auth.currentUser();
    if (!u) return 'Resident';
    return [u.first_name, u.middle_name, u.last_name, u.suffix].filter(Boolean).join(' ');
  });

  isPaidService = computed(() => {
    const svc = this.selectedService();
    return !!svc && (Number(svc.processing_fee) || 0) > 0;
  });

  wizardProgress = computed(() => {
    const totalSteps = this.isPaidService() ? 4 : 3;
    const current = Math.min(this.wizardStep(), totalSteps);
    return Math.min(100, Math.round((current / totalSteps) * 100));
  });

  constructor() {
    effect(() => {
      const u = this.auth.currentUser();
      const svc = this.selectedService();
      if (u && svc) {
        this.initFormData(svc);
      }
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params: Params) => {
      let serviceId = params['service_id'];
      if (!serviceId) {
        try {
          serviceId = sessionStorage.getItem('portal_selected_service_id');
        } catch {}
      }

      if (!serviceId) {
        this.loadingService.set(false);
        this.router.navigate(['/services']);
        return;
      }

      this.loadService(Number(serviceId), params['reuse'] === '1');
    });
  }

  private loadService(serviceId: number, isReuse: boolean): void {
    this.loadingService.set(true);
    this.portalService.getServices().subscribe({
      next: (res: ApiResponse<Service[]>) => {
        const list = Array.isArray(res?.data) ? res.data : [];
        const match = list.find((s: Service) => s.service_id === serviceId && s.is_active !== false);
        if (!match) {
          this.loadingService.set(false);
          this.router.navigate(['/services']);
          return;
        }

        this.selectedService.set(match);
        this.initFormData(match);

        if (isReuse) {
          this.portalService.getPreviousServiceData(serviceId).subscribe({
            next: (dataRes: any) => {
              if (dataRes.data?.form_data) {
                this.formData = {
                  ...this.formData,
                  ...dataRes.data.form_data
                };
              }
              this.loadingService.set(false);
            },
            error: () => this.loadingService.set(false)
          });
        } else {
          this.loadingService.set(false);
        }
      },
      error: () => {
        this.loadingService.set(false);
        this.router.navigate(['/services']);
      }
    });
  }

  /**
   * Automatically populates resident demographics and address fields matching Kiosk logic.
   */
  private initFormData(svc?: Service): void {
    const r = this.auth.currentUser();
    const defaults: Record<string, any> = { ...this.formData };

    if (r) {
      // 1. Core resident demographics defaults
      if (!defaults['full_name']) defaults['full_name'] = this.residentFullName();
      if (!defaults['first_name'] && r.first_name) defaults['first_name'] = r.first_name;
      if (!defaults['middle_name'] && r.middle_name) defaults['middle_name'] = r.middle_name;
      if (!defaults['last_name'] && r.last_name) defaults['last_name'] = r.last_name;
      if (!defaults['suffix'] && r.suffix) defaults['suffix'] = r.suffix;

      // 2. Dates & Demographics
      if (!defaults['birth_date'] && r.birth_date) defaults['birth_date'] = this.formatDateForInput(r.birth_date);
      if (!defaults['birth_place'] && r.birth_place) defaults['birth_place'] = r.birth_place;
      if (!defaults['place_of_birth'] && r.birth_place) defaults['place_of_birth'] = r.birth_place;
      if (!defaults['gender'] && r.gender) defaults['gender'] = r.gender;
      if (!defaults['civil_status'] && r.civil_status) defaults['civil_status'] = r.civil_status;
      if (!defaults['blood_type'] && r.blood_type) defaults['blood_type'] = r.blood_type;
      if (!defaults['occupation'] && r.occupation) defaults['occupation'] = r.occupation;
      if (!defaults['nationality'] && r.nationality) defaults['nationality'] = r.nationality || 'Filipino';
      if (!defaults['religion'] && r.religion) defaults['religion'] = r.religion;

      // 3. Contact & Emergency Contacts
      if (!defaults['contact_number'] && r.contact_number) defaults['contact_number'] = r.contact_number;
      if (!defaults['email'] && r.email) defaults['email'] = r.email;
      if (!defaults['emergency_contact_name'] && r.emergency_contact_name) defaults['emergency_contact_name'] = r.emergency_contact_name;
      if (!defaults['emergency_contact_number'] && r.emergency_contact_number) defaults['emergency_contact_number'] = r.emergency_contact_number;

      // 4. Address Components
      if (!defaults['block'] && r.block) defaults['block'] = r.block;
      if (!defaults['lot'] && r.lot) defaults['lot'] = r.lot;
      if (!defaults['street'] && r.street) defaults['street'] = r.street;
      if (!defaults['subdivision'] && r.subdivision) defaults['subdivision'] = r.subdivision;
      if (!defaults['purok_zone'] && r.purok_zone) defaults['purok_zone'] = r.purok_zone;
      if (!defaults['barangay']) defaults['barangay'] = r.barangay_name || 'San Manuel';
      if (!defaults['municipality']) defaults['municipality'] = r.municipality || 'City of San Jose del Monte';
      if (!defaults['province']) defaults['province'] = r.province || 'Bulacan';
      if (!defaults['zip_code']) defaults['zip_code'] = r.zip_code || '3023';

      // 5. Fallback regex address parsing
      if (r.address_line) {
        if (!defaults['block']) defaults['block'] = this.extractBlock(r.address_line);
        if (!defaults['lot']) defaults['lot'] = this.extractLot(r.address_line);
        if (!defaults['street']) defaults['street'] = this.extractStreet(r.address_line);
        if (!defaults['subdivision']) defaults['subdivision'] = this.extractSubdivision(r.address_line);
        if (!defaults['purok_zone']) defaults['purok_zone'] = this.extractPurok(r.address_line);
      }

      // 6. Unified Address Line
      if (!defaults['address']) defaults['address'] = r.address_line || 'Barangay San Manuel, City of San Jose del Monte, Bulacan';
      if (!defaults['address_line']) defaults['address_line'] = r.address_line || 'Barangay San Manuel, City of San Jose del Monte, Bulacan';
    }

    // 7. Dynamic Service Field Matching
    if (svc?.form_fields && r) {
      for (const field of svc.form_fields) {
        const k = field.key;
        if (defaults[k] !== undefined && defaults[k] !== '') continue;

        const resolved = this.resolveResidentFieldValue(field, r);
        if (resolved !== undefined && resolved !== null && resolved !== '') {
          defaults[k] = resolved;
        }
      }
    }

    // 8. Service-specific defaults (Renewal / Replacement)
    const svcName = (svc?.service_name || '').toLowerCase();
    if (svcName.includes('renewal')) {
      if (!defaults['purpose']) defaults['purpose'] = 'Barangay ID Renewal';
    } else if (svcName.includes('replacement')) {
      if (!defaults['purpose']) defaults['purpose'] = 'Barangay ID Replacement';
      if (!defaults['replacement_reason']) defaults['replacement_reason'] = 'Lost ID';
    }

    this.formData = defaults;
  }

  private resolveResidentFieldValue(field: FormField, r: PortalAccount): any {
    const key = (field.key || '').toLowerCase().replace(/[-_]/g, '');
    const label = (field.label || '').toLowerCase().replace(/[-_]/g, '');

    if (key === 'fullname' || label.includes('fullname') || label.includes('applicantname')) {
      return this.residentFullName();
    }
    if (key === 'firstname' || label.includes('firstname')) return r.first_name || '';
    if (key === 'middlename' || label.includes('middlename')) return r.middle_name || '';
    if (key === 'lastname' || label.includes('lastname')) return r.last_name || '';
    if (key === 'suffix' || label.includes('suffix')) return r.suffix || '';

    if (key === 'birthdate' || key === 'dob' || label.includes('birthdate') || label.includes('dateofbirth')) {
      return this.formatDateForInput(r.birth_date);
    }
    if (key === 'birthplace' || key === 'placeofbirth' || label.includes('birthplace') || label.includes('placeofbirth')) {
      return r.birth_place || '';
    }
    if (key === 'age' || label.includes('age')) {
      return this.calculateAge(r.birth_date);
    }
    if (key === 'gender' || key === 'sex' || label.includes('gender') || label.includes('sex')) {
      return r.gender || '';
    }
    if (key === 'civilstatus' || key === 'maritalstatus' || label.includes('civilstatus') || label.includes('maritalstatus')) {
      return r.civil_status || '';
    }
    if (key === 'bloodtype' || label.includes('bloodtype')) {
      return r.blood_type || '';
    }
    if (key === 'occupation' || key === 'profession' || label.includes('occupation') || label.includes('profession')) {
      return r.occupation || '';
    }
    if (key === 'nationality' || key === 'citizenship' || label.includes('nationality') || label.includes('citizenship')) {
      return r.nationality || 'Filipino';
    }
    if (key === 'religion' || label.includes('religion')) {
      return r.religion || '';
    }
    if (key === 'contactnumber' || key === 'mobilenumber' || key === 'phone' || key === 'phonenumber' || label.includes('contactnumber') || label.includes('mobilenumber') || label.includes('phone')) {
      return r.contact_number || '';
    }
    if (key === 'email' || key === 'emailaddress' || label.includes('email')) {
      return r.email || '';
    }
    if (key.includes('emergency') && (key.includes('name') || key.includes('person') || key.includes('contact'))) {
      return r.emergency_contact_name || '';
    }
    if (key.includes('emergency') && (key.includes('number') || key.includes('phone') || key.includes('tel'))) {
      return r.emergency_contact_number || '';
    }

    if (key === 'block' || key === 'blockno' || key === 'blk' || label.includes('block')) {
      return r.block || this.extractBlock(r.address_line);
    }
    if (key === 'lot' || key === 'lotno' || label.includes('lot')) {
      return r.lot || this.extractLot(r.address_line);
    }
    if (key === 'houseno' || key === 'housenumber' || label.includes('houseno') || label.includes('housenumber')) {
      return r.house_number || '';
    }
    if (key === 'street' || key === 'streetname' || label.includes('street')) {
      return r.street || this.extractStreet(r.address_line);
    }
    if (key === 'subdivision' || key === 'village' || label.includes('subdivision') || label.includes('village')) {
      return r.subdivision || this.extractSubdivision(r.address_line);
    }
    if (key === 'purok' || key === 'purokzone' || key === 'zone' || label.includes('purok') || label.includes('zone')) {
      return r.purok_zone || this.extractPurok(r.address_line);
    }
    if (key === 'barangay' || label.includes('barangay')) {
      return r.barangay_name || 'San Manuel';
    }
    if (key === 'municipality' || key === 'city' || label.includes('municipality') || label.includes('city')) {
      return r.municipality || 'City of San Jose del Monte';
    }
    if (key === 'province' || label.includes('province')) {
      return r.province || 'Bulacan';
    }
    if (key === 'zipcode' || key === 'postalcode' || label.includes('zipcode') || label.includes('postalcode')) {
      return r.zip_code || '3023';
    }
    if (key === 'address' || key === 'completeaddress' || key === 'addressline' || label.includes('address')) {
      return r.address_line || 'Barangay San Manuel, City of San Jose del Monte, Bulacan';
    }

    return undefined;
  }

  private extractBlock(addr?: string | null): string {
    if (!addr) return '';
    const m = addr.match(/blk\.?\s*([0-9a-zA-Z]+)/i) || addr.match(/block\s*([0-9a-zA-Z]+)/i);
    return m ? m[1] : '';
  }

  private extractLot(addr?: string | null): string {
    if (!addr) return '';
    const m = addr.match(/lot\.?\s*([0-9a-zA-Z]+(?:\s+[a-zA-Z])?)/i);
    return m ? m[1] : '';
  }

  private extractStreet(addr?: string | null): string {
    if (!addr) return '';
    const m = addr.match(/([a-zA-Z0-9\s]+?)\s*(?:st\.?|street)/i);
    if (m) return m[1].replace(/^(?:blk|block|lot)\.?\s*[0-9a-zA-Z]+,?\s*/i, '').trim();
    return '';
  }

  private extractSubdivision(addr?: string | null): string {
    if (!addr) return '';
    const m = addr.match(/([a-zA-Z0-9\s]+?)\s*(?:subd\.?|subdivision|village|hills|homes|park)/i);
    if (m) return m[0].replace(/^,?\s*/, '').trim();
    return '';
  }

  private extractPurok(addr?: string | null): string {
    if (!addr) return '';
    const m = addr.match(/purok\s*([0-9a-zA-Z]+)/i) || addr.match(/zone\s*([0-9a-zA-Z]+)/i);
    return m ? m[0] : '';
  }

  calculateAge(birthDate: string | Date | null | undefined): string {
    if (!birthDate) return '';
    const dob = new Date(birthDate);
    if (isNaN(dob.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age >= 0 ? String(age) : '';
  }

  private formatDateForInput(val: string | Date | null | undefined): string {
    if (!val) return '';
    if (val instanceof Date) {
      const year = val.getFullYear();
      const month = String(val.getMonth() + 1).padStart(2, '0');
      const day = String(val.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    const s = String(val).trim();
    const match = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (match) {
      const year = match[1];
      const month = match[2].padStart(2, '0');
      const day = match[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    const d = new Date(s);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDateDisplay(val: string | Date | null | undefined): string {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  updateCompositeAddress(): void {
    const parts = [
      this.formData['block'] ? (String(this.formData['block']).toLowerCase().startsWith('blk') ? this.formData['block'] : `Blk ${this.formData['block']}`) : null,
      this.formData['lot'] ? (String(this.formData['lot']).toLowerCase().startsWith('lot') ? this.formData['lot'] : `Lot ${this.formData['lot']}`) : null,
      this.formData['house_number'],
      this.formData['street'],
      this.formData['subdivision'],
      this.formData['purok_zone'] || this.formData['purok'],
      this.formData['barangay'] || 'Barangay San Manuel',
      this.formData['municipality'],
      this.formData['province']
    ].filter(Boolean);

    if (parts.length > 0) {
      const uniqueParts: string[] = [];
      for (const p of parts) {
        if (p && !uniqueParts.some(u => u.toLowerCase() === String(p).toLowerCase())) {
          uniqueParts.push(String(p).trim());
        }
      }
      const composite = uniqueParts.join(', ');
      this.formData['address'] = composite;
      this.formData['address_line'] = composite;
      this.formData['complete_address'] = composite;
    }
  }

  onFormFieldChange(key: string): void {
    const norm = (key || '').toLowerCase();
    if (norm.includes('block') || norm.includes('lot') || norm.includes('street') || norm.includes('subdivision') || norm.includes('purok')) {
      this.updateCompositeAddress();
    }
  }

  getPurposeField(): FormField | undefined {
    return this.selectedService()?.form_fields?.find(f => (f.key || '').toLowerCase() === 'purpose');
  }

  getNonPurposeServiceFields(): FormField[] {
    const list = this.selectedService()?.form_fields || [];
    return list.filter(f => (f.key || '').toLowerCase() !== 'purpose');
  }

  hasSpecificAddressFields(): boolean {
    const fields = this.selectedService()?.form_fields || [];
    return fields.some(f => {
      const k = (f.key || '').toLowerCase();
      return k.includes('block') || k.includes('lot') || k.includes('street') || k.includes('subdivision') || k.includes('purok') || k === 'address';
    });
  }

  isFullWidthField(field: FormField): boolean {
    if (field.type === 'textarea') return true;
    const k = (field.key || '').toLowerCase();
    return k === 'address' || k === 'complete_address' || k === 'address_line' || k === 'full_name';
  }

  getReviewFields(): { label: string; value: any; isFullWidth?: boolean }[] {
    const list: { label: string; value: any; isFullWidth?: boolean }[] = [];
    const svc = this.selectedService();
    if (!svc) return list;

    for (const field of svc.form_fields || []) {
      const k = (field.key || '').toLowerCase();
      if (k === 'purpose' || k === 'address' || k === 'complete_address' || k === 'address_line') continue;
      const val = this.formData[field.key];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        list.push({
          label: field.label || field.key,
          value: field.type === 'date' ? this.formatDateDisplay(val) : val,
          isFullWidth: this.isFullWidthField(field)
        });
      }
    }
    return list;
  }

  proceedToStep(step: number): void {
    this.wizardStep.set(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  is2x2PhotoReq(reqName: string): boolean {
    const n = (reqName || '').toLowerCase();
    return n.includes('2x2') || n.includes('photo') || n.includes('picture') || n.includes('id picture') || n.includes('passport-size');
  }

  setReqError(reqName: string, errorMsg: string): void {
    const current = { ...this.reqErrors() };
    current[reqName] = errorMsg;
    this.reqErrors.set(current);
  }

  clearReqError(reqName: string): void {
    const current = { ...this.reqErrors() };
    delete current[reqName];
    this.reqErrors.set(current);
  }

  async onFileSelected(event: Event, reqName: string): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.clearReqError(reqName);

    // 1. General file size check
    if (file.size > 10 * 1024 * 1024) {
      this.setReqError(reqName, 'File size exceeds the 10MB limit. Please upload a smaller file.');
      input.value = '';
      return;
    }

    // 2. Specialized 2x2 ID Photo Comprehensive Validation
    if (this.is2x2PhotoReq(reqName)) {
      this.uploadingReq.set(reqName);
      try {
        const validation = await this.idPhotoValidator.validateIdPhoto(file);
        if (!validation.isValid) {
          this.setReqError(reqName, validation.error || 'The uploaded image failed 2×2 ID photo validation.');
          this.uploadingReq.set(null);
          input.value = '';
          return;
        }

        // Passed all 2x2 ID photo validation rules -> proceed with upload
        this.performUpload(file, reqName, true);
      } catch {
        this.setReqError(reqName, 'An unexpected error occurred while validating the ID photo. Please try again.');
        this.uploadingReq.set(null);
        input.value = '';
      }
    } else {
      // Non-photo digital requirement upload
      if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
        this.setReqError(reqName, 'Invalid file format. Please upload a PDF, JPG, or PNG document.');
        input.value = '';
        return;
      }
      this.performUpload(file, reqName, false);
    }
  }

  private performUpload(file: File, reqName: string, isPhoto: boolean): void {
    this.uploadingReq.set(reqName);
    this.portalService.uploadRequirement(file).subscribe({
      next: (res: ApiResponse<UploadedRequirement>) => {
        if (res.success && res.data) {
          const uploaded: UploadedRequirement = {
            requirement_name: reqName,
            file_url: res.data.file_url,
            file_name: res.data.file_name,
            original_name: res.data.original_name,
            size: res.data.size,
            mime_type: res.data.mime_type
          };
          const current = this.uploadedRequirements().filter((r: UploadedRequirement) => r.requirement_name !== reqName);
          this.uploadedRequirements.set([...current, uploaded]);

          if (isPhoto || this.selectedService()?.requires_photo) {
            this.uploadedPhotoUrl.set(res.data.file_url);
          }
        }
        this.uploadingReq.set(null);
      },
      error: (err: any) => {
        this.setReqError(reqName, err?.error?.message || 'Failed to upload document. Please try again.');
        this.uploadingReq.set(null);
      }
    });
  }

  // --- GCash Receipt Upload & Handling ---
  onRefNumberChange(): void {
    if (this.paymentErrors['reference_number']) {
      delete this.paymentErrors['reference_number'];
    }
  }

  onReceiptFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    delete this.paymentErrors['receipt'];

    if (file.size > 10 * 1024 * 1024) {
      this.paymentErrors['receipt'] = 'Receipt image exceeds the 10MB limit. Please upload a smaller file.';
      input.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.paymentErrors['receipt'] = 'Invalid format. Please upload an image file (JPG, PNG, WEBP) of your GCash receipt.';
      input.value = '';
      return;
    }

    this.uploadingReceipt.set(true);
    this.portalService.uploadRequirement(file).subscribe({
      next: (res: ApiResponse<UploadedRequirement>) => {
        if (res.success && res.data) {
          this.uploadedReceipt.set({
            file_url: res.data.file_url,
            file_name: res.data.file_name,
            original_name: res.data.original_name,
            size: res.data.size,
            mime_type: res.data.mime_type,
            reference_number: this.paymentRefNumber.trim(),
            uploaded_at: new Date().toISOString()
          });
        }
        this.uploadingReceipt.set(false);
      },
      error: (err: any) => {
        this.paymentErrors['receipt'] = err?.error?.message || 'Failed to upload GCash receipt. Please try again.';
        this.uploadingReceipt.set(false);
      }
    });
  }

  removeUploadedReceipt(): void {
    this.uploadedReceipt.set(null);
    delete this.paymentErrors['receipt'];
  }

  openReceiptPreview(): void {
    const receipt = this.uploadedReceipt();
    if (!receipt) return;
    this.previewModalFile.set({
      url: this.resolveFileUrl(receipt.file_url),
      title: 'GCash Payment Confirmation Receipt',
      fileName: receipt.original_name || receipt.file_name,
      isPhoto: false,
      isImage: true,
      isReceipt: true
    });
  }

  resolveFileUrl(url?: string | null): string {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const base = environment.apiUrl.replace(/\/api\/v1\/?$/, '');
    const clean = url.replace(/^\/+/, '');
    if (clean.startsWith('uploads/')) {
      return `${base}/${clean}`;
    }
    return `${base}/uploads/${clean}`;
  }

  getApplicantPhotoUrl(): string | null {
    if (this.uploadedPhotoUrl()) return this.uploadedPhotoUrl();
    const photoReq = this.uploadedRequirements().find(r => this.is2x2PhotoReq(r.requirement_name));
    if (photoReq?.file_url) return photoReq.file_url;
    return this.auth.currentUser()?.photo || null;
  }

  isImageFile(file?: UploadedRequirement | null): boolean {
    if (!file) return false;
    if (file.mime_type && file.mime_type.startsWith('image/')) return true;
    const path = (file.file_url || file.file_name || file.original_name || '').toLowerCase();
    return /\.(jpg|jpeg|png|webp|gif)$/i.test(path);
  }

  openFilePreview(file: UploadedRequirement): void {
    const isPhoto = this.is2x2PhotoReq(file.requirement_name);
    const isImage = isPhoto || this.isImageFile(file);
    this.previewModalFile.set({
      url: this.resolveFileUrl(file.file_url),
      title: file.requirement_name,
      fileName: file.original_name || file.file_name,
      isPhoto,
      isImage,
      isReceipt: false
    });
  }

  closeFilePreview(): void {
    this.previewModalFile.set(null);
  }

  getUploadedReq(reqName: string): UploadedRequirement | undefined {
    return this.uploadedRequirements().find((r: UploadedRequirement) => r.requirement_name === reqName);
  }

  removeUploadedReq(reqName: string): void {
    this.uploadedRequirements.set(
      this.uploadedRequirements().filter((r: UploadedRequirement) => r.requirement_name !== reqName)
    );
    this.clearReqError(reqName);
  }

  formatSize(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  isPhoneField(field: any): boolean {
    if (field.type === 'tel') return true;
    const key = (field.key || '').toLowerCase();
    const label = (field.label || '').toLowerCase();
    if (key.includes('name') || key.includes('person') || key.includes('relation') ||
        label.includes('name') || label.includes('person') || label.includes('relation')) {
      return false;
    }
    return key.includes('phone') || key.includes('mobile') || key.includes('contact_no') ||
           key.includes('contact_number') || key.includes('contactnumber') ||
           label.includes('phone') || label.includes('mobile') || label.includes('contact number') ||
           label.includes('contact no');
  }

  isNameField(field: any): boolean {
    if (this.isPhoneField(field)) return false;
    const key = (field.key || '').toLowerCase();
    const label = (field.label || '').toLowerCase();
    if (key.includes('email') || key.includes('address') || label.includes('email') || label.includes('address')) {
      return false;
    }
    return key.includes('name') || key.includes('person') || key.includes('relative') ||
           key.includes('father') || key.includes('mother') || key.includes('spouse') || key.includes('guardian') ||
           label.includes('name') || label.includes('person') || label.includes('relative') ||
           label.includes('father') || label.includes('mother') || label.includes('spouse') || label.includes('guardian');
  }

  validateAndProceedToRequirements(): void {
    this.formErrors = {};

    // Validate purpose
    const purposeVal = this.formData['purpose'];
    if (!purposeVal || !String(purposeVal).trim()) {
      this.formErrors['purpose'] = 'Purpose of request is required.';
    }

    // Validate dynamic service fields
    const svc = this.selectedService();
    if (svc?.form_fields) {
      for (const field of svc.form_fields) {
        const val = this.formData[field.key];
        const isEmpty = val === undefined || val === null || String(val).trim() === '';

        if (isEmpty) {
          if (field.required) {
            this.formErrors[field.key] = `${field.label || field.key} is required.`;
          }
          continue;
        }

        const valStr = String(val).trim();

        // Phone validation
        if (this.isPhoneField(field)) {
          const cleanPhone = valStr.replace(/[\s\-()]/g, '');
          if (!/^(09\d{9}|\+639\d{9})$/.test(cleanPhone)) {
            this.formErrors[field.key] = `${field.label || field.key} must be a valid 11-digit contact number (e.g. 09123456789).`;
          }
        }

        // Name validation
        if (this.isNameField(field)) {
          if (!/^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\-\.\']+$/.test(valStr)) {
            this.formErrors[field.key] = `${field.label || field.key} must contain letters only.`;
          }
        }

        // Email validation
        if (field.type === 'email' || field.key.toLowerCase().includes('email') || (field.label && field.label.toLowerCase().includes('email'))) {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valStr)) {
            this.formErrors[field.key] = `${field.label || field.key} must be a valid email address.`;
          }
        }
      }
    }

    if (Object.keys(this.formErrors).length > 0) {
      return;
    }

    this.updateCompositeAddress();
    this.proceedToStep(2);
  }

  validateAndProceedFromRequirements(): void {
    const svc = this.selectedService();
    const reqs = svc?.requirements || [];
    const uploaded = this.uploadedRequirements();
    const errors = this.reqErrors();

    // Block if active validation errors exist
    if (Object.keys(errors).length > 0) {
      return;
    }

    // Check each mandatory requirement
    if (reqs.length > 0) {
      for (const req of reqs) {
        const isUploaded = uploaded.some(u => u.requirement_name === req);
        if (!isUploaded) {
          this.setReqError(req, `Please upload a valid ${req} before proceeding.`);
          return;
        }
      }
    }

    if (this.isPaidService()) {
      this.proceedToStep(3);
    } else {
      this.proceedToStep(4);
    }
  }

  validateAndProceedFromPayment(): void {
    this.paymentErrors = {};

    const ref = this.paymentRefNumber.trim();
    if (!ref) {
      this.paymentErrors['reference_number'] = 'Please enter your GCash Reference Number.';
    } else if (ref.length < 6) {
      this.paymentErrors['reference_number'] = 'Please enter a valid GCash Reference Number.';
    }

    if (!this.uploadedReceipt()) {
      this.paymentErrors['receipt'] = 'Please upload a screenshot or photo of your GCash payment receipt.';
    }

    if (Object.keys(this.paymentErrors).length > 0) {
      return;
    }

    // Update receipt object with current ref number
    const r = this.uploadedReceipt();
    if (r) {
      r.reference_number = ref;
    }

    this.proceedToStep(4);
  }

  submitOnlineRequest(): void {
    const svc = this.selectedService();
    if (!svc) return;

    this.submitting.set(true);
    this.submissionError.set(null);

    const idempotencyKey = 'portal-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);

    // Prepare complete form_data package
    const payloadFormData: Record<string, any> = { ...this.formData };

    if (this.isPaidService()) {
      const receipt = this.uploadedReceipt();
      const refNum = this.paymentRefNumber.trim();
      payloadFormData['_receipt'] = receipt;
      payloadFormData['_payment'] = {
        method: 'GCash',
        amount: svc.processing_fee,
        reference_number: refNum,
        receipt_url: receipt?.file_url || null,
        paid_at: new Date().toISOString()
      };
      payloadFormData['gcash_reference_number'] = refNum;
      payloadFormData['payment_method'] = 'GCash';
    }

    this.portalService.submitRequest({
      service_id: svc.service_id,
      form_data: payloadFormData,
      requirements: this.uploadedRequirements(),
      photo: this.uploadedPhotoUrl() || undefined,
      idempotency_key: idempotencyKey
    }).subscribe({
      next: (res: ApiResponse<any>) => {
        this.submitting.set(false);
        this.submittedResult.set(res.data);
        this.proceedToStep(5);
      },
      error: (err: any) => {
        this.submitting.set(false);
        this.submissionError.set(err?.error?.message || 'Failed to submit request. Please try again.');
      }
    });
  }
}
