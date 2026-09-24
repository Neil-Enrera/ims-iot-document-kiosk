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
            Account: <strong class="text-slate-700">{{ auth.currentUser()?.account_id }}</strong>
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
                @if (svc.processing_fee > 0) {
                  ₱{{ svc.processing_fee | number:'1.2-2' }}
                } @else {
                  FREE
                }
              </span>
            </div>
          </div>
        </div>

        <!-- Wizard Progress Bar (Steps 1 to 3) -->
        @if (wizardStep() <= 3) {
          <div class="mb-8">
            <div class="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2">
              <span [class.text-orange-600]="wizardStep() >= 1" [class.text-slate-400]="wizardStep() < 1">
                1. Upload Requirements
              </span>
              <span [class.text-orange-600]="wizardStep() >= 2" [class.text-slate-400]="wizardStep() < 2">
                2. Application Form
              </span>
              <span [class.text-orange-600]="wizardStep() >= 3" [class.text-slate-400]="wizardStep() < 3">
                3. Review & Submit
              </span>
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
        <!-- STEP 1: UPLOAD / REVIEW REQUIREMENTS -->
        <!-- ========================================================================= -->
        @if (wizardStep() === 1) {
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
                <p class="text-xs mt-1 text-emerald-800">You may proceed directly to the application form.</p>
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
                              <span>2×2 ID Photo Format Checklist:</span>
                            </p>
                            <ul class="list-disc list-inside text-[11px] text-slate-600 space-y-0.5 pl-1">
                              <li>Square 1:1 aspect ratio (min 300 × 300 px)</li>
                              <li>Plain white or light background</li>
                              <li>Front-facing, centered with neutral expression</li>
                              <li>No eyeglasses, colored lenses, or hats obscuring the face</li>
                            </ul>
                          </div>
                        }
                      </div>

                      <!-- Uploaded Status or Upload Button -->
                      @if (getUploadedReq(reqName); as uploaded) {
                        <div class="flex items-center gap-3 bg-white border border-emerald-300 rounded-xl p-2.5 shadow-2xs shrink-0">
                          @if (is2x2PhotoReq(reqName)) {
                            <img [src]="uploaded.file_url" alt="Uploaded 2x2 ID Photo"
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
                            [accept]="is2x2PhotoReq(reqName) ? 'image/jpeg,image/png,image/webp' : '.pdf,image/jpeg,image/png'"
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
              <a routerLink="/services"
                 class="px-5 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-700 font-bold text-sm transition cursor-pointer">
                Cancel
              </a>
              <button
                type="button"
                (click)="proceedToStep(2)"
                class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-sm transition cursor-pointer">
                <span>Continue to Application Form</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- STEP 2: APPLICATION FORM -->
        <!-- ========================================================================= -->
        @if (wizardStep() === 2) {
          <div class="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
              <div>
                <h2 class="text-xl sm:text-2xl font-black text-slate-900">Application Information</h2>
                <p class="text-slate-500 text-sm mt-0.5">
                  Your registered resident profile and address are automatically populated. Review and adjust any details for this request.
                </p>
              </div>
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shrink-0 self-start sm:self-auto">
                <svg class="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span>Profile Auto-Filled</span>
              </span>
            </div>

            <!-- Pre-filled Resident Profile Summary Card -->
            <div class="mt-5 rounded-2xl bg-slate-50/70 border border-slate-200 p-4 sm:p-5 text-xs sm:text-sm">
              <div class="grid sm:grid-cols-3 gap-4">
                <div>
                  <span class="text-slate-400 text-[11px] uppercase font-bold block">Applicant Name</span>
                  <span class="font-bold text-slate-900">{{ residentFullName() }}</span>
                </div>
                <div>
                  <span class="text-slate-400 text-[11px] uppercase font-bold block">Barangay Resident ID</span>
                  <span class="font-bold text-slate-900 font-mono">{{ auth.currentUser()?.resident_code || 'BSM-RESIDENT' }}</span>
                </div>
                <div>
                  <span class="text-slate-400 text-[11px] uppercase font-bold block">Contact / Email</span>
                  <span class="font-bold text-slate-900 truncate block">{{ auth.currentUser()?.contact_number || 'N/A' }} &bull; {{ auth.currentUser()?.email || 'N/A' }}</span>
                </div>
              </div>

              <div class="mt-3 pt-3 border-t border-slate-200/60 grid sm:grid-cols-2 gap-3">
                <div>
                  <span class="text-slate-400 text-[11px] uppercase font-bold block">Registered Address</span>
                  <span class="font-medium text-slate-800">{{ auth.currentUser()?.address_line || 'Barangay San Manuel, Tarlac' }}</span>
                </div>
                <div>
                  <span class="text-slate-400 text-[11px] uppercase font-bold block">Demographics</span>
                  <span class="font-medium text-slate-800">
                    {{ auth.currentUser()?.civil_status || 'Civil Status N/A' }} &bull;
                    {{ auth.currentUser()?.gender || 'Gender N/A' }}
                    @if (auth.currentUser()?.birth_date) {
                      &bull; Born {{ formatDateDisplay(auth.currentUser()?.birth_date) }}
                    }
                  </span>
                </div>
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
              <button
                type="button"
                (click)="proceedToStep(1)"
                class="px-5 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-700 font-bold text-sm transition cursor-pointer">
                &larr; Back to Requirements
              </button>
              <button
                type="button"
                (click)="validateAndProceedToReview()"
                class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-sm transition cursor-pointer">
                <span>Review Application</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- STEP 3: REVIEW & SUBMIT -->
        <!-- ========================================================================= -->
        @if (wizardStep() === 3) {
          <div class="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
            <h2 class="text-xl sm:text-2xl font-black text-slate-900">Review & Confirm Request</h2>
            <p class="text-slate-500 text-sm mt-0.5">Please check your details before submitting your request to the barangay.</p>

            <div class="mt-6 rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-4">
              <!-- Service & Fee Breakdown -->
              <div class="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span class="text-xs font-bold text-slate-400 uppercase tracking-wide">Selected Service</span>
                  <p class="font-black text-slate-900 text-base">{{ svc.service_name }}</p>
                </div>
                <div class="text-right">
                  <span class="text-xs font-bold text-slate-400 uppercase tracking-wide">Fee</span>
                  <p class="font-black text-orange-600 text-base">
                    @if (svc.processing_fee > 0) {
                      ₱{{ svc.processing_fee | number:'1.2-2' }}
                    } @else {
                      FREE
                    }
                  </p>
                </div>
              </div>

              <!-- Resident & Address Summary -->
              <div class="grid sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span class="font-bold text-slate-400 uppercase text-[11px] block">Applicant Name</span>
                  <p class="text-slate-800 font-bold mt-0.5">{{ residentFullName() }}</p>
                </div>
                <div>
                  <span class="font-bold text-slate-400 uppercase text-[11px] block">Resident Code / Account</span>
                  <p class="text-slate-800 font-bold mt-0.5 font-mono">{{ auth.currentUser()?.resident_code || 'RES-00000' }} &bull; {{ auth.currentUser()?.account_id }}</p>
                </div>
                <div class="sm:col-span-2">
                  <span class="font-bold text-slate-400 uppercase text-[11px] block">Delivery / Registered Address</span>
                  <p class="text-slate-800 font-semibold mt-0.5">{{ formData['address'] || auth.currentUser()?.address_line }}</p>
                </div>
                <div class="sm:col-span-2">
                  <span class="font-bold text-slate-400 uppercase text-[11px] block">Purpose</span>
                  <p class="text-slate-800 mt-0.5 leading-relaxed font-semibold">{{ formData['purpose'] }}</p>
                </div>
              </div>

              <!-- Dynamic Service Field Entries -->
              @if (getReviewFields().length > 0) {
                <div class="border-t border-slate-200 pt-3">
                  <span class="font-bold text-slate-400 uppercase text-[11px] block mb-2">Service Details</span>
                  <div class="grid sm:grid-cols-2 gap-3 text-xs">
                    @for (item of getReviewFields(); track item.label) {
                      <div class="bg-white border border-slate-200 rounded-lg p-2.5">
                        <span class="text-slate-400 block font-bold text-[10px] uppercase">{{ item.label }}</span>
                        <span class="font-bold text-slate-800 mt-0.5 block">{{ item.value }}</span>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Uploaded Requirements List -->
              <div class="border-t border-slate-200 pt-3">
                <span class="font-bold text-slate-400 uppercase text-[11px] block mb-2">Attached Digital Requirements</span>
                @if (uploadedRequirements().length === 0) {
                  <p class="text-xs text-slate-500 italic">No files attached (not required for this service).</p>
                } @else {
                  <ul class="space-y-2">
                    @for (file of uploadedRequirements(); track file.requirement_name) {
                      <li class="flex items-center justify-between text-xs bg-white border border-slate-200 rounded-xl p-2.5">
                        <div class="flex items-center gap-2.5 min-w-0">
                          @if (is2x2PhotoReq(file.requirement_name)) {
                            <img [src]="file.file_url" alt="Photo" class="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0" />
                          } @else {
                            <svg class="w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                          }
                          <div class="min-w-0">
                            <span class="font-bold text-slate-800 block truncate">{{ file.requirement_name }}</span>
                            <span class="text-slate-400 font-mono text-[10px] block truncate">{{ file.original_name }}</span>
                          </div>
                        </div>
                        <span class="text-emerald-600 font-bold text-xs shrink-0">Attached</span>
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
                (click)="proceedToStep(2)"
                class="px-5 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-700 font-bold text-sm transition cursor-pointer">
                &larr; Back to Edit
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
        <!-- STEP 4: CONFIRMATION -->
        <!-- ========================================================================= -->
        @if (wizardStep() === 4) {
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
              Barangay personnel will review your application and digital requirements. You can track status updates in your resident dashboard.
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
                  <div class="flex justify-between">
                    <span class="text-slate-400">Status:</span>
                    <span class="font-bold text-amber-600">Pending Staff Review</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400">Submitted:</span>
                    <span class="font-semibold text-slate-800">{{ res.requests?.[0]?.created_at | date:'mediumDate' }}</span>
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
    </div>
  `
})
export class ApplyComponent implements OnInit {
  private portalService = inject(PortalService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public auth = inject(AuthService);

  loadingService = signal<boolean>(true);
  selectedService = signal<Service | null>(null);
  wizardStep = signal<number>(1);

  formData: Record<string, any> = {};
  formErrors: Record<string, string> = {};
  reqErrors = signal<Record<string, string>>({});
  uploadedRequirements = signal<UploadedRequirement[]>([]);
  uploadingReq = signal<string | null>(null);
  uploadedPhotoUrl = signal<string | null>(null);

  submitting = signal<boolean>(false);
  submissionError = signal<string | null>(null);
  submittedResult = signal<any | null>(null);

  residentFullName = computed(() => {
    const u = this.auth.currentUser();
    if (!u) return 'Resident';
    return [u.first_name, u.middle_name, u.last_name, u.suffix].filter(Boolean).join(' ');
  });

  wizardProgress = computed(() => {
    return Math.min(100, Math.round((this.wizardStep() / 3) * 100));
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
      if (!defaults['municipality']) defaults['municipality'] = r.municipality || 'Tarlac City';
      if (!defaults['province']) defaults['province'] = r.province || 'Tarlac';
      if (!defaults['zip_code']) defaults['zip_code'] = r.zip_code || '2300';

      // 5. Fallback regex address parsing
      if (r.address_line) {
        if (!defaults['block']) defaults['block'] = this.extractBlock(r.address_line);
        if (!defaults['lot']) defaults['lot'] = this.extractLot(r.address_line);
        if (!defaults['street']) defaults['street'] = this.extractStreet(r.address_line);
        if (!defaults['subdivision']) defaults['subdivision'] = this.extractSubdivision(r.address_line);
        if (!defaults['purok_zone']) defaults['purok_zone'] = this.extractPurok(r.address_line);
      }

      // 6. Unified Address Line
      if (!defaults['address']) defaults['address'] = r.address_line || 'Barangay San Manuel, Tarlac';
      if (!defaults['address_line']) defaults['address_line'] = r.address_line || 'Barangay San Manuel, Tarlac';
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
      return r.municipality || 'Tarlac City';
    }
    if (key === 'province' || label.includes('province')) {
      return r.province || 'Tarlac';
    }
    if (key === 'zipcode' || key === 'postalcode' || label.includes('zipcode') || label.includes('postalcode')) {
      return r.zip_code || '2300';
    }
    if (key === 'address' || key === 'completeaddress' || key === 'addressline' || label.includes('address')) {
      return r.address_line || 'Barangay San Manuel, Tarlac';
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

  /**
   * Synchronizes composite address whenever individual components change.
   */
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

  getReviewFields(): { label: string; value: any }[] {
    const list: { label: string; value: any }[] = [];
    const svc = this.selectedService();
    if (!svc) return list;

    for (const field of svc.form_fields || []) {
      if ((field.key || '').toLowerCase() === 'purpose') continue;
      const val = this.formData[field.key];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        list.push({ label: field.label || field.key, value: val });
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

  onFileSelected(event: Event, reqName: string): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.clearReqError(reqName);

    // 1. General file size check
    if (file.size > 10 * 1024 * 1024) {
      this.setReqError(reqName, 'File size exceeds the 10MB limit. Please upload a smaller file.');
      return;
    }

    // 2. Specialized 2x2 ID Photo Validation
    if (this.is2x2PhotoReq(reqName)) {
      if (!file.type.startsWith('image/')) {
        this.setReqError(reqName, 'Invalid file format. 2×2 ID photos must be an image file (JPG, PNG, WEBP), not a document.');
        return;
      }

      if (file.size < 20 * 1024) {
        this.setReqError(reqName, 'Image file is too small or corrupted (less than 20KB). Please upload a clear photo.');
        return;
      }

      // Read image dimensions & aspect ratio
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          const width = img.naturalWidth;
          const height = img.naturalHeight;
          const ratio = width / height;

          // Aspect ratio validation (1:1 square with 15% tolerance)
          if (ratio < 0.85 || ratio > 1.15) {
            this.setReqError(
              reqName,
              `Invalid photo aspect ratio (${width}×${height}px). A 2×2 ID photo must be square (1:1 aspect ratio). Please crop or upload a 2×2 square image.`
            );
            return;
          }

          // Resolution validation (at least 300x300px)
          if (width < 300 || height < 300) {
            this.setReqError(
              reqName,
              `Photo resolution is too low (${width}×${height}px). 2×2 ID photos must be at least 300×300px for clear ID printing.`
            );
            return;
          }

          // Valid image -> proceed with upload
          this.performUpload(file, reqName, true);
        };
        img.onerror = () => {
          this.setReqError(reqName, 'Unable to process image file. It may be corrupted.');
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      // Non-photo digital requirement upload
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

  validateAndProceedToReview(): void {
    this.formErrors = {};

    // Validate purpose
    const purposeVal = this.formData['purpose'];
    if (!purposeVal || !String(purposeVal).trim()) {
      this.formErrors['purpose'] = 'Purpose of request is required.';
    }

    // Validate any required service fields
    const svc = this.selectedService();
    if (svc?.form_fields) {
      for (const field of svc.form_fields) {
        if (field.required) {
          const val = this.formData[field.key];
          if (val === undefined || val === null || String(val).trim() === '') {
            this.formErrors[field.key] = `${field.label || field.key} is required.`;
          }
        }
      }
    }

    if (Object.keys(this.formErrors).length > 0) {
      return;
    }

    this.updateCompositeAddress();
    this.proceedToStep(3);
  }

  submitOnlineRequest(): void {
    const svc = this.selectedService();
    if (!svc) return;

    this.submitting.set(true);
    this.submissionError.set(null);

    const idempotencyKey = 'portal-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);

    this.portalService.submitRequest({
      service_id: svc.service_id,
      form_data: this.formData,
      requirements: this.uploadedRequirements(),
      photo: this.uploadedPhotoUrl() || undefined,
      idempotency_key: idempotencyKey
    }).subscribe({
      next: (res: ApiResponse<any>) => {
        this.submitting.set(false);
        this.submittedResult.set(res.data);
        this.proceedToStep(4);
      },
      error: (err: any) => {
        this.submitting.set(false);
        this.submissionError.set(err?.error?.message || 'Failed to submit request. Please try again.');
      }
    });
  }
}
