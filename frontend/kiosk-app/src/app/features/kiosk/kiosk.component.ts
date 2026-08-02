import { Component, OnInit, OnDestroy, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KioskService, Resident, Service } from './kiosk.service';
import { IdentificationService } from './identification.service';
import { ButtonComponent } from './button.component';

export type KioskMode = 'home' | 'documents' | 'barangay';

export type DocStep = 
  | 'search'     // 0: find resident
  | 'loading'    // 1: loading resident
  | 'welcome'    // 2: show resident info
  | 'services'   // 3: select service
  | 'requirements' // 4: show service requirements
  | 'form'       // 5: dynamic form
  | 'photo'      // 6: capture photo
  | 'review'     // 7: review & confirm
  | 'success';   // 8: success

export type BarangayStep = 
  | 'form'       // 0: application form
  | 'photo'      // 1: capture photo
  | 'review'     // 2: review & confirm
  | 'success';   // 3: success

@Component({
  selector: 'app-kiosk',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white select-none flex">

      <!-- MAIN KIOSK AREA -->
      <div class="flex-1 relative">

        <!-- ============ HOME: Landing / identification method ============ -->
        @if (mode() === 'home') {
          <div class="absolute inset-0 flex flex-col items-center justify-center p-8">
            <div class="text-center max-w-2xl w-full">
              <div class="mb-6">
                <svg class="w-24 h-24 mx-auto text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h1 class="text-3xl font-bold mb-2">Barangay San Manuel</h1>
              <p class="text-lg text-blue-200 mb-8">Document Request Kiosk</p>

              <div class="grid grid-cols-1 gap-4">
                <button class="w-full bg-blue-600 hover:bg-blue-500 rounded-2xl p-6 flex items-center gap-4 text-left transition-all border-2 border-blue-400"
                        (click)="startBarangay()">
                  <div class="w-14 h-14 bg-blue-900 rounded-xl flex items-center justify-center shrink-0">
                    <svg class="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z"/>
                    </svg>
                  </div>
                  <div class="flex-1">
                    <p class="text-xl font-bold">Barangay ID</p>
                    <p class="text-blue-200 text-sm">Apply for a new Barangay ID card</p>
                  </div>
                  <svg class="w-8 h-8 text-blue-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </button>

                <button class="w-full bg-blue-800/50 hover:bg-blue-700/50 rounded-2xl p-6 flex items-center gap-4 text-left transition-all border-2 border-blue-700"
                        (click)="startDocuments()">
                  <div class="w-14 h-14 bg-blue-900 rounded-xl flex items-center justify-center shrink-0">
                    <svg class="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
                    </svg>
                  </div>
                  <div class="flex-1">
                    <p class="text-xl font-bold">Find Your Record</p>
                    <p class="text-blue-200 text-sm">Request documents using your existing record</p>
                  </div>
                  <svg class="w-8 h-8 text-blue-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>

              @if (identificationService.isTemporarySearch) {
                <div class="mt-6 bg-yellow-500/15 border border-yellow-400 rounded-xl px-4 py-3 text-left">
                  <p class="text-yellow-200 text-xs font-medium">Temporary Development Method</p>
                  <p class="text-yellow-200/80 text-xs mt-1">
                    RFID scanner not installed yet. Use "Find Your Record" to search your existing account.
                  </p>
                </div>
              }

              @if (errorMessage()) {
                <div class="mt-6 bg-red-500/20 border border-red-400 rounded-xl p-4">
                  <p class="text-red-200">{{ errorMessage() }}</p>
                </div>
              }
            </div>
          </div>
        }

        <!-- ============ DOCUMENTS: Find Your Record workflow ============ -->
        @if (mode() === 'documents') {

          <!-- DOC STEP 0: Search Resident -->
          @if (currentStep() === 'search') {
            <div class="absolute inset-0 flex flex-col items-center justify-center p-8">
              <div class="max-w-lg w-full">
                <div class="flex items-center justify-between mb-6">
                  <div>
                    <h2 class="text-2xl font-bold">Find Your Record</h2>
                    <p class="text-blue-300 text-sm mt-1">Search for an existing account</p>
                  </div>
                  <button class="text-blue-300 hover:text-white text-lg" (click)="goBack()">Back</button>
                </div>

                @if (identificationService.isTemporarySearch) {
                  <div class="mb-4 bg-yellow-500/15 border border-yellow-400 rounded-xl px-4 py-3">
                    <p class="text-yellow-200 text-sm font-medium">Temporary Development Method</p>
                    <p class="text-yellow-200/80 text-xs mt-1">
                      RFID scanner not installed yet. Search your name to continue.
                    </p>
                  </div>
                }

                <div class="bg-blue-800/50 rounded-2xl p-6 backdrop-blur">
                  <p class="text-blue-300 text-sm mb-4">Type your name or resident code to begin</p>

                  <div class="relative">
                    <input
                      type="text"
                      [(ngModel)]="searchQuery"
                      (ngModelChange)="onSearchChange($event)"
                      placeholder="Search by name or code..."
                      class="w-full bg-white text-gray-800 rounded-xl px-5 py-4 text-lg placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-400"
                      autofocus
                    />
                    @if (searchQuery) {
                      <button class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              (click)="clearSearch()">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    }
                  </div>

                  @if (searchResults().length > 0) {
                    <div class="mt-4 bg-white rounded-xl overflow-hidden text-left max-h-72 overflow-y-auto">
                      @for (r of searchResults(); track r.resident_id) {
                        <button class="w-full px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-0 flex items-center gap-3 transition-colors"
                                (click)="selectResident(r)">
                          @if (r.photo) {
                            <img [src]="r.photo" class="w-10 h-10 rounded-full object-cover" />
                          } @else {
                            <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                              {{ r.first_name.charAt(0) }}{{ r.last_name.charAt(0) }}
                            </div>
                          }
                          <div class="flex-1 min-w-0">
                            <p class="font-medium text-gray-800 truncate">{{ r.first_name }} {{ r.last_name }}</p>
                            <p class="text-xs text-gray-500 truncate">{{ r.address_line }}</p>
                          </div>
                          <span class="text-xs text-gray-400">{{ r.resident_code }}</span>
                        </button>
                      }
                    </div>
                  }

                  @if (searchQuery && searchQuery.length >= 2 && !searching() && searchResults().length === 0) {
                    <p class="mt-4 text-blue-300 text-sm">No residents found. Try a different search.</p>
                  }

                  @if (searching()) {
                    <div class="mt-4 flex items-center justify-center gap-2 text-blue-300">
                      <div class="animate-spin w-5 h-5 border-2 border-blue-300 border-t-transparent rounded-full"></div>
                      <span class="text-sm">Searching...</span>
                    </div>
                  }
                </div>

                @if (errorMessage()) {
                  <div class="mt-6 bg-red-500/20 border border-red-400 rounded-xl p-4">
                    <p class="text-red-200">{{ errorMessage() }}</p>
                  </div>
                }
              </div>
            </div>
          }

          <!-- DOC STEP 1: Loading -->
          @if (currentStep() === 'loading') {
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <div class="animate-spin w-16 h-16 border-4 border-blue-300 border-t-transparent rounded-full mb-6"></div>
              <p class="text-xl text-blue-200">Loading your information...</p>
            </div>
          }

          <!-- DOC STEP 2: Welcome / Resident Info -->
          @if (currentStep() === 'welcome' && resident()) {
            <div class="absolute inset-0 flex flex-col items-center justify-center p-8">
              <div class="max-w-lg w-full">
                <div class="bg-blue-800/50 rounded-2xl p-8 backdrop-blur text-center">
                  <h2 class="text-3xl font-bold mb-6">Welcome!</h2>
                  <div class="bg-white rounded-xl p-6 text-gray-800 mb-6">
                    @if (resident()!.photo) {
                      <img [src]="resident()!.photo" class="w-32 h-32 rounded-full mx-auto mb-4 object-cover" />
                    } @else {
                      <div class="w-32 h-32 rounded-full bg-blue-100 mx-auto mb-4 flex items-center justify-center text-blue-600 text-4xl font-bold">
                        {{ resident()!.first_name.charAt(0) }}{{ resident()!.last_name.charAt(0) }}
                      </div>
                    }
                    <h3 class="text-2xl font-bold">{{ resident()!.first_name }} {{ resident()!.last_name }}</h3>
                    @if (resident()!.middle_name) {
                      <p class="text-gray-500">{{ resident()!.middle_name }}</p>
                    }
                    <p class="text-gray-500 mt-2">{{ resident()!.address_line }}</p>
                    @if (resident()!.contact_number) {
                      <p class="text-gray-400 text-sm mt-1">{{ resident()!.contact_number }}</p>
                    }
                  </div>
                  <div class="flex gap-4">
                    <app-button variant="secondary" size="lg" class="flex-1" (onClick)="goBack()">Back</app-button>
                    <app-button variant="primary" size="lg" class="flex-1" (onClick)="proceedToServices()">Continue</app-button>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- DOC STEP 3: Service Selection -->
          @if (currentStep() === 'services') {
            <div class="absolute inset-0 flex flex-col p-8">
              <div class="max-w-3xl mx-auto w-full flex-1 flex flex-col">
                <div class="flex items-center justify-between mb-8">
                  <h2 class="text-3xl font-bold">Select a Service</h2>
                  <button class="text-blue-300 hover:text-white text-lg" (click)="cancel()">Cancel</button>
                </div>
                <div class="grid gap-4 flex-1">
                  @for (service of services(); track service.service_id) {
                    <button class="bg-blue-800/50 hover:bg-blue-700/50 rounded-xl p-6 text-left transition-all backdrop-blur border-2 border-transparent hover:border-blue-400"
                            (click)="selectService(service)">
                      <div class="flex justify-between items-start">
                        <div>
                          <h3 class="text-xl font-bold mb-1">{{ service.service_name }}</h3>
                          <p class="text-blue-200">{{ service.description }}</p>
                        </div>
                        <div class="text-right">
                          @if (service.processing_fee > 0) {
                            <span class="text-2xl font-bold">₱{{ service.processing_fee }}</span>
                          } @else {
                            <span class="text-lg text-green-300 font-medium">FREE</span>
                          }
                          @if (service.processing_time) {
                            <div class="text-xs text-blue-200 mt-1">{{ service.processing_time }}</div>
                          }
                        </div>
                      </div>
                    </button>
                  }
                </div>
              </div>
            </div>
          }

          <!-- DOC STEP 4: Requirements -->
          @if (currentStep() === 'requirements') {
            <div class="absolute inset-0 flex flex-col p-8">
              <div class="max-w-3xl mx-auto w-full flex-1 flex flex-col">
                <div class="flex items-center justify-between mb-8">
                  <h2 class="text-3xl font-bold">Requirements</h2>
                  <button class="text-blue-300 hover:text-white text-lg" (click)="goBack()">Back</button>
                </div>
                <div class="flex-1 overflow-y-auto space-y-6">
                  <div class="bg-blue-800/50 rounded-xl p-6 backdrop-blur">
                    <h3 class="text-xl font-bold mb-4">{{ selectedService()?.service_name }}</h3>
                    @if (selectedService()?.description) {
                      <p class="text-blue-200 mb-6">{{ selectedService()?.description }}</p>
                    }
                    @if (selectedService()?.requirements && selectedService()!.requirements!.length > 0) {
                      <div class="mb-6">
                        <h4 class="font-bold text-lg mb-3 text-blue-100">What to Bring</h4>
                        <ul class="space-y-2">
                          @for (req of selectedService()!.requirements!; track req) {
                            <li class="flex items-start gap-3 bg-blue-900/30 p-3 rounded-lg">
                              <svg class="w-5 h-5 text-green-300 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                              </svg>
                              <span class="text-blue-100">{{ req }}</span>
                            </li>
                          }
                        </ul>
                      </div>
                    }
                    @if (selectedService()?.required_documents && selectedService()!.required_documents!.length > 0) {
                      <div class="mb-6">
                        <h4 class="font-bold text-lg mb-3 text-blue-100">Required Documents</h4>
                        <ul class="space-y-2">
                          @for (doc of selectedService()!.required_documents!; track doc) {
                            <li class="flex items-start gap-3 bg-blue-900/30 p-3 rounded-lg">
                              <svg class="w-5 h-5 text-yellow-300 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                              </svg>
                              <span class="text-blue-100">{{ doc }}</span>
                            </li>
                          }
                        </ul>
                      </div>
                    }
                    @if ((!selectedService()?.requirements || selectedService()!.requirements!.length === 0) &&
                        (!selectedService()?.required_documents || selectedService()!.required_documents!.length === 0)) {
                      <p class="text-blue-200/80">No specific requirements listed for this service.</p>
                    }
                  </div>
                  @if (selectedService()?.approval_workflow) {
                    <div class="bg-yellow-500/15 border border-yellow-400 rounded-xl p-4">
                      <p class="text-yellow-200 text-sm"><strong>Processing:</strong> {{ selectedService()?.approval_workflow }}</p>
                    </div>
                  }
                </div>
                <div class="flex gap-4 pt-4 border-t border-blue-700">
                  <app-button variant="secondary" size="lg" class="flex-1" (onClick)="goBack()">Back</app-button>
                  <app-button variant="primary" size="lg" class="flex-1" (onClick)="proceedToForm()">Continue</app-button>
                </div>
              </div>
            </div>
          }

          <!-- DOC STEP 5: Dynamic Form -->
          @if (currentStep() === 'form') {
            <div class="absolute inset-0 flex flex-col p-8 overflow-y-auto">
              <div class="max-w-2xl mx-auto w-full flex-1">
                <div class="flex items-center justify-between mb-8">
                  <h2 class="text-3xl font-bold">Application Form</h2>
                  <button class="text-blue-300 hover:text-white text-lg" (click)="goBack()">Back</button>
                </div>
                <div class="bg-blue-800/50 rounded-2xl p-6 backdrop-blur space-y-4">
                  <p class="text-blue-200">Fill in the required information for {{ selectedService()?.service_name }}.</p>
                  
                  @if (selectedService()?.form_fields && selectedService()!.form_fields!.length > 0) {
                    @for (field of selectedService()!.form_fields!; track field.key) {
                      <div class="space-y-1">
                        <label class="block text-blue-300 text-sm mb-1">
                          {{ field.label }} @if (field.required) { <span class="text-red-300">*</span> }
                        </label>
                        @if (field.type === 'select') {
                          <select 
                            [(ngModel)]="formValues()[field.key]" 
                            [name]="field.key"
                            (ngModelChange)="updateFormValue(field.key, $event)"
                            class="w-full bg-white text-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-400"
                            [class.border-red-500]="formErrors()[field.key]">
                            <option value="">Select...</option>
                            @for (opt of field.options || []; track opt) {
                              <option [value]="opt">{{ opt }}</option>
                            }
                          </select>
                        } @else if (field.type === 'textarea') {
                          <textarea 
                            [(ngModel)]="formValues()[field.key]" 
                            [name]="field.key"
                            (ngModelChange)="updateFormValue(field.key, $event)"
                            [placeholder]="field.placeholder"
                            rows="3"
                            class="w-full bg-white text-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-400"
                            [class.border-red-500]="formErrors()[field.key]"></textarea>
                        } @else {
                          <input 
                            [type]="field.type"
                            [(ngModel)]="formValues()[field.key]" 
                            [name]="field.key"
                            (ngModelChange)="updateFormValue(field.key, $event)"
                            [placeholder]="field.placeholder"
                            class="w-full bg-white text-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-400"
                            [class.border-red-500]="formErrors()[field.key]" />
                        }
                        @if (formErrors()[field.key]) {
                          <p class="text-red-300 text-xs mt-1">{{ formErrors()[field.key] }}</p>
                        }
                      </div>
                    }
                  } @else {
                    <p class="text-blue-200/80">This service does not require additional form fields.</p>
                  }
                </div>
                <div class="flex gap-4 mt-6">
                  <app-button variant="secondary" size="lg" class="flex-1" (onClick)="goBack()">Back</app-button>
                  <app-button variant="primary" size="lg" class="flex-1" (onClick)="validateForm()">Continue</app-button>
                </div>
              </div>
            </div>
          }

          <!-- DOC STEP 6: Photo Capture (only if service requires photo) -->
          @if (currentStep() === 'photo') {
            <div class="absolute inset-0 flex flex-col items-center justify-center p-8">
              <div class="max-w-lg w-full">
                <h2 class="text-3xl font-bold mb-6 text-center">Capture Your Photo</h2>
                @if (!capturedPhoto()) {
                  <div class="bg-black rounded-2xl overflow-hidden mb-6">
                    <video #videoEl autoplay playsinline class="w-full aspect-video object-cover"></video>
                  </div>
                  <div class="flex gap-4 justify-center">
                    <app-button variant="primary" size="lg" (onClick)="capturePhoto()">Take Photo</app-button>
                    <app-button variant="secondary" size="lg" (onClick)="skipPhoto()">Skip</app-button>
                  </div>
                } @else {
                  <div class="text-center">
                    <img [src]="capturedPhoto()" class="w-64 h-64 rounded-2xl mx-auto mb-6 object-cover border-4 border-white" />
                    <div class="flex gap-4 justify-center">
                      <app-button variant="primary" size="lg" (onClick)="confirmPhoto()">Use This Photo</app-button>
                      <app-button variant="secondary" size="lg" (onClick)="retakePhoto()">Retake</app-button>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- DOC STEP 7: Review & Confirm -->
          @if (currentStep() === 'review') {
            <div class="absolute inset-0 flex flex-col items-center justify-center p-8">
              <div class="max-w-lg w-full">
                <h2 class="text-3xl font-bold mb-6 text-center">Review Your Request</h2>
                <div class="bg-blue-800/50 rounded-2xl p-6 backdrop-blur space-y-4">
                  <div class="flex items-center gap-4">
                    @if (resident()!.photo || capturedPhoto()) {
                      <img [src]="capturedPhoto() || resident()!.photo" class="w-16 h-16 rounded-full object-cover" />
                    } @else {
                      <div class="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                        {{ resident()!.first_name.charAt(0) }}{{ resident()!.last_name.charAt(0) }}
                      </div>
                    }
                    <div>
                      <p class="font-bold text-lg">{{ resident()!.first_name }} {{ resident()!.last_name }}</p>
                      <p class="text-blue-200 text-sm">{{ resident()!.address_line }}</p>
                    </div>
                  </div>
                  <hr class="border-blue-700" />
                  <div>
                    <p class="text-blue-300 text-sm">Service</p>
                    <p class="font-bold text-lg">{{ selectedService()!.service_name }}</p>
                  </div>
                  <div>
                    <p class="text-blue-300 text-sm">Fee</p>
                    @if (selectedService()!.processing_fee > 0) {
                      <p class="font-bold text-lg">₱{{ selectedService()!.processing_fee }}</p>
                    } @else {
                      <p class="font-bold text-lg text-green-300">FREE</p>
                    }
                  </div>
                </div>
                <div class="flex gap-4 mt-6">
                  <app-button variant="secondary" size="lg" class="flex-1" (onClick)="goBack()">Back</app-button>
                  <app-button variant="primary" size="lg" class="flex-1" (onClick)="submitRequest()" [loading]="submitting()">Submit Request</app-button>
                </div>
              </div>
            </div>
          }

          <!-- DOC STEP 8: Success -->
          @if (currentStep() === 'success') {
            <div class="absolute inset-0 flex flex-col items-center justify-center p-8">
              <div class="max-w-lg w-full text-center">
                <div class="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <h2 class="text-3xl font-bold mb-4">Request Submitted!</h2>
                <p class="text-xl text-blue-200 mb-2">Your request number is:</p>
                <p class="text-4xl font-bold text-yellow-300 mb-6">{{ requestNumber() }}</p>
                <p class="text-blue-200 mb-8">Please wait for your document to be processed. You will be notified when it is ready for release.</p>
                <app-button variant="primary" size="lg" (onClick)="finish()">Done</app-button>
              </div>
            </div>
          }
        }

        <!-- ============ BARANGAY ID: Application workflow ============ -->
        @if (mode() === 'barangay') {

          <!-- BAR STEP 0: Application Form -->
          @if (barangayStep() === 'form') {
            <div class="absolute inset-0 flex flex-col items-center justify-center p-8 overflow-y-auto">
              <div class="max-w-lg w-full my-8">
                <div class="flex items-center justify-between mb-6">
                  <div>
                    <h2 class="text-2xl font-bold">Barangay ID Application</h2>
                    <p class="text-blue-300 text-sm mt-1">Fill in your personal information</p>
                  </div>
                  <button class="text-blue-300 hover:text-white text-lg" (click)="goBack()">Back</button>
                </div>

                <div class="bg-blue-800/50 rounded-2xl p-6 backdrop-blur space-y-4">
                  <div class="grid grid-cols-2 gap-4">
                    <div class="col-span-2 sm:col-span-1">
                      <label class="block text-blue-300 text-sm mb-1">First Name *</label>
                      <input type="text" [(ngModel)]="barangayForm.firstName"
                             class="w-full bg-white text-gray-800 rounded-lg px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-400" />
                    </div>
                    <div class="col-span-2 sm:col-span-1">
                      <label class="block text-blue-300 text-sm mb-1">Middle Name</label>
                      <input type="text" [(ngModel)]="barangayForm.middleName"
                             class="w-full bg-white text-gray-800 rounded-lg px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-400" />
                    </div>
                    <div class="col-span-2 sm:col-span-1">
                      <label class="block text-blue-300 text-sm mb-1">Last Name *</label>
                      <input type="text" [(ngModel)]="barangayForm.lastName"
                             class="w-full bg-white text-gray-800 rounded-lg px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-400" />
                    </div>
                    <div class="col-span-2 sm:col-span-1">
                      <label class="block text-blue-300 text-sm mb-1">Suffix</label>
                      <select [(ngModel)]="barangayForm.suffix"
                              class="w-full bg-white text-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-400">
                        <option value="">None</option>
                        <option value="Jr.">Jr.</option>
                        <option value="Sr.">Sr.</option>
                        <option value="II">II</option>
                        <option value="III">III</option>
                        <option value="IV">IV</option>
                      </select>
                    </div>
                    <div class="col-span-2 sm:col-span-1">
                      <label class="block text-blue-300 text-sm mb-1">Birth Date *</label>
                      <input type="date" [(ngModel)]="barangayForm.birthDate"
                             class="w-full bg-white text-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-400" />
                    </div>
                    <div class="col-span-2 sm:col-span-1">
                      <label class="block text-blue-300 text-sm mb-1">Gender *</label>
                      <select [(ngModel)]="barangayForm.gender"
                              class="w-full bg-white text-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-400">
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div class="col-span-2 sm:col-span-1">
                      <label class="block text-blue-300 text-sm mb-1">Civil Status *</label>
                      <select [(ngModel)]="barangayForm.civilStatus"
                              class="w-full bg-white text-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-400">
                        <option value="">Select...</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Widowed">Widowed</option>
                        <option value="Separated">Separated</option>
                        <option value="Divorced">Divorced</option>
                      </select>
                    </div>
                    <div class="col-span-2 sm:col-span-1">
                      <label class="block text-blue-300 text-sm mb-1">Blood Type</label>
                      <select [(ngModel)]="barangayForm.bloodType"
                              class="w-full bg-white text-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-400">
                        <option value="">Unknown</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                    <div class="col-span-2 sm:col-span-1">
                      <label class="block text-blue-300 text-sm mb-1">Contact Number</label>
                      <input type="tel" [(ngModel)]="barangayForm.contactNumber"
                             class="w-full bg-white text-gray-800 rounded-lg px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-400" />
                    </div>
                    <div class="col-span-2">
                      <label class="block text-blue-300 text-sm mb-1">Address *</label>
                      <input type="text" [(ngModel)]="barangayForm.addressLine"
                             class="w-full bg-white text-gray-800 rounded-lg px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-400" />
                    </div>
                    <div class="col-span-2">
                      <label class="block text-blue-300 text-sm mb-1">Email (optional)</label>
                      <input type="email" [(ngModel)]="barangayForm.email"
                             class="w-full bg-white text-gray-800 rounded-lg px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-400" />
                    </div>
                    <div class="col-span-2">
                      <label class="block text-blue-300 text-sm mb-1">Emergency Contact Name *</label>
                      <input type="text" [(ngModel)]="barangayForm.emergencyContactName"
                             class="w-full bg-white text-gray-800 rounded-lg px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-400" />
                    </div>
                    <div class="col-span-2">
                      <label class="block text-blue-300 text-sm mb-1">Emergency Contact Number *</label>
                      <input type="tel" [(ngModel)]="barangayForm.emergencyContactNumber"
                             class="w-full bg-white text-gray-800 rounded-lg px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-400" />
                    </div>
                  </div>
                </div>

                @if (formError()) {
                  <div class="mt-4 bg-red-500/20 border border-red-400 rounded-xl p-4">
                    <p class="text-red-200">{{ formError() }}</p>
                  </div>
                }

                <div class="flex gap-4 mt-6">
                  <app-button variant="secondary" size="lg" class="flex-1" (onClick)="goBack()">Back</app-button>
                  <app-button variant="primary" size="lg" class="flex-1" (onClick)="validateBarangayForm()">Continue</app-button>
                </div>
              </div>
            </div>
          }

          <!-- BAR STEP 1: Photo Capture (required) -->
          @if (barangayStep() === 'photo') {
            <div class="absolute inset-0 flex flex-col items-center justify-center p-8">
              <div class="max-w-lg w-full">
                <h2 class="text-3xl font-bold mb-6 text-center">Capture Your ID Photo</h2>
                <p class="text-blue-200 text-center mb-6">A clear photo is required for your Barangay ID.</p>
                @if (!capturedPhoto()) {
                  <div class="bg-black rounded-2xl overflow-hidden mb-6">
                    <video #videoEl autoplay playsinline class="w-full aspect-video object-cover"></video>
                  </div>
                  <div class="flex gap-4 justify-center">
                    <app-button variant="primary" size="lg" (onClick)="capturePhoto()">Take Photo</app-button>
                  </div>
                } @else {
                  <div class="text-center">
                    <img [src]="capturedPhoto()" class="w-64 h-64 rounded-2xl mx-auto mb-6 object-cover border-4 border-white" />
                    <div class="flex gap-4 justify-center">
                      <app-button variant="primary" size="lg" (onClick)="confirmBarangayPhoto()">Use This Photo</app-button>
                      <app-button variant="secondary" size="lg" (onClick)="retakePhoto()">Retake</app-button>
                    </div>
                  </div>
                }
                @if (errorMessage()) {
                  <div class="mt-6 bg-red-500/20 border border-red-400 rounded-xl p-4">
                    <p class="text-red-200">{{ errorMessage() }}</p>
                  </div>
                }
              </div>
            </div>
          }

          <!-- BAR STEP 2: Review & Submit -->
          @if (barangayStep() === 'review') {
            <div class="absolute inset-0 flex flex-col items-center justify-center p-8">
              <div class="max-w-lg w-full">
                <h2 class="text-3xl font-bold mb-6 text-center">Review Your Application</h2>
                <div class="bg-blue-800/50 rounded-2xl p-6 backdrop-blur space-y-4">
                  <div class="flex items-center gap-4">
                    @if (capturedPhoto()) {
                      <img [src]="capturedPhoto()" class="w-20 h-20 rounded-full object-cover" />
                    } @else {
                      <div class="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                        {{ barangayForm.firstName.charAt(0) }}{{ barangayForm.lastName.charAt(0) }}
                      </div>
                    }
                    <div>
                      <p class="font-bold text-lg">{{ barangayForm.firstName }} {{ barangayForm.lastName }}</p>
                      <p class="text-blue-200 text-sm">{{ barangayForm.addressLine }}</p>
                    </div>
                  </div>
                  <hr class="border-blue-700" />
                  <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p class="text-blue-300 text-sm">Full Name</p>
                      <p class="font-medium">{{ barangayForm.firstName }} {{ barangayForm.middleName }} {{ barangayForm.lastName }} {{ barangayForm.suffix }}</p>
                    </div>
                    <div>
                      <p class="text-blue-300 text-sm">Birth Date</p>
                      <p class="font-medium">{{ barangayForm.birthDate || '—' }}</p>
                    </div>
                    <div>
                      <p class="text-blue-300 text-sm">Gender</p>
                      <p class="font-medium">{{ barangayForm.gender || '—' }}</p>
                    </div>
                    <div>
                      <p class="text-blue-300 text-sm">Civil Status</p>
                      <p class="font-medium">{{ barangayForm.civilStatus || '—' }}</p>
                    </div>
                    <div>
                      <p class="text-blue-300 text-sm">Blood Type</p>
                      <p class="font-medium">{{ barangayForm.bloodType || 'Unknown' }}</p>
                    </div>
                    <div>
                      <p class="text-blue-300 text-sm">Contact Number</p>
                      <p class="font-medium">{{ barangayForm.contactNumber || '—' }}</p>
                    </div>
                    <div>
                      <p class="text-blue-300 text-sm">Email</p>
                      <p class="font-medium break-all">{{ barangayForm.email || '—' }}</p>
                    </div>
                    <div class="col-span-2">
                      <p class="text-blue-300 text-sm">Emergency Contact</p>
                      <p class="font-medium">{{ barangayForm.emergencyContactName || '—' }} — {{ barangayForm.emergencyContactNumber || '—' }}</p>
                    </div>
                  </div>
                </div>
                <div class="flex gap-4 mt-6">
                  <app-button variant="secondary" size="lg" class="flex-1" (onClick)="goBack()">Back</app-button>
                  <app-button variant="primary" size="lg" class="flex-1" (onClick)="submitBarangay()" [loading]="submitting()">Submit Application</app-button>
                </div>
                @if (errorMessage()) {
                  <div class="mt-6 bg-red-500/20 border border-red-400 rounded-xl p-4">
                    <p class="text-red-200">{{ errorMessage() }}</p>
                  </div>
                }
              </div>
            </div>
          }

          <!-- BAR STEP 3: Success -->
          @if (barangayStep() === 'success') {
            <div class="absolute inset-0 flex flex-col items-center justify-center p-8">
              <div class="max-w-lg w-full text-center">
                <div class="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <h2 class="text-3xl font-bold mb-4">Application Submitted!</h2>
                <p class="text-xl text-blue-200 mb-2">Your Barangay ID application number is:</p>
                <p class="text-4xl font-bold text-yellow-300 mb-6">{{ requestNumber() }}</p>
                <p class="text-blue-200 mb-8">Please wait for your Barangay ID to be processed. You will be notified when it is ready for release.</p>
                <app-button variant="primary" size="lg" (onClick)="finish()">Done</app-button>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `
})
export class KioskComponent implements OnInit, OnDestroy {
  @ViewChild('videoEl') videoEl!: ElementRef<HTMLVideoElement>;

  mode = signal<KioskMode>('home');

  // Documents flow steps
  currentStep = signal<DocStep>('search');

  // Barangay ID flow steps
  barangayStep = signal<BarangayStep>('form');

  resident = signal<Resident | null>(null);
  services = signal<Service[]>([]);
  selectedService = signal<Service | null>(null);
  capturedPhoto = signal<string | null>(null);
  requestNumber = signal('');
  errorMessage = signal('');
  formError = signal('');
  submitting = signal(false);
  searchResults = signal<any[]>([]);
  searching = signal(false);
  searchQuery = '';

  // Dynamic form state
  formValues = signal<Record<string, unknown>>({});
  formErrors = signal<Record<string, string>>({});

  barangayForm = {
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    birthDate: '',
    gender: '',
    civilStatus: '',
    addressLine: '',
    contactNumber: '',
    email: '',
    bloodType: '',
    emergencyContactName: '',
    emergencyContactNumber: ''
  };

  private stream: MediaStream | null = null;
  private idleTimer: any;
  private searchDebounce: any;

  constructor(
    private kioskService: KioskService,
    public identificationService: IdentificationService
  ) {}

  ngOnInit() {
    this.resetIdleTimer();
  }

  ngOnDestroy() {
    this.stopCamera();
    clearTimeout(this.idleTimer);
    clearTimeout(this.searchDebounce);
  }

  loadServices() {
    this.kioskService.getServices().subscribe({
      next: (result: any) => this.services.set(result?.data || [])
    });
  }

  // ============================================================
  // MODE TRANSITIONS
  // ============================================================

  startDocuments() {
    this.stopCamera();
    this.errorMessage.set('');
    this.clearSearch();
    this.mode.set('documents');
    this.currentStep.set('search');
    this.resetIdleTimer();
  }

  startBarangay() {
    this.stopCamera();
    this.errorMessage.set('');
    this.formError.set('');
    this.capturedPhoto.set(null);
    this.resetBarangayForm();
    this.mode.set('barangay');
    this.barangayStep.set('form');
    this.resetIdleTimer();
  }

  private resetBarangayForm() {
    this.barangayForm = {
      firstName: '',
      middleName: '',
      lastName: '',
      suffix: '',
      birthDate: '',
      gender: '',
      civilStatus: '',
      addressLine: '',
      contactNumber: '',
      email: '',
      bloodType: '',
      emergencyContactName: '',
      emergencyContactNumber: ''
    };
  }

  // ============================================================
  // DOCUMENTS FLOW: MANUAL RESIDENT SELECTION
  // ============================================================

  onSearchChange(query: string) {
    clearTimeout(this.searchDebounce);
    if (!query || query.trim().length < 2) {
      this.searchResults.set([]);
      return;
    }
    this.searchDebounce = setTimeout(() => {
      this.searching.set(true);
      this.kioskService.searchResidents(query).subscribe({
        next: (result: any) => {
          this.searchResults.set(result?.data || []);
          this.searching.set(false);
        },
        error: () => {
          this.searchResults.set([]);
          this.searching.set(false);
        }
      });
    }, 300);
  }

  selectResident(r: any) {
    this.errorMessage.set('');
    this.currentStep.set('loading');

    this.kioskService.getResident(r.resident_id).subscribe({
      next: (result: any) => {
        this.resident.set(result.data);
        this.currentStep.set('welcome');
        this.resetIdleTimer();
      },
      error: () => {
        this.errorMessage.set('Failed to load resident info.');
        this.currentStep.set('search');
      }
    });
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchResults.set([]);
  }

  // ============================================================
  // DOCUMENTS FLOW: WORKFLOW STEPS
  // ============================================================

  proceedToServices() {
    this.loadServices();
    this.currentStep.set('services');
    this.resetIdleTimer();
  }

  selectService(service: Service) {
    this.selectedService.set(service);
    this.formValues.set({});
    this.formErrors.set({});
    this.currentStep.set('requirements');
    this.resetIdleTimer();
  }

  proceedToForm() {
    this.currentStep.set('form');
    this.resetIdleTimer();
  }

  updateFormValue(key: string, value: any) {
    this.formValues.update(v => ({ ...v, [key]: value }));
    if (this.formErrors()[key]) {
      this.formErrors.update(e => { const n = { ...e }; delete n[key]; return n; });
    }
  }

  validateForm() {
    const fields = this.selectedService()?.form_fields || [];
    let hasErrors = false;
    const newErrors: Record<string, string> = {};
    for (const field of fields) {
      const value = this.formValues()[field.key];
      if (field.required && (!value || (typeof value === 'string' && !value.trim()))) {
        newErrors[field.key] = `${field.label} is required.`;
        hasErrors = true;
      }
    }
    this.formErrors.set(newErrors);
    if (hasErrors) return;
    const service = this.selectedService();
    if (service?.requires_photo) {
      this.currentStep.set('photo');
      this.resetIdleTimer();
      setTimeout(() => this.startCamera(), 100);
    } else {
      this.currentStep.set('review');
      this.resetIdleTimer();
    }
  }

  // ============================================================
  // BARANGAY ID FLOW
  // ============================================================

  validateBarangayForm() {
    this.formError.set('');
    const f = this.barangayForm;
    if (!f.firstName.trim()) {
      this.formError.set('First name is required.');
      return;
    }
    if (!f.lastName.trim()) {
      this.formError.set('Last name is required.');
      return;
    }
    if (!f.birthDate) {
      this.formError.set('Birth date is required.');
      return;
    }
    if (!f.gender) {
      this.formError.set('Gender is required.');
      return;
    }
    if (!f.civilStatus) {
      this.formError.set('Civil status is required.');
      return;
    }
    if (!f.addressLine.trim()) {
      this.formError.set('Address is required.');
      return;
    }
    if (!f.emergencyContactName.trim()) {
      this.formError.set('Emergency contact name is required.');
      return;
    }
    if (!f.emergencyContactNumber.trim()) {
      this.formError.set('Emergency contact number is required.');
      return;
    }
    this.errorMessage.set('');
    this.barangayStep.set('photo');
    this.resetIdleTimer();
    setTimeout(() => this.startCamera(), 100);
  }

  confirmBarangayPhoto() {
    this.barangayStep.set('review');
    this.resetIdleTimer();
  }

  submitBarangay() {
    if (!this.capturedPhoto()) {
      this.errorMessage.set('A photo is required for your Barangay ID.');
      this.barangayStep.set('photo');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');

    const formData = {
      first_name: this.barangayForm.firstName.trim(),
      middle_name: this.barangayForm.middleName.trim() || null,
      last_name: this.barangayForm.lastName.trim(),
      suffix: this.barangayForm.suffix || null,
      birth_date: this.barangayForm.birthDate || null,
      gender: this.barangayForm.gender || null,
      civil_status: this.barangayForm.civilStatus || null,
      address_line: this.barangayForm.addressLine.trim(),
      contact_number: this.barangayForm.contactNumber.trim() || null,
      email: this.barangayForm.email.trim() || null,
      blood_type: this.barangayForm.bloodType || null,
      emergency_contact_name: this.barangayForm.emergencyContactName.trim(),
      emergency_contact_number: this.barangayForm.emergencyContactNumber.trim()
    };

    this.kioskService.createBarangayId({
      firstName: this.barangayForm.firstName.trim(),
      middleName: this.barangayForm.middleName.trim() || undefined,
      lastName: this.barangayForm.lastName.trim(),
      suffix: this.barangayForm.suffix || undefined,
      birthDate: this.barangayForm.birthDate || undefined,
      gender: this.barangayForm.gender || undefined,
      civilStatus: this.barangayForm.civilStatus || undefined,
      addressLine: this.barangayForm.addressLine.trim(),
      contactNumber: this.barangayForm.contactNumber.trim() || undefined,
      email: this.barangayForm.email.trim() || undefined,
      bloodType: this.barangayForm.bloodType || undefined,
      emergencyContactName: this.barangayForm.emergencyContactName.trim() || undefined,
      emergencyContactNumber: this.barangayForm.emergencyContactNumber.trim() || undefined,
      photo: this.capturedPhoto() || undefined,
      form_data: formData
    }).subscribe({
      next: (result: any) => {
        this.requestNumber.set(result?.data?.request_number || 'N/A');
        this.barangayStep.set('success');
        this.submitting.set(false);
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = err?.error?.message || 'Failed to submit application. Please try again.';
        this.errorMessage.set(msg);
        console.error('Barangay ID submit error:', err);
      }
    });
  }

  // ============================================================
  // CAMERA
  // ============================================================

  startCamera() {
    if (this.stream) return;
    navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
      .then(stream => {
        this.stream = stream;
        if (this.videoEl?.nativeElement) {
          this.videoEl.nativeElement.srcObject = stream;
        }
        this.errorMessage.set('');
      })
      .catch((err) => {
        console.error('Camera error:', err);
        this.errorMessage.set('Camera access denied or not available. You can skip the photo step.');
      });
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
  }

  capturePhoto() {
    if (!this.videoEl?.nativeElement) return;
    const canvas = document.createElement('canvas');
    canvas.width = this.videoEl.nativeElement.videoWidth;
    canvas.height = this.videoEl.nativeElement.videoHeight;
    canvas.getContext('2d')?.drawImage(this.videoEl.nativeElement, 0, 0);
    this.capturedPhoto.set(canvas.toDataURL('image/jpeg', 0.8));
    this.stopCamera();
  }

  skipPhoto() {
    this.stopCamera();
    this.capturedPhoto.set(null);
    this.currentStep.set('review');
    this.resetIdleTimer();
  }

  confirmPhoto() {
    this.currentStep.set('review');
    this.resetIdleTimer();
  }

  retakePhoto() {
    this.capturedPhoto.set(null);
    setTimeout(() => this.startCamera(), 100);
  }

  // ============================================================
  // NAVIGATION
  // ============================================================

  goBack() {
    if (this.mode() === 'documents') {
      const step = this.currentStep();
      if (step === 'search') {
        // From Search screen back to Home
        this.mode.set('home');
        return;
      }
      if (step === 'welcome') {
        // From Welcome back to Search so a different resident can be picked
        this.clearSearch();
        this.currentStep.set('search');
        return;
      }
      if (step === 'review') {
        // From Review step: back to the previous step based on photo visibility
        if (this.selectedService()?.requires_photo) {
          this.currentStep.set('photo');
          setTimeout(() => this.startCamera(), 100);
        } else {
          this.currentStep.set('form');
        }
        return;
      }
      if (step === 'form') {
        this.currentStep.set('requirements');
        return;
      }
      if (step === 'requirements') {
        this.currentStep.set('services');
        return;
      }
      // For loading, photo - just go back one step in order
      const steps: DocStep[] = ['search', 'loading', 'welcome', 'services', 'requirements', 'form', 'photo', 'review', 'success'];
      const idx = steps.indexOf(step);
      if (idx > 0) this.currentStep.set(steps[idx - 1]);
      return;
    }

    if (this.mode() === 'barangay') {
      const step = this.barangayStep();
      if (step === 'form') {
        // From Application Form back to Home
        this.mode.set('home');
        return;
      }
      if (step === 'review') {
        // From Review back to Photo
        this.barangayStep.set('photo');
        this.capturedPhoto.set(null);
        setTimeout(() => this.startCamera(), 100);
        return;
      }
      const bSteps: BarangayStep[] = ['form', 'photo', 'review', 'success'];
      const idx = bSteps.indexOf(step);
      if (idx > 0) this.barangayStep.set(bSteps[idx - 1]);
    }
  }

  submitRequest() {
    const resident = this.resident();
    const service = this.selectedService();

    if (!resident || !service) {
      this.errorMessage.set('Missing resident or service information. Please start over.');
      this.currentStep.set('search');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');

    this.kioskService.createRequest({
      service_id: service.service_id,
      resident_id: resident.resident_id,
      photo: this.capturedPhoto() || undefined,
      form_data: this.formValues()
    }).subscribe({
      next: (result: any) => {
        this.requestNumber.set(result?.data?.request_number || 'N/A');
        this.currentStep.set('success');
        this.submitting.set(false);
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = err?.error?.message || 'Failed to submit request. Please try again.';
        this.errorMessage.set(msg);
        console.error('Submit request error:', err);
      }
    });
  }

  finish() {
    this.kioskService.reset();
    this.stopCamera();
    this.mode.set('home');
    this.currentStep.set('search');
    this.barangayStep.set('form');
    this.resident.set(null);
    this.selectedService.set(null);
    this.capturedPhoto.set(null);
    this.requestNumber.set('');
    this.errorMessage.set('');
    this.formError.set('');
    this.searchQuery = '';
    this.searchResults.set([]);
    this.resetBarangayForm();
    this.formValues.set({});
    this.formErrors.set({});
    this.resetIdleTimer();
  }

  cancel() {
    this.stopCamera();
    this.finish();
  }

  resetIdleTimer() {
    clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => this.cancel(), 120000);
  }
}
