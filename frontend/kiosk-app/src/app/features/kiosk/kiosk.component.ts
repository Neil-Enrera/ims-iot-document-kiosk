import { Component, OnInit, OnDestroy, signal, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KioskService, Resident, Service, GuestInfo, FormField } from './kiosk.service';
import { IdentificationService } from './identification.service';
import { RfidScanService } from './rfid-scan.service';
import { ButtonComponent } from './button.component';
import { SignaturePadComponent } from './signature-pad.component';

export type KioskMode = 'home' | 'rfid' | 'guest' | 'documents' | 'barangay';

// Documents flow (shared by RFID-resident and guest temporary sessions)
export type DocStep =
  | 'welcome'     // 0: resident welcome (RFID path only)
  | 'guest-info'  // 0: guest basic info (temporary session path only)
  | 'services'    // 1: select service
  | 'requirements'// 2: show service requirements
  | 'form'        // 3: dynamic form
  | 'photo'       // 4: capture photo (only if service requires)
  | 'review'      // 5: review & confirm
  | 'success';    // 6: success

// RFID scan flow
export type RfidStep = 'scan' | 'search' | 'error';

// Barangay ID application flow
export type BarangayStep =
  | 'requirements' // 0: show ID requirements
  | 'form'         // 1: registration form
  | 'photo'        // 2: capture photo (required)
  | 'signature'    // 3: capture digital signature (required)
  | 'review'       // 4: review & submit
  | 'success';     // 5: success

