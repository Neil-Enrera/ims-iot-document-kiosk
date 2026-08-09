import { Component, OnInit, OnDestroy, signal, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KioskService, Resident, Service, GuestInfo, FormField } from './kiosk.service';
import { IdentificationService } from './identification.service';
import { RfidScanService } from './rfid-scan.service';
import { KioskStateService, KioskState } from './kiosk-state.service';
import { ButtonComponent } from './button.component';
import { SignaturePadComponent } from './signature-pad.component';
import { BarangayPreviewModalComponent } from './barangay-preview-modal.component';
import { TranslationService, KioskLanguage } from '../../i18n/translation.service';

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
  imports: [CommonModule, FormsModule, ButtonComponent, SignaturePadComponent, BarangayPreviewModalComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white select-none flex">

      <!-- MAIN KIOSK AREA -->
      <div class="flex-1 relative">

        <!-- ============ HOME: Landing (Production-ready) ============ -->
        @if (mode() === 'home') {
          <div class="absolute inset-0 overflow-hidden bg-[#F8FAFC] text-[#0F172A] select-none flex flex-col [font-family:'Inter',sans-serif]">

            <!-- Background image (uploaded) -->
            <div class="absolute inset-0 bg-cover bg-center pointer-events-none" style="background-image: url('Background.png')" aria-hidden="true"></div>
            <!-- Subtle radial glow centered behind the headline keeps text legible without washing the orange -->
            <div class="absolute inset-0 pointer-events-none" aria-hidden="true"
                 style="background: radial-gradient(ellipse 72% 58% at 50% 42%, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.35) 55%, rgba(255,255,255,0.05) 100%);"></div>

            <!-- Curved orange header accent (top-left) -->
            <div class="absolute top-0 left-0 w-64 h-40 pointer-events-none" aria-hidden="true">
              <svg viewBox="0 0 256 160" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0 H256 V80 C256 124 220 160 176 160 H0 Z" fill="#F97316" opacity="0.12"/>
              </svg>
            </div>

            <div class="relative flex-1 overflow-y-auto">
              <div class="min-h-full flex flex-col items-center justify-center px-4 sm:px-8 py-6">

              <!-- Header -->
              <div class="text-center mb-10 lg:mb-16">
                <div class="mx-auto mb-6 lg:mb-8 flex items-center justify-center">
                  <div class="w-24 h-24 lg:w-[120px] lg:h-[120px] rounded-full bg-white border-2 border-[#F97316]/40 flex items-center justify-center shadow-sm overflow-hidden shrink-0">
                    <img src="Barangay Logo.png" alt="Barangay San Manuel logo" class="w-full h-full object-cover">
                  </div>
                </div>
                <p class="text-[11px] sm:text-[13px] font-semibold tracking-[0.35em] text-[#F97316] mb-2.5">{{ t('landing.welcome') }}</p>
                <h1 class="text-[clamp(1.875rem,5.5vw,3.25rem)] font-bold tracking-tight text-[#0F172A] leading-[1.1]">{{ t('landing.barangayName') }}</h1>
                <p class="text-[clamp(1rem,2vw,1.25rem)] font-medium text-[#64748B] mt-2 lg:mt-3 mb-6 lg:mb-10">{{ t('landing.subtitle') }}</p>
                <p class="text-[clamp(1rem,2.2vw,1.375rem)] text-[#64748B] max-w-xl mx-auto font-normal px-2">{{ t('landing.prompt') }}</p>
              </div>

              <!-- Primary Action Cards -->
              <div class="flex flex-wrap justify-center items-stretch gap-6 lg:gap-10 w-full max-w-6xl">

                <!-- Card 1: Scan Barangay ID (RFID) -->
                <button
                  (click)="startRfid()"
                  class="group flex items-center gap-5 lg:gap-8 rounded-[18px] border border-[#F97316]/60 bg-white p-6 lg:p-8 shadow-sm hover:shadow-md hover:border-[#F97316] transition-all duration-200 text-left flex-1 min-w-[min(100%,320px)] max-w-[560px]">
                  <div class="shrink-0 w-16 h-16 lg:w-[72px] lg:h-[72px] rounded-xl bg-[#FFF7ED] flex items-center justify-center">
                    <svg class="w-10 h-10 lg:w-11 lg:h-11 text-[#F97316] transition-transform group-hover:scale-105" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <!-- RFID card with wireless signal -->
                      <rect x="3" y="6" width="18" height="12" rx="2"/>
                      <path d="M7 9.5h7M7 12h7" stroke-linecap="round"/>
                      <path d="M18 9v0.01 M18 12.5v0.01 M18 16v0.01" stroke-linecap="round" stroke-width="2.5"/>
                      <path d="M18.5 15l1.2-1.2M18.5 9L17.3 10.2" stroke-linecap="round"/>
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-[clamp(1.25rem,2.4vw,1.625rem)] font-bold text-[#0F172A] pb-2 lg:pb-3">{{ t('landing.scanId.title') }}</p>
                    <p class="text-[clamp(0.95rem,1.6vw,1.125rem)] text-[#64748B] leading-snug font-normal">{{ t('landing.scanId.desc') }}</p>
                  </div>
                  <div class="shrink-0 w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-[#F97316] flex items-center justify-center shadow-sm group-hover:shadow transition-all ml-1">
                    <svg class="w-6 h-6 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </button>

                <!-- Card 2: Continue Without Barangay ID -->
                <button
                  (click)="continueWithout()"
                  class="group flex items-center gap-5 lg:gap-8 rounded-[18px] border border-[#F97316]/60 bg-white p-6 lg:p-8 text-left hover:shadow-md hover:border-[#F97316] transition-all duration-200 shadow-sm flex-1 min-w-[min(100%,320px)] max-w-[560px]">
                  <div class="shrink-0 w-16 h-16 lg:w-[72px] lg:h-[72px] rounded-xl bg-[#FFF7ED] flex items-center justify-center">
                    <svg class="w-10 h-10 lg:w-11 lg:h-11 text-[#F97316] transition-transform group-hover:scale-105" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <!-- Person + document/certificate -->
                      <circle cx="9" cy="8" r="3.5"/>
                      <path d="M4 20c0-3.3 2.2-5 5-5s5 1.7 5 5"/>
                      <rect x="13" y="6" width="9" height="12" rx="1.5"/>
                      <path d="M15 10h5M15 13h5M15 16h4"/>
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-[clamp(1.25rem,2.4vw,1.625rem)] font-bold text-[#0F172A] pb-2 lg:pb-3 leading-snug">{{ t('landing.continue.title') }}</p>
                    <p class="text-[clamp(0.95rem,1.6vw,1.125rem)] text-[#64748B] leading-snug font-normal">{{ t('landing.continue.desc') }}</p>
                  </div>
                  <div class="shrink-0 w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-[#F97316] flex items-center justify-center shadow-sm ml-1 group-hover:shadow transition-shadow">
                    <svg class="w-6 h-6 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </button>
              </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="relative border-t border-[#E5E7EB] bg-white/90 backdrop-blur-sm">
              <div class="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-1.5 lg:py-2 grid grid-cols-2 md:grid-cols-4 gap-x-6 lg:gap-x-8 gap-y-2 lg:gap-y-3 items-center">

                <!-- Section 1: Language -->
                <div class="flex flex-col items-center gap-1.5 text-center min-w-0">
                  <div class="flex items-center gap-1.5 text-[#0F172A]">
                    <svg class="w-[18px] h-[18px] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18"/>
                    </svg>
                    <span class="text-[13px] font-semibold">{{ t('landing.footer.language') }}</span>
                  </div>
                  <div class="inline-flex rounded-lg overflow-hidden border border-[#E5E7EB] bg-white shadow-sm min-w-0">
                    <button
                      (click)="setLanguage('en')"
                      class="px-3 sm:px-5 py-1.5 text-[13px] font-semibold transition-colors min-h-[34px]"
                      [class.bg-[#F97316]]="language() === 'en'"
                      [class.text-white]="language() === 'en'"
                      [class.bg-white]="language() !== 'en'"
                      [class.text-[#0F172A]]="language() !== 'en'">
                      English
                    </button>
                    <button
                      (click)="setLanguage('fil')"
                      class="px-3 sm:px-5 py-1.5 text-[13px] border-l border-[#E5E7EB] font-semibold transition-colors min-h-[34px]"
                      [class.bg-[#F97316]]="language() === 'fil'"
                      [class.text-white]="language() === 'fil'"
                      [class.bg-white]="language() !== 'fil'"
                      [class.text-[#0F172A]]="language() !== 'fil'">
                      Filipino
                    </button>
                  </div>
                </div>

                <!-- Section 2: Need Assistance -->
                <div class="flex flex-col items-center gap-1 text-center min-w-0">
                  <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9"/>
                    <path d="M9.5 9a2.5 2.5 0 114.6 1.3c-.8 1-1.9 1.7-1.9 3.2" stroke-linecap="round"/>
                    <path d="M12 17h.01" stroke-linecap="round"/>
                  </svg>
                  <div>
                    <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.assistance') }}</p>
                    <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.assistanceDesc') }}</p>
                  </div>
                </div>

                <!-- Section 3: Office Hours -->
                <div class="flex flex-col items-center gap-1 text-center min-w-0">
                  <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9"/>
                    <path d="M12 7v5l3 2" stroke-linecap="round"/>
                  </svg>
                  <div>
                    <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.hours') }}</p>
                    <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.monFri') }}</p>
                    <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.hoursRange') }}</p>
                  </div>
                </div>

                <!-- Section 4: Date & Time -->
                <div class="flex flex-col items-center gap-1 text-center min-w-0">
                  <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                    <rect x="3" y="5" width="18" height="16" rx="2"/>
                    <path d="M8 3v4M16 3v4M3 10h18"/>
                  </svg>
                  <div class="min-w-0">
                    <p class="text-[11px] lg:text-[12px] font-medium text-[#64748B] leading-snug">{{ formatFooterDate() }}</p>
                    <p class="text-base lg:text-lg font-bold text-[#F97316] leading-tight">{{ formatFooterTime() }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- ============ RFID: Scan Barangay ID ============ -->
        @if (mode() === 'rfid') {

          <!-- RFID STEP: scan -->
          @if (rfidStep() === 'scan') {
            <div class="absolute inset-0 bg-[#F8FAFC] text-[#0F172A] select-none overflow-hidden [font-family:'Inter',sans-serif] flex flex-col">

              <!-- Background image (same as the kiosk landing page) -->
              <div class="absolute inset-0 bg-cover bg-center pointer-events-none" style="background-image: url('Background.png')" aria-hidden="true"></div>
              <!-- Subtle radial glow keeps the content legible without washing the orange -->
              <div class="absolute inset-0 pointer-events-none" aria-hidden="true"
                   style="background: radial-gradient(ellipse 72% 58% at 50% 42%, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.35) 55%, rgba(255,255,255,0.05) 100%);"></div>
              <!-- Curved orange header accent (top-left, same as landing) -->
              <div class="absolute top-0 left-0 w-64 h-40 pointer-events-none" aria-hidden="true">
                <svg viewBox="0 0 256 160" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 0 H256 V40 C256 128 220 160 176 160 H0 Z" fill="#F97316" opacity="0.12"/>
                </svg>
              </div>

              <div class="relative flex-1 overflow-y-auto">
                <div class="min-h-full flex flex-col items-center justify-center px-4 sm:px-8 py-6 sm:py-10">

                  <!-- Back button (pinned top-left: circular icon + "Back" text outside) -->
                  <div class="fixed top-4 left-4 z-40 flex items-center gap-2.5 sm:gap-3">
                    <button (click)="goBack()"
                            class="w-[48px] h-[48px] sm:w-[52px] sm:h-[52px] rounded-full border-2 border-[#F97316]/60 bg-white flex items-center justify-center shadow-sm hover:bg-[#FFF7ED] active:scale-[0.98] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/30"
                            [attr.aria-label]="t('common.back')">
                      <svg class="w-6 h-6 sm:w-7 sm:h-7 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                      </svg>
                    </button>
                    <button (click)="goBack()"
                            class="flex items-center min-h-[44px] rounded-xl px-1 text-[#0F172A] font-semibold text-[15px] sm:text-base hover:text-[#F97316] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F97316]/40">
                      {{ t('common.back') }}
                    </button>
                  </div>

                  <!-- Centered logo + title -->
                  <div class="text-center mb-8 sm:mb-10 mt-10 sm:mt-6">
                    <div class="mx-auto mb-5 sm:mb-6 w-[clamp(84px,11vw,116px)] h-[clamp(84px,11vw,116px)] rounded-full bg-white border-2 border-[#F97316]/40 overflow-hidden flex items-center justify-center shadow-sm">
                      <img src="Barangay Logo.png" alt="Barangay San Manuel logo" class="w-full h-full object-cover">
                    </div>
                    <h1 class="text-[clamp(1.75rem,4vw,2.5rem)] font-bold tracking-tight text-[#0F172A] leading-tight">{{ t('rfid.title') }}</h1>
                    <p class="text-[clamp(1rem,1.9vw,1.25rem)] font-medium text-[#64748B] mt-2.5 sm:mt-3 max-w-xl mx-auto px-2">{{ t('rfid.subtitle') }}</p>
                  </div>

                  <!-- Scanning area -->
                  <div class="flex flex-col items-center mb-8 sm:mb-10 w-full">
                    <div class="relative w-[clamp(210px,40vmin,340px)] h-[clamp(210px,40vmin,340px)] flex items-center justify-center">
                      @if (!rfidDetected()) {
                        <!-- RFID radar pulse: 4 identical rings expanding from the center.
                          Negative animation-delays start each ring already mid-cycle, so
                          the radar is visibly moving the instant the screen renders. -->
                        <div class="rfid-pulse-ring absolute inset-0 rounded-full border-2 border-[#F97316]/50" style="animation-delay:-2.4s"></div>
                        <div class="rfid-pulse-ring absolute inset-0 rounded-full border-2 border-[#F97316]/40" style="animation-delay:-1.6s"></div>
                        <div class="rfid-pulse-ring absolute inset-0 rounded-full border-2 border-[#F97316]/30" style="animation-delay:-0.8s"></div>
                        <div class="rfid-pulse-ring absolute inset-0 rounded-full border-2 border-[#F97316]/20" style="animation-delay:0s"></div>
                      }
                      <!-- Center RFID card icon / detected success -->
                      <div class="relative z-10 w-[clamp(140px,24vmin,200px)] h-[clamp(140px,24vmin,200px)] rounded-full bg-white border-2 border-[#F97316]/30 shadow-sm flex items-center justify-center"
                           [class.border-[#10B981]]="rfidDetected()">
                        @if (!rfidDetected()) {
                          <svg class="w-[clamp(72px,12.5vmin,128px)] h-[clamp(72px,12.5vmin,128px)] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                            <rect x="3" y="6" width="18" height="12" rx="2"/>
                            <path d="M7 9.5h7M7 12.5h7" stroke-linecap="round"/>
                            <path d="M18 9.2v.01M18 12.4v.01M18 15.6v.01" stroke-linecap="round" stroke-width="2.6"/>
                            <path d="M18.6 16.2l1.6-1.6M18.6 7.8L20.2 9.4" stroke-linecap="round"/>
                          </svg>
                        } @else {
                          <svg class="w-[clamp(72px,12.5vmin,128px)] h-[clamp(72px,12.5vmin,128px)] text-[#10B981] rfid-success-pop" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" stroke-width="1.8"/>
                            <path d="M15.5 9.5l-4.5 5-2.5-2.5" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        }
                      </div>
                    </div>
                    <p class="mt-5 sm:mt-6 text-base sm:text-lg font-medium text-[#64748B]">
                      @if (rfidDetected()) {
                        <span class="text-[#10B981] font-semibold">{{ t('rfid.found') }}</span>
                      } @else {
                        {{ t('rfid.waiting') }}
                      }
                    </p>
                  </div>

                  <!-- Scanner status card -->
                  @if (!rfidConnected()) {
                    <div class="w-full max-w-xl bg-white/95 border border-[#E5E7EB] rounded-2xl px-5 sm:px-6 py-4 sm:py-5 flex items-start gap-4 mb-6 sm:mb-8 shadow-sm backdrop-blur-sm">
                      <div class="w-11 h-11 rounded-full bg-[#FFF5EE] flex items-center justify-center shrink-0">
                        <svg class="w-6 h-6 text-[#F59E0B]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                        </svg>
                      </div>
                      <div class="text-left">
                        <p class="text-[15px] font-bold text-[#0F172A]">{{ t('rfid.notDetected') }}</p>
                        <p class="text-sm text-[#64748B] mt-0.5 leading-snug">{{ t('rfid.notDetectedDesc') }}</p>
                      </div>
                    </div>
                  } @else {
                    <div class="w-full max-w-xl bg-white/95 border border-[#E5E7EB] rounded-2xl px-5 sm:px-6 py-4 sm:py-5 flex items-center gap-4 mb-6 sm:mb-8 shadow-sm backdrop-blur-sm">
                      <div class="w-11 h-11 rounded-full bg-[#ECFDF5] flex items-center justify-center shrink-0">
                        <svg class="w-6 h-6 text-[#10B981]" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="9"/>
                          <path d="M8.5 12.5l2.2 2.2 4.8-4.8" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </div>
                      <div class="text-left">
                        <p class="text-[15px] font-bold text-[#0F172A]">{{ t('rfid.ready') }}</p>
                        <p class="text-sm text-[#64748B] mt-0.5 leading-snug">{{ t('rfid.readyDesc') }}</p>
                      </div>
                    </div>
                  }

                  <!-- Primary action -->
                  <button (click)="rfidStep.set('search')"
                          class="w-full max-w-xl min-h-[64px] sm:min-h-[80px] px-8 py-4 sm:py-5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] active:scale-[0.995] text-white text-lg sm:text-xl font-semibold flex items-center justify-center transition-all focus:outline-none focus:ring-4 focus:ring-[#F97316]/30 shadow-sm">
                    {{ t('rfid.findRecord') }}
                  </button>

                  <!-- Secondary action -->
                  <button (click)="continueWithout()"
                          class="mt-5 sm:mt-6 min-h-[56px] px-8 text-[#F97316] hover:text-[#EA580C] text-base sm:text-lg font-semibold hover:underline underline-offset-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#F97316]/40">
                    {{ t('rfid.continueWithout') }}
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
                <h2 class="text-3xl font-bold mb-4">{{ t('rfid.error.title') }}</h2>
                <p class="text-xl text-blue-200 mb-8">
                  {{ rfidError() }}
                  <br/>
                  {{ t('rfid.error.desc') }}
                </p>
                <div class="flex flex-col gap-4">
                  <app-button variant="primary" size="lg" class="w-full" (onClick)="retryRfid()">{{ t('common.scanAgain') }}</app-button>
                  <app-button variant="secondary" size="lg" class="w-full" (onClick)="continueWithout()">
                    {{ t('rfid.continueWithout') }}
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
                    <h2 class="text-2xl font-bold">{{ t('rfid.search.title') }}</h2>
                    <p class="text-blue-300 text-sm mt-1">{{ t('rfid.search.subtitle') }}</p>
                  </div>
                  <button class="text-blue-300 hover:text-white text-lg" (click)="rfidStep.set('scan')">{{ t('common.back') }}</button>
                </div>

                <div class="bg-blue-800/50 rounded-2xl p-6 backdrop-blur">
                  <p class="text-blue-300 text-sm mb-4">{{ t('rfid.search.hint') }}</p>
                  <div class="relative">
                    <input
                      type="text"
                      [(ngModel)]="searchQuery"
                      (ngModelChange)="onSearchChange($event)"
                      [placeholder]="t('rfid.search.placeholder')"
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
                    <p class="mt-4 text-blue-300 text-sm">{{ t('rfid.search.noResults') }}</p>
                  }

                  @if (searching()) {
                    <div class="mt-4 flex items-center justify-center gap-2 text-blue-300">
                      <div class="animate-spin w-5 h-5 border-2 border-blue-300 border-t-transparent rounded-full"></div>
                      <span class="text-sm">{{ t('rfid.search.searching') }}</span>
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
          <div class="absolute inset-0 bg-[#F8FAFC] text-[#0F172A] select-none overflow-hidden [font-family:'Inter',sans-serif] flex flex-col">

            <!-- Background image (same as the kiosk landing page) -->
            <div class="absolute inset-0 bg-cover bg-center pointer-events-none" style="background-image: url('Background.png')" aria-hidden="true"></div>
            <!-- Subtle radial glow keeps the text legible without washing the orange -->
            <div class="absolute inset-0 pointer-events-none" aria-hidden="true"
                 style="background: radial-gradient(ellipse 72% 58% at 50% 42%, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.35) 55%, rgba(255,255,255,0.05) 100%);"></div>
            <!-- Curved orange header accent (top-left, same as landing) -->
            <div class="absolute top-0 left-0 w-64 h-40 pointer-events-none" aria-hidden="true">
              <svg viewBox="0 0 256 160" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0 H256 V40 C256 128 220 160 176 160 H0 Z" fill="#F97316" opacity="0.12"/>
              </svg>
            </div>

            <!-- Back button (pinned top-left: circular icon + "Back" text outside) -->
            <div class="fixed top-4 left-4 z-40 flex items-center gap-2.5 sm:gap-3">
              <button (click)="goBack()"
                      class="w-[48px] h-[48px] sm:w-[52px] sm:h-[52px] rounded-full border-2 border-[#F97316]/60 bg-white flex items-center justify-center shadow-sm hover:bg-[#FFF7ED] active:scale-[0.98] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/30"
                      [attr.aria-label]="t('common.back')">
                <svg class="w-6 h-6 sm:w-7 sm:h-7 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <button (click)="goBack()"
                      class="flex items-center min-h-[44px] rounded-xl px-1 text-[#0F172A] font-semibold text-[15px] sm:text-base hover:text-[#F97316] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F97316]/40">
                {{ t('common.back') }}
              </button>
            </div>

            <!-- Main content -->
            <div class="relative flex-1 overflow-y-auto">
              <div class="min-h-full flex flex-col items-center justify-center px-4 sm:px-8 py-6 sm:py-10">

                <!-- Centered logo + title -->
                <div class="text-center mb-6 sm:mb-10 mt-10 sm:mt-6">
                  <div class="mx-auto mb-5 sm:mb-6 w-[clamp(84px,11vw,116px)] h-[clamp(84px,11vw,116px)] rounded-full bg-white border-2 border-[#F97316]/40 overflow-hidden flex items-center justify-center shadow-sm">
                    <img src="Barangay Logo.png" alt="Barangay San Manuel logo" class="w-full h-full object-cover">
                  </div>
                  <h1 class="text-[clamp(1.75rem,4vw,2.5rem)] font-bold tracking-tight text-[#0F172A] leading-tight">{{ t('guest.title') }}</h1>
                  <p class="text-[clamp(1rem,1.9vw,1.25rem)] font-medium text-[#64748B] mt-2.5 sm:mt-3 px-2">{{ t('guest.subtitle') }}</p>
                </div>

                <!-- Two horizontal cards (same responsive layout as the landing page) -->
                <div class="flex flex-wrap justify-center items-stretch gap-5 sm:gap-8 lg:gap-10 w-full max-w-6xl mb-5 sm:mb-6">

                  <!-- Card 1: Request Documents -->
                  <button class="group flex items-center gap-5 lg:gap-8 rounded-[18px] border border-[#F97316]/50 bg-white p-6 lg:p-8 shadow-sm hover:shadow-md hover:border-[#F97316] transition-all duration-200 text-left flex-1 min-w-[min(100%,320px)] max-w-[560px]"
                          (click)="startGuestRequest()">
                    <div class="shrink-0 w-16 h-16 lg:w-[72px] lg:h-[72px] rounded-xl bg-[#FFF7ED] flex items-center justify-center">
                      <svg class="w-10 h-10 lg:w-11 lg:h-11 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
                      </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-[clamp(1.25rem,2.4vw,1.625rem)] font-bold text-[#0F172A] pb-2 lg:pb-3 leading-snug">{{ t('guest.requestDocs.title') }}</p>
                      <p class="text-[clamp(0.95rem,1.6vw,1.125rem)] text-[#64748B] leading-snug font-normal">{{ t('guest.requestDocs.desc') }}</p>
                    </div>
                    <div class="shrink-0 w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-[#F97316] flex items-center justify-center shadow-sm group-hover:shadow transition-all ml-1">
                      <svg class="w-6 h-6 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                      </svg>
                    </div>
                  </button>

                  <!-- Card 2: Apply for Barangay ID -->
                  <button class="group flex items-center gap-5 lg:gap-8 rounded-[18px] border border-[#F97316]/50 bg-white p-6 lg:p-8 shadow-sm hover:shadow-md hover:border-[#F97316] transition-all duration-200 text-left flex-1 min-w-[min(100%,320px)] max-w-[560px]"
                          (click)="startBarangay()">
                    <div class="shrink-0 w-16 h-16 lg:w-[72px] lg:h-[72px] rounded-xl bg-[#FFF7ED] flex items-center justify-center">
                      <svg class="w-10 h-10 lg:w-11 lg:h-11 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z"/>
                      </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-[clamp(1.25rem,2.4vw,1.625rem)] font-bold text-[#0F172A] pb-2 lg:pb-3 leading-snug">{{ t('guest.applyId.title') }}</p>
                      <p class="text-[clamp(0.95rem,1.6vw,1.125rem)] text-[#64748B] leading-snug font-normal">{{ t('guest.applyId.desc') }}</p>
                    </div>
                    <div class="shrink-0 w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-[#F97316] flex items-center justify-center shadow-sm group-hover:shadow transition-all ml-1">
                      <svg class="w-6 h-6 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                      </svg>
                    </div>
                  </button>
                </div>

                <!-- Information card -->
                <div class="flex items-start gap-3 w-full max-w-6xl bg-white/95 border border-[#E5E7EB] rounded-2xl px-4 sm:px-6 py-4 sm:py-5 shadow-sm">
                  <div class="w-11 h-11 rounded-full bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-center shrink-0">
                    <svg class="w-6 h-6 text-[#64748B]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9"/>
                      <path d="M12 16v-4M12 8h.01" stroke-linecap="round"/>
                    </svg>
                  </div>
                  <p class="text-sm sm:text-base text-[#64748B] leading-snug pt-1.5">{{ t('guest.info') }}</p>
                </div>
              </div>
            </div>

            <!-- Footer: four sections, outline icons only -->
            <div class="relative border-t border-[#E5E7EB] bg-white/95 backdrop-blur-sm">
              <div class="max-w-5xl mx-auto px-4 sm:px-8 py-1.5 lg:py-2 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 lg:gap-y-3 items-center">

                <!-- Need Assistance -->
                <div class="flex flex-col items-center gap-1 text-center min-w-0">
                  <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9"/>
                    <path d="M9.5 9a2.5 2.5 0 114.6 1.3c-.8 1-1.9 1.7-1.9 3.2" stroke-linecap="round"/>
                    <path d="M12 17h.01" stroke-linecap="round"/>
                  </svg>
                  <div>
                    <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.assistance') }}</p>
                    <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.assistanceDesc') }}</p>
                  </div>
                </div>

                <!-- Office Hours -->
                <div class="flex flex-col items-center gap-1 text-center min-w-0">
                  <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9"/>
                    <path d="M12 7v5l3 2" stroke-linecap="round"/>
                  </svg>
                  <div>
                    <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.hours') }}</p>
                    <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.monFri') }}</p>
                    <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.hoursRange') }}</p>
                  </div>
                </div>

                <!-- Current Date -->
                <div class="flex flex-col items-center gap-1 text-center min-w-0">
                  <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                    <rect x="3" y="5" width="18" height="16" rx="2"/>
                    <path d="M8 3v4M16 3v4M3 10h18"/>
                  </svg>
                  <div class="min-w-0">
                    <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.date') }}</p>
                    <p class="text-[11px] lg:text-[12px] text-[#64748B] leading-snug">{{ formatFooterDate() }}</p>
                  </div>
                </div>

                <!-- Current Time -->
                <div class="flex flex-col items-center gap-1 text-center min-w-0">
                  <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9"/>
                    <path d="M12 7v5l3 2" stroke-linecap="round"/>
                  </svg>
                  <div class="min-w-0">
                    <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.time') }}</p>
                    <p class="text-base lg:text-lg font-bold text-[#F97316] leading-tight">{{ formatFooterTime() }}</p>
                  </div>
                </div>
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
                  <h2 class="text-3xl font-bold mb-6">{{ t('doc.welcome') }}</h2>
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
                    <app-button variant="secondary" size="lg" class="flex-1" (onClick)="goBack()">{{ t('common.back') }}</app-button>
                    <app-button variant="primary" size="lg" class="flex-1" (onClick)="proceedToServices()">{{ t('common.continue') }}</app-button>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- DOC STEP 0b: Guest basic info (temporary session only) -->
          @if (currentStep() === 'guest-info') {
            <div class="absolute inset-0 bg-[#F8FAFC] text-[#0F172A] select-none overflow-hidden [font-family:'Inter',sans-serif] flex flex-col">

              <!-- Background image (same as the kiosk landing page) -->
              <div class="absolute inset-0 bg-cover bg-center pointer-events-none" style="background-image: url('Background.png')" aria-hidden="true"></div>
              <!-- Subtle radial glow keeps the form legible without washing the orange -->
              <div class="absolute inset-0 pointer-events-none" aria-hidden="true"
                   style="background: radial-gradient(ellipse 72% 58% at 50% 42%, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.35) 55%, rgba(255,255,255,0.05) 100%);"></div>
              <!-- Curved orange header accent (top-left, same as landing) -->
              <div class="absolute top-0 left-0 w-64 h-40 pointer-events-none" aria-hidden="true">
                <svg viewBox="0 0 256 160" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 0 H256 V80 C256 124 220 160 176 160 H0 Z" fill="#F97316" opacity="0.12"/>
                </svg>
              </div>

              <!-- Top navigation: back (left) + logo (center) -->
              <div class="relative z-10 flex items-center justify-center px-6 pt-[18px] pb-2">
                <div class="absolute left-4 sm:left-6 top-[26px] z-40 flex items-center gap-2.5 sm:gap-3">
                  <button (click)="goBack()"
                          class="w-[48px] h-[48px] sm:w-[52px] sm:h-[52px] rounded-full border-2 border-[#F97316]/60 bg-white flex items-center justify-center shadow-sm hover:bg-[#FFF7ED] active:scale-[0.98] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/30"
                          [attr.aria-label]="t('common.back')">
                    <svg class="w-6 h-6 sm:w-7 sm:h-7 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                    </svg>
                  </button>
                  <button (click)="goBack()"
                          class="flex items-center min-h-[44px] rounded-xl px-1 text-[#0F172A] font-semibold text-[15px] sm:text-base hover:text-[#F97316] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F97316]/40">
                    {{ t('common.back') }}
                  </button>
                </div>

                <div class="w-[76px] h-[76px] sm:w-[88px] sm:h-[88px] rounded-full bg-white border-2 border-[#F97316]/30 shadow-sm overflow-hidden flex items-center justify-center">
                  <img src="Barangay Logo.png" alt="Barangay San Manuel logo" class="w-full h-full object-cover">
                </div>
              </div>

              <!-- Progress indicator -->
              <div class="relative z-10 flex items-center justify-center px-4 pb-1">
                <ol class="flex items-center gap-1.5 sm:gap-2.5" aria-label="Kiosk progress">
                  <li class="flex items-center gap-1.5 sm:gap-2.5">
                    <span class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold text-white bg-[#F97316] border-2 border-[#F97316] shadow-sm" aria-hidden="true">1</span>
                    <span class="hidden lg:block text-[14px] font-bold text-[#0F172A] whitespace-nowrap">{{ t('progress.yourInfo') }}</span>
                  </li>
                  <li class="flex items-center gap-1.5 sm:gap-2.5" aria-hidden="true">
                    <span class="w-6 sm:w-10 h-[3px] rounded-full bg-[#E5E7EB]"></span>
                    <span class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold text-[#94A3B8] bg-white border-2 border-[#CBD5E1]">2</span>
                    <span class="hidden lg:block text-[14px] font-medium text-[#64748B] whitespace-nowrap">{{ t('progress.selectDoc') }}</span>
                  </li>
                  <li class="flex items-center gap-1.5 sm:gap-2.5" aria-hidden="true">
                    <span class="w-6 sm:w-10 h-[3px] rounded-full bg-[#E5E7EB]"></span>
                    <span class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold text-[#94A3B8] bg-white border-2 border-[#CBD5E1]">3</span>
                    <span class="hidden lg:block text-[14px] font-medium text-[#64748B] whitespace-nowrap">{{ t('progress.review') }}</span>
                  </li>
                  <li class="flex items-center gap-1.5 sm:gap-2.5" aria-hidden="true">
                    <span class="w-6 sm:w-10 h-[3px] rounded-full bg-[#E5E7EB]"></span>
                    <span class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold text-[#94A3B8] bg-white border-2 border-[#CBD5E1]">4</span>
                    <span class="hidden lg:block text-[14px] font-medium text-[#64748B] whitespace-nowrap">{{ t('progress.submit') }}</span>
                  </li>
                </ol>
              </div>

              <!-- Main content -->
              <div class="relative flex-1 overflow-y-auto">
                <div class="min-h-full flex items-center justify-center px-5 sm:px-10 py-5 sm:py-8">

                  <div class="w-full max-w-[660px]">

                    <!-- Page header -->
                    <div class="text-center mb-5 sm:mb-7">
                      <h1 class="text-[clamp(1.375rem,2.2vw,2rem)] font-bold tracking-tight text-[#0F172A] leading-tight">{{ t('doc.guestInfo.title') }}</h1>
                      <p class="text-[clamp(0.925rem,1.1vw,1.075rem)] font-medium text-[#64748B] mt-1.5 sm:mt-2">{{ t('doc.guestInfo.desc') }}</p>
                    </div>

                    <!-- Form card -->
                    <div class="bg-white border border-[#E5E7EB] rounded-[20px] shadow-[0_2px_14px_rgba(15,23,42,0.07)] px-5 sm:px-7 py-5 sm:py-6">
                      <div class="space-y-3.5 sm:space-y-4">

                        <!-- Full Name -->
                        <div>
                          <label for="guest-fullName" class="block text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('doc.guestInfo.fullName') }} <span class="text-[#F97316]">*</span>
                          </label>
                          <div class="flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden"
                               [class.border-[#DC2626]]="guestInvalid('fullName')">
                            <div class="shrink-0 w-12 sm:w-14 min-h-[54px] sm:min-h-[58px] bg-[#FFF7ED] flex items-center justify-center text-[#F97316]" aria-hidden="true">
                              <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                <circle cx="12" cy="8" r="4"/>
                                <path d="M4 20c0-3.6 3.6-5 8-5s8 1.4 8 5" stroke-linecap="round"/>
                              </svg>
                            </div>
                            <input id="guest-fullName" type="text" name="fullName" [(ngModel)]="guestForm.fullName"
                                   [placeholder]="t('doc.guestInfo.fullNamePh')" autocomplete="name"
                                   class="flex-1 min-w-0 px-3 sm:px-4 py-3 text-[15px] sm:text-[17px] text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent outline-none border-none" />
                            @if (guestForm.fullName) {
                              <div class="shrink-0 pr-4 text-[#10B981]" aria-hidden="true">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                                </svg>
                              </div>
                            }
                          </div>
                          @if (guestInvalid('fullName')) {
                            <p class="mt-2 flex items-center gap-1.5 text-base font-medium text-[#B91C1C]">
                              <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                                <circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/>
                              </svg>
                              {{ t('err.guest.fullName') }}
                            </p>
                          }
                        </div>

                        <!-- Date of Birth -->
                        <div>
                          <label for="guest-birthDate" class="block text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('doc.guestInfo.birthDate') }} <span class="text-[#F97316]">*</span>
                          </label>
                          <div class="flex items-center rounded-xl border-2 bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden"
                               [class.border-[#DC2626]]="guestInvalid('birthDate')">
                            <div class="shrink-0 w-12 sm:w-14 min-h-[54px] sm:min-h-[58px] bg-[#FFF7ED] flex items-center justify-center text-[#F97316]" aria-hidden="true">
                              <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                <rect x="3" y="5" width="18" height="16" rx="2"/>
                                <path d="M8 3v4M16 3v4M3 10h18" stroke-linecap="round"/>
                              </svg>
                            </div>
                            <input id="guest-birthDate" type="date" name="birthDate" [(ngModel)]="guestForm.birthDate"
                                   [placeholder]="t('doc.guestInfo.birthDatePh')"
                                   class="flex-1 min-w-0 px-3 sm:px-4 py-3 text-[15px] sm:text-[17px] font-medium text-[#0F172A] bg-transparent outline-none border-none" />
                            @if (guestForm.birthDate) {
                              <div class="shrink-0 pr-4 text-[#10B981]" aria-hidden="true">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                                </svg>
                              </div>
                            }
                          </div>
                          @if (guestInvalid('birthDate')) {
                            <p class="flex items-center gap-1.5 text-base font-medium text-[#B91C1C]">
                              <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                                <circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/>
                              </svg>
                              {{ t('err.guest.birthDate') }}
                            </p>
                          }
                        </div>

                        <!-- Address -->
                        <div>
                          <label for="guest-address" class="block text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('doc.guestInfo.address') }} <span class="text-[#F97316]">*</span>
                          </label>
                          <div class="flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden"
                               [class.border-[#DC2626]]="guestInvalid('address')">
                            <div class="shrink-0 w-12 sm:w-14 min-h-[54px] sm:min-h-[58px] bg-[#FFF7ED] flex items-center justify-center text-[#F97316]" aria-hidden="true">
                              <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                <path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z" stroke-linejoin="round"/>
                                <circle cx="12" cy="10" r="2.5"/>
                              </svg>
                            </div>
                            <input id="guest-address" type="text" name="address" [(ngModel)]="guestForm.address"
                                   [placeholder]="t('doc.guestInfo.addressPh')" autocomplete="street-address"
                                   class="flex-1 min-w-0 px-3 sm:px-4 py-3 text-[15px] sm:text-[17px] font-medium text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent outline-none border-none" />
                            @if (guestForm.address) {
                              <div class="shrink-0 pr-4 text-[#10B981]" aria-hidden="true">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                                </svg>
                              </div>
                            }
                          </div>
                          @if (guestInvalid('address')) {
                            <p class="flex items-center gap-1.5 text-base font-medium text-[#B91C1C]">
                              <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                                <circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/>
                              </svg>
                              {{ t('err.guest.address') }}
                            </p>
                          }
                        </div>

                        <!-- Contact Number -->
                        <div>
                          <label for="guest-contactNumber" class="block text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('doc.guestInfo.contact') }} <span class="text-[#F97316]">*</span>
                          </label>
                          <div class="flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden"
                               [class.border-[#DC2626]]="guestInvalid('contactNumber')">
                            <div class="shrink-0 w-12 sm:w-14 min-h-[54px] sm:min-h-[58px] bg-[#FFF7ED] flex items-center justify-center text-[#F97316]" aria-hidden="true">
                              <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                <path d="M6.5 5h3l1.6 4-2 1.2a11 11 0 005.7 5.7l1.2-2 4 1.6v3a1.5 1.5 0 01-1.6 1.5A15.5 15.5 0 015 6.6 1.5 1.5 0 016.5 5z" stroke-linejoin="round"/>
                              </svg>
                            </div>
                            <input id="guest-contactNumber" type="tel" name="contactNumber" [(ngModel)]="guestForm.contactNumber"
                                   [placeholder]="t('doc.guestInfo.contactPh')" autocomplete="tel" inputmode="tel"
                                   class="flex-1 min-w-0 px-3 sm:px-4 py-3 text-[15px] sm:text-[17px] font-medium text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent outline-none border-none" />
                            @if (guestForm.contactNumber) {
                              <div class="shrink-0 pr-4 text-[#10B981]" aria-hidden="true">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                                </svg>
                              </div>
                            }
                          </div>
                          @if (guestInvalid('contactNumber')) {
                            <p class="flex items-center gap-1.5 text-base font-medium text-[#B91C1C]">
                              <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                                <circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/>
                              </svg>
                              {{ t('err.guest.contact') }}
                            </p>
                          }
                        </div>

                        <!-- Email (optional) -->
                        <div>
                          <label for="guest-email" class="block text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('doc.guestInfo.email') }}
                          </label>
                          <div class="flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden">
                            <div class="shrink-0 w-12 sm:w-14 min-h-[54px] sm:min-h-[58px] bg-[#FFF7ED] flex items-center justify-center text-[#F97316]" aria-hidden="true">
                              <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                <rect x="3" y="5" width="18" height="14" rx="2"/>
                                <path d="M3.5 7l8.5 6 8.5-6" stroke-linejoin="round"/>
                              </svg>
                            </div>
                            <input id="guest-email" type="email" name="email" [(ngModel)]="guestForm.email"
                                   [placeholder]="t('doc.guestInfo.emailPh')" autocomplete="email" inputmode="email"
                                   class="flex-1 min-w-0 px-3 sm:px-4 py-3 text-[15px] sm:text-[17px] font-medium text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent outline-none border-none" />
                            @if (guestForm.email) {
                              <div class="shrink-0 pr-4 text-[#10B981]" aria-hidden="true">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                                </svg>
                              </div>
                            }
                          </div>
                        </div>
                      </div>

                      <!-- Form actions -->
                      <div class="flex items-center justify-center mt-5 sm:mt-6">
                        <button (click)="validateGuestForm()"
                                class="flex items-center justify-center gap-2.5 min-h-[56px] min-w-[200px] sm:min-w-[220px] px-6 sm:px-8 rounded-xl bg-[#F97316] hover:bg-[#EA580C] active:scale-[0.98] text-white text-lg font-bold shadow-[0_4px_14px_rgba(249,115,22,0.35)] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/40">
                          {{ t('common.continue') }}
                          <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer: same as the kiosk landing page (includes the language selector) -->
              <div class="relative z-10 border-t border-[#E5E7EB] bg-white/90 backdrop-blur-sm">
                <div class="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-1.5 lg:py-2 grid grid-cols-2 md:grid-cols-4 gap-x-6 lg:gap-x-8 gap-y-2 lg:gap-y-3 items-center">

                  <!-- Section 1: Language (same as landing) -->
                  <div class="flex flex-col items-center gap-1.5 text-center min-w-0">
                    <div class="flex items-center gap-1.5 text-[#0F172A]">
                      <svg class="w-[18px] h-[18px] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18"/>
                      </svg>
                      <span class="text-[13px] font-semibold">{{ t('landing.footer.language') }}</span>
                    </div>
                    <div class="inline-flex rounded-lg overflow-hidden border border-[#E5E7EB] bg-white shadow-sm min-w-0">
                      <button
                        (click)="setLanguage('en')"
                        class="px-3 sm:px-5 py-1.5 text-[13px] font-semibold transition-colors min-h-[34px]"
                        [class.bg-[#F97316]]="language() === 'en'"
                        [class.text-white]="language() === 'en'"
                        [class.bg-white]="language() !== 'en'"
                        [class.text-[#0F172A]]="language() !== 'en'">
                        English
                      </button>
                      <button
                        (click)="setLanguage('fil')"
                        class="px-3 sm:px-5 py-1.5 text-[13px] border-l border-[#E5E7EB] font-semibold transition-colors min-h-[34px]"
                        [class.bg-[#F97316]]="language() === 'fil'"
                        [class.text-white]="language() === 'fil'"
                        [class.bg-white]="language() !== 'fil'"
                        [class.text-[#0F172A]]="language() !== 'fil'">
                        Filipino
                      </button>
                    </div>
                  </div>

                  <!-- Section 2: Need Assistance -->
                  <div class="flex flex-col items-center gap-1 text-center min-w-0">
                    <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9"/>
                      <path d="M9.5 9a2.5 2.5 0 114.6 1.3c-.8 1-1.9 1.7-1.9 3.2" stroke-linecap="round"/>
                      <path d="M12 17h.01" stroke-linecap="round"/>
                    </svg>
                    <div>
                      <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.assistance') }}</p>
                      <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.assistanceDesc') }}</p>
                    </div>
                  </div>

                  <!-- Section 3: Office Hours -->
                  <div class="flex flex-col items-center gap-1 text-center min-w-0">
                    <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9"/>
                      <path d="M12 7v5l3 2" stroke-linecap="round"/>
                    </svg>
                    <div>
                      <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.hours') }}</p>
                      <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.monFri') }}</p>
                      <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.hoursRange') }}</p>
                    </div>
                  </div>

                  <!-- Section 4: Date & Time -->
                  <div class="flex flex-col items-center gap-1 text-center min-w-0">
                    <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <rect x="3" y="5" width="18" height="16" rx="2"/>
                      <path d="M8 3v4M16 3v4M3 10h18"/>
                    </svg>
                    <div class="min-w-0">
                      <p class="text-[11px] lg:text-[12px] font-medium text-[#64748B] leading-snug">{{ formatFooterDate() }}</p>
                      <p class="text-base lg:text-lg font-bold text-[#F97316] leading-tight">{{ formatFooterTime() }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- DOC STEP 1: Service Selection -->
          @if (currentStep() === 'services') {
            <div class="absolute inset-0 flex flex-col p-8">
              <div class="max-w-3xl mx-auto w-full flex-1 flex flex-col">
                <div class="flex items-center justify-between mb-8">
                  <h2 class="text-3xl font-bold">{{ t('doc.services.title') }}</h2>
                  <button class="text-blue-300 hover:text-white text-lg" (click)="cancel()">{{ t('common.cancel') }}</button>
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
                            <span class="text-lg text-green-300 font-medium">{{ t('doc.services.free') }}</span>
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
                  <h2 class="text-3xl font-bold">{{ t('doc.requirements.title') }}</h2>
                  <button class="text-blue-300 hover:text-white text-lg" (click)="goBack()">{{ t('common.back') }}</button>
                </div>
                <div class="flex-1 overflow-y-auto space-y-6">
                  <div class="bg-blue-800/50 rounded-xl p-6 backdrop-blur">
                    <h3 class="text-xl font-bold mb-4">{{ selectedService()?.service_name }}</h3>
                    @if (selectedService()?.description) {
                      <p class="text-blue-200 mb-6">{{ selectedService()?.description }}</p>
                    }
                    @if (selectedService()?.requirements && selectedService()!.requirements!.length > 0) {
                      <div class="mb-6">
                        <h4 class="font-bold text-lg mb-3 text-blue-100">{{ t('doc.requirements.whatToBring') }}</h4>
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
                    @if (!selectedService()?.requirements || selectedService()!.requirements!.length === 0) {
                      <p class="text-blue-200/80">{{ t('doc.requirements.none') }}</p>
                    }
                  </div>
                </div>
                <div class="flex gap-4 pt-4 border-t border-blue-700">
                  <app-button variant="secondary" size="lg" class="flex-1" (onClick)="goBack()">{{ t('common.back') }}</app-button>
                  <app-button variant="primary" size="lg" class="flex-1" (onClick)="proceedToForm()">{{ t('common.continue') }}</app-button>
                </div>
              </div>
            </div>
          }

          <!-- DOC STEP 3: Dynamic Form -->
          @if (currentStep() === 'form') {
            <div class="absolute inset-0 flex flex-col p-8 overflow-y-auto">
              <div class="max-w-2xl mx-auto w-full flex-1">
                <div class="flex items-center justify-between mb-8">
                  <h2 class="text-3xl font-bold">{{ t('doc.form.title') }}</h2>
                  <button class="text-blue-300 hover:text-white text-lg" (click)="goBack()">{{ t('common.back') }}</button>
                </div>
                <div class="bg-blue-800/50 rounded-2xl p-6 backdrop-blur space-y-4">
                  <p class="text-blue-200">{{ t('doc.form.fillPrompt', { service: selectedService()?.service_name ?? '' }) }}</p>

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
                              <option value="">{{ t('doc.form.select') }}</option>
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
                                  <button type="button" class="text-blue-300 hover:text-white text-sm" (click)="clearFieldValue(field.key)">{{ t('common.clear') }}</button>
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
                                  <app-button variant="primary" size="lg" (onClick)="captureInlinePhoto(field.key)">{{ t('doc.form.takePhoto') }}</app-button>
                                  <app-button variant="secondary" size="lg" (onClick)="cancelInlinePhoto(field.key)">{{ t('common.cancel') }}</app-button>
                                </div>
                              } @else if (formValues()[field.key]) {
                                <img [src]="formValues()[field.key]" [alt]="t('err.captured')" class="w-40 h-40 rounded-2xl object-cover border-4 border-white mb-2" />
                                <div class="flex gap-3">
                                  <app-button variant="secondary" size="lg" (onClick)="retakeInlinePhoto(field.key)">{{ t('common.retake') }}</app-button>
                                </div>
                              } @else {
                                <app-button variant="primary" size="lg" (onClick)="startInlineCamera(field.key)">{{ t('doc.form.openCamera') }}</app-button>
                              }
                            </div>
                          }
                          @case ('file') {
                            <input type="file" [accept]="field.accept || '*'" (change)="onFileSelected(field, $event)"
                                   class="w-full text-blue-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white" />
                            @if (formValues()[field.key]) {
                              <p class="text-xs text-green-300 mt-1">{{ t('doc.form.fileAttached') }}</p>
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
                    <p class="text-blue-200/80">{{ t('doc.form.noFields') }}</p>
                  }
                </div>
                <div class="flex gap-4 mt-6">
                  <app-button variant="secondary" size="lg" class="flex-1" (onClick)="goBack()">{{ t('common.back') }}</app-button>
                  <app-button variant="primary" size="lg" class="flex-1" (onClick)="validateForm()">{{ t('common.continue') }}</app-button>
                </div>
              </div>
            </div>
          }

          <!-- DOC STEP 4: Photo Capture (only if service requires photo) -->
          @if (currentStep() === 'photo') {
            <div class="absolute inset-0 flex flex-col items-center justify-center p-8">
              <div class="max-w-lg w-full">
                <h2 class="text-3xl font-bold mb-6 text-center">{{ t('doc.photo.title') }}</h2>
                @if (!capturedPhoto()) {
                  <div class="bg-black rounded-2xl overflow-hidden mb-6">
                    <video #videoEl autoplay playsinline class="w-full aspect-video object-cover"></video>
                  </div>
                  <div class="flex gap-4 justify-center">
                    <app-button variant="primary" size="lg" (onClick)="capturePhoto()">{{ t('doc.form.takePhoto') }}</app-button>
                    <app-button variant="secondary" size="lg" (onClick)="skipPhoto()">{{ t('common.skip') }}</app-button>
                  </div>
                } @else {
                  <div class="text-center">
                    <img [src]="capturedPhoto()" class="w-64 h-64 rounded-2xl mx-auto mb-6 object-cover border-4 border-white" />
                    <div class="flex gap-4 justify-center">
                      <app-button variant="primary" size="lg" (onClick)="confirmPhoto()">{{ t('doc.photo.useThis') }}</app-button>
                      <app-button variant="secondary" size="lg" (onClick)="retakePhoto()">{{ t('common.retake') }}</app-button>
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
                <h2 class="text-3xl font-bold mb-6 text-center">{{ t('doc.review.title') }}</h2>
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
                    <p class="text-blue-300 text-sm">{{ t('doc.review.service') }}</p>
                    <p class="font-bold text-lg">{{ selectedService()!.service_name }}</p>
                  </div>
                  <div>
                    <p class="text-blue-300 text-sm">{{ t('doc.review.fee') }}</p>
                    @if (selectedService()!.processing_fee > 0) {
                      <p class="font-bold text-lg">₱{{ selectedService()!.processing_fee }}</p>
                    } @else {
                      <p class="font-bold text-lg text-green-300">{{ t('doc.services.free') }}</p>
                    }
                  </div>
                  @if (selectedService()?.form_fields && selectedService()!.form_fields!.length > 0) {
                    <div>
                      <p class="text-blue-300 text-sm mb-2">{{ t('doc.review.details') }}</p>
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
                  <app-button variant="secondary" size="lg" class="flex-1" (onClick)="goBack()">{{ t('common.back') }}</app-button>
                  <app-button variant="primary" size="lg" class="flex-1" (onClick)="submitRequest()" [loading]="submitting()">{{ t('doc.review.submit') }}</app-button>
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
                <h2 class="text-3xl font-bold mb-4">{{ t('doc.success.title') }}</h2>
                <p class="text-xl text-blue-200 mb-2">{{ t('doc.success.requestNumber') }}</p>
                <p class="text-4xl font-bold text-yellow-300 mb-6">{{ requestNumber() }}</p>
                <p class="text-blue-200 mb-3">{{ t('doc.success.instructions') }}</p>
                <p class="text-blue-200 mb-8">{{ t('doc.success.monitor') }}</p>
                <app-button variant="primary" size="lg" (onClick)="finish()">{{ t('common.done') }}</app-button>
              </div>
            </div>
          }
        }

        <!-- ============ BARANGAY ID: Application workflow ============ -->
        @if (mode() === 'barangay') {

          <!-- BAR STEP 0: Requirements -->
          @if (barangayStep() === 'requirements') {
            <div class="absolute inset-0 bg-[#F8FAFC] text-[#0F172A] select-none overflow-hidden [font-family:'Inter',sans-serif] flex flex-col">

              <!-- Background image (same as the kiosk landing page) -->
              <div class="absolute inset-0 bg-cover bg-center pointer-events-none" style="background-image: url('Background.png')" aria-hidden="true"></div>
              <!-- Subtle radial glow keeps the form legible without washing the orange -->
              <div class="absolute inset-0 pointer-events-none" aria-hidden="true"
                   style="background: radial-gradient(ellipse 72% 58% at 50% 42%, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.35) 55%, rgba(255,255,255,0.05) 100%);"></div>
              <!-- Curved orange header accent (top-left, same as landing) -->
              <div class="absolute top-0 left-0 w-64 h-40 pointer-events-none" aria-hidden="true">
                <svg viewBox="0 0 256 160" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 0 H256 V80 C256 124 220 160 176 160 H0 Z" fill="#F97316" opacity="0.12"/>
                </svg>
              </div>

              <!-- Top navigation: back (left) + logo (center) -->
              <div class="relative z-10 flex items-center justify-center px-6 pt-[18px] pb-2">
                <div class="absolute left-4 sm:left-6 top-[26px] z-40 flex items-center gap-2.5 sm:gap-3">
                  <button (click)="goBack()"
                          class="w-[48px] h-[48px] sm:w-[52px] sm:h-[52px] rounded-full border-2 border-[#F97316]/60 bg-white flex items-center justify-center shadow-sm hover:bg-[#FFF7ED] active:scale-[0.98] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/30"
                          [attr.aria-label]="t('common.back')">
                    <svg class="w-6 h-6 sm:w-7 sm:h-7 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                    </svg>
                  </button>
                  <button (click)="goBack()"
                          class="flex items-center min-h-[44px] rounded-xl px-1 text-[#0F172A] font-semibold text-[15px] sm:text-base hover:text-[#F97316] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F97316]/40">
                    {{ t('common.back') }}
                  </button>
                </div>

                <div class="w-[76px] h-[76px] sm:w-[88px] sm:h-[88px] rounded-full bg-white border-2 border-[#F97316]/30 shadow-sm overflow-hidden flex items-center justify-center">
                  <img src="Barangay Logo.png" alt="Barangay San Manuel logo" class="w-full h-full object-cover">
                </div>
              </div>

              <!-- Progress indicator -->
              <div class="relative z-10 flex items-center justify-center px-4 pb-1">
                <ol class="flex items-center gap-1.5 sm:gap-2.5" aria-label="Kiosk progress">
                  <li class="flex items-center gap-1.5 sm:gap-2.5">
                    <span class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold text-white bg-[#F97316] border-2 border-[#F97316] shadow-sm" aria-hidden="true">1</span>
                    <span class="hidden lg:block text-[14px] font-bold text-[#0F172A] whitespace-nowrap">{{ t('progress.yourInfo') }}</span>
                  </li>
                  <li class="flex items-center gap-1.5 sm:gap-2.5" aria-hidden="true">
                    <span class="w-6 sm:w-10 h-[3px] rounded-full bg-[#E5E7EB]"></span>
                    <span class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold text-[#94A3B8] bg-white border-2 border-[#CBD5E1]">2</span>
                    <span class="hidden lg:block text-[14px] font-medium text-[#64748B] whitespace-nowrap">{{ t('progress.selectDoc') }}</span>
                  </li>
                  <li class="flex items-center gap-1.5 sm:gap-2.5" aria-hidden="true">
                    <span class="w-6 sm:w-10 h-[3px] rounded-full bg-[#E5E7EB]"></span>
                    <span class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold text-[#94A3B8] bg-white border-2 border-[#CBD5E1]">3</span>
                    <span class="hidden lg:block text-[14px] font-medium text-[#64748B] whitespace-nowrap">{{ t('progress.review') }}</span>
                  </li>
                  <li class="flex items-center gap-1.5 sm:gap-2.5" aria-hidden="true">
                    <span class="w-6 sm:w-10 h-[3px] rounded-full bg-[#E5E7EB]"></span>
                    <span class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold text-[#94A3B8] bg-white border-2 border-[#CBD5E1]">4</span>
                    <span class="hidden lg:block text-[14px] font-medium text-[#64748B] whitespace-nowrap">{{ t('progress.submit') }}</span>
                  </li>
                </ol>
              </div>

              <!-- Main content -->
              <div class="relative flex-1 overflow-y-auto">
                <div class="min-h-full flex items-center justify-center px-5 sm:px-10 py-5 sm:py-8">

                  <div class="w-full max-w-[780px]">

                    <!-- Page header -->
                    <div class="text-center mb-5 sm:mb-7">
                      <h1 class="text-[clamp(1.875rem,3vw,2.625rem)] font-bold tracking-tight text-[#0F172A] leading-tight">{{ t('bar.requirements.title') }}</h1>
                      <p class="text-[clamp(1rem,1.4vw,1.2rem)] font-medium text-[#64748B] mt-2 sm:mt-3 max-w-2xl mx-auto">{{ t('bar.requirements.desc') }}</p>
                    </div>

                    <!-- Requirements card -->
                    <div class="bg-white border border-[#E5E7EB] rounded-[20px] shadow-[0_2px_14px_rgba(15,23,42,0.07)] px-6 sm:px-8 py-6 sm:py-8">

                      <!-- Requirement 1 -->
                      <div class="flex items-start gap-4 sm:gap-5">
                        <div class="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                          <svg class="w-6 h-6 sm:w-7 sm:h-7 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                          </svg>
                        </div>
                        <div class="flex-1 min-w-0">
                          <h3 class="text-[clamp(1.125rem,1.6vw,1.375rem)] font-bold text-[#0F172A] leading-tight">{{ t('bar.requirements.req1.title') }}</h3>
                          <p class="text-[clamp(0.925rem,1.2vw,1.0625rem)] text-[#64748B] mt-1 leading-snug">{{ t('bar.requirements.req1.desc') }}</p>
                        </div>
                      </div>

                      <!-- Divider -->
                      <div class="h-px bg-[#E5E7EB] my-5 sm:my-6"></div>

                      <!-- Requirement 2 -->
                      <div class="flex items-start gap-4 sm:gap-5">
                        <div class="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                          <svg class="w-6 h-6 sm:w-7 sm:h-7 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955a1.126 1.126 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H18.375c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/>
                          </svg>
                        </div>
                        <div class="flex-1 min-w-0">
                          <h3 class="text-[clamp(1.125rem,1.6vw,1.375rem)] font-bold text-[#0F172A] leading-tight">{{ t('bar.requirements.req2.title') }}</h3>
                          <p class="text-[clamp(0.925rem,1.2vw,1.0625rem)] text-[#64748B] mt-1 leading-snug">{{ t('bar.requirements.req2.desc') }}</p>
                        </div>
                      </div>

                      <!-- Divider -->
                      <div class="h-px bg-[#E5E7EB] my-5 sm:my-6"></div>

                      <!-- Requirement 3 -->
                      <div class="flex items-start gap-4 sm:gap-5">
                        <div class="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                          <svg class="w-6 h-6 sm:w-7 sm:h-7 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                            <rect x="3" y="5" width="18" height="14" rx="2" stroke-linejoin="round"/>
                            <path d="m3.5 7 8.5 6 8.5-6" stroke-linejoin="round"/>
                          </svg>
                        </div>
                        <div class="flex-1 min-w-0">
                          <h3 class="text-[clamp(1.125rem,1.6vw,1.375rem)] font-bold text-[#0F172A] leading-tight">{{ t('bar.requirements.req3.title') }}</h3>
                          <p class="text-[clamp(0.925rem,1.2vw,1.0625rem)] text-[#64748B] mt-1 leading-snug">{{ t('bar.requirements.req3.desc') }}</p>
                        </div>
                      </div>

                      <!-- Important notice -->
                      <div class="flex items-start gap-3 rounded-xl bg-[#FFF7ED] border border-[#F97316]/20 px-4 sm:px-5 py-4 mt-6 sm:mt-7">
                        <svg class="w-6 h-6 sm:w-7 sm:h-7 text-[#F97316] shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
                          <circle cx="12" cy="12" r="9"/>
                          <path d="M12 8v4M12 16h.01" stroke-linecap="round"/>
                        </svg>
                        <div class="flex-1 min-w-0">
                          <p class="text-[15px] sm:text-[16px] font-bold text-[#0F172A]">{{ t('bar.requirements.note') }}</p>
                          <p class="text-[14px] sm:text-[15px] text-[#64748B] mt-1 leading-snug">{{ t('bar.requirements.noteDesc') }}</p>
                        </div>
                      </div>
                    </div>

                    <!-- Continue button (single primary action, centered) -->
                    <div class="flex items-center justify-center mt-6 sm:mt-8">
                      <button (click)="proceedToBarangayForm()"
                              class="flex items-center justify-center gap-2.5 min-h-[64px] min-w-[240px] sm:min-w-[260px] px-8 rounded-xl bg-[#F97316] hover:bg-[#EA580C] active:scale-[0.98] text-white text-lg sm:text-xl font-bold shadow-[0_4px_14px_rgba(249,115,22,0.35)] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/40">
                        {{ t('common.continue') }}
                        <svg class="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer: same as the kiosk landing page (includes the language selector) -->
              <div class="relative z-10 border-t border-[#E5E7EB] bg-white/90 backdrop-blur-sm">
                <div class="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-1.5 lg:py-2 grid grid-cols-2 md:grid-cols-4 gap-x-6 lg:gap-x-8 gap-y-2 lg:gap-y-3 items-center">

                  <!-- Section 1: Language (same as landing) -->
                  <div class="flex flex-col items-center gap-1.5 text-center min-w-0">
                    <div class="flex items-center gap-1.5 text-[#0F172A]">
                      <svg class="w-[18px] h-[18px] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18"/>
                      </svg>
                      <span class="text-[13px] font-semibold">{{ t('landing.footer.language') }}</span>
                    </div>
                    <div class="inline-flex rounded-lg overflow-hidden border border-[#E5E7EB] bg-white shadow-sm min-w-0">
                      <button
                        (click)="setLanguage('en')"
                        class="px-3 sm:px-5 py-1.5 text-[13px] font-semibold transition-colors min-h-[34px]"
                        [class.bg-[#F97316]]="language() === 'en'"
                        [class.text-white]="language() === 'en'"
                        [class.bg-white]="language() !== 'en'"
                        [class.text-[#0F172A]]="language() !== 'en'">
                        English
                      </button>
                      <button
                        (click)="setLanguage('fil')"
                        class="px-3 sm:px-5 py-1.5 text-[13px] border-l border-[#E5E7EB] font-semibold transition-colors min-h-[34px]"
                        [class.bg-[#F97316]]="language() === 'fil'"
                        [class.text-white]="language() === 'fil'"
                        [class.bg-white]="language() !== 'fil'"
                        [class.text-[#0F172A]]="language() !== 'fil'">
                        Filipino
                      </button>
                    </div>
                  </div>

                  <!-- Section 2: Need Assistance -->
                  <div class="flex flex-col items-center gap-1 text-center min-w-0">
                    <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9"/>
                      <path d="M9.5 9a2.5 2.5 0 114.6 1.3c-.8 1-1.9 1.7-1.9 3.2" stroke-linecap="round"/>
                      <path d="M12 17h.01" stroke-linecap="round"/>
                    </svg>
                    <div>
                      <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.assistance') }}</p>
                      <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.assistanceDesc') }}</p>
                    </div>
                  </div>

                  <!-- Section 3: Office Hours -->
                  <div class="flex flex-col items-center gap-1 text-center min-w-0">
                    <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9"/>
                      <path d="M12 7v5l3 2" stroke-linecap="round"/>
                    </svg>
                    <div>
                      <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.hours') }}</p>
                      <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.monFri') }}</p>
                      <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.hoursRange') }}</p>
                    </div>
                  </div>

                  <!-- Section 4: Date & Time -->
                  <div class="flex flex-col items-center gap-1 text-center min-w-0">
                    <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <rect x="3" y="5" width="18" height="16" rx="2"/>
                      <path d="M8 3v4M16 3v4M3 10h18"/>
                    </svg>
                    <div class="min-w-0">
                      <p class="text-[11px] lg:text-[12px] font-medium text-[#64748B] leading-snug">{{ formatFooterDate() }}</p>
                      <p class="text-base lg:text-lg font-bold text-[#F97316] leading-tight">{{ formatFooterTime() }}</p>
                    </div>
                  </div>
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
                    <h2 class="text-2xl font-bold">{{ t('bar.form.title') }}</h2>
                    <p class="text-blue-300 text-sm mt-1">{{ t('bar.form.desc') }}</p>
                  </div>
                  <button class="text-blue-300 hover:text-white text-lg" (click)="goBack()">{{ t('common.back') }}</button>
                </div>

                <div class="bg-blue-800/50 rounded-2xl p-6 backdrop-blur space-y-4">
                  <div class="grid grid-cols-2 gap-4">
                    <div class="col-span-2 sm:col-span-1">
                      <label class="block text-blue-300 text-sm mb-1">{{ t('bar.form.firstName') }}</label>
                      <input type="text" [(ngModel)]="barangayForm.firstName"
                             class="w-full bg-white text-gray-800 rounded-lg px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-400" />
                    </div>
                    <div class="col-span-2 sm:col-span-1">
                      <label class="block text-blue-300 text-sm mb-1">{{ t('bar.form.middleName') }}</label>
                      <input type="text" [(ngModel)]="barangayForm.middleName"
                             class="w-full bg-white text-gray-800 rounded-lg px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-400" />
                    </div>
                    <div class="col-span-2 sm:col-span-1">
                      <label class="block text-blue-300 text-sm mb-1">{{ t('bar.form.lastName') }}</label>
                      <input type="text" [(ngModel)]="barangayForm.lastName"
                             class="w-full bg-white text-gray-800 rounded-lg px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-400" />
                    </div>
                    <div class="col-span-2 sm:col-span-1">
                      <label class="block text-blue-300 text-sm mb-1">{{ t('bar.form.suffix') }}</label>
                      <select [(ngModel)]="barangayForm.suffix"
                              class="w-full bg-white text-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-400">
                        <option value="">{{ t('bar.form.suffixNone') }}</option>
                        <option value="Jr.">Jr.</option>
                        <option value="Sr.">Sr.</option>
                        <option value="II">II</option>
                        <option value="III">III</option>
                        <option value="IV">IV</option>
                      </select>
                    </div>
                    <div class="col-span-2 sm:col-span-1">
                      <label class="block text-blue-300 text-sm mb-1">{{ t('bar.form.birthDate') }}</label>
                      <input type="date" [(ngModel)]="barangayForm.birthDate"
                             class="w-full bg-white text-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-400" />
                    </div>
                    <div class="col-span-2 sm:col-span-1">
                      <label class="block text-blue-300 text-sm mb-1">{{ t('bar.form.sex') }}</label>
                      <select [(ngModel)]="barangayForm.gender"
                              class="w-full bg-white text-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-400">
                        <option value="">{{ t('bar.form.select') }}</option>
                        <option value="Male">{{ t('bar.form.sexMale') }}</option>
                        <option value="Female">{{ t('bar.form.sexFem') }}</option>
                        <option value="Other">{{ t('bar.form.sexOther') }}</option>
                      </select>
                    </div>
                    <div class="col-span-2 sm:col-span-1">
                      <label class="block text-blue-300 text-sm mb-1">{{ t('bar.form.civilStatus') }}</label>
                      <select [(ngModel)]="barangayForm.civilStatus"
                              class="w-full bg-white text-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-400">
                        <option value="">{{ t('bar.form.select') }}</option>
                        <option value="Single">{{ t('bar.form.civilSingle') }}</option>
                        <option value="Married">{{ t('bar.form.civilMarried') }}</option>
                        <option value="Widowed">{{ t('bar.form.civilWidowed') }}</option>
                        <option value="Separated">{{ t('bar.form.civilSeparated') }}</option>
                        <option value="Divorced">{{ t('bar.form.civilDivorced') }}</option>
                      </select>
                    </div>
                    <div class="col-span-2 sm:col-span-1">
                      <label class="block text-blue-300 text-sm mb-1">{{ t('bar.form.occupation') }}</label>
                      <input type="text" [(ngModel)]="barangayForm.occupation"
                             class="w-full bg-white text-gray-800 rounded-lg px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-400" />
                    </div>
                    <div class="col-span-2 sm:col-span-1">
                      <label class="block text-blue-300 text-sm mb-1">{{ t('bar.form.bloodType') }}</label>
                      <select [(ngModel)]="barangayForm.bloodType"
                              class="w-full bg-white text-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-400">
                        <option value="">{{ t('bar.form.bloodUnknown') }}</option>
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
                      <label class="block text-blue-300 text-sm mb-1">{{ t('bar.form.contact') }}</label>
                      <input type="tel" [(ngModel)]="barangayForm.contactNumber"
                             class="w-full bg-white text-gray-800 rounded-lg px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-400" />
                    </div>
                    <div class="col-span-2">
                      <label class="block text-blue-300 text-sm mb-1">{{ t('bar.form.address') }}</label>
                      <input type="text" [(ngModel)]="barangayForm.addressLine"
                             class="w-full bg-white text-gray-800 rounded-lg px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-400" />
                    </div>
                    <div class="col-span-2">
                      <label class="block text-blue-300 text-sm mb-1">{{ t('bar.form.email') }}</label>
                      <input type="email" [(ngModel)]="barangayForm.email"
                             class="w-full bg-white text-gray-800 rounded-lg px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-400" />
                    </div>
                    <div class="col-span-2">
                      <label class="block text-blue-300 text-sm mb-1">{{ t('bar.form.emergencyName') }}</label>
                      <input type="text" [(ngModel)]="barangayForm.emergencyContactName"
                             class="w-full bg-white text-gray-800 rounded-lg px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-400" />
                    </div>
                    <div class="col-span-2">
                      <label class="block text-blue-300 text-sm mb-1">{{ t('bar.form.emergencyNumber') }}</label>
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
                  <app-button variant="secondary" size="lg" class="flex-1" (onClick)="goBack()">{{ t('common.back') }}</app-button>
                  <app-button variant="primary" size="lg" class="flex-1" (onClick)="validateBarangayForm()">{{ t('common.continue') }}</app-button>
                </div>
              </div>
            </div>
          }

          <!-- BAR STEP 2: Photo Capture (required) -->
          @if (barangayStep() === 'photo') {
            <div class="absolute inset-0 flex flex-col items-center justify-center p-8">
              <div class="max-w-lg w-full">
                <h2 class="text-3xl font-bold mb-6 text-center">{{ t('bar.photo.title') }}</h2>
                <p class="text-blue-200 text-center mb-6">{{ t('bar.photo.desc') }}</p>
                @if (!capturedPhoto()) {
                  <div class="bg-black rounded-2xl overflow-hidden mb-6">
                    <video #videoEl autoplay playsinline class="w-full aspect-video object-cover"></video>
                  </div>
                  <div class="flex gap-4 justify-center">
                    <app-button variant="primary" size="lg" (onClick)="capturePhoto()">{{ t('bar.photo.take') }}</app-button>
                  </div>
                } @else {
                  <div class="text-center">
                    <img [src]="capturedPhoto()" class="w-64 h-64 rounded-2xl mx-auto mb-6 object-cover border-4 border-white" />
                    <div class="flex gap-4 justify-center">
                      <app-button variant="primary" size="lg" (onClick)="confirmBarangayPhoto()">{{ t('bar.photo.use') }}</app-button>
                      <app-button variant="secondary" size="lg" (onClick)="retakePhoto()">{{ t('bar.photo.retake') }}</app-button>
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
                <h2 class="text-3xl font-bold mb-6 text-center">{{ t('bar.signature.title') }}</h2>
                <p class="text-blue-200 text-center mb-6">{{ t('bar.signature.desc') }}</p>
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
                <h2 class="text-3xl font-bold mb-6 text-center">{{ t('bar.review.title') }}</h2>
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
                      <p class="text-blue-300 text-sm">{{ t('bar.review.fullName') }}</p>
                      <p class="font-medium">{{ barangayForm.firstName }} {{ barangayForm.middleName }} {{ barangayForm.lastName }} {{ barangayForm.suffix }}</p>
                    </div>
                    <div>
                      <p class="text-blue-300 text-sm">{{ t('bar.review.birthDate') }}</p>
                      <p class="font-medium">{{ barangayForm.birthDate || '—' }}</p>
                    </div>
                    <div>
                      <p class="text-blue-300 text-sm">{{ t('bar.review.sex') }}</p>
                      <p class="font-medium">{{ barangayForm.gender || '—' }}</p>
                    </div>
                    <div>
                      <p class="text-blue-300 text-sm">{{ t('bar.review.civilStatus') }}</p>
                      <p class="font-medium">{{ barangayForm.civilStatus || '—' }}</p>
                    </div>
                    <div>
                      <p class="text-blue-300 text-sm">{{ t('bar.review.bloodType') }}</p>
                      <p class="font-medium">{{ barangayForm.bloodType || t('bar.form.bloodUnknown') }}</p>
                    </div>
                    <div>
                      <p class="text-blue-300 text-sm">{{ t('bar.review.occupation') }}</p>
                      <p class="font-medium">{{ barangayForm.occupation || '—' }}</p>
                    </div>
                    <div>
                      <p class="text-blue-300 text-sm">{{ t('bar.review.contact') }}</p>
                      <p class="font-medium">{{ barangayForm.contactNumber || '—' }}</p>
                    </div>
                    <div>
                      <p class="text-blue-300 text-sm">{{ t('bar.review.email') }}</p>
                      <p class="font-medium break-all">{{ barangayForm.email || '—' }}</p>
                    </div>
                    <div class="col-span-2">
                      <p class="text-blue-300 text-sm">{{ t('bar.review.emergency') }}</p>
                      <p class="font-medium">{{ barangayForm.emergencyContactName || '—' }} — {{ barangayForm.emergencyContactNumber || '—' }}</p>
                    </div>
                    @if (capturedSignature()) {
                      <div class="col-span-2">
                        <p class="text-blue-300 text-sm mb-1">{{ t('bar.review.signature') }}</p>
                        <img [src]="capturedSignature()" class="h-16 bg-white rounded-lg" />
                      </div>
                    }
                  </div>
                </div>
                <div class="flex gap-4 mt-6">
                  <app-button variant="secondary" size="lg" class="flex-1" (onClick)="goBack()">{{ t('common.back') }}</app-button>
                  <app-button variant="primary" size="lg" class="flex-1" (onClick)="submitBarangay()" [loading]="submitting()">{{ t('bar.review.submit') }}</app-button>
                </div>
                <div class="mt-4">
                  <app-button variant="success" size="lg" class="w-full" (onClick)="previewBarangayId()" [loading]="previewing()">
                    {{ t('bar.review.preview') }}
                  </app-button>
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
                <h2 class="text-3xl font-bold mb-4">{{ t('bar.success.title') }}</h2>
                <p class="text-xl text-blue-200 mb-2">{{ t('bar.success.desc') }}</p>
                <p class="text-xl text-blue-200 mb-2">{{ t('bar.success.number') }}</p>
                <p class="text-4xl font-bold text-yellow-300 mb-6">{{ requestNumber() }}</p>
                <p class="text-blue-200 mb-8">{{ t('bar.success.review') }}</p>
                <app-button variant="primary" size="lg" (onClick)="finish()">{{ t('common.done') }}</app-button>
              </div>
            </div>
          }
        }

        <app-barangay-preview-modal [open]="showPreview()" [title]="t('bar.preview.title')" [blob]="previewBlob()" (onClose)="closePreview()" />
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
  rfidDetected = signal(false);

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
  guestSubmitted = signal(false);
  submitting = signal(false);
  previewing = signal(false);
  showPreview = signal(false);
  previewBlob = signal<Blob | null>(null);
  searchResults = signal<any[]>([]);
  searching = signal(false);
  searchQuery = '';

  // Language and date/time for welcome screen
  language = signal<KioskLanguage>('en');
  currentDateTime = signal<Date>(new Date());

  t(key: string, params?: Record<string, string | number>): string {
    return this.translations.translate(key, params);
  }

  setLanguage(lang: KioskLanguage) {
    this.language.set(lang);
    this.translations.setLanguage(lang);
    this.saveState();
  }

  formatFooterDate(): string {
    return this.currentDateTime().toLocaleDateString(this.language() === 'fil' ? 'fil-PH' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatFooterTime(): string {
    return this.currentDateTime().toLocaleTimeString(this.language() === 'fil' ? 'fil-PH' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  // Dynamic form state
  formValues = signal<Record<string, unknown>>({});
  formErrors = signal<Record<string, string>>({});

  // Stable idempotency key for ONE submission attempt. Reused across retries so a
  // network error + retry never creates a duplicate request; cleared after success
  // or when the flow resets, so a fresh submission gets a new key.
  submissionKey = '';

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
  private stateSaveDebounce: any = null;

  constructor(
    private kioskService: KioskService,
    public identificationService: IdentificationService,
    private rfidScanService: RfidScanService,
    private kioskStateService: KioskStateService,
    private translations: TranslationService,
    private cdr: ChangeDetectorRef
  ) {}

  private dateTimeTimer: any;

  ngOnInit() {
    this.restoreState();
    this.resetIdleTimer();
    this.rfidScanSub = this.rfidScanService.scans().subscribe(event => this.handleRfidScan(event.uid));
    this.rfidConnectionSub = this.rfidScanService.connection().subscribe(connected => {
      this.rfidConnected.set(connected);
    });
    // Preload the Barangay ID service requirements for the application flow
    this.loadBarangayService();
    // Start date/time clock for welcome screen
    this.dateTimeTimer = setInterval(() => this.currentDateTime.set(new Date()), 1000);
  }

  private restoreState(): void {
    const savedState = this.kioskStateService.load();
    if (!savedState) return;

    this.mode.set(savedState.mode);
    this.rfidStep.set(savedState.rfidStep);
    this.currentStep.set(savedState.currentStep);
    this.barangayStep.set(savedState.barangayStep);
    this.resident.set(savedState.resident);
    this.selectedService.set(savedState.selectedService);
    this.barangayService.set(savedState.barangayService);
    this.capturedPhoto.set(savedState.capturedPhoto);
    this.capturedSignature.set(savedState.capturedSignature);
    this.requestNumber.set(savedState.requestNumber);
    this.formValues.set(savedState.formValues);
    this.inlinePhotos.set(savedState.inlinePhotos);
    this.activePhotoField.set(savedState.activePhotoField);
    this.guestForm = savedState.guestForm;
    this.barangayForm = savedState.barangayForm;
    this.submissionKey = savedState.submissionKey;

    // Restore language preference and sync the TranslationService
    if (savedState.language) {
      this.language.set(savedState.language);
      this.translations.setLanguage(savedState.language);
    }

    // Reconnect RFID if we were in RFID mode
    if (savedState.mode === 'rfid' && savedState.rfidStep === 'scan') {
      this.rfidScanService.connect();
    }

    // Restart camera if we were in a photo step
    if ((savedState.mode === 'documents' && savedState.currentStep === 'photo') ||
        (savedState.mode === 'barangay' && savedState.barangayStep === 'photo')) {
      setTimeout(() => this.startCamera(), 100);
    }
  }

  private saveState(): void {
    if (this.stateSaveDebounce) clearTimeout(this.stateSaveDebounce);
    this.stateSaveDebounce = setTimeout(() => {
      const state: KioskState = {
        mode: this.mode(),
        rfidStep: this.rfidStep(),
        currentStep: this.currentStep(),
        barangayStep: this.barangayStep(),
        resident: this.resident(),
        selectedService: this.selectedService(),
        barangayService: this.barangayService(),
        capturedPhoto: this.capturedPhoto(),
        capturedSignature: this.capturedSignature(),
        requestNumber: this.requestNumber(),
        formValues: this.formValues(),
        inlinePhotos: this.inlinePhotos(),
        activePhotoField: this.activePhotoField(),
        guestForm: this.guestForm,
        barangayForm: this.barangayForm,
        submissionKey: this.submissionKey,
        language: this.language(),
        timestamp: Date.now()
      };
      this.kioskStateService.save(state);
    }, 100);
  }

  ngOnDestroy() {
    this.stopCamera();
    this.rfidScanService.disconnect();
    if (this.rfidScanSub) this.rfidScanSub.unsubscribe();
    if (this.rfidConnectionSub) this.rfidConnectionSub.unsubscribe();
    clearTimeout(this.idleTimer);
    clearTimeout(this.searchDebounce);
    clearTimeout(this.stateSaveDebounce);
    clearInterval(this.dateTimeTimer);
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
    this.saveState();
  }

  retryRfid() {
    this.rfidError.set('');
    this.rfidStep.set('scan');
    this.rfidScanService.connect();
    this.resetIdleTimer();
    this.saveState();
  }

  continueWithout() {
    this.stopCamera();
    this.errorMessage.set('');
    this.rfidScanService.disconnect();
    this.mode.set('guest');
    this.resetIdleTimer();
    this.saveState();
  }

  startGuestRequest() {
    this.stopCamera();
    this.errorMessage.set('');
    this.formError.set('');
    this.guestForm = { fullName: '', birthDate: '', address: '', contactNumber: '', email: '' };
    this.mode.set('documents');
    this.currentStep.set('guest-info');
    this.resetIdleTimer();
    this.saveState();
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
    this.saveState();
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
    this.rfidDetected.set(true);
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
          this.saveState();
        } else {
          this.rfidDetected.set(false);
          this.rfidError.set(this.t('err.rfid.notRecognized'));
          this.rfidStep.set('error');
          this.resetIdleTimer();
          this.saveState();
        }
      },
      error: () => {
        this.rfidDetected.set(false);
        this.rfidError.set(this.t('err.rfid.readFailed'));
        this.rfidStep.set('error');
        this.resetIdleTimer();
        this.saveState();
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
        this.saveState();
      },
      error: () => {
        this.errorMessage.set(this.t('err.loadResident'));
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
    this.saveState();
  }

  selectService(service: Service) {
    this.selectedService.set(service);
    this.formValues.set({});
    this.formErrors.set({});
    this.inlinePhotos.set({});
    this.activePhotoField.set(null);
    this.currentStep.set('requirements');
    this.resetIdleTimer();
    this.saveState();
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
    this.saveState();
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
    this.saveState();
  }

  private validateField(field: FormField, value: unknown): string | null {
    const empty = this.isEmptyValue(value);
    if (empty) {
      if (field.required) return this.t('err.required', { field: field.label });
      return null;
    }

    const v = field.validation;
    if (!v) return null;

    if (typeof value === 'string' && !value.startsWith('data:')) {
      const str = value.trim();
      if (v.minLength && str.length < v.minLength) {
        return this.t('err.minLength', { field: field.label, min: v.minLength });
      }
      if (v.maxLength && str.length > v.maxLength) {
        return this.t('err.maxLength', { field: field.label, max: v.maxLength });
      }
      if (v.pattern && !new RegExp(v.pattern).test(str)) {
        return v.patternMessage || this.t('err.invalidFormat', { field: field.label });
      }
    }

    if (field.type === 'number' && typeof value === 'number') {
      if (v.min !== undefined && value < v.min) return this.t('err.minValue', { field: field.label, min: v.min });
      if (v.max !== undefined && value > v.max) return this.t('err.maxValue', { field: field.label, max: v.max });
    }

    return null;
  }

  // Guest temporary session form validation
  validateGuestForm() {
    this.guestSubmitted.set(true);
    this.formError.set('');
    const g = this.guestForm;
    if (!g.fullName.trim()) {
      return;
    }
    if (!g.birthDate) {
      return;
    }
    if (!g.address.trim()) {
      return;
    }
    if (!g.contactNumber.trim()) {
      return;
    }
    this.errorMessage.set('');
    this.loadServices();
    this.currentStep.set('services');
    this.resetIdleTimer();
    this.saveState();
  }

  guestInvalid(key: string): boolean {
    if (!this.guestSubmitted()) return false;
    const g = this.guestForm;
    switch (key) {
      case 'fullName':
        return !g.fullName.trim();
      case 'birthDate':
        return !g.birthDate;
      case 'address':
        return !g.address.trim();
      case 'contactNumber':
        return !g.contactNumber.trim();
      default:
        return false;
    }
  }

  // ============================================================
  // BARANGAY ID FLOW
  // ============================================================

  proceedToBarangayForm() {
    this.barangayStep.set('form');
    this.resetIdleTimer();
    this.saveState();
  }

  validateBarangayForm() {
    this.formError.set('');
    const f = this.barangayForm;
    if (!f.firstName.trim()) {
      this.formError.set(this.t('err.bar.firstName'));
      return;
    }
    if (!f.lastName.trim()) {
      this.formError.set(this.t('err.bar.lastName'));
      return;
    }
    if (!f.birthDate) {
      this.formError.set(this.t('err.bar.birthDate'));
      return;
    }
    if (!f.gender) {
      this.formError.set(this.t('err.bar.sex'));
      return;
    }
    if (!f.civilStatus) {
      this.formError.set(this.t('err.bar.civilStatus'));
      return;
    }
    if (!f.addressLine.trim()) {
      this.formError.set(this.t('err.bar.address'));
      return;
    }
    if (!f.contactNumber.trim()) {
      this.formError.set(this.t('err.bar.contact'));
      return;
    }
    if (!f.emergencyContactName.trim()) {
      this.formError.set(this.t('err.bar.emergencyName'));
      return;
    }
    if (!f.emergencyContactNumber.trim()) {
      this.formError.set(this.t('err.bar.emergencyNumber'));
      return;
    }
    this.errorMessage.set('');
    this.barangayStep.set('photo');
    this.resetIdleTimer();
    setTimeout(() => this.startCamera(), 100);
    this.saveState();
  }

  confirmBarangayPhoto() {
    this.barangayStep.set('signature');
    this.resetIdleTimer();
    this.saveState();
  }

  onSignatureCaptured(dataUrl: string) {
    this.capturedSignature.set(dataUrl);
    this.barangayStep.set('review');
    this.resetIdleTimer();
    this.saveState();
  }

  submitBarangay() {
    if (this.submitting()) return; // re-entry guard: never double-submit
    if (!this.capturedPhoto()) {
      this.errorMessage.set(this.t('err.photoRequired'));
      this.barangayStep.set('photo');
      return;
    }
    if (!this.capturedSignature()) {
      this.errorMessage.set(this.t('err.signatureRequired'));
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
        this.saveState();
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = err?.error?.message || 'Failed to submit application. Please try again.';
        this.errorMessage.set(msg);
        console.error('Barangay ID submit error:', err);
        this.saveState();
      }
    });
  }

  // Live preview: render the barangay's official ID card template with the kiosk's
  // in-progress form data (no application is created) and show it in the modal.
  previewBarangayId() {
    if (this.previewing()) return;
    this.previewing.set(true);
    this.previewBlob.set(null);

    this.kioskService.previewBarangayId({
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
      signature: this.capturedSignature() || undefined
    }).subscribe({
      next: (blob) => {
        this.previewing.set(false);
        this.previewBlob.set(blob);
        this.showPreview.set(true);
      },
      error: (err: any) => {
        this.previewing.set(false);
        const fallback = this.t('bar.preview.error');
        if (err?.error instanceof Blob) {
          err.error.text().then((text: string) => {
            let msg = fallback;
            try {
              const parsed = JSON.parse(text);
              msg = parsed?.message || fallback;
            } catch { /* ignore non-JSON error bodies */ }
            this.errorMessage.set(msg);
          });
        } else {
          this.errorMessage.set(err?.error?.message || fallback);
        }
        console.error('Barangay ID preview error:', err);
      }
    });
  }

  closePreview() {
    this.showPreview.set(false);
    this.previewBlob.set(null);
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
        this.errorMessage.set(this.t('err.cameraDenied'));
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
    this.saveState();
  }

  skipPhoto() {
    this.stopCamera();
    this.capturedPhoto.set(null);
    this.currentStep.set('review');
    this.resetIdleTimer();
    this.saveState();
  }

  confirmPhoto() {
    this.currentStep.set('review');
    this.resetIdleTimer();
    this.saveState();
  }

  retakePhoto() {
    this.capturedPhoto.set(null);
    setTimeout(() => this.startCamera(), 100);
    this.saveState();
  }

  // ============================================================
  // DISPLAY HELPERS (resident or guest)
  // ============================================================

  isGuestSession(): boolean {
    return this.mode() === 'documents' && this.currentStep() !== 'welcome' && !this.resident();
  }

  displayName(): string {
    if (this.resident()) return `${this.resident()!.first_name} ${this.resident()!.last_name}`;
    return this.guestForm.fullName || this.t('placeholder.guest');
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
        this.saveState();
        return;
      }
      if (this.rfidStep() === 'error') {
        this.rfidStep.set('scan');
        this.saveState();
        return;
      }
      // From scan back to Home
      this.rfidScanService.disconnect();
      this.mode.set('home');
      this.saveState();
      return;
    }

    if (this.mode() === 'guest') {
      this.mode.set('home');
      this.saveState();
      return;
    }

    if (this.mode() === 'documents') {
      const step = this.currentStep();
      if (step === 'welcome') {
        this.resident.set(null);
        this.mode.set('rfid');
        this.rfidStep.set('scan');
        this.rfidScanService.connect();
        this.saveState();
        return;
      }
      if (step === 'guest-info') {
        this.mode.set('guest');
        this.saveState();
        return;
      }
      if (step === 'review') {
        if (this.selectedService()?.requires_photo) {
          this.currentStep.set('photo');
          setTimeout(() => this.startCamera(), 100);
        } else {
          this.currentStep.set('form');
        }
        this.saveState();
        return;
      }
      if (step === 'form') {
        this.stopCamera();
        this.currentStep.set('requirements');
        this.saveState();
        return;
      }
      if (step === 'requirements') {
        this.currentStep.set('services');
        this.saveState();
        return;
      }
      const steps: DocStep[] = ['welcome', 'guest-info', 'services', 'requirements', 'form', 'photo', 'review', 'success'];
      const idx = steps.indexOf(step);
      if (idx > 0) {
        if (step === 'photo') this.stopCamera();
        this.currentStep.set(steps[idx - 1]);
        this.saveState();
      }
      return;
    }

    if (this.mode() === 'barangay') {
      const step = this.barangayStep();
      if (step === 'requirements') {
        this.mode.set('guest');
        this.saveState();
        return;
      }
      if (step === 'review') {
        this.barangayStep.set('signature');
        this.saveState();
        return;
      }
      if (step === 'signature') {
        this.barangayStep.set('photo');
        this.capturedPhoto.set(null);
        setTimeout(() => this.startCamera(), 100);
        this.saveState();
        return;
      }
      const bSteps: BarangayStep[] = ['requirements', 'form', 'photo', 'signature', 'review', 'success'];
      const idx = bSteps.indexOf(step);
      if (idx > 0) {
        this.barangayStep.set(bSteps[idx - 1]);
        this.saveState();
      }
    }
  }

  submitRequest() {
    if (this.submitting()) return; // re-entry guard: never double-submit
    const service = this.selectedService();
    if (!service) {
      this.errorMessage.set(this.t('err.missingService'));
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');
    if (!this.submissionKey) this.submissionKey = this.newIdempotencyKey();

    const resident = this.resident();
    const data: any = {
      service_id: service.service_id,
      photo: this.capturedPhoto() || undefined,
      form_data: this.formValues(),
      idempotency_key: this.submissionKey
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
        // Same key means only one request row exists (server is idempotent).
        this.requestNumber.set(result?.data?.request_number || 'N/A');
        this.currentStep.set('success');
        this.submitting.set(false);
        this.submissionKey = ''; // done: next request is a fresh submission
        this.saveState();
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = err?.error?.message || 'Failed to submit request. Please try again.';
        this.errorMessage.set(msg);
        console.error('Submit request error:', err);
        this.saveState();
      }
    });
  }

  private newIdempotencyKey(): string {
    const c = (globalThis as any).crypto;
    if (c && typeof c.randomUUID === 'function') return c.randomUUID();
    return 'k-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
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
    this.submissionKey = '';
    this.kioskStateService.clear();
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
