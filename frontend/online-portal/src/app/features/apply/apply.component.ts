import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  PortalService,
  Service,
  UploadedRequirement,
  FormField
} from '../../core/services/portal.service';
import { AuthService } from '../../core/services/auth.service';

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
              <div class="mt-6 space-y-4">
                @for (reqName of svc.requirements; track reqName; let idx = $index) {
                  <div class="rounded-2xl border border-slate-200 p-5 bg-slate-50/50">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-wide">Requirement #{{ idx + 1 }}</p>
                        <h3 class="text-base font-bold text-slate-900">{{ reqName }}</h3>
                      </div>

                      <!-- Uploaded Status or Upload Button -->
                      @if (getUploadedReq(reqName); as uploaded) {
                        <div class="flex items-center gap-3 bg-white border border-emerald-300 rounded-xl px-3 py-1.5 shadow-2xs">
                          <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div class="text-left text-xs min-w-0 max-w-[200px]">
                            <p class="font-bold text-slate-800 truncate">{{ uploaded.original_name }}</p>
                            <p class="text-[10px] text-slate-400">{{ formatSize(uploaded.size) }}</p>
                          </div>
                          <button
                            type="button"
                            (click)="removeUploadedReq(reqName)"
                            class="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer ml-1">
                            Remove
                          </button>
                        </div>
                      } @else {
                        <div>
                          <label [for]="'file-upload-' + idx"
                                 class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-orange-500 text-slate-700 font-bold text-xs transition cursor-pointer shadow-2xs">
                            <svg class="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                            <span>Upload Document</span>
                          </label>
                          <input
                            [id]="'file-upload-' + idx"
                            type="file"
                            accept=".pdf,image/jpeg,image/png"
                            class="sr-only"
                            (change)="onFileSelected($event, reqName)"
                          />
                        </div>
                      }
                    </div>

                    @if (uploadingReq() === reqName) {
                      <div class="mt-3 flex items-center gap-2 text-xs text-orange-600">
                        <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                        <span>Uploading file...</span>
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
            <h2 class="text-xl sm:text-2xl font-black text-slate-900">Application Information</h2>
            <p class="text-slate-500 text-sm mt-0.5">
              Your verified Barangay ID information is prefilled. Specify your request purpose and any required details.
            </p>

            <!-- Pre-filled Resident Profile Summary Card -->
            <div class="mt-5 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-xs sm:text-sm grid sm:grid-cols-3 gap-3">
              <div>
                <span class="text-slate-400 text-[11px] uppercase font-bold block">Applicant Name</span>
                <span class="font-bold text-slate-900">{{ residentFullName() }}</span>
              </div>
              <div>
                <span class="text-slate-400 text-[11px] uppercase font-bold block">Barangay Resident ID</span>
                <span class="font-bold text-slate-900">{{ auth.currentUser()?.resident_code || 'BSM-RESIDENT' }}</span>
              </div>
              <div>
                <span class="text-slate-400 text-[11px] uppercase font-bold block">Contact / Address</span>
                <span class="font-bold text-slate-900 truncate block">{{ auth.currentUser()?.contact_number || 'N/A' }} &bull; {{ auth.currentUser()?.address_line || 'San Manuel' }}</span>
              </div>
            </div>

            <!-- Purpose Field (Core requirement) -->
            <div class="mt-6">
              <label for="req-purpose" class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Purpose of Request <span class="text-red-500">*</span>
              </label>
              <textarea
                id="req-purpose"
                rows="3"
                [(ngModel)]="formData['purpose']"
                placeholder="e.g. Employment requirement, Bank account opening, Scholarship, Postal ID application..."
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition">
              </textarea>
              @if (formErrors['purpose']) {
                <p class="text-xs text-red-600 mt-1 font-semibold">{{ formErrors['purpose'] }}</p>
              }
            </div>

            <!-- Dynamic Service Fields (if configured) -->
            @if (svc.form_fields && svc.form_fields.length > 0) {
              <div class="mt-6 space-y-4">
                <h3 class="text-xs font-black uppercase tracking-wider text-slate-400">Additional Service Fields</h3>
                @for (field of svc.form_fields; track field.key) {
                  @if (field.key !== 'full_name' && field.key !== 'address' && field.key !== 'contact_number' && field.key !== 'birth_date' && field.key !== 'purpose') {
                    <div>
                      <label [for]="'field-' + field.key" class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        {{ field.label || field.key }}
                        @if (field.required) { <span class="text-red-500">*</span> }
                      </label>

                      @if (field.type === 'select') {
                        <select
                          [id]="'field-' + field.key"
                          [(ngModel)]="formData[field.key]"
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
                          [placeholder]="field.placeholder || ''"
                          class="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition">
                        </textarea>
                      } @else {
                        <input
                          [id]="'field-' + field.key"
                          [type]="field.type || 'text'"
                          [(ngModel)]="formData[field.key]"
                          [placeholder]="field.placeholder || ''"
                          class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                        />
                      }

                      @if (formErrors[field.key]) {
                        <p class="text-xs text-red-600 mt-1 font-semibold">{{ formErrors[field.key] }}</p>
                      }
                    </div>
                  }
                }
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

            <!-- Review Summary Card -->
            <div class="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6 space-y-4">
              <div class="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span class="text-xs font-bold text-slate-400 uppercase">Service Requested</span>
                  <h3 class="text-lg font-black text-slate-900 uppercase">{{ svc.service_name }}</h3>
                </div>
                <div class="text-right">
                  <span class="text-xs font-bold text-slate-400 uppercase">Processing Fee</span>
                  <p class="text-lg font-black text-orange-600">
                    {{ (svc.processing_fee || 0) > 0 ? ('₱' + (svc.processing_fee | number:'1.2-2')) : 'FREE' }}
                  </p>
                </div>
              </div>

              <div class="grid sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div>
                  <span class="font-bold text-slate-400 uppercase text-[11px] block">Resident Applicant</span>
                  <span class="font-bold text-slate-800">{{ residentFullName() }}</span>
                </div>
                <div>
                  <span class="font-bold text-slate-400 uppercase text-[11px] block">Portal Account ID</span>
                  <span class="font-bold text-slate-800">{{ auth.currentUser()?.account_id }}</span>
                </div>
                <div class="sm:col-span-2">
                  <span class="font-bold text-slate-400 uppercase text-[11px] block">Purpose</span>
                  <p class="text-slate-800 mt-0.5 leading-relaxed">{{ formData['purpose'] }}</p>
                </div>
              </div>

              <!-- Uploaded Requirements List -->
              <div class="border-t border-slate-200 pt-3">
                <span class="font-bold text-slate-400 uppercase text-[11px] block mb-2">Attached Digital Requirements</span>
                @if (uploadedRequirements().length === 0) {
                  <p class="text-xs text-slate-500 italic">No files attached.</p>
                } @else {
                  <ul class="space-y-1.5">
                    @for (file of uploadedRequirements(); track file.requirement_name) {
                      <li class="flex items-center justify-between text-xs bg-white border border-slate-200 rounded-lg p-2.5">
                        <span class="font-bold text-slate-800">{{ file.requirement_name }}</span>
                        <span class="text-slate-500">{{ file.original_name }}</span>
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
                  <span>Confirm & Submit Request</span>
                }
              </button>
            </div>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- STEP 4: SUBMISSION CONFIRMATION -->
        <!-- ========================================================================= -->
        @if (wizardStep() === 4 && submittedResult(); as res) {
          <div class="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-xs text-center py-10">
            <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>

            <h2 class="text-2xl sm:text-3xl font-black text-slate-900 mt-4">Document Request Submitted!</h2>
            <p class="text-slate-500 text-sm mt-1 max-w-md mx-auto">
              Your online document request has been received by Barangay San Manuel staff for review and processing.
            </p>

            <!-- Request Number Box -->
            <div class="mt-6 inline-block bg-orange-50 border border-orange-200 rounded-2xl p-5 px-8">
              <span class="text-xs font-bold text-orange-700 uppercase tracking-widest block">Your Request Number</span>
              <span class="text-2xl sm:text-3xl font-black font-mono text-slate-900 mt-1 block">
                {{ res.request_number }}
              </span>
              <span class="text-xs text-slate-500 mt-1 block">Save or take note of this reference number.</span>
            </div>

            <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a routerLink="/requests"
                 class="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-sm transition">
                View in My Requests
              </a>
              <a routerLink="/services"
                 class="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-bold text-sm transition">
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
  uploadedRequirements = signal<UploadedRequirement[]>([]);
  uploadingReq = signal<string | null>(null);

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

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
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
      next: (res) => {
        const list = Array.isArray(res?.data) ? res.data : [];
        const match = list.find(s => s.service_id === serviceId && s.is_active !== false);
        if (!match) {
          this.loadingService.set(false);
          this.router.navigate(['/services']);
          return;
        }

        this.selectedService.set(match);
        this.initFormData();

        if (isReuse) {
          this.portalService.getPreviousServiceData(serviceId).subscribe({
            next: (dataRes) => {
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

  private initFormData(): void {
    const u = this.auth.currentUser();
    this.formData = {
      full_name: this.residentFullName(),
      address: u?.address_line || 'San Manuel',
      contact_number: u?.contact_number || '',
      email: u?.email || ''
    };
  }

  proceedToStep(step: number): void {
    this.wizardStep.set(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onFileSelected(event: Event, reqName: string): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds the 10MB limit. Please upload a smaller file.');
      return;
    }

    this.uploadingReq.set(reqName);
    this.portalService.uploadRequirement(file).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const uploaded: UploadedRequirement = {
            requirement_name: reqName,
            file_url: res.data.file_url,
            file_name: res.data.file_name,
            original_name: res.data.original_name,
            size: res.data.size,
            mime_type: res.data.mime_type
          };
          const current = this.uploadedRequirements().filter(r => r.requirement_name !== reqName);
          this.uploadedRequirements.set([...current, uploaded]);
        }
        this.uploadingReq.set(null);
      },
      error: (err) => {
        alert(err?.error?.message || 'Failed to upload document. Please try again.');
        this.uploadingReq.set(null);
      }
    });
  }

  getUploadedReq(reqName: string): UploadedRequirement | undefined {
    return this.uploadedRequirements().find(r => r.requirement_name === reqName);
  }

  removeUploadedReq(reqName: string): void {
    this.uploadedRequirements.set(
      this.uploadedRequirements().filter(r => r.requirement_name !== reqName)
    );
  }

  formatSize(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  validateAndProceedToReview(): void {
    this.formErrors = {};
    if (!this.formData['purpose'] || !this.formData['purpose'].trim()) {
      this.formErrors['purpose'] = 'Purpose is required.';
    }

    const svc = this.selectedService();
    if (svc?.form_fields) {
      for (const field of svc.form_fields) {
        if (field.required && !['full_name', 'address', 'contact_number', 'birth_date', 'purpose'].includes(field.key)) {
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
      idempotency_key: idempotencyKey
    }).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.submittedResult.set(res.data);
        this.proceedToStep(4);
      },
      error: (err) => {
        this.submitting.set(false);
        this.submissionError.set(err?.error?.message || 'Failed to submit request. Please try again.');
      }
    });
  }
}