@Component({
  selector: 'app-kiosk',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, SignaturePadComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white select-none flex">

      <!-- MAIN KIOSK AREA -->
      <div class="flex-1 relative">

        <!-- ============ HOME: Landing ============ -->
        @if (mode() === 'home') {
          <div class="absolute inset-0 flex flex-col items-center justify-center p-8">
            <div class="text-center max-w-3xl w-full">
              <div class="mb-6">
                <svg class="w-24 h-24 mx-auto text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h1 class="text-4xl font-bold mb-2">Barangay San Manuel</h1>
              <p class="text-xl text-blue-200 mb-10">Document Request Kiosk</p>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <!-- Scan Barangay ID -->
                <button class="w-full bg-blue-600 hover:bg-blue-500 rounded-3xl p-8 flex flex-col items-center gap-4 text-center transition-all border-2 border-blue-400 shadow-xl hover:scale-[1.02]"
                        (click)="startRfid()">
                  <div class="w-20 h-20 bg-blue-900 rounded-2xl flex items-center justify-center">
                    <svg class="w-12 h-12 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </div>
                  <div>
                    <p class="text-2xl font-bold">Scan Barangay ID</p>
                    <p class="text-blue-200 text-sm mt-1">Tap your RFID card on the scanner</p>
                  </div>
                  <svg class="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </button>

                <!-- Continue Without Barangay ID -->
                <button class="w-full bg-blue-800/60 hover:bg-blue-700/60 rounded-3xl p-8 flex flex-col items-center gap-4 text-center transition-all border-2 border-blue-600 shadow-xl hover:scale-[1.02]"
                        (click)="continueWithout()">
                  <div class="w-20 h-20 bg-blue-900 rounded-2xl flex items-center justify-center">
                    <svg class="w-12 h-12 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/>
                    </svg>
                  </div>
                  <div>
                    <p class="text-2xl font-bold">Continue Without Barangay ID</p>
                    <p class="text-blue-200 text-sm mt-1">Request documents or apply for a Barangay ID</p>
                  </div>
                  <svg class="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        }

        <!-- ============ RFID: Scan Barangay ID ============ -->
        @if (mode() === 'rfid') {

          <!-- RFID STEP: scan -->
          @if (rfidStep() === 'scan') {
            <div class="absolute inset-0 flex flex-col items-center justify-center p-8">
              <div class="max-w-lg w-full text-center">
                <div class="flex items-center justify-between mb-8">
                  <button class="text-blue-300 hover:text-white text-lg" (click)="goBack()">Back</button>
                  <span></span>
                </div>

                <h2 class="text-3xl font-bold mb-4">Scan Barangay ID</h2>
                <p class="text-blue-200 mb-8">Please tap your RFID-enabled Barangay ID card on the scanner.</p>

                <div class="relative w-64 h-64 mx-auto mb-8">
                  <div class="absolute inset-0 rounded-full bg-blue-500/20 animate-ping"></div>
                  <div class="absolute inset-6 rounded-full bg-blue-600/40 animate-pulse"></div>
                  <div class="absolute inset-12 bg-blue-800 rounded-full border-4 border-blue-400 flex items-center justify-center">
                    <svg class="w-24 h-24 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"/>
                    </svg>
                  </div>
                </div>

                @if (!rfidConnected()) {
                  <div class="bg-yellow-500/15 border border-yellow-400 rounded-xl px-4 py-3 mb-6 text-left">
                    <p class="text-yellow-200 text-sm font-medium">RFID Scanner Not Detected</p>
                    <p class="text-yellow-200/80 text-xs mt-1">
                      The scanner hardware is not connected. Use "Find My Record" to continue manually.
                    </p>
                  </div>
                }

                <app-button variant="secondary" size="lg" class="w-full" (onClick)="rfidStep.set('search')">
                  Find My Record
                </app-button>
                <div class="mt-4">
                  <button class="text-blue-300 hover:text-white text-lg" (click)="continueWithout()">
                    Continue Without Barangay ID
                  </button>
                </div>
              </div>
            </div>
          }

          <!-- RFID STEP: error / not recognized -->
          @if (rfidStep() === 'error') {
            <div class="absolute inset-0 flex flex-col items-center justify-center p-8">
              <div class="max-w-lg w-full text-center">
                <div class="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
                  </svg>
                </div>
                <h2 class="text-3xl font-bold mb-4">Barangay ID Not Found</h2>
                <p class="text-xl text-blue-200 mb-8">
                  {{ rfidError() }}
                  <br/>
                  Please try again or continue without a Barangay ID.
                </p>
                <div class="flex flex-col gap-4">
                  <app-button variant="primary" size="lg" class="w-full" (onClick)="retryRfid()">Scan Again</app-button>
                  <app-button variant="secondary" size="lg" class="w-full" (onClick)="continueWithout()">
                    Continue Without Barangay ID
                  </app-button>
                </div>
              </div>
            </div>
          }

          <!-- RFID STEP: search fallback -->
          @if (rfidStep() === 'search') {
            <div class="absolute inset-0 flex flex-col items-center justify-center p-8">
              <div class="max-w-lg w-full">
                <div class="flex items-center justify-between mb-6">
                  <div>
                    <h2 class="text-2xl font-bold">Find My Record</h2>
                    <p class="text-blue-300 text-sm mt-1">Search for your existing account</p>
                  </div>
                  <button class="text-blue-300 hover:text-white text-lg" (click)="rfidStep.set('scan')">Back</button>
                </div>

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
        }

        <!-- ============ GUEST: Continue Without Barangay ID options ============ -->
        @if (mode() === 'guest') {
          <div class="absolute inset-0 flex flex-col items-center justify-center p-8">
            <div class="max-w-3xl w-full">
              <div class="flex items-center justify-between mb-8">
                <h2 class="text-3xl font-bold">Continue Without Barangay ID</h2>
                <button class="text-blue-300 hover:text-white text-lg" (click)="goBack()">Back</button>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <!-- Request Documents -->
                <button class="w-full bg-blue-600 hover:bg-blue-500 rounded-3xl p-8 flex flex-col items-center gap-4 text-center transition-all border-2 border-blue-400 shadow-xl hover:scale-[1.02]"
                        (click)="startGuestRequest()">
                  <div class="w-20 h-20 bg-blue-900 rounded-2xl flex items-center justify-center">
                    <svg class="w-12 h-12 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
                    </svg>
                  </div>
                  <div>
                    <p class="text-2xl font-bold">Request Documents</p>
                    <p class="text-blue-200 text-sm mt-1">Request barangay documents in a temporary session</p>
                  </div>
                </button>

                <!-- Apply for Barangay ID -->
                <button class="w-full bg-blue-800/60 hover:bg-blue-700/60 rounded-3xl p-8 flex flex-col items-center gap-4 text-center transition-all border-2 border-blue-600 shadow-xl hover:scale-[1.02]"
                        (click)="startBarangay()">
                  <div class="w-20 h-20 bg-blue-900 rounded-2xl flex items-center justify-center">
                    <svg class="w-12 h-12 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z"/>
                    </svg>
                  </div>
                  <div>
                    <p class="text-2xl font-bold">Apply for Barangay ID</p>
                    <p class="text-blue-200 text-sm mt-1">Submit an application for a new Barangay ID</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        }

        <!-- ============ DOCUMENTS: Request flow (resident + guest temporary session) ============ -->
        @if (mode() === 'documents') {

          <!-- DOC STEP 0a: Welcome (RFID path only) -->
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

          <!-- DOC STEP 0b: Guest basic info (temporary session only) -->
          @if (currentStep() === 'guest-info') {
            <div class="absolute inset-0 flex flex-col items-center justify-center p-8 overflow-y-auto">
              <div class="max-w-lg w-full my-8">
                <div class="flex items-center justify-between mb-6">
                  <div>
                    <h2 class="text-2xl font-bold">Enter Your Information</h2>
                    <p class="text-blue-300 text-sm mt-1">Your details are used only for this request</p>
                  </div>
                  <button class="text-blue-300 hover:text-white text-lg" (click)="goBack()">Back</button>
                </div>

                <div class="bg-blue-800/50 rounded-2xl p-6 backdrop-blur space-y-4">
                  <div>
                    <label class="block text-blue-300 text-sm mb-1">Full Name *</label>
                    <input type="text" [(ngModel)]="guestForm.fullName"
                           placeholder="Enter your full name"
                           class="w-full bg-white text-gray-800 rounded-lg px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-400" />
                  </div>
                  <div>
                    <label class="block text-blue-300 text-sm mb-1">Date of Birth *</label>
                    <input type="date" [(ngModel)]="guestForm.birthDate"
                           class="w-full bg-white text-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-400" />
                  </div>
                  <div>
                    <label class="block text-blue-300 text-sm mb-1">Address *</label>
                    <input type="text" [(ngModel)]="guestForm.address"
                           placeholder="Complete address"
                           class="w-full bg-white text-gray-800 rounded-lg px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-400" />
                  </div>
                  <div>
                    <label class="block text-blue-300 text-sm mb-1">Contact Number *</label>
                    <input type="tel" [(ngModel)]="guestForm.contactNumber"
                           placeholder="09XX XXX XXXX"
                           class="w-full bg-white text-gray-800 rounded-lg px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-400" />
                  </div>
                  <div>
                    <label class="block text-blue-300 text-sm mb-1">Email (optional)</label>
                    <input type="email" [(ngModel)]="guestForm.email"
                           placeholder="you@example.com"
                           class="w-full bg-white text-gray-800 rounded-lg px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-400" />
                  </div>
                </div>

                @if (formError()) {
                  <div class="mt-4 bg-red-500/20 border border-red-400 rounded-xl p-4">
                    <p class="text-red-200">{{ formError() }}</p>
                  </div>
                }

                <div class="flex gap-4 mt-6">
                  <app-button variant="secondary" size="lg" class="flex-1" (onClick)="goBack()">Back</app-button>
                  <app-button variant="primary" size="lg" class="flex-1" (onClick)="validateGuestForm()">Continue</app-button>
                </div>
              </div>
            </div>
          }

          <!-- DOC STEP 1: Service Selection -->
          @if (currentStep() === 'services') {
            <div class="absolute inset-0 flex flex-col p-8">
              <div class="max-w-3xl mx-auto w-full flex-1 flex flex-col">
                <div class="flex items-center justify-between mb-8">
                  <h2 class="text-3xl font-bold">Select a Service</h2>
                  <button class="text-blue-300 hover:text-white text-lg" (click)="cancel()">Cancel</button>
                </div>
                <div class="grid gap-4 flex-1 overflow-y-auto">
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

          <!-- DOC STEP 2: Requirements -->
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

          <!-- DOC STEP 3: Dynamic Form -->
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

                        @switch (field.type) {
                          @case ('select') {
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
                          }
                          @case ('textarea') {
                            <textarea
                              [(ngModel)]="formValues()[field.key]"
                              [name]="field.key"
                              (ngModelChange)="updateFormValue(field.key, $event)"
                              [placeholder]="field.placeholder"
                              rows="3"
                              class="w-full bg-white text-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-400"
                              [class.border-red-500]="formErrors()[field.key]"></textarea>
                          }
                          @case ('radio') {
                            <div class="space-y-2">
                              @for (opt of field.options || []; track opt) {
                                <label class="flex items-center gap-3 bg-white rounded-lg px-4 py-3 cursor-pointer">
                                  <input type="radio" [name]="field.key" [value]="opt"
                                         [checked]="formValues()[field.key] === opt"
                                         (change)="updateFormValue(field.key, opt)"
                                         class="w-5 h-5 accent-blue-600" />
                                  <span class="text-gray-800">{{ opt }}</span>
                                </label>
                              }
                            </div>
                          }
                          @case ('checkbox') {
                            <div class="space-y-2">
                              @for (opt of field.options || []; track opt) {
                                <label class="flex items-center gap-3 bg-white rounded-lg px-4 py-3 cursor-pointer">
                                  <input type="checkbox" [value]="opt"
                                         [checked]="isCheckboxChecked(field, opt)"
                                         (change)="toggleCheckboxOption(field, opt, $event)"
                                         class="w-5 h-5 accent-blue-600" />
                                  <span class="text-gray-800">{{ opt }}</span>
                                </label>
                              }
                            </div>
                          }
                          @case ('signature') {
                            @if (!formValues()[field.key]) {
                              <app-signature-pad [showError]="!!formErrors()[field.key]" (signature)="onFieldSignature(field.key, $event)" />
                            } @else {
                              <div class="bg-white rounded-lg p-3">
                                <img [src]="formValues()[field.key]" alt="Signature" class="h-24 bg-white rounded" />
                                <div class="mt-2">
                                  <button type="button" class="text-blue-300 hover:text-white text-sm" (click)="clearFieldValue(field.key)">Clear</button>
                                </div>
                              </div>
                            }
                          }
                          @case ('photo') {
                            <div>
                              @if (activePhotoField() === field.key) {
                                <div class="bg-black rounded-2xl overflow-hidden mb-2">
                                  <video #inlineVideoEl autoplay playsinline class="w-full aspect-video object-cover"></video>
                                </div>
                                <div class="flex gap-3 justify-center">
                                  <app-button variant="primary" size="lg" (onClick)="captureInlinePhoto(field.key)">Take Photo</app-button>
                                  <app-button variant="secondary" size="lg" (onClick)="cancelInlinePhoto(field.key)">Cancel</app-button>
                                </div>
                              } @else if (formValues()[field.key]) {
                                <img [src]="formValues()[field.key]" alt="Captured photo" class="w-40 h-40 rounded-2xl object-cover border-4 border-white mb-2" />
                                <div class="flex gap-3">
                                  <app-button variant="secondary" size="lg" (onClick)="retakeInlinePhoto(field.key)">Retake</app-button>
                                </div>
                              } @else {
                                <app-button variant="primary" size="lg" (onClick)="startInlineCamera(field.key)">Open Camera</app-button>
                              }
                            </div>
                          }
                          @case ('file') {
                            <input type="file" [accept]="field.accept || '*'" (change)="onFileSelected(field, $event)"
                                   class="w-full text-blue-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white" />
                            @if (formValues()[field.key]) {
                              <p class="text-xs text-green-300 mt-1">File attached</p>
                            }
                          }
                          @default {
                            <input
                              [type]="field.type"
                              [(ngModel)]="formValues()[field.key]"
                              [name]="field.key"
                              (ngModelChange)="updateFormValue(field.key, $event)"
                              [placeholder]="field.placeholder"
                              class="w-full bg-white text-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-400"
                              [class.border-red-500]="formErrors()[field.key]" />
                          }
                        }

                        @if (field.helperText) {
                          <p class="text-blue-300/70 text-xs mt-1">{{ field.helperText }}</p>
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

          <!-- DOC STEP 4: Photo Capture (only if service requires photo) -->
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

          <!-- DOC STEP 5: Review & Confirm -->
          @if (currentStep() === 'review') {
            <div class="absolute inset-0 flex flex-col items-center justify-center p-8">
              <div class="max-w-lg w-full">
                <h2 class="text-3xl font-bold mb-6 text-center">Review Your Request</h2>
                <div class="bg-blue-800/50 rounded-2xl p-6 backdrop-blur space-y-4">
                  <div class="flex items-center gap-4">
                    @if (displayPhoto()) {
                      <img [src]="displayPhoto()" class="w-16 h-16 rounded-full object-cover" />
                    } @else {
                      <div class="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                        {{ displayName().charAt(0) }}
                      </div>
                    }
                    <div>
                      <p class="font-bold text-lg">{{ displayName() }}</p>
                      <p class="text-blue-200 text-sm">{{ displayAddress() }}</p>
                      @if (displayCode()) {
                        <p class="text-blue-300 text-xs mt-1">{{ displayCode() }}</p>
                      }
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
                  @if (selectedService()?.form_fields && selectedService()!.form_fields!.length > 0) {
                    <div>
                      <p class="text-blue-300 text-sm mb-2">Application Details</p>
                      <div class="space-y-2">
                        @for (field of selectedService()!.form_fields!; track field.key) {
                          <div class="flex justify-between items-start gap-4 text-sm">
                            <span class="text-blue-300 flex-1">{{ field.label }}</span>
                            <span class="text-white font-medium text-right">{{ displayFormValue(field, formValues()[field.key]) }}</span>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
                <div class="flex gap-4 mt-6">
                  <app-button variant="secondary" size="lg" class="flex-1" (onClick)="goBack()">Back</app-button>
                  <app-button variant="primary" size="lg" class="flex-1" (onClick)="submitRequest()" [loading]="submitting()">Submit Request</app-button>
                </div>
              </div>
            </div>
          }

          <!-- DOC STEP 6: Success -->
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
                <p class="text-blue-200 mb-3">Please proceed to the Barangay Staff and submit the required documents.</p>
                <p class="text-blue-200 mb-8">After submitting your requirements, monitor your Request Number on the Status Display Board for updates.</p>
                <app-button variant="primary" size="lg" (onClick)="finish()">Done</app-button>
              </div>
            </div>
          }
        }

        <!-- ============ BARANGAY ID: Application workflow ============ -->
        @if (mode() === 'barangay') {

          <!-- BAR STEP 0: Requirements -->
          @if (barangayStep() === 'requirements') {
            <div class="absolute inset-0 flex flex-col p-8">
              <div class="max-w-3xl mx-auto w-full flex-1 flex flex-col">
                <div class="flex items-center justify-between mb-8">
                  <h2 class="text-3xl font-bold">Barangay ID Requirements</h2>
                  <button class="text-blue-300 hover:text-white text-lg" (click)="goBack()">Back</button>
                </div>
                <div class="flex-1 overflow-y-auto space-y-6">
                  <div class="bg-blue-800/50 rounded-xl p-6 backdrop-blur">
                    <h3 class="text-xl font-bold mb-4">Before You Apply</h3>
                    <p class="text-blue-200 mb-6">Please prepare the following. A photo and signature will be captured at the kiosk.</p>
                    @if (barangayService()?.requirements && barangayService()!.requirements!.length > 0) {
                      <div class="mb-6">
                        <h4 class="font-bold text-lg mb-3 text-blue-100">What to Bring</h4>
                        <ul class="space-y-2">
                          @for (req of barangayService()!.requirements!; track req) {
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
                    @if (barangayService()?.required_documents && barangayService()!.required_documents!.length > 0) {
                      <div class="mb-6">
                        <h4 class="font-bold text-lg mb-3 text-blue-100">Required Documents</h4>
                        <ul class="space-y-2">
                          @for (doc of barangayService()!.required_documents!; track doc) {
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
                    <div class="bg-blue-900/30 p-4 rounded-lg">
                      <p class="text-blue-100 text-sm">
                        <strong>Note:</strong> Your application will be reviewed by barangay staff. Once approved, your
                        resident record is created and your Barangay ID is issued.
                      </p>
                    </div>
                  </div>
                </div>
                <div class="flex gap-4 pt-4 border-t border-blue-700">
                  <app-button variant="secondary" size="lg" class="flex-1" (onClick)="goBack()">Back</app-button>
                  <app-button variant="primary" size="lg" class="flex-1" (onClick)="proceedToBarangayForm()">Continue</app-button>
                </div>
              </div>
            </div>
          }

          <!-- BAR STEP 1: Application Form -->
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
                      <label class="block text-blue-300 text-sm mb-1">Sex *</label>
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
                      <label class="block text-blue-300 text-sm mb-1">Occupation</label>
                      <input type="text" [(ngModel)]="barangayForm.occupation"
                             class="w-full bg-white text-gray-800 rounded-lg px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-400" />
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
                      <label class="block text-blue-300 text-sm mb-1">Contact Number *</label>
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
                      <label class="block text-blue-300 text-sm mb-1">Emergency Contact Person *</label>
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

          <!-- BAR STEP 2: Photo Capture (required) -->
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

          <!-- BAR STEP 3: Signature Capture (required) -->
          @if (barangayStep() === 'signature') {
            <div class="absolute inset-0 flex flex-col items-center justify-center p-8">
              <div class="max-w-lg w-full">
                <h2 class="text-3xl font-bold mb-6 text-center">Capture Your Signature</h2>
                <p class="text-blue-200 text-center mb-6">Sign using your finger or a stylus.</p>
                <app-signature-pad (signature)="onSignatureCaptured($event)" />
                @if (errorMessage()) {
                  <div class="mt-6 bg-red-500/20 border border-red-400 rounded-xl p-4">
                    <p class="text-red-200">{{ errorMessage() }}</p>
                  </div>
                }
              </div>
            </div>
          }

          <!-- BAR STEP 4: Review & Submit -->
          @if (barangayStep() === 'review') {
            <div class="absolute inset-0 flex flex-col items-center justify-center p-8 overflow-y-auto">
              <div class="max-w-lg w-full my-8">
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
                      <p class="text-blue-300 text-sm">Sex</p>
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
                      <p class="text-blue-300 text-sm">Occupation</p>
                      <p class="font-medium">{{ barangayForm.occupation || '—' }}</p>
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
                    @if (capturedSignature()) {
                      <div class="col-span-2">
                        <p class="text-blue-300 text-sm mb-1">Signature</p>
                        <img [src]="capturedSignature()" class="h-16 bg-white rounded-lg" />
                      </div>
                    }
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

          <!-- BAR STEP 5: Success -->
          @if (barangayStep() === 'success') {
            <div class="absolute inset-0 flex flex-col items-center justify-center p-8">
              <div class="max-w-lg w-full text-center">
                <div class="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <h2 class="text-3xl font-bold mb-4">Application Submitted!</h2>
                <p class="text-xl text-blue-200 mb-2">Your Barangay ID application has been submitted successfully.</p>
                <p class="text-xl text-blue-200 mb-2">Application Number:</p>
                <p class="text-4xl font-bold text-yellow-300 mb-6">{{ requestNumber() }}</p>
                <p class="text-blue-200 mb-8">Your application will be reviewed by the barangay staff before approval.</p>
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
  @ViewChild('inlineVideoEl') inlineVideoEl!: ElementRef<HTMLVideoElement>;

  mode = signal<KioskMode>('home');

  // RFID flow
  rfidStep = signal<RfidStep>('scan');
  rfidError = signal('');
  rfidConnected = signal(false);

  // Documents flow steps
  currentStep = signal<DocStep>('welcome');

  // Barangay ID flow steps
  barangayStep = signal<BarangayStep>('requirements');

  resident = signal<Resident | null>(null);
  services = signal<Service[]>([]);
  selectedService = signal<Service | null>(null);
  barangayService = signal<Service | null>(null);
  capturedPhoto = signal<string | null>(null);
  capturedSignature = signal<string | null>(null);
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

  // Inline per-field capture state
  inlinePhotos = signal<Record<string, string>>({});
  activePhotoField = signal<string | null>(null);

  // Guest (temporary session) state
  guestForm = {
    fullName: '',
    birthDate: '',
    address: '',
    contactNumber: '',
    email: ''
  };

  barangayForm = {
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    birthDate: '',
    gender: '',
    civilStatus: '',
    occupation: '',
    bloodType: '',
    addressLine: '',
    contactNumber: '',
    email: '',
    emergencyContactName: '',
    emergencyContactNumber: ''
  };

  private stream: MediaStream | null = null;
  private idleTimer: any;
  private searchDebounce: any;
  private rfidScanSub: any = null;
  private rfidConnectionSub: any = null;

  constructor(
    private kioskService: KioskService,
    public identificationService: IdentificationService,
    private rfidScanService: RfidScanService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.resetIdleTimer();
    this.rfidScanSub = this.rfidScanService.scans().subscribe(event => this.handleRfidScan(event.uid));
    this.rfidConnectionSub = this.rfidScanService.connection().subscribe(connected => {
      this.rfidConnected.set(connected);
    });
    // Preload the Barangay ID service requirements for the application flow
    this.loadBarangayService();
  }

  ngOnDestroy() {
    this.stopCamera();
    this.rfidScanService.disconnect();
    if (this.rfidScanSub) this.rfidScanSub.unsubscribe();
    if (this.rfidConnectionSub) this.rfidConnectionSub.unsubscribe();
    clearTimeout(this.idleTimer);
    clearTimeout(this.searchDebounce);
  }

  loadServices() {
    this.kioskService.getServices().subscribe({
      next: (result: any) => {
        this.services.set(result?.data || []);
        this.barangayService.set((result?.data || []).find((s: Service) => s.service_name === 'Barangay ID') || null);
      }
    });
  }

  private loadBarangayService() {
    this.kioskService.getServices().subscribe({
      next: (result: any) => {
        this.barangayService.set((result?.data || []).find((s: Service) => s.service_name === 'Barangay ID') || null);
      }
    });
  }

  // ============================================================
  // MODE TRANSITIONS
  // ============================================================

  startRfid() {
    this.stopCamera();
    this.errorMessage.set('');
    this.rfidError.set('');
    this.mode.set('rfid');
    this.rfidStep.set('scan');
    this.rfidScanService.connect();
    this.resetIdleTimer();
  }

  retryRfid() {
    this.rfidError.set('');
    this.rfidStep.set('scan');
    this.rfidScanService.connect();
    this.resetIdleTimer();
  }

  continueWithout() {
    this.stopCamera();
    this.errorMessage.set('');
    this.rfidScanService.disconnect();
    this.mode.set('guest');
    this.resetIdleTimer();
  }

  startGuestRequest() {
    this.stopCamera();
    this.errorMessage.set('');
    this.formError.set('');
    this.guestForm = { fullName: '', birthDate: '', address: '', contactNumber: '', email: '' };
    this.mode.set('documents');
    this.currentStep.set('guest-info');
    this.resetIdleTimer();
  }

  startBarangay() {
    this.stopCamera();
    this.errorMessage.set('');
    this.formError.set('');
    this.capturedPhoto.set(null);
    this.capturedSignature.set(null);
    this.resetBarangayForm();
    this.mode.set('barangay');
    this.barangayStep.set('requirements');
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
      occupation: '',
      bloodType: '',
      addressLine: '',
      contactNumber: '',
      email: '',
      emergencyContactName: '',
      emergencyContactNumber: ''
    };
  }

  // ============================================================
  // RFID FLOW
  // ============================================================

  private handleRfidScan(uid: string) {
    if (this.mode() !== 'rfid' || this.rfidStep() !== 'scan') return;
    this.rfidScanService.disconnect();
    this.kioskService.verifyRfid(uid).subscribe({
      next: (result: any) => {
        const data = result?.data;
        if (data?.recognized && data.resident) {
          this.rfidStep.set('search');
          this.resident.set(data.resident);
          this.mode.set('documents');
          this.currentStep.set('welcome');
          this.resetIdleTimer();
          this.cdr.detectChanges();
        } else {
          this.rfidError.set('Your card was not recognized.');
          this.rfidStep.set('error');
          this.resetIdleTimer();
        }
      },
      error: () => {
        this.rfidError.set('We could not read your card.');
        this.rfidStep.set('error');
        this.resetIdleTimer();
      }
    });
  }

  // ============================================================
  // DOCUMENTS FLOW: MANUAL RESIDENT SEARCH
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
    this.rfidStep.set('search');

    this.kioskService.getResident(r.resident_id).subscribe({
      next: (result: any) => {
        this.resident.set(result.data);
        this.mode.set('documents');
        this.currentStep.set('welcome');
        this.resetIdleTimer();
      },
      error: () => {
        this.errorMessage.set('Failed to load resident info.');
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
    this.inlinePhotos.set({});
    this.activePhotoField.set(null);
    this.currentStep.set('requirements');
    this.resetIdleTimer();
  }

  proceedToForm() {
    const defaults: Record<string, unknown> = {};
    for (const field of this.selectedService()?.form_fields || []) {
      if (field.defaultValue) defaults[field.key] = field.defaultValue;
    }
    this.formValues.set(defaults);

    const resident = this.resident();
    if (resident) {
      const nameParts = [resident.first_name, resident.middle_name, resident.last_name, resident.suffix].filter(Boolean);
      const source: Record<string, any> = {
        full_name: nameParts.join(' '),
        address: resident.address_line,
        address_line: resident.address_line,
        birth_date: this.formatDate(resident.birth_date),
        gender: resident.gender,
        civil_status: resident.civil_status,
        blood_type: resident.blood_type,
        contact_number: resident.contact_number,
        email: resident.email,
        emergency_contact_name: resident.emergency_contact_name,
        emergency_contact_number: resident.emergency_contact_number
      };
      const prefilled: Record<string, any> = {};
      for (const key of Object.keys(source)) {
        const value = source[key];
        if (value !== null && value !== undefined) prefilled[key] = value;
      }
      this.formValues.update(v => ({ ...v, ...prefilled }));
    }
    this.currentStep.set('form');
    this.resetIdleTimer();
  }

  private formatDate(value: string | null): string {
    return value ? value.slice(0, 10) : '';
  }

  updateFormValue(key: string, value: any) {
    this.formValues.update(v => ({ ...v, [key]: value }));
    if (this.formErrors()[key]) {
      this.formErrors.update(e => { const n = { ...e }; delete n[key]; return n; });
    }
  }

  clearFieldValue(key: string) {
    this.updateFormValue(key, null);
  }

  private isEmptyValue(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    return false;
  }

  // ---- Checkbox group ----
  isCheckboxChecked(field: FormField, opt: string): boolean {
    const arr = this.formValues()[field.key];
    return Array.isArray(arr) && (arr as string[]).includes(opt);
  }

  toggleCheckboxOption(field: FormField, opt: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const current = this.formValues()[field.key];
    const arr = Array.isArray(current) ? [...(current as string[])] : [];
    if (checked && !arr.includes(opt)) arr.push(opt);
    if (!checked) {
      const idx = arr.indexOf(opt);
      if (idx > -1) arr.splice(idx, 1);
    }
    this.updateFormValue(field.key, arr);
  }

  // ---- Signature field ----
  onFieldSignature(key: string, dataUrl: string) {
    this.updateFormValue(key, dataUrl);
  }

  // ---- Photo field (inline capture) ----
  startInlineCamera(key: string) {
    this.activePhotoField.set(key);
    this.resetIdleTimer();
    setTimeout(() => this.startCamera(), 100);
  }

  captureInlinePhoto(key: string) {
    if (!this.inlineVideoEl?.nativeElement) return;
    const dataUrl = this.drawFrame(this.inlineVideoEl.nativeElement);
    this.inlinePhotos.update(p => ({ ...p, [key]: dataUrl }));
    this.updateFormValue(key, dataUrl);
    this.activePhotoField.set(null);
    this.stopCamera();
  }

  cancelInlinePhoto(key: string) {
    this.activePhotoField.set(null);
    this.stopCamera();
  }

  retakeInlinePhoto(key: string) {
    this.startInlineCamera(key);
  }

  // ---- File upload field ----
  onFileSelected(field: FormField, event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const maxBytes = field.maxSize || 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      this.formErrors.update(e => ({
        ...e,
        [field.key]: `${field.label} must be under ${Math.round(maxBytes / (1024 * 1024))} MB.`
      }));
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.updateFormValue(field.key, reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  // ---- Review display ----
  displayFormValue(field: FormField, value: unknown): string {
    if (this.isEmptyValue(value)) return '—';
    if (Array.isArray(value)) return (value as string[]).join(', ');
    if (typeof value === 'string' && value.startsWith('data:')) return 'Captured';
    return String(value);
  }

  validateForm() {
    const fields = this.selectedService()?.form_fields || [];
    let hasErrors = false;
    const newErrors: Record<string, string> = {};
    for (const field of fields) {
      const value = this.formValues()[field.key];
      const message = this.validateField(field, value);
      if (message) {
        newErrors[field.key] = message;
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

  private validateField(field: FormField, value: unknown): string | null {
    const empty = this.isEmptyValue(value);
    if (empty) {
      if (field.required) return `${field.label} is required.`;
      return null;
    }

    const v = field.validation;
    if (!v) return null;

    if (typeof value === 'string' && !value.startsWith('data:')) {
      const str = value.trim();
      if (v.minLength && str.length < v.minLength) {
        return `${field.label} must be at least ${v.minLength} characters.`;
      }
      if (v.maxLength && str.length > v.maxLength) {
        return `${field.label} must be at most ${v.maxLength} characters.`;
      }
      if (v.pattern && !new RegExp(v.pattern).test(str)) {
        return v.patternMessage || `${field.label} has an invalid format.`;
      }
    }

    if (field.type === 'number' && typeof value === 'number') {
      if (v.min !== undefined && value < v.min) return `${field.label} must be at least ${v.min}.`;
      if (v.max !== undefined && value > v.max) return `${field.label} must be at most ${v.max}.`;
    }

    return null;
  }

  // Guest temporary session form validation
  validateGuestForm() {
    this.formError.set('');
    const g = this.guestForm;
    if (!g.fullName.trim()) {
      this.formError.set('Full name is required.');
      return;
    }
    if (!g.birthDate) {
      this.formError.set('Date of birth is required.');
      return;
    }
    if (!g.address.trim()) {
      this.formError.set('Address is required.');
      return;
    }
    if (!g.contactNumber.trim()) {
      this.formError.set('Contact number is required.');
      return;
    }
    this.errorMessage.set('');
    this.loadServices();
    this.currentStep.set('services');
    this.resetIdleTimer();
  }

  // ============================================================
  // BARANGAY ID FLOW
  // ============================================================

  proceedToBarangayForm() {
    this.barangayStep.set('form');
    this.resetIdleTimer();
  }

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
      this.formError.set('Sex is required.');
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
    if (!f.contactNumber.trim()) {
      this.formError.set('Contact number is required.');
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
    this.barangayStep.set('signature');
    this.resetIdleTimer();
  }

  onSignatureCaptured(dataUrl: string) {
    this.capturedSignature.set(dataUrl);
    this.barangayStep.set('review');
    this.resetIdleTimer();
  }

  submitBarangay() {
    if (!this.capturedPhoto()) {
      this.errorMessage.set('A photo is required for your Barangay ID.');
      this.barangayStep.set('photo');
      return;
    }
    if (!this.capturedSignature()) {
      this.errorMessage.set('A signature is required for your Barangay ID.');
      this.barangayStep.set('signature');
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
      occupation: this.barangayForm.occupation.trim() || null,
      blood_type: this.barangayForm.bloodType || null,
      address_line: this.barangayForm.addressLine.trim(),
      contact_number: this.barangayForm.contactNumber.trim() || null,
      email: this.barangayForm.email.trim() || null,
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
      occupation: this.barangayForm.occupation.trim() || undefined,
      bloodType: this.barangayForm.bloodType || undefined,
      addressLine: this.barangayForm.addressLine.trim(),
      contactNumber: this.barangayForm.contactNumber.trim() || undefined,
      email: this.barangayForm.email.trim() || undefined,
      emergencyContactName: this.barangayForm.emergencyContactName.trim(),
      emergencyContactNumber: this.barangayForm.emergencyContactNumber.trim(),
      photo: this.capturedPhoto() || undefined,
      signature: this.capturedSignature() || undefined,
      form_data: formData
    }).subscribe({
      next: (result: any) => {
        this.requestNumber.set(result?.data?.application_number || 'N/A');
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

  startCamera(target?: HTMLVideoElement) {
    if (this.stream) return;
    navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
      .then(stream => {
        this.stream = stream;
        const el = target || this.videoEl?.nativeElement;
        if (el) el.srcObject = stream;
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

  private drawFrame(el: HTMLVideoElement): string {
    const canvas = document.createElement('canvas');
    canvas.width = el.videoWidth;
    canvas.height = el.videoHeight;
    canvas.getContext('2d')?.drawImage(el, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  }

  capturePhoto() {
    if (!this.videoEl?.nativeElement) return;
    this.capturedPhoto.set(this.drawFrame(this.videoEl.nativeElement));
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
  // DISPLAY HELPERS (resident or guest)
  // ============================================================

  isGuestSession(): boolean {
    return this.mode() === 'documents' && this.currentStep() !== 'welcome' && !this.resident();
  }

  displayName(): string {
    if (this.resident()) return `${this.resident()!.first_name} ${this.resident()!.last_name}`;
    return this.guestForm.fullName || 'Guest';
  }

  displayAddress(): string {
    if (this.resident()) return this.resident()!.address_line || '';
    return this.guestForm.address || '';
  }

  displayCode(): string {
    if (this.resident()) return this.resident()!.resident_code || '';
    return 'Temporary Session';
  }

  displayPhoto(): string | null {
    if (this.capturedPhoto()) return this.capturedPhoto();
    return this.resident()?.photo || null;
  }

  // ============================================================
  // NAVIGATION
  // ============================================================

  goBack() {
    if (this.mode() === 'rfid') {
      if (this.rfidStep() === 'search') {
        this.rfidStep.set('scan');
        return;
      }
      if (this.rfidStep() === 'error') {
        this.rfidStep.set('scan');
        return;
      }
      // From scan back to Home
      this.rfidScanService.disconnect();
      this.mode.set('home');
      return;
    }

    if (this.mode() === 'guest') {
      this.mode.set('home');
      return;
    }

    if (this.mode() === 'documents') {
      const step = this.currentStep();
      if (step === 'welcome') {
        this.resident.set(null);
        this.mode.set('rfid');
        this.rfidStep.set('scan');
        this.rfidScanService.connect();
        return;
      }
      if (step === 'guest-info') {
        this.mode.set('guest');
        return;
      }
      if (step === 'review') {
        if (this.selectedService()?.requires_photo) {
          this.currentStep.set('photo');
          setTimeout(() => this.startCamera(), 100);
        } else {
          this.currentStep.set('form');
        }
        return;
      }
      if (step === 'form') {
        this.stopCamera();
        this.currentStep.set('requirements');
        return;
      }
      if (step === 'requirements') {
        this.currentStep.set('services');
        return;
      }
      const steps: DocStep[] = ['welcome', 'guest-info', 'services', 'requirements', 'form', 'photo', 'review', 'success'];
      const idx = steps.indexOf(step);
      if (idx > 0) {
        if (step === 'photo') this.stopCamera();
        this.currentStep.set(steps[idx - 1]);
      }
      return;
    }

    if (this.mode() === 'barangay') {
      const step = this.barangayStep();
      if (step === 'requirements') {
        this.mode.set('guest');
        return;
      }
      if (step === 'review') {
        this.barangayStep.set('signature');
        return;
      }
      if (step === 'signature') {
        this.barangayStep.set('photo');
        this.capturedPhoto.set(null);
        setTimeout(() => this.startCamera(), 100);
        return;
      }
      const bSteps: BarangayStep[] = ['requirements', 'form', 'photo', 'signature', 'review', 'success'];
      const idx = bSteps.indexOf(step);
      if (idx > 0) this.barangayStep.set(bSteps[idx - 1]);
    }
  }

  submitRequest() {
    const service = this.selectedService();
    if (!service) {
      this.errorMessage.set('Missing service information. Please start over.');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');

    const resident = this.resident();
    const data: any = {
      service_id: service.service_id,
      photo: this.capturedPhoto() || undefined,
      form_data: this.formValues()
    };

    if (resident) {
      data.resident_id = resident.resident_id;
    } else {
      data.guest = {
        full_name: this.guestForm.fullName.trim(),
        birth_date: this.guestForm.birthDate || undefined,
        address: this.guestForm.address.trim(),
        contact_number: this.guestForm.contactNumber.trim(),
        email: this.guestForm.email.trim() || undefined
      };
    }

    this.kioskService.createRequest(data).subscribe({
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
    this.rfidScanService.disconnect();
    this.mode.set('home');
    this.currentStep.set('welcome');
    this.barangayStep.set('requirements');
    this.rfidStep.set('scan');
    this.resident.set(null);
    this.selectedService.set(null);
    this.capturedPhoto.set(null);
    this.capturedSignature.set(null);
    this.requestNumber.set('');
    this.errorMessage.set('');
    this.formError.set('');
    this.searchQuery = '';
    this.searchResults.set([]);
    this.resetBarangayForm();
    this.guestForm = { fullName: '', birthDate: '', address: '', contactNumber: '', email: '' };
    this.formValues.set({});
    this.formErrors.set({});
    this.inlinePhotos.set({});
    this.activePhotoField.set(null);
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
